import { clearLedger, loadLedger } from "../utils/ledgerManager";
import { exec } from "child_process";
import { promisify } from "util";
import { getChainHeight } from "../aleo/client";
import { delay } from "../util";

const execPromise = promisify(exec);

async function stopDevNet() {
  try {
    await execPromise("tmux kill-session -t devnet");
  } catch (err) {
    console.error(`Error stopping devnet:`, err);
    console.log("Kill devnet by running tmux kill-session -t devnet");
  }
}

async function startDevNet() {
  try {
    await execPromise("chmod +x ./src/tests/setupDevnet.sh");
    console.log("Starting devnet...");
    await execPromise(`./src/tests/setupDevnet.sh`);
  } catch (err) {
    console.error(`Error starting devnet:`, err);
  }
}

async function runTests(testName: string) {
  try {
    const { stdout } = await execPromise(
      `node --test ./dist/${testName}Test.js`
    );
    console.log(stdout);
  } catch (err) {
    console.error(`Error running tests:`, err);
  }
}

async function loadRpc(rpcBackupName: string) {
  const execPromise = promisify(exec);
  try {
    await execPromise(`yarn swapRpcDb ${rpcBackupName}`);
    console.log("RPC DB loaded successfully.");
  } catch (err) {
    console.error(`Error loading rpc: ${err}`);
  }
}

async function waitUntilRPCReady() {
  try {
    let preloadedRPCBlockHeight = await getChainHeight();
    console.log('preloaded blockheight: ' + preloadedRPCBlockHeight);
    let newRPCBlockHeight = 0;
    while (newRPCBlockHeight <= preloadedRPCBlockHeight) {
      await delay(2000);
      newRPCBlockHeight = await getChainHeight();
      console.log('waiting for new blockheight... ' + newRPCBlockHeight);
    }
  } catch (err) {
    console.error(`Error waiting for rpc: ${err}`);
  }
}

async function main() {
  const testName = process.argv[2];
  if (!testName) {
    console.error("Please provide a test name as an argument.");
    process.exit(1);
  }

  const testStateName = process.argv[3];
  if (!testStateName) {
    console.error(
      "Please provide the name of the test state to be used in the devnet and rpc."
    );
    process.exit(1);
  }

  await clearLedger();
  await loadLedger(testStateName);
  await loadRpc(testStateName);
  await startDevNet();
  await waitUntilRPCReady();
  await runTests(testName);
  await stopDevNet();
  await clearLedger();
}

main();
