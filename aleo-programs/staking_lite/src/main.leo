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
  const UNBONDING_PERIOD: u32: 360u32; // should this be a mapping?

  mapping commission_percent: u8 => u128;

  mapping validator: u8 => address;

  /** program controls: 0u8 ->
    * 0u8: functioning as normal
    * 1u8: commission unbonding in progress
    * 2u8: commission claimed and in account
  */
  mapping state: u8 => u8;

  mapping delegator_pool: u8 => u64;

  mapping net_deposits: u8 => u64;

  struct commission_claim {
    height: u32;
    microcredits_claimed: u64;
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

  transition set_commission_percent(commission_rate: u128) {
    // assert_eq(self.caller, admin);
    return then finalize(commission_rate);
  }

  finalize set_commission_percent(commission_rate: u128) {
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
  // set all mapping values, perhaps transfer in enough credits to bond
  //}

  inline calculate_commission_earned(rewards_since_last_claim: i64) -> u64 {
    let rewards_unsigned: u128 = rewards_since_last_claim as u128;
    let new_commission: u128 = rewards_unsigned * commission_percent.get(0u8) / PRECISION_UNSIGNED;
    let new_commission_64: u64 = new_commission as u64;
    return new_commission_64;
  }

  transition unbond_commission(amount: u64) {
    credits.aleo/unbond_public(amount);

    return then finalize();
  }

  finalize unbond_commission() {
    let current_state = state.get(0u8);
    assert(current_state != 1u8, "Commission claiming already in progress");
    // make sure withdraw unbonding not in progress?

    // calculate commission earned since last claim
    let bonded: u64 = credits.aleo/bonded.get(CORE_PROTOCOL).microcredits;
    let total_rewards: u64 = bonded - net_deposits.get(0u8);
    let rewards_since_last_claim: i64 = total_rewards - last_commission_claim.get(0u8).remaining_rewards;
    let rewards_pos: bool = rewards_since_last_claim > 0i64;
    let commission_earned: u64 = reward_pos
      ? calculate_commission_earned(rewards_since_last_claim)
      : 0u64;

    assert(commission_earned > 0u64, "No commission to claim");

    state.set(0u8, 1u8);

    // set last_commission_claim
    let new_claim: commission_claim = commission_claim {
      height: block.height + UNBONDING_PERIOD,
      microcredits_claimed: commission_earned,
      remaining_rewards: total_rewards - commission_earned
    };
    last_commission_claim.set(0u8, new_claim);
  }

  // note: will also claim withdrawn credits that were already unbonded
  transition claim_commission() {
    credits.aleo/claim_unbond_public();

    return then finalize();
  }

  finalize claim_commission() {
    let current_state = state.get(0u8);
    assert_eq(current_state, 1u8, "Commission claiming not in progress");

    let unbonding_height: u32 = last_commission_claim.get(0u8).height;
    assert(block.height >= unbonding_height, "Unbonding period not over");

    // update state
    state.set(0u8, 0u8); // update when we start using state 2
  }

  // bond_all
  // transfer_commission

  transition deposit_public(
    amount: u64,
    validator_address: address,
    expected_mint_amount: u64,
    minimum_mint_amount: u64
  ) {
    // TODO: convert to transfer_private_to_public
    credits.aleo/transfer_public(CORE_PROTOCOL, amount);
    credits.aleo/bond_public(validator_address, amount);

    return then finalize(amount, validator_address, expected_mint_amount, minimum_mint_amount);
  }

  finalize deposit_public(
    amount: u64,
    validator_address: address,
    expected_mint_amount: u64,
    minimum_mint_amount: u64
  ) {
    let stored_validator: address = validator.get(0u8);
    assert_eq(validator_address, stored_validator, "Validator address does not match");

    // calculate commission_earned
    let bonded: u64 = credits.aleo/bonded.get(CORE_PROTOCOL).microcredits;
    let total_rewards: u64 = bonded - net_deposits.get(0u8);
    let rewards_since_last_claim: i64 = total_rewards - last_commission_claim.get(0u8).remaining_rewards;
    let rewards_pos: bool = rewards_since_last_claim > 0i64;
    let new_commission_earned: u64 = reward_pos
      ? calculate_commission_earned(rewards_since_last_claim)
      : 0u64;

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

  inline calculate_mint_amount(total_balance: u128, delta_aleo: u128, pool: u128) -> u64 {
    let pool_ratio: u128 = ((pool * PRECISION_UNSIGNED) / total_balance);
    let new_pool: u128 = (total_balance + delta_aleo) * pool_ratio;
    let diff: u128 = (new_pool / PRECISION_UNSIGNED) - pool;
    let pool_delta: u64 = diff as u64;
    return pool_delta;
  }

  transition withdraw_public(microcredits: u64, total_withdrawal: u64) {
    credits.aleo/unbond_public(total_withdrawal);

    return then finalize(microcredits, total_withdrawal, self.caller);
  }

  finalize withdraw_public(microcredits: u64, total_withdrawal: u64, owner: address) {
    let current_state: u8 = state.get(0u8);
    assert(current_state != 1u8, "Commission claiming in progress");

    // assert that they have enough to withdraw
    let delegator: delegator_state = delegators.get(owner);
    assert(delegator.microcredits >= microcredits, "Not enough microcredits to withdraw");

    // calculate pool percentage
    let pool_balance: u128 = delegator.pool_balance as u128;
    let pool_ratio: u128 = (pool_balance * PRECISION_UNSIGNED) / delegator.microcredits as u128;
    let pool_withdrawal: u128 = (microcredits as u128 * pool_ratio) / PRECISION_UNSIGNED;

    // calculate commssion earned since last claim
    let bonded: u64 = credits.aleo/bonded.get(CORE_PROTOCOL).microcredits;
    let total_rewards: u64 = bonded - net_deposits.get(0u8);
    let rewards_since_last_claim: i64 = total_rewards - last_commission_claim.get(0u8).remaining_rewards;
    let rewards_pos: bool = rewards_since_last_claim > 0i64;
    let new_commission_earned: u64 = reward_pos
      ? calculate_commission_earned(rewards_since_last_claim)
      : 0u64;

    // get withdrawal amount with rewards
    let delegator_pool_balance: u128 = delegator_pool.get(0u8) as u128;
    let withdraw_ratio: u128 = (pool_withdrawal * PRECISION_UNSIGNED) / delegator_pool_balance;

    let total_balance: u128 = bonded as u128 - new_commission_earned as u128;
    let withdraw_amount_with_rewards: u128 = (total_balance * withdraw_ratio) / PRECISION_UNSIGNED;

    assert(withdraw_amount_with_rewards <= total_withdrawal as u128, "Incorrect withdrawal amount");
    // TODO: add minimum withdrawal amount

    // update withdrawals mapping
    // TODO: account for exisiting withdrawal
    let new_withdrawal_state: withdrawal_state = withdrawal_state {
      microcredits: withdraw_amount_with_rewards as u64,
      claim_block: block.height + UNBONDING_PERIOD // plus buffer?
    };
    withdrawals.set(owner, new_withdrawal_state);

    // update pool balance
    let new_pool_balance: u128 = delegator_pool_balance - pool_withdrawal;
    delegator_pool.set(0u8, new_pool_balance as u64);

    // update net deposits
    let new_deposits: u64 = net_deposits.get(0u8) - microcredits;
    net_deposits.set(0u8, new_deposits);

    // update delegators mapping
    delegator.microcredits -= microcredits;
    delegator.pool_balance -= pool_withdrawal;

    if (delegator.microcredits == 0u64) {
      delegators.remove(owner);
    } else {
      delegators.set(self.caller, delegator);
    }

    // set withdrawal-specific unbond state?
  }

  // note: will also claim any commission credits that were already unbonded
  transition withdraw_claim(amount: u64) {
    credits.aleo/claim_unbond_public();
    credits.aleo/transfer_public(self.caller, amount);

    return then finalize(self.caller, amount);
  }

  finalize withdraw_claim(owner: address, amount: u64) {
    let withdrawal: withdrawal_state = withdrawals.get(owner);
    assert(block.height >= withdrawal.claim_block, "Unbonding period not over");
    assert_eq(withdrawal_amount.microcredits, amount, "Claim amount does not match withdrawal amount");

    // remove withdrawal from withdrawals mapping
    withdrawals.remove(self.caller);
  }
}