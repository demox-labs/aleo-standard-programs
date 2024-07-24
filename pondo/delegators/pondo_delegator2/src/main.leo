// The 'delegator' program.
import credits.aleo;
import pondo_oracle.aleo;

program pondo_delegator2.aleo {
  // There are 4 potential states for a delegator:
  // 1. 0u8 => Is allowed to bond
  // 2. 1u8 => Is not allowed to unbond
  // 3. 2u8 => Is allowed to unbond
  // 4. 3u8 => Is unbonding
  // 5. 4u8 => Delegator only has balance in credits.aleo/account and is not allowed to bond
  const BOND_ALLOWED: u8 = 0u8;
  const UNBOND_NOT_ALLOWED: u8 = 1u8;
  const UNBOND_ALLOWED: u8 = 2u8;
  const UNBONDING: u8 = 3u8;
  const TERMINAL: u8 = 4u8;

  // The maximum increase in commission allowed before a validator is banned
  const MAX_COMMISSION_INCREASE: u8 = 10u8;
  const MAX_COMMISSION: u8 = 50u8;

  struct validator_state {
    validator: address,
    commission: u8
  }

  // Transitions:
  // 0 -> 1 done permissionless through bond
  // 1 -> 2 done by core protocol
  // 2 -> 3 done permissionless through unbond
  // 3 -> 4 done permissionless through record_claim
  // 4 -> 0 done by core protocol
  // 1 -> 4 done in edge case by forcible unbond by validator
  mapping state_mapping: u8 => u8;
  mapping validator_mapping: u8 => validator_state;
  mapping banned_validators: address => bool;

  // shadowed from credits.aleo
  struct committee_state {
    is_open: bool,
    commission: u8
  }

  async transition initialize() -> Future {
    assert_eq(self.caller, pondo_core_protocol.aleo);  // Assert that the caller is the pondo core protocol

    return finalize_initialize();
  }

  async function finalize_initialize() {
    state_mapping.set(0u8, TERMINAL);
  }

  async transition prep_rebalance(
  ) -> Future {
    assert_eq(self.caller, pondo_core_protocol.aleo);  // Assert that the caller is the pondo core protocol

    return finalize_prep_rebalance();
  }

  async function finalize_prep_rebalance() {
    let current_state: u8 = state_mapping.get(0u8);

    assert(current_state != BOND_ALLOWED); // Ensure the delegator is not in the BOND_ALLOWED state
    assert(current_state != UNBONDING); // Ensure the delegator is not in the UNBOND_NOT_ALLOWED state
    
    if (current_state == UNBOND_NOT_ALLOWED) {
      state_mapping.set(0u8, UNBOND_ALLOWED);
    }
  }

  async transition set_validator(
    public new_validator: address,
    public new_commission: u8
  ) -> Future {
    assert_eq(self.caller, pondo_core_protocol.aleo);  // Assert that the caller is the pondo core protocol
    assert(new_commission <= MAX_COMMISSION); // Ensure the commission is within the allowed range

    return finalize_set_validator(new_validator, new_commission);
  }

  async function finalize_set_validator(
    new_validator: address,
    new_commission: u8
  ) {
    // Set the new validator
    let next_validator_state: validator_state = validator_state {
      validator: new_validator,
      commission: new_commission
    };
    validator_mapping.set(0u8, next_validator_state);

    // Ensure the delegator is in the correct state
    let current_state: u8 = state_mapping.get(0u8);
    assert(current_state == TERMINAL); // Ensure the delegator is in the TERMINAL state

    state_mapping.set(0u8, BOND_ALLOWED);
  }

  async transition bond(
    public validator: address,
    public amount: u64
  ) -> Future {
    let f0: Future = credits.aleo/bond_public(validator, pondo_delegator2.aleo, amount);

    return finalize_bond(validator, f0);
  }

  async function finalize_bond(
    validator: address,
    f0: Future
  ) {
    f0.await();

    let current_validator_state: validator_state = validator_mapping.get(0u8);
    assert_eq(validator, current_validator_state.validator); // Ensure we're bonding to the correct validator

    let balance: u64 = credits.aleo/account.get(pondo_delegator2.aleo);
    assert_eq(balance, 0u64); // Ensure the delegator is bonded completely

    let current_state: u8 = state_mapping.get(0u8);
    assert(current_state == BOND_ALLOWED || current_state == UNBOND_NOT_ALLOWED); // Ensure the delegator is in the correct state

    state_mapping.set(0u8, UNBOND_NOT_ALLOWED);
  }

  // Unbond the delegator fully
  // This is a permissionless call
  // It can only be called if the delegator is in the UNBOND_ALLOWED state
  // Or if the validator commission changed while the delegator was bonded
  async transition unbond(public amount: u64) -> Future {
    // Unbond the delegator, only works if there's actually something to unbond
    let f0: Future = credits.aleo/unbond_public(pondo_delegator2.aleo, amount);

    return finalize_unbond(f0);
  }

  async function finalize_unbond(
    f0: Future
  ) {
    f0.await();

    // Should be entirely unbonded
    let bonded: bool = credits.aleo/bonded.contains(pondo_delegator2.aleo);
    assert_eq(bonded, false); // Ensure the delegator was completely unbonded

    // Get the current validator state
    let current_validator_state: validator_state = validator_mapping.get(0u8);
    // Get the committee state of the new validator
    let default_committee_state: committee_state = committee_state {
      is_open: true,
      commission: 0u8
    };
    let validator_committee_state: committee_state = credits.aleo/committee.get_or_use(current_validator_state.validator, default_committee_state);
    // Check if the commission increased by more than the allowed amount
    let commission_increased: bool = validator_committee_state.commission > (current_validator_state.commission + MAX_COMMISSION_INCREASE);
    let commission_beyond_limit: bool = validator_committee_state.commission > MAX_COMMISSION;

    // If the commission changed, ban the validator, otherwise ensure the delegator is in the correct state
    if (commission_increased || commission_beyond_limit) {
      banned_validators.set(current_validator_state.validator, true);
    } else {
      let current_state: u8 = state_mapping.get(0u8);
      assert_eq(current_state, UNBOND_ALLOWED); // Ensure the delegator is allowed to unbond
    }

    // Set the state to unbonding
    state_mapping.set(0u8, UNBONDING);
  }

  // Assume someone called claim_unbond_public
  async transition terminal_state() -> Future {
    return finalize_terminal_state();
  }

  async function finalize_terminal_state() {
    let bonded: bool = credits.aleo/bonded.contains(pondo_delegator2.aleo);
    assert_eq(bonded, false); // Ensure the delegator was completely unbonded
    let is_unbonding: bool = credits.aleo/unbonding.contains(pondo_delegator2.aleo);
    assert_eq(is_unbonding, false); // Ensure the delegator is no longer unbonding

    let current_state: u8 = state_mapping.get(0u8);
    assert(current_state != BOND_ALLOWED); // Ensure the delegator is not in the BOND_ALLOWED state

    if (current_state == UNBOND_NOT_ALLOWED) {
      let current_validator_state: validator_state = validator_mapping.get(0u8);
      banned_validators.set(current_validator_state.validator, true);
    }

    state_mapping.set(0u8, TERMINAL);
  }

  async transition transfer_to_core_protocol(public amount: u64) -> Future {
    assert_eq(self.caller, pondo_core_protocol.aleo);  // Assert that the caller is the pondo core protocol

    let f0: Future = credits.aleo/transfer_public(pondo_core_protocol.aleo, amount);

    return finalize_transfer_to_core_protocol(f0);
  }

  async function finalize_transfer_to_core_protocol(
    f0: Future
  ) {
    f0.await();

    let balance: u64 = credits.aleo/account.get(pondo_delegator2.aleo);
    assert_eq(balance, 0u64); // Ensure all the funds were transferred

    let current_state: u8 = state_mapping.get(0u8);
    assert_eq(current_state, TERMINAL); // Ensure the delegator is in the TERMINAL state
  }

  async transition bond_failed() -> Future {
    return finalize_bond_failed();
  }

  async function finalize_bond_failed() {
    let bonded: bool = credits.aleo/bonded.contains(pondo_delegator2.aleo);
    assert_eq(bonded, false); // Ensure the delegator was not bonded
    let is_unbonding: bool = credits.aleo/unbonding.contains(pondo_delegator2.aleo);
    assert_eq(is_unbonding, false); // Ensure the delegator is not unbonding

    let current_validator_state: validator_state = validator_mapping.get(0u8);
    // Bonding always succeeds if the validator isn't in the committee given a sufficient balance
    let validator_committee_state: committee_state = credits.aleo/committee.get(current_validator_state.validator);
    let validator_is_unbonding: bool = credits.aleo/unbonding.contains(current_validator_state.validator);
    // The two conditions that would prevent a valid bond are:
    // 1. The validator is closed to delegators
    // 2. The validator is unbonding
    assert(validator_committee_state.is_open == false || validator_is_unbonding); // Ensure the validator is closed to delegators or unbonding

    let current_state: u8 = state_mapping.get(0u8);
    assert(current_state == BOND_ALLOWED); // Ensure the delegator was in the BOND_ALLOWED state

    state_mapping.set(0u8, TERMINAL);

    // If the validator is closed to delegators, ban the validator
    if (validator_committee_state.is_open == false) {
      banned_validators.set(current_validator_state.validator, true);
    }
  }

  async transition insufficient_balance() -> Future {
    return finalize_insufficient_balance();
  }

  async function finalize_insufficient_balance() {
    let bonded: bool = credits.aleo/bonded.contains(pondo_delegator2.aleo);
    assert_eq(bonded, false); // Ensure the delegator was not bonded
    let is_unbonding: bool = credits.aleo/unbonding.contains(pondo_delegator2.aleo);
    assert_eq(is_unbonding, false); // Ensure the delegator is not unbonding

    let balance: u64 = credits.aleo/account.get(pondo_delegator2.aleo);
    assert(balance < 10_000_000_000u64); // Ensure the balance is less than the minimum required to bond

    let current_state: u8 = state_mapping.get(0u8);
    assert(current_state == BOND_ALLOWED); // Ensure the delegator was in the BOND_ALLOWED state

    state_mapping.set(0u8, TERMINAL);
  }

  async transition ban_validator(
    public validator: address
  ) -> Future {
    let f0: Future = pondo_oracle.aleo/pondo_ban_validator(validator);
    return finalize_ban_validator(validator, f0);
  }

  async function finalize_ban_validator(
    validator: address,
    f0: Future
  ) {
    f0.await();

    assert(banned_validators.contains(validator)); // Ensure the validator was in the banned mapping
  }
}
