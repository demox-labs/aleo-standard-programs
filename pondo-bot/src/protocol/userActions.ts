import * as Aleo from '@demox-labs/aleo-sdk';

import { getMappingValue, getProgram, getPublicBalance } from '../aleo/client';
import { submitTransaction } from '../aleo/execute';
import { resolveImports } from '../aleo/deploy';
import {
  CREDITS_PROGRAM,
  CREDITS_TOKEN_ID,
  NETWORK,
  PALEO_TOKEN_ID,
  PONDO_COMMISSION,
  PONDO_WITHDRAW_FEE,
  PRECISION_UNSIGNED,
  PRIVATE_KEY,
  TEST_USER0_PRIVATE_KEY,
  VERSION,
  ZERO_ADDRESS,
} from '../constants';
import { PONDO_PROTOCOL_STATE } from './types';
import { formatAleoString } from '../util';
import {
  pondoDependencyTree,
  pondoPrograms,
  pondoProgramToCode,
} from '../compiledPrograms';

const MTSP_PROGRAM = pondoPrograms.find((program) =>
  program.includes('multi_token_support_program')
);
const MTSP_PROGRAM_CODE = pondoProgramToCode[MTSP_PROGRAM!];

const CORE_PROTOCOL_PROGRAM = pondoPrograms.find((program) =>
  program.includes('pondo_core_protocol')
)!;
const CORE_PROTOCOL_PROGRAM_CODE = pondoProgramToCode[CORE_PROTOCOL_PROGRAM];
const CORE_PROTOCOL_PROGRAM_IMPORTS =
  pondoDependencyTree[CORE_PROTOCOL_PROGRAM];

////// DEPOSIT //////

export const depositAsSigner = async (deposit: bigint, privateKey?: string) => {
  const paleoForDeposit =
    (await calculatePaleoForDeposit(deposit)) - BigInt(1000);
  const imports = pondoDependencyTree[CORE_PROTOCOL_PROGRAM];
  const resolvedImports = await resolveImports(imports);

  await submitTransaction(
    NETWORK!,
    privateKey || PRIVATE_KEY!,
    CORE_PROTOCOL_PROGRAM_CODE,
    'deposit_public_as_signer',
    [`${deposit}u64`, `${paleoForDeposit}u64`, ZERO_ADDRESS],
    0.487533,
    undefined,
    resolvedImports
  );
  console.log('deposit_public_as_signer transaction submitted');
};

export const depositViaAllowance = async (
  deposit: bigint,
  privateKey?: string
) => {
  const mtspImports = pondoDependencyTree[MTSP_PROGRAM];
  const mtspResolvedImports = await resolveImports(mtspImports);
  const depositorKey = privateKey || TEST_USER0_PRIVATE_KEY;

  console.log('Depositing credits into MTSP');
  await submitTransaction(
    NETWORK!,
    depositorKey,
    MTSP_PROGRAM_CODE,
    'deposit_credits_public',
    [`${deposit}u64`],
    3,
    undefined,
    mtspResolvedImports
  );

  console.log('Creating allowance for core protocol');
  await submitTransaction(
    NETWORK!,
    depositorKey,
    MTSP_PROGRAM_CODE,
    'approve_public',
    [CREDITS_TOKEN_ID, 'pondo_core_protocol.aleo', `${deposit}u128`],
    3,
    undefined,
    mtspResolvedImports
  );

  const paleoForDeposit =
    (await calculatePaleoForDeposit(deposit)) - BigInt(1000);
  const coreProtocolImports = await resolveImports(
    CORE_PROTOCOL_PROGRAM_IMPORTS
  );
  await submitTransaction(
    NETWORK!,
    depositorKey,
    CORE_PROTOCOL_PROGRAM_CODE,
    'deposit_public',
    [`${deposit}u64`, `${paleoForDeposit}u64`, ZERO_ADDRESS],
    3,
    undefined,
    coreProtocolImports
  );
  console.log('deposit_public transaction submitted');
};

export const calculatePaleoForDeposit = async (
  deposit: bigint
): Promise<bigint> => {
  const { totalAleo, totalPaleo } = await calculateAleoAndPaleoPools();

  return calculatePaleoMint(totalAleo, totalPaleo, deposit);
};

