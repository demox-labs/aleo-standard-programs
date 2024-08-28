import * as Aleo from '@demox-labs/aleo-sdk';

import {
  getHeight,
  getMappingValue,
  getProgram,
  getPublicBalance,
  getPublicTransactionsForProgram,
  isTransactionAccepted,
} from '../aleo/client';
import { resolveImports } from '../aleo/deploy';
import { submitTransaction } from '../aleo/execute';
import {
  pondoDependencyTree,
  pondoProgramToCode,
  pondoPrograms,
} from '../compiledPrograms';
import {
  CREDITS_PROGRAM,
  EPOCH_BLOCKS,
  NETWORK,
  ORACLE_UPDATE_BLOCKS,
  PRIVATE_KEY,
  REBALANCE_BLOCKS,
  VERSION,
  ZERO_ADDRESS,
} from '../constants';
import { handleDelegatorUpdate } from './delegators';
import {
  EPOCH_PERIOD,
  PONDO_DELEGATOR_STATE,
  PONDO_DELEGATOR_STATE_TO_VALUE,
} from './types';
import { updateReferenceDelegatorsIfNecessary } from './referenceDelegators';
import { delay, formatAleoString } from '../util';
import { ExecuteTransaction } from '../aleo/types';

const PONDO_ORACLE_PROGRAM = pondoPrograms.find((program) =>
  program.includes('pondo_oracle')
);
const CORE_PROTOCOL_PROGRAM = pondoPrograms.find((program) =>
  program.includes('pondo_core_protocol')
);
const CORE_PROTOCOL_PROGRAM_CODE = pondoProgramToCode[CORE_PROTOCOL_PROGRAM!];
const MIN_LIQUIDITY_PERCENT = BigInt('250');
const MAX_LIQUIDITY = BigInt('250000000000');
const PRECISION_UNSIGNED = BigInt('10000');

const getEpochPeriod = async (blockHeight: number): Promise<EPOCH_PERIOD> => {
  const epochBlock = blockHeight % EPOCH_BLOCKS;
  if (epochBlock < REBALANCE_BLOCKS) {
    return 'rebalance';
  } else if (epochBlock < ORACLE_UPDATE_BLOCKS) {
    return 'earn';
  } else {
    return 'updateOracle';
  }
};

export const getPondoDelegatorStates = async (): Promise<string[]> => {
  let states: string[] = [];
  let printStates: object[] = [];
  for (let index = 1; index < 6; index++) {
    const pondoDelegatorState = (await getMappingValue(
      '0u8',
      `pondo_delegator${index}${VERSION}.aleo`,
      'state_mapping'
    )) as PONDO_DELEGATOR_STATE;
    printStates.push({ delegator: index, state: PONDO_DELEGATOR_STATE_TO_VALUE[pondoDelegatorState] });
    states.push(pondoDelegatorState);
  }
  console.table(printStates);
  return states;
};

export const determineRebalanceAmounts = async (): Promise<bigint[]> => {
  // Constants
  const delegatorAllocation: bigint[] = [
    BigInt(3700),
    BigInt(2600),
    BigInt(1600),
    BigInt(1200),
    BigInt(900),
  ];
  const PRECISION_UNSIGNED = BigInt(10_000);

  // Calculate total credits from the delegator allocation
  let programAddress = Aleo.Program.fromString(
    NETWORK,
    CORE_PROTOCOL_PROGRAM_CODE
  ).toAddress();
  console.log(`Program address: ${programAddress}`);
  let totalCredits = await getPublicBalance(programAddress);
  console.log(`Total credits: ${totalCredits}`);

  // Get the balance reserved for withdrawals
  const reservedForWithdrawalsString = await getMappingValue(
    '2u8',
    CORE_PROTOCOL_PROGRAM,
    'balances'
  );
  const reservedForWithdrawals = BigInt(
    reservedForWithdrawalsString.slice(0, -3)
  );
  console.log(`Reserved for withdrawals: ${reservedForWithdrawals}`);

  // Calculate the total account balance minus the reserved amount
  totalCredits -= reservedForWithdrawals;

  let liquidityPool = (totalCredits * MIN_LIQUIDITY_PERCENT) / BigInt(10250);
  if (liquidityPool > MAX_LIQUIDITY) {
    liquidityPool = MAX_LIQUIDITY;
  }
  totalCredits -= liquidityPool;

  console.log(
    `Liquidty pool: ${liquidityPool}, new total credits: ${totalCredits}`
  );

  // Derive individual transfer amounts based on their portions
  let transferAmounts: bigint[] = delegatorAllocation.map((portion) => {
    const microcredits = (portion * totalCredits) / PRECISION_UNSIGNED;
    console.log(
      'portion: ',
      (PRECISION_UNSIGNED * microcredits) / totalCredits
    );
    return microcredits;
  });

  console.log(`Transfer amounts: ${transferAmounts}`);

  return transferAmounts;
};

