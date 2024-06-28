import credits.aleo;

program pondo_core_protocol.aleo {
  const PRECISION: i128 = 1000i128;
  const PRECISION_UNSIGNED: u128 = 1000u128;
  const PORTION_1: u128 = 400u128;
  const PORTION_2: u128 = 250u128;
  const PORTION_3: u128 = 160u128;
  const PORTION_4: u128 = 110u128;
  const PORTION_5: u128 = 80u128;
  const MINIMUM_BOND_POOL: u64 = 125_000_000u64; // microcredits

    // The number of blocks in an epoch
  const BLOCKS_PER_EPOCH: u32 = 120_960u32; // 1 week of blocks, assuming 5 sec per block
  const REBALANCE_PERIOD: u32 = 17_280u32; // 1 day of blocks, assuming 5 sec per block
  const PROTOCOL_FEE: u128 = 100u128; // out of 1000, 10% fee

  const WITHDRAW_WAIT_MINIMUM: u32 = 15_000u32; // aproximately 2.5 days' of blocks
  const WITHDRAW_FEE: u128 = 30u128; // out of 1000, 3% fee

  const MINIMUM_BOOST: u64 = 5_000_000u64;

  const DELEGATOR_1: address = aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4;
  const DELEGATOR_2: address = aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc;
  const DELEGATOR_3: address = aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt;
  const DELEGATOR_4: address = aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k;
  const DELEGATOR_5: address = aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n;

  const PALEO_TOKEN_ID: field = 1751493913335802797273486270793650302076377624243810059080883537084141842600field;
  const CREDITS_TOKEN_ID: field = 3443843282313283355522573239085696902919850365217539366784739393210722344986field;

  const BONDED_POOL_BALANCE: u8 = 0u8;
  const PENDING_DEPOSIT_BALANCE: u8 = 1u8;
  const PENDING_WITHDRAW_BALANCE: u8 = 2u8;
  const OWED_COMMISSION: u8 = 3u8;

  // DELEGATOR STATES
  const BOND_ALLOWED: u8 = 0u8;
  const UNBOND_NOT_ALLOWED: u8 = 1u8;
  const UNBOND_ALLOWED: u8 = 2u8;
  const UNBONDING: u8 = 3u8;
  const TERMINAL: u8 = 4u8;


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

  // 0u8 -> the last tracked balance of aleo bonded via the protocol
  // 1u8 -> total amount of aleo held in the program that is waiting to be bonded
  // 2u8 -> total amount of aleo held in the program that is reserved for withdrawals
  // 3u8 -> total amount of pALEO owed to the protocol, yet to be minted
  mapping balances: u8 => u64;

  mapping boost_pool: address => u64;

  // 0u8 -> current epoch number, zero-indexed (block.height / BLOCKS_PER_EPOCH)
  // Updated after rebalancing at the start of each epoch
  mapping current_epoch: u8 => u32;

  // 0u8 -> the amount of microcredits that have been withdrawn in the current epoch
  //
  mapping withdrawn_this_epoch: u8 => u64;

  struct withdrawal_state {
    microcredits: u64,
    claim_block: u32
  }

  // address -> pending withdrawal for this address
  mapping withdrawals: address => withdrawal_state;
  // u32 -> batch number (batch height / BLOCKS_PER_EPOCH) -> total amount of aleo reserved for withdrawals in this batch
  mapping withdrawal_batches: u32 => u64;

  async transition initialize() -> Future {
    let f0: Future = pondo_staked_aleo_token.aleo/register();
    let f1: Future = pondo_token.aleo/initialize_token();
  }

  async function finalize_initialize(
    public f0: Future,
    public f1: Future
  ) {
    f0.await();
    f1.await();

    balances.set(BONDED_POOL_BALANCE, 0u64);
    balances.set(PENDING_DEPOSIT_BALANCE, 0u64);
    balances.set(PENDING_WITHDRAW_BALANCE, 0u64);
    balances.set(OWED_COMMISSION, 0u64);
    current_epoch.set(0u8, 0u32);
  }

  // -------------------
  // DEPOSIT FUNCTIONS
  // -------------------

  async transition deposit_public_as_signer(
    public credits_deposit: u64,
    public expected_paleo_mint: u64,
    public referrer: address
  ) -> Future {
    // Transfer ALEO to pool
    f0: Future = credits.aleo/transfer_public_as_signer(pondo_core_protocol.aleo, credits_deposit);
    // Mint pALEO to depositor
    f1: Future = pondo_staked_aleo_token.aleo/mint_public(expected_paleo_mint, self.signer);

    return finalize_deposit_public_as_signer(f0, f1, credits_deposit, expected_paleo_mint, referrer);
  }

  async function finalize_deposit_public_as_signer(
    public f0: Future,
    public f1: Future,
    public credits_deposit: u64,
    public expected_paleo_mint: u64,
    public referrer: address
  ) {
    f0.await();
    f1.await();

    let base_bond_state: bond_state = bond_state {
      validator: pondo_core_protocol.aleo,
      microcredits: 0u64
    };
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_1, base_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_2, base_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_3, base_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_4, base_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_5, base_bond_state).microcredits;

    let delegator1_account: u64 = credits.aleo/account.get_or_use(DELEGATOR_1, 0u64);
    let delegator2_account: u64 = credits.aleo/account.get_or_use(DELEGATOR_2, 0u64);
    let delegator3_account: u64 = credits.aleo/account.get_or_use(DELEGATOR_3, 0u64);
    let delegator4_account: u64 = credits.aleo/account.get_or_use(DELEGATOR_4, 0u64);
    let delegator5_account: u64 = credits.aleo/account.get_or_use(DELEGATOR_5, 0u64);

    let total_bonded: u64 = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: u64 = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let full_balance: u64 = total_bonded + total_account;

    let current_balance: u64 = balances.get_or_use(BONDED_POOL_BALANCE, 0u64);
    let current_owed_commission: u64 = balances.get_or_use(OWED_COMMISSION, 0u64);
    let total_paleo_minted: u128 = multi_token_support_program/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128;

    let rewards: i64 = full_balance > current_balance ? full_balance as i64 - current_balance as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    current_balance += rewards as u64 - new_commission;

    let pending_deposit_pool: u64 = balances.get_or_use(PENDING_DEPOSIT_BALANCE, 0u64);
    let new_commission_paleo: u64 = calculate_new_shares(current_balance as u128, pending_deposit_pool as u128, new_commission as u128, total_paleo_minted);
    balances.set(OWED_COMMISSION, current_owed_commission + new_commission_paleo);

    total_paleo_minted += new_commission_paleo as u128;
    current_balance += new_commission;
    // Update bonded pool balance with latest rewards
    balances.set(BONDED_POOL_BALANCE, current_balance);

    // Calculate mint for deposit
    let paleo_for_deposit: u64 = calculate_new_shares(current_balance as u128, pending_deposit_pool as u128, credits_deposit as u128, total_paleo_minted);
    assert(paleo_for_deposit >= 1u64);
    assert(paleo_for_deposit >= expected_paleo_mint);

    // Handle referrer
  }

  inline get_commission(
    rewards: u128,
    commission_rate: u128,
  ) -> u64 {
    let commission: u128 = rewards * commission_rate / PRECISION_UNSIGNED;
    let commission_64: u64 = commission as u64;
    return commission_64;
  }

  inline calculate_new_shares(bonded_balance: u128, pending_deposit_pool: u128, deposit: u128, shares: u128) -> u64 {
    let full_balance: u128 = bonded_balance + pending_deposit_pool;
    let new_total_shares: u128 = (shares * (full_balance + deposit)) / full_balance;
    let diff: u128 = new_total_shares - shares;
    let shares_to_mint: u64 = diff as u64;
    return shares_to_mint;
  }

  // Note: requires the caller to create an allowance for the contract first
  async transition deposit_public(
    public credits_deposit: u64,
    public referrer: address
  ) -> Future {
    // Transfer ALEO to pool
    f0: Future = multi_token_support_program.aleo/transfer_from_public(CREDITS_TOKEN_ID, self.caller, pondo_core_protocol.aleo, credits_deposit as u128);
    // Mint pALEO to depositor
    f1: Future = pondo_staked_aleo_token.aleo/mint_public(expected_paleo_mint, self.caller);

    return then finalize(f0, f1, credits_deposit, expected_paleo_mint, referrer);
  }

  async function finalize_deposit_public(
    public f0: Future,
    public f1: Future,
    public credits_deposit: u64,
    public expected_paleo_mint: u64,
    public referrer: address
  ) {
    f0.await();
    f1.await();
    let base_bond_state: bond_state = bond_state {
      validator: pondo_core_protocol.aleo,
      microcredits: 0u64
    };
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_1, base_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_2, base_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_3, base_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_4, base_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_5, base_bond_state).microcredits;

    let total_bonded: u64 = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let current_balance: u64 = balances.get_or_use(BONDED_POOL_BALANCE, 0u64);
    let current_owed_commission: u64 = balances.get_or_use(OWED_COMMISSION, 0u64);
    let total_paleo_minted: u128 = multi_token_support_program/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128;

    let rewards: i64 = total_bonded > current_balance ? total_bonded as i64 - current_balance as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    current_balance += rewards as u64 - new_commission;

    let pending_deposit_pool: u64 = balances.get_or_use(PENDING_DEPOSIT_BALANCE, 0u64);
    let new_commission_paleo: u64 = calculate_new_shares(current_balance as u128, pending_deposit_pool as u128, new_commission as u128, total_paleo_minted);
    balances.set(OWED_COMMISSION, current_owed_commission + new_commission_paleo);

    total_paleo_minted += new_commission_paleo as u128;
    current_balance += new_commission;
    // Update bonded pool balance with latest rewards
    balances.set(BONDED_POOL_BALANCE, current_balance);

    // Calculate mint for deposit
    let paleo_for_deposit: u64 = calculate_new_shares(current_balance as u128, pending_deposit_pool as u128, credits_deposit as u128, total_paleo_minted);
    assert(paleo_for_deposit >= 1u64);
    assert(paleo_for_deposit >= expected_paleo_mint);

    // Handle referrer
  }

  async transition distribute_deposits(
    validators: [address; 5],
    transfer_amounts: [u64; 5] // should be safe to transfer 0?
  ) -> Future {
    // Transfer to each delegator
    let f0: Future = credits.aleo/transfer_public(DELEGATOR_1, transfer_amounts[0u8]);
    let f1: Future = credits.aleo/transfer_public(DELEGATOR_2, transfer_amounts[1u8]);
    let f2: Future = credits.aleo/transfer_public(DELEGATOR_3, transfer_amounts[2u8]);
    let f3: Future = credits.aleo/transfer_public(DELEGATOR_4, transfer_amounts[3u8]);
    let f4: Future = credits.aleo/transfer_public(DELEGATOR_5, transfer_amounts[4u8]);

    return finalize_distribute_deposits(f0, validators, transfer_amounts);
  }

  async function finalize_distribute_deposits(
    f0: Future,
    f1: Future,
    f2: Future,
    f3: Future,
    f4: Future,
    transfer_amounts: [u64; 5]
  ) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
    f4.await();

    // Subtract transfer amounts from pool
    let total_transfer: u64 = transfer_amounts[0u8] + transfer_amounts[1u8] + transfer_amounts[2u8] + transfer_amounts[3u8] + transfer_amounts[4u8];
    let deposit_pool_balance: u64 = balances.get_or_use(PENDING_DEPOSIT_BALANCE, 0u64);
    deposit_pool_balance -= total_transfer; // TODO: handle underflow
    balances.set(PENDING_DEPOSIT_BALANCE, deposit_pool_balance);

    // Confirm each delegator is already bonded and in the correct state
    let delegator1_state: u8 = delegator1.aleo/state_mapping.get(0u8);
    let delegator2_state: u8 = delegator2.aleo/state_mapping.get(0u8);
    let delegator3_state: u8 = delegator3.aleo/state_mapping.get(0u8);
    let delegator4_state: u8 = delegator4.aleo/state_mapping.get(0u8);
    let delegator5_state: u8 = delegator5.aleo/state_mapping.get(0u8);
    assert(delegator1_state == UNBOND_NOT_ALLOWED && delegator2_state == UNBOND_NOT_ALLOWED && delegator3_state == UNBOND_NOT_ALLOWED && delegator4_state == UNBOND_NOT_ALLOWED && delegator5_state == UNBOND_NOT_ALLOWED);
  }

  // -------------------
  // WITHDRAW FUNCTIONS
  // -------------------

  async transition withdraw_public(
    // total amount of pALEO to burn, including fee
    public paleo_burn_amount: u64
  ) -> Future {
    // Burn pALEO for withdrawal
    let f0: Future = pondo_staked_aleo.aleo/burn_public(paleo_burn_amount, self.caller);
    // Mint withdrawal fee to pALEO pool for pondo token
    let fee_calc: u128 = paleo_burn_amount as u128 * WITHDRAW_FEE / PRECISION_UNSIGNED;
    let fee: u64 = fee_calc as u64;
    let f1: Future = pondo_staked_aleo.aleo/mint_public(fee, pondo_token.aleo);

    let net_burn_amount: u64 = paleo_burn_amount - fee;
    return finalize_withdraw_public(f0, f1, net_burn_amount, self.caller);
  }

  async function finalize_withdraw_public(
    public f0: Future,
    public f1: Future,
    public net_burn_amount: u64,
    public caller: address
  ) {
    f0.await();
    f1.await();

    // Assert that the caller does not have a pending withdrawal
    let has_withdrawal: bool = withdrawals.contains(caller);
    assert(!has_withdrawal);

    // Calculate commission owed
    let base_bond_state: bond_state = bond_state {
      validator: pondo_core_protocol.aleo,
      microcredits: 0u64
    };
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_1, base_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_2, base_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_3, base_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_4, base_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_5, base_bond_state).microcredits;

    let total_bonded: u64 = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let current_balance: u64 = balances.get_or_use(BONDED_POOL_BALANCE, 0u64);
    let current_owed_commission: u64 = balances.get_or_use(OWED_COMMISSION, 0u64);
    let paleo_minted_post_burn: u128 = multi_token_support_program/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128;
    let total_paleo_minted: u128 = paleo_minted_post_burn + net_burn_amount as u128;

    let rewards: i64 = total_bonded > current_balance ? total_bonded as i64 - current_balance as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    current_balance += rewards as u64 - new_commission;

    let pending_deposit_pool: u64 = balances.get_or_use(PENDING_DEPOSIT_BALANCE, 0u64);
    // Update owed commission balance
    let new_commission_paleo: u64 = calculate_new_shares(current_balance as u128, pending_deposit_pool as u128, new_commission as u128, total_paleo_minted);
    balances.set(OWED_COMMISSION, current_owed_commission + new_commission_paleo);
    total_paleo_minted += new_commission_paleo as u128;
    // Update total balance
    balances.set(BONDED_POOL_BALANCE, current_balance + new_commission);

    // Calculate full pool size
    let full_pool: u128 = current_balance as u128 + pending_deposit_pool as u128;

    // Calculate credits value of burned pALEO
    let withdrawal_calculation: u128 = (net_burn_amount as u128 * full_pool as u128) / total_paleo_minted as u128;
    let withdrawal: u64 = withdrawal_calculation as u64;

    // Create withdrawal for caller in next batch
    let batch_height: u32 = get_batch_height(block.height);
    let withdrawal: withdrawal_state = withdrawal_state {
      microcredits: withdrawal,
      claim_block: batch_height
    };
    withdrawals.set(caller, withdrawal);
    // Update total for batch
    let batch_total: u64 = withdrawal_batches.get_or_use(batch_height, 0u64);
    withdrawal_batches.set(batch_height, batch_total + withdrawal);
  }

  inline get_batch_height(height: u32) -> u32 {
    // TODO: update for new epoch timing
    let min_block_height: u32 = height + WITHDRAW_WAIT_MINIMUM;
    let min_block_rounded_down: u32 = min_block_height / 10_000u32 * 10_000u32;
    let min_block_round_up: u32 = min_block_rounded_down + 10_000u32;
    return min_block_round_up;
  }

  // -------------------
  // REBALANCING FUNCTIONS
  // -------------------

  async transition prep_rebalance() -> Future {
    let f0: Future = delegator1.aleo/set_state(UNBOND_ALLOWED);
    let f1: Future = delegator2.aleo/set_state(UNBOND_ALLOWED);
    let f2: Future = delegator3.aleo/set_state(UNBOND_ALLOWED);
    let f3: Future = delegator4.aleo/set_state(UNBOND_ALLOWED);
    let f4: Future = delegator5.aleo/set_state(UNBOND_ALLOWED);
    return finalize_prep_rebalance();
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
    let blocks_into_epoch: u32 = block.height % BLOCKS_PER_EPOCH;
    assert(blocks_into_epoch < REBALANCE_PERIOD);
    // TODO: save last rebalance block height

    // read from boost pool and oracle to determine new validator set
  }

  async transition rebalance_retrieve_credits(
    public transfer_amounts: [u64; 5],
    public commission_mint: u64
  ) -> Future {
    let f0: Future = delegator1.aleo/transfer_to_core_protocol(transfer_amounts[0u8]);
    let f1: Future = delegator2.aleo/transfer_to_core_protocol(transfer_amounts[1u8]);
    let f2: Future = delegator3.aleo/transfer_to_core_protocol(transfer_amounts[2u8]);
    let f3: Future = delegator4.aleo/transfer_to_core_protocol(transfer_amounts[3u8]);
    let f4: Future = delegator5.aleo/transfer_to_core_protocol(transfer_amounts[4u8]);
    let f5: Future = pondo_staked_aleo_token.aleo/mint_public(commission_mint, pondo_token.aleo);

    return finalize_rebalance_retrieve_credits(f0, f1, f2, f3, f4, f5, transfer_amounts, commission_mint);
  }

  async function finalize_rebalance_retrieve_credits(
    public f0: Future,
    public f1: Future,
    public f2: Future,
    public f3: Future,
    public f4: Future,
    public f5: Future,
    public transfer_amounts: [u64; 5],
    public commission_mint: u64
  ) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
    f4.await();
    f5.await();

    // Update total balance and commission
    let total: u64 = transfer_amounts[0u8] + transfer_amounts[1u8] + transfer_amounts[2u8] + transfer_amounts[3u8] + transfer_amounts[4u8];

    let total_unbonding: u64 = delegator1_unbonding + delegator2_unbonding + delegator3_unbonding + delegator4_unbonding + delegator5_unbonding;
    let current_balance: u64 = balances.get_or_use(BONDED_POOL_BALANCE, 0u64);
    let current_owed_commission: u64 = balances.get_or_use(OWED_COMMISSION, 0u64);
    // Total pALEO minted, including owed commission, minus the commission minted in the transition
    let total_paleo_minted: u128 = multi_token_support_program/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128 - commission_mint as u128;

    let rewards: i64 = total_unbonding > current_balance ? total_unbonding as i64 - current_balance as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    current_balance += rewards as u64 - new_commission;

    let pending_deposit_pool: u64 = balances.get_or_use(PENDING_DEPOSIT_BALANCE, 0u64);
    let new_commission_paleo: u64 = calculate_new_shares(current_balance as u128, pending_deposit_pool as u128, new_commission as u128, total_paleo_minted);
    // New owed commission is whatever commission is left after the new commission mint, plus what we may have earned between calling the function and now
    balances.set(OWED_COMMISSION, current_owed_commission + new_commission_paleo - commission_mint);
    // Update total balance
    balances.set(BONDED_POOL_BALANCE, current_balance + new_commission);

    // Handle withdrawal batch
  }

  async transition rebalance_redistribute(
    public validators: [address; 5],
    public transfer_amounts: [u64; 5]
  ) -> Future {
    // Transfer to each delegator and set state to 0
    let f0: Future = credits.aleo/transfer_public(DELEGATOR_1, transfer_amounts[0u8]);
    let f1: Future = credits.aleo/transfer_public(DELEGATOR_2, transfer_amounts[1u8]);
    let f2: Future = credits.aleo/transfer_public(DELEGATOR_3, transfer_amounts[2u8]);
    let f3: Future = credits.aleo/transfer_public(DELEGATOR_4, transfer_amounts[3u8]);
    let f4: Future = credits.aleo/transfer_public(DELEGATOR_5, transfer_amounts[4u8]);

    let f5: Future = delegator1.aleo/set_state(BOND_ALLOWED);
    let f6: Future = delegator2.aleo/set_state(BOND_ALLOWED);
    let f7: Future = delegator3.aleo/set_state(BOND_ALLOWED);
    let f8: Future = delegator4.aleo/set_state(BOND_ALLOWED);
    let f9: Future = delegator5.aleo/set_state(BOND_ALLOWED);

    return finalize_rebalance_redistribute(f0, f1, f2, f3, f4, f5, f6, f7, f8, f9);
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
    public f9: Future
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
    // check that there's still enough account balance left for pending withdrawals
    // update pending deposits
  }
}
