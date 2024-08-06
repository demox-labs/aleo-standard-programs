import * as Aleo from '@demox-labs/aleo-sdk';

import { pondoDependencyTree, pondoPrograms } from '../../compiledPrograms';
import { resolveImports } from '../../aleo/deploy';
import { getProgram, getPublicTransactionsForProgram } from '../../aleo/client';
import { NETWORK } from '../../constants';
import { getOracleProposalTransactionHistory, extractValidatorAddressAndProgramName } from '../../protocol/referenceDelegators';

async function main() {
  // The results object will store the estimated fees for each of the functions for each of the pondo programs
  let results = {};
  // For each of the pondo programs, estimate the fees for each of their functions
  // and print the results to the console
  for (let programId of pondoPrograms) {
    if (programId === 'credits.aleo' || programId === 'test_program.aleo') {
      console.log('Skipping credits.aleo & test_program.aleo programs');
      continue;
    }
    // Have to import before potentially changing the programId
    const imports = pondoDependencyTree[programId];

    // If the programId is a reference_delegator program, we need to get the programId
    if (programId.includes('reference_delegator')) {
      console.log('Checking for deployed reference_delegator programs')
      const transactionHistory = await getOracleProposalTransactionHistory();
      const delegatorsAndValidators = transactionHistory.map(tx => extractValidatorAddressAndProgramName(tx));
      programId = delegatorsAndValidators[0].programName!;
    }

    console.log(`Estimating fees for program ${programId}`);
    results[programId] = {};

    let resolvedImports = await resolveImports(imports);
    let program = await getProgram(programId);
    let aleoProgram = Aleo.Program.fromString(NETWORK!, program);
    let functions = aleoProgram.getFunctions();
    // For each function in the program, estimate the fees
    for (let functionName of functions) {
      const publicTransactions = await getPublicTransactionsForProgram(programId, functionName);
      if (publicTransactions.length === 0) {
        console.log(`No public transactions found for function ${functionName} in program ${programId}`);
        continue;
      }
      const matchingTransaction = publicTransactions.find((tx) => {
        const lastTransition = tx.transaction.execution.transitions[tx.transaction.execution.transitions.length - 1];
        if (lastTransition.program === programId && lastTransition.function === functionName) {
          return true;
        }
        return false;
      });
      if (!matchingTransaction) {
        console.log(`No matching transaction found for function ${functionName} in program ${programId}`);
        continue
      }
      // console.log(JSON.stringify(publicTransactions[0].transaction));
      const estimatedFee = await Aleo.ProgramManager.estimateExecutionFee(NETWORK!, JSON.stringify(matchingTransaction.transaction), program, functionName, resolvedImports);
      console.log(`Estimated fees for ${functionName} in program ${programId}: ${estimatedFee}`);
      results[programId][functionName] = estimatedFee.toString();
    }
  }

  console.log(JSON.stringify(results));
}

main();