import credits.aleo;

program staking_lite.aleo {
  // Owner of the program
  const ADMIN: address = aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru;
  // Address of this program
  const CORE_PROTOCOL: address = aleo17hwvp7fl5da40hd29heasjjm537uqce489hhuc3lwhxfm0njucpq0rvfny;
  const PRECISION_UNSIGNED: u128 = 1000u128;
  const UNBONDING_PERIOD: u32: 360u32; // should this be a mapping?
  const MINIMUM_DELEGATOR_BALANCE: u64 = 10_000_000u64; // 10 credits (may change before mainnet)

  mapping commission_percent: u8 => u128;

  mapping validator: u8 => address;

  /** Program controls: 0u8 ->
    * 0u8: functioning as normal
    * 1u8: commission unbonding in progress
    * 10u8: full unbond in progress
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

  mapping pending_withdrawal: u8 => u64;

  transition initialize(commission_rate: u128, validator_address: address) {
    assert_eq(self.caller, ADMIN);
  }

  finalize initialize(commission_rate: u128, validator_address: address) {
    commission_percent.set(0u8, commission_rate);
    validator.set(0u8, validator_address);
    state.set(0u8, 0u8);

    delegator_pool.set(0u8, 0u64);
    net_deposits.set(0u8, 0u64);
    last_commission_claim.set(0u8, commission_claim {
      height: block.height,
      microcredits_claimed: 0u64,
      remaining_rewards: 0u64
    });
    pending_withdrawal.set(0u8, 0u64);
  }

  transition set_commission_percent(commission_rate: u128) {
    assert_eq(self.caller, ADMIN);
    return then finalize(commission_rate);
  }

  finalize set_commission_percent(commission_rate: u128) {
    commission.set(0u8, commission_rate);
  }

  transition unbond_all(pool_balance: u64) {
    assert_eq(self.caller, ADMIN);
    credits.aleo/unbond_public(pool_balance);

    return then finalize(pool_balance);
  }

  finalize unbond_all(pool_balance: u64) {
    let current_state = state.get(0u8);
    assert_eq(current_state, 0u8, "Action not allowed at this time"); // should this always be allowed?

    let balance_diff: i64 = pool_balance - credits.aleo/bonded.get(CORE_PROTOCOL).microcredits;
    let residual_balance: bool = balance_diff > MINIMUM_DELEGATOR_BALANCE;
    assert(!residual_balance, "Incorrect balance. Pool will not be fully unbonded");

    state.set(0u8, 10u8);
  }

  transition change_validator(new_validator: address, rebond_amount: u64) {
    assert_eq(self.caller, ADMIN);
    credits.aleo/claim_unbond_public();
    credits.aleo/bond_public(new_validator, rebond_amount);

    return then finalize(new_validator, rebond_amount);
  }

  finalize change_validator(new_validator: address, rebond_amount: u64) {
    let current_state: u8 = state.get(0u8);
    assert_eq(current_state, 10u8, "Please unbond before changing validators");

    let current_validator: address = validator.get(0u8);
    assert(new_validator != current_validator, "New validator is the same as the current validator");

    let account_balance: u64 = credits.aleo/account.get(CORE_PROTOCOL);
    let unbonding_balance: u64 = credits.aleo/unbonding.get(CORE_PROTOCOL).microcredits; // should theoretically be 0
    let total_balance: u64 = account_balance + unbonding_balance;
    let pending_withdrawals: u64 = pending_withdrawal.get(0u8);
    let rebond_balance: u64 = total_balance - pending_withdrawals;
    assert(rebond_amount <= rebond_balance, "Rebond amount is greater than available balance");

    // Update validator
    validator.set(0u8, new_validator);

    // Update state
    state.set(0u8, 0u8);
  }

  inline calculate_commission_earned(
    bonded: u64,
    total_deposits: u64,
    remaining_at_last_claim: u64
  ) -> u64 {
    let total_rewards: u64 = bonded - total_deposits;
    let rewards_since_last_claim: i64 = total_rewards - remaining_at_last_claim;
    let rewards_pos: bool = rewards_since_last_claim > 0i64;

    if (!rewards_pos) {
      return 0u64;
    }

    let rewards_unsigned: u128 = rewards_since_last_claim as u128;
    let new_commission: u128 = rewards_unsigned * commission_percent.get(0u8) / PRECISION_UNSIGNED;
    let new_commission_64: u64 = new_commission as u64;
    return new_commission_64;
  }

  transition unbond_commission(amount: u64) {
    assert_eq(self.caller, ADMIN);
    credits.aleo/unbond_public(amount);

    return then finalize(amount);
  }

  finalize unbond_commission(amount: u64) {
    let current_state: u8 = state.get(0u8);
    assert_eq(current_state, 0u8, "Commission cannot be claimed at this time");

    // Calculate commission earned since last claim
    let bonded: u64 = credits.aleo/bonded.get(CORE_PROTOCOL).microcredits;
    let total_deposits: u64 = net_deposits.get(0u8);
    let rewards_at_last_claim: u64 = last_commission_claim.get(0u8).remaining_rewards;
    let commission_earned: u64 = calculate_commission_earned(bonded, total_deposits, rewards_at_last_claim);

    assert(commission_earned > 0u64, "No commission to claim");
    assert(commission_earned >= amount, "Incorrect commission amount");

    state.set(0u8, 1u8);

    // Set last_commission_claim
    let new_claim: commission_claim = commission_claim {
      height: block.height + UNBONDING_PERIOD,
      microcredits_claimed: commission_earned,
      remaining_rewards: total_rewards - amount
    };
    last_commission_claim.set(0u8, new_claim);
  }

  transition claim_commission() {
    credits.aleo/claim_unbond_public();

    return then finalize();
  }

  finalize claim_commission() {
    let current_state: u8 = state.get(0u8);
    assert_eq(current_state, 1u8, "Commission claiming not in progress");

    let unbonding_height: u32 = last_commission_claim.get(0u8).height;
    assert(block.height >= unbonding_height, "Unbonding period not over");

    // Update state
    state.set(0u8, 0u8);
  }

  transition bond_all(validator_address: address, amount: u64) {
    assert_eq(self.caller, ADMIN);
    credits.aleo/bond_public(validator_address, amount);

    return then finalize(validator_address, amount);
  }

  finalize bond_all(validator_address: address, amount: u64) {
    let current_state: u8 = state.get(0u8);
    assert_eq(current_state, 0u8);

    let unbonding_balance: u64 = credits.aleo/unbonding.get(CORE_PROTOCOL).microcredits;
    assert_eq(unbonding_balance, 0u64, "Claim unbonded credits before rebonding");

    let account_balance: u64 = credits.aleo/account.get(CORE_PROTOCOL);
    let pending_withdrawals: u64 = pending_withdrawal.get(0u8);
    let available_balance: u64 = account_balance - pending_withdrawals;
    assert(amount <= available_balance, "Rebond amount is greater than available balance");
  }

  transition transfer_commission(recipient: address, amount: u64) {
    assert_eq(self.caller, ADMIN);
    credits.aleo/transfer_public(recipient, amount);

    return then finalize(recipient, amount);
  }

  finalize transfer_commission(recipient: address, amount: u64) {
    let current_state: u8 = state.get(0u8);
    assert_eq(current_state, 0u8, "Commission cannot be transferred at this time");

    let stored_validator: address = validator.get(0u8);
    assert_eq(validator_address, stored_validator, "Validator address does not match");

    let account_balance: u64 = credits.aleo/account.get(CORE_PROTOCOL);
    let unbonding_balance: u64 = credits.aleo/unbonding.get(CORE_PROTOCOL).microcredits;
    let total_balance: u64 = account_balance + unbonding_balance;
    let pending_withdrawals: u64 = pending_withdrawal.get(0u8);
    let available_commission: u64 = total_balance - pending_withdrawals;
    assert(amount <= available_commission, "Amount is greater than available balance");
  }

  transition deposit_public(
    input_record: credits.aleo/credits,
    amount: u64,
    validator_address: address,
    expected_mint_amount: u64,
    minimum_mint_amount: u64
  ) -> credits.aleo/credits {
    let updated_record: credits.aleo.credits = credits.aleo/transfer_private_to_public(input_record, CORE_PROTOCOL, amount);
    credits.aleo/bond_public(validator_address, amount);

    return (updated_record) then finalize(amount, validator_address, expected_mint_amount, minimum_mint_amount);
  }

  finalize deposit_public(
    amount: u64,
    validator_address: address,
    expected_mint_amount: u64,
    minimum_mint_amount: u64
  ) {
    let stored_validator: address = validator.get(0u8);
    assert_eq(validator_address, stored_validator, "Validator address does not match");

    // Assert that we're not switching validators
    let current_state: u8 = state.get(0u8);
    assert(current_state !== 10u8, "Deposit is not allowed at this time");

    // Calculate new commission earned
    let bonded: u64 = credits.aleo/bonded.get(CORE_PROTOCOL).microcredits;
    let total_deposits: u64 = net_deposits.get(0u8);
    let rewards_at_last_claim: u64 = last_commission_claim.get(0u8).remaining_rewards;
    let new_commission_earned: u64 = calculate_commission_earned(bonded, total_deposits, rewards_at_last_claim);

    // Calculate mint amount
    let total_balance: u128 = bonded as u128 - new_commission_earned as u128;
    let delta_aleo: u128 = amount as u128;
    let pool: u128 = delegator_pool.get(0u8) as u128;
    let mint_amount: u64 = calculate_mint_amount(total_balance, delta_aleo, pool);

    // Assert mint amount
    assert(mint_amount >= minimum_mint_amount, "Mint amount is less than minimum mint amount");
    assert(mint_amount <= expected_mint_amount, "Mint amount is greater than expected mint amount");

    // Update pool balance
    let new_pool_balance: u64 = delegator_pool.get(0u8) + mint_amount;
    delegator_pool.set(0u8, new_pool_balance);

    // Update net_deposits
    let new_deposits: u64 = net_deposits.get(0u8) + amount;
    net_deposits.set(0u8, new_deposits);

    // Update delegators mapping
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
    assert_eq(current_state, 0u8, "Withdrawal not allowed at this time");

    // Assert that they have enough to withdraw
    let delegator: delegator_state = delegators.get(owner);
    assert(delegator.microcredits >= microcredits, "Not enough microcredits to withdraw");

    // Calculate how much to withdraw from delegator pool
    let pool_balance: u128 = delegator.pool_balance as u128;
    let pool_ratio: u128 = (pool_balance * PRECISION_UNSIGNED) / delegator.microcredits as u128;
    let pool_withdrawal: u128 = (microcredits as u128 * pool_ratio) / PRECISION_UNSIGNED;

    // Calculate new commission earned
    let bonded: u64 = credits.aleo/bonded.get(CORE_PROTOCOL).microcredits;
    let total_deposits: u64 = net_deposits.get(0u8);
    let rewards_at_last_claim: u64 = last_commission_claim.get(0u8).remaining_rewards;
    let new_commission_earned: u64 = calculate_commission_earned(bonded, total_deposits, rewards_at_last_claim);

    // Get withdrawal amount with rewards
    let delegator_pool_balance: u128 = delegator_pool.get(0u8) as u128;
    let withdraw_ratio: u128 = (pool_withdrawal * PRECISION_UNSIGNED) / delegator_pool_balance;

    let total_balance: u128 = bonded as u128 - new_commission_earned as u128;
    let withdraw_amount_with_rewards: u128 = (total_balance * withdraw_ratio) / PRECISION_UNSIGNED;

    // If the calculated withdrawal amount is greater than total_withdrawal, the excess will become commission
    assert(withdraw_amount_with_rewards >= total_withdrawal as u128, "Incorrect withdrawal amount");

    // Update withdrawals mappings
    let withdrawal: withdrawal_state = withdrawal_state {
      microcredits: 0u64,
      claim_block: block.height + UNBONDING_PERIOD // plus buffer?
    };
    let new_withdrawal_state = withdrawals.get_or_use(owner, withdrawal);
    new_withdrawal_state.microcredits += withdraw_amount_with_rewards as u64;
    new_withdrawal_state.claim_block = block.height + UNBONDING_PERIOD;
    withdrawals.set(owner, new_withdrawal_state);


    // Update pending withdrawal
    let currently_pending: u64 = pending_withdrawal.get(0u8);
    pending_withdrawal.set(0u8, currently_pending + total_withdrawal);

    // Update pool balance
    let new_pool_balance: u128 = delegator_pool_balance - pool_withdrawal;
    delegator_pool.set(0u8, new_pool_balance as u64);

    // Update net deposits
    let new_deposits: u64 = net_deposits.get(0u8) - microcredits;
    net_deposits.set(0u8, new_deposits);

    // Update delegators mapping
    delegator.microcredits -= microcredits;
    delegator.pool_balance -= pool_withdrawal as u64;

    if (delegator.microcredits == 0u64) {
      delegators.remove(owner);
    } else {
      delegators.set(self.caller, delegator);
    }
  }

  transition withdraw_claim(amount: u64) {
    credits.aleo/claim_unbond_public();
    credits.aleo/transfer_public(self.caller, amount);

    return then finalize(self.caller, amount);
  }

  finalize withdraw_claim(owner: address, amount: u64) {
    let withdrawal: withdrawal_state = withdrawals.get(owner);
    assert(block.height >= withdrawal.claim_block, "Unbonding period not over");
    assert_eq(withdrawal_amount.microcredits, amount, "Claim amount does not match withdrawal amount");

    // Remove withdrawal from mapping
    withdrawals.remove(self.caller);

    // Update pending withdrawal
    let currently_pending: u64 = pending_withdrawal.get(0u8);
    pending_withdrawal.set(0u8, currently_pending - amount);
  }
}