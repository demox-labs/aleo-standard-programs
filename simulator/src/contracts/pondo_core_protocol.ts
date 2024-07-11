import { pondo_delegator5Program } from './pondo_delegator5';
import { pondo_delegator4Program } from './pondo_delegator4';
import { pondo_delegator3Program } from './pondo_delegator3';
import { pondo_delegator2Program } from './pondo_delegator2';
import { pondo_delegator1Program } from './pondo_delegator1';
import { pondo_tokenProgram } from './pondo_token';
import { pondo_staked_aleo_tokenProgram } from './pondo_staked_aleo_token';
import { pondo_oracleProgram } from './pondo_oracle';
import { multi_token_support_program_v1Program } from './multi_token_support_program_v1';
import { creditsProgram } from './credits';

import assert from 'assert';
// interfaces
export interface withdrawal_state {
  microcredits: bigint;
  claim_block: bigint;
}
export interface validator_state {
  validator: string;
  commission: bigint;
}
export interface validator_datum {
  delegator: string;
  validator: string;
  block_height: bigint;
  bonded_microcredits: bigint;
  microcredits_yield_per_epoch: bigint;
  commission: bigint;
  boost: bigint;
}
export interface unbond_state {
  microcredits: bigint;
  height: bigint;
}
export interface bond_state {
  validator: string;
  microcredits: bigint;
}
export class pondo_core_protocolProgram {
  signer: string = "not set";
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  withdrawal_batches: Map<bigint, bigint> = new Map();
  withdrawals: Map<string, withdrawal_state> = new Map();
  last_rebalance_epoch: Map<bigint, bigint> = new Map();
  owed_commission: Map<bigint, bigint> = new Map();
  balances: Map<bigint, bigint> = new Map();
  protocol_state: Map<bigint, bigint> = new Map();
  validator_set: Map<bigint, validator_state[]> = new Map();
  TERMINAL = BigInt("4");
  UNBONDING = BigInt("3");
  UNBOND_ALLOWED = BigInt("2");
  UNBOND_NOT_ALLOWED = BigInt("1");
  BOND_ALLOWED = BigInt("0");
  CLAIMABLE_WITHDRAWALS = BigInt("2");
  BONDED_WITHDRAWALS = BigInt("1");
  DELEGATED_BALANCE = BigInt("0");
  CREDITS_TOKEN_ID = "3443843282313283355522573239085696902919850365217539366784739393210722344986field";
  PALEO_TOKEN_ID = "1751493913335802797273486270793650302076377624243810059080883537084141842600field";
  MIN_LIQUIDITY_PERCENT = BigInt("50");
  MAX_LIQUIDITY = BigInt("1_000_000_000_000");
  WITHDRAW_FEE = BigInt("30");
  WITHDRAW_WAIT_MINIMUM = BigInt("43_200");
  PROTOCOL_FEE = BigInt("100");
  REBALANCE_PERIOD = BigInt("17_280");
  BLOCKS_PER_EPOCH = BigInt("120_960");
  PORTION_5 = BigInt("90");
  PORTION_4 = BigInt("120");
  PORTION_3 = BigInt("160");
  PORTION_2 = BigInt("260");
  PORTION_1 = BigInt("370");
  PRECISION_UNSIGNED = BigInt("1000");
  pondo_delegator5: pondo_delegator5Program;
  pondo_delegator4: pondo_delegator4Program;
  pondo_delegator3: pondo_delegator3Program;
  pondo_delegator2: pondo_delegator2Program;
  pondo_delegator1: pondo_delegator1Program;
  pondo_token: pondo_tokenProgram;
  pondo_staked_aleo_token: pondo_staked_aleo_tokenProgram;
  pondo_oracle: pondo_oracleProgram;
  multi_token_support_program_v1: multi_token_support_program_v1Program;
  credits: creditsProgram;
  constructor(
    // constructor args
    pondo_delegator5Contract: pondo_delegator5Program,
    pondo_delegator4Contract: pondo_delegator4Program,
    pondo_delegator3Contract: pondo_delegator3Program,
    pondo_delegator2Contract: pondo_delegator2Program,
    pondo_delegator1Contract: pondo_delegator1Program,
    pondo_tokenContract: pondo_tokenProgram,
    pondo_staked_aleo_tokenContract: pondo_staked_aleo_tokenProgram,
    pondo_oracleContract: pondo_oracleProgram,
    multi_token_support_program_v1Contract: multi_token_support_program_v1Program,
    creditsContract: creditsProgram,
  ) {
    // constructor body
    this.pondo_delegator5 = pondo_delegator5Contract;
    this.pondo_delegator4 = pondo_delegator4Contract;
    this.pondo_delegator3 = pondo_delegator3Contract;
    this.pondo_delegator2 = pondo_delegator2Contract;
    this.pondo_delegator1 = pondo_delegator1Contract;
    this.pondo_token = pondo_tokenContract;
    this.pondo_staked_aleo_token = pondo_staked_aleo_tokenContract;
    this.pondo_oracle = pondo_oracleContract;
    this.multi_token_support_program_v1 = multi_token_support_program_v1Contract;
    this.credits = creditsContract;
  }
      
  //program pondo_core_protocol.aleo {    
// The number of blocks in an epoch
    
    
    
// Keys for the balances metadata mapping
    
// Delegator states
    
// copied from credits.aleo, as structs are not importable
    
// copied from credits.aleo, as structs are not importable
    
// shadowed from pondo_oracle.aleo
    
    
// 0u8 -> the current validator set
// 1u8 -> the next validator set
    
// 0u8 -> current state of the protocol
// * 0u8 -> normal operation, post rebalance
// * 1u8 -> rebalancing in progress, all funds are in the core protocol
    
// Metadata mapping for the balances of ALEO held in the program
// 0u8 -> the last tracked balance of aleo bonded via the protocol (not including withdrawals)
// 1u8 -> the amount of credits that have been withdrawn but are still bonded via the protocol
// 2u8 -> the amount of credits that have been withdrawn and are reserved for withdrawals
    
// 0u8 -> the total amount of pALEO owed to the protocol, yet to be minted
    
// 0u8 -> the last epoch where a rebalance occured, zero-indexed (block.height / BLOCKS_PER_EPOCH)
// Updated after rebalancing at the start of each epoch
    
    
// address -> pending withdrawal for this address
// u32 -> batch number (batch height / BLOCKS_PER_EPOCH) -> total amount of aleo reserved for withdrawals in this batch
// withdrawals are processed at the start of the next epoch i.e. batch 0u32 is processed at the start of epoch 1u32
    
