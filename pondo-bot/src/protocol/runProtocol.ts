import * as Aleo from '@demox-labs/aleo-sdk';

import { getHeight, getMappingValue, getPublicBalance } from '../aleo/client';
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

const calculateOptimalLiquidity = (total_balance: bigint): bigint => {
  let min_liquidity: bigint =
    (total_balance * MIN_LIQUIDITY_PERCENT) / PRECISION_UNSIGNED;
  let optimal_liquidity: bigint =
    min_liquidity > MAX_LIQUIDITY ? MAX_LIQUIDITY : min_liquidity;
  return optimal_liquidity;
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

  const liquidityPool = calculateOptimalLiquidity(totalCredits); // Add 100 microcredits to the liquidity pool
  console.log(`Liquidity pool: ${liquidityPool}`);

  // Calculate the total credits after removing the liquidity pool
  totalCredits -= liquidityPool;

  // Get the balance reserved for withdrawals
  const reservedForWithdrawalsString = await getMappingValue('2u8', CORE_PROTOCOL_PROGRAM, 'balances');
  const reservedForWithdrawals = BigInt(reservedForWithdrawalsString.slice(0, -3));
  console.log(`Reserved for withdrawals: ${reservedForWithdrawals}`);

  // Calculate the total account balance
  totalCredits -= reservedForWithdrawals;
  
  // Derive individual transfer amounts based on their portions
  let transferAmounts: bigint[] = delegatorAllocation.map(portion => {
    return (portion * totalCredits) / PRECISION_UNSIGNED;
  });

  console.log(`Transfer amounts: ${transferAmounts}`);

  return transferAmounts;
}

const prepRebalance = async (): Promise<void> => {
  console.log('Starting prep rebalance');

  const lastRebalanceBlock = await getMappingValue('0u8', CORE_PROTOCOL_PROGRAM, 'last_rebalance_epoch');
  if (!lastRebalanceBlock) {
    console.log('No last rebalance epoch found, skipping');
    return;
  } else {
    const lastRebalanceEpoch = BigInt(lastRebalanceBlock.slice(0, -3)) / BigInt(EPOCH_BLOCKS);
    const currentEpoch = BigInt(await getHeight()) / BigInt(EPOCH_BLOCKS);
    console.log(`Last rebalance epoch: ${lastRebalanceEpoch}, current epoch: ${currentEpoch}`);
    if (lastRebalanceEpoch >= currentEpoch) {
      console.log(`Already rebalanced in this epoch: ${currentEpoch}, skipping`);
      return;
    }
  }

  const pondoDelegatorStates = await getPondoDelegatorStates();
  const allTerminal = pondoDelegatorStates.every(state => state === '4u8');

  if (allTerminal) {
    console.log('All pondo delegators are in terminal state, ready to rebalance_redistribute');


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

const getTopValidators = async (): Promise<string[]> => {
  let topValidatorsString = await getMappingValue('0u8', PONDO_ORACLE_PROGRAM, 'top_validators');
  if (!topValidatorsString) {
    // TODO: This is broken, it should return validator data and then extract the commissions
    topValidatorsString = `${ZERO_ADDRESS},${ZERO_ADDRESS},${ZERO_ADDRESS},${ZERO_ADDRESS},${ZERO_ADDRESS}`;
  }
  console.log(`Top validators: ${topValidatorsString}`);
  const topValidators = topValidatorsString.split(',');
  console.log(`Top validators: ${topValidators}`);
  return topValidators;
}

/// Call rebalance_redistribute on the core protocol program if all pondo delegators are in terminal state
const rebalanceRedistribute = async (pondoDelegatorStates: string[]): Promise<void> => {
  console.log('Rebalancing and redistributing');
  const allTerminal = pondoDelegatorStates.every(state => state === '4u8');
  if (allTerminal) {
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
      `[${topValidators.map(validator => `{ validator: ${validator}, commission: 0u8}`).join(',')}]`,
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
  await rebalanceRedistribute(pondoDelegatorStates);

  // Handle updating all of the delegators
  for (let index = 1; index < 6; index++) {
    const pondoDelegatorState = pondoDelegatorStates[index - 1] as PONDO_DELEGATOR_STATE;
    await handleDelegatorUpdate(`pondo_delegator${index}.aleo`, pondoDelegatorState);
  }
}