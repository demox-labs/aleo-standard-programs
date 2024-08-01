import { submitTransaction } from '../../aleo/execute';
import { resolveImports } from '../../aleo/deploy';
import { NETWORK, TEST_USER0_PRIVATE_KEY } from '../../constants';
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
  | 'deposit_instant_withdraw';

async function main(
  functionName: TEST_PROGRAM_FUNCTIONS,
  deposit: string,
  privateKey?: string
): Promise<void> {
  const depositAsBigInt = BigInt(deposit || 1000);
  const expectedPaleo = await calculatePaleoForDeposit(depositAsBigInt);

  let resolvedImports = await resolveImports(TEST_PROGRAM_IMPORTS);
  await submitTransaction(
    NETWORK!,
    privateKey || TEST_USER0_PRIVATE_KEY!,
    TEST_PROGRAM_CODE,
    functionName,
    [`${depositAsBigInt}u64`, `${expectedPaleo}u64`],
    4,
    undefined,
    resolvedImports
  );
}

const [functionName, deposit, privateKey] = process.argv.slice(2);
main(
  functionName as TEST_PROGRAM_FUNCTIONS,
  (deposit || '').replace(/[,_]/g, ''),
  privateKey
);