const prepRebalance = async (pondoDelegatorStates: string[]): Promise<void> => {
  console.log('Starting prep rebalance');

  const lastRebalanceBlock = await getMappingValue(
    '0u8',
    CORE_PROTOCOL_PROGRAM,
    'last_rebalance_epoch'
  );
  const lastRebalanceEpoch = BigInt(lastRebalanceBlock.slice(0, -3));
  const currentEpoch = BigInt(await getHeight()) / BigInt(EPOCH_BLOCKS);
  console.log(
    `Last rebalance epoch: ${lastRebalanceEpoch}, current epoch: ${currentEpoch}`
  );
  if (lastRebalanceEpoch >= currentEpoch) {
    console.log(`Already rebalanced in this epoch: ${currentEpoch}, skipping`);
    return;
  }

  const protocolState = await getMappingValue(
    '0u8',
    CORE_PROTOCOL_PROGRAM,
    'protocol_state'
  );
  if (protocolState !== '0u8') {
    console.log(
      `Protocol state is not in normal state, skipping prep_rebalance`
    );
    return;
  }

  const allTerminalOrBonded = pondoDelegatorStates.every(
    (state) =>  state === '0u8' || state === '1u8' || state === '4u8'
  );

  if (allTerminalOrBonded) {
    console.log(
      'All pondo delegators are in bond_allowed or unbond_not_allowed or terminal state, ready to prep_rebalance'
    );

    const programCode = pondoProgramToCode[CORE_PROTOCOL_PROGRAM!];
    // Resolve imports
    const imports = pondoDependencyTree[CORE_PROTOCOL_PROGRAM];
    let resolvedImports = await resolveImports(imports);
    await submitTransaction(
      NETWORK,
      PRIVATE_KEY,
      programCode,
      'prep_rebalance',
      [],
      2, // TODO: set the correct fee
      undefined,
      resolvedImports
    );
    console.log('prep_rebalance transaction submitted');
  }
};

const getTopValidators = async (): Promise<string> => {
  let topValidators = await getMappingValue(
    '1u8',
    CORE_PROTOCOL_PROGRAM,
    'validator_set'
  );
  return topValidators;
};

const rebalanceRetrieveCredits = async (): Promise<void> => {
  console.log('Rebalancing and retrieving credits');
  let delegatorBalances = [];
  for (let index = 1; index < 6; index++) {
    const delegatorProgramId = `pondo_delegator${index}${VERSION}.aleo`;
    const delegatorProgram = await getProgram(delegatorProgramId);
    const delegatorProgramAddress = Aleo.Program.fromString(
      NETWORK!,
      delegatorProgram
    ).toAddress();
    const delegatorBalance = await getPublicBalance(delegatorProgramAddress);
    delegatorBalances.push(delegatorBalance);
  }
  const owedCommission = await getMappingValue(
    '0u8',
    CORE_PROTOCOL_PROGRAM,
    'owed_commission'
  );
  const inputs = [
    `[${delegatorBalances.map((balance) => `${balance}u64`).join(',')}]`,
    owedCommission,
  ];
  const programCode = pondoProgramToCode[CORE_PROTOCOL_PROGRAM!];
  // Resolve imports
  const imports = pondoDependencyTree[CORE_PROTOCOL_PROGRAM];
  let resolvedImports = await resolveImports(imports);
  const txResult = await submitTransaction(
    NETWORK,
    PRIVATE_KEY,
    programCode,
    'rebalance_retrieve_credits',
    inputs,
    2.5, // TODO: set the correct fee
    undefined,
    resolvedImports
  );

  // Wait for the transaction to be accepted
  const isAccepted = await isTransactionAccepted(txResult);

  // If accepted, immediately try to rebalance_redistribute
  if (isAccepted) {
    await rebalanceRedistribute();
  }
};

