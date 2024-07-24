import { deployAllProgramsIfNecessary } from "./aleo/deploy";
import { NETWORK, ORACLE_PRIVATE_KEY, PRIVATE_KEY } from "./constants";
import { initializeProgramsIfNecessary } from "./protocol/initializePrograms";
import { approveReferenceDelegatorsIfNecessary, deployReferenceDelegatorsIfNecessary } from "./protocol/referenceDelegators";
import { runProtocol } from "./protocol/runProtocol";
import { delay } from "./util";

async function main() {
  // Deploy all programs if necessary
  await deployAllProgramsIfNecessary(NETWORK, PRIVATE_KEY);
  // Initialize all programs if necessary
  await initializeProgramsIfNecessary();
  // Deploy reference delegators if necessary
  await deployReferenceDelegatorsIfNecessary();

  console.log("All programs have been deployed and initialized");

  while (true) {
    try {
      if (ORACLE_PRIVATE_KEY) {
        // Approve reference delegators if necessary
        await approveReferenceDelegatorsIfNecessary()
      }
      // Run the protocol
      await runProtocol();

      // Sleep for 15 seconds
      await delay(15_000);
    } catch (error) {
      console.error(error);

      // Sleep for 5 seconds
      await delay(30_000);
    }
  }
}

main();