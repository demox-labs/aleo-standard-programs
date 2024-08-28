import * as Aleo from '@demox-labs/aleo-sdk';
import { deployAllProgramsIfNecessary } from '../aleo/deploy';
import { BOT_DELAY, MULTI_SIG_PRIVATE_KEY_0, MULTI_SIG_PRIVATE_KEY_1, MULTI_SIG_PRIVATE_KEY_2, NETWORK, PALEO_TOKEN_ID, PRIVATE_KEY } from '../constants';
import { initializeProgramsIfNecessary } from '../protocol/initializePrograms';
import {
  approveReferenceDelegatorsIfNecessary,
  deployReferenceDelegatorsIfNecessary,
} from '../protocol/referenceDelegators';
import { runProtocol } from '../protocol/runProtocol';
import { airDropCredits, GeneratedTransactionResponse, getHeight, getMTSPBalance, getPublicBalance, isTransactionAccepted, transactionAcceptedBlockHeight } from '../aleo/client';
import { delay } from '../util';
import { distributeDeposits } from '../protocol/validatorActions';
import { batchedWithdraw, depositAsSigner } from '../protocol/userActions';

export type UserAction = {
  privateKey: string;
  microcredits: bigint;
  deposits: {
    microcredits: bigint;
    blockHeight: number;
  }[];
  withdraws: {
    micropaleo: bigint;
    blockHeight: number;
  }[];
};

export type TestUserState = {
  privateKey: string;
  microcredits: bigint;
  deposits: {
    micropaleo: bigint;
    blockHeight: number;
  }[];
  withdraws: {
    micropaleo: bigint;
    blockHeight: number;
  }[];
};

export type ValidatorActions = {
  action: 'distributeDeposits';
  blockHeight: number;
}[];

export type ProtocolState = 'prepRebalance' | 'normal' | 'rebalance';
export type TestUserStates = Map<string, TestUserState>;
export type UserActions = Map<string, UserAction>;
export type ProtocolMetadata = {
  protocolState: ProtocolState;
  protocolAccountBalance: bigint;
  protocolDelegatedBalance: bigint;
  protocolBondedWithdrawals: bigint;
  protocolClaimableWithdrawals: bigint;
  owedCommission: bigint;
};

export const runActions = async (userActions: UserActions, validatorActions: ValidatorActions, blockHeight: number): Promise<TestUserStates> => {
  let testUserStates: TestUserStates = new Map();

  for (const [testUser, state] of userActions) {
    console.log('Running actions for user: ' + testUser);

    const depositPromises = state.deposits
      .map(async (deposit) => {
        const currentPaleo = await getMTSPBalance(testUser, PALEO_TOKEN_ID, true);
        const txResponse = await depositAsSigner(deposit.microcredits, state.privateKey);
        const blockFinished = await transactionAcceptedBlockHeight(txResponse);
        if (blockFinished === -1) {
          throw new Error('Transaction failed: ' + txResponse.transaction.toString());
        }
        const newPaleo = await getMTSPBalance(testUser, PALEO_TOKEN_ID, true);
        const paleoDelta = newPaleo - currentPaleo;
        const microcredits = await getPublicBalance(testUser);
        const previousState = testUserStates.get(testUser);
        testUserStates.set(testUser, {
          privateKey: state.privateKey,
          microcredits,
          deposits: [{ micropaleo: paleoDelta, blockHeight: blockFinished }, ...(previousState?.deposits || [])],
          withdraws: [...(previousState?.withdraws || [])],
        });
      });

    const withdrawPromises = state.withdraws
      .map(async (withdraw) => {
        const currentPaleo = await getMTSPBalance(testUser, PALEO_TOKEN_ID, true);
        const txResponse = await batchedWithdraw(withdraw.micropaleo, state.privateKey);
        const blockFinished = await transactionAcceptedBlockHeight(txResponse);
        if (blockFinished === -1) {
          throw new Error('Transaction failed: ' + txResponse);
        }
        const newPaleo = await getMTSPBalance(testUser, PALEO_TOKEN_ID, true);
        const paleoDelta = newPaleo - currentPaleo;
        const microcredits = await getPublicBalance(testUser);
        const previousState = testUserStates.get(testUser);
        testUserStates.set(testUser, {
          privateKey: state.privateKey,
          microcredits,
          deposits: [...(previousState?.deposits || [])],
          withdraws: [{ micropaleo: paleoDelta, blockHeight: blockFinished }, ...(previousState?.withdraws || [])],
        });
      });

    await Promise.all([...depositPromises, ...withdrawPromises]);

    for (const validatorAction of validatorActions) {
      switch (validatorAction.action) {
        case 'distributeDeposits':
          await distributeDeposits();
          break;
      }
    }
  }

  console.log('****************** All actions have been run ******************');

  return testUserStates;
};



