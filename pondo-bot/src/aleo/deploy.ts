import { spawn, Pool, Worker, FunctionThread, ModuleThread } from 'threads';
import path from 'path';

import { AuthorizeTransaction } from '../workers/authorizeTransaction';
import { pondoDependencyTree, pondoProgramToCode, pondoPrograms } from '../compiledPrograms';
import { delegateDeployTransaction, delegateDeployment, getProgram, pollDelegatedDeployment, pollDelegatedTransaction } from './client';
import { delay } from '../util';
import { DEFAULT_VALIDATOR_ADDRESS, EPOCH_BLOCKS, EPOCH_BLOCKS_DEFAULT, ORACLE_UPDATE_BLOCKS, ORACLE_UPDATE_BLOCKS_DEFAULT, REBALANCE_BLOCKS, REBALANCE_BLOCKS_DEFAULT } from '../constants';

type AuthorizePool = Pool<
  FunctionThread<[network: string,
    privateKey: string,
    deployment: string,
    feeCredits: number,
    feeRecord?: string
  ]>>;

const poolSize = Math.max(1, Math.floor(require('os').cpus().length / 2));
let pool: AuthorizePool;

const updateEpoch = (programCode: string): string => {
  let updatedProgramCode = programCode.replace(/(\d)_(\d)/g, '$1$2');
  // If the default epoch blocks are used, replace all instances
  // of the default value in the program code with the new value
  if (EPOCH_BLOCKS !== EPOCH_BLOCKS_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(EPOCH_BLOCKS_DEFAULT.toString(), EPOCH_BLOCKS.toString());
  }
  if (ORACLE_UPDATE_BLOCKS !== ORACLE_UPDATE_BLOCKS_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(ORACLE_UPDATE_BLOCKS_DEFAULT.toString(), ORACLE_UPDATE_BLOCKS.toString());
  }
  if (REBALANCE_BLOCKS !== REBALANCE_BLOCKS_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(REBALANCE_BLOCKS_DEFAULT.toString(), REBALANCE_BLOCKS.toString());
  }

  if (DEFAULT_VALIDATOR_ADDRESS) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      'aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0',
      DEFAULT_VALIDATOR_ADDRESS
    );
  }
  return updatedProgramCode;
}

export const authorizeDeployment = async (
  network: string,
  privateKey: string,
  deployment: string,
  feeCredits: number,
  feeRecord?: string
): Promise<any> => {
  if (!pool) {
    // TODO: temp solution to force the correct path
    let workerPath = '../../../../../../../../../../../../' + path.resolve(__dirname, 'authorizeDeployment.js');
    const workerSpawn = () => spawn<AuthorizeTransaction>(new Worker(workerPath));
    // const workerSpawn = () => spawn<AuthorizeTransactionWorker>(new Worker('./authorizeTransaction.js'));
    pool = Pool(workerSpawn, poolSize);
  }

  const result = await pool.queue(
    async authorizeDeployment => {
      return await authorizeDeployment(network, privateKey, deployment, feeCredits, feeRecord)
    }
  );

  return result;
};

export const deployProgram = async (
  network: string,
  privateKey: string,
  program: string,
  imports: { [key: string]: string },
  feeCredits: number,
  feeRecord?: string
): Promise<any> => {
  const deploymentRequestId = await delegateDeployment(program, imports);
  console.log('Deployment Request ID:', deploymentRequestId);
  const deployment = await pollDelegatedDeployment(deploymentRequestId);
  // Authorize the transaction
  const authorization = await authorizeDeployment(network, privateKey, deployment.deployment, feeCredits, feeRecord);
  const requestId = await delegateDeployTransaction(authorization.deployment, authorization.owner, authorization.feeAuthorization, true);
  console.log('Request ID:', requestId);

  return await pollDelegatedTransaction(requestId);
}

export const resolveImports = async (imports: string[]) => {
  const resolvedImports: { [key: string]: string } = {};
  for (let i = 0; i < imports.length; i++) {
    const importName = imports[i];
    resolvedImports[importName] = await getProgram(importName);
  }
  return resolvedImports;
}

export const deploymentCost = (program: string) => {
  let fee = 1;

  if (program.indexOf('multi_token_support') !== -1) {
    fee = 75; // At time of writing, the fee for deploying the multi-token support program is 69632150 microcredits
  } else if (program.indexOf('pondo_oracle') !== -1) {
    fee = 98; // At time of writing, the fee for deploying the pondo oracle program is 97606700 microcredits
  } else if (program.indexOf('pondo_staked_aleo_token') !== -1) {
    fee = 8; // At time of writing, the fee for deploying the pondo token program is 7779900 microcredits
  } else if (program.indexOf('pondo_token') !== -1) {
    fee = 8; // At time of writing, the fee for deploying the pondo token program is 7190475 microcredits
  } else if (program.indexOf('pondo_delegator') !== -1) {
    fee = 21; // At time of writing, the fee for deploying the pondo vault program is 20008475 microcredits
  } else if (program.indexOf('pondo_core_protocol') !== -1) {
    fee = 55; // At time of writing, the fee for deploying the pondo vault program is 50593425 microcredits
  } else if (program.indexOf('reference_delegator') !== -1) {
    fee = 8; // At time of writing, the fee for deploying the pondo vault program is 7761100 microcredits
  }

  return fee;
}

export const deployAllProgramsIfNecessary = async (
  network: string,
  privateKey: string
): Promise<any> => {
  // For each of the pondo programs, deploy them if they haven't been deployed yet
  for (const program of pondoPrograms) {
    // Skip the reference delegator program, this needs to be customized for each deployment
    if (program.indexOf('reference_delegator') !== -1) {
      continue;
    }
    const programExists = await getProgram(program);
    if (!programExists) {
      console.log(`Deploying program: ${program}`);

      let programCode = pondoProgramToCode[program];
      // Update the epoch blocks
      programCode = updateEpoch(programCode);

      // Resolve imports
      const imports = pondoDependencyTree[program];
      let resolvedImports = {};
      if (imports) {
        resolvedImports = await resolveImports(imports);
      }
      // Deploy the program
      console.log(`Deploying program ${program}`);
      let fee = deploymentCost(program);
      await deployProgram(network, privateKey, programCode, resolvedImports, fee);

      // Wait for a bit before deploying the next program
      await delay(15_000);
    } else {
      console.log(`Program ${program} already exists`);
    }
  }
}