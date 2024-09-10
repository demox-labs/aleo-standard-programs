import { after, before, describe, it } from "node:test";
import * as Aleo from "@demox-labs/aleo-sdk";
import { pondoDependencyTree, pondoPrograms } from "../../compiledPrograms";
import { getMappingValue, getProgram, getPublicTransactionsForProgram, isTransactionAccepted } from "../../aleo/client";
import {
  ADDRESS,
  MULTI_SIG_ADDRESS_0,
  MULTI_SIG_ADDRESS_1,
  MULTI_SIG_ADDRESS_2,
  MULTI_SIG_PRIVATE_KEY_0,
  MULTI_SIG_PRIVATE_KEY_1,
  MULTI_SIG_PRIVATE_KEY_2,
  NETWORK, PRIVATE_KEY
} from "../../constants";
import { ExecuteTransaction } from "../../aleo/types";
import { killAuthorizePool, submitTransaction } from "../../aleo/execute";
import { resolveImports } from "../../aleo/deploy";
import assert from "node:assert";
import { formatAleoString } from "../../util";
import {
  extractValidatorAddressAndProgramName,
  getOracleProposalTransactionHistory,
  REFERENCE_DELEGATOR_PROGRAM
} from "../../protocol/referenceDelegators";

// Use oracleNonUpdate save state for the ledger
describe('oracleNonUpdate', async () => {
  let oracleProgram: string;
  let delegators: string[];

  const oracleId: string = pondoPrograms.find((program) =>
    program.includes('validator_oracle')
  )!;

  before(async () => {
    oracleProgram = await getProgram(oracleId);

    const transactionHistory = await getPublicTransactionsForProgram(oracleId, 'add_delegator', 0) as ExecuteTransaction[];
    delegators = transactionHistory.map(tx => tx.transaction.execution.transitions[0].inputs[0].value);
    console.log('Delegators:', JSON.stringify(delegators));
  });

  after(async () => {
    await killAuthorizePool();
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

  describe('multi-sig', async () => {
    // Get a random bigint to use as the requestId
    let requestId = BigInt(Math.floor(Math.random() * 1_000_000_000));

    it('add_control_address should succeed', async () => {
      // Random address to add as a control address
      const address = 'aleo1uhnc88hr8wl538cwufh3ce5czctspm2852rts4xyrhj4hav83vysy4us43';
      const addressHash = Aleo.Plaintext.fromString(NETWORK!, address).hashBhp256();
      const plaintextString = `{
        arg: ${addressHash},
        op_type: 0u8,
        request_id: ${requestId.toString()}u64
      }`;
      const hashedField = Aleo.Plaintext.fromString(NETWORK!, plaintextString).hashBhp256();

      // Sign the hash with the oracle private keys
      const signature0 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_0!, hashedField).to_string();
      const signature1 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_1!, hashedField).to_string();
      const signature2 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_2!, hashedField).to_string();

      let imports = pondoDependencyTree[oracleId];
      let resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        oracleProgram,
        'add_control_address',
        [
          address,
          signature0,
          MULTI_SIG_ADDRESS_0!,
          signature1,
          MULTI_SIG_ADDRESS_1!,
          signature2,
          MULTI_SIG_ADDRESS_2!,
          `${requestId.toString()}u64`
        ],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, 'add_control_address was rejected, but should have been accepted');
    });

    it('add_control_address should fail, duplicate requestId', async () => {
      // Random address to add as a control address
      const address = 'aleo1gg58mwncplp93aecr2c2qr70phh06l8st3aetzx6e0vfjx0k6sgq6appp6';
      const addressHash = Aleo.Plaintext.fromString(NETWORK!, address).hashBhp256();
      const plaintextString = `{
        arg: ${addressHash},
        op_type: 0u8,
        request_id: ${requestId.toString()}u64
      }`;
      const hashedField = Aleo.Plaintext.fromString(NETWORK!, plaintextString).hashBhp256();

      // Sign the hash with the oracle private keys
      const signature0 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_0!, hashedField).to_string();
      const signature1 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_1!, hashedField).to_string();
      const signature2 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_2!, hashedField).to_string();

      let imports = pondoDependencyTree[oracleId];
      let resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        oracleProgram,
        'add_control_address',
        [
          address,
          signature0,
          MULTI_SIG_ADDRESS_0!,
          signature1,
          MULTI_SIG_ADDRESS_1!,
          signature2,
          MULTI_SIG_ADDRESS_2!,
          `${requestId.toString()}u64`
        ],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'add_control_address was accepted, but should have been accepted');
    });

    it('add_control_address should fail, invalid signer', async () => {
      requestId = BigInt(Math.floor(Math.random() * 1_000_000_000));

      // Random address to add as a control address
      const address = 'aleo1gg58mwncplp93aecr2c2qr70phh06l8st3aetzx6e0vfjx0k6sgq6appp6';
      const addressHash = Aleo.Plaintext.fromString(NETWORK!, address).hashBhp256();
      const plaintextString = `{
        arg: ${addressHash},
        op_type: 0u8,
        request_id: ${requestId.toString()}u64
      }`;
      const hashedField = Aleo.Plaintext.fromString(NETWORK!, plaintextString).hashBhp256();

      // Sign the hash with the oracle private keys
      const signature0 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_0!, hashedField).to_string();
      const signature1 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_1!, hashedField).to_string();
      const signature2 = Aleo.Signature.sign_plaintext(NETWORK!, PRIVATE_KEY!, hashedField).to_string();

      let imports = pondoDependencyTree[oracleId];
      let resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        oracleProgram,
        'add_control_address',
        [
          address,
          signature0,
          MULTI_SIG_ADDRESS_0!,
          signature1,
          MULTI_SIG_ADDRESS_1!,
          signature2,
          ADDRESS!,
          `${requestId.toString()}u64`
        ],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'add_control_address was accepted, but should have been accepted');
    });

    it('add_control_address should fail, duplicate signer', async () => {
      requestId = BigInt(Math.floor(Math.random() * 1_000_000_000));

      // Random address to add as a control address
      const address = 'aleo1gg58mwncplp93aecr2c2qr70phh06l8st3aetzx6e0vfjx0k6sgq6appp6';
      const addressHash = Aleo.Plaintext.fromString(NETWORK!, address).hashBhp256();
      const plaintextString = `{
        arg: ${addressHash},
        op_type: 0u8,
        request_id: ${requestId.toString()}u64
      }`;
      const hashedField = Aleo.Plaintext.fromString(NETWORK!, plaintextString).hashBhp256();

      // Sign the hash with the oracle private keys
      const signature0 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_0!, hashedField).to_string();
      const signature1 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_1!, hashedField).to_string();
      const signature2 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_1!, hashedField).to_string();

      let imports = pondoDependencyTree[oracleId];
      let resolvedImports = await resolveImports(imports);

      try {
        await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          oracleProgram,
          'add_control_address',
          [
            address,
            signature0,
            MULTI_SIG_ADDRESS_0!,
            signature1,
            MULTI_SIG_ADDRESS_1!,
            signature2,
            MULTI_SIG_ADDRESS_1!,
            `${requestId.toString()}u64`
          ],
          4,
          undefined,
          resolvedImports
        );
        assert(false, 'add_control_address was successfully broadcasted, but should have failed');
      } catch (err) {
        console.log('Failed to generate transaction as expected');
      }
    });
  });

  describe('reference delegator', async () => {
    // Transfer credits to the multi-sig
    it('should be able to transfer credits to the multi-sig', async () => {
      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        Aleo.Program.getCreditsProgram(NETWORK!).toString(),
        'transfer_public',
        [MULTI_SIG_ADDRESS_0!, '250000000u64'], // 250 credits
        4,
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, 'transfer_public was rejected, but should have been accepted');
    });

    it('removing less than full bonded balance should fail', async () => {
      const transactionHistory = await getOracleProposalTransactionHistory();
      const delegatorsAndValidators = transactionHistory.map(tx => extractValidatorAddressAndProgramName(tx));
      const { programName } = delegatorsAndValidators[0];
      const programCode = await getProgram(programName!);

      let imports = pondoDependencyTree[REFERENCE_DELEGATOR_PROGRAM!];
      let resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        programCode,
        'remove',
        ['1u64'], // 1000 microcredits, not enough to fully unbond
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'remove_reference_delegator with remaining bonded balance was accepted, but should have been rejected');
    });

    it('non-admin removing reference delegator should fail', async () => {
      const transactionHistory = await getOracleProposalTransactionHistory();
      const delegatorsAndValidators = transactionHistory.map(tx => extractValidatorAddressAndProgramName(tx));
      const { programName } = delegatorsAndValidators[0];
      const programCode = await getProgram(programName!);

      let imports = pondoDependencyTree[REFERENCE_DELEGATOR_PROGRAM!];
      let resolvedImports = await resolveImports(imports);

      try {
        await submitTransaction(
          NETWORK!,
          MULTI_SIG_ADDRESS_0!,
          programCode,
          'remove',
          ['10_000_000_000u64'], // 1000 microcredits, not enough to fully unbond
          4,
          undefined,
          resolvedImports
        );
        assert(false, 'remove_reference_delegator with wrong validator, but should have been rejected');
      } catch (err) {
        console.log('Failed to generate transaction as expected');
      }
    });

    it('should be able to remove a reference delegator', async () => {
      const transactionHistory = await getOracleProposalTransactionHistory();
      const delegatorsAndValidators = transactionHistory.map(tx => extractValidatorAddressAndProgramName(tx));
      const { programName } = delegatorsAndValidators[0];
      const programCode = await getProgram(programName!);

      let imports = pondoDependencyTree[REFERENCE_DELEGATOR_PROGRAM!];
      let resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        programCode,
        'remove',
        ['10_000_000_000u64'], // 10_000 credits
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, 'remove_reference_delegator was rejected, but should have been accepted');
    });
  });
})