export const createLedger = async (
  userActions: UserActions,
  validatorActions: ValidatorActions,
  stopHeight: number,
  includeReferenceDelegators: boolean
): Promise<TestUserStates> => {
  await deployAllProgramsIfNecessary(NETWORK!, PRIVATE_KEY!);
  await initializeProgramsIfNecessary();
  if (includeReferenceDelegators) {
    await deployReferenceDelegatorsIfNecessary();
    if (MULTI_SIG_PRIVATE_KEY_0 && MULTI_SIG_PRIVATE_KEY_1 && MULTI_SIG_PRIVATE_KEY_2) {
        // Approve reference delegators if necessary
        await approveReferenceDelegatorsIfNecessary();
      }
  }
  console.log('****************** All programs have been deployed and initialized ******************');
  let airDropResponses: GeneratedTransactionResponse[] = [];
  for (const [testUser, state] of userActions) {
    if (state.microcredits > BigInt(0)) {
      airDropResponses.push(await airDropCredits(testUser, state.microcredits));
    }
  }
  let airDropsComplete: Promise<boolean>[] = [];
  for (const response of airDropResponses) {
    airDropsComplete.push(isTransactionAccepted(response));
  }
  const finishedAirdrops = await Promise.all(airDropsComplete);
  if (finishedAirdrops.includes(false)) {
    throw new Error('Airdrop failed');
  }
  console.log('****************** All test users have been airdropped credits ******************');
  let currentBlockHeight = await getHeight();

  let testUserStates: TestUserStates = new Map();
  while (currentBlockHeight < stopHeight || userActions.size > 0 || validatorActions.length > 0) {
    console.log(`Current block height: ${currentBlockHeight} && stop height: ${stopHeight}`);
    console.log(`User actions size: ${userActions.size} && validator actions length: ${validatorActions.length}`);
    let userActionsInBlock = new Map();
    for (const [testUser, state] of userActions) {
      let deposits = state.deposits.filter((deposit) => deposit.blockHeight <= currentBlockHeight);
      let withdraws = state.withdraws.filter((withdraw) => withdraw.blockHeight <= currentBlockHeight);
      userActionsInBlock.set(testUser, {
        privateKey: state.privateKey,
        microcredits: state.microcredits,
        deposits,
        withdraws
      });
    }
    for (const [testUser, state] of userActions) {
      let deposits = state.deposits.filter((deposit) => deposit.blockHeight > currentBlockHeight);
      let withdraws = state.withdraws.filter((withdraw) => withdraw.blockHeight > currentBlockHeight);
      if (deposits.length > 0 || withdraws.length > 0) {
        userActions.set(testUser, {
          privateKey: state.privateKey,
          microcredits: state.microcredits,
          deposits,
          withdraws
        });
      } else {
        userActions.delete(testUser);
      }
    }
    let validatorActionsInBlock = validatorActions.filter((action) => action.blockHeight <= currentBlockHeight);
    validatorActions = validatorActions.filter((action) => action.blockHeight > currentBlockHeight);
    const newTestUserStates = (await runActions(userActionsInBlock, validatorActionsInBlock, currentBlockHeight));
    for (const [testUser, state] of newTestUserStates) {
      const prevUserState = testUserStates.get(testUser);
      testUserStates.set(testUser, {
        privateKey: state.privateKey,
        microcredits: state.microcredits,
        deposits: [...(prevUserState?.deposits || []), ...state.deposits],
        withdraws: [ ...(prevUserState?.withdraws || []), ...state.withdraws]
      });
    }

    // Run the protocol
    await runProtocol();

    await delay(BOT_DELAY);
    currentBlockHeight = await getHeight();
  }

  return testUserStates;
};
