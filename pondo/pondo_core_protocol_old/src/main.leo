import oracle.aleo;
import delegator1.aleo;
import delegator2.aleo;
import delegator3.aleo;
import delegator4.aleo;
import delegator5.aleo;
import credits.aleo;
import ale.aleo;
import axel.aleo;

// 1 -> 40% of the stake
// 2 -> 25% of the stake
// 3 -> 16% of the stake
// 4 -> 11% of the stake
// 5 -> 8% of the stake

program core_protocol.aleo {
  const PRECISION: i128 = 1000i128;
  const PRECISION_UNSIGNED: u128 = 1000u128;
  const PORTION_1: u128 = 400u128;
  const PORTION_2: u128 = 250u128;
  const PORTION_3: u128 = 160u128;
  const PORTION_4: u128 = 110u128;
  const PORTION_5: u128 = 80u128;
  const MINIMUM_BOND_POOL: u64 = 125_000_000u64; // microcredits
  const PROFITABILITY_TIMEFRAME: u32 = 40_000u32; // 1 week of blocks

  const MINIMUM_BOOST: u64 = 5_000_000u64;

  const DELEGATOR_1: address = aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4;
  const DELEGATOR_2: address = aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc;
  const DELEGATOR_3: address = aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt;
  const DELEGATOR_4: address = aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k;
  const DELEGATOR_5: address = aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n;
  const CORE_PROTOCOL: address = aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
  const ALE: address = aleo1zpy3xyaf40uqt6v42wm8f9kzp7rhzrjy34kv5yyx3va4r9hgcsxstggn0q;
  const AXEL: address = aleo1fwwj46afvuv7n940zjmkn0vjp3fz3n5vnmz7gqgafxmzuym0w5gqad7hxq;

  struct state {
    stake: u64,
    reward: u64,
    performance: u64,
    unbond_amount: u64,
    validator: address,
    ideal_portion: u128
  }

  mapping boost_pool: address => u64;

  mapping portion_delegator: u128 => address;
  mapping delegator_performance: address => u64;

  mapping delegator_state: address => state;

  // 0u8 -> total amount of publicly held aleo in the protocol
  // should increase with deposits and decrease with bonding those deposits
  // should increase with boosting and decrease with final rebonding in the rebalance
  // 1u8 -> total amount of aleo pending withdraw
  mapping core_protocol_balance: u8 => u64;

  // u8 -> the height at which the last rebalance completed
  // should be updated at the end of the rebalance
  // used to estimate rewards earned since rebalancing
  mapping last_rebalance_height: u8 => u32;

  // protocol controls
  // 0u8 ->
  // 0u8: protocol functioning as normal
  // 1u8: upcoming protocol rebalance
  // 2u8: upcoming protocol rebalance unbonding
  // 3u8: upcoming protocol mint rewards and protocol fee
  // 4u8: upcoming protocol rebalance redistribution
  // 10u8: protocol withdraw unbonding in progress
  mapping protocol_state: u8 => u8;

  transition boost(
    public boostee: address,
    public amount: u64,
    private input_record: credits.aleo/credits
    ) {
    // the protocol itself cannot be boosted, as this counts the total boosts in the pool
    assert_neq(boostee, CORE_PROTOCOL);
    // minimum boost amount?
    assert(amount > MINIMUM_BOOST);
    credits.aleo/transfer_private_to_public(input_record, CORE_PROTOCOL, amount);
    return then finalize(boostee, amount);
  }

  finalize boost(
    public boostee: address,
    public amount: u64
    ) {
    // only boost during normal operations
    let current_state: u8 = protocol_state.get(0u8);
    assert_eq(current_state, 0u8);

    let current_boost: u64 = boost_pool.get_or_use(boostee, 0u64);
    let new_boost: u64 = current_boost + amount;
    boost_pool.set(boostee, new_boost);

    let current_total_boost: u64 = boost_pool.get_or_use(CORE_PROTOCOL, 0u64);
    let new_total_boost: u64 = current_total_boost + amount;

    boost_pool.set(CORE_PROTOCOL, new_boost);

    let current_total_protocol_balance: u64 = core_protocol_balance.get_or_use(0u8, 0u64);
    let new_total_protocol_balance: u64 = current_total_protocol_balance + amount;
    core_protocol_balance.set(0u8, new_total_protocol_balance);
  }

  transition clear_boost_pool(
    public boostee: address
    ) {
    assert_neq(boostee, CORE_PROTOCOL);
    return then finalize(boostee);
  }

  finalize clear_boost_pool(
    public boostee: address
    ) {
    // clearing the boost pool may only happen when the protocol is waiting to claim its unbonded stakes
    let current_state: u8 = protocol_state.get(0u8);
    let clear_allowed: bool = current_state == 0u8 || current_state == 2u8 || current_state == 3u8;
    assert(clear_allowed);

    let boosted_amount: u64 = boost_pool.get_or_use(boostee, 0u64);
    boost_pool.set(boostee, 0u64);

    let current_total_boost: u64 = boost_pool.get_or_use(CORE_PROTOCOL, 0u64);
    let new_total_boost: u64 = current_total_boost - boosted_amount;
    boost_pool.set(CORE_PROTOCOL, new_total_boost);
  }

  // 15 is the max amount we can clear in a single transaction without running into constraint limits
  transition clear_boost_pool_bulk(
    public boostees: [address; 15]
    ) {
    return then finalize(boostees);
  }

  finalize clear_boost_pool_bulk(
    public boostees: [address; 15]
    ) {
    // clearing the boost pool may only happen when the protocol is waiting to claim its unbonded stakes
    let current_state: u8 = protocol_state.get(0u8);
    let clear_allowed: bool = current_state == 0u8 || current_state == 2u8 || current_state == 3u8 || current_state == 4u8;
    assert(clear_allowed);

    let new_total_boost: u64 = boost_pool.get_or_use(CORE_PROTOCOL, 0u64);
    for i: u8 in 0u8..15u8 {
      let boostee: address = boostees[i];
      assert_neq(boostee, CORE_PROTOCOL);
      let boosted_amount: u64 = boost_pool.get_or_use(boostee, 0u64);
      boost_pool.set(boostee, 0u64);

      new_total_boost = new_total_boost - boosted_amount;
    }

    boost_pool.set(CORE_PROTOCOL, new_total_boost);
  }

  transition prep_rebalance(
    public current_validators: [address; 5],
    public new_validators: [address; 5],
    public performances: [u64; 5],
    public unbond_amounts: [u64; 5],
    public reward_amounts: [u64; 5],
    public ideal_portions: [u128; 5]
    ) {
    oracle.aleo/confirm_data(new_validators, performances, reward_amounts);

    return then finalize(
      current_validators,
      new_validators,
      performances,
      unbond_amounts,
      reward_amounts,
      ideal_portions
      );
  }

  finalize prep_rebalance(
    public current_validators: [address; 5],
    public new_validators: [address; 5],
    public performances: [u64; 5],
    public unbond_amounts: [u64; 5],
    public reward_amounts: [u64; 5],
    public ideal_portions: [u128; 5]
    ) {
    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    // ********** ASSERT THAT THE CURRENT VALIDATOR SET MATCHES **********
    assert_eq(current_validators[0u8], d1_state.validator);
    assert_eq(current_validators[1u8], d2_state.validator);
    assert_eq(current_validators[2u8], d3_state.validator);
    assert_eq(current_validators[3u8], d4_state.validator);
    assert_eq(current_validators[4u8], d5_state.validator);

    // ********** ENSURE THAT THE REBALANCING AMOUNTS ARE CORRECT **********
    let d1_stake: i128 = d1_state.stake as i128;
    let d2_stake: i128 = d2_state.stake as i128;
    let d3_stake: i128 = d3_state.stake as i128;
    let d4_stake: i128 = d4_state.stake as i128;
    let d5_stake: i128 = d5_state.stake as i128;

    let d1_balance: i128 = d1_stake + reward_amounts[0u8] as i128;
    let d2_balance: i128 = d2_stake + reward_amounts[1u8] as i128;
    let d3_balance: i128 = d3_stake + reward_amounts[2u8] as i128;
    let d4_balance: i128 = d4_stake + reward_amounts[3u8] as i128;
    let d5_balance: i128 = d5_stake + reward_amounts[4u8] as i128;
    let total_balance: i128 = d1_balance + d2_balance + d3_balance + d4_balance + d5_balance;

    let d1_num: i128 = d1_balance * PRECISION;
    let d2_num: i128 = d2_balance * PRECISION;
    let d3_num: i128 = d3_balance * PRECISION;
    let d4_num: i128 = d4_balance * PRECISION;
    let d5_num: i128 = d5_balance * PRECISION;

    let d1_quotient: i128 = d1_num / total_balance;
    let d2_quotient: i128 = d2_num / total_balance;
    let d3_quotient: i128 = d3_num / total_balance;
    let d4_quotient: i128 = d4_num / total_balance;
    let d5_quotient: i128 = d5_num / total_balance;

    let d1_diff: i128 = d1_quotient - ideal_portions[0u8] as i128;
    let d2_diff: i128 = d2_quotient - ideal_portions[1u8] as i128;
    let d3_diff: i128 = d3_quotient - ideal_portions[2u8] as i128;
    let d4_diff: i128 = d4_quotient - ideal_portions[3u8] as i128;
    let d5_diff: i128 = d5_quotient - ideal_portions[4u8] as i128;

    let d1_diff_pos: bool = d1_diff > 0i128;
    let d2_diff_pos: bool = d2_diff > 0i128;
    let d3_diff_pos: bool = d3_diff > 0i128;
    let d4_diff_pos: bool = d4_diff > 0i128;
    let d5_diff_pos: bool = d5_diff > 0i128;

    let d1_transfer_amt: i128 = d1_diff * total_balance / PRECISION;
    let d2_transfer_amt: i128 = d2_diff * total_balance / PRECISION;
    let d3_transfer_amt: i128 = d3_diff * total_balance / PRECISION;
    let d4_transfer_amt: i128 = d4_diff * total_balance / PRECISION;
    let d5_transfer_amt: i128 = d5_diff * total_balance / PRECISION;

    let d1_transfer_credits: u64 = d1_diff_pos ? d1_transfer_amt as u64 : 0u64;
    let d2_transfer_credits: u64 = d2_diff_pos ? d2_transfer_amt as u64 : 0u64;
    let d3_transfer_credits: u64 = d3_diff_pos ? d3_transfer_amt as u64 : 0u64;
    let d4_transfer_credits: u64 = d4_diff_pos ? d4_transfer_amt as u64 : 0u64;
    let d5_transfer_credits: u64 = d5_diff_pos ? d5_transfer_amt as u64 : 0u64;

    assert_eq(d1_transfer_credits, unbond_amounts[0u8]);
    assert_eq(d2_transfer_credits, unbond_amounts[1u8]);
    assert_eq(d3_transfer_credits, unbond_amounts[2u8]);
    assert_eq(d4_transfer_credits, unbond_amounts[3u8]);
    assert_eq(d5_transfer_credits, unbond_amounts[4u8]);

    // ********** CALCULATE IF IT IS PROFITABLE TO REBALANCE **********
    let rewards_from_last_period: u64 = reward_amounts[0u8] + reward_amounts[1u8] + reward_amounts[2u8] + reward_amounts[3u8] + reward_amounts[4u8];
    let last_period_duration: u64 = (block.height - last_rebalance_height.get_or_use(0u8, 0u32)) as u64;
    let current_stake: u64 = d1_state.stake + d2_state.stake + d3_state.stake + d4_state.stake + d5_state.stake;
    let last_period_weekly_yield: u128 = PRECISION_UNSIGNED * rewards_from_last_period as u128 * PROFITABILITY_TIMEFRAME as u128 / (last_period_duration as u128 * current_stake as u128);
    // compound once
    let current_distribution_projected_yield: u128 = total_balance as u128 * last_period_weekly_yield / PRECISION_UNSIGNED;

    let projected_stake_after_rebalance: u64 = current_stake + core_protocol_balance.get_or_use(0u8, 0u64) + rewards_from_last_period;
    let projected_weekly_performance: u128 = ideal_portions[0u8] * performances[0u8] as u128 + ideal_portions[1u8] * performances[1u8] as u128 + ideal_portions[2u8] * performances[2u8] as u128 + ideal_portions[3u8] * performances[3u8] as u128 + ideal_portions[4u8] * performances[4u8] as u128;
    let projected_weekly_yield: u128 = projected_weekly_performance * projected_stake_after_rebalance as u128 / PRECISION_UNSIGNED;
    assert(projected_weekly_yield >= current_distribution_projected_yield);

    // ********** UPDATE DELEGATOR REWARD, PERFORMANCE, UNBOND, IDEAL PORTION STATES **********
    let new_d1_state: state = state {
      stake: d1_state.stake,
      reward: reward_amounts[0u8],
      performance: performances[0u8],
      unbond_amount: unbond_amounts[0u8],
      validator: d1_state.validator,
      ideal_portion: ideal_portions[0u8]
    };

    let new_d2_state: state = state {
      stake: d2_state.stake,
      reward: reward_amounts[1u8],
      performance: performances[1u8],
      unbond_amount: unbond_amounts[1u8],
      validator: d2_state.validator,
      ideal_portion: ideal_portions[1u8]
    };

    let new_d3_state: state = state {
      stake: d3_state.stake,
      reward: reward_amounts[2u8],
      performance: performances[2u8],
      unbond_amount: unbond_amounts[2u8],
      validator: d3_state.validator,
      ideal_portion: ideal_portions[2u8]
    };

    let new_d4_state: state = state {
      stake: d4_state.stake,
      reward: reward_amounts[3u8],
      performance: performances[3u8],
      unbond_amount: unbond_amounts[3u8],
      validator: d4_state.validator,
      ideal_portion: ideal_portions[3u8]
    };

    let new_d5_state: state = state {
      stake: d5_state.stake,
      reward: reward_amounts[4u8],
      performance: performances[4u8],
      unbond_amount: unbond_amounts[4u8],
      validator: d5_state.validator,
      ideal_portion: ideal_portions[4u8]
    };

    delegator_state.set(DELEGATOR_1, new_d1_state);
    delegator_state.set(DELEGATOR_2, new_d2_state);
    delegator_state.set(DELEGATOR_3, new_d3_state);
    delegator_state.set(DELEGATOR_4, new_d4_state);
    delegator_state.set(DELEGATOR_5, new_d5_state);

    // ********** ENSURE THAT THE IDEAL PORTIONS ARE SET BASED ON PERFORMANCE **********
    portion_delegator.set(ideal_portions[0u8], DELEGATOR_1);
    portion_delegator.set(ideal_portions[1u8], DELEGATOR_2);
    portion_delegator.set(ideal_portions[2u8], DELEGATOR_3);
    portion_delegator.set(ideal_portions[3u8], DELEGATOR_4);
    portion_delegator.set(ideal_portions[4u8], DELEGATOR_5);

    delegator_performance.set(DELEGATOR_1, performances[0u8]);
    delegator_performance.set(DELEGATOR_2, performances[1u8]);
    delegator_performance.set(DELEGATOR_3, performances[2u8]);
    delegator_performance.set(DELEGATOR_4, performances[3u8]);
    delegator_performance.set(DELEGATOR_5, performances[4u8]);

    let largest_delegator:  address = portion_delegator.get(PORTION_1);
    let second_delegator:   address = portion_delegator.get(PORTION_2);
    let third_delegator:    address = portion_delegator.get(PORTION_3);
    let fourth_delegator:   address = portion_delegator.get(PORTION_4);
    let smallest_delegator: address = portion_delegator.get(PORTION_5);

    let largest_delegator_performance:  u64 = delegator_performance.get(largest_delegator);
    let second_delegator_performance:   u64 = delegator_performance.get(second_delegator);
    let third_delegator_performance:    u64 = delegator_performance.get(third_delegator);
    let fourth_delegator_performance:   u64 = delegator_performance.get(fourth_delegator);
    let smallest_delegator_performance: u64 = delegator_performance.get(smallest_delegator);

    assert(largest_delegator_performance >= second_delegator_performance);
    assert(second_delegator_performance >= third_delegator_performance);
    assert(third_delegator_performance >= fourth_delegator_performance);
    assert(fourth_delegator_performance >= smallest_delegator_performance);

    // *********** CHECK & UPDATE PROTOCOL STATE **********
    // prep rebalance is allowed to be called multiple times
    assert(protocol_state.get(0u8) <= 1u8);
    protocol_state.set(0u8, 1u8);
  }

  transition rebalance_unbond(
    public unbond_amounts: [u64; 5],
    public reward_amounts: [u64; 5]
    ) {
    delegator1.aleo/unbond(unbond_amounts[0u8]);
    delegator2.aleo/unbond(unbond_amounts[1u8]);
    delegator3.aleo/unbond(unbond_amounts[2u8]);
    delegator4.aleo/unbond(unbond_amounts[3u8]);
    delegator5.aleo/unbond(unbond_amounts[4u8]);

    return then finalize(
      unbond_amounts,
      reward_amounts
      );
  }

  finalize rebalance_unbond(
    public unbond_amounts: [u64; 5],
    public reward_amounts: [u64; 5]
    ) {
    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    // ********** ASSERT INPUTS AND STATE **********
    assert_eq(unbond_amounts[0u8], d1_state.unbond_amount);
    assert_eq(unbond_amounts[1u8], d2_state.unbond_amount);
    assert_eq(unbond_amounts[2u8], d3_state.unbond_amount);
    assert_eq(unbond_amounts[3u8], d4_state.unbond_amount);
    assert_eq(unbond_amounts[4u8], d5_state.unbond_amount);

    assert_eq(reward_amounts[0u8], d1_state.reward);
    assert_eq(reward_amounts[1u8], d2_state.reward);
    assert_eq(reward_amounts[2u8], d3_state.reward);
    assert_eq(reward_amounts[3u8], d4_state.reward);
    assert_eq(reward_amounts[4u8], d5_state.reward);

    // ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = state {
      stake: d1_state.stake - unbond_amounts[0u8] + reward_amounts[0u8],
      reward: d1_state.reward,
      performance: d1_state.performance,
      unbond_amount: unbond_amounts[0u8],
      validator: d1_state.validator,
      ideal_portion: d1_state.ideal_portion
    };

    let new_d2_state: state = state {
      stake: d2_state.stake - unbond_amounts[1u8] + reward_amounts[1u8],
      reward: d2_state.reward,
      performance: d2_state.performance,
      unbond_amount: unbond_amounts[1u8],
      validator: d2_state.validator,
      ideal_portion: d2_state.ideal_portion
    };

    let new_d3_state: state = state {
      stake: d3_state.stake - unbond_amounts[2u8] + reward_amounts[2u8],
      reward: d3_state.reward,
      performance: d3_state.performance,
      unbond_amount: unbond_amounts[2u8],
      validator: d3_state.validator,
      ideal_portion: d3_state.ideal_portion
    };

    let new_d4_state: state = state {
      stake: d4_state.stake - unbond_amounts[3u8] + reward_amounts[3u8],
      reward: d4_state.reward,
      performance: d4_state.performance,
      unbond_amount: unbond_amounts[3u8],
      validator: d4_state.validator,
      ideal_portion: d4_state.ideal_portion
    };

    let new_d5_state: state = state {
      stake: d5_state.stake - unbond_amounts[4u8] + reward_amounts[4u8],
      reward: d5_state.reward,
      performance: d5_state.performance,
      unbond_amount: unbond_amounts[4u8],
      validator: d5_state.validator,
      ideal_portion: d5_state.ideal_portion
    };

    delegator_state.set(DELEGATOR_1, new_d1_state);
    delegator_state.set(DELEGATOR_2, new_d2_state);
    delegator_state.set(DELEGATOR_3, new_d3_state);
    delegator_state.set(DELEGATOR_4, new_d4_state);
    delegator_state.set(DELEGATOR_5, new_d5_state);

    // *********** UPDATE PROTOCOL STATE **********
    assert_eq(protocol_state.get(0u8), 1u8);
    protocol_state.set(0u8, 2u8);
  }

  transition rebalance_collect_rewards(
    public current_validators: [address; 5],
    public new_validators: [address; 5],
    public reward_amounts: [u64; 5],
    public validator_mint_amounts: [u64; 5],
    public total_ale_minted: u64,
    public total_ale_burned: u64
    ) {
    ale.aleo/assert_totals(total_ale_minted, total_ale_burned);
    let total_ale_pool: u64 = total_ale_minted - total_ale_burned;

    // Mint Ale to the validators
    ale.aleo/mint_public(validator_mint_amounts[0u8], current_validators[0u8]);
    ale.aleo/mint_public(validator_mint_amounts[1u8], current_validators[1u8]);
    ale.aleo/mint_public(validator_mint_amounts[2u8], current_validators[2u8]);
    ale.aleo/mint_public(validator_mint_amounts[3u8], current_validators[3u8]);
    ale.aleo/mint_public(validator_mint_amounts[4u8], current_validators[4u8]);

    // Mint Ale to the axel pool
    let fee_mint: u64 = validator_mint_amounts[0u8] + validator_mint_amounts[1u8] + validator_mint_amounts[2u8] + validator_mint_amounts[3u8] + validator_mint_amounts[4u8];
    ale.aleo/mint_public(fee_mint, AXEL);
    return then finalize(
      current_validators,
      new_validators,
      reward_amounts,
      validator_mint_amounts,
      total_ale_pool);
  }

  finalize rebalance_collect_rewards(
    public current_validators: [address; 5],
    public new_validators: [address; 5],
    public reward_amounts: [u64; 5],
    public validator_mint_amounts: [u64; 5],
    public total_ale_pool: u64
    ) {
    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    // ********** ASSERT INPUTS AND STATE **********
    assert_eq(current_validators[0u8], d1_state.validator);
    assert_eq(current_validators[1u8], d2_state.validator);
    assert_eq(current_validators[2u8], d3_state.validator);
    assert_eq(current_validators[3u8], d4_state.validator);
    assert_eq(current_validators[4u8], d5_state.validator);

    assert_eq(reward_amounts[0u8], d1_state.reward);
    assert_eq(reward_amounts[1u8], d2_state.reward);
    assert_eq(reward_amounts[2u8], d3_state.reward);
    assert_eq(reward_amounts[3u8], d4_state.reward);
    assert_eq(reward_amounts[4u8], d5_state.reward);

    // ********** ASSERT MINT AMOUNTS **********
    let v1_aleo_fee_precision: u128 = PRECISION_UNSIGNED * reward_amounts[0u8] as u128 / 20u128;
    let v2_aleo_fee_precision: u128 = PRECISION_UNSIGNED * reward_amounts[1u8] as u128 / 20u128;
    let v3_aleo_fee_precision: u128 = PRECISION_UNSIGNED * reward_amounts[2u8] as u128 / 20u128;
    let v4_aleo_fee_precision: u128 = PRECISION_UNSIGNED * reward_amounts[3u8] as u128 / 20u128;
    let v5_aleo_fee_precision: u128 = PRECISION_UNSIGNED * reward_amounts[4u8] as u128 / 20u128;
    let validator_total_fee_precision: u128 = v1_aleo_fee_precision + v2_aleo_fee_precision + v3_aleo_fee_precision + v4_aleo_fee_precision + v5_aleo_fee_precision;
    let validator_total_fee: u64 = (validator_total_fee_precision / PRECISION_UNSIGNED) as u64;
    let axel_fee: u64 = validator_total_fee;

    assert_eq(validator_mint_amounts[0u8] as u128 * PRECISION_UNSIGNED, v1_aleo_fee_precision);
    assert_eq(validator_mint_amounts[1u8] as u128 * PRECISION_UNSIGNED, v2_aleo_fee_precision);
    assert_eq(validator_mint_amounts[2u8] as u128 * PRECISION_UNSIGNED, v3_aleo_fee_precision);
    assert_eq(validator_mint_amounts[3u8] as u128 * PRECISION_UNSIGNED, v4_aleo_fee_precision);
    assert_eq(validator_mint_amounts[4u8] as u128 * PRECISION_UNSIGNED, v5_aleo_fee_precision);

    let protocol_pending_withdraw_balance: u64 = core_protocol_balance.get_or_use(1u8, 0u64);
    let pool_balance: u64 = core_protocol_balance.get_or_use(0u8, 0u64);
    let total_aleo_after: u64 = pool_balance + d1_state.stake + d2_state.stake + d3_state.stake + d4_state.stake + d5_state.stake - protocol_pending_withdraw_balance;
    let total_aleo_before: u64 = total_aleo_after - validator_total_fee - axel_fee;

    let total_ale_minted: u64 = 2u64 * (validator_mint_amounts[0u8] + validator_mint_amounts[1u8] + validator_mint_amounts[2u8] + validator_mint_amounts[3u8] + validator_mint_amounts[4u8]);
    let total_ale_before: u64 = total_ale_pool;
    let total_ale_after: u64 = total_ale_before + total_ale_minted;

    // aleo_before / aleo_after should equal ale_before / ale_after
    // aleo_before * ale_after = aleo_after * ale_before

    let product_1: u128 = total_aleo_before as u128 * total_ale_after as u128;
    let product_2: u128 = total_aleo_after as u128 * total_ale_before as u128;
    assert_eq(product_1, product_2);

    // ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = state {
      stake: d1_state.stake,
      reward: 0u64,
      performance: d1_state.performance,
      unbond_amount: d1_state.unbond_amount,
      validator: new_validators[0u8],
      ideal_portion: d1_state.ideal_portion
    };

    let new_d2_state: state = state {
      stake: d2_state.stake,
      reward: 0u64,
      performance: d2_state.performance,
      unbond_amount: d2_state.unbond_amount,
      validator: new_validators[1u8],
      ideal_portion: d2_state.ideal_portion
    };

    let new_d3_state: state = state {
      stake: d3_state.stake,
      reward: 0u64,
      performance: d3_state.performance,
      unbond_amount: d3_state.unbond_amount,
      validator: new_validators[2u8],
      ideal_portion: d3_state.ideal_portion
    };

    let new_d4_state: state = state {
      stake: d4_state.stake,
      reward: 0u64,
      performance: d4_state.performance,
      unbond_amount: d4_state.unbond_amount,
      validator: new_validators[3u8],
      ideal_portion: d4_state.ideal_portion
    };

    let new_d5_state: state = state {
      stake: d5_state.stake,
      reward: 0u64,
      performance: d5_state.performance,
      unbond_amount: d5_state.unbond_amount,
      validator: new_validators[4u8],
      ideal_portion: d5_state.ideal_portion
    };

    delegator_state.set(DELEGATOR_1, new_d1_state);
    delegator_state.set(DELEGATOR_2, new_d2_state);
    delegator_state.set(DELEGATOR_3, new_d3_state);
    delegator_state.set(DELEGATOR_4, new_d4_state);
    delegator_state.set(DELEGATOR_5, new_d5_state);

    // *********** UPDATE PROTOCOL STATE **********
    assert_eq(protocol_state.get(0u8), 2u8);
    protocol_state.set(0u8, 3u8);
  }

  transition rebalance_claim_unbond(
    public unbond_amounts: [u64; 5]
    ) {
    // ********** CLAIM UNBOND AND SEND TO PROTOCOL ALEO POOL **********
    // note -- in the case that a validator has forcibly unbonded a delegator,
    // the fix_orphaned_delegator transition must be called
    delegator1.aleo/claim_unbond();
    delegator1.aleo/transfer_to_core_protocol(unbond_amounts[0u8]);

    delegator2.aleo/claim_unbond();
    delegator2.aleo/transfer_to_core_protocol(unbond_amounts[1u8]);

    delegator3.aleo/claim_unbond();
    delegator3.aleo/transfer_to_core_protocol(unbond_amounts[2u8]);

    delegator4.aleo/claim_unbond();
    delegator4.aleo/transfer_to_core_protocol(unbond_amounts[3u8]);

    delegator5.aleo/claim_unbond();
    delegator5.aleo/transfer_to_core_protocol(unbond_amounts[4u8]);

    return then finalize(unbond_amounts);
  }

  finalize rebalance_claim_unbond(
    public unbond_amounts: [u64; 5]
    ) {
    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    // ********** ASSERT INPUTS AND STATE **********
    assert_eq(unbond_amounts[0u8], d1_state.unbond_amount);
    assert_eq(unbond_amounts[1u8], d2_state.unbond_amount);
    assert_eq(unbond_amounts[2u8], d3_state.unbond_amount);
    assert_eq(unbond_amounts[3u8], d4_state.unbond_amount);
    assert_eq(unbond_amounts[4u8], d5_state.unbond_amount);

    // ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = state {
      stake: d1_state.stake,
      reward: 0u64,
      performance: d1_state.performance,
      unbond_amount: 0u64,
      validator: d1_state.validator,
      ideal_portion: d1_state.ideal_portion
    };
    let new_d2_state: state = state {
      stake: d2_state.stake,
      reward: 0u64,
      performance: d2_state.performance,
      unbond_amount: 0u64,
      validator: d2_state.validator,
      ideal_portion: d2_state.ideal_portion
    };
    let new_d3_state: state = state {
      stake: d3_state.stake,
      reward: 0u64,
      performance: d3_state.performance,
      unbond_amount: 0u64,
      validator: d3_state.validator,
      ideal_portion: d3_state.ideal_portion
    };
    let new_d4_state: state = state {
      stake: d4_state.stake,
      reward: 0u64,
      performance: d4_state.performance,
      unbond_amount: 0u64,
      validator: d4_state.validator,
      ideal_portion: d4_state.ideal_portion
    };
    let new_d5_state: state = state {
      stake: d5_state.stake,
      reward: 0u64,
      performance: d5_state.performance,
      unbond_amount: 0u64,
      validator: d5_state.validator,
      ideal_portion: d5_state.ideal_portion
    };

    delegator_state.set(DELEGATOR_1, new_d1_state);
    delegator_state.set(DELEGATOR_2, new_d2_state);
    delegator_state.set(DELEGATOR_3, new_d3_state);
    delegator_state.set(DELEGATOR_4, new_d4_state);
    delegator_state.set(DELEGATOR_5, new_d5_state);

    // *********** CHECK & UPDATE PROTOCOL STATE **********
    assert_eq(protocol_state.get(0u8), 3u8);
    // rebalancing unbonding complete
    protocol_state.set(0u8, 4u8);

    let current_total_protocol_balance: u64 = core_protocol_balance.get_or_use(0u8, 0u64);
    let new_total_protocol_balance: u64 = current_total_protocol_balance + unbond_amounts[0u8] + unbond_amounts[1u8] + unbond_amounts[2u8] + unbond_amounts[3u8] + unbond_amounts[4u8];
    core_protocol_balance.set(0u8, new_total_protocol_balance);
  }

  transition rebalance_redistribute(
    public rebond_amounts: [u64; 5],
    public validators: [address; 5]
    ) {
    // ********** REDISTRIBUTE PROTOCOL POOL **********
    // note -- in the case that a delegator is changing validators, the delegator
    // may not have cleared its entire stake, so clear_residual_bonded_delegators must be called
    credits.aleo/transfer_public(DELEGATOR_1, rebond_amounts[0u8]);
    delegator1.aleo/bond(validators[0u8], rebond_amounts[0u8]);

    credits.aleo/transfer_public(DELEGATOR_2, rebond_amounts[1u8]);
    delegator2.aleo/bond(validators[1u8], rebond_amounts[1u8]);

    credits.aleo/transfer_public(DELEGATOR_3, rebond_amounts[2u8]);
    delegator3.aleo/bond(validators[2u8], rebond_amounts[2u8]);

    credits.aleo/transfer_public(DELEGATOR_4, rebond_amounts[3u8]);
    delegator4.aleo/bond(validators[3u8], rebond_amounts[3u8]);

    credits.aleo/transfer_public(DELEGATOR_5, rebond_amounts[4u8]);
    delegator5.aleo/bond(validators[4u8], rebond_amounts[4u8]);

    return then finalize(rebond_amounts, validators);
  }

  finalize rebalance_redistribute(
    public rebond_amounts: [u64; 5],
    public validators: [address; 5]
    ) {
    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    // ********** ASSERT INPUTS AND STATE **********
    // make sure the boost pool has been cleared
    let boost_pool_total: u64 = boost_pool.get_or_use(CORE_PROTOCOL, 0u64);
    assert_eq(boost_pool_total, 0u64);

    assert_eq(validators[0u8], d1_state.validator);
    assert_eq(validators[1u8], d2_state.validator);
    assert_eq(validators[2u8], d3_state.validator);
    assert_eq(validators[3u8], d4_state.validator);
    assert_eq(validators[4u8], d5_state.validator);

    let rebond_total: u64 = rebond_amounts[0u8] + rebond_amounts[1u8] + rebond_amounts[2u8] + rebond_amounts[3u8] + rebond_amounts[4u8];
    let protocol_balance: u64 = core_protocol_balance.get_or_use(0u8, 0u64);
    assert(protocol_balance <= rebond_total);

    // ********** ENSURE THAT THE REBALANCING AMOUNTS ARE CORRECT **********
    let d1_stake: u128 = d1_state.stake as u128;
    let d2_stake: u128 = d2_state.stake as u128;
    let d3_stake: u128 = d3_state.stake as u128;
    let d4_stake: u128 = d4_state.stake as u128;
    let d5_stake: u128 = d5_state.stake as u128;

    let d1_balance: u128 = d1_stake + rebond_amounts[0u8] as u128;
    let d2_balance: u128 = d2_stake + rebond_amounts[1u8] as u128;
    let d3_balance: u128 = d3_stake + rebond_amounts[2u8] as u128;
    let d4_balance: u128 = d4_stake + rebond_amounts[3u8] as u128;
    let d5_balance: u128 = d5_stake + rebond_amounts[4u8] as u128;
    let total_balance: u128 = d1_balance + d2_balance + d3_balance + d4_balance + d5_balance;

    let d1_num: u128 = d1_balance * PRECISION_UNSIGNED;
    let d2_num: u128 = d2_balance * PRECISION_UNSIGNED;
    let d3_num: u128 = d3_balance * PRECISION_UNSIGNED;
    let d4_num: u128 = d4_balance * PRECISION_UNSIGNED;
    let d5_num: u128 = d5_balance * PRECISION_UNSIGNED;

    let d1_quotient: u128 = d1_num / total_balance;
    let d2_quotient: u128 = d2_num / total_balance;
    let d3_quotient: u128 = d3_num / total_balance;
    let d4_quotient: u128 = d4_num / total_balance;
    let d5_quotient: u128 = d5_num / total_balance;

    // portion_delegator mapping was set in previous rebalancing part, make sure
    // the calculated portion matches the ideal portion_delegator mapping
    assert_eq(portion_delegator.get(d1_quotient as u128), DELEGATOR_1);
    assert_eq(portion_delegator.get(d2_quotient as u128), DELEGATOR_2);
    assert_eq(portion_delegator.get(d3_quotient as u128), DELEGATOR_3);
    assert_eq(portion_delegator.get(d4_quotient as u128), DELEGATOR_4);
    assert_eq(portion_delegator.get(d5_quotient as u128), DELEGATOR_5);

    // ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = state {
      stake: d1_state.stake + rebond_amounts[0u8],
      reward: 0u64,
      performance: d1_state.performance,
      unbond_amount: 0u64,
      validator: d1_state.validator,
      ideal_portion: d1_state.ideal_portion
    };
    let new_d2_state: state = state {
      stake: d2_state.stake + rebond_amounts[1u8],
      reward: 0u64,
      performance: d2_state.performance,
      unbond_amount: 0u64,
      validator: d2_state.validator,
      ideal_portion: d2_state.ideal_portion
    };
    let new_d3_state: state = state {
      stake: d3_state.stake + rebond_amounts[2u8],
      reward: 0u64,
      performance: d3_state.performance,
      unbond_amount: 0u64,
      validator: d3_state.validator,
      ideal_portion: d3_state.ideal_portion
    };
    let new_d4_state: state = state {
      stake: d4_state.stake + rebond_amounts[3u8],
      reward: 0u64,
      performance: d4_state.performance,
      unbond_amount: 0u64,
      validator: d4_state.validator,
      ideal_portion: d4_state.ideal_portion
    };
    let new_d5_state: state = state {
      stake: d5_state.stake + rebond_amounts[4u8],
      reward: 0u64,
      performance: d5_state.performance,
      unbond_amount: 0u64,
      validator: d5_state.validator,
      ideal_portion: d5_state.ideal_portion
    };

    delegator_state.set(DELEGATOR_1, new_d1_state);
    delegator_state.set(DELEGATOR_2, new_d2_state);
    delegator_state.set(DELEGATOR_3, new_d3_state);
    delegator_state.set(DELEGATOR_4, new_d4_state);
    delegator_state.set(DELEGATOR_5, new_d5_state);

    // *********** CHECK & UPDATE PROTOCOL STATE **********
    assert_eq(protocol_state.get(0u8), 4u8);
    // rebalancing finished, set protocol back to normal
    protocol_state.set(0u8, 0u8);

    // we should have drained all the protocol balance that we are aware of
    core_protocol_balance.set(0u8, 0u64);

    last_rebalance_height.set(0u8, block.height);
  }

  // in the event we are changing validators, unbonding once may not actually clear the full balance because of
  // block reward timing. In that case, we need to clear the residual bonded amounts
  transition clear_residual_delegators(
    public residual_amounts: [u64; 5]
    ) {
    // no rewards minted for residue clearing, as this should be a rare event
    if (residual_amounts[0u8] > 0u64) {
      oracle.aleo/clear_residual_delegator(DELEGATOR_1, residual_amounts[0u8]);
      delegator1.aleo/unbond(residual_amounts[0u8]);
    }

    if (residual_amounts[1u8] > 0u64) {
      oracle.aleo/clear_residual_delegator(DELEGATOR_2, residual_amounts[1u8]);
      delegator2.aleo/unbond(residual_amounts[1u8]);
    }

    if (residual_amounts[2u8] > 0u64) {
      oracle.aleo/clear_residual_delegator(DELEGATOR_3, residual_amounts[2u8]);
      delegator3.aleo/unbond(residual_amounts[2u8]);
    }

    if (residual_amounts[3u8] > 0u64) {
      oracle.aleo/clear_residual_delegator(DELEGATOR_4, residual_amounts[3u8]);
      delegator4.aleo/unbond(residual_amounts[3u8]);
    }

    if (residual_amounts[4u8] > 0u64) {
      oracle.aleo/clear_residual_delegator(DELEGATOR_5, residual_amounts[4u8]);
      delegator5.aleo/unbond(residual_amounts[4u8]);
    }

    return then finalize(residual_amounts);
  }

  finalize clear_residual_delegators(
    public residual_amounts: [u64; 5]
    ) {
    // *********** ASSERT PROTOCOL STATE **********
    // This should only occur when the protocol has begun unbonding
    let curr_protocol_state: u8 = protocol_state.get(0u8);
    let can_clear: bool = curr_protocol_state == 2u8 || curr_protocol_state == 3u8;
    assert(can_clear);

    // *********** UPDATE DELEGATOR STATES **********
    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    let new_d1_state: state = state {
      stake: d1_state.stake,
      reward: d1_state.reward,
      performance: d1_state.performance,
      unbond_amount: d1_state.unbond_amount + residual_amounts[0u8],
      validator: d1_state.validator,
      ideal_portion: d1_state.ideal_portion
    };

    let new_d2_state: state = state {
      stake: d2_state.stake,
      reward: d2_state.reward,
      performance: d2_state.performance,
      unbond_amount: d2_state.unbond_amount + residual_amounts[1u8],
      validator: d2_state.validator,
      ideal_portion: d2_state.ideal_portion
    };

    let new_d3_state: state = state {
      stake: d3_state.stake,
      reward: d3_state.reward,
      performance: d3_state.performance,
      unbond_amount: d3_state.unbond_amount + residual_amounts[2u8],
      validator: d3_state.validator,
      ideal_portion: d3_state.ideal_portion
    };

    let new_d4_state: state = state {
      stake: d4_state.stake,
      reward: d4_state.reward,
      performance: d4_state.performance,
      unbond_amount: d4_state.unbond_amount + residual_amounts[3u8],
      validator: d4_state.validator,
      ideal_portion: d4_state.ideal_portion
    };

    let new_d5_state: state = state {
      stake: d5_state.stake,
      reward: d5_state.reward,
      performance: d5_state.performance,
      unbond_amount: d5_state.unbond_amount + residual_amounts[4u8],
      validator: d5_state.validator,
      ideal_portion: d5_state.ideal_portion
    };

    delegator_state.set(DELEGATOR_1, new_d1_state);
    delegator_state.set(DELEGATOR_2, new_d2_state);
    delegator_state.set(DELEGATOR_3, new_d3_state);
    delegator_state.set(DELEGATOR_4, new_d4_state);
    delegator_state.set(DELEGATOR_5, new_d5_state);
  }

  transition fix_orphaned_delegators(
    public amounts: [u64; 5]
    ) {
    if (amounts[0u8] > 0u64) {
      delegator1.aleo/claim_unbond();
      delegator1.aleo/transfer_to_core_protocol(amounts[0u8]);
      oracle.aleo/confirm_orphaned_delegator(DELEGATOR_1, amounts[0u8]);
    }

    if (amounts[1u8] > 0u64) {
      delegator2.aleo/claim_unbond();
      delegator2.aleo/transfer_to_core_protocol(amounts[1u8]);
      oracle.aleo/confirm_orphaned_delegator(DELEGATOR_2, amounts[1u8]);
    }

    if (amounts[2u8] > 0u64) {
      delegator3.aleo/claim_unbond();
      delegator3.aleo/transfer_to_core_protocol(amounts[2u8]);
      oracle.aleo/confirm_orphaned_delegator(DELEGATOR_3, amounts[2u8]);
    }

    if (amounts[3u8] > 0u64) {
      delegator4.aleo/claim_unbond();
      delegator4.aleo/transfer_to_core_protocol(amounts[3u8]);
      oracle.aleo/confirm_orphaned_delegator(DELEGATOR_4, amounts[3u8]);
    }

    if (amounts[4u8] > 0u64) {
      delegator5.aleo/claim_unbond();
      delegator5.aleo/transfer_to_core_protocol(amounts[4u8]);
      oracle.aleo/confirm_orphaned_delegator(DELEGATOR_5, amounts[4u8]);
    }

    return then finalize(amounts);
  }

  finalize fix_orphaned_delegators(
    public amounts: [u64; 5]
    ) {
    // *********** UPDATE PROTOCOL STATE **********
    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    let new_d1_state: state = state {
      stake: d1_state.stake - amounts[0u8],
      reward: 0u64,
      performance: d1_state.performance,
      unbond_amount: 0u64,
      validator: d1_state.validator,
      ideal_portion: d1_state.ideal_portion
    };
    let new_d2_state: state = state {
      stake: d2_state.stake - amounts[1u8],
      reward: 0u64,
      performance: d2_state.performance,
      unbond_amount: 0u64,
      validator: d2_state.validator,
      ideal_portion: d2_state.ideal_portion
    };
    let new_d3_state: state = state {
      stake: d3_state.stake - amounts[2u8],
      reward: 0u64,
      performance: d3_state.performance,
      unbond_amount: 0u64,
      validator: d3_state.validator,
      ideal_portion: d3_state.ideal_portion
    };
    let new_d4_state: state = state {
      stake: d4_state.stake - amounts[3u8],
      reward: 0u64,
      performance: d4_state.performance,
      unbond_amount: 0u64,
      validator: d4_state.validator,
      ideal_portion: d4_state.ideal_portion
    };
    let new_d5_state: state = state {
      stake: d5_state.stake - amounts[4u8],
      reward: 0u64,
      performance: d5_state.performance,
      unbond_amount: 0u64,
      validator: d5_state.validator,
      ideal_portion: d5_state.ideal_portion
    };

    delegator_state.set(DELEGATOR_1, new_d1_state);
    delegator_state.set(DELEGATOR_2, new_d2_state);
    delegator_state.set(DELEGATOR_3, new_d3_state);
    delegator_state.set(DELEGATOR_4, new_d4_state);
    delegator_state.set(DELEGATOR_5, new_d5_state);

    // *********** CHECK & UPDATE PROTOCOL STATE **********
    let protocol_balance: u64 = core_protocol_balance.get_or_use(0u8, 0u64);
    let protocol_balance_with_unbond: u64 = protocol_balance + amounts[0u8] + amounts[1u8] + amounts[2u8] + amounts[3u8] + amounts[4u8];
    core_protocol_balance.set(0u8, protocol_balance_with_unbond);
  }

  mapping withdraw_pool: u32 => u64;
  const WITHDRAW_WAIT_MINIMUM: u32 = 15_000u32; // aproximately 2.5 days' of blocks
  const WITHDRAW_FEE: u128 = 30u128; // out of 1000, 3% fee

  transition create_withdraw_claim(
    private ale_record: ale.aleo/token,
    public current_height: u32,
    public total_ale_minted: u64,
    public total_ale_burned: u64,
    // total amount of ale to burn, including fee
    public ale_burn_amount: u64,
    // amount of credits to claim, minus fee
    public credits_claim_amount: u64
    ) {
    ale.aleo/assert_totals(total_ale_minted, total_ale_burned);
    let total_ale_pool: u64 = total_ale_minted - total_ale_burned;

    let fee_calc: u128 = ale_burn_amount as u128 * WITHDRAW_FEE / PRECISION_UNSIGNED;
    let fee: u64 = fee_calc as u64;
    let min_block_height: u32 = current_height + WITHDRAW_WAIT_MINIMUM;
    let min_block_rounded_down: u32 = min_block_height / 10_000u32 * 10_000u32;
    let min_block_round_up: u32 = min_block_rounded_down + 10_000u32;
    // burn full amount of ale, but immediately mint the fee to the protocol. Only withdraw credits_to_claim as the difference
    ale.aleo/burn_private(ale_record, ale_burn_amount, credits_claim_amount, min_block_round_up);
    ale.aleo/mint_public(fee, AXEL);
    let net_ale_burn_amount: u64 = ale_burn_amount - fee;
    return then finalize(
      current_height,
      net_ale_burn_amount,
      min_block_round_up,
      credits_claim_amount,
      total_ale_pool);
  }

  finalize create_withdraw_claim(
    current_height: u32,
    net_ale_burn_amount: u64,
    withdraw_block: u32,
    credits_withdraw: u64,
    total_ale_pool: u64
    ) {
    assert(block.height >= current_height);
    let total_withdraw_amount: u64 = withdraw_pool.get_or_use(withdraw_block, 0u64);
    total_withdraw_amount = total_withdraw_amount + credits_withdraw;
    withdraw_pool.set(withdraw_block, total_withdraw_amount);

    let protocol_pending_withdraw_balance: u64 = core_protocol_balance.get_or_use(1u8, 0u64);
    let new_protocol_pending_withdraw_balance: u64 = protocol_pending_withdraw_balance + credits_withdraw;
    core_protocol_balance.set(1u8, new_protocol_pending_withdraw_balance);

    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    // ********** CONFIRM RATIO OF ALEO AND ALE POOLS **********
    let pool_balance: u64 = core_protocol_balance.get_or_use(0u8, 0u64);
    let total_aleo_before: u64 = pool_balance + d1_state.stake + d2_state.stake + d3_state.stake + d4_state.stake + d5_state.stake - protocol_pending_withdraw_balance;
    let total_aleo_after: u64 = total_aleo_before - credits_withdraw;

    let total_ale_before: u64 = total_ale_pool;
    let total_ale_after: u64 = total_ale_before - net_ale_burn_amount;

    // aleo_before / aleo_after should equal ale_before / ale_after
    // aleo_before * ale_after = aleo_after * ale_before

    let product_1: u128 = total_aleo_before as u128 * total_ale_after as u128;
    let product_2: u128 = total_aleo_after as u128 * total_ale_before as u128;
    assert_eq(product_1, product_2);
  }

  transition withdraw_unbond(
    public unbond_amounts: [u64; 5],
    public total_amount: u64,
    public withdraw_block: u32
    ) {
    assert_eq(total_amount, unbond_amounts[0u8] + unbond_amounts[1u8] + unbond_amounts[2u8] + unbond_amounts[3u8] + unbond_amounts[4u8]);
    delegator1.aleo/unbond(unbond_amounts[0u8]);
    delegator2.aleo/unbond(unbond_amounts[1u8]);
    delegator3.aleo/unbond(unbond_amounts[2u8]);
    delegator4.aleo/unbond(unbond_amounts[3u8]);
    delegator5.aleo/unbond(unbond_amounts[4u8]);

    return then finalize(unbond_amounts, total_amount, withdraw_block);
  }

  finalize withdraw_unbond(
    public unbond_amounts: [u64; 5],
    public total_amount: u64,
    public withdraw_block: u32
    ) {
    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);
    let saved_withdraw_amount: u64 = withdraw_pool.get_or_use(withdraw_block, 0u64);

    // ********** ASSERT INPUTS AND STATE **********
    assert_eq(saved_withdraw_amount, total_amount);

    // ********** ASSERT THAT DELEGATOR PROPORTIONS DO NOT CHANGE **********
    let curr_total_stake: u64 = d1_state.stake + d2_state.stake + d3_state.stake + d4_state.stake + d5_state.stake;
    let curr_d1_ratio: i128 = d1_state.stake as i128 * PRECISION / curr_total_stake as i128;
    let curr_d2_ratio: i128 = d2_state.stake as i128 * PRECISION / curr_total_stake as i128;
    let curr_d3_ratio: i128 = d3_state.stake as i128 * PRECISION / curr_total_stake as i128;
    let curr_d4_ratio: i128 = d4_state.stake as i128 * PRECISION / curr_total_stake as i128;
    let curr_d5_ratio: i128 = d5_state.stake as i128 * PRECISION / curr_total_stake as i128;

    let new_total_stake: i128 = curr_total_stake as i128 - total_amount as i128;
    let new_d1_stake: u64 = d1_state.stake - unbond_amounts[0u8];
    let new_d2_stake: u64 = d2_state.stake - unbond_amounts[1u8];
    let new_d3_stake: u64 = d3_state.stake - unbond_amounts[2u8];
    let new_d4_stake: u64 = d4_state.stake - unbond_amounts[3u8];
    let new_d5_stake: u64 = d5_state.stake - unbond_amounts[4u8];

    let new_d1_ratio: i128 = new_d1_stake as i128  * PRECISION / new_total_stake;
    let new_d2_ratio: i128 = new_d2_stake as i128  * PRECISION / new_total_stake;
    let new_d3_ratio: i128 = new_d3_stake as i128  * PRECISION / new_total_stake;
    let new_d4_ratio: i128 = new_d4_stake as i128  * PRECISION / new_total_stake;
    let new_d5_ratio: i128 = new_d5_stake as i128  * PRECISION / new_total_stake;

    assert_eq(curr_d1_ratio, new_d1_ratio);
    assert_eq(curr_d2_ratio, new_d2_ratio);
    assert_eq(curr_d3_ratio, new_d3_ratio);
    assert_eq(curr_d4_ratio, new_d4_ratio);
    assert_eq(curr_d5_ratio, new_d5_ratio);

    // ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = state {
      stake: new_d1_stake,
      reward: d1_state.reward,
      performance: d1_state.performance,
      unbond_amount: unbond_amounts[0u8],
      validator: d1_state.validator,
      ideal_portion: d1_state.ideal_portion
    };

    let new_d2_state: state = state {
      stake: new_d2_stake,
      reward: d2_state.reward,
      performance: d2_state.performance,
      unbond_amount: unbond_amounts[1u8],
      validator: d2_state.validator,
      ideal_portion: d2_state.ideal_portion
    };

    let new_d3_state: state = state {
      stake: new_d3_stake,
      reward: d3_state.reward,
      performance: d3_state.performance,
      unbond_amount: unbond_amounts[2u8],
      validator: d3_state.validator,
      ideal_portion: d3_state.ideal_portion
    };

    let new_d4_state: state = state {
      stake: new_d4_stake,
      reward: d4_state.reward,
      performance: d4_state.performance,
      unbond_amount: unbond_amounts[3u8],
      validator: d4_state.validator,
      ideal_portion: d4_state.ideal_portion
    };

    let new_d5_state: state = state {
      stake: new_d5_stake,
      reward: d5_state.reward,
      performance: d5_state.performance,
      unbond_amount: unbond_amounts[4u8],
      validator: d5_state.validator,
      ideal_portion: d5_state.ideal_portion
    };

    delegator_state.set(DELEGATOR_1, new_d1_state);
    delegator_state.set(DELEGATOR_2, new_d2_state);
    delegator_state.set(DELEGATOR_3, new_d3_state);
    delegator_state.set(DELEGATOR_4, new_d4_state);
    delegator_state.set(DELEGATOR_5, new_d5_state);

    // *********** UPDATE PROTOCOL STATE **********
    assert_eq(protocol_state.get(0u8), 0u8);
    protocol_state.set(0u8, 10u8);

    let withdraw_pool_total: u64 = core_protocol_balance.get_or_use(1u8, 0u64);
    let new_withdraw_pool_total: u64 = withdraw_pool_total - total_amount;
    core_protocol_balance.set(1u8, new_withdraw_pool_total);
  }

  transition withdraw_claim_unbond(
    public unbond_amounts: [u64; 5]
    ) {
    // ********** CLAIM UNBOND AND SEND TO ALEO POOL OWNED BY ALE **********
    // note -- in the case that a validator has forcibly unbonded a delegator,
    // the fix_orphaned_delegator transition must be called
    delegator1.aleo/claim_unbond();
    delegator1.aleo/transfer_to_ale(unbond_amounts[0u8]);

    delegator2.aleo/claim_unbond();
    delegator2.aleo/transfer_to_ale(unbond_amounts[1u8]);

    delegator3.aleo/claim_unbond();
    delegator3.aleo/transfer_to_ale(unbond_amounts[2u8]);

    delegator4.aleo/claim_unbond();
    delegator4.aleo/transfer_to_ale(unbond_amounts[3u8]);

    delegator5.aleo/claim_unbond();
    delegator5.aleo/transfer_to_ale(unbond_amounts[4u8]);

    return then finalize(unbond_amounts);
  }

  finalize withdraw_claim_unbond(
    public unbond_amounts: [u64; 5]
    ) {
    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    // ********** ASSERT INPUTS AND STATE **********
    assert_eq(unbond_amounts[0u8], d1_state.unbond_amount);
    assert_eq(unbond_amounts[1u8], d2_state.unbond_amount);
    assert_eq(unbond_amounts[2u8], d3_state.unbond_amount);
    assert_eq(unbond_amounts[3u8], d4_state.unbond_amount);
    assert_eq(unbond_amounts[4u8], d5_state.unbond_amount);

    // ********** UPDATE DELEGATOR STATES **********
    let new_d1_state: state = state {
      stake: d1_state.stake,
      reward: d1_state.reward,
      performance: d1_state.performance,
      unbond_amount: 0u64,
      validator: d1_state.validator,
      ideal_portion: d1_state.ideal_portion
    };

    let new_d2_state: state = state {
      stake: d2_state.stake,
      reward: d2_state.reward,
      performance: d2_state.performance,
      unbond_amount: 0u64,
      validator: d2_state.validator,
      ideal_portion: d2_state.ideal_portion
    };

    let new_d3_state: state = state {
      stake: d3_state.stake,
      reward: d3_state.reward,
      performance: d3_state.performance,
      unbond_amount: 0u64,
      validator: d3_state.validator,
      ideal_portion: d3_state.ideal_portion
    };

    let new_d4_state: state = state {
      stake: d4_state.stake,
      reward: d4_state.reward,
      performance: d4_state.performance,
      unbond_amount: 0u64,
      validator: d4_state.validator,
      ideal_portion: d4_state.ideal_portion
    };

    let new_d5_state: state = state {
      stake: d5_state.stake,
      reward: d5_state.reward,
      performance: d5_state.performance,
      unbond_amount: 0u64,
      validator: d5_state.validator,
      ideal_portion: d5_state.ideal_portion
    };

    delegator_state.set(DELEGATOR_1, new_d1_state);
    delegator_state.set(DELEGATOR_2, new_d2_state);
    delegator_state.set(DELEGATOR_3, new_d3_state);
    delegator_state.set(DELEGATOR_4, new_d4_state);
    delegator_state.set(DELEGATOR_5, new_d5_state);

    // *********** CHECK & UPDATE PROTOCOL STATE **********
    assert_eq(protocol_state.get(0u8), 10u8);
    // withdraw claim finished, set protocol back to normal
    protocol_state.set(0u8, 0u8);
  }

  transition deposit_private(
    private input_record: credits.aleo/credits,
    public credits_deposit: u64,
    public referrer: address,
    public total_ale_minted: u64,
    public total_ale_burned: u64,
    public ale_to_mint: u64,
    public average_block_reward: u64
    ) -> credits.aleo/credits {
    // transfer aleo to pool
    ale.aleo/assert_totals(total_ale_minted, total_ale_burned);
    oracle.aleo/confirm_average_block_reward(average_block_reward);
    let total_ale_pool: u64 = total_ale_minted - total_ale_burned;
    let updated_record: credits.aleo/credits = credits.aleo/transfer_private_to_public(input_record, CORE_PROTOCOL, credits_deposit);
    ale.aleo/mint_private(ale_to_mint, self.caller);
    return (updated_record) then finalize(
      credits_deposit,
      total_ale_pool,
      ale_to_mint,
      average_block_reward);
  }

  finalize deposit_private(
    public credits_deposit: u64,
    public total_ale_pool: u64,
    public expected_ale_mint: u64,
    public average_block_reward: u64
    ) {
    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    let pending_withdraw_balance: u64 = core_protocol_balance.get_or_use(1u8, 0u64);

    // ********** CONFIRM RATIO OF ALEO AND ALE POOLS **********
    let pool_balance: u64 = core_protocol_balance.get_or_use(0u8, 0u64);
    let total_aleo: u64 = pool_balance - pending_withdraw_balance + d1_state.stake + d2_state.stake + d3_state.stake + d4_state.stake + d5_state.stake;
    let last_rebalance: u32 = last_rebalance_height.get(0u8);
    total_aleo += rewards_earned_at_height(block.height, last_rebalance, average_block_reward);

    // Confirm ale mint amoount
    let delta_aleo: u128 = credits_deposit as u128;
    let aleo_pool: u128 = total_aleo as u128;
    let ale_mint_amount: u64 = get_ale_mint_amount(aleo_pool, delta_aleo, total_ale_pool as u128);
    assert_eq(ale_mint_amount, expected_ale_mint);
    assert(ale_mint_amount >= 1u64);

    // Update deposit pool
    pool_balance += credits_deposit;
    core_protocol_balance.set(0u8, pool_balance);
  }

  inline rewards_earned_at_height(height: u32, last_rebalance: u32, average_block_reward: u64) -> u64 {
    let blocks_since_rebalance: u32 = height - last_rebalance;
    let rewards_earned: u64 = blocks_since_rebalance as u64 * average_block_reward;
    return rewards_earned;
  }

  inline get_ale_mint_amount(p_aleo: u128, delta_aleo: u128, p_ale: u128) -> u64 {
    let pool_ratio: u128 = ((p_ale * PRECISION_UNSIGNED) / p_aleo);
    let new_ale: u128 = (p_aleo + delta_aleo) * pool_ratio;
    let diff: u128 = (new_ale / PRECISION_UNSIGNED) - p_ale;
    let delta_ale: u64 = diff as u64;
    return delta_ale;
  }

  transition bond_deposit_pool(
    validators: [address; 5],
    transfer_amounts: [u64; 5]
    ) {
    // Transfer to each validator
    credits.aleo/transfer_public(DELEGATOR_1, transfer_amounts[0u8]);
    delegator1.aleo/bond(validators[0u8], transfer_amounts[0u8]);

    credits.aleo/transfer_public(DELEGATOR_2, transfer_amounts[1u8]);
    delegator2.aleo/bond(validators[1u8], transfer_amounts[1u8]);

    credits.aleo/transfer_public(DELEGATOR_3, transfer_amounts[2u8]);
    delegator3.aleo/bond(validators[2u8], transfer_amounts[2u8]);

    credits.aleo/transfer_public(DELEGATOR_4, transfer_amounts[3u8]);
    delegator4.aleo/bond(validators[3u8], transfer_amounts[3u8]);

    credits.aleo/transfer_public(DELEGATOR_5, transfer_amounts[4u8]);
    delegator5.aleo/bond(validators[4u8], transfer_amounts[4u8]);

    return then finalize(validators, transfer_amounts);
  }

  finalize bond_deposit_pool(
    validators: [address; 5],
    transfer_amounts: [u64; 5]
    ) {
    // ********** ASSERT INPUTS AND STATE **********
    // Confirm bonding is allowed
    let curr_protocol_state: u8 = protocol_state.get(0u8);
    let bonding_allowed: bool = curr_protocol_state == 0u8 || curr_protocol_state == 3u8;
    assert(bonding_allowed);

    // Confirm we have the minimum amount
    let pool_balance: u64 = core_protocol_balance.get_or_use(0u8, 0u64);
    assert(pool_balance >= MINIMUM_BOND_POOL);

    // Confirm transfer amounts are correct, update balances
    let total_transfer: u64 = transfer_amounts[0u8] + transfer_amounts[1u8] + transfer_amounts[2u8] + transfer_amounts[3u8] + transfer_amounts[4u8];
    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    let d1_transfer: u128 = d1_state.ideal_portion * total_transfer as u128 / PRECISION_UNSIGNED;
    let d2_transfer: u128 = d2_state.ideal_portion * total_transfer as u128 / PRECISION_UNSIGNED;
    let d3_transfer: u128 = d3_state.ideal_portion * total_transfer as u128 / PRECISION_UNSIGNED;
    let d4_transfer: u128 = d4_state.ideal_portion * total_transfer as u128 / PRECISION_UNSIGNED;
    let d5_transfer: u128 = d5_state.ideal_portion * total_transfer as u128 / PRECISION_UNSIGNED;

    assert_eq(transfer_amounts[0u8], d1_transfer as u64);
    assert_eq(transfer_amounts[1u8], d2_transfer as u64);
    assert_eq(transfer_amounts[2u8], d3_transfer as u64);
    assert_eq(transfer_amounts[3u8], d4_transfer as u64);
    assert_eq(transfer_amounts[4u8], d5_transfer as u64);

    assert_eq(validators[0u8], d1_state.validator);
    assert_eq(validators[1u8], d2_state.validator);
    assert_eq(validators[2u8], d3_state.validator);
    assert_eq(validators[3u8], d4_state.validator);
    assert_eq(validators[4u8], d5_state.validator);

    // Set new delegator state
    let new_d1_state: state = state {
      stake: d1_state.stake + transfer_amounts[0u8],
      reward: d1_state.reward,
      performance: d1_state.performance,
      unbond_amount: d1_state.unbond_amount,
      validator: d1_state.validator,
      ideal_portion: d1_state.ideal_portion
    };
    let new_d2_state: state = state {
      stake: d2_state.stake + transfer_amounts[1u8],
      reward: d2_state.reward,
      performance: d2_state.performance,
      unbond_amount: d2_state.unbond_amount,
      validator: d2_state.validator,
      ideal_portion: d2_state.ideal_portion
    };
    let new_d3_state: state = state {
      stake: d3_state.stake + transfer_amounts[2u8],
      reward: d3_state.reward,
      performance: d3_state.performance,
      unbond_amount: d3_state.unbond_amount,
      validator: d3_state.validator,
      ideal_portion: d3_state.ideal_portion
    };
    let new_d4_state: state = state {
      stake: d4_state.stake + transfer_amounts[3u8],
      reward: d4_state.reward,
      performance: d4_state.performance,
      unbond_amount: d4_state.unbond_amount,
      validator: d4_state.validator,
      ideal_portion: d4_state.ideal_portion
    };
    let new_d5_state: state = state {
      stake: d5_state.stake + transfer_amounts[4u8],
      reward: d5_state.reward,
      performance: d5_state.performance,
      unbond_amount: d5_state.unbond_amount,
      validator: d5_state.validator,
      ideal_portion: d5_state.ideal_portion
    };

    delegator_state.set(DELEGATOR_1, new_d1_state);
    delegator_state.set(DELEGATOR_2, new_d2_state);
    delegator_state.set(DELEGATOR_3, new_d3_state);
    delegator_state.set(DELEGATOR_4, new_d4_state);
    delegator_state.set(DELEGATOR_5, new_d5_state);

    // Subtract transfer amounts from pool
    pool_balance -= total_transfer;
    core_protocol_balance.set(0u8, pool_balance);
  }
}