/**
 * Calculates the total aleo and paleo pools, including rewards and commissions
 * @returns { totalAleo: bigint, totalPaleo: bigint }
 */
const calculateAleoAndPaleoPools = async () => {
  console.log('Calculating aleo and paleo pools');
  let totalProtocolBalance = BigInt(0);
  // Handle updating all of the delegators
  for (let index = 1; index < 6; index++) {
    const delegatorProgramId = `pondo_delegator${index}${VERSION}.aleo`;
    const delegatorProgram = await getProgram(delegatorProgramId);
    const delegatorProgramAddress = Aleo.Program.fromString(
      NETWORK!,
      delegatorProgram
    ).toAddress();
    totalProtocolBalance += await getPublicBalance(delegatorProgramAddress);
    const bondedState = await getMappingValue(
      delegatorProgramAddress,
      CREDITS_PROGRAM,
      'bonded'
    );
    if (bondedState) {
      totalProtocolBalance += BigInt(
        JSON.parse(formatAleoString(bondedState))['microcredits'].slice(0, -3)
      );
    }
    const unbondingState = await getMappingValue(
      delegatorProgramAddress,
      CREDITS_PROGRAM,
      'unbonding'
    );
    if (unbondingState) {
      totalProtocolBalance += BigInt(
        JSON.parse(formatAleoString(unbondingState))['microcredits'].slice(
          0,
          -3
        )
      );
    }
  }
  const bondedWithdrawals = await getMappingValue(
    '1u8',
    CORE_PROTOCOL_PROGRAM!,
    'balances'
  );
  if (bondedWithdrawals) {
    totalProtocolBalance -= BigInt(bondedWithdrawals.slice(0, -3));
  }
  const lastDelegatedBalanceString = await getMappingValue(
    '0u8',
    CORE_PROTOCOL_PROGRAM!,
    'balances'
  );
  const lastDelegatedBalance = BigInt(lastDelegatedBalanceString.slice(0, -3));
  const earnedRewards =
    totalProtocolBalance > lastDelegatedBalance
      ? totalProtocolBalance - lastDelegatedBalance
      : BigInt(0);
  const earnedCommission =
    (earnedRewards * PONDO_COMMISSION) / PRECISION_UNSIGNED;
  console.log('Earned commission: ', earnedCommission.toLocaleString());
  const nonCommissionedRewards = earnedRewards - earnedCommission;
  console.log(
    'Non-commissioned rewards: ',
    nonCommissionedRewards.toLocaleString()
  );

  const reservedForWithdrawalsString = await getMappingValue(
    '2u8',
    CORE_PROTOCOL_PROGRAM!,
    'balances'
  );
  const reservedForWithdrawals = BigInt(
    reservedForWithdrawalsString.slice(0, -3)
  );
  const coreProtocolAccountBalance = await getPublicBalance(
    CORE_PROTOCOL_PROGRAM!
  );
  const protocolState = await getMappingValue(
    '0u8',
    CORE_PROTOCOL_PROGRAM,
    'protocol_state'
  );
  const depositPool =
    protocolState == PONDO_PROTOCOL_STATE.REBALANCING
      ? coreProtocolAccountBalance -
        lastDelegatedBalance -
        reservedForWithdrawals
      : coreProtocolAccountBalance - reservedForWithdrawals;
  console.log('Deposit pool: ', depositPool.toLocaleString());
  let totalAleo = lastDelegatedBalance + depositPool;
  console.log(
    'Last delegated balance: ',
    lastDelegatedBalance.toLocaleString()
  );

  const paleoMetadata = await getMappingValue(
    PALEO_TOKEN_ID,
    MTSP_PROGRAM,
    'registered_tokens'
  );
  const mintedPaleo = BigInt(
    JSON.parse(formatAleoString(paleoMetadata))['supply'].slice(0, -4)
  );
  const owedCommissionString = await getMappingValue(
    '0u8',
    CORE_PROTOCOL_PROGRAM!,
    'owed_commission'
  );
  const owedComission = BigInt(owedCommissionString.slice(0, -3));
  console.log('Owed commission: ', owedComission.toLocaleString());
  console.log('Minted paleo: ', mintedPaleo.toLocaleString());
  const totalPaleo = mintedPaleo + owedComission;

  const paleoForCommission = calculatePaleoMint(
    totalAleo + nonCommissionedRewards,
    totalPaleo,
    earnedCommission
  );
  console.log('Paleo for commission: ', paleoForCommission.toLocaleString());

  totalAleo += nonCommissionedRewards;
  const paleoAfterCommission =
    (totalPaleo * (totalAleo + earnedCommission)) / totalAleo;
  const aleoAfterCommission = totalAleo + earnedCommission;
  console.log('Aleo after commission: ', aleoAfterCommission.toLocaleString()); // TODO: add buffer for additional rewards earned in the interceding blocks
  console.log(
    'Paleo after commission: ',
    paleoAfterCommission.toLocaleString()
  );

  return { totalAleo, totalPaleo };
};

