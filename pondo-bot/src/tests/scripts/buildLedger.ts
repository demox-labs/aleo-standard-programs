import { promisify } from "util";
import { getChainHeight } from "../../aleo/client";
import { delay } from "../../util";
import { createLedger, TestUserState, TestUserStates, UserAction, UserActions, ValidatorActions } from "../../utils/ledgerCreator";
import { clearLedger } from "../../utils/ledgerManager";
import { exec } from "child_process";
import { getWithdrawTestUserActions } from "./ledgerActions";
import { killAuthorizePool } from "../../aleo/execute";

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

async function buildLedger() {
  await startDevNet();
  await waitUntilRPCReady();
  const userActions = getWithdrawTestUserActions();
  const testUserStates = await createLedger(userActions, [], 350, false);
  console.log(testUserStates);
  testUserStates.forEach((state: TestUserState, user: string) => {
    console.log(`User: ${user}`);
    console.log(`PrivateKey: ${state.privateKey}`);
    console.log(`Microcredits: ${state.microcredits}`);
    console.log(`Deposits:`);
    state.deposits.forEach((deposit) => {
      console.log(`  ${deposit.micropaleo} at block ${deposit.blockHeight}`);
    });
    console.log(`Withdraws:`);
    state.withdraws.forEach((withdraw) => {
      console.log(`  ${withdraw.micropaleo} at block ${withdraw.blockHeight}`);
    });
    console.log('-------------------');
  });
  console.log("const userTestStates: TestUserStates = new Map();");

  testUserStates.forEach((state: TestUserState, user: string) => {
    console.log(`const userTestState: TestUserState = {`);
    console.log(`  privateKey: '${state.privateKey}',`);
    console.log(`  microcredits: BigInt('${state.microcredits}'),`);
    
    console.log(`  deposits: [`);
    state.deposits.forEach((deposit, index) => {
      const comma = index < state.deposits.length - 1 ? "," : "";
      console.log(`    { micropaleo: BigInt('${deposit.micropaleo}'), blockHeight: ${deposit.blockHeight} }${comma}`);
    });
    console.log(`  ],`);
    
    console.log(`  withdraws: [`);
    state.withdraws.forEach((withdraw, index) => {
      const comma = index < state.withdraws.length - 1 ? "," : "";
      console.log(`    { micropaleo: BigInt('${withdraw.micropaleo}'), blockHeight: ${withdraw.blockHeight} }${comma}`);
    });
    console.log(`  ]`);
    
    console.log(`};`);
    console.log(`userTestStates.set('${user}', userTestState);`);
    console.log("");
  });
  await killAuthorizePool();

  await stopDevNet();
}

buildLedger();