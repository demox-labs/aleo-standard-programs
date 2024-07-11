import { Token } from './multi_token_support_program';
import { pondo_oracleProgram } from './pondo_oracle';
import { creditsProgram } from './credits';

import assert from 'assert';
// interfaces
export interface committee_state {
  is_open: boolean;
  commission: bigint;
}
export interface validator_state {
  validator: string;
  commission: bigint;
}
export class pondo_delegator4Program {
  signer: string = "not set";
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  banned_validators: Map<string, boolean> = new Map();
  validator_mapping: Map<bigint, validator_state> = new Map();
  state_mapping: Map<bigint, bigint> = new Map();
  MAX_COMMISSION = BigInt("50");
  MAX_COMMISSION_INCREASE = BigInt("10");
  TERMINAL = BigInt("4");
  UNBONDING = BigInt("3");
  UNBOND_ALLOWED = BigInt("2");
  UNBOND_NOT_ALLOWED = BigInt("1");
  BOND_ALLOWED = BigInt("0");
  pondo_oracle: pondo_oracleProgram;
  credits: creditsProgram;
  constructor(
    // constructor args
    pondo_oracleContract: pondo_oracleProgram,
    creditsContract: creditsProgram,
  ) {
    // constructor body
    this.pondo_oracle = pondo_oracleContract;
    this.credits = creditsContract;
  }
  // The 'delegator' program.

  //program pondo_delegator4.aleo {// There are 4 potential states for a delegator:
// 1. 0u8 => Is allowed to bond
// 2. 1u8 => Is not allowed to unbond
// 3. 2u8 => Is allowed to unbond
// 4. 3u8 => Is unbonding
// 5. 4u8 => Delegator only has balance in credits.aleo/account and is not allowed to bond

// The maximum increase in commission allowed before a validator is banned


// Transitions:
// 0 -> 1 done permissionless through bond
// 1 -> 2 done by core protocol
// 2 -> 3 done permissionless through unbond
// 3 -> 4 done permissionless through record_claim
// 4 -> 0 done by core protocol
// 1 -> 4 done in edge case by forcible unbond by validator

// shadowed from credits.aleo

  initialize(
  ) {
// Assert that the caller is the pondo core protocol
    assert(this.caller === "pondo_core_protocol.aleo");

    return this.finalize_initialize();
    }

  finalize_initialize(
  ) {
    this.state_mapping.set(BigInt("0"), this.TERMINAL);
    }

  set_state(
    new_state: bigint,
  ) {
// Assert that the caller is the pondo core protocol
    assert(this.caller === "pondo_core_protocol.aleo");

// Assert that the state is only of the valid options
    assert(new_state == this.BOND_ALLOWED || new_state == this.UNBOND_ALLOWED);

    return this.finalize_set_state(new_state);
    }

  finalize_set_state(
    new_state: bigint,
  ) {
    let current_state: bigint = this.state_mapping.get(BigInt("0"))!;
    if (current_state == this.UNBOND_NOT_ALLOWED) {
    assert(new_state == this.UNBOND_ALLOWED);
    }

    if (current_state == this.TERMINAL) {
    assert(new_state == this.BOND_ALLOWED);
    }

    this.state_mapping.set(BigInt("0"), new_state);
    }

  set_validator(
    new_validator: string,
    new_commission: bigint,
  ) {
// Assert that the caller is the pondo core protocol
    assert(this.caller === "pondo_core_protocol.aleo");

    return this.finalize_set_validator(new_validator, new_commission);
    }

  finalize_set_validator(
    new_validator: string,
    new_commission: bigint,
  ) {
// Set the new validator
    let next_validator_state: validator_state = {
    validator: new_validator,
    commission: new_commission
    };
    this.validator_mapping.set(BigInt("0"), next_validator_state);

// Ensure the delegator is in the correct state
    let current_state: bigint = this.state_mapping.get(BigInt("0"))!;
    assert(current_state == this.TERMINAL);

    this.state_mapping.set(BigInt("0"), this.BOND_ALLOWED);
    }

  bond(
    validator: string,
    amount: bigint,
  ) {
    this.credits.caller = "pondo_delegator4.aleo";
    this.credits.bond_public(validator, "pondo_delegator4.aleo", amount);

    return this.finalize_bond(validator);
    }

  finalize_bond(
    validator: string,
  ) {


    let current_validator_state: validator_state = this.validator_mapping.get(BigInt("0"))!;
    assert(validator === current_validator_state.validator);

    let balance: bigint = this.credits.account.get("pondo_delegator4.aleo")!;
    assert(balance === BigInt("0"));

    let current_state: bigint = this.state_mapping.get(BigInt("0"))!;
    assert(current_state == this.BOND_ALLOWED || current_state == this.UNBOND_NOT_ALLOWED);

    this.state_mapping.set(BigInt("0"), this.UNBOND_NOT_ALLOWED);
    }

// Unbond the delegator fully
// This is a permissionless call
// It can only be called if the delegator is in the UNBOND_ALLOWED state
// Or if the validator commission changed while the delegator was bonded
  unbond(
    amount: bigint,
  ) {
// Unbond the delegator, only works if there's actually something to unbond
    this.credits.caller = "pondo_delegator4.aleo";
    this.credits.unbond_public("pondo_delegator4.aleo", amount);

    return this.finalize_unbond();
    }

