import { spawn, Pool, Worker, FunctionThread, ModuleThread } from 'threads';
import path from 'path';

import { AuthorizeTransaction } from '../workers/authorizeTransaction';
import {
  pondoDependencyTree,
  pondoProgramToCode,
  pondoPrograms,
} from '../compiledPrograms';
import {
  delegateDeployTransaction,
  delegateDeployment,
  getProgram,
  pollDelegatedDeployment,
  pollDelegatedTransaction,
} from './client';
import { delay } from '../util';
import {
  DEFAULT_VALIDATOR_ADDRESS,
  EPOCH_BLOCKS,
  EPOCH_BLOCKS_DEFAULT,
  ORACLE_UPDATE_BLOCKS,
  ORACLE_UPDATE_BLOCKS_DEFAULT,
  REBALANCE_BLOCKS,
  REBALANCE_BLOCKS_DEFAULT,
  PONDO_COMMISSION,
  PONDO_COMMISSION_DEFAULT,
  WITHDRAW_WAIT_MINIMUM,
  WITHDRAW_WAIT_MINIMUM_DEFAULT,
  PONDO_WITHDRAW_FEE,
  PONDO_WITHDRAW_FEE_DEFAULT,
  MAX_GUARANTEED_LIQUIDITY,
  MAX_GUARANTEED_LIQUIDITY_DEFAULT,
  MIN_LIQUIDITY_PERCENT,
  MIN_LIQUIDITY_PERCENT_DEFAULT,
  PALEO_TOKEN_ID_DEFAULT,
  PALEO_TOKEN_ID,
  PONDO_TOKEN_ID_DEFAULT,
  PONDO_TOKEN_ID,
  DEFAULT_PONDO_FOUNDATION_ADDRESS,
  PONDO_FOUNDATION_ADDRESS,
  ORACLE_ONLY,
  MULTI_SIG_ADDRESS_0,
  MULTI_SIG_ADDRESS_1,
  MULTI_SIG_ADDRESS_2,
  MULTI_SIG_ADDRESS_3,
  MULTI_SIG_ADDRESS_4,
} from '../constants';

type AuthorizePool = Pool<
  FunctionThread<
    [
      network: string,
      privateKey: string,
      deployment: string,
      feeCredits: number,
      feeRecord?: string
    ]
  >
>;

// const poolSize = Math.max(1, Math.floor(require('os').cpus().length / 2));
const poolSize = 1;
let pool: AuthorizePool;

