import * as Aleo from '@demox-labs/aleo-sdk';

import { submitTransaction } from '../aleo/execute';
import { resolveImports } from '../aleo/deploy';
import {
  CREDITS_PROGRAM,
  MAX_GUARANTEED_LIQUIDITY,
  MIN_LIQUIDITY_PERCENT,
  NETWORK,
  PRECISION_UNSIGNED,
  PRIVATE_KEY,
  VERSION,
} from '../constants';
import {
  pondoDependencyTree,
  pondoPrograms,
  pondoProgramToCode,
} from '../compiledPrograms';
import { determineRebalanceAmounts } from './runProtocol';
import { getMappingValue, getProgram, getPublicBalance } from '../aleo/client';
import { formatAleoString } from '../util';

const CORE_PROTOCOL_PROGRAM = pondoPrograms.find((program) =>
  program.includes('pondo_protocol.aleo')
);
const CORE_PROTOCOL_PROGRAM_CODE = pondoProgramToCode[CORE_PROTOCOL_PROGRAM!];

export const distributeDeposits = async () => {
  // Get the rebalance amounts
  const rebalanceAmounts = await determineDistributionAmounts();
  // Format the inputs
  const inputs = [
    `[${rebalanceAmounts.map((amount) => `${amount}u64`).join(',')}]`,
  ];
  console.log(`Distribute deposit transfer amounts: ${inputs}`);

  // Get the program code
  const programCode = CORE_PROTOCOL_PROGRAM_CODE;
  // Resolve imports
  const imports = pondoDependencyTree[CORE_PROTOCOL_PROGRAM!];
  let resolvedImports = await resolveImports(imports);
  return await submitTransaction(
    NETWORK!,
    PRIVATE_KEY!,
    programCode,
    'distribute_deposits',
    inputs,
    2, // TODO: set the correct fee
    undefined,
    resolvedImports
  );
};

const determineDistributionAmounts = async (): Promise<bigint[]> => {
  // Constants
  const delegatorAllocation: bigint[] = [
    BigInt(3700),
    BigInt(2600),
    BigInt(1600),
    BigInt(1200),
    BigInt(900),
  ];

  const coreProtocolAddress = Aleo.Program.fromString(
    NETWORK!,
    CORE_PROTOCOL_PROGRAM_CODE
  ).toAddress();
  let protocolBalance = await getPublicBalance(coreProtocolAddress);
  let pondoDelegatorTVLs: bigint[] = [];
  for (let index = 1; index < 6; index++) {
    const delegatorProgramId = `delegator${index}${VERSION}.aleo`;
    const delegatorProgram = await getProgram(delegatorProgramId);
    const delegatorProgramAddress = Aleo.Program.fromString(
      NETWORK!,
      delegatorProgram
    ).toAddress();
    const delegatorBalance = await getPublicBalance(delegatorProgramAddress);
    const bondedState = await getMappingValue(
      delegatorProgramAddress,
      CREDITS_PROGRAM,
      'bonded'
    );
    let delegatorBondedBalance: bigint = 0n;
    if (bondedState) {
      delegatorBondedBalance = BigInt(
        JSON.parse(formatAleoString(bondedState))['microcredits'].slice(0, -3)
      );
    }
    const unbondingState = await getMappingValue(
      delegatorProgramAddress,
      CREDITS_PROGRAM,
      'unbonding'
    );
    let delegatorUnbondingBalance: bigint = 0n;
    if (unbondingState) {
      delegatorUnbondingBalance = BigInt(
        JSON.parse(formatAleoString(unbondingState))['microcredits'].slice(
          0,
          -3
        )
      );
    }
    const delegatorTVL =
      delegatorBalance + delegatorBondedBalance + delegatorUnbondingBalance;
    pondoDelegatorTVLs.push(delegatorTVL);
  }
  const totalTVL = pondoDelegatorTVLs.reduce(
    (acc, tvl) => acc + tvl,
    protocolBalance
  );
  console.log(
    `Total tvl: ${totalTVL} Pondo core tvl: ${protocolBalance}, delegator TVLs: ${pondoDelegatorTVLs}`
  );

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
  protocolBalance -= reservedForWithdrawals;

  let liquidityPool = (totalTVL * MIN_LIQUIDITY_PERCENT) / BigInt(10250);
  if (liquidityPool > MAX_GUARANTEED_LIQUIDITY) {
    liquidityPool = MAX_GUARANTEED_LIQUIDITY;
  }
  protocolBalance -= liquidityPool;

  console.log(`Liquidty pool: ${liquidityPool}`);

  // Derive individual transfer amounts based on their portions
  let transferAmounts: bigint[] = delegatorAllocation.map((portion) => {
    const microcredits = (portion * protocolBalance) / PRECISION_UNSIGNED;
    console.log(
      'portion: ',
      (PRECISION_UNSIGNED * microcredits) / protocolBalance
    );
    return microcredits;
  });

  console.log(`Transfer amounts: ${transferAmounts}`);

  return transferAmounts;
};
