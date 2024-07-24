import * as Aleo from '@demox-labs/aleo-sdk';

import { getProgram, getPublicTransactionsForAddress } from "../aleo/client";
import { resolveImports } from '../aleo/deploy';
import { submitTransaction } from '../aleo/execute';
import { pondoDependencyTree, pondoPrograms } from "../compiledPrograms";
import { NETWORK, PRIVATE_KEY } from '../constants';


const getInitializationFunction = (programCode: string): string | undefined => {
  const program = Aleo.Program.fromString(NETWORK, programCode);
  const initializeFunction = program.getFunctions().filter(f => f.includes('initialize'))[0];
  if (!initializeFunction) {
    console.log(`Program ${program.id()} does not have an initialize function`);
  } else {
    return initializeFunction;
  }
}

const hasProgramBeenInitialized = async (programId: string, programCode: string): Promise<boolean> => {
  const initializeFunction = getInitializationFunction(programCode);
  if (!initializeFunction) {
    return true;
  }

  const transactions = await getPublicTransactionsForAddress(programId, initializeFunction, 0);
  return transactions.length > 0;
}

// Initialize all programs
export const initializeProgramsIfNecessary = async (): Promise<any> => {
  // For each of the pondo programs, initialize them if they haven't been initialized yet
  for (const program of pondoPrograms) {
    // Only the multi_token_support_program, pondo_oracle, and pondo_core_protocol programs have initialization functions
    if (!program.includes('multi_token_support_program') && !program.includes('pondo_oracle') && !program.includes('pondo_core_protocol')) {
      continue;
    }

    const programCode = await getProgram(program);
    if (!programCode) {
      throw new Error(`Program ${program} not found`);
    }

    const programIsInitialized = await hasProgramBeenInitialized(program, programCode);

    if (programIsInitialized) {
      console.log(`Program ${program} has already been initialized`);
      continue;
    }

    // Resolve imports
    const imports = pondoDependencyTree[program];
    let resolvedImports = {};
    if (imports) {
      resolvedImports = await resolveImports(imports);
    }

    // Set the inputs
    let inputs: string[] = [];
    if (program.includes('pondo_core_protocol')) {
      inputs = ['100_000_000_000u64']
    }

    // Initialize the program
    const initializationFunction = getInitializationFunction(programCode);
    console.log(`Initializing program ${program} with initialization function ${initializationFunction}`);
    await submitTransaction(
      NETWORK,
      PRIVATE_KEY,
      programCode,
      initializationFunction!,
      inputs,
      75,
      undefined,
      resolvedImports
    )
    console.log(`Initialized program ${program}`);
  }
}