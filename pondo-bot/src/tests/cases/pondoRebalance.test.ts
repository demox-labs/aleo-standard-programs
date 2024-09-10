import { after, before, describe, it } from "node:test";
import * as Aleo from "@demox-labs/aleo-sdk";
import { pondoDependencyTree, pondoPrograms } from "../../compiledPrograms";
import { airDropCredits, getMappingValue, getProgram, getPublicBalance, isTransactionAccepted } from "../../aleo/client";
import {
  ADDRESS,
  NETWORK, PRIVATE_KEY,
  VERSION
} from "../../constants";
import { killAuthorizePool, submitTransaction } from "../../aleo/execute";
import { resolveImports } from "../../aleo/deploy";
import { determineRebalanceAmounts, getPondoDelegatorStates, getTopValidators } from "../../protocol/runProtocol";
import assert from "node:assert";
import { formatAleoString } from "../../util";

/**
 * Aleo Validator Private Keys and Addresses
 * Private Key = APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH, Address = aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px
 * Private Key = APrivateKey1zkp2RWGDcde3efb89rjhME1VYA8QMxcxep5DShNBR6n8Yjh, Address = aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t
 * Private Key = APrivateKey1zkp2GUmKbVsuc1NSj28pa1WTQuZaK5f1DQJAT6vPcHyWokG, Address = aleo1ashyu96tjwe63u0gtnnv8z5lhapdu4l5pjsl2kha7fv7hvz2eqxs5dz0rg
 * Private Key = APrivateKey1zkpBjpEgLo4arVUkQmcLdKQMiAKGaHAQVVwmF8HQby8vdYs, Address = aleo12ux3gdauck0v60westgcpqj7v8rrcr3v346e4jtq04q7kkt22czsh808v2
 * Private Key = APrivateKey1zkp3J6rRrDEDKAMMzSQmkBqd3vPbjp4XTyH7oMKFn7eVFwf, Address = aleo1p9sg8gapg22p3j42tang7c8kqzp4lhe6mg77gx32yys2a5y7pq9sxh6wrd
 * Private Key = APrivateKey1zkp6w2DLUBBAGTHUK4JWqFjEHvqhTAWDB5Ex3XNGByFsWUh, Address = aleo1l4z0j5cn5s6u6tpuqcj6anh30uaxkdfzatt9seap0atjcqk6nq9qnm9eqf
 * Private Key = APrivateKey1zkpEBzoLNhxVp6nMPoCHGRPudASsbCScHCGDe6waPRm87V1, Address = aleo1aukf3jeec42ssttmq964udw0efyzt77hc4ne93upsu2plgz0muqsg62t68
 * Private Key = APrivateKey1zkpBZ9vQGe1VtpSXnhyrzp9XxMfKtY3cPopFC9ZB6EYFays, Address = aleo1y4s2sjw03lkg3htlcpg683ec2j9waprljc657tfu4wl6sd67juqqvrg04a
 * Private Key = APrivateKey1zkpHqcqMzArwGX3to2x1bDVFDxo7uEWL4FGVKnstphnybZq, Address = aleo1xh2lnryvtzxcvlz8zzgranu6yldaq5257cac44de4v0aasgu45yq3yk3yv
 * Private Key = APrivateKey1zkp6QYrYZGxnDmwvQSg7Nw6Ye6WUeXHvs3wtj5Xa9LArc7p, Address = aleo19ljgqpwy98l9sz4f6ly028rl8j8r4grlnetp9e2nwt2xwyfawuxq5yd0tj
 * Private Key = APrivateKey1zkp9AZwPkk4gYUCRtkaX5ZSfBymToB7azBJHmJkSvfyfcn4, Address = aleo1s2tyzgqr9p95sxtj9t0s38cmz9pa26edxp4nv0s8mk3tmdzmqgzsctqhxg
 * Private Key = APrivateKey1zkp2jCDeE8bPnKXKDrXcKaGQRVfoZ1WFUiVorbTwDrEv6Cg, Address = aleo1sufp275hshd7srrkxwdf7yczmc89em6e5ly933ftnaz64jlq8qysnuz88d
 * Private Key = APrivateKey1zkp7St3ztS3cag91PpyQbBffTc8YLmigCGB97Sf6bkQwvpg, Address = aleo1mwcjkpm5hpqapnsyddnwtmd873lz2kpp6uqayyuvstr4ky2ycv9sglne5m
 * Private Key = APrivateKey1zkpGcGacddZtDLRc8RM4cZb6cm3GoUwpJjSCQcf2mfeY6Do, Address = aleo1khukq9nkx5mq3eqfm5p68g4855ewqwg7mk0rn6ysfru73krvfg8qfvc4dt
 * Private Key = APrivateKey1zkp4ZXEtPR4VY7vjkCihYcSZxAn68qhr6gTdw8br95vvPFe, Address = aleo1masuagxaduf9ne0xqvct06gpf2tmmxzcgq5w2el3allhu9dsv5pskk7wvm
 * Private Key = APrivateKey1zkpH7XEPZDUrEBnMtq1JyCR6ipwjFQ5jiHnTCe7Z7heyxff, Address = aleo10w89dpq8tqzeghq35nxtk2k66pskxm8vhrdl3vx6r4j9hkgf2qqs3936q6
 * Private Key = APrivateKey1zkpA9S3Epe8mzDnMuAXBmdxyRXgB8yp7PuMrs2teh8xNcVe, Address = aleo1sfu3p7g8rppusft8re7v88ujjhz5sx6pwc5609vdgnr0pdmhkyyqrrsjkm
 * Private Key = APrivateKey1zkp5neB5iVnXMTrR6y8P6wndGE9xWhQzBf3Qoht9yQ17a5o, Address = aleo1ry0wc384qthrdna5xtzsjqvxg42zwfezpna6keeqa6netv3qmyxszhh8z8
 * Private Key = APrivateKey1zkp4u1cUbvkC2r3n3Gz3eNzth1TvffGbFeLgaYyk8efsT4e, Address = aleo1ps4dhhfn5vgfj9lyjra2xnv9a8cc2a2l9jnr585h6tvj4gnlqgfqyszcv3
 * Private Key = APrivateKey1zkpBs9zc9FChKZAkoHsf1TERcd9EQhe43NS1xuNSnyJSH1K, Address = aleo15a34a3dtpj879frvndndp0605vqnxsfdedwyrtu5u6xfd7fv5ufqryavc4
 */

