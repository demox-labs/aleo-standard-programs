import credits.aleo;
import multi_token_support_program_v1.aleo;
import pondo_staked_aleo_token.aleo;
import pondo_token.aleo;
import delegator1.aleo;
import delegator2.aleo;
import delegator3.aleo;
import delegator4.aleo;
import delegator5.aleo;

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

  const WITHDRAW_WAIT_MINIMUM: u32 = 43_200u32; // aproximately 2.5 days of blocks, assuming 5 sec per block
  const WITHDRAW_FEE: u128 = 30u128; // out of 1000, 3% fee
  const WITHDRAW_LIMIT_PER_EPOCH: u64 = 1_000_000_000_000u64; // 1M credits

  const MINIMUM_BOOST: u64 = 5_000_000u64;

  const PALEO_TOKEN_ID: field = 1751493913335802797273486270793650302076377624243810059080883537084141842600field;
  const CREDITS_TOKEN_ID: field = 3443843282313283355522573239085696902919850365217539366784739393210722344986field;

  // Keys for the balances metadata mapping
  const TOTAL_POOL_BALANCE: u8 = 0u8;
  const BONDED_WITHDRAWALS: u8 = 1u8;
  const BOOST_POOL: u8 = 2u8;
  const WITHDRAWALS_AVAILABLE_TO_CLAIM: u8 = 3u8;

  // Delegator states
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

  // 0u8 -> the current validator set
  // 1u8 -> the next validator set
  mapping validator_set: u8 => [address; 5];

  // Metadata mapping for the balances of ALEO held in the program
  // 0u8 -> the last tracked balance of aleo bonded via the protocol (not including withdrawals)
  // 1u8 -> the amount of credits that have been withdrawn but are still bonded via the protocol
  // 2u8 -> total amount of aleo held in this program that is part of the boost pool
  // 3u8 -> total amount of aleo held in this program that is reserved for withdrawals
  mapping balances: u8 => u64;

  // address -> the amount of aleo that has been boosted by/for this validator
  mapping boost_pool: address => u64;

  // 0u8 -> the total amount of pALEO owed to the protocol, yet to be minted
  mapping owed_commission: u8 => u64;

  // 0u8 -> the last epoch where a rebalance occured, zero-indexed (block.height / BLOCKS_PER_EPOCH)
  // Updated after rebalancing at the start of each epoch
  mapping last_rebalance_epoch: u8 => u32;

  // 0u8 -> the amount of microcredits that have been withdrawn in the current epoch
  // Reset to 0 at the start of each epoch
  mapping withdrawn_this_epoch: u8 => u64;

  struct withdrawal_state {
    microcredits: u64,
    claim_block: u32
  }

  // address -> pending withdrawal for this address
  mapping withdrawals: address => withdrawal_state;
  // u32 -> batch number (batch height / BLOCKS_PER_EPOCH) -> total amount of aleo reserved for withdrawals in this batch
  // withdrawals are processed at the start of the next epoch i.e. batch 0u32 is processed at the start of epoch 1u32
  mapping withdrawal_batches: u32 => u64;

  async transition initialize() -> Future {
    let f0: Future = pondo_staked_aleo_token.aleo/register_token();
    let f1: Future = pondo_token.aleo/initialize_token();
    // set validator and state for each delegator?

    return finalize_initialize(f0, f1);
  }

  async function finalize_initialize(
    public f0: Future,
    public f1: Future
  ) {
    f0.await();
    f1.await();

    balances.set(TOTAL_POOL_BALANCE, 0u64); // would have to read delegator balances to set this correctly if funded externally
    balances.set(BOOST_POOL, 0u64);
    balances.set(WITHDRAWALS_AVAILABLE_TO_CLAIM, 0u64);
    owed_commission.set(0u8, 0u64);
    last_rebalance_epoch.set(0u8, 0u32);
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
    let f0: Future = credits.aleo/transfer_public_as_signer(pondo_core_protocol.aleo, credits_deposit);
    // Mint pALEO to depositor
    let f1: Future = pondo_staked_aleo_token.aleo/mint_public(expected_paleo_mint, self.signer);

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
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(delegator1.aleo, base_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(delegator2.aleo, base_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(delegator3.aleo, base_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(delegator4.aleo, base_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(delegator5.aleo, base_bond_state).microcredits;

    let delegator1_account: u64 = credits.aleo/account.get_or_use(delegator1.aleo, 0u64);
    let delegator2_account: u64 = credits.aleo/account.get_or_use(delegator2.aleo, 0u64);
    let delegator3_account: u64 = credits.aleo/account.get_or_use(delegator3.aleo, 0u64);
    let delegator4_account: u64 = credits.aleo/account.get_or_use(delegator4.aleo, 0u64);
    let delegator5_account: u64 = credits.aleo/account.get_or_use(delegator5.aleo, 0u64);

    let total_bonded: u64 = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: u64 = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let bonded_withdrawals: u64 = balances.get_or_use(BONDED_WITHDRAWALS, 0u64);
    let full_balance: u64 = total_bonded + total_account - bonded_withdrawals;

    let current_balance: u64 = balances.get_or_use(TOTAL_POOL_BALANCE, 0u64);
    let current_owed_commission: u64 = owed_commission.get_or_use(0u8, 0u64);
    let total_paleo_minted: u128 = multi_token_support_program_v1.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128;

    let rewards: i64 = full_balance > current_balance ? full_balance as i64 - current_balance as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    current_balance += rewards as u64 - new_commission;

    let core_protocol_account: u64 = credits.aleo/account.get_or_use(pondo_core_protocol.aleo, 0u64);
    let boost_pool_balance: u64 = balances.get_or_use(BOOST_POOL, 0u64);
    let pending_withdrawal_balance: u64 = balances.get_or_use(WITHDRAWALS_AVAILABLE_TO_CLAIM, 0u64);
    let deposit_pool: u64 = core_protocol_account - boost_pool_balance - pending_withdrawal_balance - credits_deposit;
    let new_commission_paleo: u64 = calculate_new_shares(current_balance as u128, deposit_pool as u128, new_commission as u128, total_paleo_minted);
    owed_commission.set(0u8, current_owed_commission + new_commission_paleo);

    total_paleo_minted += new_commission_paleo as u128;
    current_balance += new_commission;
    // Update bonded pool balance with latest rewards
    balances.set(TOTAL_POOL_BALANCE, current_balance);

    // Calculate mint for deposit
    let paleo_for_deposit: u64 = calculate_new_shares(current_balance as u128, deposit_pool as u128, credits_deposit as u128, total_paleo_minted);
    assert(paleo_for_deposit >= 1u64);
    assert(paleo_for_deposit >= expected_paleo_mint);

    // TODO: Handle referrer
  }

  inline get_commission(
    rewards: u128,
    commission_rate: u128,
  ) -> u64 {
    let commission: u128 = rewards * commission_rate / PRECISION_UNSIGNED;
    let commission_64: u64 = commission as u64;
    return commission_64;
  }

  inline calculate_new_shares(bonded_balance: u128, existing_deposit_pool: u128, deposit: u128, shares: u128) -> u64 {
    let full_balance: u128 = bonded_balance + existing_deposit_pool;
    let new_total_shares: u128 = (shares * (full_balance + deposit)) / full_balance;
    let diff: u128 = new_total_shares - shares;
    let shares_to_mint: u64 = diff as u64;
    return shares_to_mint;
  }

  // Note: requires the caller to create an allowance for the contract first
  async transition deposit_public(
    public credits_deposit: u64,
    public expected_paleo_mint: u64,
    public referrer: address
  ) -> Future {
    // Transfer ALEO to pool
    let f0: Future = multi_token_support_program_v1.aleo/transfer_from_public(CREDITS_TOKEN_ID, self.caller, pondo_core_protocol.aleo, credits_deposit as u128);
    // Mint pALEO to depositor
    let f1: Future = pondo_staked_aleo_token.aleo/mint_public(expected_paleo_mint, self.caller);

    return finalize_deposit_public(f0, f1, credits_deposit, expected_paleo_mint, referrer);
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
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(delegator1.aleo, base_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(delegator2.aleo, base_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(delegator3.aleo, base_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(delegator4.aleo, base_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(delegator5.aleo, base_bond_state).microcredits;

    let delegator1_account: u64 = credits.aleo/account.get_or_use(delegator1.aleo, 0u64);
    let delegator2_account: u64 = credits.aleo/account.get_or_use(delegator2.aleo, 0u64);
    let delegator3_account: u64 = credits.aleo/account.get_or_use(delegator3.aleo, 0u64);
    let delegator4_account: u64 = credits.aleo/account.get_or_use(delegator4.aleo, 0u64);
    let delegator5_account: u64 = credits.aleo/account.get_or_use(delegator5.aleo, 0u64);

    let total_bonded: u64 = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: u64 = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let bonded_withdrawals: u64 = balances.get_or_use(BONDED_WITHDRAWALS, 0u64);
    let full_balance: u64 = total_bonded + total_account - bonded_withdrawals;

    let current_balance: u64 = balances.get_or_use(TOTAL_POOL_BALANCE, 0u64);
    let current_owed_commission: u64 = owed_commission.get_or_use(0u8, 0u64);
    let total_paleo_minted: u128 = multi_token_support_program_v1.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128;

    let rewards: i64 = full_balance > current_balance ? full_balance as i64 - current_balance as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    current_balance += rewards as u64 - new_commission;

    let core_protocol_account: u64 = credits.aleo/account.get_or_use(pondo_core_protocol.aleo, 0u64);
    let boost_pool_balance: u64 = balances.get_or_use(BOOST_POOL, 0u64);
    let pending_withdrawal_balance: u64 = balances.get_or_use(WITHDRAWALS_AVAILABLE_TO_CLAIM, 0u64);
    let deposit_pool: u64 = core_protocol_account - boost_pool_balance - pending_withdrawal_balance - credits_deposit;
    let new_commission_paleo: u64 = calculate_new_shares(current_balance as u128, deposit_pool as u128, new_commission as u128, total_paleo_minted);
    owed_commission.set(0u8, current_owed_commission + new_commission_paleo);

    total_paleo_minted += new_commission_paleo as u128;
    current_balance += new_commission;
    // Update bonded pool balance with latest rewards
    balances.set(TOTAL_POOL_BALANCE, current_balance);

    // Calculate mint for deposit
    let paleo_for_deposit: u64 = calculate_new_shares(current_balance as u128, deposit_pool as u128, credits_deposit as u128, total_paleo_minted);
    assert(paleo_for_deposit >= 1u64);
    assert(paleo_for_deposit >= expected_paleo_mint);

    // TODO: Handle referrer
  }

  async transition distribute_deposits(
    public validators: [address; 5],
    public transfer_amounts: [u64; 5] // should be safe to transfer 0?
  ) -> Future {
    // Transfer to each delegator
    let f0: Future = credits.aleo/transfer_public(delegator1.aleo, transfer_amounts[0u8]);
    let f1: Future = credits.aleo/transfer_public(delegator2.aleo, transfer_amounts[1u8]);
    let f2: Future = credits.aleo/transfer_public(delegator3.aleo, transfer_amounts[2u8]);
    let f3: Future = credits.aleo/transfer_public(delegator4.aleo, transfer_amounts[3u8]);
    let f4: Future = credits.aleo/transfer_public(delegator5.aleo, transfer_amounts[4u8]);

    return finalize_distribute_deposits(f0, f1, f2, f3, f4, validators, transfer_amounts);
  }

  async function finalize_distribute_deposits(
    f0: Future,
    f1: Future,
    f2: Future,
    f3: Future,
    f4: Future,
    validators: [address; 5],
    transfer_amounts: [u64; 5]
  ) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
    f4.await();

    // Confirm that there are enough credits left for withdrawals and the boost pool
    let account_balance: u64 = credits.aleo/account.get_or_use(pondo_core_protocol.aleo, 0u64);
    let boost_pool_balance: u64 = balances.get_or_use(BOOST_POOL, 0u64);
    let pending_withdrawal_balance: u64 = balances.get_or_use(WITHDRAWALS_AVAILABLE_TO_CLAIM, 0u64);
    assert(account_balance >= boost_pool_balance + pending_withdrawal_balance);

    // Confirm each delegator is already bonded and in the correct state
    let delegator1_state: u8 = delegator1.aleo/state_mapping.get(0u8);
    let delegator2_state: u8 = delegator2.aleo/state_mapping.get(0u8);
    let delegator3_state: u8 = delegator3.aleo/state_mapping.get(0u8);
    let delegator4_state: u8 = delegator4.aleo/state_mapping.get(0u8);
    let delegator5_state: u8 = delegator5.aleo/state_mapping.get(0u8);
    assert(delegator1_state == UNBOND_NOT_ALLOWED && delegator2_state == UNBOND_NOT_ALLOWED && delegator3_state == UNBOND_NOT_ALLOWED && delegator4_state == UNBOND_NOT_ALLOWED && delegator5_state == UNBOND_NOT_ALLOWED);

    // Check delegator proportions (note: the margin for error is +/- 1% of the total amount of aleo held in the protocol)
    let base_bond_state: bond_state = bond_state {
      validator: pondo_core_protocol.aleo,
      microcredits: 0u64
    };
    let delegator1_bonded: u128 = credits.aleo/bonded.get_or_use(delegator1.aleo, base_bond_state).microcredits as u128;
    let delegator2_bonded: u128 = credits.aleo/bonded.get_or_use(delegator2.aleo, base_bond_state).microcredits as u128;
    let delegator3_bonded: u128 = credits.aleo/bonded.get_or_use(delegator3.aleo, base_bond_state).microcredits as u128;
    let delegator4_bonded: u128 = credits.aleo/bonded.get_or_use(delegator4.aleo, base_bond_state).microcredits as u128;
    let delegator5_bonded: u128 = credits.aleo/bonded.get_or_use(delegator5.aleo, base_bond_state).microcredits as u128;

    let delegator1_account: u128 = credits.aleo/account.get_or_use(delegator1.aleo, 0u64) as u128;
    let delegator2_account: u128 = credits.aleo/account.get_or_use(delegator2.aleo, 0u64) as u128;
    let delegator3_account: u128 = credits.aleo/account.get_or_use(delegator3.aleo, 0u64) as u128;
    let delegator4_account: u128 = credits.aleo/account.get_or_use(delegator4.aleo, 0u64) as u128;
    let delegator5_account: u128 = credits.aleo/account.get_or_use(delegator5.aleo, 0u64) as u128;

    let delegator1_total: u128 = delegator1_bonded + delegator1_account;
    let delegator2_total: u128 = delegator2_bonded + delegator2_account;
    let delegator3_total: u128 = delegator3_bonded + delegator3_account;
    let delegator4_total: u128 = delegator4_bonded + delegator4_account;
    let delegator5_total: u128 = delegator5_bonded + delegator5_account;

    let total: u128 = delegator1_total + delegator2_total + delegator3_total + delegator4_total + delegator5_total;

    let delegator1_portion: u128 = delegator1_total * PRECISION_UNSIGNED / total;
    let delegator2_portion: u128 = delegator2_total * PRECISION_UNSIGNED / total;
    let delegator3_portion: u128 = delegator3_total * PRECISION_UNSIGNED / total;
    let delegator4_portion: u128 = delegator4_total * PRECISION_UNSIGNED / total;
    let delegator5_portion: u128 = delegator5_total * PRECISION_UNSIGNED / total;
    assert(delegator1_portion == PORTION_1 && delegator2_portion == PORTION_2 && delegator3_portion == PORTION_3 && delegator4_portion == PORTION_4 && delegator5_portion == PORTION_5);
  }

  // -------------------
  // WITHDRAW FUNCTIONS
  // -------------------

  async transition withdraw_public(
    // total amount of pALEO to burn, including fee
    public paleo_burn_amount: u64
  ) -> Future {
    // Burn pALEO for withdrawal
    let f0: Future = pondo_staked_aleo_token.aleo/burn_public(paleo_burn_amount, self.caller);
    // Mint withdrawal fee to pALEO pool for pondo token
    let fee_calc: u128 = paleo_burn_amount as u128 * WITHDRAW_FEE / PRECISION_UNSIGNED;
    let fee: u64 = fee_calc as u64;
    let f1: Future = pondo_staked_aleo_token.aleo/mint_public(fee, pondo_token.aleo);

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

    // Block withdrawals during a rebalance
    let rebalanced_prepped: bool = validator_set.contains(1u8);
    assert(!rebalanced_prepped);

    // Assert that the caller does not have a pending withdrawal
    let has_withdrawal: bool = withdrawals.contains(caller);
    assert(!has_withdrawal);

    // Calculate commission owed
    let base_bond_state: bond_state = bond_state {
      validator: pondo_core_protocol.aleo,
      microcredits: 0u64
    };
    let delegator1_bonded: u64 = credits.aleo/bonded.get_or_use(delegator1.aleo, base_bond_state).microcredits;
    let delegator2_bonded: u64 = credits.aleo/bonded.get_or_use(delegator2.aleo, base_bond_state).microcredits;
    let delegator3_bonded: u64 = credits.aleo/bonded.get_or_use(delegator3.aleo, base_bond_state).microcredits;
    let delegator4_bonded: u64 = credits.aleo/bonded.get_or_use(delegator4.aleo, base_bond_state).microcredits;
    let delegator5_bonded: u64 = credits.aleo/bonded.get_or_use(delegator5.aleo, base_bond_state).microcredits;

    let delegator1_account: u64 = credits.aleo/account.get_or_use(delegator1.aleo, 0u64);
    let delegator2_account: u64 = credits.aleo/account.get_or_use(delegator2.aleo, 0u64);
    let delegator3_account: u64 = credits.aleo/account.get_or_use(delegator3.aleo, 0u64);
    let delegator4_account: u64 = credits.aleo/account.get_or_use(delegator4.aleo, 0u64);
    let delegator5_account: u64 = credits.aleo/account.get_or_use(delegator5.aleo, 0u64);

    let total_bonded: u64 = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: u64 = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let bonded_withdrawals: u64 = balances.get_or_use(BONDED_WITHDRAWALS, 0u64);
    let full_balance: u64 = total_bonded + total_account - bonded_withdrawals;

    let current_balance: u64 = balances.get_or_use(TOTAL_POOL_BALANCE, 0u64);
    let current_owed_commission: u64 = owed_commission.get_or_use(0u8, 0u64);
    let paleo_minted_post_burn: u128 = multi_token_support_program_v1.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128;
    let total_paleo_minted: u128 = paleo_minted_post_burn + net_burn_amount as u128;

    let rewards: i64 = full_balance > current_balance ? full_balance as i64 - current_balance as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    current_balance += rewards as u64 - new_commission;

    let core_protocol_account: u64 = credits.aleo/account.get_or_use(pondo_core_protocol.aleo, 0u64);
    let boost_pool_balance: u64 = balances.get_or_use(BOOST_POOL, 0u64);
    let pending_withdrawal_balance: u64 = balances.get_or_use(WITHDRAWALS_AVAILABLE_TO_CLAIM, 0u64);
    let deposit_pool: u64 = core_protocol_account - boost_pool_balance - pending_withdrawal_balance;
    // Update owed commission balance
    let new_commission_paleo: u64 = calculate_new_shares(current_balance as u128, deposit_pool as u128, new_commission as u128, total_paleo_minted);
    owed_commission.set(0u8, current_owed_commission + new_commission_paleo);
    total_paleo_minted += new_commission_paleo as u128;
    current_balance += new_commission;

    // Calculate full pool size
    let full_pool: u128 = current_balance as u128 + deposit_pool as u128;

    // Calculate credits value of burned pALEO
    let withdrawal_calculation: u128 = (net_burn_amount as u128 * full_pool as u128) / total_paleo_minted as u128;
    let withdrawal: u64 = withdrawal_calculation as u64;

    // Update bonded withdrawals
    balances.set(BONDED_WITHDRAWALS, bonded_withdrawals + withdrawal);

    // Update total balance to reflect withdrawal
    balances.set(TOTAL_POOL_BALANCE, current_balance - withdrawal);

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
    assert(withdrawal.claim_block < block.height);

    // Confirm this is within the withdraw limit for the epoch
    let withdrawn_so_far: u64 = withdrawn_this_epoch.get_or_use(0u8, 0u64);
    assert(withdrawn_so_far + amount <= MINIMUM_BOND_POOL);

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

    // Update withdrawn_this_epoch
    withdrawn_this_epoch.set(0u8, withdrawn_so_far + amount);

    // Update pending withdrawal
    let pending_withdrawal: u64 = balances.get_or_use(WITHDRAWALS_AVAILABLE_TO_CLAIM, 0u64);
    balances.set(WITHDRAWALS_AVAILABLE_TO_CLAIM, pending_withdrawal - amount);
  }

  // -------------------
  // REBALANCING FUNCTIONS
  // -------------------

  async transition boost_public_as_signer(
    public amount: u64,
    public validator: address
  ) -> Future {
    assert(amount >= MINIMUM_BOOST);
    let f0: Future = credits.aleo/transfer_public_as_signer(pondo_core_protocol.aleo, amount);

    return finalize_boost_public_as_signer(f0, amount, validator);
  }

  async function finalize_boost_public_as_signer(
    public f0: Future,
    public amount: u64,
    public validator: address
  ) {
    f0.await();

    // Update boost for validator
    let current_boost: u64 = boost_pool.get_or_use(validator, 0u64);
    boost_pool.set(validator, current_boost + amount);
    // TODO: take epoch into account

    // Update boost pool balance
    let total_boost: u64 = balances.get_or_use(BOOST_POOL, 0u64);
    balances.set(BOOST_POOL, total_boost + amount);
  }

  async transition boost_public(
    public amount: u64,
    public validator: address
  ) -> Future {
    let f0: Future = multi_token_support_program_v1.aleo/transfer_from_public(CREDITS_TOKEN_ID, self.caller, pondo_core_protocol.aleo, amount as u128);
    let f1: Future = multi_token_support_program_v1.aleo/withdraw_credits_public(amount);

    return finalize_boost_public(f0, f1, amount, validator);
  }

  async function finalize_boost_public(
    public f0: Future,
    public f1: Future,
    public amount: u64,
    public validator: address
  ) {
    f0.await();
    f1.await();

    // Update boost for validator
    let current_boost: u64 = boost_pool.get_or_use(validator, 0u64);
    boost_pool.set(validator, current_boost + amount);

    // Update boost pool balance
    let total_boost: u64 = balances.get_or_use(BOOST_POOL, 0u64);
    balances.set(BOOST_POOL, total_boost + amount);
  }

  async transition prep_rebalance() -> Future {
    let f0: Future = delegator1.aleo/set_state(UNBOND_ALLOWED);
    let f1: Future = delegator2.aleo/set_state(UNBOND_ALLOWED);
    let f2: Future = delegator3.aleo/set_state(UNBOND_ALLOWED);
    let f3: Future = delegator4.aleo/set_state(UNBOND_ALLOWED);
    let f4: Future = delegator5.aleo/set_state(UNBOND_ALLOWED);

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
    let last_rebalance: u32 = last_rebalance_epoch.get_or_use(0u8, 0u32);
    assert(current_epoch > last_rebalance);
    let blocks_into_epoch: u32 = block.height % BLOCKS_PER_EPOCH;
    assert(blocks_into_epoch < REBALANCE_PERIOD); // if we miss the rebalance window for whatever reason, we can't rebalance until the next epoch and withdrawals will be delayed

    // TODO: read from boost pool and oracle to determine new validator set
  }

  // async transition capture_missed_withdrawal_batches() -> Future {
  //   return finalize_capture_missed_withdrawal_batches();
  // }

  // async function finalize_capture_missed_withdrawal_batches() {
  //   assert(true);

  //   // TODO: move any missed withdrawals to the current epoch batch
  // }

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

    return finalize_rebalance_retrieve_credits(f0, f1, f2, f3, f4, f5, commission_mint);
  }

  async function finalize_rebalance_retrieve_credits(
    public f0: Future,
    public f1: Future,
    public f2: Future,
    public f3: Future,
    public f4: Future,
    public f5: Future,
    public commission_mint: u64
  ) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
    f4.await();
    f5.await();

    // Update balances and owed commission
    // At this point, all credits have been transferred to the core protocol, but there may still be commission owed
    let core_protocol_account: u64 = credits.aleo/account.get_or_use(pondo_core_protocol.aleo, 0u64);
    let boost_pool_balance: u64 = balances.get_or_use(BOOST_POOL, 0u64);
    let pending_withdrawal_balance: u64 = balances.get_or_use(WITHDRAWALS_AVAILABLE_TO_CLAIM, 0u64);
    let bonded_withdrawals: u64 = balances.get_or_use(BONDED_WITHDRAWALS, 0u64);

    let true_balance: u64 = core_protocol_account - boost_pool_balance - pending_withdrawal_balance - bonded_withdrawals;
    let current_balance: u64 = balances.get_or_use(TOTAL_POOL_BALANCE, 0u64);

    let current_owed_commission: u64 = owed_commission.get_or_use(0u8, 0u64);
    // Total pALEO minted, including owed commission, minus the commission minted in the transition
    let total_paleo_minted: u128 = multi_token_support_program_v1.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply + current_owed_commission as u128 - commission_mint as u128;

    let rewards: i64 = true_balance > current_balance ? true_balance as i64 - current_balance as i64 : 0i64;
    let new_commission: u64 = get_commission(rewards as u128, PROTOCOL_FEE);
    current_balance += rewards as u64 - new_commission;

    let new_commission_paleo: u64 = calculate_new_shares(current_balance as u128, 0u128, new_commission as u128, total_paleo_minted);
    // New owed commission is whatever commission is left after the new commission mint, plus what we may have earned between calling the function and now
    owed_commission.set(0u8, current_owed_commission + new_commission_paleo - commission_mint);
    // Update total balance
    balances.set(TOTAL_POOL_BALANCE, current_balance + new_commission);

    // Move bonded withdrawals to available to claim
    let current_epoch: u32 = block.height / BLOCKS_PER_EPOCH;
    //  Process withdrawals from the previous epoch
    let current_withdrawal_batch: u64 = withdrawal_batches.get_or_use(current_epoch - 1u32, 0u64);
    balances.set(WITHDRAWALS_AVAILABLE_TO_CLAIM, pending_withdrawal_balance + current_withdrawal_batch);

    // Update bonded withdrawals
    balances.set(BONDED_WITHDRAWALS, bonded_withdrawals - current_withdrawal_batch);
  }

  async transition rebalance_redistribute(
    public validators: [address; 5],
    public transfer_amounts: [u64; 5]
  ) -> Future {
    // Transfer to each delegator and set validator
    let f0: Future = credits.aleo/transfer_public(delegator1.aleo, transfer_amounts[0u8]);
    let f1: Future = credits.aleo/transfer_public(delegator2.aleo, transfer_amounts[1u8]);
    let f2: Future = credits.aleo/transfer_public(delegator3.aleo, transfer_amounts[2u8]);
    let f3: Future = credits.aleo/transfer_public(delegator4.aleo, transfer_amounts[3u8]);
    let f4: Future = credits.aleo/transfer_public(delegator5.aleo, transfer_amounts[4u8]);

    let f5: Future = delegator1.aleo/set_validator(validators[0u8]);
    let f6: Future = delegator2.aleo/set_validator(validators[1u8]);
    let f7: Future = delegator3.aleo/set_validator(validators[2u8]);
    let f8: Future = delegator4.aleo/set_validator(validators[3u8]);
    let f9: Future = delegator5.aleo/set_validator(validators[4u8]);

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
    public validators: [address; 5],
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

    // TODO: Reset boost pool for each validator
    balances.set(BOOST_POOL, 0u64);

    // Check that the new validator set is correct
    let next_validator_set: [address; 5] = validator_set.get(1u8);
    validator_set.set(0u8, next_validator_set);
    validator_set.remove(1u8);
    for i: u8 in 0u8..5u8 {
      assert(validators[i] == next_validator_set[i]);
    }
    // Check that each validator has the correct portion of credits
    let total_credits: u64 = transfer_amounts[0u8] + transfer_amounts[1u8] + transfer_amounts[2u8] + transfer_amounts[3u8] + transfer_amounts[4u8];
    let total_credits_128: u128 = total_credits as u128;
    let validator1_portion: u128 = (transfer_amounts[0u8] as u128 * PRECISION_UNSIGNED) / total_credits_128;
    let validator2_portion: u128 = (transfer_amounts[1u8] as u128 * PRECISION_UNSIGNED) / total_credits_128;
    let validator3_portion: u128 = (transfer_amounts[2u8] as u128 * PRECISION_UNSIGNED) / total_credits_128;
    let validator4_portion: u128 = (transfer_amounts[3u8] as u128 * PRECISION_UNSIGNED) / total_credits_128;
    let validator5_portion: u128 = (transfer_amounts[4u8] as u128 * PRECISION_UNSIGNED) / total_credits_128;
    assert(validator1_portion == PORTION_1);
    assert(validator2_portion == PORTION_2);
    assert(validator3_portion == PORTION_3);
    assert(validator4_portion == PORTION_4);
    assert(validator5_portion == PORTION_5);

    // Check that there's still enough account balance left for pending withdrawals
    let account_balance: u64 = credits.aleo/account.get_or_use(pondo_core_protocol.aleo, 0u64);
    let pending_withdrawal_balance: u64 = balances.get_or_use(WITHDRAWALS_AVAILABLE_TO_CLAIM, 0u64);
    assert(account_balance >= pending_withdrawal_balance);

    // Update last rebalance epoch
    let current_epoch: u32 = block.height / BLOCKS_PER_EPOCH;
    last_rebalance_epoch.set(0u8, current_epoch);
  }
}
