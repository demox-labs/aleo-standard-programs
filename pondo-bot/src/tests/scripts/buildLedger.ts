import { promisify } from "util";
import { getChainHeight } from "../../aleo/client";
import { delay } from "../../util";
import { createLedger, TestUserState, TestUserStates, UserAction, UserActions, ValidatorActions } from "../../utils/ledgerCreator";
import { clearLedger } from "../../utils/ledgerManager";
import { exec } from "child_process";

const execPromise = promisify(exec);

async function waitUntilRPCReady() {
  const startTime = Date.now();
  try {
    let preloadedRPCBlockHeight = await getChainHeight();
    console.log('preloaded blockheight: ' + preloadedRPCBlockHeight);
    let newRPCBlockHeight = 0;
    while (newRPCBlockHeight <= preloadedRPCBlockHeight) {
      await delay(5000);
      newRPCBlockHeight = await getChainHeight();
      const waitTime = Date.now() - startTime;
      console.log(`waiting ${waitTime} ms for chain to advance...`);
    }
  } catch (err) {
    console.error(`Error waiting for rpc: ${err}`);
  }
}

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

const user1 = 'aleo15sqqdq6tnt96krc9zlfpaxg33xs0nxmkwpn5lzjnug6z6r68uqps0qcvey';
const userAction1: UserAction = {
    privateKey: 'APrivateKey1zkpAoWnzpRMuuSjfiC4MncBPULhG17PCbmdGwLNR3QFCAQK',
    microcredits: BigInt(150_000_000_000),
    deposits: [ { microcredits: BigInt(125_000_000_000), blockHeight: 270 } ],
    withdraws: []
  };



const validatorActions: ValidatorActions = [ { action: 'distributeDeposits', blockHeight: 285 } ];
const userActions: UserActions = new Map();
userActions.set(user1, userAction1);


async function buildLedger() {
  await startDevNet();
  await waitUntilRPCReady();
  const testUserStates = await createLedger(userActions, validatorActions, 300, false);
  console.log(testUserStates);
  await stopDevNet();
}

buildLedger();