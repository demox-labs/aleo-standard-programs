import { pondo_delegator5Program } from './pondo_delegator5';
import { pondo_delegator4Program } from './pondo_delegator4';
import { pondo_delegator3Program } from './pondo_delegator3';
import { pondo_delegator2Program } from './pondo_delegator2';
import { pondo_delegator1Program } from './pondo_delegator1';
import { pondo_tokenProgram } from './pondo_token';
import { pondo_staked_aleo_tokenProgram } from './pondo_staked_aleo_token';
import { pondo_oracleProgram } from './pondo_oracle';
import { multi_token_support_programProgram } from './multi_token_support_program';
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
  signer: string = 'not set';
  caller: string = 'not set';
  address: string = 'pondo_core_protocol.aleo';
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  withdrawal_batches: Map<bigint, bigint> = new Map();
  withdrawals: Map<string, withdrawal_state> = new Map();
  last_rebalance_epoch: Map<bigint, bigint> = new Map();
  owed_commission: Map<bigint, bigint> = new Map();
  balances: Map<bigint, bigint> = new Map();
  CLAIMABLE_WITHDRAWALS = BigInt('2');
  BONDED_WITHDRAWALS = BigInt('1');
  DELEGATED_BALANCE = BigInt('0');
  protocol_state: Map<bigint, bigint> = new Map();
  REBALANCING_STATE = BigInt('1');
  NORMAL_STATE = BigInt('0');
  PROTOCOL_STATE_KEY = BigInt('0');
  validator_set: Map<bigint, validator_state[]> = new Map();
  NEXT_VALIDATOR_SET = BigInt('1');
  CURRENT_VALIDATOR_SET = BigInt('0');
  TERMINAL = BigInt('4');
  UNBONDING = BigInt('3');
  UNBOND_ALLOWED = BigInt('2');
  UNBOND_NOT_ALLOWED = BigInt('1');
  BOND_ALLOWED = BigInt('0');
  CREDITS_TOKEN_ID =
    '3443843282313283355522573239085696902919850365217539366784739393210722344986field';
  PALEO_TOKEN_ID =
    '1751493913335802797273486270793650302076377624243810059080883537084141842600field';
  MIN_LIQUIDITY_PERCENT = BigInt('250');
  MAX_GUARANTEED_LIQUIDITY = BigInt('250000000000');
  INSTANT_WITHDRAW_FEE = BigInt('025');
  WITHDRAW_WAIT_MINIMUM = BigInt('43200');
  PROTOCOL_FEE = BigInt('1000');
  REBALANCE_PERIOD = BigInt('17280');
  BLOCKS_PER_EPOCH = BigInt('120960');
  PORTION_5 = BigInt('900');
  PORTION_4 = BigInt('1200');
  PORTION_3 = BigInt('1600');
  PORTION_2 = BigInt('2600');
  PORTION_1 = BigInt('3700');
  PRECISION_UNSIGNED = BigInt('10000');
  pondo_delegator5: pondo_delegator5Program;
  pondo_delegator4: pondo_delegator4Program;
  pondo_delegator3: pondo_delegator3Program;
  pondo_delegator2: pondo_delegator2Program;
  pondo_delegator1: pondo_delegator1Program;
  pondo_token: pondo_tokenProgram;
  pondo_staked_aleo_token: pondo_staked_aleo_tokenProgram;
  pondo_oracle: pondo_oracleProgram;
  multi_token_support_program: multi_token_support_programProgram;
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
    multi_token_support_programContract: multi_token_support_programProgram,
    creditsContract: creditsProgram
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
    this.multi_token_support_program = multi_token_support_programContract;
    this.credits = creditsContract;
    this.block = this.credits.block;
  }

  //program pondo_core_protocol.aleo {
  // The number of blocks in an epoch

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

  initialize(transfer_amount: bigint) {
    assert(
      transfer_amount >= BigInt('102'),
      'Assert that the transfer amount is at least 102 microcredits, to ensure there is no division by zero, and that there is enough for the liquidity pool'
    );

    // Transfer ALEO to the protocol

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public_as_signer(this.address, transfer_amount);

    // Initialize pALEO and PNDO tokens

    this.pondo_staked_aleo_token.signer = this.signer;
    this.pondo_staked_aleo_token.caller = 'pondo_core_protocol.aleo';
    this.pondo_staked_aleo_token.register_token();

    this.pondo_staked_aleo_token.signer = this.signer;
    this.pondo_staked_aleo_token.caller = 'pondo_core_protocol.aleo';
    this.pondo_staked_aleo_token.mint_public(transfer_amount, this.signer);

    this.pondo_token.signer = this.signer;
    this.pondo_token.caller = 'pondo_core_protocol.aleo';
    this.pondo_token.initialize_token();

    // Initialize delegators

    this.pondo_delegator1.signer = this.signer;
    this.pondo_delegator1.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator1.initialize();

    this.pondo_delegator2.signer = this.signer;
    this.pondo_delegator2.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator2.initialize();

    this.pondo_delegator3.signer = this.signer;
    this.pondo_delegator3.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator3.initialize();

    this.pondo_delegator4.signer = this.signer;
    this.pondo_delegator4.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator4.initialize();

    this.pondo_delegator5.signer = this.signer;
    this.pondo_delegator5.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator5.initialize();

    return this.finalize_initialize();
  }

  finalize_initialize() {
    this.balances.set(this.DELEGATED_BALANCE, BigInt('0'));
    this.balances.set(this.BONDED_WITHDRAWALS, BigInt('0'));
    this.balances.set(this.CLAIMABLE_WITHDRAWALS, BigInt('0'));
    this.owed_commission.set(BigInt('0'), BigInt('0'));
    this.protocol_state.set(this.PROTOCOL_STATE_KEY, this.NORMAL_STATE);

    let top_validators: string[] = this.pondo_oracle.top_validators.get(
      BigInt('0')
    ) || [
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
    ];
    let default_datum: validator_datum = {
      delegator:
        'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      validator:
        'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      block_height: BigInt('0'),
      bonded_microcredits: BigInt('0'),
      microcredits_yield_per_epoch: BigInt('0'),
      commission: BigInt('0'),
      boost: BigInt('0'),
    };
    let validator1: validator_datum =
      this.pondo_oracle.validator_data.get(top_validators[0]) || default_datum;
    let validator2: validator_datum =
      this.pondo_oracle.validator_data.get(top_validators[1]) || default_datum;
    let validator3: validator_datum =
      this.pondo_oracle.validator_data.get(top_validators[2]) || default_datum;
    let validator4: validator_datum =
      this.pondo_oracle.validator_data.get(top_validators[3]) || default_datum;
    let validator5: validator_datum =
      this.pondo_oracle.validator_data.get(top_validators[4]) || default_datum;

    let next_validator_set: validator_state[] = [
      { validator: validator1.validator, commission: validator1.commission },
      { validator: validator2.validator, commission: validator2.commission },
      { validator: validator3.validator, commission: validator3.commission },
      { validator: validator4.validator, commission: validator4.commission },
      { validator: validator5.validator, commission: validator5.commission },
    ];
    this.validator_set.set(this.NEXT_VALIDATOR_SET, next_validator_set);
  }

  // -------------------
  // DEPOSIT FUNCTIONS
  // -------------------

  deposit_public_as_signer(
    credits_deposit: bigint,
    expected_paleo_mint: bigint,
    referrer: string
  ) {
    assert(
      expected_paleo_mint >= BigInt('1'),
      'Assert that the expected pALEO mint is at least 1 microcredit'
    );

    // Transfer ALEO to pool

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public_as_signer(this.address, credits_deposit);

    // Mint pALEO to depositor

    this.pondo_staked_aleo_token.signer = this.signer;
    this.pondo_staked_aleo_token.caller = 'pondo_core_protocol.aleo';
    this.pondo_staked_aleo_token.mint_public(expected_paleo_mint, this.signer);

    return this.finalize_deposit_public_as_signer(
      credits_deposit,
      expected_paleo_mint
    );
  }

  finalize_deposit_public_as_signer(
    credits_deposit: bigint,
    expected_paleo_mint: bigint
  ) {
    let base_bond_state: bond_state = {
      validator: this.address,
      microcredits: BigInt('0'),
    };
    let delegator1_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator1.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator2_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator2.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator3_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator3.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator4_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator4.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator5_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator5.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );

    let base_unbond_state: unbond_state = {
      microcredits: BigInt('0'),
      height: BigInt('0'),
    };
    let delegator1_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator1.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator2_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator2.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator3_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator3.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator4_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator4.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator5_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator5.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );

    let delegator1_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator1.aleo') || BigInt('0')
    );
    let delegator2_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator2.aleo') || BigInt('0')
    );
    let delegator3_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator3.aleo') || BigInt('0')
    );
    let delegator4_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator4.aleo') || BigInt('0')
    );
    let delegator5_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator5.aleo') || BigInt('0')
    );

    let total_bonded: bigint = BigInt.asUintN(
      64,
      delegator1_bonded +
        delegator2_bonded +
        delegator3_bonded +
        delegator4_bonded +
        delegator5_bonded
    );
    let total_account: bigint = BigInt.asUintN(
      64,
      delegator1_account +
        delegator2_account +
        delegator3_account +
        delegator4_account +
        delegator5_account
    );
    let total_unbonding: bigint = BigInt.asUintN(
      64,
      delegator1_unbonding +
        delegator2_unbonding +
        delegator3_unbonding +
        delegator4_unbonding +
        delegator5_unbonding
    );
    let bonded_withdrawals: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.BONDED_WITHDRAWALS)!
    );
    assert(bonded_withdrawals !== undefined);
    let total_delegated: bigint = BigInt.asIntN(
      64,
      total_bonded + total_account + total_unbonding - bonded_withdrawals
    );

    let currently_delegated: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.DELEGATED_BALANCE)!
    );
    assert(currently_delegated !== undefined);
    let current_owed_commission: bigint = BigInt.asUintN(
      64,
      this.owed_commission.get(BigInt('0'))!
    );
    assert(current_owed_commission !== undefined);
    let total_paleo_pool: bigint = BigInt.asUintN(
      128,
      this.multi_token_support_program.registered_tokens.get(
        this.PALEO_TOKEN_ID
      )!.supply +
        current_owed_commission -
        expected_paleo_mint
    );
    assert(total_paleo_pool !== undefined);

    let rewards: bigint = BigInt.asIntN(
      64,
      total_delegated > currently_delegated
        ? total_delegated - currently_delegated
        : BigInt('0')
    );
    let new_commission: bigint = BigInt.asUintN(
      64,
      this.inline_get_commission(rewards, this.PROTOCOL_FEE)
    );
    currently_delegated += rewards - new_commission;

    let core_protocol_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get(this.address) || BigInt('0')
    );
    let reserved_for_withdrawal: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.CLAIMABLE_WITHDRAWALS)!
    );
    assert(reserved_for_withdrawal !== undefined);
    let current_state: bigint = BigInt.asUintN(
      8,
      this.protocol_state.get(this.PROTOCOL_STATE_KEY)!
    );
    assert(current_state !== undefined);
    let deposit_pool: bigint = BigInt.asUintN(
      64,
      current_state == this.NORMAL_STATE
        ? core_protocol_account - credits_deposit - reserved_for_withdrawal
        : core_protocol_account -
            currently_delegated -
            credits_deposit -
            reserved_for_withdrawal
    ); // if the protocol is rebalancing, the full balance is in the account
    let new_commission_paleo: bigint = BigInt.asUintN(
      64,
      this.inline_calculate_new_paleo(
        currently_delegated,
        deposit_pool,
        new_commission,
        total_paleo_pool
      )
    );
    this.owed_commission.set(
      BigInt('0'),
      current_owed_commission + new_commission_paleo
    );

    total_paleo_pool += new_commission_paleo;
    currently_delegated += new_commission;
    // Update bonded pool balance with latest rewards
    this.balances.set(this.DELEGATED_BALANCE, currently_delegated);

    // Calculate mint for deposit
    let paleo_for_deposit: bigint = BigInt.asUintN(
      64,
      this.inline_calculate_new_paleo(
        currently_delegated,
        deposit_pool,
        credits_deposit,
        total_paleo_pool
      )
    );
    assert(
      paleo_for_deposit >= expected_paleo_mint,
      'Assert that the transition did not mint too much pALEO'
    );
  }

  inline_get_commission(rewards: bigint, commission_rate: bigint) {
    let commission: bigint = BigInt.asUintN(
      128,
      (rewards * commission_rate) / this.PRECISION_UNSIGNED
    );
    let commission_64: bigint = BigInt.asUintN(64, commission);
    return commission_64;
  }

  inline_calculate_new_paleo(
    bonded_balance: bigint,
    existing_deposit_pool: bigint,
    deposit: bigint,
    paleo: bigint
  ) {
    let full_balance: bigint = BigInt.asUintN(
      128,
      bonded_balance + existing_deposit_pool
    );
    let new_total_paleo: bigint = BigInt.asUintN(
      128,
      (paleo * (full_balance + deposit)) / full_balance
    );
    let diff: bigint = BigInt.asUintN(128, new_total_paleo - paleo);
    let paleo_to_mint: bigint = BigInt.asUintN(64, diff);
    return paleo_to_mint;
  }

  // Note: requires the caller to create an allowance for the contract first
  deposit_public(
    credits_deposit: bigint,
    expected_paleo_mint: bigint,
    referrer: string
  ) {
    assert(
      expected_paleo_mint >= BigInt('1'),
      'Assert that the expected pALEO mint is at least 1 microcredit'
    );

    // Transfer ALEO to pool

    this.multi_token_support_program.signer = this.signer;
    this.multi_token_support_program.caller = 'pondo_core_protocol.aleo';
    this.multi_token_support_program.transfer_from_public(
      this.CREDITS_TOKEN_ID,
      this.caller,
      this.address,
      credits_deposit
    );

    this.multi_token_support_program.signer = this.signer;
    this.multi_token_support_program.caller = 'pondo_core_protocol.aleo';
    this.multi_token_support_program.withdraw_credits_public(credits_deposit);

    // Mint pALEO to depositor

    this.pondo_staked_aleo_token.signer = this.signer;
    this.pondo_staked_aleo_token.caller = 'pondo_core_protocol.aleo';
    this.pondo_staked_aleo_token.mint_public(expected_paleo_mint, this.caller);

    return this.finalize_deposit_public(credits_deposit, expected_paleo_mint);
  }

  finalize_deposit_public(
    credits_deposit: bigint,
    expected_paleo_mint: bigint
  ) {
    let base_bond_state: bond_state = {
      validator: this.address,
      microcredits: BigInt('0'),
    };
    let delegator1_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator1.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator2_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator2.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator3_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator3.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator4_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator4.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator5_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator5.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );

    let base_unbond_state: unbond_state = {
      microcredits: BigInt('0'),
      height: BigInt('0'),
    };
    let delegator1_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator1.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator2_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator2.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator3_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator3.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator4_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator4.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator5_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator5.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );

    let delegator1_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator1.aleo') || BigInt('0')
    );
    let delegator2_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator2.aleo') || BigInt('0')
    );
    let delegator3_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator3.aleo') || BigInt('0')
    );
    let delegator4_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator4.aleo') || BigInt('0')
    );
    let delegator5_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator5.aleo') || BigInt('0')
    );

    let total_bonded: bigint = BigInt.asUintN(
      64,
      delegator1_bonded +
        delegator2_bonded +
        delegator3_bonded +
        delegator4_bonded +
        delegator5_bonded
    );
    let total_account: bigint = BigInt.asUintN(
      64,
      delegator1_account +
        delegator2_account +
        delegator3_account +
        delegator4_account +
        delegator5_account
    );
    let total_unbonding: bigint = BigInt.asUintN(
      64,
      delegator1_unbonding +
        delegator2_unbonding +
        delegator3_unbonding +
        delegator4_unbonding +
        delegator5_unbonding
    );
    let bonded_withdrawals: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.BONDED_WITHDRAWALS)!
    );
    assert(bonded_withdrawals !== undefined);
    let total_delegated: bigint = BigInt.asIntN(
      64,
      total_bonded + total_account + total_unbonding - bonded_withdrawals
    );

    let currently_delegated: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.DELEGATED_BALANCE)!
    );
    assert(currently_delegated !== undefined);
    let current_owed_commission: bigint = BigInt.asUintN(
      64,
      this.owed_commission.get(BigInt('0'))!
    );
    assert(current_owed_commission !== undefined);
    let total_paleo_pool: bigint = BigInt.asUintN(
      128,
      this.multi_token_support_program.registered_tokens.get(
        this.PALEO_TOKEN_ID
      )!.supply +
        current_owed_commission -
        expected_paleo_mint
    );
    assert(total_paleo_pool !== undefined);

    let rewards: bigint = BigInt.asIntN(
      64,
      total_delegated > currently_delegated
        ? total_delegated - currently_delegated
        : BigInt('0')
    );
    let new_commission: bigint = BigInt.asUintN(
      64,
      this.inline_get_commission(rewards, this.PROTOCOL_FEE)
    );
    currently_delegated += rewards - new_commission;

    let core_protocol_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get(this.address) || BigInt('0')
    );
    let reserved_for_withdrawal: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.CLAIMABLE_WITHDRAWALS)!
    );
    assert(reserved_for_withdrawal !== undefined);
    let current_state: bigint = BigInt.asUintN(
      8,
      this.protocol_state.get(this.PROTOCOL_STATE_KEY)!
    );
    assert(current_state !== undefined);
    let deposit_pool: bigint = BigInt.asUintN(
      64,
      current_state == this.NORMAL_STATE
        ? core_protocol_account - credits_deposit - reserved_for_withdrawal
        : core_protocol_account -
            currently_delegated -
            credits_deposit -
            reserved_for_withdrawal
    ); // if the protocol is rebalancing, the full balance is in the account
    let new_commission_paleo: bigint = BigInt.asUintN(
      64,
      this.inline_calculate_new_paleo(
        currently_delegated,
        deposit_pool,
        new_commission,
        total_paleo_pool
      )
    );
    this.owed_commission.set(
      BigInt('0'),
      current_owed_commission + new_commission_paleo
    );

    total_paleo_pool += new_commission_paleo;
    currently_delegated += new_commission;
    // Update bonded pool balance with latest rewards
    this.balances.set(this.DELEGATED_BALANCE, currently_delegated);

    // Calculate mint for deposit
    let paleo_for_deposit: bigint = BigInt.asUintN(
      64,
      this.inline_calculate_new_paleo(
        currently_delegated,
        deposit_pool,
        credits_deposit,
        total_paleo_pool
      )
    );
    assert(
      paleo_for_deposit >= expected_paleo_mint,
      'Assert that the transition did not mint too much pALEO'
    );
  }

  distribute_deposits(transfer_amounts: bigint[]) {
    // Transfer to each delegator

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public('pondo_delegator1.aleo', transfer_amounts[0]);

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public('pondo_delegator2.aleo', transfer_amounts[1]);

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public('pondo_delegator3.aleo', transfer_amounts[2]);

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public('pondo_delegator4.aleo', transfer_amounts[3]);

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public('pondo_delegator5.aleo', transfer_amounts[4]);

    return this.finalize_distribute_deposits();
  }

  finalize_distribute_deposits() {
    // Confirm that there are enough credits left for the liquidity pool
    let currently_delegated: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.DELEGATED_BALANCE)!
    );
    assert(currently_delegated !== undefined);
    let account_balance: bigint = BigInt.asUintN(
      64,
      this.credits.account.get(this.address) || BigInt('0')
    );
    let reserved_for_withdrawal: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.CLAIMABLE_WITHDRAWALS)!
    );
    assert(reserved_for_withdrawal !== undefined);
    let liquidity_pool: bigint = BigInt.asUintN(
      64,
      account_balance - reserved_for_withdrawal
    );
    let optimal_liquidity: bigint = BigInt.asUintN(
      64,
      this.inline_calculate_optimal_liquidity(currently_delegated)
    );
    assert(liquidity_pool >= optimal_liquidity);

    // Confirm each delegator is already bonded and in the correct state
    let delegator1_state: bigint = BigInt.asUintN(
      8,
      this.pondo_delegator1.state_mapping.get(BigInt('0'))!
    );
    assert(delegator1_state !== undefined);
    let delegator2_state: bigint = BigInt.asUintN(
      8,
      this.pondo_delegator2.state_mapping.get(BigInt('0'))!
    );
    assert(delegator2_state !== undefined);
    let delegator3_state: bigint = BigInt.asUintN(
      8,
      this.pondo_delegator3.state_mapping.get(BigInt('0'))!
    );
    assert(delegator3_state !== undefined);
    let delegator4_state: bigint = BigInt.asUintN(
      8,
      this.pondo_delegator4.state_mapping.get(BigInt('0'))!
    );
    assert(delegator4_state !== undefined);
    let delegator5_state: bigint = BigInt.asUintN(
      8,
      this.pondo_delegator5.state_mapping.get(BigInt('0'))!
    );
    assert(delegator5_state !== undefined);
    assert(
      delegator1_state == this.BOND_ALLOWED ||
        delegator1_state == this.UNBOND_NOT_ALLOWED,
      'Assert that delegator1 is in the correct state'
    );
    assert(
      delegator2_state == this.BOND_ALLOWED ||
        delegator2_state == this.UNBOND_NOT_ALLOWED,
      'Assert that delegator2 is in the correct state'
    );
    assert(
      delegator3_state == this.BOND_ALLOWED ||
        delegator3_state == this.UNBOND_NOT_ALLOWED,
      'Assert that delegator3 is in the correct state'
    );
    assert(
      delegator4_state == this.BOND_ALLOWED ||
        delegator4_state == this.UNBOND_NOT_ALLOWED,
      'Assert that delegator4 is in the correct state'
    );
    assert(
      delegator5_state == this.BOND_ALLOWED ||
        delegator5_state == this.UNBOND_NOT_ALLOWED,
      'Assert that delegator5 is in the correct state'
    );
  }

  inline_calculate_optimal_liquidity(total_balance: bigint) {
    let min_liquidity: bigint = BigInt.asUintN(
      128,
      (total_balance * this.MIN_LIQUIDITY_PERCENT) / this.PRECISION_UNSIGNED
    );
    let optimal_liquidity: bigint = BigInt.asUintN(
      64,
      min_liquidity > this.MAX_GUARANTEED_LIQUIDITY
        ? this.MAX_GUARANTEED_LIQUIDITY
        : min_liquidity
    );
    return optimal_liquidity;
  }

  // -------------------
  // WITHDRAW FUNCTIONS
  // -------------------

  instant_withdraw_public(
    paleo_burn_amount: bigint,
    withdrawal_credits: bigint
  ) {
    // Burn pALEO for withdrawal

    this.pondo_staked_aleo_token.signer = this.signer;
    this.pondo_staked_aleo_token.caller = 'pondo_core_protocol.aleo';
    this.pondo_staked_aleo_token.burn_public(paleo_burn_amount, this.caller);

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public(this.caller, withdrawal_credits);

    return this.finalize_instant_withdraw_public(
      paleo_burn_amount,
      withdrawal_credits,
      this.caller
    );
  }

  finalize_instant_withdraw_public(
    paleo_burn_amount: bigint,
    withdrawal_credits: bigint,
    caller: string
  ) {
    // Block instant withdrawals during a rebalance
    let current_state: bigint = BigInt.asUintN(
      8,
      this.protocol_state.get(this.PROTOCOL_STATE_KEY)!
    );
    assert(current_state !== undefined);
    assert(
      current_state == this.NORMAL_STATE,
      'Assert that the protocol is not in a rebalancing state'
    );

    let has_withdrawal: boolean = this.withdrawals.has(caller);
    assert(
      !has_withdrawal,
      'Assert that the caller does not have a pending withdrawal'
    );

    // Calculate new delegated balance
    let base_bond_state: bond_state = {
      validator: this.address,
      microcredits: BigInt('0'),
    };
    let delegator1_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator1.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator2_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator2.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator3_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator3.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator4_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator4.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator5_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator5.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );

    let base_unbond_state: unbond_state = {
      microcredits: BigInt('0'),
      height: BigInt('0'),
    };
    let delegator1_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator1.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator2_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator2.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator3_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator3.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator4_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator4.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator5_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator5.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );

    let delegator1_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator1.aleo') || BigInt('0')
    );
    let delegator2_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator2.aleo') || BigInt('0')
    );
    let delegator3_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator3.aleo') || BigInt('0')
    );
    let delegator4_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator4.aleo') || BigInt('0')
    );
    let delegator5_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator5.aleo') || BigInt('0')
    );

    let total_bonded: bigint = BigInt.asUintN(
      64,
      delegator1_bonded +
        delegator2_bonded +
        delegator3_bonded +
        delegator4_bonded +
        delegator5_bonded
    );
    let total_account: bigint = BigInt.asUintN(
      64,
      delegator1_account +
        delegator2_account +
        delegator3_account +
        delegator4_account +
        delegator5_account
    );
    let total_unbonding: bigint = BigInt.asUintN(
      64,
      delegator1_unbonding +
        delegator2_unbonding +
        delegator3_unbonding +
        delegator4_unbonding +
        delegator5_unbonding
    );
    let bonded_withdrawals: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.BONDED_WITHDRAWALS)!
    );
    assert(bonded_withdrawals !== undefined);
    // Total delegated is all credits that have been sent to delegators, less any that have been withdrawn but are still bonded
    let total_delegated: bigint = BigInt.asIntN(
      64,
      total_bonded + total_account + total_unbonding - bonded_withdrawals
    );

    // Currently delegated is all credits that have been sent to delegators, less withdrawals,
    // and without any rewards that have been earned since the update
    let currently_delegated: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.DELEGATED_BALANCE)!
    );
    assert(currently_delegated !== undefined);
    let current_owed_commission: bigint = BigInt.asUintN(
      64,
      this.owed_commission.get(BigInt('0'))!
    );
    assert(current_owed_commission !== undefined);
    let paleo_minted_post_burn: bigint = BigInt.asUintN(
      128,
      this.multi_token_support_program.registered_tokens.get(
        this.PALEO_TOKEN_ID
      )!.supply + current_owed_commission
    );
    assert(paleo_minted_post_burn !== undefined);
    let total_paleo_minted: bigint = BigInt.asUintN(
      128,
      paleo_minted_post_burn + paleo_burn_amount
    );

    let rewards: bigint = BigInt.asIntN(
      64,
      total_delegated > currently_delegated
        ? total_delegated - currently_delegated
        : BigInt('0')
    );
    let new_commission: bigint = BigInt.asUintN(
      64,
      this.inline_get_commission(rewards, this.PROTOCOL_FEE)
    );
    currently_delegated += rewards - new_commission;

    let core_protocol_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get(this.address) || BigInt('0')
    );
    let reserved_for_withdrawal: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.CLAIMABLE_WITHDRAWALS)!
    );
    assert(reserved_for_withdrawal !== undefined);
    let deposit_pool: bigint = BigInt.asUintN(
      64,
      core_protocol_account - reserved_for_withdrawal + withdrawal_credits
    );
    // Update owed commission balance
    let new_commission_paleo: bigint = BigInt.asUintN(
      64,
      this.inline_calculate_new_paleo(
        currently_delegated,
        deposit_pool,
        new_commission,
        total_paleo_minted
      )
    );
    current_owed_commission += new_commission_paleo;
    total_paleo_minted += new_commission_paleo;
    currently_delegated += new_commission;

    // Calculate full pool size
    let full_pool: bigint = BigInt.asUintN(
      128,
      currently_delegated + deposit_pool
    );

    // Calculate credits value of burned pALEO
    let withdrawal_fee: bigint = BigInt.asUintN(
      64,
      this.inline_calculate_withdraw_fee(paleo_burn_amount)
    );
    let net_burn_amount: bigint = BigInt.asUintN(
      64,
      paleo_burn_amount - withdrawal_fee
    );
    let withdrawal_calculation: bigint = BigInt.asUintN(
      128,
      (net_burn_amount * full_pool) / total_paleo_minted
    );
    assert(
      withdrawal_credits <= withdrawal_calculation,
      'Assert that the withdrawal amount was at most the calculated amount'
    );

    // Update owed commission to reflect withdrawal fee
    this.owed_commission.set(
      BigInt('0'),
      current_owed_commission + withdrawal_fee
    );
  }

  inline_calculate_withdraw_fee(paleo_burn_amount: bigint) {
    let fee_calc: bigint = BigInt.asUintN(
      128,
      (paleo_burn_amount * this.INSTANT_WITHDRAW_FEE) / this.PRECISION_UNSIGNED
    );
    let fee: bigint = BigInt.asUintN(64, fee_calc);
    return fee;
  }

  withdraw_public(paleo_burn_amount: bigint) {
    // Burn pALEO for withdrawal

    this.pondo_staked_aleo_token.signer = this.signer;
    this.pondo_staked_aleo_token.caller = 'pondo_core_protocol.aleo';
    this.pondo_staked_aleo_token.burn_public(paleo_burn_amount, this.caller);

    return this.finalize_withdraw_public(paleo_burn_amount, this.caller);
  }

  finalize_withdraw_public(paleo_burn_amount: bigint, caller: string) {
    // Assert that the caller does not have a pending withdrawal
    let has_withdrawal: boolean = this.withdrawals.has(caller);
    assert(!has_withdrawal, 'only one withdrawal at a time');

    // Calculate commission owed
    let base_bond_state: bond_state = {
      validator: this.address,
      microcredits: BigInt('0'),
    };
    let delegator1_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator1.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator2_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator2.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator3_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator3.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator4_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator4.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );
    let delegator5_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator5.aleo')?.microcredits ||
        base_bond_state?.microcredits
    );

    let base_unbond_state: unbond_state = {
      microcredits: BigInt('0'),
      height: BigInt('0'),
    };
    let delegator1_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator1.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator2_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator2.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator3_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator3.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator4_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator4.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );
    let delegator5_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator5.aleo')?.microcredits ||
        base_unbond_state?.microcredits
    );

    let delegator1_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator1.aleo') || BigInt('0')
    );
    let delegator2_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator2.aleo') || BigInt('0')
    );
    let delegator3_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator3.aleo') || BigInt('0')
    );
    let delegator4_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator4.aleo') || BigInt('0')
    );
    let delegator5_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator5.aleo') || BigInt('0')
    );

    let total_bonded: bigint = BigInt.asUintN(
      64,
      delegator1_bonded +
        delegator2_bonded +
        delegator3_bonded +
        delegator4_bonded +
        delegator5_bonded
    );
    let total_account: bigint = BigInt.asUintN(
      64,
      delegator1_account +
        delegator2_account +
        delegator3_account +
        delegator4_account +
        delegator5_account
    );
    let total_unbonding: bigint = BigInt.asUintN(
      64,
      delegator1_unbonding +
        delegator2_unbonding +
        delegator3_unbonding +
        delegator4_unbonding +
        delegator5_unbonding
    );
    let bonded_withdrawals: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.BONDED_WITHDRAWALS)!
    );
    assert(bonded_withdrawals !== undefined);
    // Total delegated is all credits that have been sent to delegators, less any that have been withdrawn but are still bonded
    let total_delegated: bigint = BigInt.asIntN(
      64,
      total_bonded + total_account + total_unbonding - bonded_withdrawals
    );

    // Currently delegated is all credits that have been sent to delegators, less withdrawals,
    // and without any rewards that have been earned since the update
    let currently_delegated: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.DELEGATED_BALANCE)!
    );
    assert(currently_delegated !== undefined);
    let current_owed_commission: bigint = BigInt.asUintN(
      64,
      this.owed_commission.get(BigInt('0'))!
    );
    assert(current_owed_commission !== undefined);
    let paleo_minted_post_burn: bigint = BigInt.asUintN(
      128,
      this.multi_token_support_program.registered_tokens.get(
        this.PALEO_TOKEN_ID
      )!.supply + current_owed_commission
    );
    assert(paleo_minted_post_burn !== undefined);
    let total_paleo_minted: bigint = BigInt.asUintN(
      128,
      paleo_minted_post_burn + paleo_burn_amount
    );

    let rewards: bigint = BigInt.asIntN(
      64,
      total_delegated > currently_delegated
        ? total_delegated - currently_delegated
        : BigInt('0')
    );
    let new_commission: bigint = BigInt.asUintN(
      64,
      this.inline_get_commission(rewards, this.PROTOCOL_FEE)
    );
    currently_delegated += rewards - new_commission;

    let core_protocol_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get(this.address) || BigInt('0')
    );
    let reserved_for_withdrawal: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.CLAIMABLE_WITHDRAWALS)!
    );
    assert(reserved_for_withdrawal !== undefined);
    let current_state: bigint = BigInt.asUintN(
      8,
      this.protocol_state.get(this.PROTOCOL_STATE_KEY)!
    );
    assert(current_state !== undefined);
    let deposit_pool: bigint = BigInt.asUintN(
      64,
      current_state == this.NORMAL_STATE
        ? core_protocol_account - reserved_for_withdrawal
        : core_protocol_account - currently_delegated - reserved_for_withdrawal
    ); // if the protocol is rebalancing, the full balance is in the account
    // Update owed commission balance
    let new_commission_paleo: bigint = BigInt.asUintN(
      64,
      this.inline_calculate_new_paleo(
        currently_delegated,
        deposit_pool,
        new_commission,
        total_paleo_minted
      )
    );
    this.owed_commission.set(
      BigInt('0'),
      current_owed_commission + new_commission_paleo
    );
    total_paleo_minted += new_commission_paleo;
    currently_delegated += new_commission;

    // Calculate full pool size
    let full_pool: bigint = BigInt.asUintN(
      128,
      currently_delegated + deposit_pool
    );

    // Calculate credits value of burned pALEO
    let withdrawal_calculation: bigint = BigInt.asUintN(
      128,
      (paleo_burn_amount * full_pool) / total_paleo_minted
    );
    let withdrawal: bigint = BigInt.asUintN(64, withdrawal_calculation);

    // Update bonded withdrawals
    this.balances.set(this.BONDED_WITHDRAWALS, bonded_withdrawals + withdrawal);

    // Update total balance to reflect withdrawal
    this.balances.set(this.DELEGATED_BALANCE, currently_delegated - withdrawal);

    // Create withdrawal for caller in next batch
    let batch_height: bigint[] = this.inline_get_withdrawal_batch(
      this.block.height
    );
    let withdrawal_state_value: withdrawal_state = {
      microcredits: withdrawal,
      claim_block: batch_height[1],
    };
    this.withdrawals.set(caller, withdrawal_state_value);
    // Update total for batch
    let batch_total: bigint = BigInt.asUintN(
      64,
      this.withdrawal_batches.get(batch_height[0]) || BigInt('0')
    );
    this.withdrawal_batches.set(batch_height[0], batch_total + withdrawal);
  }

  inline_get_withdrawal_batch(height: bigint) {
    let min_block_height: bigint = BigInt.asUintN(
      32,
      height + this.WITHDRAW_WAIT_MINIMUM
    );
    let withdrawal_batch: bigint = BigInt.asUintN(
      32,
      min_block_height / this.BLOCKS_PER_EPOCH
    );
    // Withdrawals are processed at the start of the next epoch
    let claim_block: bigint = BigInt.asUintN(
      32,
      (withdrawal_batch + BigInt('1')) * this.BLOCKS_PER_EPOCH +
        this.REBALANCE_PERIOD +
        BigInt('1')
    );

    return [withdrawal_batch, claim_block];
  }

  claim_withdrawal_public(owner: string, amount: bigint) {
    // Transfer to the owner

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public(owner, amount);

    return this.finalize_claim_withdrawal_public(owner, amount);
  }

  finalize_claim_withdrawal_public(owner: string, amount: bigint) {
    // Update withdrawal state
    let withdrawal: withdrawal_state = this.withdrawals.get(owner)!;
    assert(withdrawal !== undefined);
    assert(
      withdrawal.claim_block < this.block.height,
      'make sure the withdrawal is claimable'
    );

    // Update withrawal mapping
    if (withdrawal.microcredits == amount) {
      this.withdrawals.delete(owner);
    } else {
      let new_withdrawal: withdrawal_state = {
        microcredits: withdrawal.microcredits - amount,
        claim_block: withdrawal.claim_block,
      };
      this.withdrawals.set(owner, new_withdrawal);
    }

    // Update balance reserved for withdrawal
    let reserved_for_withdrawal: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.CLAIMABLE_WITHDRAWALS)!
    );
    assert(reserved_for_withdrawal !== undefined);
    this.balances.set(
      this.CLAIMABLE_WITHDRAWALS,
      reserved_for_withdrawal - amount
    );
  }

  // -------------------
  // REBALANCING FUNCTIONS
  // -------------------

  prep_rebalance() {
    this.pondo_delegator1.signer = this.signer;
    this.pondo_delegator1.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator1.prep_rebalance();

    this.pondo_delegator2.signer = this.signer;
    this.pondo_delegator2.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator2.prep_rebalance();

    this.pondo_delegator3.signer = this.signer;
    this.pondo_delegator3.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator3.prep_rebalance();

    this.pondo_delegator4.signer = this.signer;
    this.pondo_delegator4.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator4.prep_rebalance();

    this.pondo_delegator5.signer = this.signer;
    this.pondo_delegator5.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator5.prep_rebalance();

    return this.finalize_prep_rebalance();
  }

  finalize_prep_rebalance() {
    // Confirm that rebalancing is allowed
    // Rebalance is allowed during the first day of a new epoch
    let current_epoch: bigint = BigInt.asUintN(
      32,
      this.block.height / this.BLOCKS_PER_EPOCH
    );
    let last_rebalance: bigint = BigInt.asUintN(
      32,
      this.last_rebalance_epoch.get(BigInt('0')) || BigInt('4294967295')
    );
    // Update last rebalance epoch
    assert(
      current_epoch > last_rebalance,
      'make sure we are not rebalancing twice in the same epoch'
    );
    this.last_rebalance_epoch.set(BigInt('0'), current_epoch);

    let blocks_into_epoch: bigint = BigInt.asUintN(
      32,
      this.block.height % this.BLOCKS_PER_EPOCH
    );
    assert(
      blocks_into_epoch < this.REBALANCE_PERIOD ||
        last_rebalance == BigInt('4294967295'),
      'rebalance is allowed during the first day of a new epoch'
    );

    let top_validators: string[] = this.pondo_oracle.top_validators.get(
      BigInt('0')
    ) || [
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
    ];
    let default_datum: validator_datum = {
      delegator:
        'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      validator:
        'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc',
      block_height: BigInt('0'),
      bonded_microcredits: BigInt('0'),
      microcredits_yield_per_epoch: BigInt('0'),
      commission: BigInt('0'),
      boost: BigInt('0'),
    };
    let validator1: validator_datum =
      this.pondo_oracle.validator_data.get(top_validators[0]) || default_datum;
    let validator2: validator_datum =
      this.pondo_oracle.validator_data.get(top_validators[1]) || default_datum;
    let validator3: validator_datum =
      this.pondo_oracle.validator_data.get(top_validators[2]) || default_datum;
    let validator4: validator_datum =
      this.pondo_oracle.validator_data.get(top_validators[3]) || default_datum;
    let validator5: validator_datum =
      this.pondo_oracle.validator_data.get(top_validators[4]) || default_datum;

    let next_validator_set: validator_state[] = [
      { validator: validator1.validator, commission: validator1.commission },
      { validator: validator2.validator, commission: validator2.commission },
      { validator: validator3.validator, commission: validator3.commission },
      { validator: validator4.validator, commission: validator4.commission },
      { validator: validator5.validator, commission: validator5.commission },
    ];
    this.validator_set.set(this.NEXT_VALIDATOR_SET, next_validator_set);
  }

  rebalance_retrieve_credits(
    transfer_amounts: bigint[],
    commission_mint: bigint
  ) {
    this.pondo_delegator1.signer = this.signer;
    this.pondo_delegator1.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator1.transfer_to_core_protocol(transfer_amounts[0]);

    this.pondo_delegator2.signer = this.signer;
    this.pondo_delegator2.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator2.transfer_to_core_protocol(transfer_amounts[1]);

    this.pondo_delegator3.signer = this.signer;
    this.pondo_delegator3.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator3.transfer_to_core_protocol(transfer_amounts[2]);

    this.pondo_delegator4.signer = this.signer;
    this.pondo_delegator4.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator4.transfer_to_core_protocol(transfer_amounts[3]);

    this.pondo_delegator5.signer = this.signer;
    this.pondo_delegator5.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator5.transfer_to_core_protocol(transfer_amounts[4]);

    this.pondo_staked_aleo_token.signer = this.signer;
    this.pondo_staked_aleo_token.caller = 'pondo_core_protocol.aleo';
    this.pondo_staked_aleo_token.mint_public(
      commission_mint,
      'pondo_token.aleo'
    );

    return this.finalize_rebalance_retrieve_credits(
      transfer_amounts,
      commission_mint
    );
  }

  finalize_rebalance_retrieve_credits(
    transfer_amounts: bigint[],
    commission_mint: bigint
  ) {
    let full_balance: bigint = BigInt.asUintN(
      64,
      transfer_amounts[0] +
        transfer_amounts[1] +
        transfer_amounts[2] +
        transfer_amounts[3] +
        transfer_amounts[4]
    );
    let current_balance: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.DELEGATED_BALANCE)!
    );
    assert(current_balance !== undefined);

    let current_owed_commission: bigint = BigInt.asUintN(
      64,
      this.owed_commission.get(BigInt('0'))!
    );
    assert(current_owed_commission !== undefined);
    // Total pALEO minted, including owed commission, minus the commission minted in the transition
    let total_paleo_minted: bigint = BigInt.asUintN(
      128,
      this.multi_token_support_program.registered_tokens.get(
        this.PALEO_TOKEN_ID
      )!.supply +
        current_owed_commission -
        commission_mint
    );
    assert(total_paleo_minted !== undefined);

    let rewards: bigint = BigInt.asIntN(
      64,
      full_balance > current_balance
        ? full_balance - current_balance
        : BigInt('0')
    );
    let new_commission: bigint = BigInt.asUintN(
      64,
      this.inline_get_commission(rewards, this.PROTOCOL_FEE)
    );
    current_balance += rewards - new_commission;

    // Update balances and owed commission
    // At this point, all credits have been transferred to the core protocol, but there may still be commission owed
    let core_protocol_account: bigint = BigInt.asUintN(
      64,
      this.credits.account.get(this.address) || BigInt('0')
    );
    let reserved_for_withdrawal: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.CLAIMABLE_WITHDRAWALS)!
    );
    assert(reserved_for_withdrawal !== undefined);
    let deposit_pool: bigint = BigInt.asUintN(
      64,
      core_protocol_account - full_balance - reserved_for_withdrawal
    );

    let new_commission_paleo: bigint = BigInt.asUintN(
      64,
      this.inline_calculate_new_paleo(
        current_balance,
        deposit_pool,
        new_commission,
        total_paleo_minted
      )
    );
    // New owed commission is whatever commission is left after the new commission mint, plus what we may have earned between calling the function and now
    this.owed_commission.set(
      BigInt('0'),
      current_owed_commission + new_commission_paleo - commission_mint
    );
    // Update total balance
    this.balances.set(this.DELEGATED_BALANCE, current_balance + new_commission);

    // Move bonded withdrawals to available to claim
    let current_epoch: bigint = BigInt.asUintN(
      32,
      this.block.height / this.BLOCKS_PER_EPOCH
    );
    //  Process withdrawals from the previous epoch
    let current_withdrawal_batch: bigint = BigInt.asUintN(
      64,
      this.withdrawal_batches.get(current_epoch - BigInt('1')) || BigInt('0')
    );
    this.balances.set(
      this.CLAIMABLE_WITHDRAWALS,
      reserved_for_withdrawal + current_withdrawal_batch
    );

    // Update bonded withdrawals
    let bonded_withdrawals: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.BONDED_WITHDRAWALS)!
    );
    assert(bonded_withdrawals !== undefined);
    this.balances.set(
      this.BONDED_WITHDRAWALS,
      bonded_withdrawals - current_withdrawal_batch
    );

    // Update protocol state
    this.protocol_state.set(this.PROTOCOL_STATE_KEY, this.REBALANCING_STATE);
  }

  rebalance_redistribute(
    validators: validator_state[],
    transfer_amounts: bigint[]
  ) {
    // Transfer to each delegator and set validator

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public('pondo_delegator1.aleo', transfer_amounts[0]);

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public('pondo_delegator2.aleo', transfer_amounts[1]);

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public('pondo_delegator3.aleo', transfer_amounts[2]);

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public('pondo_delegator4.aleo', transfer_amounts[3]);

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_core_protocol.aleo';
    this.credits.transfer_public('pondo_delegator5.aleo', transfer_amounts[4]);

    this.pondo_delegator1.signer = this.signer;
    this.pondo_delegator1.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator1.set_validator(
      validators[0].validator,
      validators[0].commission
    );

    this.pondo_delegator2.signer = this.signer;
    this.pondo_delegator2.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator2.set_validator(
      validators[1].validator,
      validators[1].commission
    );

    this.pondo_delegator3.signer = this.signer;
    this.pondo_delegator3.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator3.set_validator(
      validators[2].validator,
      validators[2].commission
    );

    this.pondo_delegator4.signer = this.signer;
    this.pondo_delegator4.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator4.set_validator(
      validators[3].validator,
      validators[3].commission
    );

    this.pondo_delegator5.signer = this.signer;
    this.pondo_delegator5.caller = 'pondo_core_protocol.aleo';
    this.pondo_delegator5.set_validator(
      validators[4].validator,
      validators[4].commission
    );

    return this.finalize_rebalance_redistribute(validators, transfer_amounts);
  }

  finalize_rebalance_redistribute(
    validators: validator_state[],
    transfer_amounts: bigint[]
  ) {
    // Check that the new validator set is correct
    let next_validator_set: validator_state[] = this.validator_set.get(
      this.NEXT_VALIDATOR_SET
    )!;
    this.validator_set.set(this.CURRENT_VALIDATOR_SET, next_validator_set);
    this.validator_set.delete(this.NEXT_VALIDATOR_SET);
    for (let i: number = 0; i < 5; i++) {
      assert(
        validators[i].validator == next_validator_set[i].validator &&
          validators[i].commission == next_validator_set[i].commission,
        'ensure that the new validator set is correct'
      );
    }
    // Check that each validator has the correct portion of credits
    let delegator_allocation: bigint[] =
      this.pondo_oracle.delegator_allocation.get(BigInt('0')) || [
        this.PORTION_1,
        this.PORTION_2,
        this.PORTION_3,
        this.PORTION_4,
        this.PORTION_5,
        this.PORTION_5,
        this.PORTION_5,
        this.PORTION_5,
        this.PORTION_5,
        this.PORTION_5,
      ];
    let total_credits: bigint = BigInt.asUintN(
      64,
      transfer_amounts[0] +
        transfer_amounts[1] +
        transfer_amounts[2] +
        transfer_amounts[3] +
        transfer_amounts[4]
    );
    let total_credits_128: bigint = BigInt.asUintN(128, total_credits);
    let validator1_portion: bigint = BigInt.asUintN(
      128,
      (transfer_amounts[0] * this.PRECISION_UNSIGNED) / total_credits_128
    );
    let validator2_portion: bigint = BigInt.asUintN(
      128,
      (transfer_amounts[1] * this.PRECISION_UNSIGNED) / total_credits_128
    );
    let validator3_portion: bigint = BigInt.asUintN(
      128,
      (transfer_amounts[2] * this.PRECISION_UNSIGNED) / total_credits_128
    );
    let validator4_portion: bigint = BigInt.asUintN(
      128,
      (transfer_amounts[3] * this.PRECISION_UNSIGNED) / total_credits_128
    );
    let validator5_portion: bigint = BigInt.asUintN(
      128,
      (transfer_amounts[4] * this.PRECISION_UNSIGNED) / total_credits_128
    );
    assert(validator1_portion == delegator_allocation[0]);
    assert(validator2_portion == delegator_allocation[1]);
    assert(validator3_portion == delegator_allocation[2]);
    assert(validator4_portion == delegator_allocation[3]);
    assert(validator5_portion == delegator_allocation[4]);

    // Check that there's still enough account balance left for pending withdrawals
    let account_balance: bigint = BigInt.asUintN(
      64,
      this.credits.account.get(this.address) || BigInt('0')
    );
    let reserved_for_withdrawal: bigint = BigInt.asUintN(
      64,
      this.balances.get(this.CLAIMABLE_WITHDRAWALS)!
    );
    assert(reserved_for_withdrawal !== undefined);
    let liquidity_pool: bigint = BigInt.asUintN(
      64,
      account_balance - reserved_for_withdrawal
    );
    let optimal_liquidity: bigint = BigInt.asUintN(
      64,
      this.inline_calculate_optimal_liquidity(total_credits_128)
    );
    assert(
      liquidity_pool >= optimal_liquidity,
      'ensure that liquidity pool is at least optimal liquidity'
    );
    assert(
      liquidity_pool <= optimal_liquidity + BigInt('250'),
      'ensure that liquidity pool is close to optimal liquidity'
    );

    // Update delegated balance
    this.balances.set(this.DELEGATED_BALANCE, total_credits);

    // Update protocol state
    this.protocol_state.set(this.PROTOCOL_STATE_KEY, this.NORMAL_STATE);
  }

  // A crank to set the oracle tvl
  set_oracle_tvl(tvl: bigint) {
    this.pondo_oracle.signer = this.signer;
    this.pondo_oracle.caller = 'pondo_core_protocol.aleo';
    this.pondo_oracle.set_pondo_tvl(tvl);

    return this.finalize_set_oracle_tvl(tvl);
  }

  finalize_set_oracle_tvl(tvl: bigint) {
    // Ensure the tvl matches what exists in the core protocol
    // Get all of the delegator balances
    let delegator1_balance: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator1.aleo') || BigInt('0')
    );
    let delegator2_balance: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator2.aleo') || BigInt('0')
    );
    let delegator3_balance: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator3.aleo') || BigInt('0')
    );
    let delegator4_balance: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator4.aleo') || BigInt('0')
    );
    let delegator5_balance: bigint = BigInt.asUintN(
      64,
      this.credits.account.get('pondo_delegator5.aleo') || BigInt('0')
    );
    // Get all of the bonded balances
    let default_bond_state: bond_state = {
      validator: this.address,
      microcredits: BigInt('0'),
    };
    let delegator1_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator1.aleo')?.microcredits ||
        default_bond_state?.microcredits
    );
    let delegator2_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator2.aleo')?.microcredits ||
        default_bond_state?.microcredits
    );
    let delegator3_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator3.aleo')?.microcredits ||
        default_bond_state?.microcredits
    );
    let delegator4_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator4.aleo')?.microcredits ||
        default_bond_state?.microcredits
    );
    let delegator5_bonded: bigint = BigInt.asUintN(
      64,
      this.credits.bonded.get('pondo_delegator5.aleo')?.microcredits ||
        default_bond_state?.microcredits
    );
    // Get all of the unbonding balances
    let default_unbond_state: unbond_state = {
      microcredits: BigInt('0'),
      height: BigInt('0'),
    };
    let delegator1_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator1.aleo')?.microcredits ||
        default_unbond_state?.microcredits
    );
    let delegator2_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator2.aleo')?.microcredits ||
        default_unbond_state?.microcredits
    );
    let delegator3_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator3.aleo')?.microcredits ||
        default_unbond_state?.microcredits
    );
    let delegator4_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator4.aleo')?.microcredits ||
        default_unbond_state?.microcredits
    );
    let delegator5_unbonding: bigint = BigInt.asUintN(
      64,
      this.credits.unbonding.get('pondo_delegator5.aleo')?.microcredits ||
        default_unbond_state?.microcredits
    );
    // Get the core protocol balance
    let core_protocol_balance: bigint = BigInt.asUintN(
      64,
      this.credits.account.get(this.address) || BigInt('0')
    );

    // Calculate the total tvl
    let total_tvl: bigint = BigInt.asUintN(
      64,
      delegator1_balance +
        delegator2_balance +
        delegator3_balance +
        delegator4_balance +
        delegator5_balance +
        delegator1_bonded +
        delegator2_bonded +
        delegator3_bonded +
        delegator4_bonded +
        delegator5_bonded +
        core_protocol_balance +
        delegator1_unbonding +
        delegator2_unbonding +
        delegator3_unbonding +
        delegator4_unbonding +
        delegator5_unbonding
    );

    assert(
      total_tvl >= (tvl * BigInt('98')) / BigInt('100') &&
        total_tvl <= (tvl * BigInt('102')) / BigInt('100'),
      'Assert that the total tvl matches the tvl provided within a margin of error of 2%'
    );
  }
}
