import credits.aleo;
import multi_token_support_program_v1.aleo;
import pondo_oracle.aleo;
import pondo_staked_aleo_token.aleo;
import pondo_token.aleo;
import pondo_delegator1.aleo;
import pondo_delegator2.aleo;
import pondo_delegator3.aleo;
import pondo_delegator4.aleo;
import pondo_delegator5.aleo;

program pondo_core_protocol.aleo {
  const PRECISION_UNSIGNED: u128 = 10_000u128;
  const PORTION_1: u128 = 3700u128;
  const PORTION_2: u128 = 2600u128;
  const PORTION_3: u128 = 1600u128;
  const PORTION_4: u128 = 1200u128;
  const PORTION_5: u128 = 900u128;

  // The number of blocks in an epoch
  const BLOCKS_PER_EPOCH: u32 = 120_960u32; // 1 week of blocks, assuming 5 sec per block
  const REBALANCE_PERIOD: u32 = 17_280u32; // 1 day of blocks, assuming 5 sec per block
  const PROTOCOL_FEE: u128 = 1000u128; // out of 10,000, 10% fee

  const WITHDRAW_WAIT_MINIMUM: u32 = 43_200u32; // aproximately 2.5 days of blocks, assuming 5 sec per block
  const INSTANT_WITHDRAW_FEE: u128 = 025u128; // out of 10,000, 0.25% fee
  const MAX_GUARANTEED_LIQUIDITY: u64 = 250_000_000_000u64; // 250K credits
  const MIN_LIQUIDITY_PERCENT: u128 = 250u128; // 2.5% of the total aleo managed by the protocol

  const PALEO_TOKEN_ID: field = 1751493913335802797273486270793650302076377624243810059080883537084141842600field;
  const CREDITS_TOKEN_ID: field = 3443843282313283355522573239085696902919850365217539366784739393210722344986field;

  // Delegator states
  const BOND_ALLOWED: u8 = 0u8;
  const UNBOND_NOT_ALLOWED: u8 = 1u8;
  const UNBOND_ALLOWED: u8 = 2u8;
  const UNBONDING: u8 = 3u8;
  const TERMINAL: u8 = 4u8;

  // The One Group Address
  const ONE_GROUP_ADDRESS: address = aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0;

  // copied from credits.aleo, as structs are not importable
  struct bond_state {
    validator: address,
    microcredits: u64
  }

  // copied from credits.aleo, as structs are not importable
  struct unbond_state {
    microcredits: u64,
    height: u32
  }

  // shadowed from pondo_oracle.aleo
  struct validator_datum {
    delegator: address,
    validator: address,
    block_height: u32,
    bonded_microcredits: u64,
    microcredits_yield_per_epoch: u128,
    commission: u8,
    boost: u128
  }

  struct validator_state {
    validator: address,
    commission: u8
  }

  // 0u8 -> the current validator set
  const CURRENT_VALIDATOR_SET: u8 = 0u8;
  // 1u8 -> the next validator set
  const NEXT_VALIDATOR_SET: u8 = 1u8;
  mapping validator_set: u8 => [validator_state; 5];

  // 0u8 -> current state of the protocol
  const PROTOCOL_STATE_KEY: u8 = 0u8;
  // * 0u8 -> normal operation, post rebalance
  const NORMAL_STATE: u8 = 0u8;
  // * 1u8 -> rebalancing in progress, all funds are in the core protocol
  const PREP_REBALANCE_STATE: u8 = 1u8;
  const REBALANCING_STATE: u8 = 2u8;
  mapping protocol_state: u8 => u8;

  // Metadata mapping for the balances of ALEO held in the program
  // 0u8 -> the last tracked balance of aleo bonded via the protocol (not including withdrawals)
  // 1u8 -> the amount of credits that have been withdrawn but are still bonded via the protocol
  // 2u8 -> the amount of credits that have been withdrawn and are reserved for withdrawals
  const DELEGATED_BALANCE: u8 = 0u8;
  const BONDED_WITHDRAWALS: u8 = 1u8;
  const CLAIMABLE_WITHDRAWALS: u8 = 2u8;
  mapping balances: u8 => u64;


  // 0u8 -> the total amount of pALEO owed to the protocol, yet to be minted
  mapping owed_commission: u8 => u64;

  // 0u8 -> the last epoch where a rebalance occured, zero-indexed (block.height / BLOCKS_PER_EPOCH)
  // Updated after rebalancing at the start of each epoch
  mapping last_rebalance_epoch: u8 => u32;

  struct withdrawal_state {
    microcredits: u64,
    claim_block: u32
  }

  // address -> pending withdrawal for this address
  mapping withdrawals: address => withdrawal_state;
  // u32 -> batch number (batch height / BLOCKS_PER_EPOCH) -> total amount of aleo reserved for withdrawals in this batch
  // withdrawals are processed at the start of the next epoch i.e. batch 0u32 is processed at the start of epoch 1u32
  mapping withdrawal_batches: u32 => u64;

  async transition initialize(transfer_amount: u64) -> Future {
    assert(transfer_amount >= 102u64); // Assert that the transfer amount is at least 102 microcredits, to ensure there is no division by zero, and that there is enough for the liquidity pool

    // Transfer ALEO to the protocol
    let f0: Future = credits.aleo/transfer_public_as_signer(self.address, transfer_amount);

    // Initialize pALEO and PNDO tokens
    let f1: Future = pondo_staked_aleo_token.aleo/register_token();
    let f2: Future = pondo_staked_aleo_token.aleo/mint_public(transfer_amount, self.signer);
    let f3: Future = pondo_token.aleo/initialize_token();

    // Initialize delegators
    let f4: Future = pondo_delegator1.aleo/initialize();
    let f5: Future = pondo_delegator2.aleo/initialize();
    let f6: Future = pondo_delegator3.aleo/initialize();
    let f7: Future = pondo_delegator4.aleo/initialize();
    let f8: Future = pondo_delegator5.aleo/initialize();

    return finalize_initialize(f0, f1, f2, f3, f4, f5, f6, f7, f8, transfer_amount);
  }

  async function finalize_initialize(
    public f0: Future,
    public f1: Future,
    public f2: Future,
    public f3: Future,
    public f4: Future,
    public f5: Future,
    public f6: Future,
    public f7: Future,
    public f8: Future,
    public transfer_amount: u64
  ) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
    f4.await();
    f5.await();
    f6.await();
    f7.await();
    f8.await();

    balances.set(DELEGATED_BALANCE, transfer_amount);
    balances.set(BONDED_WITHDRAWALS, 0u64);
    balances.set(CLAIMABLE_WITHDRAWALS, 0u64);
    owed_commission.set(0u8, 0u64);
    protocol_state.set(PROTOCOL_STATE_KEY, REBALANCING_STATE);

    let top_validators: [address; 10] = pondo_oracle.aleo/top_validators.get_or_use(
      0u8,
      [
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS
      ]
    );
    let default_datum: validator_datum = validator_datum {
      delegator: ONE_GROUP_ADDRESS,
      validator: ONE_GROUP_ADDRESS,
      block_height: 0u32,
      bonded_microcredits: 0u64,
      microcredits_yield_per_epoch: 0u128,
      commission: 40u8, // Add a safety margin to the commission rate because this will represent a real validator after automatic code updates
      boost: 0u128
    };
    let validator1: validator_datum = pondo_oracle.aleo/validator_data.get_or_use(top_validators[0u8], default_datum);
    let validator2: validator_datum = pondo_oracle.aleo/validator_data.get_or_use(top_validators[1u8], default_datum);
    let validator3: validator_datum = pondo_oracle.aleo/validator_data.get_or_use(top_validators[2u8], default_datum);
    let validator4: validator_datum = pondo_oracle.aleo/validator_data.get_or_use(top_validators[3u8], default_datum);
    let validator5: validator_datum = pondo_oracle.aleo/validator_data.get_or_use(top_validators[4u8], default_datum);

    let next_validator_set: [validator_state; 5] = [
      validator_state { validator: validator1.validator, commission: validator1.commission },
      validator_state { validator: validator2.validator, commission: validator2.commission },
      validator_state { validator: validator3.validator, commission: validator3.commission },
      validator_state { validator: validator4.validator, commission: validator4.commission },
      validator_state { validator: validator5.validator, commission: validator5.commission }
    ];
    validator_set.set(NEXT_VALIDATOR_SET, next_validator_set);

    let current_epoch: u32 = block.height / BLOCKS_PER_EPOCH;
    last_rebalance_epoch.set(0u8, current_epoch);
  }

  // -------------------
  // DEPOSIT FUNCTIONS
  // -------------------

  async transition deposit_public_as_signer(
    public credits_deposit: u64,
    public expected_paleo_mint: u64,
    public referrer: address
  ) -> Future {
    assert(expected_paleo_mint >= 1u64); // Assert that the expected pALEO mint is at least 1 microcredit

    // Transfer ALEO to pool
    let f0: Future = credits.aleo/transfer_public_as_signer(self.address, credits_deposit);
    // Mint pALEO to depositor
    let f1: Future = pondo_staked_aleo_token.aleo/mint_public(expected_paleo_mint, self.signer);

    return finalize_deposit_public_as_signer(f0, f1, credits_deposit, expected_paleo_mint);
  }

  async function finalize_deposit_public_as_signer(
    public f0: Future,
    public f1: Future,
    public credits_deposit: u64,
    public expected_paleo_mint: u64
  ) {
    f0.await();
    f1.await();

    let base_bond_state: bond_state = bond_state {
      validator: self.address,
      microcredits: 0u64
    };
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator1.aleo, base_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator2.aleo, base_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator3.aleo, base_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator4.aleo, base_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator5.aleo, base_bond_state).microcredits;

    let base_unbond_state: unbond_state = unbond_state {
      microcredits: 0u64,
      height: 0u32
    };
    let delegator1_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator1.aleo, base_unbond_state).microcredits;
    let delegator2_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator2.aleo, base_unbond_state).microcredits;
    let delegator3_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator3.aleo, base_unbond_state).microcredits;
    let delegator4_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator4.aleo, base_unbond_state).microcredits;
    let delegator5_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator5.aleo, base_unbond_state).microcredits;

    let delegator1_account: u64 = credits.aleo/account.get_or_use(pondo_delegator1.aleo, 0u64);
    let delegator2_account: u64 = credits.aleo/account.get_or_use(pondo_delegator2.aleo, 0u64);
    let delegator3_account: u64 = credits.aleo/account.get_or_use(pondo_delegator3.aleo, 0u64);
    let delegator4_account: u64 = credits.aleo/account.get_or_use(pondo_delegator4.aleo, 0u64);
    let delegator5_account: u64 = credits.aleo/account.get_or_use(pondo_delegator5.aleo, 0u64);

    let total_bonded: u64 = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: u64 = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let total_unbonding: u64 = delegator1_unbonding + delegator2_unbonding + delegator3_unbonding + delegator4_unbonding + delegator5_unbonding;
    let bonded_withdrawals: u64 = balances.get(BONDED_WITHDRAWALS);
    let total_delegated: i64 = total_bonded as i64 + total_account as i64 + total_unbonding as i64 - bonded_withdrawals as i64;

    let currently_delegated: u64 = balances.get(DELEGATED_BALANCE);
    let current_owed_commission: u64 = owed_commission.get(0u8);
    let total_paleo_pool: u128 = multi_token_support_program_v1.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128 - expected_paleo_mint as u128;

    let rewards: i64 = total_delegated > currently_delegated as i64 ? total_delegated - currently_delegated as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    currently_delegated += rewards as u64 - new_commission;

    let core_protocol_account: u64 = credits.aleo/account.get_or_use(self.address, 0u64);
    let reserved_for_withdrawal: u64 = balances.get(CLAIMABLE_WITHDRAWALS);
    let current_state: u8 = protocol_state.get(PROTOCOL_STATE_KEY);
    let deposit_pool: u64 = current_state != REBALANCING_STATE
     ? core_protocol_account - credits_deposit - reserved_for_withdrawal
     : core_protocol_account - currently_delegated - credits_deposit - reserved_for_withdrawal; // if the protocol is rebalancing, the full balance is in the account
    let new_commission_paleo: u64 = calculate_new_paleo(currently_delegated as u128, deposit_pool as u128, new_commission as u128, total_paleo_pool);
    owed_commission.set(0u8, current_owed_commission + new_commission_paleo);

    total_paleo_pool += new_commission_paleo as u128;
    currently_delegated += new_commission;
    // Update bonded pool balance with latest rewards
    balances.set(DELEGATED_BALANCE, currently_delegated);

    // Calculate mint for deposit
    let paleo_for_deposit: u64 = calculate_new_paleo(currently_delegated as u128, deposit_pool as u128, credits_deposit as u128, total_paleo_pool);
    assert(paleo_for_deposit >= expected_paleo_mint); // Assert that the transition did not mint too much pALEO
  }

  inline get_commission(
    rewards: u128,
    commission_rate: u128,
  ) -> u64 {
    let commission: u128 = rewards * commission_rate / PRECISION_UNSIGNED;
    let commission_64: u64 = commission as u64;
    return commission_64;
  }

  inline calculate_new_paleo(bonded_balance: u128, existing_deposit_pool: u128, deposit: u128, paleo: u128) -> u64 {
    let full_balance: u128 = bonded_balance + existing_deposit_pool;
    let new_total_paleo: u128 = (paleo * (full_balance + deposit)) / full_balance;
    let diff: u128 = new_total_paleo - paleo;
    let paleo_to_mint: u64 = diff as u64;
    return paleo_to_mint;
  }

  // Note: requires the caller to create an allowance for the contract first
  async transition deposit_public(
    public credits_deposit: u64,
    public expected_paleo_mint: u64,
    public referrer: address
  ) -> Future {
    assert(expected_paleo_mint >= 1u64); // Assert that the expected pALEO mint is at least 1 microcredit

    // Transfer ALEO to pool
    let f0: Future = multi_token_support_program_v1.aleo/transfer_from_public(CREDITS_TOKEN_ID, self.caller, self.address, credits_deposit as u128);
    let f1: Future = multi_token_support_program_v1.aleo/withdraw_credits_public(credits_deposit);
    // Mint pALEO to depositor
    let f2: Future = pondo_staked_aleo_token.aleo/mint_public(expected_paleo_mint, self.caller);

    return finalize_deposit_public(f0, f1, f2, credits_deposit, expected_paleo_mint);
  }

  async function finalize_deposit_public(
    public f0: Future,
    public f1: Future,
    public f2: Future,
    public credits_deposit: u64,
    public expected_paleo_mint: u64
  ) {
    f0.await();
    f1.await();
    f2.await();

    let base_bond_state: bond_state = bond_state {
      validator: self.address,
      microcredits: 0u64
    };
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator1.aleo, base_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator2.aleo, base_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator3.aleo, base_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator4.aleo, base_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator5.aleo, base_bond_state).microcredits;

    let base_unbond_state: unbond_state = unbond_state {
      microcredits: 0u64,
      height: 0u32
    };
    let delegator1_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator1.aleo, base_unbond_state).microcredits;
    let delegator2_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator2.aleo, base_unbond_state).microcredits;
    let delegator3_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator3.aleo, base_unbond_state).microcredits;
    let delegator4_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator4.aleo, base_unbond_state).microcredits;
    let delegator5_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator5.aleo, base_unbond_state).microcredits;

    let delegator1_account: u64 = credits.aleo/account.get_or_use(pondo_delegator1.aleo, 0u64);
    let delegator2_account: u64 = credits.aleo/account.get_or_use(pondo_delegator2.aleo, 0u64);
    let delegator3_account: u64 = credits.aleo/account.get_or_use(pondo_delegator3.aleo, 0u64);
    let delegator4_account: u64 = credits.aleo/account.get_or_use(pondo_delegator4.aleo, 0u64);
    let delegator5_account: u64 = credits.aleo/account.get_or_use(pondo_delegator5.aleo, 0u64);

    let total_bonded: u64 = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: u64 = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let total_unbonding: u64 = delegator1_unbonding + delegator2_unbonding + delegator3_unbonding + delegator4_unbonding + delegator5_unbonding;
    let bonded_withdrawals: u64 = balances.get(BONDED_WITHDRAWALS);
    let total_delegated: i64 = total_bonded as i64 + total_account as i64 + total_unbonding as i64 - bonded_withdrawals as i64;

    let currently_delegated: u64 = balances.get(DELEGATED_BALANCE);
    let current_owed_commission: u64 = owed_commission.get(0u8);
    let total_paleo_pool: u128 = multi_token_support_program_v1.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128 - expected_paleo_mint as u128;

    let rewards: i64 = total_delegated > currently_delegated as i64 ? total_delegated - currently_delegated as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    currently_delegated += rewards as u64 - new_commission;

    let core_protocol_account: u64 = credits.aleo/account.get_or_use(self.address, 0u64);
    let reserved_for_withdrawal: u64 = balances.get(CLAIMABLE_WITHDRAWALS);
    let current_state: u8 = protocol_state.get(PROTOCOL_STATE_KEY);
    let deposit_pool: u64 = current_state != REBALANCING_STATE
     ? core_protocol_account - credits_deposit - reserved_for_withdrawal
     : core_protocol_account - currently_delegated - credits_deposit - reserved_for_withdrawal; // if the protocol is rebalancing, the full balance is in the account
    let new_commission_paleo: u64 = calculate_new_paleo(currently_delegated as u128, deposit_pool as u128, new_commission as u128, total_paleo_pool);
    owed_commission.set(0u8, current_owed_commission + new_commission_paleo);

    total_paleo_pool += new_commission_paleo as u128;
    currently_delegated += new_commission;
    // Update bonded pool balance with latest rewards
    balances.set(DELEGATED_BALANCE, currently_delegated);

    // Calculate mint for deposit
    let paleo_for_deposit: u64 = calculate_new_paleo(currently_delegated as u128, deposit_pool as u128, credits_deposit as u128, total_paleo_pool);
    assert(paleo_for_deposit >= expected_paleo_mint); // Assert that the transition did not mint too much pALEO
  }

  async transition distribute_deposits(
    public transfer_amounts: [u64; 5]
  ) -> Future {
    // Transfer to each delegator
    let f0: Future = credits.aleo/transfer_public(pondo_delegator1.aleo, transfer_amounts[0u8]);
    let f1: Future = credits.aleo/transfer_public(pondo_delegator2.aleo, transfer_amounts[1u8]);
    let f2: Future = credits.aleo/transfer_public(pondo_delegator3.aleo, transfer_amounts[2u8]);
    let f3: Future = credits.aleo/transfer_public(pondo_delegator4.aleo, transfer_amounts[3u8]);
    let f4: Future = credits.aleo/transfer_public(pondo_delegator5.aleo, transfer_amounts[4u8]);

    return finalize_distribute_deposits(f0, f1, f2, f3, f4);
  }

  async function finalize_distribute_deposits(
    f0: Future,
    f1: Future,
    f2: Future,
    f3: Future,
    f4: Future
  ) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
    f4.await();

    // Confirm that there are enough credits left for the liquidity pool
    let currently_delegated: u64 = balances.get(DELEGATED_BALANCE);
    let account_balance: u64 = credits.aleo/account.get_or_use(self.address, 0u64);
    let reserved_for_withdrawal: u64 = balances.get(CLAIMABLE_WITHDRAWALS);
    let liquidity_pool: u64 = account_balance - reserved_for_withdrawal;
    let optimal_liquidity: u64 = calculate_optimal_liquidity(currently_delegated as u128);
    assert(liquidity_pool >= optimal_liquidity);

    // Confirm each delegator is already bonded and in the correct state
    let delegator1_state: u8 = pondo_delegator1.aleo/state_mapping.get(0u8);
    let delegator2_state: u8 = pondo_delegator2.aleo/state_mapping.get(0u8);
    let delegator3_state: u8 = pondo_delegator3.aleo/state_mapping.get(0u8);
    let delegator4_state: u8 = pondo_delegator4.aleo/state_mapping.get(0u8);
    let delegator5_state: u8 = pondo_delegator5.aleo/state_mapping.get(0u8);
    assert(delegator1_state == BOND_ALLOWED || delegator1_state == UNBOND_NOT_ALLOWED); // Assert that delegator1 is in the correct state
    assert(delegator2_state == BOND_ALLOWED || delegator2_state == UNBOND_NOT_ALLOWED); // Assert that delegator2 is in the correct state
    assert(delegator3_state == BOND_ALLOWED || delegator3_state == UNBOND_NOT_ALLOWED); // Assert that delegator3 is in the correct state
    assert(delegator4_state == BOND_ALLOWED || delegator4_state == UNBOND_NOT_ALLOWED); // Assert that delegator4 is in the correct state
    assert(delegator5_state == BOND_ALLOWED || delegator5_state == UNBOND_NOT_ALLOWED); // Assert that delegator5 is in the correct state
  }

  inline calculate_optimal_liquidity(total_balance: u128) -> u64 {
    let min_liquidity: u128 = total_balance * MIN_LIQUIDITY_PERCENT / PRECISION_UNSIGNED;
    let optimal_liquidity: u64 = min_liquidity > MAX_GUARANTEED_LIQUIDITY as u128 ? MAX_GUARANTEED_LIQUIDITY : min_liquidity as u64;
    return optimal_liquidity;
  }

  // -------------------
  // WITHDRAW FUNCTIONS
  // -------------------

  async transition instant_withdraw_public(
    public paleo_burn_amount: u64,
    public withdrawal_credits: u64
  ) -> Future {
    // Burn pALEO for withdrawal
    let f0: Future = pondo_staked_aleo_token.aleo/burn_public(paleo_burn_amount, self.caller);
    let f1: Future = credits.aleo/transfer_public(self.caller, withdrawal_credits);

    return finalize_instant_withdraw_public(f0, f1, paleo_burn_amount, withdrawal_credits, self.caller);
  }

  async function finalize_instant_withdraw_public(
    f0: Future,
    f1: Future,
    paleo_burn_amount: u64,
    withdrawal_credits: u64,
    caller: address
  ) {
    f0.await();
    f1.await();

    // Block instant withdrawals during a rebalance
    let current_state: u8 = protocol_state.get(PROTOCOL_STATE_KEY);
    assert(current_state != REBALANCING_STATE); // Assert that the protocol is not in a rebalancing state

    let has_withdrawal: bool = withdrawals.contains(caller);
    assert(!has_withdrawal); // Assert that the caller does not have a pending withdrawal

    // Calculate new delegated balance
    let base_bond_state: bond_state = bond_state {
      validator: self.address,
      microcredits: 0u64
    };
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator1.aleo, base_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator2.aleo, base_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator3.aleo, base_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator4.aleo, base_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator5.aleo, base_bond_state).microcredits;

    let base_unbond_state: unbond_state = unbond_state {
      microcredits: 0u64,
      height: 0u32
    };
    let delegator1_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator1.aleo, base_unbond_state).microcredits;
    let delegator2_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator2.aleo, base_unbond_state).microcredits;
    let delegator3_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator3.aleo, base_unbond_state).microcredits;
    let delegator4_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator4.aleo, base_unbond_state).microcredits;
    let delegator5_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator5.aleo, base_unbond_state).microcredits;

    let delegator1_account: u64 = credits.aleo/account.get_or_use(pondo_delegator1.aleo, 0u64);
    let delegator2_account: u64 = credits.aleo/account.get_or_use(pondo_delegator2.aleo, 0u64);
    let delegator3_account: u64 = credits.aleo/account.get_or_use(pondo_delegator3.aleo, 0u64);
    let delegator4_account: u64 = credits.aleo/account.get_or_use(pondo_delegator4.aleo, 0u64);
    let delegator5_account: u64 = credits.aleo/account.get_or_use(pondo_delegator5.aleo, 0u64);

    let total_bonded: u64 = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: u64 = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let total_unbonding: u64 = delegator1_unbonding + delegator2_unbonding + delegator3_unbonding + delegator4_unbonding + delegator5_unbonding;
    let bonded_withdrawals: u64 = balances.get(BONDED_WITHDRAWALS);
    // Total delegated is all credits that have been sent to delegators, less any that have been withdrawn but are still bonded
    let total_delegated: i64 = total_bonded as i64 + total_account as i64 + total_unbonding as i64 - bonded_withdrawals as i64;

    // Currently delegated is all credits that have been sent to delegators, less withdrawals,
    // and without any rewards that have been earned since the update
    let currently_delegated: u64 = balances.get(DELEGATED_BALANCE);
    let current_owed_commission: u64 = owed_commission.get(0u8);
    let paleo_minted_post_burn: u128 = multi_token_support_program_v1.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128;
    let total_paleo_minted: u128 = paleo_minted_post_burn + paleo_burn_amount as u128;

    let rewards: i64 = total_delegated > currently_delegated as i64 ? total_delegated - currently_delegated as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    currently_delegated += rewards as u64 - new_commission;

    let core_protocol_account: u64 = credits.aleo/account.get_or_use(self.address, 0u64);
    let reserved_for_withdrawal: u64 = balances.get(CLAIMABLE_WITHDRAWALS);
    let deposit_pool: u64 = core_protocol_account - reserved_for_withdrawal + withdrawal_credits;
    // Update owed commission balance
    let new_commission_paleo: u64 = calculate_new_paleo(currently_delegated as u128, deposit_pool as u128, new_commission as u128, total_paleo_minted);
    current_owed_commission += new_commission_paleo;
    total_paleo_minted += new_commission_paleo as u128;
    currently_delegated += new_commission;

    // Calculate full pool size
    let full_pool: u128 = currently_delegated as u128 + deposit_pool as u128;

    // Calculate credits value of burned pALEO
    let withdrawal_fee: u64 = calculate_withdraw_fee(paleo_burn_amount);
    let net_burn_amount: u64 = paleo_burn_amount - withdrawal_fee;
    let withdrawal_calculation: u128 = (net_burn_amount as u128 * full_pool as u128) / total_paleo_minted as u128;
    assert(withdrawal_credits <= withdrawal_calculation as u64); // Assert that the withdrawal amount was at most the calculated amount

    // Update owed commission to reflect withdrawal fee
    owed_commission.set(0u8, current_owed_commission + withdrawal_fee);
  }

  inline calculate_withdraw_fee(
    paleo_burn_amount: u64
  ) -> u64 {
    let fee_calc: u128 = paleo_burn_amount as u128 * INSTANT_WITHDRAW_FEE / PRECISION_UNSIGNED;
    let fee: u64 = fee_calc as u64;
    return fee;
  }

  async transition withdraw_public(
    // total amount of pALEO to burn, including fee
    public paleo_burn_amount: u64
  ) -> Future {
    // Burn pALEO for withdrawal
    let f0: Future = pondo_staked_aleo_token.aleo/burn_public(paleo_burn_amount, self.caller);
    return finalize_withdraw_public(f0, paleo_burn_amount, self.caller);
  }

  async function finalize_withdraw_public(
    public f0: Future,
    public paleo_burn_amount: u64,
    public caller: address
  ) {
    f0.await();

    // Assert that the caller does not have a pending withdrawal
    let has_withdrawal: bool = withdrawals.contains(caller);
    assert(!has_withdrawal); // only one withdrawal at a time

    // Calculate commission owed
    let base_bond_state: bond_state = bond_state {
      validator: self.address,
      microcredits: 0u64
    };
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator1.aleo, base_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator2.aleo, base_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator3.aleo, base_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator4.aleo, base_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator5.aleo, base_bond_state).microcredits;

    let base_unbond_state: unbond_state = unbond_state {
      microcredits: 0u64,
      height: 0u32
    };
    let delegator1_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator1.aleo, base_unbond_state).microcredits;
    let delegator2_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator2.aleo, base_unbond_state).microcredits;
    let delegator3_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator3.aleo, base_unbond_state).microcredits;
    let delegator4_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator4.aleo, base_unbond_state).microcredits;
    let delegator5_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator5.aleo, base_unbond_state).microcredits;

    let delegator1_account: u64 = credits.aleo/account.get_or_use(pondo_delegator1.aleo, 0u64);
    let delegator2_account: u64 = credits.aleo/account.get_or_use(pondo_delegator2.aleo, 0u64);
    let delegator3_account: u64 = credits.aleo/account.get_or_use(pondo_delegator3.aleo, 0u64);
    let delegator4_account: u64 = credits.aleo/account.get_or_use(pondo_delegator4.aleo, 0u64);
    let delegator5_account: u64 = credits.aleo/account.get_or_use(pondo_delegator5.aleo, 0u64);

    let total_bonded: u64 = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: u64 = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let total_unbonding: u64 = delegator1_unbonding + delegator2_unbonding + delegator3_unbonding + delegator4_unbonding + delegator5_unbonding;
    let bonded_withdrawals: u64 = balances.get(BONDED_WITHDRAWALS);
    // Total delegated is all credits that have been sent to delegators, less any that have been withdrawn but are still bonded
    let total_delegated: i64 = total_bonded as i64 + total_account as i64 + total_unbonding as i64 - bonded_withdrawals as i64;

    // Currently delegated is all credits that have been sent to delegators, less withdrawals,
    // and without any rewards that have been earned since the update
    let currently_delegated: u64 = balances.get(DELEGATED_BALANCE);
    let current_owed_commission: u64 = owed_commission.get(0u8);
    let paleo_minted_post_burn: u128 = multi_token_support_program_v1.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128;
    let total_paleo_minted: u128 = paleo_minted_post_burn + paleo_burn_amount as u128;

    let rewards: i64 = total_delegated > currently_delegated as i64 ? total_delegated - currently_delegated as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    currently_delegated += rewards as u64 - new_commission;

    let core_protocol_account: u64 = credits.aleo/account.get_or_use(self.address, 0u64);
    let reserved_for_withdrawal: u64 = balances.get(CLAIMABLE_WITHDRAWALS);
    let current_state: u8 = protocol_state.get(PROTOCOL_STATE_KEY);
    let deposit_pool: u64 = current_state != REBALANCING_STATE
     ? core_protocol_account - reserved_for_withdrawal
     : core_protocol_account - currently_delegated - reserved_for_withdrawal; // if the protocol is rebalancing, the full balance is in the account
    // Update owed commission balance
    let new_commission_paleo: u64 = calculate_new_paleo(currently_delegated as u128, deposit_pool as u128, new_commission as u128, total_paleo_minted);
    owed_commission.set(0u8, current_owed_commission + new_commission_paleo);
    total_paleo_minted += new_commission_paleo as u128;
    currently_delegated += new_commission;

    // Calculate full pool size
    let full_pool: u128 = currently_delegated as u128 + deposit_pool as u128;

    // Calculate credits value of burned pALEO
    let withdrawal_calculation: u128 = (paleo_burn_amount as u128 * full_pool as u128) / total_paleo_minted as u128;
    let withdrawal: u64 = withdrawal_calculation as u64;

    // Update bonded withdrawals
    balances.set(BONDED_WITHDRAWALS, bonded_withdrawals + withdrawal);

    // Update total balance to reflect withdrawal
    balances.set(DELEGATED_BALANCE, currently_delegated - withdrawal);

    // Create withdrawal for caller in next batch
    let batch_height: (u32, u32) = get_withdrawal_batch(block.height);
    let withdrawal_state_value: withdrawal_state = withdrawal_state {
      microcredits: withdrawal,
      claim_block: batch_height.1
    };
    withdrawals.set(caller, withdrawal_state_value);
    // Update total for batch
    let batch_total: u64 = withdrawal_batches.get_or_use(batch_height.0, 0u64);
    withdrawal_batches.set(batch_height.0, batch_total + withdrawal);
  }

  inline get_withdrawal_batch(height: u32) -> (u32, u32) {
    let min_block_height: u32 = height + WITHDRAW_WAIT_MINIMUM;
    let withdrawal_batch: u32 = min_block_height / BLOCKS_PER_EPOCH;
    // Withdrawals are processed at the start of the next epoch
    let claim_block: u32 = (withdrawal_batch + 1u32) * BLOCKS_PER_EPOCH + REBALANCE_PERIOD + 1u32;

    return (withdrawal_batch, claim_block);
  }

  async transition claim_withdrawal_public(
    public owner: address,
    public amount: u64
  ) -> Future {
    // Transfer to the owner
    let f0: Future = credits.aleo/transfer_public(owner, amount);

    return finalize_claim_withdrawal_public(f0, owner, amount);
  }

  async function finalize_claim_withdrawal_public(
    f0: Future,
    owner: address,
    amount: u64
  ) {
    f0.await();

    // Update withdrawal state
    let withdrawal: withdrawal_state = withdrawals.get(owner);
    assert(withdrawal.claim_block < block.height); // make sure the withdrawal is claimable

    // Update withrawal mapping
    if (withdrawal.microcredits == amount) {
      withdrawals.remove(owner);
    } else {
      let new_withdrawal: withdrawal_state = withdrawal_state {
        microcredits: withdrawal.microcredits - amount,
        claim_block: withdrawal.claim_block
      };
      withdrawals.set(owner, new_withdrawal);
    }

    // Update balance reserved for withdrawal
    let reserved_for_withdrawal: u64 = balances.get(CLAIMABLE_WITHDRAWALS);
    balances.set(CLAIMABLE_WITHDRAWALS, reserved_for_withdrawal - amount);
  }

  // -------------------
  // REBALANCING FUNCTIONS
  // -------------------

  async transition prep_rebalance() -> Future {
    let f0: Future = pondo_delegator1.aleo/prep_rebalance();
    let f1: Future = pondo_delegator2.aleo/prep_rebalance();
    let f2: Future = pondo_delegator3.aleo/prep_rebalance();
    let f3: Future = pondo_delegator4.aleo/prep_rebalance();
    let f4: Future = pondo_delegator5.aleo/prep_rebalance();

    return finalize_prep_rebalance(f0, f1, f2, f3, f4);
  }

  async function finalize_prep_rebalance(
    public f0: Future,
    public f1: Future,
    public f2: Future,
    public f3: Future,
    public f4: Future
  ) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
    f4.await();

    // Confirm that rebalancing is allowed
    // Rebalance is allowed during the first day of a new epoch
    let current_epoch: u32 = block.height / BLOCKS_PER_EPOCH;
    let last_rebalance: u32 = last_rebalance_epoch.get(0u8);
    // Update last rebalance epoch
    assert(current_epoch > last_rebalance); // make sure we are not rebalancing twice in the same epoch
    last_rebalance_epoch.set(0u8, current_epoch);

    // Assert that the protocol is in a normal state
    let current_state: u8 = protocol_state.get(PROTOCOL_STATE_KEY);
    assert(current_state == NORMAL_STATE); // Assert that the protocol is in a normal state
    protocol_state.set(PROTOCOL_STATE_KEY, PREP_REBALANCE_STATE); // Set the protocol state to prep_rebalance

    let blocks_into_epoch: u32 = block.height % BLOCKS_PER_EPOCH;
    assert(blocks_into_epoch < REBALANCE_PERIOD || last_rebalance == 4294967295u32); // rebalance is allowed during the first day of a new epoch

    let top_validators: [address; 10] = pondo_oracle.aleo/top_validators.get_or_use(
      0u8,
      [
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS,
        ONE_GROUP_ADDRESS
      ]
    );
    let default_datum: validator_datum = validator_datum {
      delegator: ONE_GROUP_ADDRESS,
      validator: ONE_GROUP_ADDRESS,
      block_height: 0u32,
      bonded_microcredits: 0u64,
      microcredits_yield_per_epoch: 0u128,
      commission: 40u8, // Add a safety margin to the commission rate because this will represent a real validator after automatic code updates
      boost: 0u128
    };
    let validator1: validator_datum = pondo_oracle.aleo/validator_data.get_or_use(top_validators[0u8], default_datum);
    let validator2: validator_datum = pondo_oracle.aleo/validator_data.get_or_use(top_validators[1u8], default_datum);
    let validator3: validator_datum = pondo_oracle.aleo/validator_data.get_or_use(top_validators[2u8], default_datum);
    let validator4: validator_datum = pondo_oracle.aleo/validator_data.get_or_use(top_validators[3u8], default_datum);
    let validator5: validator_datum = pondo_oracle.aleo/validator_data.get_or_use(top_validators[4u8], default_datum);

    let next_validator_set: [validator_state; 5] = [
      validator_state { validator: validator1.validator, commission: validator1.commission },
      validator_state { validator: validator2.validator, commission: validator2.commission },
      validator_state { validator: validator3.validator, commission: validator3.commission },
      validator_state { validator: validator4.validator, commission: validator4.commission },
      validator_state { validator: validator5.validator, commission: validator5.commission }
    ];
    validator_set.set(NEXT_VALIDATOR_SET, next_validator_set);
  }

  async transition rebalance_retrieve_credits(
    public transfer_amounts: [u64; 5],
    public commission_mint: u64
  ) -> Future {
    let f0: Future = pondo_delegator1.aleo/transfer_to_core_protocol(transfer_amounts[0u8]);
    let f1: Future = pondo_delegator2.aleo/transfer_to_core_protocol(transfer_amounts[1u8]);
    let f2: Future = pondo_delegator3.aleo/transfer_to_core_protocol(transfer_amounts[2u8]);
    let f3: Future = pondo_delegator4.aleo/transfer_to_core_protocol(transfer_amounts[3u8]);
    let f4: Future = pondo_delegator5.aleo/transfer_to_core_protocol(transfer_amounts[4u8]);
    let f5: Future = pondo_staked_aleo_token.aleo/mint_public(commission_mint, pondo_token.aleo);

    return finalize_rebalance_retrieve_credits(f0, f1, f2, f3, f4, f5, transfer_amounts, commission_mint);
  }

  async function finalize_rebalance_retrieve_credits(
    f0: Future,
    f1: Future,
    f2: Future,
    f3: Future,
    f4: Future,
    f5: Future,
    transfer_amounts: [u64; 5],
    commission_mint: u64
  ) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
    f4.await();
    f5.await();

    let full_balance: u64 = transfer_amounts[0u8] + transfer_amounts[1u8] + transfer_amounts[2u8] + transfer_amounts[3u8] + transfer_amounts[4u8];
    let current_balance: u64 = balances.get(DELEGATED_BALANCE);

    let current_owed_commission: u64 = owed_commission.get(0u8);
    // Total pALEO minted, including owed commission, minus the commission minted in the transition
    let total_paleo_minted: u128 = multi_token_support_program_v1.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128 - commission_mint as u128;

    let rewards: i64 = full_balance > current_balance ? full_balance as i64 - current_balance as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    current_balance += rewards as u64 - new_commission;

    // Update balances and owed commission
    // At this point, all credits have been transferred to the core protocol, but there may still be commission owed
    let core_protocol_account: u64 = credits.aleo/account.get_or_use(self.address, 0u64);
    let reserved_for_withdrawal: u64 = balances.get(CLAIMABLE_WITHDRAWALS);
    let deposit_pool: u64 = core_protocol_account - full_balance - reserved_for_withdrawal;

    let new_commission_paleo: u64 = calculate_new_paleo(current_balance as u128, deposit_pool as u128, new_commission as u128, total_paleo_minted);
    // New owed commission is whatever commission is left after the new commission mint, plus what we may have earned between calling the function and now
    owed_commission.set(0u8, current_owed_commission + new_commission_paleo - commission_mint);
    // Update total balance
    balances.set(DELEGATED_BALANCE, current_balance + new_commission);

    // Move bonded withdrawals to available to claim
    let current_epoch: u32 = block.height / BLOCKS_PER_EPOCH;
    //  Process withdrawals from the previous epoch
    let current_withdrawal_batch: u64 = withdrawal_batches.get_or_use(current_epoch - 1u32, 0u64);
    balances.set(CLAIMABLE_WITHDRAWALS, reserved_for_withdrawal + current_withdrawal_batch);

    // Update bonded withdrawals
    let bonded_withdrawals: u64 = balances.get(BONDED_WITHDRAWALS);
    balances.set(BONDED_WITHDRAWALS, bonded_withdrawals - current_withdrawal_batch);

    // Update protocol state
    let current_state: u8 = protocol_state.get(PROTOCOL_STATE_KEY);
    assert(current_state == PREP_REBALANCE_STATE); // Assert that the protocol is in a normal state
    protocol_state.set(PROTOCOL_STATE_KEY, REBALANCING_STATE);
  }

  async transition rebalance_redistribute(
    public validators: [validator_state; 5],
    public transfer_amounts: [u64; 5]
  ) -> Future {
    // Transfer to each delegator and set validator
    let f0: Future = credits.aleo/transfer_public(pondo_delegator1.aleo, transfer_amounts[0u8]);
    let f1: Future = credits.aleo/transfer_public(pondo_delegator2.aleo, transfer_amounts[1u8]);
    let f2: Future = credits.aleo/transfer_public(pondo_delegator3.aleo, transfer_amounts[2u8]);
    let f3: Future = credits.aleo/transfer_public(pondo_delegator4.aleo, transfer_amounts[3u8]);
    let f4: Future = credits.aleo/transfer_public(pondo_delegator5.aleo, transfer_amounts[4u8]);

    let f5: Future = pondo_delegator1.aleo/set_validator(validators[0u8].validator, validators[0u8].commission);
    let f6: Future = pondo_delegator2.aleo/set_validator(validators[1u8].validator, validators[1u8].commission);
    let f7: Future = pondo_delegator3.aleo/set_validator(validators[2u8].validator, validators[2u8].commission);
    let f8: Future = pondo_delegator4.aleo/set_validator(validators[3u8].validator, validators[3u8].commission);
    let f9: Future = pondo_delegator5.aleo/set_validator(validators[4u8].validator, validators[4u8].commission);

    return finalize_rebalance_redistribute(f0, f1, f2, f3, f4, f5, f6, f7, f8, f9, validators, transfer_amounts);
  }

  async function finalize_rebalance_redistribute(
    public f0: Future,
    public f1: Future,
    public f2: Future,
    public f3: Future,
    public f4: Future,
    public f5: Future,
    public f6: Future,
    public f7: Future,
    public f8: Future,
    public f9: Future,
    public validators: [validator_state; 5],
    public transfer_amounts: [u64; 5]
  ) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
    f4.await();
    f5.await();
    f6.await();
    f7.await();
    f8.await();
    f9.await();

    // Check that the new validator set is correct
    let next_validator_set: [validator_state; 5] = validator_set.get(NEXT_VALIDATOR_SET);
    validator_set.set(CURRENT_VALIDATOR_SET, next_validator_set);
    validator_set.remove(NEXT_VALIDATOR_SET);
    for i: u8 in 0u8..5u8 {
      assert(validators[i].validator == next_validator_set[i].validator && validators[i].commission == next_validator_set[i].commission); // ensure that the new validator set is correct
    }
    // Check that each validator has the correct portion of credits
    let delegator_allocation: [u128; 10] = pondo_oracle.aleo/delegator_allocation.get_or_use(
      0u8,
      [
        PORTION_1,
        PORTION_2,
        PORTION_3,
        PORTION_4,
        PORTION_5,
        PORTION_5,
        PORTION_5,
        PORTION_5,
        PORTION_5,
        PORTION_5
      ]);
    let total_credits: u64 = transfer_amounts[0u8] + transfer_amounts[1u8] + transfer_amounts[2u8] + transfer_amounts[3u8] + transfer_amounts[4u8];
    let total_credits_128: u128 = total_credits as u128;
    let validator1_portion: u128 = (transfer_amounts[0u8] as u128 * PRECISION_UNSIGNED) / total_credits_128;
    let validator2_portion: u128 = (transfer_amounts[1u8] as u128 * PRECISION_UNSIGNED) / total_credits_128;
    let validator3_portion: u128 = (transfer_amounts[2u8] as u128 * PRECISION_UNSIGNED) / total_credits_128;
    let validator4_portion: u128 = (transfer_amounts[3u8] as u128 * PRECISION_UNSIGNED) / total_credits_128;
    let validator5_portion: u128 = (transfer_amounts[4u8] as u128 * PRECISION_UNSIGNED) / total_credits_128;
    assert(delegator_allocation[0u8] - validator1_portion <= 2u128); // ensure that the validator portion is close to the expected portion
    assert(delegator_allocation[1u8] - validator2_portion <= 2u128); // ensure that the validator portion is close to the expected portion
    assert(delegator_allocation[2u8] - validator3_portion <= 2u128); // ensure that the validator portion is close to the expected portion
    assert(delegator_allocation[3u8] - validator4_portion <= 2u128); // ensure that the validator portion is close to the expected portion
    assert(delegator_allocation[4u8] - validator5_portion <= 2u128); // ensure that the validator portion is close to the expected portion

    // Check that there's still enough account balance left for pending withdrawals
    let account_balance: u64 = credits.aleo/account.get_or_use(self.address, 0u64);
    let reserved_for_withdrawal: u64 = balances.get(CLAIMABLE_WITHDRAWALS);
    let liquidity_pool: u64 = account_balance - reserved_for_withdrawal;
    let optimal_liquidity: u64 = calculate_optimal_liquidity(total_credits_128);
    assert(liquidity_pool >= optimal_liquidity); // ensure that liquidity pool is at least optimal liquidity
    assert(liquidity_pool <= optimal_liquidity + 250u64); // ensure that liquidity pool is close to optimal liquidity

    // Update delegated balance
    balances.set(DELEGATED_BALANCE, total_credits);

    // Update protocol state
    let current_state: u8 = protocol_state.get(PROTOCOL_STATE_KEY);
    assert(current_state == REBALANCING_STATE);
    protocol_state.set(PROTOCOL_STATE_KEY, NORMAL_STATE);
  }

  // A crank to set the oracle tvl
  async transition set_oracle_tvl(
    public tvl: u64
  ) -> Future {
    let f0: Future = pondo_oracle.aleo/set_pondo_tvl(tvl);
    return finalize_set_oracle_tvl(f0, tvl);
  }

  async function finalize_set_oracle_tvl(
    public f0: Future,
    public tvl: u64
  ) {
    f0.await();

    // Ensure the tvl matches what exists in the core protocol
    // Get all of the delegator balances
    let delegator1_balance: u64 = credits.aleo/account.get_or_use(pondo_delegator1.aleo, 0u64);
    let delegator2_balance: u64 = credits.aleo/account.get_or_use(pondo_delegator2.aleo, 0u64);
    let delegator3_balance: u64 = credits.aleo/account.get_or_use(pondo_delegator3.aleo, 0u64);
    let delegator4_balance: u64 = credits.aleo/account.get_or_use(pondo_delegator4.aleo, 0u64);
    let delegator5_balance: u64 = credits.aleo/account.get_or_use(pondo_delegator5.aleo, 0u64);
    // Get all of the bonded balances
    let default_bond_state: bond_state = bond_state {
      validator: self.address,
      microcredits: 0u64
    };
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator1.aleo, default_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator2.aleo, default_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator3.aleo, default_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator4.aleo, default_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(pondo_delegator5.aleo, default_bond_state).microcredits;
    // Get all of the unbonding balances
    let default_unbond_state: unbond_state = unbond_state {
      microcredits: 0u64,
      height: 0u32
    };
    let delegator1_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator1.aleo, default_unbond_state).microcredits;
    let delegator2_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator2.aleo, default_unbond_state).microcredits;
    let delegator3_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator3.aleo, default_unbond_state).microcredits;
    let delegator4_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator4.aleo, default_unbond_state).microcredits;
    let delegator5_unbonding: u64 = credits.aleo/unbonding.get_or_use(pondo_delegator5.aleo, default_unbond_state).microcredits;
    // Get the core protocol balance
    let core_protocol_balance: u64 = credits.aleo/account.get_or_use(self.address, 0u64);

    // Calculate the total tvl
    let total_tvl: u64 = delegator1_balance + delegator2_balance + delegator3_balance + delegator4_balance + delegator5_balance
      + delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded + core_protocol_balance
      + delegator1_unbonding + delegator2_unbonding + delegator3_unbonding + delegator4_unbonding + delegator5_unbonding;

    assert(total_tvl >= tvl * 98u64 / 100u64 && total_tvl <= tvl * 102u64 / 100u64); // Assert that the total tvl matches the tvl provided within a margin of error of 2%
  }
}