const calculatePaleoMint = (
  totalAleo: bigint,
  totalPaleo: bigint,
  deposit: bigint
) => {
  let newTotalPaleo: bigint = (totalPaleo * (totalAleo + deposit)) / totalAleo;
  let diff: bigint = newTotalPaleo - totalPaleo;
  let paleoToMint: bigint = BigInt.asUintN(64, diff);
  console.log('Paleo to mint: ', paleoToMint.toLocaleString());
  return paleoToMint;
};

////// WITHDRAW //////

export const batchedWithdraw = async (
  withdrawalPaleo: bigint,
  privateKey?: string
) => {
  const resolvedImports = await resolveImports(CORE_PROTOCOL_PROGRAM_IMPORTS);

  await submitTransaction(
    NETWORK!,
    privateKey || TEST_USER0_PRIVATE_KEY!,
    CORE_PROTOCOL_PROGRAM_CODE,
    'withdraw_public',
    [`${withdrawalPaleo}u64`],
    3,
    undefined,
    resolvedImports
  );
};

export const claimWithdrawal = async (
  address: string,
  withdrawAll: boolean = false,
  privateKey?: string
) => {
  const resolvedImports = await resolveImports(CORE_PROTOCOL_PROGRAM_IMPORTS);
  const withdrawalMappingValue = await getMappingValue(
    address,
    CORE_PROTOCOL_PROGRAM,
    'withdrawals'
  );
  const availableToWithdraw = BigInt(
    JSON.parse(formatAleoString(withdrawalMappingValue))['microcredits'].slice(
      0,
      -3
    )
  );
  const withdrawalAleo = withdrawAll
    ? availableToWithdraw
    : availableToWithdraw / BigInt(2);

  await submitTransaction(
    NETWORK!,
    privateKey || PRIVATE_KEY!,
    CORE_PROTOCOL_PROGRAM_CODE,
    'claim_withdrawal_public',
    [address, `${withdrawalAleo}u64`],
    3,
    undefined,
    resolvedImports
  );
};

export const instantWithdraw = async (
  withdrawalPaleo: bigint,
  privateKey?: string
) => {
  const aleoForWithdrawal = await calculateAleoForWithdrawal(withdrawalPaleo);
  const resolvedImports = await resolveImports(CORE_PROTOCOL_PROGRAM_IMPORTS);

  await submitTransaction(
    NETWORK!,
    privateKey || TEST_USER0_PRIVATE_KEY!,
    CORE_PROTOCOL_PROGRAM_CODE,
    'instant_withdraw_public',
    [`${withdrawalPaleo}u64`, `${aleoForWithdrawal}u64`],
    3,
    undefined,
    resolvedImports
  );
};

export const calculateAleoForWithdrawal = async (
  withdrawalPaleo: bigint
): Promise<bigint> => {
  const { totalAleo, totalPaleo } = await calculateAleoAndPaleoPools();
  const totalWithdrawal =
    (((totalPaleo * PRECISION_UNSIGNED) / totalAleo) * withdrawalPaleo) /
    PRECISION_UNSIGNED;
  const withdrawalMinusFee =
    (totalWithdrawal * (PRECISION_UNSIGNED - PONDO_WITHDRAW_FEE)) /
    PRECISION_UNSIGNED;
  return withdrawalMinusFee;
};
