import credits.aleo;

// The 'staking_lite' program.
program staking_lite.aleo {
/**
 * deposit
 * withdraw
 * claim_withdrawal
 ** withdraw_unbond
 * bond_pool
 ** bond pool if balance (deposits - withdrawn credits awaiting claim) is greater than 1 credit
 * unbond_all
 * claim_unbond
 * set_commission
 * set_validator
 *
 */

  // const for admin address??
  const PRECISION_UNSIGNED: u128 = 1000u128;

  mapping commission_percent: u8 => u128;

  mapping validator: u8 => address;

  /** program controls: 0u8 ->
    * 0u8: functioning as normal
    * 1u8: upcoming commission claiming
    * 2u8: commission claiming in progress
  */
  mapping state: u8 => u8;

  mapping delegator_pool: u8 => u64;

  mapping net_deposits: u8 => u64;

  mapping commission_earned: u8 => u64;

  struct commission_claim {
    height: u32;
    remaining_rewards: u64;
  }

  mapping last_commission_claim: u8 => commission_claim;

  struct delegator_state {
    microcredits: u64;
    pool_balance: u64;
  }

  mapping delegators: address => delegator_state;

  struct withdrawal_state {
    microcredits: u64;
    claim_block: u32;
  }

  mapping withdrawals: address => withdrawal_state;

  transition set_commission(commission_rate: u64) {
    // assert_eq(self.caller, admin);
    return then finalize(commission_rate);
  }

  finalize set_commission(commission_rate: u64) {
    commission.set(0u8, commission_rate);
  }

  transition set_validator(validator_address: address) {
    // assert_eq(self.caller, admin);
    return then finalize(validator_address);
  }

  finalize set_validator(validator_address: address) {
    validator.set(0u8, validator_address);
  }

  // transtion initialize() {
  //
  //}

  transition prepare_claim_commission(amount: u64) {
    credits.aleo/unbond_public(amount);

    return then finalize();
  }

  finalize prepare_claim_commission() {
    assert(state.get_or_use(0u8, 0u8) == 0u8, "Commission claiming already in progress");
    assert(commission_earned.get_or_use(0u8, 0u64) > 0u64, "No commission to claim");
    // make sure unbonding not in progress?

    state.set(0u8, 1u8);

    // reset commissions
    commission_earned.set(0u8, 0u64);
  }

  transition bond_pool(amount: u64) {
    // assert_eq(self.caller, admin);
    let validator_address: address = validator.get(0u8);
    credits.aleo/bond_public(validator_address, amount);
    return then finalize(amount);
  }

  finalize bond_pool(amount: u64) {
    let new_pool_balance: u64 = delegator_pool.get(0u8) + amount;
    delegator_pool.set(0u8, new_pool_balance);
  }

  transition deposit_public(
    amount: u64,
    expected_mint_amount: u64,
    minimum_mint_amount: u64
  ) {
    credits.aleo/transfer_public(CORE_PROTOCOL, amount);
    return then finalize(amount);
  }

  finalize deposit_public(
    amount: u64,
    expected_mint_amount: u64,
    minimum_mint_amount: u64
  ) {
    // update commission_earned
    let bonded: u64 = credits.aleo/bonded.get(CORE_PROTOCOL).microcredits;
    let total_rewards: u64 = bonded - net_deposits.get(0u8);
    let rewards_since_last_claim: i64 = total_rewards - last_commission_claim.get(0u8).remaining_rewards;
    let current_commision_earned: u64 = commission_earned.get(0u8);
    let rewards_pos: bool = rewards_since_last_claim > 0i64;
    let new_commission_earned: u64 = reward_pos
      ? calculate_commission_earned(current_commision_earned, rewards_since_last_claim)
      : 0u64;
    commission_earned.set(0u8, new_commission_earned);

    // calculate mint amount
    let total_balance: u128 = bonded as u128 - new_commission_earned as u128;
    let delta_aleo: u128 = amount as u128;
    let pool: u128 = delegator_pool.get(0u8) as u128;
    let mint_amount: u64 = calculate_mint_amount(total_balance, delta_aleo, pool);

    // assert mint amount
    assert(mint_amount >= minimum_mint_amount, "Mint amount is less than minimum mint amount");
    assert(mint_amount <= expected_mint_amount, "Mint amount is greater than expected mint amount");

    // update pool balance
    let new_pool_balance: u64 = delegator_pool.get(0u8) + mint_amount;
    delegator_pool.set(0u8, new_pool_balance);

    // update net_deposits
    let new_deposits: u64 = net_deposits.get(0u8) + amount;
    net_deposits.set(0u8, new_deposits);

    // update delegators mapping
    let new_delegator_state: delegator_state = delegator_state {
      microcredits: 0u64,
      pool_balance: 0u64
    };
    new_delegator_state: delegator_state = delegators.get_or_use(self.caller, new_delegator_state);
    new_delegator_state.microcredits += amount;
    new_delegator_state.pool_balance += mint_amount;
    delegators.set(self.caller, new_delegator_state);
  }

  inline calculate_commission_earned(current_commision_earned: u64, rewards_since_last_claim: i64) -> u64 {
    let additional_commission: u128 = rewards_since_last_claim as u128 * commission_percent.get(0u8) / PRECISION_UNSIGNED;
    return current_commision_earned + rewards_since_last_claim as u64;
  }

  inline calculate_mint_amount(total_balance: u128, delta_aleo: u128, pool: u128) -> u64 {
    let pool_ratio: u128 = ((pool * PRECISION_UNSIGNED) / total_balance);
    let new_pool: u128 = (total_balance + delta_aleo) * pool_ratio;
    let diff: u128 = (new_pool / PRECISION_UNSIGNED) - pool;
    let pool_delta: u64 = diff as u64;
    return pool_delta;
  }

  transition withdraw_public(microcredits: u64) {
    return then finalize(microcredits);
  }

  finalize withdraw_public(microcredits: u64) {
    // assert that they have enough to withdraw

    // calculate the amount of Laleo to withdraw
    // -> update commission earned

    // unbond

    // set unbond state?

    // update the balances

    // update withdrawals mapping
  }
}