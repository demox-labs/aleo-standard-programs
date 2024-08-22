import { before, describe, it } from "node:test";
import * as Aleo from "@demox-labs/aleo-sdk";
import { pondoDependencyTree, pondoPrograms } from "../../compiledPrograms";
import { getMappingValue, getProgram, getPublicTransactionsForProgram, isTransactionAccepted } from "../../aleo/client";
import { ADDRESS, NETWORK, PRIVATE_KEY } from "../../constants";
import { ExecuteTransaction } from "../../aleo/types";
import { submitTransaction } from "../../aleo/execute";
import { resolveImports } from "../../aleo/deploy";
import assert from "node:assert";
import { formatAleoString } from "../../util";

describe('oracleUpdate', async () => {
  let oracleProgram: string;
  let delegators: string[];

  const oracleId: string = pondoPrograms.find((program) =>
    program.includes('pondo_oracle')
  )!;

  before(async () => {
    oracleProgram = await getProgram(oracleId);

    const transactionHistory = await getPublicTransactionsForProgram(oracleId, 'add_delegator', 0) as ExecuteTransaction[];
    delegators = transactionHistory.map(tx => tx.transaction.execution.transitions[0].inputs[0].value);
    console.log('Delegators:', JSON.stringify(delegators));
    for (let i = 0; i < delegators.length; i++) {
      const delegator = delegators[i];
      console.log('Delegator:', delegator, 'Oracle ID:', oracleId);
      const validatorDatum = JSON.parse(formatAleoString(await getMappingValue(delegator, oracleId, 'validator_data')));
      console.log('Validator data:', JSON.stringify(validatorDatum));
    }

    const topValidators = await getMappingValue('0u8', oracleId, 'top_validators');
    console.log('Top validators:', topValidators);
  });

  describe('boostValidator', async () => {
    it('should be able to boost a validator', async () => {
      const boostAmount = '10000000u64'; // 10 Credits

      let imports = pondoDependencyTree[oracleId];
      let resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        oracleProgram,
        'boost_validator',
        [ADDRESS!, boostAmount],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, 'boost_validator was rejected, but should have been accepted');

      const validatorBoost = JSON.parse(formatAleoString(await getMappingValue(ADDRESS!, oracleId, 'validator_boosting')));
      assert(validatorBoost.epoch === '2u32', `Validator boost epoch is ${validatorBoost.epoch}, but should be 2`);
      assert(validatorBoost.boost_amount === boostAmount, `Validator boost amount is ${validatorBoost.boost_amount}, but should be ${boostAmount}`);
    });
  });
})