/*
To create this ledger state we ran:
snarkos developer execute "credits.aleo" unbond_public "aleo13cteqg5gr0j0txcukdtn264fnahzx9mqc3v5xq05265arv29rsys5zpg32" "400000u64" --private-key "APrivateKey1zkpBjpEgLo4arVUkQmcLdKQMiAKGaHAQVVwmF8HQby8vdYs"  --query "http://127.0.0.1:3039" --broadcast "http://127.0.0.1:3039/testnet/transaction/broadcast" --network 1
snarkos developer execute "credits.aleo" unbond_public "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t" "37413837858492u64" --private-key "APrivateKey1zkp2RWGDcde3efb89rjhME1VYA8QMxcxep5DShNBR6n8Yjh"  --query "http://127.0.0.1:3039" --broadcast "http://127.0.0.1:3039/testnet/transaction/broadcast" --network 1
snarkos developer execute "credits.aleo" unbond_public "aleo19ljgqpwy98l9sz4f6ly028rl8j8r4grlnetp9e2nwt2xwyfawuxq5yd0tj" "37413837858492u64" --private-key "APrivateKey1zkp6QYrYZGxnDmwvQSg7Nw6Ye6WUeXHvs3wtj5Xa9LArc7p"  --query "http://127.0.0.1:3039" --broadcast "http://127.0.0.1:3039/testnet/transaction/broadcast" --network 1
snarkos developer execute "credits.aleo" unbond_public "aleo1p9sg8gapg22p3j42tang7c8kqzp4lhe6mg77gx32yys2a5y7pq9sxh6wrd" "37413837858492u64" --private-key "APrivateKey1zkp3J6rRrDEDKAMMzSQmkBqd3vPbjp4XTyH7oMKFn7eVFwf"  --query "http://127.0.0.1:3039" --broadcast "http://127.0.0.1:3039/testnet/transaction/broadcast" --network 1
*/