/// Call rebalance_redistribute on the core protocol program if all pondo delegators are in terminal state
const rebalanceRedistribute = async (): Promise<void> => {
  // Ensure next validator set is set
  const nextValidatorSet = await getMappingValue(
    '1u8',
    CORE_PROTOCOL_PROGRAM,
    'validator_set'
  );
  if (!nextValidatorSet) {
    console.log('Next validator set not set, skipping rebalance_redistribute');
    return;
  }

  console.log(
    'All pondo delegators are in terminal state, ready to rebalance_redistribute'
  );
  // Get the top validators
  const topValidators = await getTopValidators();
  // Get the rebalance amounts
  const rebalanceAmounts = await determineRebalanceAmounts();
  // Format the inputs
  // TODO: the commissions should come from on chain
  const inputs = [
    `${topValidators}`,
    `[${rebalanceAmounts.map((amount) => `${amount}u64`).join(',')}]`,
  ];
  console.log(`Inputs: ${inputs}`);

  // Get the program code
  const programCode = pondoProgramToCode[CORE_PROTOCOL_PROGRAM!];
  // Resolve imports
  const imports = pondoDependencyTree[CORE_PROTOCOL_PROGRAM];
  let resolvedImports = await resolveImports(imports);
  await submitTransaction(
    NETWORK,
    PRIVATE_KEY,
    programCode,
    'rebalance_redistribute',
    inputs,
    2.5, // TODO: set the correct fee
    undefined,
    resolvedImports
  );
  console.log('rebalance_redistribute transaction submitted');
};

const setOracleTVL = async (): Promise<void> => {
  const coreProtocolAddress = Aleo.Program.fromString(NETWORK!, CORE_PROTOCOL_PROGRAM_CODE).toAddress();
  const protocolBalance = await getPublicBalance(coreProtocolAddress);
  let pondoDelegatorTVLs = [];
  for (let index = 1; index < 6; index++) {
    const delegatorProgramId = `pondo_delegator${index}${VERSION}.aleo`;
    const delegatorProgram = await getProgram(delegatorProgramId);
    const delegatorProgramAddress = Aleo.Program.fromString(NETWORK!, delegatorProgram).toAddress();
    const delegatorBalance = await getPublicBalance(delegatorProgramAddress);
    const bondedState = await getMappingValue(delegatorProgramAddress, CREDITS_PROGRAM, 'bonded');
    let delegatorBondedBalance: bigint = 0n;
    if (bondedState) {
      delegatorBondedBalance = BigInt(JSON.parse(formatAleoString(bondedState))["microcredits"].slice(0, -3));
    }
    const unbondingState = await getMappingValue(delegatorProgramAddress, CREDITS_PROGRAM, 'unbonding');
    let delegatorUnbondingBalance: bigint = 0n;
    if (unbondingState) {
      delegatorUnbondingBalance = BigInt(JSON.parse(formatAleoString(unbondingState))["microcredits"].slice(0, -3));
    }
    const delegatorTVL = delegatorBalance + delegatorBondedBalance + delegatorUnbondingBalance;
    console.log(`Delegator ${index}, address ${delegatorProgramAddress} tvl: ${delegatorTVL}, balance: ${delegatorBalance}, bonded: ${delegatorBondedBalance}, unbonding: ${delegatorUnbondingBalance}`);
    pondoDelegatorTVLs.push(delegatorTVL);
  }
  const totalTVL = pondoDelegatorTVLs.reduce((acc, tvl) => acc + tvl, protocolBalance);
  console.log(`Total tvl: ${totalTVL} Pondo core tvl: ${protocolBalance}, delegator TVLs: ${pondoDelegatorTVLs}`);

  const previousTVLUpdates: ExecuteTransaction[] = await getPublicTransactionsForProgram(CORE_PROTOCOL_PROGRAM, 'set_oracle_tvl');
  if (previousTVLUpdates.length === 0) {
    console.log('No previous TVL updates, submitting new TVL update');
    const imports = pondoDependencyTree[CORE_PROTOCOL_PROGRAM];
    const resolvedImports = await resolveImports(imports);
    const inputs = [`${totalTVL}u64`];
    const transactionResult = await submitTransaction(
      NETWORK!,
      PRIVATE_KEY!,
      CORE_PROTOCOL_PROGRAM_CODE,
      'set_oracle_tvl',
      inputs,
      10, // TODO: set the correct fee
      undefined,
      resolvedImports
    );
    const wasAccepted = await isTransactionAccepted(transactionResult);
    if (!wasAccepted) {
      console.error('set_oracle_vtl transaction was not accepted');
    } else {
      console.log('set_oracle_tvl transaction was accepted');
    }
  } else {
    const lastUpdateTVL = BigInt(previousTVLUpdates[previousTVLUpdates.length - 1].transaction.execution.transitions[0].inputs[0].value.slice(0, -3));
    // If the TVL has changed by more than 50%, update the oracle TVL
    const tvlChange = Math.abs(Number(totalTVL - lastUpdateTVL) / Number(lastUpdateTVL));
    if (tvlChange > 0.50) {
      console.log('TVL has changed by more than 50%, updating oracle TVL');
      const imports = pondoDependencyTree[CORE_PROTOCOL_PROGRAM];
      const resolvedImports = await resolveImports(imports);
      const inputs = [`${totalTVL}u64`];
      const transactionResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        CORE_PROTOCOL_PROGRAM_CODE,
        'set_oracle_tvl',
        inputs,
        10, // TODO: set the correct fee
        undefined,
        resolvedImports
      );
      const wasAccepted = await isTransactionAccepted(transactionResult);
      if (!wasAccepted) {
        console.error('set_oracle_vtl transaction was not accepted');
      } else {
        console.log('set_oracle_tvl transaction was accepted');
      }
    } else {
      console.log('TVL has not changed by more than 50%, skipping');
    }
  }
}

