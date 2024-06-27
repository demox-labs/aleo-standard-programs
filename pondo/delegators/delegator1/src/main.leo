// The 'delegator' program.
import credits.aleo;

program delegator1.aleo {
    // There are 4 potential states for a delegator:
    // 1. 0u8 => Is allowed to bond
    // 2. 1u8 => Is not allowed to unbond
    // 3. 2u8 => Is allowed to unbond
    // 4. 3u8 => Is unbonding
    // 5. 4u8 => Delegator only has balance in credits.aleo/account and is not allowed to bond

    // Transitions:
    // 0 -> 1 done permissionless through bond
    // 1 -> 2 done by core protocol
    // 2 -> 3 done permissionless through unbond
    // 3 -> 0 done by core protocol
    // 1 -> 3 done in edge case by forcible unbond by validator
    mapping state_mapping: u8 => u8;
    mapping validator_mapping: u8 => address;

    async transition set_state(
      public new_state: u8
    ) -> Future {
      // Assert that the caller is the pondo core protocol
      assert_eq(self.caller, pondo_core_protocol.aleo);

      // Assert that the state is only of the valid options
      assert(new_state == 0u8 || new_state == 1u8 new_state == 2u8);

      return finalize_set_state(new_state);
    }

    async function finalize_set_state(
      new_state: u8
    ) {
      let current_state = state_mapping.get(0u8);
      if (current_state == 1u8) {
        assert(new_state == 2u8);
      }

      if (current_state == 3u8) {
        assert(new_state == 0u8);
      }

      assert(new_state != 1u8);
      assert(new_state != 3u8);

      Mapping::set(state_mapping, 0u8, new_state);
    }

    async transition set_validator(
      public new_validator: u8
    ) -> Future {
      // Assert that the caller is the pondo core protocol
      assert_eq(self.caller, pondo_core_protocol.aleo);

      return finalize_set_validator(new_validator);
    }

    async function finalize_set_validator(
      new_validator: u8
    ) {
      Mapping::set(validator_mapping, 0u8, new_validator);
    }

    async transition bond(public validator: address, public amount: u64) -> Future {
        let f0: Future = credits.aleo/bond_public(validator, pondo_core_protocol.aleo, amount);

        return finalize_bond(validator, f0);
    }

    async function finalize_bond(
      validator: address,
      f0: Future
    ) {
      f0.await();

      let current_validator: address = validator_mapping.get(0u8);
      assert_eq(validator, current_validator);

      let balance: u64 = credits.aleo/account.get(delegator1.aleo);
      assert_eq(balance, 0u64);

      let current_state: u8 = state_mapping.get(0u8);
      assert_eq(current_state, 0u8);

      state_mapping.set(0u8, 1u8);
    }

    async transition unbond(public amount: u64) -> Future {
        let f0: Future = credits.aleo/unbond_public(delegator1.aleo, amount);

        return finalize_unbond(f0);
    }

    async function finalize_unbond(
      f0: Future
    ) {
      f0.await();

      // Should be entirely unbonded
      let bonded: bool = credits.aleo/bonded.contains(delegator1.aleo);
      assert_eq(bonded, false);

      let current_state = state_mapping.get(0u8);
      assert_eq(current_state, 2u8);

      state_mapping.set(0u8, 3u8);
    }

    // Assume someone called claim_unbond_public
    async transition terminal_state() -> Future {
      return finalize_terminal_state();
    }

    async function finalize_terminal_state() {
      let bonded: bool = credits.aleo/bonded.contains(delegator1.aleo);
      assert_eq(bonded, false);
      let is_unbonding = credits.aleo/unbonding.contains(delegator1.aleo);
      assert_eq(is_unbonding, false);

      let current_state: u8 = state_mapping.get(0u8);
      assert(current_state != 0u8);

      state_mapping.set(0u8, 4u8);
    }

    async transition transfer_pondo(public amount: u64) -> Future {
      // Assert that the caller is the pondo core protocol
      assert_eq(self.caller, pondo_core_protocol.aleo);

      let f0: Future = credits.aleo/transfer_public(pondo_core_protocol.aleo, amount);

      return finalize_transfer_pondo(f0);
    }

    async function finalize_transfer_pondo(
      f0: Future
    ) {
      f0.await();

      let balance: u64 = credits.aleo/account.get(delegator1.aleo);
      assert_eq(balance, 0u64);

      let current_state = state_mapping.get(0u8);
      assert_eq(current_state, 4u8);
    }

    async transition bond_failed() -> Future {
      return finalize_bond_failed();
    }

    async function finalize_bond_failed() {
      let bonded: bool = credits.aleo/bonded.contains(delegator1.aleo);
      assert_eq(bonded, false);
      let is_unbonding = credits.aleo/unbonding.contains(delegator1.aleo);
      assert_eq(is_unbonding, false);

      let validator: address = validator_mapping.get(0u8);
      let validator_committee_state = credits.aleo/committee.get(validator);
      assert(validator_committee_state.is_open == false);

      let current_state: u8 = state_mapping.get(0u8);
      assert(current_state == 0u8);

      state_mapping.set(0u8, 4u8);
    }
}
