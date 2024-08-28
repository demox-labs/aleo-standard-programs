import { after, before, describe, it } from "node:test";
import * as Aleo from "@demox-labs/aleo-sdk";
import { pondoDependencyTree, pondoPrograms } from "../../compiledPrograms";
import { airDropCredits, getMappingValue, getProgram, isTransactionAccepted } from "../../aleo/client";
import {
  ADDRESS,
  NETWORK, PRIVATE_KEY
} from "../../constants";
import { killAuthorizePool, submitTransaction } from "../../aleo/execute";
import { resolveImports } from "../../aleo/deploy";
import { getPondoDelegatorStates } from "../../protocol/runProtocol";
import assert from "node:assert";
import { formatAleoString } from "../../util";


// Use the oracleUpdate saved ledger state
describe("State Machine Tests", () => {
  let pondoDelegatorProgram1: string;
  let pondoDelegatorProgram2: string;
  let pondoDelegatorProgram3: string;
  let pondoDelegatorProgram4: string;
  let pondoDelegatorProgram5: string;

  let pondoDelegatorAddress1: string;
  let pondoDelegatorAddress2: string;
  let pondoDelegatorAddress3: string;
  let pondoDelegatorAddress4: string;
  let pondoDelegatorAddress5: string;

  let pondoDelegatorStates: string[];
  

  const pondoDelegatorId1: string = pondoPrograms.find((program) =>
    program.includes('pondo_delegator1')
  )!;
  const pondoDelegatorId2: string = pondoPrograms.find((program) =>
    program.includes('pondo_delegator2')
  )!;
  const pondoDelegatorId3: string = pondoPrograms.find((program) =>
    program.includes('pondo_delegator3')
  )!;
  const pondoDelegatorId4: string = pondoPrograms.find((program) =>
    program.includes('pondo_delegator4')
  )!;
  const pondoDelegatorId5: string = pondoPrograms.find((program) =>
    program.includes('pondo_delegator5')
  )!;
  const oracleId: string = pondoPrograms.find((program) =>
    program.includes('pondo_oracle')
  )!;
  const pondoCoreProtocolId: string = pondoPrograms.find((program) =>
    program.includes('pondo_core_protocol')
  )!;

  before(async () => {
    pondoDelegatorProgram1 = await getProgram(pondoDelegatorId1);
    pondoDelegatorProgram2 = await getProgram(pondoDelegatorId2);
    pondoDelegatorProgram3 = await getProgram(pondoDelegatorId3);
    pondoDelegatorProgram4 = await getProgram(pondoDelegatorId4);
    pondoDelegatorProgram5 = await getProgram(pondoDelegatorId5);

    pondoDelegatorAddress1 = Aleo.Program.fromString(NETWORK!, pondoDelegatorProgram1).toAddress();
    pondoDelegatorAddress2 = Aleo.Program.fromString(NETWORK!, pondoDelegatorProgram2).toAddress();
    pondoDelegatorAddress3 = Aleo.Program.fromString(NETWORK!, pondoDelegatorProgram3).toAddress();
    pondoDelegatorAddress4 = Aleo.Program.fromString(NETWORK!, pondoDelegatorProgram4).toAddress();
    pondoDelegatorAddress5 = Aleo.Program.fromString(NETWORK!, pondoDelegatorProgram5).toAddress();

    pondoDelegatorStates = await getPondoDelegatorStates();
  });

  after(async () => {
    await killAuthorizePool();
  });

  describe("Pondo delegators in protocol 'earn' state", () => {
    it('Should not be able to unbond the pondo delegator in UNBOND_NOT_ALLOWED', async () => {
      const bondedState = JSON.parse(formatAleoString(await getMappingValue(pondoDelegatorAddress1, 'credits.aleo', 'bonded')));
      
      const imports = pondoDependencyTree[pondoDelegatorId1];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram1,
        'unbond',
        [bondedState.microcredits], // 10_000 credits
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'unbond delegator was accepted, but should have been rejected');
    });

    it('Should not be able to call terminal_state in UNBOND_NOT_ALLOWED with bonded state', async () => {
      const imports = pondoDependencyTree[pondoDelegatorId1];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram1,
        'terminal_state',
        [],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'terminal_state was accepted, but should have been rejected');
    });

    it('Should not be able to call terminal_state in BOND_ALLOWED', async () => {
      const imports = pondoDependencyTree[pondoDelegatorId5];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram5,
        'terminal_state',
        [],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'terminal_state was accepted, but should have been rejected');
    });

    it('Should not able able to call bond_failed when in BOND_ALLOWED and validator is in committee and open to delegators', async () => {
      const imports = pondoDependencyTree[pondoDelegatorId5];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram5,
        'bond_failed',
        [],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'bond_failed was accepted, but should have been rejected');
    });

    it('Should not able able to call bond_failed when in UNBOND_NOT_ALLOWED', async () => {
      const imports = pondoDependencyTree[pondoDelegatorId1];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram1,
        'bond_failed',
        [],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'bond_failed was accepted, but should have been rejected');
    });

    it('Should be able to bond from UNBOND_NOT_ALLOWED if given more credits', async () => {
      const amount = BigInt(10_100_000_000);
      const txResult = await airDropCredits(pondoDelegatorAddress1, amount);
      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, 'transfer_public was rejected, but should have been accepted');

      const validatorState = JSON.parse(formatAleoString(await getMappingValue('0u8', pondoDelegatorId1, 'validator_mapping')));
      const validator = validatorState.validator;

      /* 
      * Should not be able to bond while leaving MAX_TOLERANCE in account state
      */
      const maxTolerance = BigInt(1_000_000)

      const imports = pondoDependencyTree[pondoDelegatorId1];
      const resolvedImports = await resolveImports(imports);

      const txResult2 = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram1,
        'bond',
        [validator, `${amount - maxTolerance - BigInt(1)}u64`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted2 = await isTransactionAccepted(txResult2);
      assert(!wasAccepted2, 'insuffient bond was accepted, but should have been rejected');

      /*
      * Should not be able to bond to wrong validator
      */
      const txResult3 = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram1,
        'bond',
        ['aleo1mmxcsqsak6k4assunqgkz2y9exg5s90cru488s636yc9ydzn7q9sk6rju7', `${amount}u64`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted3 = await isTransactionAccepted(txResult3);
      assert(!wasAccepted3, 'wrong validator bond was accepted, but should have been rejected');

      /*
      * Should be able to bond when given enough credits
      */
      const txResult4 = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram1,
        'bond',
        [validator, `${amount - maxTolerance + BigInt(1)}u64`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted4 = await isTransactionAccepted(txResult4);
      assert(wasAccepted4, 'bond was rejected, but should have been accepted');
    });

    it('Pondo delegator can call bond failed when validator is closed to delegators', async () => {
      /**
       * Set validator state to closed to delegators
       */
      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        Aleo.Program.getCreditsProgram(NETWORK!).toString(),
        'set_validator_state',
        ['false'],
        4
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, 'set_validator_state was rejected, but should have been accepted');

      /**
       * Call bond_failed as validator is closed to delegators
       */
      const imports = pondoDependencyTree[pondoDelegatorId5];
      const resolvedImports = await resolveImports(imports);

      const txResult1 = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram5,
        'bond_failed',
        [],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted1 = await isTransactionAccepted(txResult1);
      assert(wasAccepted1, 'bond_failed was rejected, but should have been accepted');
      const newState = await getMappingValue('0u8', pondoDelegatorId5, 'state_mapping');
      assert(newState == '4u8', 'state not set to terminal');
      const isBanned = await getMappingValue(ADDRESS!, pondoDelegatorId5, 'banned_validators');
      assert(isBanned == 'true', 'validator not banned');

      /**
       * Call ban_validator with wrong address, should be rejected
       */
      const txResult2 = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram5,
        'ban_validator',
        ['aleo1mmxcsqsak6k4assunqgkz2y9exg5s90cru488s636yc9ydzn7q9sk6rju7'],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted2 = await isTransactionAccepted(txResult2);
      assert(!wasAccepted2, 'ban_validator was accepted, but should have been rejected');

      /**
       * Call ban_validator with correct address, should be accepted
       */
      const txResult3 = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram5,
        'ban_validator',
        [ADDRESS!],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted3 = await isTransactionAccepted(txResult3);
      assert(wasAccepted3, 'ban_validator was rejected, but should have been accepted');
      const isValidatorBanned = await getMappingValue(ADDRESS!, oracleId, 'banned_validators');
      assert(isValidatorBanned, 'Validator was not banned');
    });
  });

  describe('Calls to Pondo Delegators from Pondo Core Protocol', () => {
    it('Wrong address should not be able to call initialize', async () => {
      const imports = pondoDependencyTree[pondoDelegatorId1];
      const resolvedImports = await resolveImports(imports);

      try {
        await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          pondoDelegatorProgram1,
          'initialize',
          [],
          4,
          undefined,
          resolvedImports
        );
        assert(false, 'initialize was accepted, but should have been rejected');
      } catch (err) {
        console.log('initialize was rejected as expected');
      }
    });

    it('Wrong address should not be able to call prep_rebalance', async () => {
      const imports = pondoDependencyTree[pondoDelegatorId1];
      const resolvedImports = await resolveImports(imports);

      try {
        await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          pondoDelegatorProgram1,
          'prep_rebalance',
          [],
          4,
          undefined,
          resolvedImports
        );
        assert(false, 'prep_rebalance was accepted, but should have been rejected');
      } catch (err) {
        console.log('prep_rebalance was rejected as expected');
      }
    });

    it('Wrong address should not be able to call set validator', async () => {
      const imports = pondoDependencyTree[pondoDelegatorId1];
      const resolvedImports = await resolveImports(imports);

      try {
        await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          pondoDelegatorProgram1,
          'set_validator',
          ['aleo1mmxcsqsak6k4assunqgkz2y9exg5s90cru488s636yc9ydzn7q9sk6rju7', '5u8'],
          4,
          undefined,
          resolvedImports
        );
        assert(false, 'set_validator was accepted, but should have been rejected');
      } catch (err) {
        console.log('set_validator was rejected as expected');
      }
    });
  });

  describe('Pondo Core protocol', async () => {
    it('Should not be able to call prep_rebalance outside of the rebalance period', async () => {
      const imports = pondoDependencyTree[pondoCoreProtocolId];
      const resolvedImports = await resolveImports(imports);
      const pondoCoreProtocolProgram = await getProgram(pondoCoreProtocolId);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoCoreProtocolProgram,
        'prep_rebalance',
        [],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'prep_rebalance was accepted, but should have been rejected');
    });
  });
});