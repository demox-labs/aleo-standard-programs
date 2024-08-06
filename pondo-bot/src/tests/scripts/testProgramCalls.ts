import { submitTransaction } from '../../aleo/execute';
import { resolveImports } from '../../aleo/deploy';
import {
  NETWORK,
  TEST_USER0_PRIVATE_KEY,
  TEST_USER1_PRIVATE_KEY,
  TEST_USER2_PRIVATE_KEY,
} from '../../constants';
import {
  pondoDependencyTree,
  pondoPrograms,
  pondoProgramToCode,
} from '../../compiledPrograms';
import { calculatePaleoForDeposit } from '../../protocol/userActions';

const TEST_PROGRAM = pondoPrograms.find((program) =>
  program.includes('test_program')
);
const TEST_PROGRAM_CODE = pondoProgramToCode[TEST_PROGRAM!];
const TEST_PROGRAM_IMPORTS = pondoDependencyTree[TEST_PROGRAM!];

type TEST_PROGRAM_FUNCTIONS =
  | 'double_deposit'
  | 'deposit_withdraw'
  | 'deposit_instant_withdraw'
  | 'deposit_withdraw_as_signer'
  | 'deposit_instant_withdraw_signer';

async function main(
  functionName: TEST_PROGRAM_FUNCTIONS,
  deposit: string,
  privateKey?: string,
  subtractFee: string = 'true'
): Promise<void> {
  const depositAsBigInt = BigInt(deposit || 1000);
  const expectedPaleo = await calculatePaleoForDeposit(depositAsBigInt);
  const inputs = [`${depositAsBigInt}u64`, `${expectedPaleo}u64`];
  if (
    functionName !== 'double_deposit' &&
    functionName !== 'deposit_withdraw_as_signer'
  ) {
    inputs.push(subtractFee === 'true' ? 'true' : 'false');
  }

  let resolvedImports = await resolveImports(TEST_PROGRAM_IMPORTS);
  await submitTransaction(
    NETWORK!,
    privateKey || TEST_USER2_PRIVATE_KEY!,
    TEST_PROGRAM_CODE,
    functionName,
    inputs,
    4,
    undefined,
    resolvedImports
  );
}

const [functionName, deposit, privateKey, subtractFee] = process.argv.slice(2);
await main(
  functionName as TEST_PROGRAM_FUNCTIONS,
  (deposit || '').replace(/[,_]/g, ''),
  privateKey,
  subtractFee
);