// Use the pondoRebalance saved ledger state
describe("Rebalance State Machine Tests", () => {
  let pondoCoreProtocolProgram: string;
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
    program.includes('delegator1')
  )!;
  const pondoDelegatorId2: string = pondoPrograms.find((program) =>
    program.includes('delegator2')
  )!;
  const pondoDelegatorId3: string = pondoPrograms.find((program) =>
    program.includes('delegator3')
  )!;
  const pondoDelegatorId4: string = pondoPrograms.find((program) =>
    program.includes('delegator4')
  )!;
  const pondoDelegatorId5: string = pondoPrograms.find((program) =>
    program.includes('delegator5')
  )!;
  const oracleId: string = pondoPrograms.find((program) =>
    program.includes('validator_oracle')
  )!;
  const pondoCoreProtocolId: string = pondoPrograms.find((program) =>
    program.includes('pondo_protocol')
  )!;

  const TOLERANCE = BigInt(1_000_000);
  let pondoDelegators: { delegatorId: string, delegatorProgram: string, delegatorAddress: string }[];

  before(async () => {
    pondoCoreProtocolProgram = await getProgram(pondoCoreProtocolId);
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

    pondoDelegators = [
      { delegatorId: pondoDelegatorId1, delegatorProgram: pondoDelegatorProgram1, delegatorAddress: pondoDelegatorAddress1 },
      { delegatorId: pondoDelegatorId2, delegatorProgram: pondoDelegatorProgram2, delegatorAddress: pondoDelegatorAddress2 },
      { delegatorId: pondoDelegatorId3, delegatorProgram: pondoDelegatorProgram3, delegatorAddress: pondoDelegatorAddress3 },
      { delegatorId: pondoDelegatorId4, delegatorProgram: pondoDelegatorProgram4, delegatorAddress: pondoDelegatorAddress4 },
      { delegatorId: pondoDelegatorId5, delegatorProgram: pondoDelegatorProgram5, delegatorAddress: pondoDelegatorAddress5 },
    ]
  });

  after(async () => {
    await killAuthorizePool();
  });

  describe("Pondo Core Retrieve Credits", () => {
    it("Pondo delegator 1 should not be able to bond more credits in UNBOND_ALLOWED state", async () => {
      // Air drop credits to bond
      const amount = 10_000_000_000n;
      await airDropCredits(pondoDelegatorAddress1, amount);

      const validatorState = await getMappingValue('0u8', pondoDelegatorId1, 'validator_mapping');
      const validator = JSON.parse(formatAleoString(validatorState)).validator;

      const imports = pondoDependencyTree[pondoDelegatorId1];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram1,
        'bond',
        [validator, `${amount}u64`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'bond was accepted, but should have been rejected');
    });

    it("Pondo delegator 1 should be able to reach terminal state after being forcibly unbond", async () => {
      const imports = pondoDependencyTree[pondoDelegatorId1];
      const resolvedImports = await resolveImports(imports);

      /**
       * Try to go to terminal but should fail without claim_unbond_public first
       */
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

      /**
       * claim_unbond_public should always succeed given an unbonding balance that has reached required block height
       */
      const txResult1 = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        Aleo.Program.getCreditsProgram(NETWORK!).toString(),
        'claim_unbond_public',
        [pondoDelegatorAddress1],
        4
      );

      const wasAccepted1 = await isTransactionAccepted(txResult1);
      assert(wasAccepted1, 'claim_unbond_public was rejected, but should have been accepted');

      const delegatorState = await getMappingValue('0u8', pondoDelegatorId1, 'state_mapping');
      assert(delegatorState === '2u8', 'Delegator not still in UNBOND_ALLOWED');

      /**
       * Try to go to terminal state again, should succeed
       */

      const txResult2 = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram1,
        'terminal_state',
        [],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted2 = await isTransactionAccepted(txResult2);
      assert(wasAccepted2, 'terminal_state was rejected, but should have been accepted');
      const delegatorState2 = await getMappingValue('0u8', pondoDelegatorId1, 'state_mapping');
      assert(delegatorState2 === '4u8', 'Delegator did not reach TERMINAL_STATE');
    });

    it('should not be able to call retrieve credits without all delegators being in terminal state', async () => {
      let delegatorBalances: bigint[] = [];
      for (let index = 1; index < 6; index++) {
        const delegatorProgramId = `delegator${index}${VERSION}.aleo`;
        const delegatorProgram = await getProgram(delegatorProgramId);
        const delegatorProgramAddress = Aleo.Program.fromString(
          NETWORK!,
          delegatorProgram
        ).toAddress();
        const delegatorBalance = await getPublicBalance(delegatorProgramAddress);
        delegatorBalances.push(delegatorBalance);
      }
      const owedCommission = await getMappingValue(
        '0u8',
        pondoCoreProtocolId,
        'owed_commission'
      );
      const inputs = [
        `[${delegatorBalances.map((balance) => `${balance}u64`).join(',')}]`,
        owedCommission,
      ];

      const imports = pondoDependencyTree[pondoCoreProtocolId];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoCoreProtocolProgram,
        'rebalance_retrieve_credits',
        inputs,
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'rebalance_retrieve_credits was accepted, but should have been rejected');
    });

    it('all unbonding delegators should be to reach terminal state', async () => {
      let testCases = [
        { delegatorId: pondoDelegatorId2, delegatorProgram: pondoDelegatorProgram2, delegatorAddress: pondoDelegatorAddress2 },
        { delegatorId: pondoDelegatorId3, delegatorProgram: pondoDelegatorProgram3, delegatorAddress: pondoDelegatorAddress3 },
        { delegatorId: pondoDelegatorId4, delegatorProgram: pondoDelegatorProgram4, delegatorAddress: pondoDelegatorAddress4 },
      ]

      for (let testCase of testCases) {
        const delegatorId = testCase.delegatorId;
        const delegatorProgram = testCase.delegatorProgram;
        const delegatorAddress = testCase.delegatorAddress;

        /**
         * Air drop credits and ensure that the delegator is unable to bond more credits
         */
        const amount = 10_000_000_000n;
        await airDropCredits(pondoDelegatorAddress1, amount);

        const validatorState = await getMappingValue('0u8', delegatorId, 'validator_mapping');
        const validator = JSON.parse(formatAleoString(validatorState)).validator;

        const imports = pondoDependencyTree[pondoDelegatorId1];
        const resolvedImports = await resolveImports(imports);

        const bondResult = await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          delegatorProgram,
          'bond',
          [validator, `${amount}u64`],
          4,
          undefined,
          resolvedImports
        );

        const bondAccepted = await isTransactionAccepted(bondResult);
        assert(!bondAccepted, 'bond was accepted, but should have been rejected');

        /**
         * Try to go to terminal but should fail without claim_unbond_public first
         */
        const txResult = await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          delegatorProgram,
          'terminal_state',
          [],
          4,
          undefined,
          resolvedImports
        );

        const wasAccepted = await isTransactionAccepted(txResult);
        assert(!wasAccepted, 'terminal_state was accepted, but should have been rejected');

        /**
         * claim_unbond_public should always succeed given an unbonding balance that has reached required block height
         */
        const txResult1 = await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          Aleo.Program.getCreditsProgram(NETWORK!).toString(),
          'claim_unbond_public',
          [delegatorAddress],
          4
        );

        const wasAccepted1 = await isTransactionAccepted(txResult1);
        assert(wasAccepted1, 'claim_unbond_public was rejected, but should have been accepted');

        const delegatorState = await getMappingValue('0u8', delegatorId, 'state_mapping');
        assert(delegatorState === '3u8', 'Delegator not still in UNBONDING');

        /**
         * Try to go to terminal state again, should succeed
         */

        const txResult2 = await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          delegatorProgram,
          'terminal_state',
          [],
          4,
          undefined,
          resolvedImports
        );

        const wasAccepted2 = await isTransactionAccepted(txResult2);
        assert(wasAccepted2, 'terminal_state was rejected, but should have been accepted');
        const delegatorState2 = await getMappingValue('0u8', delegatorId, 'state_mapping');
        assert(delegatorState2 === '4u8', 'Delegator did not reach TERMINAL_STATE');
      }
    });

    it('should be able to call retrieve credits after all delegators are in terminal state', async () => {
      let delegatorBalances: bigint[] = [];
      for (let index = 0; index < pondoDelegators.length; index++) {
        const delegatorProgramAddress = pondoDelegators[index].delegatorAddress;
        const delegatorBalance = await getPublicBalance(delegatorProgramAddress);
        delegatorBalances.push(delegatorBalance);
      }
      const owedCommission = BigInt((await getMappingValue(
        '0u8',
        pondoCoreProtocolId,
        'owed_commission'
      )).slice(0, -3));
      const imports = pondoDependencyTree[pondoCoreProtocolId];
      const resolvedImports = await resolveImports(imports);

      /**
       * Retrieve credits should fail if not sufficient balance is retrieved
       */

      let insufficientTransferInputs = [
        `[${delegatorBalances.map((balance) => `${balance - TOLERANCE - BigInt(1)}u64`).join(',')}]`,
        `${owedCommission.toString()}u64`,
      ];

      const insufficientTransferResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoCoreProtocolProgram,
        'rebalance_retrieve_credits',
        insufficientTransferInputs,
        4,
        undefined,
        resolvedImports
      );

      const insufficientTransferAccepted = await isTransactionAccepted(insufficientTransferResult);
      assert(!insufficientTransferAccepted, 'rebalance_retrieve_credits was accepted, but should have been rejected due to insufficient balance');

      /**
       * Retrieve credits should fail if insufficient commission is retrieved
       */

      let insufficientCommissionInputs = [
        `[${delegatorBalances.map((balance) => `${balance}u64`).join(',')}]`,
        `${owedCommission * BigInt(96) / BigInt(100)}u64`,
      ];

      const insufficientCommissionResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoCoreProtocolProgram,
        'rebalance_retrieve_credits',
        insufficientCommissionInputs,
        4,
        undefined,
        resolvedImports
      );

      const insufficientCommissionAccepted = await isTransactionAccepted(insufficientCommissionResult);
      assert(!insufficientCommissionAccepted, 'rebalance_retrieve_credits was accepted, but should have been rejected due to insufficient commission');

      /**
       * Retrieve credits should fail if too much commission is retrieved
       */

      let tooMuchCommissionInputs = [
        `[${delegatorBalances.map((balance) => `${balance}u64`).join(',')}]`,
        `${owedCommission * BigInt(100_000_000)}u64`,
      ];

      const tooMuchCommissionResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoCoreProtocolProgram,
        'rebalance_retrieve_credits',
        tooMuchCommissionInputs,
        4,
        undefined,
        resolvedImports
      );

      const tooMuchCommissionAccepted = await isTransactionAccepted(tooMuchCommissionResult);
      assert(!tooMuchCommissionAccepted, `rebalance_retrieve_credits was accepted, but should have been rejected due to too much commission: ${owedCommission}`);

      /**
       * Retrieve credits should succeed given all delegators are in terminal state
       */

      let inputs = [
        `[${delegatorBalances.map((balance) => `${balance - TOLERANCE + BigInt(1)}u64`).join(',')}]`,
        `${owedCommission + BigInt(1)}u64`,
      ];

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoCoreProtocolProgram,
        'rebalance_retrieve_credits',
        inputs,
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, 'rebalance_retrieve_credits was rejected, but should have been accepted');

      for (let index = 0; index < pondoDelegators.length; index++) {
        const delegatorProgramAddress = pondoDelegators[index].delegatorAddress;
        const delegatorBalance = await getPublicBalance(delegatorProgramAddress);
        assert(delegatorBalance <= TOLERANCE, 'Delegator balance not below tolerance');
      }

      const protocolState = await getMappingValue('0u8', pondoCoreProtocolId, 'protocol_state');
      assert(protocolState === '2u8', 'Protocol state not in REBALANCING');
    });
  });

  describe('Pondo Core Redistribute', () => {
    it('should be able to call redistribute', async () => {
      const protocolState = await getMappingValue('0u8', pondoCoreProtocolId, 'protocol_state');
      assert(protocolState === '2u8', 'Protocol state not in REBALANCING');

      // Ensure next validator set is set
      const nextValidatorSet = await getMappingValue(
        '1u8',
        pondoCoreProtocolId,
        'validator_set'
      );
      assert(!!nextValidatorSet, 'Next validator set not set');

      // Get the top validators
      const topValidators = await getTopValidators();
      // Get the rebalance amounts
      const rebalanceAmounts = await determineRebalanceAmounts();

      // Resolve imports
      const imports = pondoDependencyTree[pondoCoreProtocolId];
      let resolvedImports = await resolveImports(imports);

      /*
      * rebalance_redistribute should fail if using the wrong validators
      */
      console.log('Testing wrong validators');
      const wrongTopValidators = topValidators.replace(
        'aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t',
        'aleo147vdwklx423x703j03jduekg74m8m7g70h6afmfvynh0h40dlvzskscssm'
    );
      const wrongValidatorsInputs = [
        wrongTopValidators,
        `[${rebalanceAmounts.map((amount) => `${amount}u64`).join(',')}]`,
      ];

      const wrongValidatorsResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoCoreProtocolProgram,
        'rebalance_redistribute',
        wrongValidatorsInputs,
        4,
        undefined,
        resolvedImports
      );

      const wrongValidatorsAccepted = await isTransactionAccepted(wrongValidatorsResult);
      assert(!wrongValidatorsAccepted, 'rebalance_redistribute was accepted, but should have been rejected due to wrong validators');

      /*
      * rebalance_redistribute should fail if using the wrong proportions
      */
      console.log('Testing wrong proportions');
      const wrongAmounts = [...rebalanceAmounts];
      const wrongAmount1 = wrongAmounts[0];
      wrongAmounts[0] = wrongAmounts[1];
      wrongAmounts[1] = wrongAmount1;

      const wrongAmountsInputs = [
        `${topValidators}`,
        `[${wrongAmounts.map((amount) => `${amount}u64`).join(',')}]`,
      ];

      const wrongAmountsResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoCoreProtocolProgram,
        'rebalance_redistribute',
        wrongAmountsInputs,
        4,
        undefined,
        resolvedImports
      );

      const wrongAmountsAccepted = await isTransactionAccepted(wrongAmountsResult);
      assert(!wrongAmountsAccepted, 'rebalance_redistribute was accepted, but should have been rejected due to wrong proportions');

      /**
       * rebalance_redistribute should fail if too many credits in the right proportions are being redistributed
       */
      console.log('Testing too many credits');
      const tooManyCredits = rebalanceAmounts.map((amount) => amount * 102n / 100n);
      const tooManyCreditsInputs = [
        `${topValidators}`,
        `[${tooManyCredits.map((amount) => `${amount}u64`).join(',')}]`,
      ];

      const tooManyCreditsResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoCoreProtocolProgram,
        'rebalance_redistribute',
        tooManyCreditsInputs,
        4,
        undefined,
        resolvedImports
      );

      const tooManyCreditsAccepted = await isTransactionAccepted(tooManyCreditsResult);
      assert(!tooManyCreditsAccepted, 'rebalance_redistribute was accepted, but should have been rejected due to too many credits');

      /**
       * rebalance_redistribute should fail if too few credits in the right proportions are being redistributed
       */
      console.log('Testing too few credits');
      const tooFewCredits = rebalanceAmounts.map((amount) => amount * 95n / 100n);
      const tooFewCreditsInputs = [
        `${topValidators}`,
        `[${tooFewCredits.map((amount) => `${amount}u64`).join(',')}]`,
      ];

      const tooFewCreditsResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoCoreProtocolProgram,
        'rebalance_redistribute',
        tooFewCreditsInputs,
        4,
        undefined,
        resolvedImports
      );

      const tooFewCreditsAccepted = await isTransactionAccepted(tooFewCreditsResult);
      assert(!tooFewCreditsAccepted, 'rebalance_redistribute was accepted, but should have been rejected due to too few credits');

      /*
      * rebalance_redistribute should succeed given the correct inputs
      */
      console.log('Testing correct inputs');
      // Create a big airdrop of 100k credits to ensure that redistribute succeeds even if the delegators don't have the right amount of credits
      await airDropCredits(pondoDelegatorAddress5, 100_000_000_000n);

      const inputs = [
        `${topValidators}`,
        `[${rebalanceAmounts.map((amount) => `${amount}u64`).join(',')}]`,
      ];
      console.log(`Inputs: ${inputs}`);

      const redistributeResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoCoreProtocolProgram,
        'rebalance_redistribute',
        inputs,
        2.5, // TODO: set the correct fee
        undefined,
        resolvedImports
      );

      const redistributeAccepted = await isTransactionAccepted(redistributeResult);
      assert(redistributeAccepted, 'rebalance_redistribute was rejected, but should have been accepted');

      const updatedStates = await getPondoDelegatorStates();
      assert(updatedStates.every((state) => state === '0u8'), 'Not all delegators are in the correct state');
    });
  });
});