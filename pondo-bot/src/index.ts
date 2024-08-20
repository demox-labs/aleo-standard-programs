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
  BOT_DELAY
} from './constants';
import { initializeProgramsIfNecessary } from './protocol/initializePrograms';
import {
  approveReferenceDelegatorsIfNecessary,
  deployReferenceDelegatorsIfNecessary,
} from './protocol/referenceDelegators';
import { runOracleProtocol, runProtocol } from './protocol/runProtocol';
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
  await deployReferenceDelegatorsIfNecessary();

  console.log('All programs have been deployed and initialized');

  if (TEST) {
    await fundTestAccountsIfNecessary();
  }

  while (true) {
    try {
      if (MULTI_SIG_PRIVATE_KEY_0 && MULTI_SIG_PRIVATE_KEY_1 && MULTI_SIG_PRIVATE_KEY_2) {
        // Approve reference delegators if necessary
        await approveReferenceDelegatorsIfNecessary();
      }
      // Run the protocol
      if (ORACLE_ONLY) {
        await runOracleProtocol();
      } else {
        await runProtocol();
      }

      if (TEST) {
        await runTests();
      }

      await delay(BOT_DELAY);
    } catch (error) {
      console.error(error);

      await delay(BOT_DELAY);
    }
  }
}

main();