const continueRebalanceIfNeccessary = async (
  pondoDelegatorStates: string[]
): Promise<void> => {
  const allTerminal = pondoDelegatorStates.every((state) => state === '4u8');
  if (allTerminal) {
    const protocolState = await getMappingValue(
      '0u8',
      CORE_PROTOCOL_PROGRAM,
      'protocol_state'
    );
    if (protocolState === '1u8') {
      await rebalanceRetrieveCredits();
    } else if (protocolState === '2u8') {
      await rebalanceRedistribute();
    }
  }
};

export const runProtocol = async (): Promise<void> => {
  const blockHeight = await getHeight();
  const epochPeriod = await getEpochPeriod(blockHeight);
  console.log("\x1b[36m%s\x1b[0m", `Block height: ${blockHeight}, Epoch period: ${epochPeriod}`);

  const pondoDelegatorStates = await getPondoDelegatorStates();
  if (epochPeriod === 'rebalance') {
    await prepRebalance(pondoDelegatorStates);
  } else if (epochPeriod == 'updateOracle') {
    // Update the reference delegators if necessary
    await updateReferenceDelegatorsIfNecessary(blockHeight);
  } else {
    // Set the oracle TVL if it's changed by more than 50%
    await setOracleTVL();
  }

  // Can be run in any epoch period
  await continueRebalanceIfNeccessary(pondoDelegatorStates);

  // Handle updating all of the delegators
  const updatePromises = [];
  for (let index = 1; index < 6; index++) {
    const pondoDelegatorState = pondoDelegatorStates[index - 1] as PONDO_DELEGATOR_STATE;
    const updatePromise = handleDelegatorUpdate(`pondo_delegator${index}${VERSION}.aleo`, pondoDelegatorState);
    updatePromises.push(updatePromise);
  }
  await Promise.all(updatePromises);
};

export const runOracleProtocol = async (): Promise<void> => {
  const blockHeight = await getHeight();
  const epochPeriod = await getEpochPeriod(blockHeight);
  console.log(`Block height: ${blockHeight}, Epoch period: ${epochPeriod}`);

  if (epochPeriod == 'updateOracle') {
    await updateReferenceDelegatorsIfNecessary(blockHeight);
  }
}