  initialize(
  ) {
// Initialize pALEO and PNDO tokens
    this.pondo_staked_aleo_token.caller = "pondo_core_protocol.aleo";
    this.pondo_staked_aleo_token.register_token();
    this.pondo_token.caller = "pondo_core_protocol.aleo";
    this.pondo_token.initialize_token();
    
// Initialize delegators
    this.pondo_delegator1.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator1.initialize();
    this.pondo_delegator2.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator2.initialize();
    this.pondo_delegator3.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator3.initialize();
    this.pondo_delegator4.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator4.initialize();
    this.pondo_delegator5.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator5.initialize();
    
    return this.finalize_initialize(      );
    }
    
  finalize_initialize(
  ) {
    
    
    
    
    
    
    
    
    this.balances.set(this.DELEGATED_BALANCE, BigInt("0"));
    this.balances.set(this.BONDED_WITHDRAWALS, BigInt("0"));
    this.balances.set(this.CLAIMABLE_WITHDRAWALS, BigInt("0"));
    this.owed_commission.set(BigInt("0"), BigInt("0"));
    this.protocol_state.set(BigInt("0"), BigInt("0"));
    
    let top_validators: string[] = this.pondo_oracle.top_validators.get(undefined) || undefined
    BigInt("0"),
    [
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
    ]
    );
    let default_datum: validator_datum = {
    delegator: "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    validator: "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    block_height: BigInt("0"),
    bonded_microcredits: BigInt("0"),
    microcredits_yield_per_epoch: BigInt("0"),
    commission: BigInt("0"),
    boost: BigInt("0")
    };
    let validator1_commission: bigint = this.pondo_oracle.validator_data.get(top_validators[0])!.commission;
    let validator2_commission: bigint = this.pondo_oracle.validator_data.get(top_validators[1])!.commission;
    let validator3_commission: bigint = this.pondo_oracle.validator_data.get(top_validators[2])!.commission;
    let validator4_commission: bigint = this.pondo_oracle.validator_data.get(top_validators[3])!.commission;
    let validator5_commission: bigint = this.pondo_oracle.validator_data.get(top_validators[4])!.commission;
    
    let next_validator_set: validator_state[] = [
    validator_state { validator: top_validators[0], commission: validator1_commission },
    validator_state { validator: top_validators[1], commission: validator2_commission },
    validator_state { validator: top_validators[2], commission: validator3_commission },
    validator_state { validator: top_validators[3], commission: validator4_commission },
    validator_state { validator: top_validators[4], commission: validator5_commission }
    ];
    this.validator_set.set(BigInt("1"), next_validator_set);
    }
    
