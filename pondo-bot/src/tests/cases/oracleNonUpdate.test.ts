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

describe('oracleNonUpdate', async () => {
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
  });

  describe('updateData', async () => {
    it('should not update data outside of the update period', async () => {
      const delegatorToUpdate = delegators[0];

      let imports = pondoDependencyTree[oracleId];
      let resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        oracleProgram,
        'update_data',
        [delegatorToUpdate],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'update_data was accepted, but should have been rejected');
    });
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

  describe('banValidator', async () => {
    it('should not ban a validator who meets requirements', async () => { 
      const delegator = delegators[0];
      console.log('Delegator:', delegator, 'Oracle ID:', oracleId);
      const validatorDatum = JSON.parse(formatAleoString(await getMappingValue(delegator, oracleId, 'validator_data')));
      console.log('Validator data:', JSON.stringify(validatorDatum));

      let imports = pondoDependencyTree[oracleId];
      let resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        oracleProgram,
        'ban_validator',
        [delegator],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'ban_validator was accepted, but should have been rejected');

      const isBanned = await getMappingValue(ADDRESS!, oracleId, 'banned_validators');
      assert(isBanned == null, 'Validator was banned');
    });

    it('should ban a validator who leaves the committee', async () => {
      for (let i = 0; i < delegators.length; i++) {
        const delegator = delegators[i];
        const validatorDatum = JSON.parse(formatAleoString(await getMappingValue(delegator, oracleId, 'validator_data')));
        console.log('Validator data:', JSON.stringify(validatorDatum));

        if (validatorDatum.validator !== ADDRESS) {
          console.log('Validator is not me, skipping...');
          continue;
        }

        console.log('Validator is me, removing from committee...');
        const bondedState = JSON.parse(formatAleoString(await getMappingValue(ADDRESS!, 'credits.aleo', 'bonded')));
        const unbondTxResult = await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          Aleo.Program.getCreditsProgram(NETWORK!).toString(),
          'unbond_public',
          [ADDRESS, bondedState.microcredits],
          4
        );
        const wasUnbondAccepted = await isTransactionAccepted(unbondTxResult);
        assert(wasUnbondAccepted, 'unbond_public was rejected, but should have been accepted');

        let imports = pondoDependencyTree[oracleId];
        let resolvedImports = await resolveImports(imports);

        const txResult = await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          oracleProgram,
          'ban_validator',
          [delegator],
          4,
          undefined,
          resolvedImports
        );

        const wasAccepted = await isTransactionAccepted(txResult);
        assert(wasAccepted, 'ban_validator was rejected, but should have been accepted');

        const isBanned = await getMappingValue(ADDRESS!, oracleId, 'banned_validators');
        assert(isBanned, 'Validator was not banned');
      }
    });
  });
})