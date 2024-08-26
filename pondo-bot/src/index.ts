import { getMTSPBalance, isTransactionAccepted } from './aleo/client';
import { deployAllProgramsIfNecessary } from './aleo/deploy';
import {
  NETWORK,
  ORACLE_ONLY,
  MULTI_SIG_PRIVATE_KEY_0,
  MULTI_SIG_PRIVATE_KEY_1,
  MULTI_SIG_PRIVATE_KEY_2,
  PRIVATE_KEY,
  TEST,
  RPC_URL,
  BOT_DELAY,
  PALEO_TOKEN_ID
} from './constants';
import { initializeProgramsIfNecessary } from './protocol/initializePrograms';
import {
  approveReferenceDelegatorsIfNecessary,
  deployReferenceDelegatorsIfNecessary,
} from './protocol/referenceDelegators';
import { runOracleProtocol, runProtocol } from './protocol/runProtocol';
import { depositAsSigner } from './protocol/userActions';
import { distributeDeposits } from './protocol/validatorActions';
import { fundTestAccountsIfNecessary, runTests } from './tests/runTests';
import { delay } from './util';

async function main() {
  // Log start up information
  console.log(`Starting Pondo bot with RPC URL: ${RPC_URL} on network: ${NETWORK}`);
  // Deploy all programs if necessary
  await deployAllProgramsIfNecessary(NETWORK, PRIVATE_KEY);
  // Initialize all programs if necessary
  await initializeProgramsIfNecessary();
  // Deploy reference delegators if necessary
  // await deployReferenceDelegatorsIfNecessary();

  console.log('****************** All programs have been deployed and initialized ******************');

  if (TEST) {
    await fundTestAccountsIfNecessary();
  }

  while (true) {
    try {
      // if (MULTI_SIG_PRIVATE_KEY_0 && MULTI_SIG_PRIVATE_KEY_1 && MULTI_SIG_PRIVATE_KEY_2) {
      //   // Approve reference delegators if necessary
      //   await approveReferenceDelegatorsIfNecessary();
      // }
      // Run the protocol
      if (ORACLE_ONLY) {
        await runOracleProtocol();
      } else {
        await runProtocol();
      }

      if (TEST) {
        // deposit sum of 125_000_000_000 microcredits
        const balance = await getMTSPBalance("aleo12ux3gdauck0v60westgcpqj7v8rrcr3v346e4jtq04q7kkt22czsh808v2", PALEO_TOKEN_ID);
        console.log(`Balance: ${balance}`);
        if (balance < BigInt(125_000_000_000)) {
        // console.log('depositing into the protocol');
        // const depositTx = await depositAsSigner(BigInt(125_000_000_000), PRIVATE_KEY);
        //   const isComplete = await isTransactionAccepted(depositTx);
        }
        // await runTests();s
        // await distributeDeposits();
      }

      await delay(BOT_DELAY);
    } catch (error) {
      console.error(error);

      await delay(BOT_DELAY);
    }
  }
}

main();
