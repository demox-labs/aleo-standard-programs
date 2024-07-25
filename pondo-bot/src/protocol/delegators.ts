import * as Aleo from "@demox-labs/aleo-sdk";

import { getHeight, getMappingValue, getProgram, getPublicBalance } from "../aleo/client";
import { resolveImports } from '../aleo/deploy';
import { submitTransaction } from '../aleo/execute';
import { PONDO_DELEGATOR_STATE } from "./types";
import { pondoDependencyTree } from '../compiledPrograms';
import { CREDITS_PROGRAM, MIN_DELEGATION, NETWORK, PRIVATE_KEY } from "../constants";
import { extractValidator, formatAleoString } from "../util";


const bondDelegator = async (delegatorProgramId: string, minBalance: bigint, delegatorState: PONDO_DELEGATOR_STATE) => {
  console.log(`Bonding delegator ${delegatorProgramId}`);
  const delegatorProgram = await getProgram(delegatorProgramId);
  const delegatorProgramAddress = Aleo.Program.fromString(NETWORK!, delegatorProgram).toAddress();
  const balance = await getPublicBalance(delegatorProgramAddress);
  console.log(`Delegator ${delegatorProgramId} has balance ${balance}`);

  const validatorDatum = await getMappingValue('0u8', delegatorProgramId, 'validator_mapping');
  const validator = extractValidator(validatorDatum);
  console.log(`Delegator ${delegatorProgramId} is bonding to ${validator}`);

  const imports = pondoDependencyTree[delegatorProgramId];
  const resolvedImports = await resolveImports(imports);

  if (balance < minBalance) {
    // Delegator does not have enough credits to bond
    console.log(`Delegator ${delegatorProgramId} does not have enough credits to bond`);
    if (delegatorState === '0u8') {
      console.log('Delegator is in state 0u8, submitting insufficient_balance transaction');
      await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        delegatorProgram,
        'insufficient_balance',
        [],
        2, // TODO: set the correct fee
        undefined,
        resolvedImports
      );
    }
  } else {
    // Delegator has enough credits to bond
    await submitTransaction(
      NETWORK!,
      PRIVATE_KEY!,
      delegatorProgram,
      'bond',
      [validator, `${balance}u64`],
      2, // TODO: set the correct fee
      undefined,
      resolvedImports
    );
  }
}

const unbondDelegator = async (delegatorProgramId: string) => {
  console.log(`Unbonding delegator ${delegatorProgramId}`);
  const delegatorProgram = await getProgram(delegatorProgramId);
  const delegatorProgramAddress = Aleo.Program.fromString(NETWORK!, delegatorProgram).toAddress();
  const bondedState = JSON.parse(formatAleoString(await getMappingValue(delegatorProgramAddress, CREDITS_PROGRAM, 'bonded')));
  const balance = BigInt(bondedState["microcredits"].slice(0, -3));

  console.log(`Delegator ${delegatorProgramId} has balance ${balance}`);

  const imports = pondoDependencyTree[delegatorProgramId];
  const resolvedImports = await resolveImports(imports);

  await submitTransaction(
    NETWORK!,
    PRIVATE_KEY!,
    delegatorProgram,
    'unbond',
    [`${balance}u64`],
    2, // TODO: set the correct fee
    undefined,
    resolvedImports
  );
}

const finalizeToTerminalState = async (delegatorProgramId: string) => {
  console.log(`Finalizing delegator ${delegatorProgramId} to terminal state`);
  const delegatorProgram = await getProgram(delegatorProgramId);
  const delegatorProgramAddress = Aleo.Program.fromString(NETWORK!, delegatorProgram).toAddress();
  const unbondingState = await getMappingValue(delegatorProgramAddress, CREDITS_PROGRAM, 'unbonding');
  if (unbondingState) {
    const unbondHeight = BigInt(JSON.parse(formatAleoString(unbondingState))["height"].slice(0, -3));
    const currentHeight = BigInt(await getHeight());
    if (currentHeight >= unbondHeight) {
      console.log(`Running claim_unbond_public for delegator ${delegatorProgramId}`);
      await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        Aleo.Program.getCreditsProgram(NETWORK).toString(),
        'claim_unbond_public',
        [delegatorProgramAddress],
        2, // TODO: set the correct fee
      );
    } else {
      console.log(`Delegator ${delegatorProgramId} is still unbonding, skipping ${unbondHeight - currentHeight} blocks left`);
    }
  } else {
    console.log(`Delegator ${delegatorProgramId} has finished unbonding, moving to terminal state`);
    const imports = pondoDependencyTree[delegatorProgramId];
    const resolvedImports = await resolveImports(imports);
  
    await submitTransaction(
      NETWORK!,
      PRIVATE_KEY!,
      delegatorProgram,
      'terminal_state',
      [],
      2, // TODO: set the correct fee
      undefined,
      resolvedImports
    );
  }
}

export const handleDelegatorUpdate = async (delegatorProgramId: string, state: PONDO_DELEGATOR_STATE) => {
  if (!delegatorProgramId) {
    throw new Error('Delegator program ID is required');
  }

  console.log(`Handling delegator ${delegatorProgramId} in state ${state}`);

  switch (state) {
    case '0u8': // Bond allowed
      await bondDelegator(delegatorProgramId, MIN_DELEGATION, state);
      break;
    case '1u8': // Unbond not allowed
      await bondDelegator(delegatorProgramId, BigInt(1_000_000), state);
      break;
    case '2u8': // Unbond allowed
      await unbondDelegator(delegatorProgramId);
      break;
    case '3u8': // Unbonding
      await finalizeToTerminalState(delegatorProgramId);
      break;
    case '4u8': // Terminal
      break;
    default:
      throw new Error(`Invalid state ${state}`);
  }
}