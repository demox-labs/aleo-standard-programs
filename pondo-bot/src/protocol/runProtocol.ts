import * as Aleo from '@demox-labs/aleo-sdk';

import { getHeight, getMappingValue, getProgram, getPublicBalance } from '../aleo/client';
import { resolveImports } from '../aleo/deploy';
import { submitTransaction } from '../aleo/execute';
import { pondoDependencyTree, pondoProgramToCode, pondoPrograms } from '../compiledPrograms';
import { EPOCH_BLOCKS, NETWORK, ORACLE_UPDATE_BLOCKS, PRIVATE_KEY, REBALANCE_BLOCKS, ZERO_ADDRESS } from '../constants';
import { handleDelegatorUpdate } from './delegators';
import { EPOCH_PERIOD, PONDO_DELEGATOR_STATE, PONDO_DELEGATOR_STATE_TO_VALUE } from './types';
import { updateReferenceDelegatorsIfNecessary } from './referenceDelegators';

const PONDO_ORACLE_PROGRAM = pondoPrograms.find(program => program.includes('pondo_oracle'));
const CORE_PROTOCOL_PROGRAM = pondoPrograms.find(program => program.includes('pondo_core_protocol'));
const CORE_PROTOCOL_PROGRAM_CODE = pondoProgramToCode[CORE_PROTOCOL_PROGRAM!];
const MIN_LIQUIDITY_PERCENT = BigInt("250");
const MAX_LIQUIDITY = BigInt("250000000000");
const PRECISION_UNSIGNED = BigInt("10000");

const getEpochPeriod = async (blockHeight: number): Promise<EPOCH_PERIOD> => {
  const epochBlock = blockHeight % EPOCH_BLOCKS;
  if (epochBlock < REBALANCE_BLOCKS) {
    return 'rebalance';
  } else if (epochBlock < ORACLE_UPDATE_BLOCKS) {
    return 'earn';
  } else {
    return 'updateOracle';
  }
}

const getPondoDelegatorStates = async (): Promise<string[]> => {
  let states: string[] = [];
  for (let index = 1; index < 6; index++) {
    const pondoDelegatorState = await getMappingValue('0u8', `pondo_delegator${index}.aleo`, 'state_mapping') as PONDO_DELEGATOR_STATE;
    console.log(`Pondo delegator ${index} state: ${PONDO_DELEGATOR_STATE_TO_VALUE[pondoDelegatorState]}`);
    states.push(pondoDelegatorState);
  }
  return states;
}

const determineRebalanceAmounts = async (): Promise<bigint[]> => {
  // Constants
  const delegatorAllocation: bigint[] = [BigInt(3700), BigInt(2600), BigInt(1600), BigInt(1200), BigInt(900)];
  const PRECISION_UNSIGNED = BigInt(10_000);

  // Calculate total credits from the delegator allocation
  let programAddress = Aleo.Program.fromString(NETWORK, CORE_PROTOCOL_PROGRAM_CODE).toAddress();
  console.log(`Program address: ${programAddress}`);
  let totalCredits = await getPublicBalance(programAddress);
  console.log(`Total credits: ${totalCredits}`);

  // Get the balance reserved for withdrawals
  const reservedForWithdrawalsString = await getMappingValue('2u8', CORE_PROTOCOL_PROGRAM, 'balances');
  const reservedForWithdrawals = BigInt(reservedForWithdrawalsString.slice(0, -3));
  console.log(`Reserved for withdrawals: ${reservedForWithdrawals}`);

  // Calculate the total account balance minus the reserved amount
  totalCredits -= reservedForWithdrawals;

  let liquidityPool = totalCredits * MIN_LIQUIDITY_PERCENT / BigInt(10250);
  if (liquidityPool > MAX_LIQUIDITY) {
    liquidityPool = MAX_LIQUIDITY;
  }
  totalCredits -= liquidityPool;

  console.log(`Liquidty pool: ${liquidityPool}, new total credits: ${totalCredits}`);
  
  // Derive individual transfer amounts based on their portions
  let transferAmounts: bigint[] = delegatorAllocation.map(portion => {
    const microcredits = portion * totalCredits / PRECISION_UNSIGNED;
    console.log('portion: ', PRECISION_UNSIGNED * microcredits / totalCredits);
    return microcredits;
  });

  console.log(`Transfer amounts: ${transferAmounts}`);

  return transferAmounts;
}