const updateDefaultValuesWithEnvVariables = (programCode: string): string => {
  let updatedProgramCode = programCode.replace(/(\d)_(\d)/g, '$1$2');
  // If the default epoch blocks are used, replace all instances
  // of the default value in the program code with the new value
  if (EPOCH_BLOCKS !== EPOCH_BLOCKS_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      EPOCH_BLOCKS_DEFAULT.toString(),
      EPOCH_BLOCKS.toString()
    );
  }
  if (ORACLE_UPDATE_BLOCKS !== ORACLE_UPDATE_BLOCKS_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      ORACLE_UPDATE_BLOCKS_DEFAULT.toString(),
      ORACLE_UPDATE_BLOCKS.toString()
    );
  }
  if (REBALANCE_BLOCKS !== REBALANCE_BLOCKS_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      REBALANCE_BLOCKS_DEFAULT.toString(),
      REBALANCE_BLOCKS.toString()
    );
  }
  if (PALEO_TOKEN_ID !== PALEO_TOKEN_ID_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      PALEO_TOKEN_ID_DEFAULT,
      PALEO_TOKEN_ID
    );
  }
  if (PONDO_TOKEN_ID !== PONDO_TOKEN_ID_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      PONDO_TOKEN_ID_DEFAULT,
      PONDO_TOKEN_ID
    );
  }
  if (DEFAULT_PONDO_FOUNDATION_ADDRESS !== PONDO_FOUNDATION_ADDRESS) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      DEFAULT_PONDO_FOUNDATION_ADDRESS,
      PONDO_FOUNDATION_ADDRESS
    );
  }

  if (MULTI_SIG_ADDRESS_0 && MULTI_SIG_ADDRESS_1 && MULTI_SIG_ADDRESS_2 && MULTI_SIG_ADDRESS_3 && MULTI_SIG_ADDRESS_4) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      'aleo12shtwnmf49t5atmad2jnk3e58ahtp749d9trctt9z3wryxyzt5pspp0nd0',
      MULTI_SIG_ADDRESS_0
    );
    updatedProgramCode = updatedProgramCode.replaceAll(
      'aleo1z9y9afh0h6dnyj3f0hvjc4mhayjy06fj42ppcq0rvpmmyky6fuzs449sjr',
      MULTI_SIG_ADDRESS_1
    );
    updatedProgramCode = updatedProgramCode.replaceAll(
      'aleo19x0ctad8llm9y0qssw7eup045c5wxxp6k4al3n0d5r8maulkzu8sh3jwew',
      MULTI_SIG_ADDRESS_2
    );
    updatedProgramCode = updatedProgramCode.replaceAll(
      'aleo16ycrg9g4208lp5y4g5s3gn43xknc5gdsr7wjrpqq9htznj5qk5yqd6px5a',
      MULTI_SIG_ADDRESS_3
    );
    updatedProgramCode = updatedProgramCode.replaceAll(
      'aleo1q59hxe2zmexlu4vgtmtmvyxm4ew047zlf50h5l5zsrdvljusdvrqn78u7s',
      MULTI_SIG_ADDRESS_4
    );
  }


  if (DEFAULT_VALIDATOR_ADDRESS) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      'aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0',
      DEFAULT_VALIDATOR_ADDRESS
    );
  }

  if (PONDO_COMMISSION !== PONDO_COMMISSION_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      PONDO_COMMISSION_DEFAULT.toString(),
      PONDO_COMMISSION.toString()
    );
  }

  if (WITHDRAW_WAIT_MINIMUM !== WITHDRAW_WAIT_MINIMUM_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      WITHDRAW_WAIT_MINIMUM_DEFAULT.toString(),
      WITHDRAW_WAIT_MINIMUM.toString()
    );
  }

  if (PONDO_WITHDRAW_FEE !== PONDO_WITHDRAW_FEE_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      PONDO_WITHDRAW_FEE_DEFAULT.toString(),
      PONDO_WITHDRAW_FEE.toString()
    );
  }

  if (MAX_GUARANTEED_LIQUIDITY !== MAX_GUARANTEED_LIQUIDITY_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      MAX_GUARANTEED_LIQUIDITY_DEFAULT.toString(),
      MAX_GUARANTEED_LIQUIDITY.toString()
    );
  }

  if (MIN_LIQUIDITY_PERCENT !== MIN_LIQUIDITY_PERCENT_DEFAULT) {
    updatedProgramCode = updatedProgramCode.replaceAll(
      MIN_LIQUIDITY_PERCENT_DEFAULT.toString(),
      MIN_LIQUIDITY_PERCENT.toString()
    );
  }

  return updatedProgramCode;
};

export const authorizeDeployment = async (
  network: string,
  privateKey: string,
  deployment: string,
  feeCredits: number,
  feeRecord?: string
): Promise<any> => {
  if (!pool) {
    // TODO: temp solution to force the correct path
    let workerPath =
      '../../../../../../../../../../../../' +
      path.resolve(__dirname, 'authorizeDeployment.js');
    const workerSpawn = () =>
      spawn<AuthorizeTransaction>(new Worker(workerPath));
    // const workerSpawn = () => spawn<AuthorizeTransactionWorker>(new Worker('./authorizeTransaction.js'));
    pool = Pool(workerSpawn, poolSize);
  }

  const result = await pool.queue(async (authorizeDeployment) => {
    return await authorizeDeployment(
      network,
      privateKey,
      deployment,
      feeCredits,
      feeRecord
    );
  });

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
  const authorization = await authorizeDeployment(
    network,
    privateKey,
    deployment.deployment,
    feeCredits,
    feeRecord
  );
  const requestId = await delegateDeployTransaction(
    authorization.deployment,
    authorization.owner,
    authorization.feeAuthorization,
    true
  );
  console.log('Request ID:', requestId);

  return await pollDelegatedTransaction(requestId);
};

