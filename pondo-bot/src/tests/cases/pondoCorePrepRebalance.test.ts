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


// Use the oracleUpdate saved ledger state
describe("State Machine Tests", () => {
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
  });

  after(async () => {
    await killAuthorizePool();
  });

  describe("Pondo delegators in protocol 'rebalance' state", () => {
    it('should call prep_rebalance on the pondo_protocol program', async () => {
      const expectedValidatorSet = [
        {
          validator: 'aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t',
          commission: '0u8'
        },
        {
          validator: 'aleo19ljgqpwy98l9sz4f6ly028rl8j8r4grlnetp9e2nwt2xwyfawuxq5yd0tj',
          commission: '1u8'
        },
        {
          validator: 'aleo1p9sg8gapg22p3j42tang7c8kqzp4lhe6mg77gx32yys2a5y7pq9sxh6wrd',
          commission: '6u8'
        },
        {
          validator: 'aleo1s2tyzgqr9p95sxtj9t0s38cmz9pa26edxp4nv0s8mk3tmdzmqgzsctqhxg',
          commission: '8u8'
        },
        {
          validator: 'aleo1sufp275hshd7srrkxwdf7yczmc89em6e5ly933ftnaz64jlq8qysnuz88d',
          commission: '10u8'
        }
      ];
      const imports = pondoDependencyTree[pondoCoreProtocolId];
      const resolvedImports = await resolveImports(imports);
      const pondoCoreProtocolProgram = await getProgram(pondoCoreProtocolId);

      const startingProtocolState = await getMappingValue('0u8', pondoCoreProtocolId, 'protocol_state');
      assert(startingProtocolState === '0u8', 'protocol_state should be NORMAL');

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
      assert(wasAccepted, 'prep_rebalance was accepted, but should have been rejected');

      const protocolState = await getMappingValue('0u8', pondoCoreProtocolId, 'protocol_state');
      assert(protocolState === '1u8', 'protocol_state should be rebalance');
      const validatorSet = JSON.parse(formatAleoString(await getMappingValue('1u8', pondoCoreProtocolId, 'validator_set')));
      // Ensure validator set is as expected
      assert.deepStrictEqual(validatorSet, expectedValidatorSet);
      // Each of the pondo delegators should be in either UNBOND_ALLOWED or TERMINAL state
      pondoDelegatorStates = await getPondoDelegatorStates();
      for (const state of pondoDelegatorStates) {
        assert(state === '2u8' || state === '4u8', 'pondo delegator state should be UNBOND_ALLOWED or TERMINAL');
      }
    });

    it('should not be able to call prep_rebalance on the pondo_protocol program twice', async () => {
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

  describe('Pondo delegators', () => {
    it('should not be able to bond more credits in UNBOND_ALLOWED', async () => {
      /**
       * Air drop to the delegator
       */
      await airDropCredits(pondoDelegatorAddress1, BigInt(10_000_000));
      
      const bondedState = await getMappingValue(pondoDelegatorAddress1, 'credits.aleo', 'bonded');
      const validator = JSON.parse(formatAleoString(bondedState)).validator;

      const imports = pondoDependencyTree[pondoDelegatorId1];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram1,
        'bond',
        [validator, '10000000000u64'],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'bond was accepted, but should have been rejected');
    });

    it('should not be able to bond credits in TERMNINAL', async () => {
      /**
       * Air drop to the delegator
       */
      await airDropCredits(pondoDelegatorAddress5, BigInt(10_000_000));

      const validatorState = await getMappingValue('0u8', pondoDelegatorId5, 'validator_mapping');
      const validator = JSON.parse(formatAleoString(validatorState)).validator;

      const imports = pondoDependencyTree[pondoDelegatorId5];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram5,
        'bond',
        [validator, '10000000000u64'],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'bond was accepted, but should have been rejected');
    });

    it('should able to call unbond with the correct balance', async () => {
      const bondedState = await getMappingValue(pondoDelegatorAddress1, 'credits.aleo', 'bonded');
      const bondedBalance = BigInt(JSON.parse(formatAleoString(bondedState)).microcredits.slice(0, -3));
      const imports = pondoDependencyTree[pondoDelegatorId1];
      const resolvedImports = await resolveImports(imports);

      /**
       * Expect unbond to fail if the delegator retains any bonded state
       */
      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram1,
        'unbond',
        [`${bondedBalance - BigInt(10_000_000_000)}u64`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, 'unbond was accepted, but should have been rejected');

      /**
       * Air drop to the delegator
       */
      await airDropCredits(pondoDelegatorAddress1, BigInt(10_000_000));

      /**
       * Expect unbond to succeed if the delegator has no bonded state
       * Ensure the airdrop doesn't prohibit unbonding
       */
      const txResult2 = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoDelegatorProgram1,
        'unbond',
        [`${bondedBalance}u64`],
        4,
        undefined,
        resolvedImports
      );

      // Check if the unbond was accepted
      const wasAccepted2 = await isTransactionAccepted(txResult2);
      assert(wasAccepted2, 'unbond was rejected, but should have been accepted');

      // Check if the bonded state is null
      const updatedBondedState = await getMappingValue(pondoDelegatorAddress1, 'credits.aleo', 'bonded');
      assert(updatedBondedState === null, `bonded_state should be null but received: ${updatedBondedState}`);

      // Check if the unbonding state is equal to the bonded state
      const unbondingState = await getMappingValue(pondoDelegatorAddress1, 'credits.aleo', 'unbonding');
      const unbondingBalance = BigInt(JSON.parse(formatAleoString(unbondingState)).microcredits.slice(0, -3));
      assert((unbondingBalance - bondedBalance) < BigInt(1_000_000), `unbonding balance: ${unbondingBalance} should be close to bonded balance: ${bondedBalance}`);
    
      // Check if the delegator state is UNBONDING
      const pondoDelegatorState = await getMappingValue('0u8', pondoDelegatorId1, 'state_mapping');
      assert(pondoDelegatorState === '3u8', 'pondo delegator state should be UNBONDING');
    });
  });
});