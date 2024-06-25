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

  const ALEO_POOL_BALANCE: u8 = 0u8;
  const PENDING_DEPOSIT_BALANCE: u8 = 1u8;
  const PENDING_WITHDRAW_BALANCE: u8 = 2u8;


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

  // 0u8 -> total amount of publicly held aleo in the protocol
  // 1u8 -> total amount of aleo pending deposit
  // 2u8 -> total amount of aleo pending withdrawal
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
    f1: Future = pondo_staked_aleo_token.aleo/mint_public(expected_paleo_mint, self.caller);

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
    // Confirm pALEO mint amount
    let aleo_pool: u128 = total_aleo as u128;
    let ale_mint_amount: u64 = get_paleo_mint_amount(aleo_pool, credits_deposit as u128, ale_pool as u128);

    assert(paleo_mint_amount >= 1u64);
    assert(paleo_mint_amount >= expected_paleo_mint);

    let base_bond_state: bond_state = bond_state {
      validator: pondo_core_protocol.aleo,
      microcredits: 0u64
    };
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_1, base_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_2, base_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_3, base_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_4, base_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(DELEGATOR_5, base_bond_state).microcredits;

    let bonded_balance: u64 = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let pool_balance: u64 = core_protocol.aleo/balances.get_or_use(0u8, 0u64);
    let total_aleo: u64 = pool_balance + bonded_balance;
    let total_paleo_minted: u128 = multi_token_support_program/registered_tokens.get(PALEO_TOKEN_ID).supply;
    // Mint rewards to PONDO fee pool
    // let current_balance: u64 = total_balance.get(0u8);
    // let current_shares: u64 = total_shares.get(0u8);
    // let rewards: i64 = bonded > current_balance ? bonded as i64 - current_balance as i64 : 0i64;
    // let commission_rate: u128 = commission_percent.get(0u8);
    // let new_commission: u64 = get_commission(rewards as u128, commission_rate);
    // current_balance += rewards as u64 - new_commission;

    // let pending_deposit_pool: u64 = pending_deposits.get(0u8);
    // let new_commission_shares: u64 = calculate_new_shares(current_balance as u128, pending_deposit_pool as u128, new_commission as u128, current_shares as u128);
    // let current_commission: u64 = delegator_shares.get_or_use(ADMIN, 0u64);
    // delegator_shares.set(ADMIN, current_commission + new_commission_shares);

    // current_shares += new_commission_shares;
    // current_balance += new_commission;
    // // Update total balance
    // total_balance.set(0u8, current_balance);

    // // Calculate mint for deposit
    // let new_shares: u64 = calculate_new_shares(current_balance as u128, pending_deposit_pool as u128, microcredits as u128, current_shares as u128);

    // Handle referrer
  }

  // Note: requires the caller to create an allowance for the contract first
  transition deposit_public(
    public credits_deposit: u64,
    public referrer: address
  ) {
    // Transfer ALEO to pool
    multi_token_support_program.aleo/transfer_from_public(CREDITS_TOKEN_ID, self.caller, pondo_core_protocol.aleo, credits_deposit as u128);
    // Mint pALEO to depositor
    pondo_staked_aleo_token.aleo/mint_for_deposit(credits_deposit, self.caller);

    return then finalize(credits_deposit, referrer);
  }

  finalize deposit_public(
    public credits_deposit: u64,
    public referrer: address
  ) {
    // Confirm pALEO mint amount
    let aleo_pool: u128 = total_aleo as u128;
    let ale_mint_amount: u64 = get_paleo_mint_amount(aleo_pool, credits_deposit as u128, ale_pool as u128);
    assert(ale_mint_amount >= 1u64);
    assert(ale_mint_amount >= expected_paleo_mint);

    // Update deposit pool
    balances.set(0u8, pool_balance);

    // Handle referrer
  }

  transition bond_deposit_pool(
    validators: [address; 5],
    transfer_amounts: [u64; 5]
  ) {
    // Transfer to each validator
    // Will fail if each delegator doesn't reach the minimum bond amount
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
    // Confirm bonding is allowed TODO: bonding should be allowed during withdrawals
    let curr_protocol_state: u8 = protocol_state.get(0u8);
    let bonding_allowed: bool = curr_protocol_state == 0u8 || curr_protocol_state == 3u8;
    assert(bonding_allowed);

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

    // Subtract transfer amounts from pool
    pool_balance -= total_transfer;
    balances.set(0u8, pool_balance);
  }

  inline get_batch_height(height: u32) -> u32 {
    let min_block_height: u32 = height + WITHDRAW_WAIT_MINIMUM;
    let min_block_rounded_down: u32 = min_block_height / 10_000u32 * 10_000u32;
    let min_block_round_up: u32 = min_block_rounded_down + 10_000u32;
    return min_block_round_up;
  }

  transition create_withdraw_claim(
    public current_height: u32,
    // total amount of ale to burn, including fee
    public ale_burn_amount: u64
  ) {
    let withdraw_block: u32 = get_batch_height(current_height);
    pondo_staked_aleo.aleo/burn_public(ale_burn_amount);
    // Mint fee to protocol in ale
    let fee_calc: u128 = ale_burn_amount as u128 * WITHDRAW_FEE / PRECISION_UNSIGNED;
    let fee: u64 = fee_calc as u64;
    pondo_staked_aleo.aleo/mint_public(fee, pondo_token.aleo);

    // Withdraw ale less fee
    let net_ale_burn_amount: u64 = ale_burn_amount - fee;
    return then finalize(current_height, net_ale_burn_amount, withdraw_block, credits_claim_amount);
  }

  finalize create_withdraw_claim(
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
    let saved_withdraw_amount: u64 = withdraw_batches.get_or_use(withdraw_block, 0u64);
    // TODO: issue commission to protocol

    // ********** ASSERT INPUTS AND STATE **********
    assert_eq(saved_withdraw_amount, total_amount);

    // ********** ASSERT THAT DELEGATOR PROPORTIONS DO NOT CHANGE **********
    // check bonded balance for each delegator
    // calculate proportion for each delegator


    // TODO: margin for error?
    // assert_eq(curr_d1_ratio, new_d1_ratio);
    // assert_eq(curr_d2_ratio, new_d2_ratio);
    // assert_eq(curr_d3_ratio, new_d3_ratio);
    // assert_eq(curr_d4_ratio, new_d4_ratio);
    // assert_eq(curr_d5_ratio, new_d5_ratio);

    // *********** UPDATE PROTOCOL STATE **********
    assert_eq(protocol_state.get(0u8), 0u8);
    protocol_state.set(0u8, 10u8);
  }

  transition withdraw_claim_unbond(
    public unbond_amounts: [u64; 5]
  ) {
    // Claim unbonded credits and withdraw them to this contract
    credits.aleo/claim_unbond_public(delegator1.aleo);
    credits.aleo/claim_unbond_public(delegator2.aleo);
    credits.aleo/claim_unbond_public(delegator3.aleo);
    credits.aleo/claim_unbond_public(delegator4.aleo);
    credits.aleo/claim_unbond_public(delegator5.aleo);

    return then finalize(unbond_amounts);
  }

  finalize withdraw_claim_unbond(
    public unbond_amounts: [u64; 5]
  ) {
    // ********** ASSERT INPUTS AND STATE **********
    // TODO: assert the delegator account balances are empty
    // if the balance isn't empty that means the delegator was
    // forcibly unbonded and the fix_orphaned_delegator transition
    // must be called
    // also, if claim_unbond fails, the fix_orphaned_delegator transition
    // needs to be called too

    // update pending withdrawal

    // *********** CHECK & UPDATE PROTOCOL STATE **********
    assert_eq(protocol_state.get(0u8), 10u8);
    // withdraw claim finished, set protocol back to normal
    protocol_state.set(0u8, 0u8);
  }
}
