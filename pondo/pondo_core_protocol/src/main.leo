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
  const PROFITABILITY_TIMEFRAME: u32 = 40_000u32; // 1 week of blocks
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
  // 1u8 -> total amount of aleo pending deposit
  // 2u8 -> total amount of aleo pending withdrawal
  // 3u8 -> total amount of pALEO owed to the protocol, yet to be minted
  mapping balances: u8 => u64;

  mapping withdraw_batches: u32 => u64;

  mapping boost_pool: address => u64;

  mapping portion_delegator: u128 => address;
  mapping delegator_performance: address => u64;

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

  async finalize_deposit_public(
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

  async transition bond_pool(
    validators: [address; 5],
    transfer_amounts: [u64; 5]
  ) -> Future {
    // Transfer to each delegator and bond
    // Will fail if each delegator doesn't reach the minimum bond amount
    f0: Future = credits.aleo/transfer_public(DELEGATOR_1, transfer_amounts[0u8]);
    f1: Future = delegator1.aleo/bond(validators[0u8], transfer_amounts[0u8]);

    f2: Future = credits.aleo/transfer_public(DELEGATOR_2, transfer_amounts[1u8]);
    f3: Future = delegator2.aleo/bond(validators[1u8], transfer_amounts[1u8]);

    f4: Future = credits.aleo/transfer_public(DELEGATOR_3, transfer_amounts[2u8]);
    f5: Future = delegator3.aleo/bond(validators[2u8], transfer_amounts[2u8]);

    f6: Future = credits.aleo/transfer_public(DELEGATOR_4, transfer_amounts[3u8]);
    f7: Future = delegator4.aleo/bond(validators[3u8], transfer_amounts[3u8]);

    f8: Future = credits.aleo/transfer_public(DELEGATOR_5, transfer_amounts[4u8]);
    f9: Future = delegator5.aleo/bond(validators[4u8], transfer_amounts[4u8]);

    let futures: [Future; 10] = [f0, f1, f2, f3, f4, f5, f6, f7, f8, f9];

    return finalize_bond_pool(futures, validators, transfer_amounts);
  }

  async finalize_bond_pool(
    futures: [Future; 10],
    validators: [address; 5],
    transfer_amounts: [u64; 5]
  ) {
    // TODO: await all futures
    // ********** ASSERT INPUTS **********
    // Confirm that each delegator has the correct proportion of the pool
    // TODO: check bonded balances of each delegator


    // Subtract transfer amounts from pool
    let total_transfer: u64 = transfer_amounts[0u8] + transfer_amounts[1u8] + transfer_amounts[2u8] + transfer_amounts[3u8] + transfer_amounts[4u8];
    let deposit_pool_balance: u64 = balances.get_or_use(PENDING_DEPOSIT_BALANCE, 0u64);
    deposit_pool_balance -= total_transfer;
    balances.set(PENDING_DEPOSIT_BALANCE, deposit_pool_balance);
  }

  inline get_batch_height(height: u32) -> u32 {
    let min_block_height: u32 = height + WITHDRAW_WAIT_MINIMUM;
    let min_block_rounded_down: u32 = min_block_height / 10_000u32 * 10_000u32;
    let min_block_round_up: u32 = min_block_rounded_down + 10_000u32;
    return min_block_round_up;
  }

  async transition withdraw_public(
    public current_height: u32,
    // total amount of pALEO to burn, including fee
    public paleo_burn_amount: u64
  ) -> Future {
    let withdraw_block: u32 = get_batch_height(current_height);
    pondo_staked_aleo.aleo/burn_public(paleo_burn_amount, self.caller);
    // Mint fee to protocol in pALEO
    let fee_calc: u128 = paleo_burn_amount as u128 * WITHDRAW_FEE / PRECISION_UNSIGNED;
    let fee: u64 = fee_calc as u64;
    pondo_staked_aleo.aleo/mint_public(fee, pondo_token.aleo);

    // Withdraw ale less fee
    let net_ale_burn_amount: u64 = ale_burn_amount - fee;
    return then finalize(current_height, net_ale_burn_amount, withdraw_block, credits_claim_amount);
  }

  async function finalize_withdraw_public(
    current_height: u32,
    net_ale_burn_amount: u64,
    withdraw_block: u32,
    credits_withdraw: u64
  ) {
    assert(block.height <= current_height);
    let total_withdraw_amount: u64 = withdraw_batches.get_or_use(withdraw_block, 0u64);
    total_withdraw_amount = total_withdraw_amount + credits_withdraw;
    withdraw_batches.set(withdraw_block, total_withdraw_amount);

    let d1_state: state = delegator_state.get(DELEGATOR_1);
    let d2_state: state = delegator_state.get(DELEGATOR_2);
    let d3_state: state = delegator_state.get(DELEGATOR_3);
    let d4_state: state = delegator_state.get(DELEGATOR_4);
    let d5_state: state = delegator_state.get(DELEGATOR_5);

    // ********** CONFIRM RATIO OF ALEO AND ALE POOLS **********
    // TODO: get total aleo by checking each delegator's bonded balance
    let pool_balance: u64 = balances.get_or_use(0u8, 0u64);
    let total_aleo_before: u64 = pool_balance;
    let total_aleo_after: u64 = total_aleo_before - credits_withdraw;

    let total_ale_before: u64 = total_ale_pool;
    let total_ale_after: u64 = total_ale_before - net_ale_burn_amount;

    // aleo_before / aleo_after should equal ale_before / ale_after
    // aleo_before * ale_after = aleo_after * ale_before

    let product_1: u128 = total_aleo_before as u128 * total_ale_after as u128;
    let product_2: u128 = total_aleo_after as u128 * total_ale_before as u128;
    assert_eq(product_1, product_2);
  }

  // -------------------
  // REBALANCING FUNCTIONS
  // -------------------

  async transition rebalance_unbond(
    public unbond_amounts: [u64; 5],
    public commission_mint: u64
  ) -> Future {
    f0: Future = delegator1.aleo/unbond(unbond_amounts[0u8]);
    f1: Future = delegator2.aleo/unbond(unbond_amounts[1u8]);
    f2: Future = delegator3.aleo/unbond(unbond_amounts[2u8]);
    f3: Future = delegator4.aleo/unbond(unbond_amounts[3u8]);
    f4: Future = delegator5.aleo/unbond(unbond_amounts[4u8]);
    f5: Future = pondo_staked_aleo_token.aleo/mint_public(commission_mint, pondo_token.aleo);

    return finalize_rebalance_unbond(f0, f1, f2, f3, f4, unbond_amounts, commission_mint);
  }

  async function finalize_rebalance_unbond(
    public f0: Future,
    public f1: Future,
    public f2: Future,
    public f3: Future,
    public f4: Future,
    public unbond_amounts: [u64; 5],
    public commission_mint: u64
  ) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
    f4.await();

    // Confirm that each delegator was fully unbonded
    let default_bond_state: bond_state = bond_state {
      validator: pondo_core_protocol.aleo,
      microcredits: 0u64
    };
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_1, default_bond_state);
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_2, default_bond_state);
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_3, default_bond_state);
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_4, default_bond_state);
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_5, default_bond_state);
    assert_eq(delegator1_bonded, default_bond_state);
    assert_eq(delegator2_bonded, default_bond_state);
    assert_eq(delegator3_bonded, default_bond_state);
    assert_eq(delegator4_bonded, default_bond_state);
    assert_eq(delegator5_bonded, default_bond_state);

    // TODO: Update owed commission
  }

  async transition claim_unbond(
  ) -> Future {
    f0: Future = credits.aleo/claim_unbond_public(delegator1.aleo);
    f1: Future = credits.aleo/claim_unbond_public(delegator2.aleo);
    f2: Future = credits.aleo/claim_unbond_public(delegator3.aleo);
    f3: Future = credits.aleo/claim_unbond_public(delegator4.aleo);
    f4: Future = credits.aleo/claim_unbond_public(delegator5.aleo);

    return finalize_claim_unbond(f0, f1, f2, f3, f4);
  }

  async function finalize_claim_unbond(
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
  }
}
