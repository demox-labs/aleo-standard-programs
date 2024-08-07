import credits.aleo;

// The program to permissionless calculate the yield of reference delegators to validators
// Note: Many reference delegators for the same validator are supported
// This is to prevent any sort of DOS by competing validators running the reference delegator for other validators
program pondo_oracle.aleo {
  // Address of the approver who can manually check that reference delegators follow the intended specification
  const ADMIN_0: address = aleo12shtwnmf49t5atmad2jnk3e58ahtp749d9trctt9z3wryxyzt5pspp0nd0;
  const ADMIN_1: address = aleo1z9y9afh0h6dnyj3f0hvjc4mhayjy06fj42ppcq0rvpmmyky6fuzs449sjr;
  const ADMIN_2: address = aleo19x0ctad8llm9y0qssw7eup045c5wxxp6k4al3n0d5r8maulkzu8sh3jwew;
  const ADMIN_3: address = aleo16ycrg9g4208lp5y4g5s3gn43xknc5gdsr7wjrpqq9htznj5qk5yqd6px5a;
  const ADMIN_4: address = aleo1q59hxe2zmexlu4vgtmtmvyxm4ew047zlf50h5l5zsrdvljusdvrqn78u7s;

  // The precision used to calculate the return per epoch
  const PRECISION: u128 = 10_000_000_000u128; // Equal to 10K credits
  // The number of blocks in an epoch
  const BLOCKS_PER_EPOCH: u32 = 120_960u32; // 1 week of blocks, assuming 5 sec per block
  // The number of blocks to not allow updates, so updates must happen in the last 1 day of an epoch
  const UPDATE_BLOCKS_DISALLOWED: u32 = 103_680u32; // 6 day of blocks, assuming 5 sec per block
  // The max allowable commission by the validators
  const MAX_COMMISSION: u8 = 50u8;
  // The multiple for boosting
  // Note: Since the biggest difference a validator can go is from 0% to 40% of the tvl of pondo, we can use a multiple of 2
  // This makes boosting a validator cheaper but still more expensive than increasing normal yield ie decreasing commission
  const BOOST_PRECISION: u128 = 10_000u128;

  // The data to store for each validator to calculate the return
  struct validator_datum {
    delegator: address,
    validator: address,
    block_height: u32,
    bonded_microcredits: u64,
    microcredits_yield_per_epoch: u128,
    commission: u8,
    boost: u128
  }

  struct validator_boost {
    epoch: u32,
    boost_amount: u64
  }

  // Shadow credits.aleo/bond_state
  struct bond_state {
    validator: address,
    microcredits: u64
  }

  // Shadow credits.aleo/committee_state
  struct committee_state {
    is_open: bool,
    commission: u8
  }

  // The operation types
  const ADD_OPERATION: u8 = 0u8;
  const REMOVE_OPERATION: u8 = 1u8;
  const UPDATE_DELEGATOR_ALLOCATIONS_OPERATION: u8 = 2u8;
  const UPDATE_ADMIN_OPERATION: u8 = 3u8;
  const APPROVE_DELEGATOR_OPERATION: u8 = 4u8;

  struct admin_operation {
    arg: field,
    op_type: u8,
    request_id: u64
  }

  // A mapping of the reference delegator to the validator address
  // It may contain unapproved reference delegators
  mapping delegator_to_validator: address => address;
  // A mapping of the delegator address to the tracked validator data
  // Only approved reference delegators will tracked
  mapping validator_data: address => validator_datum;
  // A mapping to store the list of top 10 validators as specified by the delegator
  // ie this is a list of delegators but the validators are guaranteed to be unique or the 0 group address
  mapping top_validators: u8 => [address; 10];
  // A mapping of banned validators
  mapping banned_validators: address => bool;
  // A mapping of the pondo total value locked
  mapping pondo_tvl: u8 => u64;
  // A mapping of the validator boosting for the epoch
  mapping validator_boosting: address => validator_boost;
  // Addresses that can ban validators, the bool indicates if the address is the admin
  mapping control_addresses: address => bool;
  mapping delegator_allocation: u8 => [u128; 10];
  mapping admin_operations: u64 => admin_operation;

  async transition initialize() -> Future {
    return finalize_initialize();
  }

  async function finalize_initialize() {
    // Assert the protocol hasn't been initialized yet
    assert_eq(delegator_allocation.contains(0u8), false);
    assert_eq(top_validators.contains(0u8), false);

    // Set the admin control addresses
    control_addresses.set(ADMIN_0, true);
    control_addresses.set(ADMIN_1, true);
    control_addresses.set(ADMIN_2, true);
    control_addresses.set(ADMIN_3, true);
    control_addresses.set(ADMIN_4, true);

    // Set the non-admin control addresses
    control_addresses.set(pondo_delegator1.aleo, false);
    control_addresses.set(pondo_delegator2.aleo, false);
    control_addresses.set(pondo_delegator3.aleo, false);
    control_addresses.set(pondo_delegator4.aleo, false);
    control_addresses.set(pondo_delegator5.aleo, false);

    delegator_allocation.set(0u8, [
      3700u128,
      2600u128,
      1600u128,
      1200u128,
      900u128,
      900u128,
      900u128,
      900u128,
      900u128,
      900u128
    ]);
    top_validators.set(0u8,
      [
        self.address,
        self.address,
        self.address,
        self.address,
        self.address,
        self.address,
        self.address,
        self.address,
        self.address,
        self.address
      ]
    );
  }

  async transition add_control_address(
    public control_address: address,
    public sig_1: signature,
    public admin_1: address,
    public sig_2: signature,
    public admin_2: address,
    public sig_3: signature,
    public admin_3: address,
    public request_id: u64
  ) -> Future {
    let arg: field = BHP256::hash_to_field(control_address);
    let admin_op: admin_operation = admin_operation {
      arg: arg,
      op_type: ADD_OPERATION,
      request_id: request_id
    };
    let op_hash: field = BHP256::hash_to_field(admin_op);
    let is_verified_1: bool = sig_1.verify(admin_1, op_hash);
    let is_verified_2: bool = sig_2.verify(admin_2, op_hash);
    let is_verified_3: bool = sig_3.verify(admin_3, op_hash);
    assert(is_verified_1 && is_verified_2 && is_verified_3);

    return finalize_add_control_address(control_address, admin_1, admin_2, admin_3, admin_op);
  }

  async function finalize_add_control_address(
    public control_address: address,
    public admin_1: address,
    public admin_2: address,
    public admin_3: address,
    public admin_op: admin_operation
  ) {
    /* Start Verify Admin Operation */

    // Ensure the admin addresses are not the same
    assert_neq(admin_1, admin_2);
    assert_neq(admin_1, admin_3);
    assert_neq(admin_2, admin_3);

    // Ensure the admin addresses are each admins
    let is_admin_1: bool = control_addresses.get(admin_1);
    let is_admin_2: bool = control_addresses.get(admin_2);
    let is_admin_3: bool = control_addresses.get(admin_3);
    assert(is_admin_1 && is_admin_2 && is_admin_3);

    // Ensure the request hasn't been made before
    let request_exists: bool = admin_operations.contains(admin_op.request_id);
    assert_eq(request_exists, false);

    // Set the admin operation
    admin_operations.set(admin_op.request_id, admin_op);

    /* End Verify Admin Operation */

    // Ensure the control address is not already an admin
    // This ensures other admins cannot downgrade other admins
    let already_exists: bool = control_addresses.contains(control_address);
    assert_eq(already_exists, false);

    // Set the control address
    control_addresses.set(control_address, false);
  }

  async transition remove_control_address(
    public control_address: address,
    public sig_1: signature,
    public admin_1: address,
    public sig_2: signature,
    public admin_2: address,
    public sig_3: signature,
    public admin_3: address,
    public request_id: u64
  ) -> Future {
    let arg: field = BHP256::hash_to_field(control_address);
    let admin_op: admin_operation = admin_operation {
      arg: arg,
      op_type: REMOVE_OPERATION,
      request_id: request_id
    };
    let op_hash: field = BHP256::hash_to_field(admin_op);
    let is_verified_1: bool = sig_1.verify(admin_1, op_hash);
    let is_verified_2: bool = sig_2.verify(admin_2, op_hash);
    let is_verified_3: bool = sig_3.verify(admin_3, op_hash);
    assert(is_verified_1 && is_verified_2 && is_verified_3);  

    return finalize_remove_control_address(control_address, admin_1, admin_2, admin_3, admin_op);
  }

  async function finalize_remove_control_address(
    public control_address: address,
    public admin_1: address,
    public admin_2: address,
    public admin_3: address,
    public admin_op: admin_operation
  ) {
    /* Start Verify Admin Operation */

    // Ensure the admin addresses are not the same
    assert_neq(admin_1, admin_2);
    assert_neq(admin_1, admin_3);
    assert_neq(admin_2, admin_3);

    // Ensure the admin addresses are each admins
    let is_admin_1: bool = control_addresses.get(admin_1);
    let is_admin_2: bool = control_addresses.get(admin_2);
    let is_admin_3: bool = control_addresses.get(admin_3);
    assert(is_admin_1 && is_admin_2 && is_admin_3);

    // Ensure the request hasn't been made before
    let request_exists: bool = admin_operations.contains(admin_op.request_id);
    assert_eq(request_exists, false);

    // Set the admin operation
    admin_operations.set(admin_op.request_id, admin_op);

    /* End Verify Admin Operation */

    // Ensure the control address is not an admin
    let removing_admin: bool = control_addresses.get(control_address);
    assert_eq(removing_admin, false);

    control_addresses.remove(control_address);
  }

  // Used for an admin to update their own admin addresses
  async transition update_admin(
    public old_admin: address,
    public new_admin: address,
    public sig_1: signature,
    public admin_1: address,
    public sig_2: signature,
    public admin_2: address,
    public sig_3: signature,
    public admin_3: address,
    public request_id: u64
  ) -> Future {
    let args: [address; 2] = [old_admin, new_admin];
    let arg: field = BHP256::hash_to_field(args);
    let admin_op: admin_operation = admin_operation {
      arg: arg,
      op_type: UPDATE_ADMIN_OPERATION,
      request_id: request_id
    };
    let op_hash: field = BHP256::hash_to_field(admin_op);
    let is_verified_1: bool = sig_1.verify(admin_1, op_hash);
    let is_verified_2: bool = sig_2.verify(admin_2, op_hash);
    let is_verified_3: bool = sig_3.verify(admin_3, op_hash);
    assert(is_verified_1 && is_verified_2 && is_verified_3);

    return finalize_update_admin(old_admin, new_admin, admin_1, admin_2, admin_3, admin_op);
  }

  async function finalize_update_admin(
    public old_admin: address,
    public new_admin: address,
    public admin_1: address,
    public admin_2: address,
    public admin_3: address,
    public admin_op: admin_operation
  ) {
    /* Start Verify Admin Operation */

    // Ensure the admin addresses are not the same
    assert_neq(admin_1, admin_2);
    assert_neq(admin_1, admin_3);
    assert_neq(admin_2, admin_3);

    // Ensure the admin addresses are each admins
    let is_admin_1: bool = control_addresses.get(admin_1);
    let is_admin_2: bool = control_addresses.get(admin_2);
    let is_admin_3: bool = control_addresses.get(admin_3);
    assert(is_admin_1 && is_admin_2 && is_admin_3);

    // Ensure the request hasn't been made before
    let request_exists: bool = admin_operations.contains(admin_op.request_id);
    assert_eq(request_exists, false);

    // Set the admin operation
    admin_operations.set(admin_op.request_id, admin_op);

    /* End Verify Admin Operation */

    // Remove the old admin
    control_addresses.remove(old_admin);

    // Set the new admin
    control_addresses.set(new_admin, true);
  }

  async transition update_delegator_allocations(
    public multiple: [u128; 10],
    public sig_1: signature,
    public admin_1: address,
    public sig_2: signature,
    public admin_2: address,
    public sig_3: signature,
    public admin_3: address,
    public request_id: u64
  ) -> Future {
    let multiple_hash: field = BHP256::hash_to_field(multiple);
    let admin_op: admin_operation = admin_operation {
      arg: multiple_hash,
      op_type: UPDATE_DELEGATOR_ALLOCATIONS_OPERATION,
      request_id: 0u64
    };
    let op_hash: field = BHP256::hash_to_field(admin_op);
    let is_verified_1: bool = sig_1.verify(admin_1, op_hash);
    let is_verified_2: bool = sig_2.verify(admin_2, op_hash);
    let is_verified_3: bool = sig_3.verify(admin_3, op_hash);
    assert(is_verified_1 && is_verified_2 && is_verified_3);

    return finalize_update_delegator_allocations(multiple, admin_1, admin_2, admin_3, admin_op);
  }

  async function finalize_update_delegator_allocations(
    public multiple: [u128; 10],
    public admin_1: address,
    public admin_2: address,
    public admin_3: address,
    public admin_op: admin_operation
  ) {
    /* Start Verify Admin Operation */

    // Ensure the admin addresses are not the same
    assert_neq(admin_1, admin_2);
    assert_neq(admin_1, admin_3);
    assert_neq(admin_2, admin_3);

    // Ensure the admin addresses are each admins
    let is_admin_1: bool = control_addresses.get(admin_1);
    let is_admin_2: bool = control_addresses.get(admin_2);
    let is_admin_3: bool = control_addresses.get(admin_3);
    assert(is_admin_1 && is_admin_2 && is_admin_3);

    // Ensure the request hasn't been made before
    let request_exists: bool = admin_operations.contains(admin_op.request_id);
    assert_eq(request_exists, false);

    // Set the admin operation
    admin_operations.set(admin_op.request_id, admin_op);

    /* End Verify Admin Operation */

    delegator_allocation.set(0u8, multiple);
  }


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
    public delegator: address,
    public sig_1: signature,
    public admin_1: address,
    public sig_2: signature,
    public admin_2: address,
    public sig_3: signature,
    public admin_3: address,
    public request_id: u64
  ) -> Future {
    let arg: field = BHP256::hash_to_field(delegator);
    let admin_op: admin_operation = admin_operation {
      arg: arg,
      op_type: APPROVE_DELEGATOR_OPERATION,
      request_id: request_id
    };
    let op_hash: field = BHP256::hash_to_field(admin_op);
    let is_verified_1: bool = sig_1.verify(admin_1, op_hash);
    let is_verified_2: bool = sig_2.verify(admin_2, op_hash);
    let is_verified_3: bool = sig_3.verify(admin_3, op_hash);
    assert(is_verified_1 && is_verified_2 && is_verified_3);

    return finalize_add_delegator(delegator, admin_1, admin_2, admin_3, admin_op);
  }

  async function finalize_add_delegator(
    public delegator: address,
    public admin_1: address,
    public admin_2: address,
    public admin_3: address,
    public admin_op: admin_operation
  ) {
    /* Start Verify Admin Operation */

    // Ensure the admin addresses are not the same
    assert_neq(admin_1, admin_2);
    assert_neq(admin_1, admin_3);
    assert_neq(admin_2, admin_3);

    // Ensure the admin addresses are each admins
    let is_admin_1: bool = control_addresses.get(admin_1);
    let is_admin_2: bool = control_addresses.get(admin_2);
    let is_admin_3: bool = control_addresses.get(admin_3);
    assert(is_admin_1 && is_admin_2 && is_admin_3);

    // Ensure the request hasn't been made before
    let request_exists: bool = admin_operations.contains(admin_op.request_id);
    assert_eq(request_exists, false);

    // Set the admin operation
    admin_operations.set(admin_op.request_id, admin_op);

    /* End Verify Admin Operation */

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
    let delegator_already_added: bool = validator_data.contains(delegator);
    assert_eq(delegator_already_added, false);

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
      commission: validator_committee_state.commission,
      boost: 0u128
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

    // Get the current epoch
    let current_epoch: u32 = block.height / BLOCKS_PER_EPOCH;

    // Note: We calculate return per epoch
    // For example, given an annualized return of 10%, after a week we expected 10_000_000_000 microcredits (10K credits) to become 10_018_345_688 microcredits
    // Because we use u128, we cannot calculate a percentage yield as it would always be 0 so we normalize the return
    // to the amount of microcredits earned as if the delegator had 10K credits staked.
    // So the microcredits_yield_per_epoch would be 18_345_688
    let microcredits_earned: u128 = bonded.microcredits as u128 - existing_validator_datum.bonded_microcredits as u128;
    let normalized_microcredits_earned: u128 = microcredits_earned * PRECISION / existing_validator_datum.bonded_microcredits as u128;
    let yield_per_epoch: u128 = normalized_microcredits_earned * BLOCKS_PER_EPOCH as u128 / block_range as u128;

    // Get the boost amount for the validator
    let boost: validator_boost = validator_boosting.get_or_use(
      existing_validator_datum.validator,
      validator_boost { epoch: 0u32, boost_amount: 0u64 }
    );
    let boost_amount: u128 = boost.epoch == current_epoch ? boost.boost_amount as u128 : 0u128;
    // Normalize the boost amount by the pondo tvl
    let current_pondo_tvl: u128 = pondo_tvl.get_or_use(0u8, 10_000_000_000_000_000u64) as u128; // use a high default, 10B credits
    // The normalized boost amount is the amount of boost per 10K credits staked
    // Note: This precision is 1 credit on a TVL of 10M credits
    let normalized_boost_amount: u128 = boost_amount * PRECISION / current_pondo_tvl as u128;

    // Ensure the last update was in the previous epoch, otherwise set the yield to zero
    // The attack here is to prevent a validator from keeping many reference delegators and then choosing the most favorable range.
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
      commission: validator_committee_state.commission,
      boost: normalized_boost_amount
    };

    // Get the array of top validators
    let top_validators_addresses: [address; 10] = top_validators.get(0u8);
    let default_validator_datum: validator_datum = validator_datum {
      delegator: self.address,
      validator: self.address,
      block_height: 0u32,
      bonded_microcredits: 0u64,
      microcredits_yield_per_epoch: 0u128,
      commission: 0u8,
      boost: 0u128
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

    // Get the boost multiple
    let allocations: [u128; 10] = delegator_allocation.get(0u8);

    // Perform swaps
    let swap_result_0: (validator_datum, validator_datum) = swap_validator_data(new_validator_datum, datum_0, epoch_start_height, allocations[0u8]);
    let swap_result_1: (validator_datum, validator_datum) = swap_validator_data(swap_result_0.1, datum_1, epoch_start_height, allocations[1u8]);
    let swap_result_2: (validator_datum, validator_datum) = swap_validator_data(swap_result_1.1, datum_2, epoch_start_height, allocations[2u8]);
    let swap_result_3: (validator_datum, validator_datum) = swap_validator_data(swap_result_2.1, datum_3, epoch_start_height, allocations[3u8]);
    let swap_result_4: (validator_datum, validator_datum) = swap_validator_data(swap_result_3.1, datum_4, epoch_start_height, allocations[4u8]);
    let swap_result_5: (validator_datum, validator_datum) = swap_validator_data(swap_result_4.1, datum_5, epoch_start_height, allocations[5u8]);
    let swap_result_6: (validator_datum, validator_datum) = swap_validator_data(swap_result_5.1, datum_6, epoch_start_height, allocations[6u8]);
    let swap_result_7: (validator_datum, validator_datum) = swap_validator_data(swap_result_6.1, datum_7, epoch_start_height, allocations[7u8]);
    let swap_result_8: (validator_datum, validator_datum) = swap_validator_data(swap_result_7.1, datum_8, epoch_start_height, allocations[8u8]);
    let swap_result_9: (validator_datum, validator_datum) = swap_validator_data(swap_result_8.1, datum_9, epoch_start_height, allocations[9u8]);
    let new_top_11: [validator_datum; 11] = [
      swap_result_0.0,
      swap_result_1.0,
      swap_result_2.0,
      swap_result_3.0,
      swap_result_4.0,
      swap_result_5.0,
      swap_result_6.0,
      swap_result_7.0,
      swap_result_8.0,
      swap_result_9.0,
      swap_result_9.1
    ];
    // Remove the duplicate if there is one, otherwise drop the last element
    let new_top_10: [address; 10] = remove_duplicate(new_validator_datum, new_top_11);

    // Set the new top 10
    top_validators.set(0u8, new_top_10);
    // Set the new validator data
    validator_data.set(delegator, new_validator_datum);
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
    let top_validators_addresses: [address; 10] = top_validators.get(0u8);
    let new_validator_0: address = top_validators_addresses[0u8] == delegator_address ? self.address : top_validators_addresses[0u8];
    let new_validator_1: address = top_validators_addresses[1u8] == delegator_address ? self.address : top_validators_addresses[1u8];
    let new_validator_2: address = top_validators_addresses[2u8] == delegator_address ? self.address : top_validators_addresses[2u8];
    let new_validator_3: address = top_validators_addresses[3u8] == delegator_address ? self.address : top_validators_addresses[3u8];
    let new_validator_4: address = top_validators_addresses[4u8] == delegator_address ? self.address : top_validators_addresses[4u8];
    let new_validator_5: address = top_validators_addresses[5u8] == delegator_address ? self.address : top_validators_addresses[5u8];
    let new_validator_6: address = top_validators_addresses[6u8] == delegator_address ? self.address : top_validators_addresses[6u8];
    let new_validator_7: address = top_validators_addresses[7u8] == delegator_address ? self.address : top_validators_addresses[7u8];
    let new_validator_8: address = top_validators_addresses[8u8] == delegator_address ? self.address : top_validators_addresses[8u8];
    let new_validator_9: address = top_validators_addresses[9u8] == delegator_address ? self.address : top_validators_addresses[9u8];

    // Swap until 0group address is at the end of the array
    let swap_result_0: (address, address) = swap_self_address(new_validator_0, new_validator_1);
    let swap_result_1: (address, address) = swap_self_address(swap_result_0.1, new_validator_2);
    let swap_result_2: (address, address) = swap_self_address(swap_result_1.1, new_validator_3);
    let swap_result_3: (address, address) = swap_self_address(swap_result_2.1, new_validator_4);
    let swap_result_4: (address, address) = swap_self_address(swap_result_3.1, new_validator_5);
    let swap_result_5: (address, address) = swap_self_address(swap_result_4.1, new_validator_6);
    let swap_result_6: (address, address) = swap_self_address(swap_result_5.1, new_validator_7);
    let swap_result_7: (address, address) = swap_self_address(swap_result_6.1, new_validator_8);
    let swap_result_8: (address, address) = swap_self_address(swap_result_7.1, new_validator_9);

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
    top_validators.set(0u8, new_top_validators_addresses);
  }

  // Pondo delegators can ban a validator
  // This is to prevent a validator from keeping reference delegators while forcibly unbonding pondo delegators
  // or closing the validator to delegators when the pondo delegators try to bond
  async transition pondo_ban_validator(
    public validator: address
  ) -> Future {
    // Check that 0Group addresses cannot be banned
    assert_neq(validator, self.address);

    return finalize_pondo_ban_validator(validator, self.caller);
  }

  async function finalize_pondo_ban_validator(
    public validator: address,
    public caller: address
  ) {
    // Check if the caller is a control address
    let is_control_address: bool = control_addresses.contains(caller);
    assert(is_control_address);

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

  // Set the pondo tvl from the core protocol
  // Used for boost pool normalization
  async transition set_pondo_tvl(
    public tvl: u64
  ) -> Future {
    assert_eq(self.caller, pondo_core_protocol.aleo);

    return finalize_set_pondo_tvl(tvl);
  }

  async function finalize_set_pondo_tvl(
    public tvl: u64
  ) {
    pondo_tvl.set(0u8, tvl);
  }

  // Ban a validator as the withdrawal address of that validator
  async transition ban_self(validator: address) -> Future {
    return finalize_ban_self(validator, self.caller);
  }

  async function finalize_ban_self(
    public validator: address,
    public caller: address
  ) {
    // Ensure the caller is the withdrawal address of the validator
    let withdraw_address: address = credits.aleo/withdraw.get(validator);
    assert_eq(withdraw_address, caller);

    // Assert that the validator is in the committee, will fail
    let committee_state_contains_validator: bool = credits.aleo/committee.contains(validator);
    assert(committee_state_contains_validator);

    // Ban the validator
    banned_validators.set(validator, true);
  }

  // Boost a validator
  async transition boost_validator(
    public validator: address,
    public boost_amount: u64
  ) -> Future {
    // Transfer credits to the pondo core protocol
    let f0: Future = credits.aleo/transfer_public_as_signer(pondo_core_protocol.aleo, boost_amount);
    return finalize_boost_validator(f0, validator, boost_amount);
  }

  async function finalize_boost_validator(
    public f0: Future,
    public validator: address,
    public boost_amount: u64
  ) {
    // Wait for the transfer to complete
    f0.await();

    // Get the current epoch
    let current_epoch: u32 = block.height / BLOCKS_PER_EPOCH;

    // Ensure that you cannot boost during the update period
    let epoch_blocks: u32 = block.height % BLOCKS_PER_EPOCH;
    let is_update_period: bool = epoch_blocks >= UPDATE_BLOCKS_DISALLOWED;
    assert(!is_update_period);

    // Get the current boosting for the validator
    let current_boost: validator_boost = validator_boosting.get_or_use(
      validator,
      validator_boost { epoch: 0u32, boost_amount: 0u64 }
    );

    // If the boost is in the same epoch, add the boost amount
    let new_boost_amount: u64 = current_boost.epoch == current_epoch ? current_boost.boost_amount + boost_amount : boost_amount;

    // Set the boosting for the validator
    let new_boost: validator_boost = validator_boost {
      epoch: current_epoch,
      boost_amount: new_boost_amount
    };
    validator_boosting.set(validator, new_boost);
  }

  // If there's a duplicate delegator or validator, remove it
  inline remove_duplicate(
    new_validator_datum: validator_datum,
    top_eleven: [validator_datum; 11],
  ) -> [address; 10] {
    // Set found index to 11 to indicate not found
    let found_index: i8 = 11i8;
    let count: u8 = 0u8;

    for i: u8 in 0u8..10u8 {
      let datum: validator_datum = top_eleven[i];
      if (datum.delegator == new_validator_datum.delegator || datum.validator == new_validator_datum.validator) {
        found_index = i as i8;
        count += 1u8;
      }
    }

    // If there's no duplicate, drop the last element
    let duplicate_index: i8 = count > 1u8 ? found_index : 11i8;
    let delegator_0: address = top_eleven[0u8].delegator;
    let delegator_1: address = duplicate_index < 2i8 ? top_eleven[2u8].delegator : top_eleven[1u8].delegator;
    let delegator_2: address = duplicate_index < 3i8 ? top_eleven[3u8].delegator : top_eleven[2u8].delegator;
    let delegator_3: address = duplicate_index < 4i8 ? top_eleven[4u8].delegator : top_eleven[3u8].delegator;
    let delegator_4: address = duplicate_index < 5i8 ? top_eleven[5u8].delegator : top_eleven[4u8].delegator;
    let delegator_5: address = duplicate_index < 6i8 ? top_eleven[6u8].delegator : top_eleven[5u8].delegator;
    let delegator_6: address = duplicate_index < 7i8 ? top_eleven[7u8].delegator : top_eleven[6u8].delegator;
    let delegator_7: address = duplicate_index < 8i8 ? top_eleven[8u8].delegator : top_eleven[7u8].delegator;
    let delegator_8: address = duplicate_index < 9i8 ? top_eleven[9u8].delegator : top_eleven[8u8].delegator;
    let delegator_9: address = duplicate_index < 10i8 ? top_eleven[10u8].delegator : top_eleven[9u8].delegator;

    return [
      delegator_0,
      delegator_1,
      delegator_2,
      delegator_3,
      delegator_4,
      delegator_5,
      delegator_6,
      delegator_7,
      delegator_8,
      delegator_9
    ];
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
    boost_multiple: u128,
  ) -> (validator_datum, validator_datum) {
    // Check if either one is outdated
    // The default validator datum used for 0group addresses uses 0u32 for the block_height
    // So we will catch any 0group addresses here
    if (datum_1.block_height < epoch_start_block) {
      return (datum_0, datum_1);
    }
    if (datum_0.block_height < epoch_start_block) {
      return (datum_1, datum_0);
    }

    // Handle the edge case of one of the yields being 0 as 0 is automatically used when the validator wasn't updated last epoch
    if (datum_1.microcredits_yield_per_epoch == 0u128) {
      return (datum_0, datum_1);
    }
    if (datum_0.microcredits_yield_per_epoch == 0u128) {
      return (datum_1, datum_0);
    }

    // Calculate the yields
    // Note: the boost multiple depends on the % of the pondo tvl that the spot would get
    // If the boost multiple is too high, it would be more profitable to boost than to decrease commission ie protocol loses money
    // If the boost multiple is too low, it would be more profitable to decrease commission than to boost ie no one would ever boost unless commissions were 0s
    let first_yield: u128 = datum_0.microcredits_yield_per_epoch + datum_0.boost * BOOST_PRECISION / boost_multiple;
    let second_yield: u128 = datum_1.microcredits_yield_per_epoch + datum_1.boost * BOOST_PRECISION / boost_multiple;

    // Choose the datum with the higher yield in the normal case
    // In the case where they reference the same validator, return the one with the lower yield
    // If we return the one with the higher yield, a validator may keep 2 reference delegators around and alternate them
    // such that they could raise their commission to 100% during the update period up to a day if they execute it perfectly
    // without the oracle knowing anything
    // The alternative is that if we choose the lower one, it's much more difficult and expensive for competing validators
    // to keep around many delegators with slightly different ranges and try to choose the worst one for their competitors.
    // all the while paying transaction fees while giving their competitors commissions from delegations.
    let is_same_validator: bool = datum_0.validator == datum_1.validator;
    let should_swap: bool = is_same_validator ? first_yield > second_yield : first_yield < second_yield;

    return should_swap ? (datum_1, datum_0) : (datum_0, datum_1);
  }

  // Swap the zero group address to the end of the list
  inline swap_self_address(
    address_0: address,
    address_1: address
  ) -> (address, address) {
      if (address_0 == self.address) {
        return (address_1, address_0);
      } else {
        return (address_0, address_1);
      }
  }
}