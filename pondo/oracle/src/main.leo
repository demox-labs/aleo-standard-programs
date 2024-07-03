import credits.aleo;

// TODO: 
// 1. Add a scaling waiting period for adding a new delegator
// 2. Add a direct way for a validator to ban themselves
// 3. Add boosting to the oracle


// The program to permissionless calculate the yield of reference delegators to validators
// Note: Many reference delegators for the same validator are supported
// This is to prevent any sort of DOS by competing validators running the reference delegator for other validators
program pondo_oracle.aleo {
  // Address of the approver who can manually check that reference delegators follow the intended specification
  const DELEGATOR_APPROVER_ADDRESS: address = aleo1am58znyhghvyj7lesu0h6wvxecxfhu8svdvgema6g5eqv7kecuzsm7z039;
  // The precision used to calculate the return per epoch
  const PRECISION: u128 = 10_000_000_000u128; // Equal to 10K credits
  // The number of blocks in an epoch
  const BLOCKS_PER_EPOCH: u32 = 120_960u32; // 1 week of blocks, assuming 5 sec per block
  // The number of blocks to not allow updates, so updates must happen in the last 1 day of an epoch
  const UPDATE_BLOCKS_DISALLOWED: u32 = 103_680u32; // 6 day of blocks, assuming 5 sec per block
  // The max allowable commission by the validators
  const MAX_COMMISSION: u8 = 50u8;

  // The data to store for each validator to calculate the return
  struct validator_datum {
    delegator: address,
    validator: address,
    block_height: u32,
    bonded_microcredits: u64,
    microcredits_yield_per_epoch: u128,
    commission: u8
  }

  // Shadow credits.aleo/bond_state
  struct bond_state {
    validator: address,
    microcredits: u64
  }

  // A mapping of the reference delegator to the validator address
  // It may contain unapproved reference delegators
  mapping delegator_to_validator: address => address;
  // A mapping of the delegator address to the tracked validator data
  // Only approved reference delegators will tracked
  mapping validator_data: address => validator_datum;
  // A mapping to store the list of top 10 validators as specified by the delegator
  // ie this is a list of delegators but the validators are guaranteed to be unique or the 0 group address
  mapping top_valdiators: u8 => [address; 10];
  // A mapping of banned validators
  mapping banned_validators: address => bool;
  // A mapping of the pondo total value locked
  mapping pondo_tvl: u8 => u64;

  // Called by the reference delegator program to establish that the reference delegator has been created
  // At this point, it hasn't been approved so we cannot trust that the reference delegator actually implements the program correctly
  async transition propose_delegator(
    public validator: address
  ) -> Future {
    // Ensure a program is calling
    assert_neq(self.caller, self.signer);

    return finalize_propose_delegator(self.caller, validator);
  }

  async function finalize_propose_delegator(
    public reference_delegator: address,
    public validator: address
  ) {
    // Ensure the validator isn't banned
    let is_banned: bool = banned_validators.contains(validator);
    assert_eq(is_banned, false);

    let contains_delegator: bool = delegator_to_validator.contains(reference_delegator);
    assert_eq(contains_delegator, false);

    delegator_to_validator.set(reference_delegator, validator);
  }

  // To be called by the delegator approver who will have to ensure offchain that the delegator meets the requirements to be considered a reference delegator
  // The only requirement is that reference delegator meets the exact standard set by reference_delegator.aleo
  async transition add_delegator(
    public delegator: address
  ) -> Future {
    assert_eq(self.caller, DELEGATOR_APPROVER_ADDRESS);

    return finalize_add_delegator(delegator);
  }

  async function finalize_add_delegator(
    public delegator: address
  ) {
    // Check that proposed_reference_delegator contains the reference delegator
    let contains_delegator: bool = delegator_to_validator.contains(delegator);
    assert_eq(contains_delegator, true);

    // Ensure the withdrawal address is the same program address
    let withdraw_address: address = credits.aleo/withdraw.get(delegator);
    assert_eq(withdraw_address, delegator);

    // Get the validator address and ensure the delegator is bonded to the validator
    let proposed_validator_address: address = delegator_to_validator.get(delegator);
    let bonded: bond_state = credits.aleo/bonded.get(delegator);
    assert_eq(bonded.validator, proposed_validator_address);

    // Ensure the validator isn't banned
    let is_banned: bool = banned_validators.contains(proposed_validator_address);
    assert_eq(is_banned, false);

    // Ensure the reference delegator is not already part of the reference delegators
    let contains_validator_reference: bool = validator_data.contains(proposed_validator_address);
    assert_eq(contains_validator_reference, false);

    // Get the commission from the committee state
    let validator_committee_state: committee_state = credits.aleo/committee.get(proposed_validator_address);
    assert(validator_committee_state.is_open);
    assert(validator_committee_state.commission < MAX_COMMISSION);

    // Add to the validator_data
    let initial_validator_datum: validator_datum = validator_datum {
      delegator: delegator,
      validator: proposed_validator_address,
      block_height: block.height,
      bonded_microcredits: bonded.microcredits,
      microcredits_yield_per_epoch: 0u128,
      commission: validator_committee_state.commission
    };
    validator_data.set(delegator, initial_validator_datum);
  }

  // Update the data for the given reference delegator
  // It's permissionless ie callable by anyone
  async transition update_data(
    public delegator: address
  ) -> Future {
    return finalize_update_data(delegator);
  }

  async function finalize_update_data(
    public delegator: address
  ) {
    // Get the existing data, fails if the reference delegator isn't there
    let existing_validator_datum: validator_datum = validator_data.get(delegator);

    // Ensure the validator isn't banned
    let is_banned: bool = banned_validators.contains(existing_validator_datum.validator);
    assert_eq(is_banned, false);

    // Check if update is in the allowed update period
    let epoch_blocks: u32 = block.height % BLOCKS_PER_EPOCH;
    let is_update_period: bool = epoch_blocks >= UPDATE_BLOCKS_DISALLOWED;
    assert(is_update_period);

    // Ensure an update hasn't been performed in the same epoch yet
    let block_range: u32 = block.height - existing_validator_datum.block_height;
    assert(block_range > UPDATE_BLOCKS_DISALLOWED);

    // Get the committee state of the validator
    let validator_committee_state: committee_state = credits.aleo/committee.get(existing_validator_datum.validator);
    // Ensure the commission is less than MAX_COMMISSION
    assert(validator_committee_state.commission < MAX_COMMISSION);
    // Ensure the validator is open
    assert(validator_committee_state.is_open);

    // Get the bonded state of the delegator
    let bonded: bond_state = credits.aleo/bonded.get(delegator);

    // Note: We calculate return per epoch
    // For example, given an annualized return of 10%, after a week we expected 10_000_000_000 microcredits (10K credits) to become 10_018_345_688 microcredits
    // Because we use u128, we cannot calculate a percentage yield as it would always be 0 so we normalize the return
    // to the amount of microcredits earned as if the delegator had 10K credits staked.
    // So the microcredits_yield_per_epoch would be 18_345_688
    let microcredits_earned: u128 = bonded.microcredits as u128 - existing_validator_datum.bonded_microcredits as u128;
    let normalized_microcredits_earned: u128 = microcredits_earned * PRECISION / existing_validator_datum.bonded_microcredits as u128;
    let yield_per_epoch: u128 = normalized_microcredits_earned * BLOCKS_PER_EPOCH as u128 / block_range as u128;

    // Ensure the last update was in the previous epoch, otherwise set the yield to zero
    // The attack here is to prevent a validator from keeping many reference delegators and then choosing the most favorable range.
    let current_epoch: u32 = block.height / BLOCKS_PER_EPOCH;
    let previous_update_epoch: u32 = existing_validator_datum.block_height / BLOCKS_PER_EPOCH;
    let did_update_last_epoch: bool = (previous_update_epoch + 1u32) == current_epoch;
    let new_microcredits_yield_per_epoch: u128 = did_update_last_epoch ? yield_per_epoch : 0u128;

    // Construct and save the new validator_datum for the delegator
    let new_validator_datum: validator_datum = validator_datum {
      delegator: delegator,
      validator: existing_validator_datum.validator,
      block_height: block.height,
      bonded_microcredits: bonded.microcredits,
      microcredits_yield_per_epoch: new_microcredits_yield_per_epoch,
      commission: validator_committee_state.commission
    };
    validator_data.set(delegator, new_validator_datum);

    // Get the array of top validators
    let top_validators_addresses: [address; 10] = top_valdiators.get_or_use(
      0u8,
      [
        aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
        aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
        aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
        aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
        aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
        aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
        aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
        aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
        aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
        aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc
      ]
    );
    let default_validator_datum: validator_datum = validator_datum {
      delegator: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
      validator: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
      block_height: 0u32,
      bonded_microcredits: 0u64,
      microcredits_yield_per_epoch: 0u128,
      commission: 0u8
    };

    // Fetch all of the data for each validator
    let datum_0: validator_datum = validator_data.get_or_use(top_validators_addresses[0u8], default_validator_datum);
    let datum_1: validator_datum = validator_data.get_or_use(top_validators_addresses[1u8], default_validator_datum);
    let datum_2: validator_datum = validator_data.get_or_use(top_validators_addresses[2u8], default_validator_datum);
    let datum_3: validator_datum = validator_data.get_or_use(top_validators_addresses[3u8], default_validator_datum);
    let datum_4: validator_datum = validator_data.get_or_use(top_validators_addresses[4u8], default_validator_datum);
    let datum_5: validator_datum = validator_data.get_or_use(top_validators_addresses[5u8], default_validator_datum);
    let datum_6: validator_datum = validator_data.get_or_use(top_validators_addresses[6u8], default_validator_datum);
    let datum_7: validator_datum = validator_data.get_or_use(top_validators_addresses[7u8], default_validator_datum);
    let datum_8: validator_datum = validator_data.get_or_use(top_validators_addresses[8u8], default_validator_datum);
    let datum_9: validator_datum = validator_data.get_or_use(top_validators_addresses[9u8], default_validator_datum);

    // Calculate the epoch start block
    let epoch_start_height: u32 = current_epoch * BLOCKS_PER_EPOCH;

    // Perform swaps and drop the last element
    // The order of the swap_validator_data is subtle but very important.
    let swap_result_0: (validator_datum, validator_datum, bool) = swap_validator_data(new_validator_datum, datum_0, epoch_start_height, false);
    let swap_result_1: (validator_datum, validator_datum, bool) = swap_validator_data(swap_result_0.1, datum_1, epoch_start_height, swap_result_0.2);
    let swap_result_2: (validator_datum, validator_datum, bool) = swap_validator_data(swap_result_1.1, datum_2, epoch_start_height, swap_result_1.2);
    let swap_result_3: (validator_datum, validator_datum, bool) = swap_validator_data(swap_result_2.1, datum_3, epoch_start_height, swap_result_2.2);
    let swap_result_4: (validator_datum, validator_datum, bool) = swap_validator_data(swap_result_3.1, datum_4, epoch_start_height, swap_result_3.2);
    let swap_result_5: (validator_datum, validator_datum, bool) = swap_validator_data(swap_result_4.1, datum_5, epoch_start_height, swap_result_4.2);
    let swap_result_6: (validator_datum, validator_datum, bool) = swap_validator_data(swap_result_5.1, datum_6, epoch_start_height, swap_result_5.2);
    let swap_result_7: (validator_datum, validator_datum, bool) = swap_validator_data(swap_result_6.1, datum_7, epoch_start_height, swap_result_6.2);
    let swap_result_8: (validator_datum, validator_datum, bool) = swap_validator_data(swap_result_7.1, datum_8, epoch_start_height, swap_result_7.2);
    let swap_result_9: (validator_datum, validator_datum, bool) = swap_validator_data(swap_result_8.1, datum_9, epoch_start_height, swap_result_8.2);
    let new_top_10: [address; 10] = [
      swap_result_0.0.delegator,
      swap_result_1.0.delegator,
      swap_result_2.0.delegator,
      swap_result_3.0.delegator,
      swap_result_4.0.delegator,
      swap_result_5.0.delegator,
      swap_result_6.0.delegator,
      swap_result_7.0.delegator,
      swap_result_8.0.delegator,
      swap_result_9.0.delegator
    ];

    // Set the new top 10
    top_valdiators.set(0u8, new_top_10);
  }

  // Remove the reference delegator
  // It can be used whether or not the reference delegator has been approved
  async transition remove_delegator() -> Future {
    return finalize_remove_delegator(self.caller);
  }
  
  async function finalize_remove_delegator(
    public delegator_address: address
  ) {
    // Ensure an update period isn't occuring
    // This protects against a DOS against other validators who could keep a delegator to another validator and then remove it right at the end of the update period
    let epoch_blocks: u32 = block.height % BLOCKS_PER_EPOCH;
    let is_not_update_period: bool = epoch_blocks < UPDATE_BLOCKS_DISALLOWED;
    assert(is_not_update_period);

    // Remove from the proposed_delegators if there
    let contains_delegator: bool = delegator_to_validator.contains(delegator_address);
    if (contains_delegator) {
      delegator_to_validator.remove(delegator_address);
    }

    // Remove from the validator_data
    let data_contains_delegator: bool = validator_data.contains(delegator_address);
    if (data_contains_delegator) {
      validator_data.remove(delegator_address);
    }

    // Remove from the top 10 validators if there
    let top_validators_addresses: [address; 10] = top_valdiators.get(0u8);
    let new_validator_0: address = top_validators_addresses[0u8] == delegator_address ? aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc : top_validators_addresses[0u8];
    let new_validator_1: address = top_validators_addresses[1u8] == delegator_address ? aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc : top_validators_addresses[1u8];
    let new_validator_2: address = top_validators_addresses[2u8] == delegator_address ? aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc : top_validators_addresses[2u8];
    let new_validator_3: address = top_validators_addresses[3u8] == delegator_address ? aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc : top_validators_addresses[3u8];
    let new_validator_4: address = top_validators_addresses[4u8] == delegator_address ? aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc : top_validators_addresses[4u8];
    let new_validator_5: address = top_validators_addresses[5u8] == delegator_address ? aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc : top_validators_addresses[5u8];
    let new_validator_6: address = top_validators_addresses[6u8] == delegator_address ? aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc : top_validators_addresses[6u8];
    let new_validator_7: address = top_validators_addresses[7u8] == delegator_address ? aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc : top_validators_addresses[7u8];
    let new_validator_8: address = top_validators_addresses[8u8] == delegator_address ? aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc : top_validators_addresses[8u8];
    let new_validator_9: address = top_validators_addresses[9u8] == delegator_address ? aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc : top_validators_addresses[9u8];
    
    // Swap until 0group address is at the end of the array
    let swap_result_0: (address, address) = swap_zero_group_address(new_validator_0, new_validator_1);
    let swap_result_1: (address, address) = swap_zero_group_address(swap_result_0.1, new_validator_2);
    let swap_result_2: (address, address) = swap_zero_group_address(swap_result_1.1, new_validator_3);
    let swap_result_3: (address, address) = swap_zero_group_address(swap_result_2.1, new_validator_4);
    let swap_result_4: (address, address) = swap_zero_group_address(swap_result_3.1, new_validator_5);
    let swap_result_5: (address, address) = swap_zero_group_address(swap_result_4.1, new_validator_6);
    let swap_result_6: (address, address) = swap_zero_group_address(swap_result_5.1, new_validator_7);
    let swap_result_7: (address, address) = swap_zero_group_address(swap_result_6.1, new_validator_8);
    let swap_result_8: (address, address) = swap_zero_group_address(swap_result_7.1, new_validator_9);
    
    let new_top_validators_addresses: [address; 10] = [
      swap_result_0.0,
      swap_result_1.0,
      swap_result_2.0,
      swap_result_3.0,
      swap_result_4.0,
      swap_result_5.0,
      swap_result_6.0,
      swap_result_7.0,
      swap_result_8.0,
      swap_result_8.1,
    ];
    top_valdiators.set(0u8, new_top_validators_addresses);
  }

  // Pondo delegators can ban a validator
  // This is to prevent a validator from keeping reference delegators while forcibly unbonding pondo delegators
  // or closing the validator to delegators when the pondo delegators try to bond
  async transition pondo_ban_validator(
    public validator: address
  ) -> Future {
    assert(
      self.caller == pondo_delegator1.aleo ||
      self.caller == pondo_delegator2.aleo ||
      self.caller == pondo_delegator3.aleo ||
      self.caller == pondo_delegator4.aleo ||
      self.caller == pondo_delegator5.aleo
    );

    return finalize_pondo_ban_validator(validator);
  }

  async function finalize_pondo_ban_validator(
    public validator: address
  ) {
    banned_validators.set(validator, true);
  }

  // Anyone can ban a validator if the validator in the update window if:
  // 1. The validator has a commission greater than MAX_COMMISSION
  // 2. The validator leaves the committee
  async transition ban_validator(
    public reference_delegator: address,
  ) -> Future {
    return finalize_ban_validator(reference_delegator);
  }

  async function finalize_ban_validator(
    public reference_delegator: address
  ) {
    // Get the validator address
    let validator: address = delegator_to_validator.get(reference_delegator);

    // Check if the height is within the update window
    let epoch_blocks: u32 = block.height % BLOCKS_PER_EPOCH;
    let is_update_period: bool = epoch_blocks >= UPDATE_BLOCKS_DISALLOWED;
    assert(is_update_period);

    // Default committee state of the validator
    let default_committee_state: committee_state = committee_state {
      is_open: false,
      commission: MAX_COMMISSION + 1u8
    };
    // Get the committee state of the validator
    let validator_committee_state: committee_state = credits.aleo/committee.get_or_use(validator, default_committee_state);
    // Ensure the validator is open & the commission is less than MAX_COMMISSION
    assert(!validator_committee_state.is_open || validator_committee_state.commission > MAX_COMMISSION);

    banned_validators.set(validator, true);
  }

  async transition set_pondo_tvl(
    public tvl: u64
  ) {
    assert_eq(self.caller, pondo_core_protocol.aleo);
  }

  async function finalize_set_pondo_tvl(
    public tvl: u64
  ) {
    pondo_tvl.set(0u8, tvl);
  }

  // Swap the positions of each datum given:
  // 1. If auto swap bit is on, always swap
  // 2. If one is outdated (if both are outdated, preference no swap)
  // 3. If one yield is 0 (if both are 0, preference no swap)
  // 4. The higher yield or the lower yield if they reference the same validator
  inline swap_validator_data(
    datum_0: validator_datum,
    datum_1: validator_datum,
    epoch_start_block: u32,
    auto_swap: bool
  ) -> (validator_datum, validator_datum, bool) {
    if (auto_swap) {
      return (datum_1, datum_0, true);
    }

    // If the delegator are the same, don't swap and turn auto_swap on afterwards
    // This keeps the new delegator and forces out the old one
    if (datum_0.delegator == datum_1.delegator) {
      return (datum_0, datum_1, true);
    }

    // If the validator is the same, automatically swap down the loser of this check out of the list
    let new_auto_swap: bool = datum_0.validator == datum_1.validator;

    // Check if either one is outdated
    // The default validator datum used for 0group addresses uses 0u32 for the block_height
    // So we will catch any 0group addresses here
    if (datum_1.block_height < epoch_start_block) {
      return (datum_0, datum_1, new_auto_swap);
    }
    if (datum_0.block_height < epoch_start_block) {
      return (datum_1, datum_0, new_auto_swap);
    }

    // Handle the edge case of one of the yields being 0 as 0 is automatically used when the validator wasn't updated last epoch
    if (datum_1.microcredits_yield_per_epoch == 0u128) {
      return (datum_0, datum_1, new_auto_swap);
    }
    if (datum_0.microcredits_yield_per_epoch == 0u128) {
      return (datum_1, datum_0, new_auto_swap);
    }

    // Choose the datum with the higher yield in the normal case
    // In the case where they reference the same validator, return the one with the lower yield
    // If we return the one with the higher yield, a validator may keep 2 reference delegators around and alternate them
    // such that they could raise their commission to 100% during the update period up to a day if they execute it perfectly
    // without the oracle knowing anything
    // The alternative is that if we choose the lower one, it's much more difficult and expensive for competing validators
    // to keep around many delegators with slightly different ranges and try to choose the worst one for their competitors.
    // all the while paying transaction fees while giving their competitors commissions from delegations.
    let should_swap: bool = new_auto_swap ? datum_0.microcredits_yield_per_epoch > datum_1.microcredits_yield_per_epoch : datum_0.microcredits_yield_per_epoch < datum_1.microcredits_yield_per_epoch;

    return should_swap ? (datum_1, datum_0, new_auto_swap) : (datum_0, datum_1, new_auto_swap);
  }

  // Swap the zero group address to the end of the list
  inline swap_zero_group_address(
    address_0: address,
    address_1: address
  ) -> (address, address) {
      if (address_0 == aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc) {
        return (address_1, address_0);
      } else {
        return (address_0, address_1);
      }
  }
}