// -------------------
// DEPOSIT FUNCTIONS
// -------------------
    
  deposit_public_as_signer(
    credits_deposit: bigint,
    expected_paleo_mint: bigint,
    referrer: string,
  ) {
// Transfer ALEO to pool
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public_as_signer("pondo_core_protocol.aleo", credits_deposit);
// Mint pALEO to depositor
    this.pondo_staked_aleo_token.caller = "pondo_core_protocol.aleo";
    this.pondo_staked_aleo_token.mint_public(expected_paleo_mint, this.signer);
    
    return this.finalize_deposit_public_as_signer(  credits_deposit, expected_paleo_mint, referrer);
    }
    
  finalize_deposit_public_as_signer(
    credits_deposit: bigint,
    expected_paleo_mint: bigint,
    referrer: string,
  ) {
    
    
    
    let base_bond_state: bond_state = {
    validator: "pondo_core_protocol.aleo",
    microcredits: BigInt("0")
    };
    let delegator1_bonded: bigint = this.credits.bonded.get("pondo_delegator1.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator2_bonded: bigint = this.credits.bonded.get("pondo_delegator2.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator3_bonded: bigint = this.credits.bonded.get("pondo_delegator3.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator4_bonded: bigint = this.credits.bonded.get("pondo_delegator4.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator5_bonded: bigint = this.credits.bonded.get("pondo_delegator5.aleo")?.microcredits || base_bond_state?.microcredits;
    
    let base_unbond_state: unbond_state = {
    microcredits: BigInt("0"),
    height: BigInt("0")
    };
    let delegator1_unbonding: bigint = this.credits.unbonding.get("pondo_delegator1.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator2_unbonding: bigint = this.credits.unbonding.get("pondo_delegator2.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator3_unbonding: bigint = this.credits.unbonding.get("pondo_delegator3.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator4_unbonding: bigint = this.credits.unbonding.get("pondo_delegator4.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator5_unbonding: bigint = this.credits.unbonding.get("pondo_delegator5.aleo")?.microcredits || base_unbond_state?.microcredits;
    
    let delegator1_account: bigint = this.credits.account.get("pondo_delegator1.aleo") || BigInt("0");
    let delegator2_account: bigint = this.credits.account.get("pondo_delegator2.aleo") || BigInt("0");
    let delegator3_account: bigint = this.credits.account.get("pondo_delegator3.aleo") || BigInt("0");
    let delegator4_account: bigint = this.credits.account.get("pondo_delegator4.aleo") || BigInt("0");
    let delegator5_account: bigint = this.credits.account.get("pondo_delegator5.aleo") || BigInt("0");
    
    let total_bonded: bigint = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: bigint = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let total_unbonding: bigint = delegator1_unbonding + delegator2_unbonding + delegator3_unbonding + delegator4_unbonding + delegator5_unbonding;
    let bonded_withdrawals: bigint = this.balances.get(this.BONDED_WITHDRAWALS)!;
    let total_delegated: bigint = total_bonded + total_account + total_unbonding - bonded_withdrawals;
    
    let currently_delegated: bigint = this.balances.get(this.DELEGATED_BALANCE)!;
    let current_owed_commission: bigint = this.owed_commission.get(BigInt("0"))!;
    let total_paleo_minted: bigint = this.multi_token_support_program_v1.registered_tokens.get(this.PALEO_TOKEN_ID)!.supply + current_owed_commission;
    
    let rewards: bigint = total_delegated > currently_delegated ? total_delegated - currently_delegated : BigInt("0");
    let new_commission: bigint = this.inline_get_commission(rewards, this.PROTOCOL_FEE);
    currently_delegated += rewards - new_commission;
    
    let core_protocol_account: bigint = this.credits.account.get("pondo_core_protocol.aleo") || BigInt("0");
    let reserved_for_withdrawal: bigint = this.balances.get(this.CLAIMABLE_WITHDRAWALS)!;
    let current_state: bigint = this.protocol_state.get(BigInt("0"))!;
    let deposit_pool: bigint = current_state == BigInt("0")
    ? core_protocol_account - credits_deposit - reserved_for_withdrawal
    : core_protocol_account - currently_delegated - credits_deposit - reserved_for_withdrawal; // if the protocol is rebalancing, the full balance is in the account
    let new_commission_paleo: bigint = this.inline_calculate_new_paleo(currently_delegated, deposit_pool, new_commission, total_paleo_minted);
    this.owed_commission.set(BigInt("0"), current_owed_commission + new_commission_paleo);
    
    total_paleo_minted += new_commission_paleo;
    currently_delegated += new_commission;
// Update bonded pool balance with latest rewards
    this.balances.set(this.DELEGATED_BALANCE, currently_delegated);
    
// Calculate mint for deposit
    let paleo_for_deposit: bigint = this.inline_calculate_new_paleo(currently_delegated, deposit_pool, credits_deposit, total_paleo_minted);
    assert(paleo_for_deposit >= BigInt("1"));
    assert(paleo_for_deposit >= expected_paleo_mint);
    }
    
  inline_get_commission(
    rewards: bigint,
    commission_rate: bigint,
  ) {
    let commission: bigint = rewards * commission_rate / this.PRECISION_UNSIGNED;
    let commission_64: bigint = commission;
    return commission_64;
    }
    
  inline_calculate_new_paleo(
    bonded_balance: bigint,
    existing_deposit_pool: bigint,
    deposit: bigint,
    paleo: bigint,
  ) {
    let full_balance: bigint = bonded_balance + existing_deposit_pool;
    let new_total_paleo: bigint = (paleo * (full_balance + deposit)) / full_balance;
    let diff: bigint = new_total_paleo - paleo;
    let paleo_to_mint: bigint = diff;
    return paleo_to_mint;
    }
    
// Note: requires the caller to create an allowance for the contract first
  deposit_public(
    credits_deposit: bigint,
    expected_paleo_mint: bigint,
    referrer: string,
  ) {
// Transfer ALEO to pool
    this.multi_token_support_program_v1.caller = "pondo_core_protocol.aleo";
    this.multi_token_support_program_v1.transfer_from_public(this.CREDITS_TOKEN_ID, this.caller, "pondo_core_protocol.aleo", credits_deposit);
// Mint pALEO to depositor
    this.pondo_staked_aleo_token.caller = "pondo_core_protocol.aleo";
    this.pondo_staked_aleo_token.mint_public(expected_paleo_mint, this.caller);
    
    return this.finalize_deposit_public(  credits_deposit, expected_paleo_mint, referrer);
    }
    
  finalize_deposit_public(
    credits_deposit: bigint,
    expected_paleo_mint: bigint,
    referrer: string,
  ) {
    
    
    
    let base_bond_state: bond_state = {
    validator: "pondo_core_protocol.aleo",
    microcredits: BigInt("0")
    };
    let delegator1_bonded: bigint = this.credits.bonded.get("pondo_delegator1.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator2_bonded: bigint = this.credits.bonded.get("pondo_delegator2.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator3_bonded: bigint = this.credits.bonded.get("pondo_delegator3.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator4_bonded: bigint = this.credits.bonded.get("pondo_delegator4.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator5_bonded: bigint = this.credits.bonded.get("pondo_delegator5.aleo")?.microcredits || base_bond_state?.microcredits;
    
    let base_unbond_state: unbond_state = {
    microcredits: BigInt("0"),
    height: BigInt("0")
    };
    let delegator1_unbonding: bigint = this.credits.unbonding.get("pondo_delegator1.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator2_unbonding: bigint = this.credits.unbonding.get("pondo_delegator2.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator3_unbonding: bigint = this.credits.unbonding.get("pondo_delegator3.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator4_unbonding: bigint = this.credits.unbonding.get("pondo_delegator4.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator5_unbonding: bigint = this.credits.unbonding.get("pondo_delegator5.aleo")?.microcredits || base_unbond_state?.microcredits;
    
    let delegator1_account: bigint = this.credits.account.get("pondo_delegator1.aleo") || BigInt("0");
    let delegator2_account: bigint = this.credits.account.get("pondo_delegator2.aleo") || BigInt("0");
    let delegator3_account: bigint = this.credits.account.get("pondo_delegator3.aleo") || BigInt("0");
    let delegator4_account: bigint = this.credits.account.get("pondo_delegator4.aleo") || BigInt("0");
    let delegator5_account: bigint = this.credits.account.get("pondo_delegator5.aleo") || BigInt("0");
    
    let total_bonded: bigint = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: bigint = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let total_unbonding: bigint = delegator1_unbonding + delegator2_unbonding + delegator3_unbonding + delegator4_unbonding + delegator5_unbonding;
    let bonded_withdrawals: bigint = this.balances.get(this.BONDED_WITHDRAWALS)!;
    let total_delegated: bigint = total_bonded + total_account + total_unbonding - bonded_withdrawals;
    
    let currently_delegated: bigint = this.balances.get(this.DELEGATED_BALANCE)!;
    let current_owed_commission: bigint = this.owed_commission.get(BigInt("0"))!;
    let total_paleo_minted: bigint = this.multi_token_support_program_v1.registered_tokens.get(this.PALEO_TOKEN_ID)!.supply + current_owed_commission;
    
    let rewards: bigint = total_delegated > currently_delegated ? total_delegated - currently_delegated : BigInt("0");
    let new_commission: bigint = this.inline_get_commission(rewards, this.PROTOCOL_FEE);
    currently_delegated += rewards - new_commission;
    
    let core_protocol_account: bigint = this.credits.account.get("pondo_core_protocol.aleo") || BigInt("0");
    let reserved_for_withdrawal: bigint = this.balances.get(this.CLAIMABLE_WITHDRAWALS)!;
    let current_state: bigint = this.protocol_state.get(BigInt("0"))!;
    let deposit_pool: bigint = current_state == BigInt("0")
    ? core_protocol_account - credits_deposit - reserved_for_withdrawal
    : core_protocol_account - currently_delegated - reserved_for_withdrawal - credits_deposit; // if the protocol is rebalancing, the full balance is in the account
    let new_commission_paleo: bigint = this.inline_calculate_new_paleo(currently_delegated, deposit_pool, new_commission, total_paleo_minted);
    this.owed_commission.set(BigInt("0"), current_owed_commission + new_commission_paleo);
    
    total_paleo_minted += new_commission_paleo;
    currently_delegated += new_commission;
// Update bonded pool balance with latest rewards
    this.balances.set(this.DELEGATED_BALANCE, currently_delegated);
    
// Calculate mint for deposit
    let paleo_for_deposit: bigint = this.inline_calculate_new_paleo(currently_delegated, deposit_pool, credits_deposit, total_paleo_minted);
    assert(paleo_for_deposit >= BigInt("1"));
    assert(paleo_for_deposit >= expected_paleo_mint);
    }
    
  distribute_deposits(
    validators: string[],
    transfer_amounts: bigint[],
  ) {
// Transfer to each delegator
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public("pondo_delegator1.aleo", transfer_amounts[0]);
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public("pondo_delegator2.aleo", transfer_amounts[1]);
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public("pondo_delegator3.aleo", transfer_amounts[2]);
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public("pondo_delegator4.aleo", transfer_amounts[3]);
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public("pondo_delegator5.aleo", transfer_amounts[4]);
    
    return this.finalize_distribute_deposits(     validators, transfer_amounts);
    }
    
  finalize_distribute_deposits(
    validators: string[],
    transfer_amounts: bigint[],
  ) {
    
    
    
    
    
    
// Confirm that there are enough credits left for the liquidity pool
    let currently_delegated: bigint = this.balances.get(this.DELEGATED_BALANCE)!;
    let account_balance: bigint = this.credits.account.get("pondo_core_protocol.aleo") || BigInt("0");
    let reserved_for_withdrawal: bigint = this.balances.get(this.CLAIMABLE_WITHDRAWALS)!;
    let liquidity_pool: bigint = account_balance - reserved_for_withdrawal;
    let optimal_liquidity: bigint = this.inline_calculate_optimal_liquidity(currently_delegated);
    assert(liquidity_pool >= optimal_liquidity);
    
// Confirm each delegator is already bonded and in the correct state
    let delegator1_state: bigint = this.pondo_delegator1.state_mapping.get(BigInt("0"))!;
    let delegator2_state: bigint = this.pondo_delegator2.state_mapping.get(BigInt("0"))!;
    let delegator3_state: bigint = this.pondo_delegator3.state_mapping.get(BigInt("0"))!;
    let delegator4_state: bigint = this.pondo_delegator4.state_mapping.get(BigInt("0"))!;
    let delegator5_state: bigint = this.pondo_delegator5.state_mapping.get(BigInt("0"))!;
    assert(delegator1_state == this.BOND_ALLOWED || delegator1_state == this.UNBOND_NOT_ALLOWED);
    assert(delegator2_state == this.BOND_ALLOWED || delegator2_state == this.UNBOND_NOT_ALLOWED);
    assert(delegator3_state == this.BOND_ALLOWED || delegator3_state == this.UNBOND_NOT_ALLOWED);
    assert(delegator4_state == this.BOND_ALLOWED || delegator4_state == this.UNBOND_NOT_ALLOWED);
    assert(delegator5_state == this.BOND_ALLOWED || delegator5_state == this.UNBOND_NOT_ALLOWED);
    }
    
  inline_calculate_optimal_liquidity(
    total_balance: bigint,
  ) {
    let min_liquidity: bigint = total_balance * this.MIN_LIQUIDITY_PERCENT / this.PRECISION_UNSIGNED;
    let optimal_liquidity: bigint = min_liquidity > this.MAX_LIQUIDITY ? this.MAX_LIQUIDITY : min_liquidity;
    return optimal_liquidity;
    }
    
// -------------------
// WITHDRAW FUNCTIONS
// -------------------
    
  instant_withdraw_public(
    paleo_burn_amount: bigint,
    withdrawal_credits: bigint,
  ) {
// Burn pALEO for withdrawal
    this.pondo_staked_aleo_token.caller = "pondo_core_protocol.aleo";
    this.pondo_staked_aleo_token.burn_public(paleo_burn_amount, this.caller);
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public(this.caller, withdrawal_credits);
    
    return this.finalize_instant_withdraw_public(  paleo_burn_amount, withdrawal_credits, this.caller);
    }
    
  finalize_instant_withdraw_public(
    paleo_burn_amount: bigint,
    withdrawal_credits: bigint,
    caller: string,
  ) {
    
    
    
// Block instant withdrawals during a rebalance
    let current_state: bigint = this.protocol_state.get(BigInt("0"))!;
    assert(current_state == BigInt("0"));
    
// Assert that the caller does not have a pending withdrawal
    let has_withdrawal: boolean = this.withdrawals.has(caller);
    assert(!has_withdrawal);
    
// Calculate new delegated balance
    let base_bond_state: bond_state = {
    validator: "pondo_core_protocol.aleo",
    microcredits: BigInt("0")
    };
    let delegator1_bonded: bigint = this.credits.bonded.get("pondo_delegator1.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator2_bonded: bigint = this.credits.bonded.get("pondo_delegator2.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator3_bonded: bigint = this.credits.bonded.get("pondo_delegator3.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator4_bonded: bigint = this.credits.bonded.get("pondo_delegator4.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator5_bonded: bigint = this.credits.bonded.get("pondo_delegator5.aleo")?.microcredits || base_bond_state?.microcredits;
    
    let base_unbond_state: unbond_state = {
    microcredits: BigInt("0"),
    height: BigInt("0")
    };
    let delegator1_unbonding: bigint = this.credits.unbonding.get("pondo_delegator1.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator2_unbonding: bigint = this.credits.unbonding.get("pondo_delegator2.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator3_unbonding: bigint = this.credits.unbonding.get("pondo_delegator3.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator4_unbonding: bigint = this.credits.unbonding.get("pondo_delegator4.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator5_unbonding: bigint = this.credits.unbonding.get("pondo_delegator5.aleo")?.microcredits || base_unbond_state?.microcredits;
    
    let delegator1_account: bigint = this.credits.account.get("pondo_delegator1.aleo") || BigInt("0");
    let delegator2_account: bigint = this.credits.account.get("pondo_delegator2.aleo") || BigInt("0");
    let delegator3_account: bigint = this.credits.account.get("pondo_delegator3.aleo") || BigInt("0");
    let delegator4_account: bigint = this.credits.account.get("pondo_delegator4.aleo") || BigInt("0");
    let delegator5_account: bigint = this.credits.account.get("pondo_delegator5.aleo") || BigInt("0");
    
    let total_bonded: bigint = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: bigint = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let total_unbonding: bigint = delegator1_unbonding + delegator2_unbonding + delegator3_unbonding + delegator4_unbonding + delegator5_unbonding;
    let bonded_withdrawals: bigint = this.balances.get(this.BONDED_WITHDRAWALS)!;
// Total delegated is all credits that have been sent to delegators, less any that have been withdrawn but are still bonded
    let total_delegated: bigint = total_bonded + total_account + total_unbonding - bonded_withdrawals;
    
// Currently delegated is all credits that have been sent to delegators, less withdrawals,
// and without any rewards that have been earned since the update
    let currently_delegated: bigint = this.balances.get(this.DELEGATED_BALANCE)!;
    let current_owed_commission: bigint = this.owed_commission.get(BigInt("0"))!;
    let paleo_minted_post_burn: bigint = this.multi_token_support_program_v1.registered_tokens.get(this.PALEO_TOKEN_ID)!.supply + current_owed_commission;
    let total_paleo_minted: bigint = paleo_minted_post_burn + paleo_burn_amount;
    
    let rewards: bigint = total_delegated > currently_delegated ? total_delegated - currently_delegated : BigInt("0");
    let new_commission: bigint = this.inline_get_commission(rewards, this.PROTOCOL_FEE);
    currently_delegated += rewards - new_commission;
    
    let core_protocol_account: bigint = this.credits.account.get("pondo_core_protocol.aleo") || BigInt("0");
    let reserved_for_withdrawal: bigint = this.balances.get(this.CLAIMABLE_WITHDRAWALS)!;
    let deposit_pool: bigint = core_protocol_account - reserved_for_withdrawal + withdrawal_credits;
// Update owed commission balance
    let new_commission_paleo: bigint = this.inline_calculate_new_paleo(currently_delegated, deposit_pool, new_commission, total_paleo_minted);
    current_owed_commission += new_commission_paleo;
    total_paleo_minted += new_commission_paleo;
    currently_delegated += new_commission;
    
// Calculate full pool size
    let full_pool: bigint = currently_delegated + deposit_pool;
    
// Calculate credits value of burned pALEO
    let withdrawal_fee: bigint = this.inline_calculate_withdraw_fee(paleo_burn_amount);
    let net_burn_amount: bigint = paleo_burn_amount - withdrawal_fee;
    let withdrawal_calculation: bigint = (net_burn_amount * full_pool) / total_paleo_minted;
// Assert that the withdrawal amount was at most the calculated amount
    assert(withdrawal_credits <= withdrawal_calculation);
    
// Update owed commission to reflect withdrawal fee
    this.owed_commission.set(BigInt("0"), current_owed_commission + withdrawal_fee);
    }
    
  inline_calculate_withdraw_fee(
    paleo_burn_amount: bigint,
  ) {
    let fee_calc: bigint = paleo_burn_amount * this.WITHDRAW_FEE / this.PRECISION_UNSIGNED;
    let fee: bigint = fee_calc;
    return fee;
    }
    
  withdraw_public(
    paleo_burn_amount: bigint,
  ) {
// Burn pALEO for withdrawal
    this.pondo_staked_aleo_token.caller = "pondo_core_protocol.aleo";
    this.pondo_staked_aleo_token.burn_public(paleo_burn_amount, this.caller);
    return this.finalize_withdraw_public( paleo_burn_amount, this.caller);
    }
    
  finalize_withdraw_public(
    paleo_burn_amount: bigint,
    caller: string,
  ) {
    
    
// Assert that the caller does not have a pending withdrawal
    let has_withdrawal: boolean = this.withdrawals.has(caller);
    assert(!has_withdrawal);
    
// Calculate commission owed
    let base_bond_state: bond_state = {
    validator: "pondo_core_protocol.aleo",
    microcredits: BigInt("0")
    };
    let delegator1_bonded: bigint = this.credits.bonded.get("pondo_delegator1.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator2_bonded: bigint = this.credits.bonded.get("pondo_delegator2.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator3_bonded: bigint = this.credits.bonded.get("pondo_delegator3.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator4_bonded: bigint = this.credits.bonded.get("pondo_delegator4.aleo")?.microcredits || base_bond_state?.microcredits;
    let delegator5_bonded: bigint = this.credits.bonded.get("pondo_delegator5.aleo")?.microcredits || base_bond_state?.microcredits;
    
    let base_unbond_state: unbond_state = {
    microcredits: BigInt("0"),
    height: BigInt("0")
    };
    let delegator1_unbonding: bigint = this.credits.unbonding.get("pondo_delegator1.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator2_unbonding: bigint = this.credits.unbonding.get("pondo_delegator2.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator3_unbonding: bigint = this.credits.unbonding.get("pondo_delegator3.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator4_unbonding: bigint = this.credits.unbonding.get("pondo_delegator4.aleo")?.microcredits || base_unbond_state?.microcredits;
    let delegator5_unbonding: bigint = this.credits.unbonding.get("pondo_delegator5.aleo")?.microcredits || base_unbond_state?.microcredits;
    
    let delegator1_account: bigint = this.credits.account.get("pondo_delegator1.aleo") || BigInt("0");
    let delegator2_account: bigint = this.credits.account.get("pondo_delegator2.aleo") || BigInt("0");
    let delegator3_account: bigint = this.credits.account.get("pondo_delegator3.aleo") || BigInt("0");
    let delegator4_account: bigint = this.credits.account.get("pondo_delegator4.aleo") || BigInt("0");
    let delegator5_account: bigint = this.credits.account.get("pondo_delegator5.aleo") || BigInt("0");
    
    let total_bonded: bigint = delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded;
    let total_account: bigint = delegator1_account + delegator2_account + delegator3_account + delegator4_account + delegator5_account;
    let total_unbonding: bigint = delegator1_unbonding + delegator2_unbonding + delegator3_unbonding + delegator4_unbonding + delegator5_unbonding;
    let bonded_withdrawals: bigint = this.balances.get(this.BONDED_WITHDRAWALS)!;
// Total delegated is all credits that have been sent to delegators, less any that have been withdrawn but are still bonded
    let total_delegated: bigint = total_bonded + total_account + total_unbonding - bonded_withdrawals;
    
// Currently delegated is all credits that have been sent to delegators, less withdrawals,
// and without any rewards that have been earned since the update
    let currently_delegated: bigint = this.balances.get(this.DELEGATED_BALANCE)!;
    let current_owed_commission: bigint = this.owed_commission.get(BigInt("0"))!;
    let paleo_minted_post_burn: bigint = this.multi_token_support_program_v1.registered_tokens.get(this.PALEO_TOKEN_ID)!.supply + current_owed_commission;
    let total_paleo_minted: bigint = paleo_minted_post_burn + paleo_burn_amount;
    
    let rewards: bigint = total_delegated > currently_delegated ? total_delegated - currently_delegated : BigInt("0");
    let new_commission: bigint = this.inline_get_commission(rewards, this.PROTOCOL_FEE);
    currently_delegated += rewards - new_commission;
    
    let core_protocol_account: bigint = this.credits.account.get("pondo_core_protocol.aleo") || BigInt("0");
    let reserved_for_withdrawal: bigint = this.balances.get(this.CLAIMABLE_WITHDRAWALS)!;
    let current_state: bigint = this.protocol_state.get(BigInt("0"))!;
    let deposit_pool: bigint = current_state == BigInt("0")
    ? core_protocol_account - reserved_for_withdrawal
    : core_protocol_account - currently_delegated - reserved_for_withdrawal; // if the protocol is rebalancing, the full balance is in the account
// Update owed commission balance
    let new_commission_paleo: bigint = this.inline_calculate_new_paleo(currently_delegated, deposit_pool, new_commission, total_paleo_minted);
    this.owed_commission.set(BigInt("0"), current_owed_commission + new_commission_paleo);
    total_paleo_minted += new_commission_paleo;
    currently_delegated += new_commission;
    
// Calculate full pool size
    let full_pool: bigint = currently_delegated + deposit_pool;
    
// Calculate credits value of burned pALEO
    let withdrawal_calculation: bigint = (paleo_burn_amount * full_pool) / total_paleo_minted;
    let withdrawal: bigint = withdrawal_calculation;
    
// Update bonded withdrawals
    this.balances.set(this.BONDED_WITHDRAWALS, bonded_withdrawals + withdrawal);
    
// Update total balance to reflect withdrawal
    this.balances.set(this.DELEGATED_BALANCE, currently_delegated - withdrawal);
    
// Create withdrawal for caller in next batch
    let batch_height: bigint[] = this.inline_get_withdrawal_batch(this.block.height);
    let withdrawal_state_value: withdrawal_state = {
    microcredits: withdrawal,
    claim_block: batch_height[1]
    };
    this.withdrawals.set(caller, withdrawal_state_value);
// Update total for batch
    let batch_total: bigint = this.withdrawal_batches.get(batch_height[0]) || BigInt("0");
    this.withdrawal_batches.set(batch_height[0], batch_total + withdrawal);
    }
    
  inline_get_withdrawal_batch(
    height: bigint,
  ) {
    let min_block_height: bigint = height + this.WITHDRAW_WAIT_MINIMUM;
    let withdrawal_batch: bigint = min_block_height / this.BLOCKS_PER_EPOCH;
// Withdrawals are processed at the start of the next epoch
    let claim_block: bigint = (withdrawal_batch + BigInt("1")) * this.BLOCKS_PER_EPOCH + this.REBALANCE_PERIOD + BigInt("1");
    
    return [withdrawal_batch, claim_block];
    }
    
  claim_withdrawal_public(
    owner: string,
    amount: bigint,
  ) {
// Transfer to the owner
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public(owner, amount);
    
    return this.finalize_claim_withdrawal_public( owner, amount);
    }
    
  finalize_claim_withdrawal_public(
    owner: string,
    amount: bigint,
  ) {
    
    
// Update withdrawal state
    let withdrawal: withdrawal_state = this.withdrawals.get(owner)!;
    assert(withdrawal.claim_block < this.block.height);
    
// Update withrawal mapping
    if (withdrawal.microcredits == amount) {
    this.withdrawals.delete(owner);
    } else {
    let new_withdrawal: withdrawal_state = {
    microcredits: withdrawal.microcredits - amount,
    claim_block: withdrawal.claim_block
    };
    this.withdrawals.set(owner, new_withdrawal);
    }
    
// Update balance reserved for withdrawal
    let reserved_for_withdrawal: bigint = this.balances.get(this.CLAIMABLE_WITHDRAWALS)!;
    this.balances.set(this.CLAIMABLE_WITHDRAWALS, reserved_for_withdrawal - amount);
    }
    
// -------------------
// REBALANCING FUNCTIONS
// -------------------
    
  prep_rebalance(
  ) {
    this.pondo_delegator1.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator1.set_state(this.UNBOND_ALLOWED);
    this.pondo_delegator2.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator2.set_state(this.UNBOND_ALLOWED);
    this.pondo_delegator3.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator3.set_state(this.UNBOND_ALLOWED);
    this.pondo_delegator4.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator4.set_state(this.UNBOND_ALLOWED);
    this.pondo_delegator5.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator5.set_state(this.UNBOND_ALLOWED);
    
    return this.finalize_prep_rebalance(    );
    }
    
  finalize_prep_rebalance(
  ) {
    
    
    
    
    
    
// Confirm that rebalancing is allowed
// Rebalance is allowed during the first day of a new epoch
    let current_epoch: bigint = this.block.height / this.BLOCKS_PER_EPOCH;
    let last_rebalance: bigint = this.last_rebalance_epoch.get(BigInt("0")) || BigInt("4294967295");
    assert(current_epoch > last_rebalance);
    let blocks_into_epoch: bigint = this.block.height % this.BLOCKS_PER_EPOCH;
    assert(blocks_into_epoch < this.REBALANCE_PERIOD || last_rebalance == BigInt("4294967295"));
    
    let top_validators: string[] = this.pondo_oracle.top_validators.get(undefined) || undefined
    BigInt("0"),
    [
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
    ]
    );
    let default_datum: validator_datum = {
    delegator: "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    validator: "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
    block_height: BigInt("0"),
    bonded_microcredits: BigInt("0"),
    microcredits_yield_per_epoch: BigInt("0"),
    commission: BigInt("0"),
    boost: BigInt("0")
    };
    let validator1_commission: bigint = this.pondo_oracle.validator_data.get(top_validators[0])!.commission;
    let validator2_commission: bigint = this.pondo_oracle.validator_data.get(top_validators[1])!.commission;
    let validator3_commission: bigint = this.pondo_oracle.validator_data.get(top_validators[2])!.commission;
    let validator4_commission: bigint = this.pondo_oracle.validator_data.get(top_validators[3])!.commission;
    let validator5_commission: bigint = this.pondo_oracle.validator_data.get(top_validators[4])!.commission;
    
    let next_validator_set: validator_state[] = [
    validator_state { validator: top_validators[0], commission: validator1_commission },
    validator_state { validator: top_validators[1], commission: validator2_commission },
    validator_state { validator: top_validators[2], commission: validator3_commission },
    validator_state { validator: top_validators[3], commission: validator4_commission },
    validator_state { validator: top_validators[4], commission: validator5_commission }
    ];
    this.validator_set.set(BigInt("1"), next_validator_set);
    }
    
  rebalance_retrieve_credits(
    transfer_amounts: bigint[],
    commission_mint: bigint,
  ) {
    this.pondo_delegator1.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator1.transfer_to_core_protocol(transfer_amounts[0]);
    this.pondo_delegator2.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator2.transfer_to_core_protocol(transfer_amounts[1]);
    this.pondo_delegator3.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator3.transfer_to_core_protocol(transfer_amounts[2]);
    this.pondo_delegator4.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator4.transfer_to_core_protocol(transfer_amounts[3]);
    this.pondo_delegator5.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator5.transfer_to_core_protocol(transfer_amounts[4]);
    this.pondo_staked_aleo_token.caller = "pondo_core_protocol.aleo";
    this.pondo_staked_aleo_token.mint_public(commission_mint, "pondo_token.aleo");
    
    return this.finalize_rebalance_retrieve_credits(      transfer_amounts, commission_mint);
    }
    
  finalize_rebalance_retrieve_credits(
    transfer_amounts: bigint[],
    commission_mint: bigint,
  ) {
    
    
    
    
    
    
    
    let full_balance: bigint = transfer_amounts[0] + transfer_amounts[1] + transfer_amounts[2] + transfer_amounts[3] + transfer_amounts[4];
    let current_balance: bigint = this.balances.get(this.DELEGATED_BALANCE)!;
    
    let current_owed_commission: bigint = this.owed_commission.get(BigInt("0"))!;
// Total pALEO minted, including owed commission, minus the commission minted in the transition
    let total_paleo_minted: bigint = this.multi_token_support_program_v1.registered_tokens.get(this.PALEO_TOKEN_ID)!.supply + current_owed_commission - commission_mint;
    
    let rewards: bigint = full_balance > current_balance ? full_balance - current_balance : BigInt("0");
    let new_commission: bigint = this.inline_get_commission(rewards, this.PROTOCOL_FEE);
    current_balance += rewards - new_commission;
    
// Update balances and owed commission
// At this point, all credits have been transferred to the core protocol, but there may still be commission owed
    let core_protocol_account: bigint = this.credits.account.get("pondo_core_protocol.aleo") || BigInt("0");
    let reserved_for_withdrawal: bigint = this.balances.get(this.CLAIMABLE_WITHDRAWALS)!;
    let deposit_pool: bigint = core_protocol_account - full_balance - reserved_for_withdrawal;
    
    let new_commission_paleo: bigint = this.inline_calculate_new_paleo(current_balance, deposit_pool, new_commission, total_paleo_minted);
// New owed commission is whatever commission is left after the new commission mint, plus what we may have earned between calling the function and now
    this.owed_commission.set(BigInt("0"), current_owed_commission + new_commission_paleo - commission_mint);
// Update total balance
    this.balances.set(this.DELEGATED_BALANCE, current_balance + new_commission);
    
// Move bonded withdrawals to available to claim
    let current_epoch: bigint = this.block.height / this.BLOCKS_PER_EPOCH;
//  Process withdrawals from the previous epoch
    let current_withdrawal_batch: bigint = this.withdrawal_batches.get(current_epoch - BigInt("1")) || BigInt("0");
    this.balances.set(this.CLAIMABLE_WITHDRAWALS, reserved_for_withdrawal + current_withdrawal_batch);
    
// Update bonded withdrawals
    let bonded_withdrawals: bigint = this.balances.get(this.BONDED_WITHDRAWALS)!;
    this.balances.set(this.BONDED_WITHDRAWALS, bonded_withdrawals - current_withdrawal_batch);
    
// Update protocol state
    this.protocol_state.set(BigInt("0"), BigInt("1"));
    }
    
  rebalance_redistribute(
    validators: validator_state[],
    transfer_amounts: bigint[],
  ) {
// Transfer to each delegator and set validator
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public("pondo_delegator1.aleo", transfer_amounts[0]);
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public("pondo_delegator2.aleo", transfer_amounts[1]);
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public("pondo_delegator3.aleo", transfer_amounts[2]);
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public("pondo_delegator4.aleo", transfer_amounts[3]);
    this.credits.caller = "pondo_core_protocol.aleo";
    this.credits.transfer_public("pondo_delegator5.aleo", transfer_amounts[4]);
    
    this.pondo_delegator1.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator1.set_validator(validators[0].validator, validators[0].commission);
    this.pondo_delegator2.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator2.set_validator(validators[1].validator, validators[1].commission);
    this.pondo_delegator3.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator3.set_validator(validators[2].validator, validators[2].commission);
    this.pondo_delegator4.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator4.set_validator(validators[3].validator, validators[3].commission);
    this.pondo_delegator5.caller = "pondo_core_protocol.aleo";
    this.pondo_delegator5.set_validator(validators[4].validator, validators[4].commission);
    
    return this.finalize_rebalance_redistribute(          validators, transfer_amounts);
    }
    
  finalize_rebalance_redistribute(
    validators: validator_state[],
    transfer_amounts: bigint[],
  ) {
    
    
    
    
    
    
    
    
    
    
    
// Check that the new validator set is correct
    let next_validator_set: validator_state[] = this.validator_set.get(BigInt("1"))!;
    this.validator_set.set(BigInt("0"), next_validator_set);
    this.validator_set.delete(BigInt("1"));
    for (let i: number = 0; i < 5; i++) {
    assert(validators[i] == next_validator_set[i]);
    }
// Check that each validator has the correct portion of credits
    let delegator_allocation: bigint[] = this.pondo_oracle.delegator_allocation.get(undefined) || undefinedBigInt("0"), [
    this.PORTION_1,
    this.PORTION_2,
    this.PORTION_3,
    this.PORTION_4,
    this.PORTION_5,
    this.PORTION_5,
    this.PORTION_5,
    this.PORTION_5,
    this.PORTION_5,
    this.PORTION_5
    ]);
    let total_credits: bigint = transfer_amounts[0] + transfer_amounts[1] + transfer_amounts[2] + transfer_amounts[3] + transfer_amounts[4];
    let total_credits_128: bigint = total_credits;
    let validator1_portion: bigint = (transfer_amounts[0] * this.PRECISION_UNSIGNED) / total_credits_128;
    let validator2_portion: bigint = (transfer_amounts[1] * this.PRECISION_UNSIGNED) / total_credits_128;
    let validator3_portion: bigint = (transfer_amounts[2] * this.PRECISION_UNSIGNED) / total_credits_128;
    let validator4_portion: bigint = (transfer_amounts[3] * this.PRECISION_UNSIGNED) / total_credits_128;
    let validator5_portion: bigint = (transfer_amounts[4] * this.PRECISION_UNSIGNED) / total_credits_128;
    assert(validator1_portion == delegator_allocation[0]);
    assert(validator2_portion == delegator_allocation[1]);
    assert(validator3_portion == delegator_allocation[2]);
    assert(validator4_portion == delegator_allocation[3]);
    assert(validator5_portion == delegator_allocation[4]);
    
// Check that there's still enough account balance left for pending withdrawals
    let account_balance: bigint = this.credits.account.get("pondo_core_protocol.aleo") || BigInt("0");
    let reserved_for_withdrawal: bigint = this.balances.get(this.CLAIMABLE_WITHDRAWALS)!;
    let liquidity_pool: bigint = account_balance - reserved_for_withdrawal;
    let optimal_liquidity: bigint = this.inline_calculate_optimal_liquidity(total_credits_128);
    assert(liquidity_pool >= optimal_liquidity);
    
// Update last rebalance epoch
    let current_epoch: bigint = this.block.height / this.BLOCKS_PER_EPOCH;
    this.last_rebalance_epoch.set(BigInt("0"), current_epoch);
    
// Update protocol state
    this.protocol_state.set(BigInt("0"), BigInt("0"));
    }
    
// A crank to set the oracle tvl
  set_oracle_tvl(
    tvl: bigint,
  ) {
    this.pondo_oracle.caller = "pondo_core_protocol.aleo";
    this.pondo_oracle.set_pondo_tvl(tvl);
    return this.finalize_set_oracle_tvl( tvl);
    }
    
  finalize_set_oracle_tvl(
    tvl: bigint,
  ) {
    
    
// Ensure the tvl matches what exists in the core protocol
// Get all of the delegator balances
    let delegator1_balance: bigint = this.credits.account.get("pondo_delegator1.aleo") || BigInt("0");
    let delegator2_balance: bigint = this.credits.account.get("pondo_delegator2.aleo") || BigInt("0");
    let delegator3_balance: bigint = this.credits.account.get("pondo_delegator3.aleo") || BigInt("0");
    let delegator4_balance: bigint = this.credits.account.get("pondo_delegator4.aleo") || BigInt("0");
    let delegator5_balance: bigint = this.credits.account.get("pondo_delegator5.aleo") || BigInt("0");
// Get all of the bonded balances
    let default_bond_state: bond_state = {
    validator: "pondo_core_protocol.aleo",
    microcredits: BigInt("0")
    };
    let delegator1_bonded: bigint = this.credits.bonded.get("pondo_delegator1.aleo")?.microcredits || default_bond_state?.microcredits;
    let delegator2_bonded: bigint = this.credits.bonded.get("pondo_delegator2.aleo")?.microcredits || default_bond_state?.microcredits;
    let delegator3_bonded: bigint = this.credits.bonded.get("pondo_delegator3.aleo")?.microcredits || default_bond_state?.microcredits;
    let delegator4_bonded: bigint = this.credits.bonded.get("pondo_delegator4.aleo")?.microcredits || default_bond_state?.microcredits;
    let delegator5_bonded: bigint = this.credits.bonded.get("pondo_delegator5.aleo")?.microcredits || default_bond_state?.microcredits;
// Get all of the unbonding balances
    let default_unbond_state: unbond_state = {
    microcredits: BigInt("0"),
    height: BigInt("0")
    };
    let delegator1_unbonding: bigint = this.credits.unbonding.get("pondo_delegator1.aleo")?.microcredits || default_unbond_state?.microcredits;
    let delegator2_unbonding: bigint = this.credits.unbonding.get("pondo_delegator2.aleo")?.microcredits || default_unbond_state?.microcredits;
    let delegator3_unbonding: bigint = this.credits.unbonding.get("pondo_delegator3.aleo")?.microcredits || default_unbond_state?.microcredits;
    let delegator4_unbonding: bigint = this.credits.unbonding.get("pondo_delegator4.aleo")?.microcredits || default_unbond_state?.microcredits;
    let delegator5_unbonding: bigint = this.credits.unbonding.get("pondo_delegator5.aleo")?.microcredits || default_unbond_state?.microcredits;
// Get the core protocol balance
    let core_protocol_balance: bigint = this.credits.account.get("pondo_core_protocol.aleo") || BigInt("0");
    
// Calculate the total tvl
    let total_tvl: bigint = delegator1_balance + delegator2_balance + delegator3_balance + delegator4_balance + delegator5_balance
    + delegator1_bonded + delegator2_bonded + delegator3_bonded + delegator4_bonded + delegator5_bonded + core_protocol_balance
    + delegator1_unbonding + delegator2_unbonding + delegator3_unbonding + delegator4_unbonding + delegator5_unbonding;
    
// Assert that the total tvl matches the tvl provided within a margin of error of 2%
    assert(total_tvl >= tvl * BigInt("98") / BigInt("100") && total_tvl <= tvl * BigInt("102") / BigInt("100"));
    }
    }