  finalize_unbond(
  ) {


// Should be entirely unbonded
    let bonded: boolean = this.credits.bonded.has("pondo_delegator4.aleo");
    assert(bonded === false);

// Get the current validator state
    let current_validator_state: validator_state = this.validator_mapping.get(BigInt("0"))!;
// Get the committee state of the new validator
    let default_committee_state: committee_state = {
    is_open: true,
    commission: BigInt("0")
    };
    let validator_committee_state: committee_state = this.credits.committee.get(current_validator_state.validator) || default_committee_state;
// Check if the commission increased by more than the allowed amount
    let commission_increased: boolean = current_validator_state.commission > (validator_committee_state.commission + this.MAX_COMMISSION_INCREASE);
    let commission_beyond_limit: boolean = current_validator_state.commission > this.MAX_COMMISSION;

// If the commission changed, ban the validator, otherwise ensure the delegator is in the correct state
    if (commission_increased || commission_beyond_limit) {
    this.banned_validators.set(current_validator_state.validator, true);
    } else {
    let current_state: bigint = this.state_mapping.get(BigInt("0"))!;
    assert(current_state === this.UNBOND_ALLOWED);
    }

// Set the state to unbonding
    this.state_mapping.set(BigInt("0"), this.UNBONDING);
    }

// Assume someone called claim_unbond_public
  terminal_state(
  ) {
    return this.finalize_terminal_state();
    }

  finalize_terminal_state(
  ) {
    let bonded: boolean = this.credits.bonded.has("pondo_delegator4.aleo");
    assert(bonded === false);
    let is_unbonding: boolean = this.credits.unbonding.has("pondo_delegator4.aleo");
    assert(is_unbonding === false);

    let current_state: bigint = this.state_mapping.get(BigInt("0"))!;
    assert(current_state != this.BOND_ALLOWED);

    if (current_state == this.UNBOND_NOT_ALLOWED) {
    let current_validator_state: validator_state = this.validator_mapping.get(BigInt("0"))!;
    this.banned_validators.set(current_validator_state.validator, true);
    }

    this.state_mapping.set(BigInt("0"), this.TERMINAL);
    }

  transfer_to_core_protocol(
    amount: bigint,
  ) {
// Assert that the caller is the pondo core protocol
    assert(this.caller === "pondo_core_protocol.aleo");

    this.credits.caller = "pondo_delegator4.aleo";
    this.credits.transfer_public("pondo_core_protocol.aleo", amount);

    return this.finalize_transfer_to_core_protocol();
    }

  finalize_transfer_to_core_protocol(
  ) {


    let balance: bigint = this.credits.account.get("pondo_delegator4.aleo")!;
    assert(balance === BigInt("0"));

    let current_state: bigint = this.state_mapping.get(BigInt("0"))!;
    assert(current_state === this.TERMINAL);
    }

  bond_failed(
  ) {
    return this.finalize_bond_failed();
    }

  finalize_bond_failed(
  ) {
    let bonded: boolean = this.credits.bonded.has("pondo_delegator4.aleo");
    assert(bonded === false);
    let is_unbonding: boolean = this.credits.unbonding.has("pondo_delegator4.aleo");
    assert(is_unbonding === false);

    let current_validator_state: validator_state = this.validator_mapping.get(BigInt("0"))!;
// Bonding always succeeds if the validator isn't in the committee given a sufficient balance
    let validator_committee_state: committee_state = this.credits.committee.get(current_validator_state.validator)!;
    let validator_is_unbonding: boolean = this.credits.unbonding.has(current_validator_state.validator);
// The two conditions that would prevent a valid bond are:
// 1. The validator is closed to delegators
// 2. The validator is unbonding
    assert(validator_committee_state.is_open == false || validator_is_unbonding);

    let current_state: bigint = this.state_mapping.get(BigInt("0"))!;
    assert(current_state == this.BOND_ALLOWED);

    this.state_mapping.set(BigInt("0"), this.TERMINAL);

// If the validator is closed to delegators, ban the validator
    if (validator_committee_state.is_open == false) {
    this.banned_validators.set(current_validator_state.validator, true);
    }
    }

  insufficient_balance(
  ) {
    return this.finalize_insufficient_balance();
    }

  finalize_insufficient_balance(
  ) {
    let bonded: boolean = this.credits.bonded.has("pondo_delegator4.aleo");
    assert(bonded === false);
    let is_unbonding: boolean = this.credits.unbonding.has("pondo_delegator4.aleo");
    assert(is_unbonding === false);

    let balance: bigint = this.credits.account.get("pondo_delegator4.aleo")!;
    assert(balance < BigInt("10000000000"));

    let current_state: bigint = this.state_mapping.get(BigInt("0"))!;
    assert(current_state == this.BOND_ALLOWED);

    this.state_mapping.set(BigInt("0"), this.TERMINAL);
    }

  ban_validator(
    validator: string,
  ) {
    this.pondo_oracle.caller = "pondo_delegator4.aleo";
    this.pondo_oracle.pondo_ban_validator(validator);
    return this.finalize_ban_validator(validator);
    }

  finalize_ban_validator(
    validator: string,
  ) {


    assert(this.banned_validators.has(validator));
    }
    }