export const resolveImports = async (imports: string[]) => {
  const resolvedImports: { [key: string]: string } = {};
  for (let i = 0; i < imports.length; i++) {
    const importName = imports[i];
    resolvedImports[importName] = await getProgram(importName);
  }
  return resolvedImports;
};

export const deploymentCost = (program: string) => {
  let fee = 1;

  if (program.indexOf('multi_token_support') !== -1) {
    fee = 100; // At time of writing, the fee for deploying the multi-token support program is 87166375 microcredits
  } else if (program.indexOf('mtsp_credits') !== -1) {
    fee = 16; // At time of writing, the fee for deploying the mtsp credits program is 15804975 microcredits
  } else if (program.indexOf('pondo_oracle') !== -1) {
    fee = 110; // At time of writing, the fee for deploying the pondo oracle program is 97606700 microcredits
  } else if (program.indexOf('pondo_staked_aleo_token') !== -1) {
    fee = 10; // At time of writing, the fee for deploying the pondo token program is 7779900 microcredits
  } else if (program.indexOf('pondo_token') !== -1) {
    fee = 12; // At time of writing, the fee for deploying the pondo token program is 7190475 microcredits
  } else if (program.indexOf('pondo_delegator') !== -1) {
    fee = 21; // At time of writing, the fee for deploying the pondo delegator program is 20008475 microcredits
  } else if (program.indexOf('pondo_core_protocol') !== -1) {
    fee = 65; // At time of writing, the fee for deploying the pondo vault program is 61379725 microcredits
  } else if (program.indexOf('reference_delegator') !== -1) {
    fee = 8; // At time of writing, the fee for deploying a reference delegator program is 7761100 microcredits
  } else if (program.indexOf('test_program') !== -1) {
    fee = 20; // At time of writing, the fee for deploying the test program is 19054425 microcredits
  }

  return fee;
};

export const deployAllProgramsIfNecessary = async (
  network: string,
  privateKey: string
): Promise<any> => {
  // For each of the pondo programs, deploy them if they haven't been deployed yet
  for (const program of pondoPrograms) {
    // Skip every program but the oracle program if ORACLE_ONLY is set to true
    if (ORACLE_ONLY && !program.includes('pondo_oracle')) {
      continue;
    }
    // Skip the reference delegator program, this needs to be customized for each deployment
    // Skip the test program if we are not running tests
    if (
      program.indexOf('reference_delegator') !== -1 ||
      (program.indexOf('test_program') !== -1 &&
        process.env.DEPLOY_TEST_PROGRAM !== 'true')
    ) {
      continue;
    }
    const programExists = await getProgram(program);
    if (!programExists) {
      console.log(`Deploying program: ${program}`);

      let programCode = pondoProgramToCode[program];
      // Update the epoch blocks
      programCode = updateDefaultValuesWithEnvVariables(programCode);

      // Resolve imports
      const imports = pondoDependencyTree[program];
      let resolvedImports = {};
      if (imports) {
        resolvedImports = await resolveImports(imports);
      }
      // Deploy the program
      console.log(`Deploying program ${program}`);
      let fee = deploymentCost(program);
      await deployProgram(
        network,
        privateKey,
        programCode,
        resolvedImports,
        fee
      );

      // Wait for a bit before deploying the next program
      await delay(15_000);
    } else {
      console.log(`Program ${program} already exists`);
    }
  }
};
