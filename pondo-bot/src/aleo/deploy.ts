import * as crypto from 'crypto';
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
  MANUAL_DEPLOY,
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

export const ensureValidProgramDeployment = async (programId: string, programCode: string, retries=15, delayTime=3_000): Promise<void> => {
  let foundProgram = await getProgram(programId);
  if (!foundProgram) {
    if (retries === 0) {
      console.error(`Program ${programId} not found after deployment`);
      process.exit(1);
    }
    console.log(`Awaiting deployment: ${programId}`);
    await delay(delayTime);
    return ensureValidProgramDeployment(programId, programCode, retries-1, delayTime);
  } else {
    // Strip all newlines and whitespace from programCode && foundProgram
    programCode = programCode.replace(/\s/g, '');
    foundProgram = foundProgram.replace(/\s/g, '');

    // // Checksum the programCode and foundProgram
    // const expectedChecksum = crypto.createHash('md5').update(programCode).digest("hex");
    // const actualChecksum = crypto.createHash('md5').update(foundProgram).digest("hex");

    // if (expectedChecksum !== actualChecksum) {
    //   console.error(`Checksum mismatch for program ${programId}`);
    //   console.error(`Expected: ${expectedChecksum}`);
    //   console.error(`Actual: ${actualChecksum}`);
    //   process.exit(1);
    // } else {
    //   console.log(`Program ${programId} deployed successfully: ${expectedChecksum}`);
    // }
  }
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

  if (program.indexOf('token_registry') !== -1) {
    fee = 75.798350; // At time of writing, the fee for deploying the multi-token support program is 75798350 microcredits
  } else if (program.indexOf('wrapped_credits') !== -1) {
    fee = 15.630250; // At time of writing, the fee for deploying the mtsp credits program is 15630250 microcredits
  } else if (program.indexOf('validator_oracle') !== -1) {
    fee = 97.375450; // At time of writing, the fee for deploying the pondo oracle program is 97375450 microcredits
  } else if (program.indexOf('paleo_token') !== -1) {
    fee = 3.822825; // At time of writing, the fee for deploying the pondo token program is 3822825 microcredits
  } else if (program.indexOf('pondo_protocol_token') !== -1) {
    fee = 8.766525; // At time of writing, the fee for deploying the pondo token program is 8766525 microcredits
  } else if (program.indexOf('reference_delegator') !== -1) {
    fee = 1; // At time of writing, the fee for deploying a reference delegator program is 7872425 microcredits
  } else if (program.indexOf('delegator') !== -1) {
    fee = 17.780250; // At time of writing, the fee for deploying the pondo delegator program is 17780250 microcredits
  } else if (program.indexOf('pondo_protocol') !== -1) {
    fee = 61.892425; // At time of writing, the fee for deploying the pondo vault program is 61892425 microcredits
  } else if (program.indexOf('grant_disbursement') !== -1) {
    fee = 1;
  } else if (program.indexOf('test_program') !== -1) {
    fee = 1; // At time of writing, the fee for deploying the test program is 19054425 microcredits
  }

  return fee;
};

const confirmManualDeployment = async (programId: string): Promise<void> => {
  console.log(`Do you want to continue with the ${programId} deployment? (y/n)`);

  const userInput = await new Promise<string>((resolve) => {
      process.stdin.once('data', (data) => {
          resolve(data.toString().trim());
      });
  });

  if (userInput.toLowerCase() === 'y') {
      console.log("Continuing with deployment...");
      return;
  } else {
      console.log("Exiting process...");
      process.exit(0);
  }
}

export const deployAllProgramsIfNecessary = async (
  network: string,
  privateKey: string
): Promise<any> => {
  // For each of the pondo programs, deploy them if they haven't been deployed yet
  for (const program of pondoPrograms) {
    // Skip every program but the oracle program if ORACLE_ONLY is set to true
    if (ORACLE_ONLY && !program.includes('validator_oracle')) {
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

      if (MANUAL_DEPLOY) {
        // Logs the entire programCode and then awaits the user to hit enter before deploying
        console.log(programCode);
        await confirmManualDeployment(program);
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
      await delay(45_000);

      // Ensure the program was deployed successfully by checking the checksum
      if (program.indexOf('pondo_protocol') == -1) {
        await ensureValidProgramDeployment(program, programCode);
      }
    } else {
      console.log(`Program ${program} already exists`);
    }
  }
};
