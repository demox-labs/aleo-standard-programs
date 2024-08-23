import { after, before, describe, it } from "node:test";
import * as Aleo from "@demox-labs/aleo-sdk";
import { pondoDependencyTree, pondoPrograms } from "../../compiledPrograms";
import { getChainHeight, getMappingValue, getProgram, getPublicTransactionsForProgram, isTransactionAccepted } from "../../aleo/client";
import { ADDRESS, NETWORK, PRIVATE_KEY } from "../../constants";
import { ExecuteTransaction } from "../../aleo/types";
import { killAuthorizePool, submitTransaction } from "../../aleo/execute";
import { resolveImports } from "../../aleo/deploy";
import { calculateReferenceDelegatorYield } from "../../protocol/referenceDelegators";
import assert from "node:assert";
import { delay, formatAleoString, areListsEqual } from "../../util";

type ReferenceDelegatorPrintState = {
  delegator: string;
  validator: string;
  delegatorYield: string;
  commission: string;
};

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
    const height = await getChainHeight();
    let printState: ReferenceDelegatorPrintState[] = [];
    for (let i = 0; i < delegators.length; i++) {
      const delegator = delegators[i];
      console.log('Delegator:', delegator, 'Oracle ID:', oracleId);
      const validatorDatum = JSON.parse(formatAleoString(await getMappingValue(delegator, oracleId, 'validator_data')));
      console.log('Validator data:', JSON.stringify(validatorDatum));
      const bondState = JSON.parse(formatAleoString(await getMappingValue(delegator, 'credits.aleo', 'bonded')));
      const startBlockHeight = BigInt(validatorDatum.block_height.slice(0, -3));
      const endBlockHeight = BigInt(height);
      const startMicrocredits = BigInt(validatorDatum.bonded_microcredits.slice(0, -3));
      const endMicrocredits = BigInt(bondState.microcredits.slice(0, -3));
      const delegatorYield = calculateReferenceDelegatorYield(startBlockHeight, endBlockHeight, startMicrocredits, endMicrocredits);
      printState.push({
        delegator,
        validator: validatorDatum.validator,
        delegatorYield: delegatorYield.toString(),
        commission: BigInt(validatorDatum.commission.slice(0, -2)).toString()
      });
    }
    // sort the table by delegator yield
    printState.sort((a, b) => Number(b.delegatorYield) - Number(a.delegatorYield));
    console.table(printState);

    const topValidators = await getMappingValue('0u8', oracleId, 'top_validators');
    console.log('Top validators:', JSON.stringify(topValidators));
  });

  after(async () => {
    await killAuthorizePool();
  });

  describe('boostValidator', async () => {
    it('should be able to boost a validator before the update period', async () => {
      const boostAmount1 = '500000u64'; // 0.5 credits
      const boostAmount2 = '110000u64'; // 0.11 credits

      const validator1 = 'aleo10w89dpq8tqzeghq35nxtk2k66pskxm8vhrdl3vx6r4j9hkgf2qqs3936q6';
      const validator2 = 'aleo1l4z0j5cn5s6u6tpuqcj6anh30uaxkdfzatt9seap0atjcqk6nq9qnm9eqf';

      let imports = pondoDependencyTree[oracleId];
      let resolvedImports = await resolveImports(imports);

      // Boost validator 1
      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        oracleProgram,
        'boost_validator',
        [validator1, boostAmount1],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, 'boost_validator was rejected, but should have been accepted');

      const validatorBoost = JSON.parse(formatAleoString(await getMappingValue(validator1, oracleId, 'validator_boosting')));
      assert(validatorBoost.epoch === '3u32', `Validator boost epoch is ${validatorBoost.epoch}, but should be 3`);
      assert(validatorBoost.boost_amount === boostAmount1, `Validator boost amount is ${validatorBoost.boost_amount}, but should be ${boostAmount1}`);

      // Boost validator 2
      const txResult2 = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        oracleProgram,
        'boost_validator',
        [validator2, boostAmount2],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted2 = await isTransactionAccepted(txResult2);
      assert(wasAccepted2, 'boost_validator was rejected, but should have been accepted');

      const validatorBoost2 = JSON.parse(formatAleoString(await getMappingValue(validator2, oracleId, 'validator_boosting')));
      assert(validatorBoost2.epoch === '3u32', `Validator boost epoch is ${validatorBoost2.epoch}, but should be 3`);
      assert(validatorBoost2.boost_amount === boostAmount2, `Validator boost amount is ${validatorBoost2.boost_amount}, but should be ${boostAmount2}`);
    });
  });

  describe('updateDelegator', async () => {
    it('should update the top_validators correctly including the boosting in yield calculation', async () => {
      // Wait for the chain to reach block height 3050
      // Epoch is 800 and oracle update is 650 so 150 blocks before 3200 => 3050
      let currentBlockHeight = 0;
      while (currentBlockHeight < 3050) {
        currentBlockHeight = await getChainHeight();
        if (currentBlockHeight < 3050) {
          console.log(`Current height is ${currentBlockHeight}, waiting for block height to reach 3050...`);
          await delay(5_000);
        }
      }

      const delegatorsToUpdate = [
        'aleo105myfd40pdx4ssls78fl2pzjfd9wfjjyhxmdmujsngmmcxge5q9qey2z9n', // 11% commission
        'aleo1p2x0yjyahjz2eptdspm5fjz0lx7p25p9w08k56yd3232px7s4crsnexgzl', // 0% commission
        'aleo1a5ypd5znczn2sxemcvp45p9vc8a7a7yel50x2qyz5e4helfeuspsk68gng', // 47% commission but big boost
        'aleo12ylacuf3xdf9jmnnks7wdey5mdh7gw85sjmecmt3ruvadv759uyq7dqnca', // 46% commission but small boost
        'aleo19ttj2l7jn697p2wnalvqzg6j3ls2ma0m82yamzaqjhy3jmefhq8s6tplu3', // 1% commission
        'aleo1xyhrs6luuvatrtafaz6ttwx9uamsp0js7ed6gv43grtwxcml7gpquskdzt', // 8% commission
      ];

      const expectedTopValidators = [
        // Inserted at top of the list as all others are outdated
        [
          "aleo105myfd40pdx4ssls78fl2pzjfd9wfjjyhxmdmujsngmmcxge5q9qey2z9n",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud"
        ],
        // Inserted at top of the list as it has a higher yield
        [
          "aleo1p2x0yjyahjz2eptdspm5fjz0lx7p25p9w08k56yd3232px7s4crsnexgzl",
          "aleo105myfd40pdx4ssls78fl2pzjfd9wfjjyhxmdmujsngmmcxge5q9qey2z9n",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud"
        ],
        // Inserted at the top of the list as it has a sufficient boost to overcome low yield
        [
          "aleo1a5ypd5znczn2sxemcvp45p9vc8a7a7yel50x2qyz5e4helfeuspsk68gng",
          "aleo1p2x0yjyahjz2eptdspm5fjz0lx7p25p9w08k56yd3232px7s4crsnexgzl",
          "aleo105myfd40pdx4ssls78fl2pzjfd9wfjjyhxmdmujsngmmcxge5q9qey2z9n",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud"
        ],
        // Inserted at the end of the list as it has a small boost and low yield
        [
          "aleo1a5ypd5znczn2sxemcvp45p9vc8a7a7yel50x2qyz5e4helfeuspsk68gng",
          "aleo1p2x0yjyahjz2eptdspm5fjz0lx7p25p9w08k56yd3232px7s4crsnexgzl",
          "aleo105myfd40pdx4ssls78fl2pzjfd9wfjjyhxmdmujsngmmcxge5q9qey2z9n",
          "aleo12ylacuf3xdf9jmnnks7wdey5mdh7gw85sjmecmt3ruvadv759uyq7dqnca",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud"
        ],
        // Inserted 3rd as it has a slightly lower yield than the 0% commission validator
        // It also switches ...y2z9n with ...7dqnca as the small boost has a greater impact at lower places on the list
        [
          "aleo1a5ypd5znczn2sxemcvp45p9vc8a7a7yel50x2qyz5e4helfeuspsk68gng",
          "aleo1p2x0yjyahjz2eptdspm5fjz0lx7p25p9w08k56yd3232px7s4crsnexgzl",
          "aleo19ttj2l7jn697p2wnalvqzg6j3ls2ma0m82yamzaqjhy3jmefhq8s6tplu3",
          "aleo12ylacuf3xdf9jmnnks7wdey5mdh7gw85sjmecmt3ruvadv759uyq7dqnca",
          "aleo105myfd40pdx4ssls78fl2pzjfd9wfjjyhxmdmujsngmmcxge5q9qey2z9n",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud"
        ],
        // Inserted 4th as it has a lower yield than the 1% commission validator
        [
          "aleo1a5ypd5znczn2sxemcvp45p9vc8a7a7yel50x2qyz5e4helfeuspsk68gng",
          "aleo1p2x0yjyahjz2eptdspm5fjz0lx7p25p9w08k56yd3232px7s4crsnexgzl",
          "aleo19ttj2l7jn697p2wnalvqzg6j3ls2ma0m82yamzaqjhy3jmefhq8s6tplu3",
          "aleo1xyhrs6luuvatrtafaz6ttwx9uamsp0js7ed6gv43grtwxcml7gpquskdzt",
          "aleo12ylacuf3xdf9jmnnks7wdey5mdh7gw85sjmecmt3ruvadv759uyq7dqnca",
          "aleo105myfd40pdx4ssls78fl2pzjfd9wfjjyhxmdmujsngmmcxge5q9qey2z9n",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
          "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud"
        ]
      ]

      let imports = pondoDependencyTree[oracleId];
      let resolvedImports = await resolveImports(imports);

      for (let i = 0; i < delegatorsToUpdate.length; i++) {
        const delegatorToUpdate = delegatorsToUpdate[i];
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
        assert(wasAccepted, 'update_data was rejected, but should have been accepted');

        const topValidators = JSON.parse(formatAleoString(await getMappingValue('0u8', oracleId, 'top_validators')));
        assert(
          areListsEqual(topValidators, expectedTopValidators[i]),
          `Top validators are not as expected: ${JSON.stringify(topValidators)}, expected: ${JSON.stringify(expectedTopValidators[i])}`
        );
      }
    });

    it('should ban a validator who leaves the committee', async () => {
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
        ['aleo166p0ysnrqmy77kaauxfmsnp75a3seltgr8mw9mhvldxdr08amgpqr3cnr8'],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, 'ban_validator was rejected, but should have been accepted');

      const isBanned = await getMappingValue(ADDRESS!, oracleId, 'banned_validators');
      assert(isBanned, 'Validator was not banned');
    });

    it('should reject the update', async () => {
      const delegatorsToUpdate = [
        'aleo105myfd40pdx4ssls78fl2pzjfd9wfjjyhxmdmujsngmmcxge5q9qey2z9n', // Already updated this epoch
        'aleo166p0ysnrqmy77kaauxfmsnp75a3seltgr8mw9mhvldxdr08amgpqr3cnr8', // Validator banned
      ];
      // Same as before
      const expectedTopValidators = [
        "aleo1a5ypd5znczn2sxemcvp45p9vc8a7a7yel50x2qyz5e4helfeuspsk68gng",
        "aleo1p2x0yjyahjz2eptdspm5fjz0lx7p25p9w08k56yd3232px7s4crsnexgzl",
        "aleo19ttj2l7jn697p2wnalvqzg6j3ls2ma0m82yamzaqjhy3jmefhq8s6tplu3",
        "aleo1xyhrs6luuvatrtafaz6ttwx9uamsp0js7ed6gv43grtwxcml7gpquskdzt",
        "aleo12ylacuf3xdf9jmnnks7wdey5mdh7gw85sjmecmt3ruvadv759uyq7dqnca",
        "aleo105myfd40pdx4ssls78fl2pzjfd9wfjjyhxmdmujsngmmcxge5q9qey2z9n",
        "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
        "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
        "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud",
        "aleo1p7pwq7ps9vy07gtvme5kj2y0pk0sa3pl6s88yuq0an032cfe2qgqd9plud"
      ];

      let imports = pondoDependencyTree[oracleId];
      let resolvedImports = await resolveImports(imports);

      for (let i = 0; i < delegatorsToUpdate.length; i++) {
        const delegatorToUpdate = delegatorsToUpdate[i];
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

        const topValidators = JSON.parse(formatAleoString(await getMappingValue('0u8', oracleId, 'top_validators')));
        assert(
          areListsEqual(topValidators, expectedTopValidators),
          `Top validators are not as expected: ${JSON.stringify(topValidators)}, expected: ${JSON.stringify(expectedTopValidators[i])}`
        );
      }
    });
  });
})