const prepRebalance = async (): Promise<void> => {
  console.log('Starting prep rebalance');

  const lastRebalanceBlock = await getMappingValue('0u8', CORE_PROTOCOL_PROGRAM, 'last_rebalance_epoch');
  const lastRebalanceEpoch = BigInt(lastRebalanceBlock.slice(0, -3)) / BigInt(EPOCH_BLOCKS);
  const currentEpoch = BigInt(await getHeight()) / BigInt(EPOCH_BLOCKS);
  console.log(`Last rebalance epoch: ${lastRebalanceEpoch}, current epoch: ${currentEpoch}`);
  if (lastRebalanceEpoch >= currentEpoch) {
    console.log(`Already rebalanced in this epoch: ${currentEpoch}, skipping`);
    return;
  }

  const pondoDelegatorStates = await getPondoDelegatorStates();
  const allTerminalOrBonded = pondoDelegatorStates.every(state => state === '1u8' || state === '4u8');

  if (allTerminalOrBonded) {
    console.log('All pondo delegators are in unbond_not_Allowed or terminal state, ready to prep_rebalance');


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
}

const getTopValidators = async (): Promise<string> => {
  let topValidators = await getMappingValue('1u8', CORE_PROTOCOL_PROGRAM, 'validator_set');
  return topValidators;
}

const rebalanceRetrieveCredits = async (): Promise<void> => {
  console.log('Rebalancing and retrieving credits');
  let delegatorBalances = [];
  for (let index = 1; index < 6; index++) {
    const delegatorProgramId = `pondo_delegator${index}.aleo`;
    const delegatorProgram = await getProgram(delegatorProgramId);
    const delegatorProgramAddress = Aleo.Program.fromString(NETWORK!, delegatorProgram).toAddress();
    const delegatorBalance = await getPublicBalance(delegatorProgramAddress);
    delegatorBalances.push(delegatorBalance);
  }
  const owedCommission = await getMappingValue('0u8', CORE_PROTOCOL_PROGRAM, 'owed_commission');
  const inputs = [
    `[${delegatorBalances.map(balance => `${balance}u64`).join(',')}]`,
    owedCommission
  ];
  const programCode = pondoProgramToCode[CORE_PROTOCOL_PROGRAM!];
  // Resolve imports
  const imports = pondoDependencyTree[CORE_PROTOCOL_PROGRAM];
  let resolvedImports = await resolveImports(imports);
  await submitTransaction(
    NETWORK,
    PRIVATE_KEY,
    programCode,
    'rebalance_retrieve_credits',
    inputs,
    2, // TODO: set the correct fee
    undefined,
    resolvedImports
  );
}

/// Call rebalance_redistribute on the core protocol program if all pondo delegators are in terminal state
const rebalanceRedistribute = async (): Promise<void> => {
  // Ensure next validator set is set
  const nextValidatorSet = await getMappingValue('1u8', CORE_PROTOCOL_PROGRAM, 'validator_set');
  if (!nextValidatorSet) {
    console.log('Next validator set not set, skipping rebalance_redistribute');
    return;
  }

  console.log('All pondo delegators are in terminal state, ready to rebalance_redistribute');
  // Get the top validators
  const topValidators = await getTopValidators();
  // Get the rebalance amounts
  const rebalanceAmounts = await determineRebalanceAmounts();
  // Format the inputs
  // TODO: the commissions should come from on chain
  const inputs = [
    `${topValidators}`,
    `[${rebalanceAmounts.map(amount => `${amount}u64`).join(',')}]`
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
    2, // TODO: set the correct fee
    undefined,
    resolvedImports
  );
  console.log('rebalance_redistribute transaction submitted');
}

const continueRebalanceIfNeccessary = async (pondoDelegatorStates: string[]): Promise<void> => {
  const allTerminal = pondoDelegatorStates.every(state => state === '4u8');
  if (allTerminal) {
    const protocolState = await getMappingValue('0u8', CORE_PROTOCOL_PROGRAM, 'protocol_state');
    if (protocolState === '1u8') {
      await rebalanceRetrieveCredits();
    } else if (protocolState === '2u8') {
      await rebalanceRedistribute();
    }
  }
}

export const runProtocol = async (): Promise<void> => {
  const blockHeight = await getHeight();
  const epochPeriod = await getEpochPeriod(blockHeight);
  console.log(`Block height: ${blockHeight}, Epoch period: ${epochPeriod}`);
  const pondoDelegatorStates = await getPondoDelegatorStates();

  if (epochPeriod === 'rebalance') {
    await prepRebalance();
  } else if (epochPeriod == 'updateOracle') {
    await updateReferenceDelegatorsIfNecessary();
  }

  // Can be run in any epoch period
  await continueRebalanceIfNeccessary(pondoDelegatorStates);

  // Handle updating all of the delegators
  for (let index = 1; index < 6; index++) {
    const pondoDelegatorState = pondoDelegatorStates[index - 1] as PONDO_DELEGATOR_STATE;
    await handleDelegatorUpdate(`pondo_delegator${index}.aleo`, pondoDelegatorState);
  }
}