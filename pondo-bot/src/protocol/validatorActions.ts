import { submitTransaction } from '../aleo/execute';
import { resolveImports } from '../aleo/deploy';
import { NETWORK, PRIVATE_KEY } from '../constants';
import {
  pondoDependencyTree,
  pondoPrograms,
  pondoProgramToCode,
} from '../compiledPrograms';
import { determineRebalanceAmounts } from './runProtocol';

const CORE_PROTOCOL_PROGRAM = pondoPrograms.find((program) =>
  program.includes('pondo_core_protocol')
);
const CORE_PROTOCOL_PROGRAM_CODE = pondoProgramToCode[CORE_PROTOCOL_PROGRAM!];

export const distributeDeposits = async (): Promise<void> => {
  // Get the rebalance amounts
  const rebalanceAmounts = await determineRebalanceAmounts();
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
  await submitTransaction(
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
