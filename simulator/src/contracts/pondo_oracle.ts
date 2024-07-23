import { creditsProgram } from './credits';

import assert from 'assert';
// interfaces
export interface committee_state {
  is_open: boolean;
  commission: bigint;
}
export interface bond_state {
  validator: string;
  microcredits: bigint;
}
export interface validator_boost {
  epoch: bigint;
  boost_amount: bigint;
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
export class pondo_oracleProgram {
  signer: string = 'not set';
  caller: string = 'not set';
  address: string = 'pondo_oracle.aleo';
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  delegator_allocation: Map<bigint, bigint[]> = new Map();
  control_addresses: Map<string, boolean> = new Map();
  validator_boosting: Map<string, validator_boost> = new Map();
  pondo_tvl: Map<bigint, bigint> = new Map();
  banned_validators: Map<string, boolean> = new Map();
  top_validators: Map<bigint, string[]> = new Map();
  validator_data: Map<string, validator_datum> = new Map();
  delegator_to_validator: Map<string, string> = new Map();
  BOOST_PRECISION = BigInt('10000');
  MAX_COMMISSION = BigInt('50');
  UPDATE_BLOCKS_DISALLOWED = BigInt('103680');
  BLOCKS_PER_EPOCH = BigInt('120960');
  PRECISION = BigInt('10000000000');
  INITIAL_DELEGATOR_APPROVER_ADDRESS =
    'aleo1am58znyhghvyj7lesu0h6wvxecxfhu8svdvgema6g5eqv7kecuzsm7z039';
  credits: creditsProgram;
  constructor(
    // constructor args
    creditsContract: creditsProgram
  ) {
    // constructor body
    this.credits = creditsContract;
    this.block = this.credits.block;
  }

  // TODO:
  // 1. Fix boosting so that it's accurate to the benefits for boosting and slightly profitable to boost

  // The program to permissionless calculate the yield of reference delegators to validators
  // Note: Many reference delegators for the same validator are supported
  // This is to prevent any sort of DOS by competing validators running the reference delegator for other validators
  //program pondo_oracle.aleo {// Address of the approver who can manually check that reference delegators follow the intended specification
  // The precision used to calculate the return per epoch
  // The number of blocks in an epoch
  // The number of blocks to not allow updates, so updates must happen in the last 1 day of an epoch
  // The max allowable commission by the validators
  // The multiple for boosting
  // Note: Since the biggest difference a validator can go is from 0% to 40% of the tvl of pondo, we can use a multiple of 2
  // This makes boosting a validator cheaper but still more expensive than increasing normal yield ie decreasing commission

  // The data to store for each validator to calculate the return

  // Shadow credits.aleo/bond_state

  // Shadow credits.aleo/committee_state

  // A mapping of the reference delegator to the validator address
  // It may contain unapproved reference delegators
  // A mapping of the delegator address to the tracked validator data
  // Only approved reference delegators will tracked
  // A mapping to store the list of top 10 validators as specified by the delegator
  // ie this is a list of delegators but the validators are guaranteed to be unique or the 0 group address
  // A mapping of banned validators
  // A mapping of the pondo total value locked
  // A mapping of the validator boosting for the epoch
  // Addresses that can ban validators, the bool indicates if the address is the admin

  initialize() {
    return this.finalize_initialize();
  }

  finalize_initialize() {
    // Set the control addresses
    this.control_addresses.set(this.INITIAL_DELEGATOR_APPROVER_ADDRESS, true);
    this.control_addresses.set('pondo_delegator1.aleo', false);
    this.control_addresses.set('pondo_delegator2.aleo', false);
    this.control_addresses.set('pondo_delegator3.aleo', false);
    this.control_addresses.set('pondo_delegator4.aleo', false);
    this.control_addresses.set('pondo_delegator5.aleo', false);

    this.delegator_allocation.set(BigInt('0'), [
      BigInt('3700'),
      BigInt('2600'),
      BigInt('1600'),
      BigInt('1200'),
      BigInt('900'),
      BigInt('900'),
      BigInt('900'),
      BigInt('900'),
      BigInt('900'),
      BigInt('900'),
    ]);
    this.top_validators.set(BigInt('0'), [
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
    ]);
  }

  add_control_address(control_address: string) {
    return this.finalize_add_control_address(control_address, this.caller);
  }

  finalize_add_control_address(control_address: string, caller: string) {
    // Ensure the caller is an admin
    let is_admin: boolean = this.control_addresses.get(caller)!;
    assert(is_admin !== undefined);
    assert(is_admin);

    this.control_addresses.set(control_address, false);
  }

  remove_control_address(control_address: string) {
    return this.finalize_remove_control_address(control_address, this.caller);
  }

  finalize_remove_control_address(control_address: string, caller: string) {
    // Ensure the caller is an admin
    let is_admin: boolean = this.control_addresses.get(caller)!;
    assert(is_admin !== undefined);
    assert(is_admin);

    this.control_addresses.delete(control_address);
  }

  update_admin(new_admin: string) {
    return this.finalize_update_admin(new_admin, this.caller);
  }

  finalize_update_admin(new_admin: string, caller: string) {
    // Ensure the caller is an admin
    let is_admin: boolean = this.control_addresses.get(caller)!;
    assert(is_admin !== undefined);
    assert(is_admin);

    // Set the new admin
    this.control_addresses.set(new_admin, true);
    // Remove the old admin
    this.control_addresses.delete(caller);
  }

  update_delegator_allocations(multiple: bigint[]) {
    return this.finalize_update_delegator_allocations(multiple, this.caller);
  }

  finalize_update_delegator_allocations(multiple: bigint[], caller: string) {
    // Ensure the caller is an admin
    let is_admin: boolean = this.control_addresses.get(caller)!;
    assert(is_admin !== undefined);
    assert(is_admin);

    this.delegator_allocation.set(BigInt('0'), multiple);
  }

  // Called by the reference delegator program to establish that the reference delegator has been created
  // At this point, it hasn't been approved so we cannot trust that the reference delegator actually implements the program correctly
  propose_delegator(validator: string) {
    // Ensure a program is calling
    assert(this.caller !== this.signer);

    return this.finalize_propose_delegator(this.caller, validator);
  }

  finalize_propose_delegator(reference_delegator: string, validator: string) {
    // Ensure the validator isn't banned
    let is_banned: boolean = this.banned_validators.has(validator);
    assert(is_banned === false);

    let contains_delegator: boolean =
      this.delegator_to_validator.has(reference_delegator);
    assert(contains_delegator === false);

    this.delegator_to_validator.set(reference_delegator, validator);
  }

  // To be called by the delegator approver who will have to ensure offchain that the delegator meets the requirements to be considered a reference delegator
  // The only requirement is that reference delegator meets the exact standard set by reference_delegator.aleo
  add_delegator(delegator: string) {
    return this.finalize_add_delegator(delegator, this.caller);
  }

  finalize_add_delegator(delegator: string, caller: string) {
    // Ensure the caller is a admin address
    let is_admin: boolean = this.control_addresses.get(caller)!;
    assert(is_admin !== undefined);
    assert(is_admin);

    // Check that proposed_reference_delegator contains the reference delegator
    let contains_delegator: boolean =
      this.delegator_to_validator.has(delegator);
    assert(contains_delegator === true);

    // Ensure the withdrawal address is the same program address
    let withdraw_address: string = this.credits.withdraw.get(delegator)!;
    assert(withdraw_address !== undefined);
    assert(withdraw_address === delegator);

    // Get the validator address and ensure the delegator is bonded to the validator
    let proposed_validator_address: string =
      this.delegator_to_validator.get(delegator)!;
    assert(proposed_validator_address !== undefined);
    let bonded: bond_state = this.credits.bonded.get(delegator)!;
    assert(bonded !== undefined);
    assert(bonded.validator === proposed_validator_address);

    // Ensure the validator isn't banned
    let is_banned: boolean = this.banned_validators.has(
      proposed_validator_address
    );
    assert(is_banned === false);

    // Ensure the reference delegator is not already part of the reference delegators
    let delegator_already_added: boolean = this.validator_data.has(delegator);
    assert(delegator_already_added === false);

    // Get the commission from the committee state
    let validator_committee_state: committee_state = this.credits.committee.get(
      proposed_validator_address
    )!;
    assert(validator_committee_state !== undefined);
    assert(validator_committee_state.is_open);
    assert(validator_committee_state.commission < this.MAX_COMMISSION);

    // Add to the validator_data
    let initial_validator_datum: validator_datum = {
      delegator: delegator,
      validator: proposed_validator_address,
      block_height: this.block.height,
      bonded_microcredits: bonded.microcredits,
      microcredits_yield_per_epoch: BigInt('0'),
      commission: validator_committee_state.commission,
      boost: BigInt('0'),
    };
    this.validator_data.set(delegator, initial_validator_datum);
  }

  // Update the data for the given reference delegator
  // It's permissionless ie callable by anyone
  update_data(delegator: string) {
    return this.finalize_update_data(delegator);
  }

  finalize_update_data(delegator: string) {
    // Get the existing data, fails if the reference delegator isn't there
    let existing_validator_datum: validator_datum =
      this.validator_data.get(delegator)!;
    assert(existing_validator_datum !== undefined);

    // Ensure the validator isn't banned
    let is_banned: boolean = this.banned_validators.has(
      existing_validator_datum.validator
    );
    assert(is_banned === false);

    // Check if update is in the allowed update period
    let epoch_blocks: bigint = BigInt.asUintN(
      32,
      this.block.height % this.BLOCKS_PER_EPOCH
    );
    let is_update_period: boolean =
      epoch_blocks >= this.UPDATE_BLOCKS_DISALLOWED;
    assert(is_update_period);

    // Ensure an update hasn't been performed in the same epoch yet
    let block_range: bigint = BigInt.asUintN(
      32,
      this.block.height - existing_validator_datum.block_height
    );
    assert(block_range > this.UPDATE_BLOCKS_DISALLOWED);

    // Get the committee state of the validator
    let validator_committee_state: committee_state = this.credits.committee.get(
      existing_validator_datum.validator
    )!;
    assert(validator_committee_state !== undefined);
    // Ensure the commission is less than MAX_COMMISSION
    assert(validator_committee_state.commission < this.MAX_COMMISSION);
    // Ensure the validator is open
    assert(validator_committee_state.is_open);

    // Get the bonded state of the delegator
    let bonded: bond_state = this.credits.bonded.get(delegator)!;
    assert(bonded !== undefined);

    // Get the current epoch
    let current_epoch: bigint = BigInt.asUintN(
      32,
      this.block.height / this.BLOCKS_PER_EPOCH
    );

    // Note: We calculate return per epoch
    // For example, given an annualized return of 10%, after a week we expected 10_000_000_000 microcredits (10K credits) to become 10_018_345_688 microcredits
    // Because we use u128, we cannot calculate a percentage yield as it would always be 0 so we normalize the return
    // to the amount of microcredits earned as if the delegator had 10K credits staked.
    // So the microcredits_yield_per_epoch would be 18_345_688
    let microcredits_earned: bigint = BigInt.asUintN(
      128,
      bonded.microcredits - existing_validator_datum.bonded_microcredits
    );
    let normalized_microcredits_earned: bigint = BigInt.asUintN(
      128,
      (microcredits_earned * this.PRECISION) /
        existing_validator_datum.bonded_microcredits
    );
    let yield_per_epoch: bigint = BigInt.asUintN(
      128,
      (normalized_microcredits_earned * this.BLOCKS_PER_EPOCH) / block_range
    );

    // Get the boost amount for the validator
    let boost: validator_boost = this.validator_boosting.get(
      existing_validator_datum.validator
    ) || { epoch: BigInt('0'), boost_amount: BigInt('0') };
    let boost_amount: bigint = BigInt.asUintN(
      128,
      boost.epoch == current_epoch ? boost.boost_amount : BigInt('0')
    );
    // Normalize the boost amount by the pondo tvl
    let current_pondo_tvl: bigint = BigInt.asUintN(
      128,
      this.pondo_tvl.get(BigInt('0')) || BigInt('10000000000000000')
    ); // use a high default, 10B credits
    // The normalized boost amount is the amount of boost per 10K credits staked
    // Note: This precision is 1 credit on a TVL of 10M credits
    let normalized_boost_amount: bigint = BigInt.asUintN(
      128,
      (boost_amount * this.PRECISION) / current_pondo_tvl
    );

    // Ensure the last update was in the previous epoch, otherwise set the yield to zero
    // The attack here is to prevent a validator from keeping many reference delegators and then choosing the most favorable range.
    let previous_update_epoch: bigint = BigInt.asUintN(
      32,
      existing_validator_datum.block_height / this.BLOCKS_PER_EPOCH
    );
    let did_update_last_epoch: boolean =
      previous_update_epoch + BigInt('1') == current_epoch;
    let new_microcredits_yield_per_epoch: bigint = BigInt.asUintN(
      128,
      did_update_last_epoch
        ? yield_per_epoch + normalized_boost_amount
        : BigInt('0')
    );

    // Construct and save the new validator_datum for the delegator
    let new_validator_datum: validator_datum = {
      delegator: delegator,
      validator: existing_validator_datum.validator,
      block_height: this.block.height,
      bonded_microcredits: bonded.microcredits,
      microcredits_yield_per_epoch: new_microcredits_yield_per_epoch,
      commission: validator_committee_state.commission,
      boost: boost_amount,
    };
    this.validator_data.set(delegator, new_validator_datum);

    // Get the array of top validators
    let top_validators_addresses: string[] = this.top_validators.get(
      BigInt('0')
    )!;
    let default_validator_datum: validator_datum = {
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

    // Fetch all of the data for each validator
    let datum_0: validator_datum =
      this.validator_data.get(top_validators_addresses[0]) ||
      default_validator_datum;
    let datum_1: validator_datum =
      this.validator_data.get(top_validators_addresses[1]) ||
      default_validator_datum;
    let datum_2: validator_datum =
      this.validator_data.get(top_validators_addresses[2]) ||
      default_validator_datum;
    let datum_3: validator_datum =
      this.validator_data.get(top_validators_addresses[3]) ||
      default_validator_datum;
    let datum_4: validator_datum =
      this.validator_data.get(top_validators_addresses[4]) ||
      default_validator_datum;
    let datum_5: validator_datum =
      this.validator_data.get(top_validators_addresses[5]) ||
      default_validator_datum;
    let datum_6: validator_datum =
      this.validator_data.get(top_validators_addresses[6]) ||
      default_validator_datum;
    let datum_7: validator_datum =
      this.validator_data.get(top_validators_addresses[7]) ||
      default_validator_datum;
    let datum_8: validator_datum =
      this.validator_data.get(top_validators_addresses[8]) ||
      default_validator_datum;
    let datum_9: validator_datum =
      this.validator_data.get(top_validators_addresses[9]) ||
      default_validator_datum;

    // Calculate the epoch start block
    let epoch_start_height: bigint = BigInt.asUintN(
      32,
      current_epoch * this.BLOCKS_PER_EPOCH
    );

    // Get the boost multiple
    let allocations: bigint[] = this.delegator_allocation.get(BigInt('0'))!;

    // Perform swaps and drop the last element
    // The order of the this.inline_swap_validator_data is subtle but very important.
    let swap_result_0: [validator_datum, validator_datum, boolean] =
      this.inline_swap_validator_data(
        new_validator_datum,
        datum_0,
        epoch_start_height,
        false,
        allocations[0]
      );
    let swap_result_1: [validator_datum, validator_datum, boolean] =
      this.inline_swap_validator_data(
        swap_result_0[1],
        datum_1,
        epoch_start_height,
        swap_result_0[2],
        allocations[1]
      );
    let swap_result_2: [validator_datum, validator_datum, boolean] =
      this.inline_swap_validator_data(
        swap_result_1[1],
        datum_2,
        epoch_start_height,
        swap_result_1[2],
        allocations[2]
      );
    let swap_result_3: [validator_datum, validator_datum, boolean] =
      this.inline_swap_validator_data(
        swap_result_2[1],
        datum_3,
        epoch_start_height,
        swap_result_2[2],
        allocations[3]
      );
    let swap_result_4: [validator_datum, validator_datum, boolean] =
      this.inline_swap_validator_data(
        swap_result_3[1],
        datum_4,
        epoch_start_height,
        swap_result_3[2],
        allocations[4]
      );
    let swap_result_5: [validator_datum, validator_datum, boolean] =
      this.inline_swap_validator_data(
        swap_result_4[1],
        datum_5,
        epoch_start_height,
        swap_result_4[2],
        allocations[5]
      );
    let swap_result_6: [validator_datum, validator_datum, boolean] =
      this.inline_swap_validator_data(
        swap_result_5[1],
        datum_6,
        epoch_start_height,
        swap_result_5[2],
        allocations[6]
      );
    let swap_result_7: [validator_datum, validator_datum, boolean] =
      this.inline_swap_validator_data(
        swap_result_6[1],
        datum_7,
        epoch_start_height,
        swap_result_6[2],
        allocations[7]
      );
    let swap_result_8: [validator_datum, validator_datum, boolean] =
      this.inline_swap_validator_data(
        swap_result_7[1],
        datum_8,
        epoch_start_height,
        swap_result_7[2],
        allocations[8]
      );
    let swap_result_9: [validator_datum, validator_datum, boolean] =
      this.inline_swap_validator_data(
        swap_result_8[1],
        datum_9,
        epoch_start_height,
        swap_result_8[2],
        allocations[9]
      );
    let new_top_10: string[] = [
      swap_result_0[0].delegator,
      swap_result_1[0].delegator,
      swap_result_2[0].delegator,
      swap_result_3[0].delegator,
      swap_result_4[0].delegator,
      swap_result_5[0].delegator,
      swap_result_6[0].delegator,
      swap_result_7[0].delegator,
      swap_result_8[0].delegator,
      swap_result_9[0].delegator,
    ];

    // Set the new top 10
    this.top_validators.set(BigInt('0'), new_top_10);
  }

  // Remove the reference delegator
  // It can be used whether or not the reference delegator has been approved
  remove_delegator() {
    return this.finalize_remove_delegator(this.caller);
  }

  finalize_remove_delegator(delegator_address: string) {
    // Ensure an update period isn't occuring
    // This protects against a DOS against other validators who could keep a delegator to another validator and then remove it right at the end of the update period
    let epoch_blocks: bigint = BigInt.asUintN(
      32,
      this.block.height % this.BLOCKS_PER_EPOCH
    );
    let is_not_update_period: boolean =
      epoch_blocks < this.UPDATE_BLOCKS_DISALLOWED;
    assert(is_not_update_period);

    // Remove from the proposed_delegators if there
    let contains_delegator: boolean =
      this.delegator_to_validator.has(delegator_address);
    if (contains_delegator) {
      this.delegator_to_validator.delete(delegator_address);
    }

    // Remove from the validator_data
    let data_contains_delegator: boolean =
      this.validator_data.has(delegator_address);
    if (data_contains_delegator) {
      this.validator_data.delete(delegator_address);
    }

    // Remove from the top 10 validators if there
    let top_validators_addresses: string[] = this.top_validators.get(
      BigInt('0')
    )!;
    let new_validator_0: string =
      top_validators_addresses[0] == delegator_address
        ? 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
        : top_validators_addresses[0];
    let new_validator_1: string =
      top_validators_addresses[1] == delegator_address
        ? 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
        : top_validators_addresses[1];
    let new_validator_2: string =
      top_validators_addresses[2] == delegator_address
        ? 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
        : top_validators_addresses[2];
    let new_validator_3: string =
      top_validators_addresses[3] == delegator_address
        ? 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
        : top_validators_addresses[3];
    let new_validator_4: string =
      top_validators_addresses[4] == delegator_address
        ? 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
        : top_validators_addresses[4];
    let new_validator_5: string =
      top_validators_addresses[5] == delegator_address
        ? 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
        : top_validators_addresses[5];
    let new_validator_6: string =
      top_validators_addresses[6] == delegator_address
        ? 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
        : top_validators_addresses[6];
    let new_validator_7: string =
      top_validators_addresses[7] == delegator_address
        ? 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
        : top_validators_addresses[7];
    let new_validator_8: string =
      top_validators_addresses[8] == delegator_address
        ? 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
        : top_validators_addresses[8];
    let new_validator_9: string =
      top_validators_addresses[9] == delegator_address
        ? 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
        : top_validators_addresses[9];

    // Swap until 0group address is at the end of the array
    let swap_result_0: string[] = this.inline_swap_zero_group_address(
      new_validator_0,
      new_validator_1
    );
    let swap_result_1: string[] = this.inline_swap_zero_group_address(
      swap_result_0[1],
      new_validator_2
    );
    let swap_result_2: string[] = this.inline_swap_zero_group_address(
      swap_result_1[1],
      new_validator_3
    );
    let swap_result_3: string[] = this.inline_swap_zero_group_address(
      swap_result_2[1],
      new_validator_4
    );
    let swap_result_4: string[] = this.inline_swap_zero_group_address(
      swap_result_3[1],
      new_validator_5
    );
    let swap_result_5: string[] = this.inline_swap_zero_group_address(
      swap_result_4[1],
      new_validator_6
    );
    let swap_result_6: string[] = this.inline_swap_zero_group_address(
      swap_result_5[1],
      new_validator_7
    );
    let swap_result_7: string[] = this.inline_swap_zero_group_address(
      swap_result_6[1],
      new_validator_8
    );
    let swap_result_8: string[] = this.inline_swap_zero_group_address(
      swap_result_7[1],
      new_validator_9
    );

    let new_top_validators_addresses: string[] = [
      swap_result_0[0],
      swap_result_1[0],
      swap_result_2[0],
      swap_result_3[0],
      swap_result_4[0],
      swap_result_5[0],
      swap_result_6[0],
      swap_result_7[0],
      swap_result_8[0],
      swap_result_8[1],
    ];
    this.top_validators.set(BigInt('0'), new_top_validators_addresses);
  }

  // Pondo delegators can ban a validator
  // This is to prevent a validator from keeping reference delegators while forcibly unbonding pondo delegators
  // or closing the validator to delegators when the pondo delegators try to bond
  pondo_ban_validator(validator: string) {
    return this.finalize_pondo_ban_validator(validator, this.caller);
  }

  finalize_pondo_ban_validator(validator: string, caller: string) {
    // Check if the caller is a control address
    let is_control_address: boolean = this.control_addresses.has(caller);
    assert(is_control_address);

    this.banned_validators.set(validator, true);
  }

  // Anyone can ban a validator if the validator in the update window if:
  // 1. The validator has a commission greater than MAX_COMMISSION
  // 2. The validator leaves the committee
  ban_validator(reference_delegator: string) {
    return this.finalize_ban_validator(reference_delegator);
  }

  finalize_ban_validator(reference_delegator: string) {
    // Get the validator address
    let validator: string =
      this.delegator_to_validator.get(reference_delegator)!;
    assert(validator !== undefined);

    // Check if the height is within the update window
    let epoch_blocks: bigint = BigInt.asUintN(
      32,
      this.block.height % this.BLOCKS_PER_EPOCH
    );
    let is_update_period: boolean =
      epoch_blocks >= this.UPDATE_BLOCKS_DISALLOWED;
    assert(is_update_period);

    // Default committee state of the validator
    let default_committee_state: committee_state = {
      is_open: false,
      commission: this.MAX_COMMISSION + BigInt('1'),
    };
    // Get the committee state of the validator
    let validator_committee_state: committee_state =
      this.credits.committee.get(validator) || default_committee_state;
    // Ensure the validator is open & the commission is less than MAX_COMMISSION
    assert(
      !validator_committee_state.is_open ||
        validator_committee_state.commission > this.MAX_COMMISSION
    );

    this.banned_validators.set(validator, true);
  }

  // Set the pondo tvl from the core protocol
  // Used for boost pool normalization
  set_pondo_tvl(tvl: bigint) {
    assert(this.caller === 'pondo_core_protocol.aleo');

    return this.finalize_set_pondo_tvl(tvl);
  }

  finalize_set_pondo_tvl(tvl: bigint) {
    this.pondo_tvl.set(BigInt('0'), tvl);
  }

  // Ban a validator as the withdrawal address of that validator
  ban_self(validator: string) {
    return this.finalize_ban_self(validator, this.caller);
  }

  finalize_ban_self(validator: string, caller: string) {
    // Ensure the caller is the withdrawal address of the validator
    let withdraw_address: string = this.credits.withdraw.get(validator)!;
    assert(withdraw_address !== undefined);
    assert(withdraw_address === caller);

    // Assert that the validator is in the committee, will fail
    let committee_state_contains_validator: boolean =
      this.credits.committee.has(validator);
    assert(committee_state_contains_validator);

    // Ban the validator
    this.banned_validators.set(validator, true);
  }

  // Boost a validator
  boost_validator(validator: string, boost_amount: bigint) {
    // Transfer credits to the pondo core protocol

    this.credits.signer = this.signer;
    this.credits.caller = 'pondo_oracle.aleo';
    this.credits.transfer_public_as_signer(
      'pondo_core_protocol.aleo',
      boost_amount
    );

    return this.finalize_boost_validator(validator, boost_amount);
  }

  finalize_boost_validator(validator: string, boost_amount: bigint) {
    // Wait for the transfer to complete

    // Get the current epoch
    let current_epoch: bigint = BigInt.asUintN(
      32,
      this.block.height / this.BLOCKS_PER_EPOCH
    );

    // Ensure that you cannot boost during the update period
    let epoch_blocks: bigint = BigInt.asUintN(
      32,
      this.block.height % this.BLOCKS_PER_EPOCH
    );
    let is_update_period: boolean =
      epoch_blocks >= this.UPDATE_BLOCKS_DISALLOWED;
    assert(!is_update_period);

    // Get the current boosting for the validator
    let current_boost: validator_boost = this.validator_boosting.get(
      validator
    ) || { epoch: BigInt('0'), boost_amount: BigInt('0') };

    // If the boost is in the same epoch, add the boost amount
    let new_boost_amount: bigint = BigInt.asUintN(
      64,
      current_boost.epoch == current_epoch
        ? current_boost.boost_amount + boost_amount
        : boost_amount
    );

    // Set the boosting for the validator
    let new_boost: validator_boost = {
      epoch: current_epoch,
      boost_amount: new_boost_amount,
    };
    this.validator_boosting.set(validator, new_boost);
  }

  // Swap the positions of each datum given:
  // 1. If auto swap bit is on, always swap
  // 2. If one is outdated (if both are outdated, preference no swap)
  // 3. If one yield is 0 (if both are 0, preference no swap)
  // 4. The higher yield or the lower yield if they reference the same validator
  inline_swap_validator_data(
    datum_0: validator_datum,
    datum_1: validator_datum,
    epoch_start_block: bigint,
    auto_swap: boolean,
    boost_multiple: bigint
  ): [validator_datum, validator_datum, boolean] {
    if (auto_swap) {
      return [datum_1, datum_0, true];
    }

    // If the delegator are the same, don't swap and turn auto_swap on afterwards
    // This keeps the new delegator and forces out the old one
    if (datum_0.delegator == datum_1.delegator) {
      return [datum_0, datum_1, true];
    }

    // If the validator is the same, automatically swap down the loser of this check out of the list
    let new_auto_swap: boolean = datum_0.validator == datum_1.validator;

    // Check if either one is outdated
    // The default validator datum used for 0group addresses uses 0u32 for the block_height
    // So we will catch any 0group addresses here
    if (datum_1.block_height < epoch_start_block) {
      return [datum_0, datum_1, new_auto_swap];
    }
    if (datum_0.block_height < epoch_start_block) {
      return [datum_1, datum_0, new_auto_swap];
    }

    // Handle the edge case of one of the yields being 0 as 0 is automatically used when the validator wasn't updated last epoch
    if (datum_1.microcredits_yield_per_epoch == BigInt('0')) {
      return [datum_0, datum_1, new_auto_swap];
    }
    if (datum_0.microcredits_yield_per_epoch == BigInt('0')) {
      return [datum_1, datum_0, new_auto_swap];
    }

    // Calculate the yields
    // Note: the boost multiple depends on the % of the pondo tvl that the spot would get
    // If the boost multiple is too high, it would be more profitable to boost than to decrease commission ie protocol loses money
    // If the boost multiple is too low, it would be more profitable to decrease commission than to boost ie no one would ever boost unless commissions were 0s
    let first_yield: bigint = BigInt.asUintN(
      128,
      datum_0.microcredits_yield_per_epoch +
        (datum_0.boost * this.BOOST_PRECISION) / boost_multiple
    );
    let second_yield: bigint = BigInt.asUintN(
      128,
      datum_1.microcredits_yield_per_epoch +
        (datum_1.boost * this.BOOST_PRECISION) / boost_multiple
    );

    // Choose the datum with the higher yield in the normal case
    // In the case where they reference the same validator, return the one with the lower yield
    // If we return the one with the higher yield, a validator may keep 2 reference delegators around and alternate them
    // such that they could raise their commission to 100% during the update period up to a day if they execute it perfectly
    // without the oracle knowing anything
    // The alternative is that if we choose the lower one, it's much more difficult and expensive for competing validators
    // to keep around many delegators with slightly different ranges and try to choose the worst one for their competitors.
    // all the while paying transaction fees while giving their competitors commissions from delegations.
    let should_swap: boolean = new_auto_swap
      ? first_yield > second_yield
      : first_yield < second_yield;

    return should_swap
      ? [datum_1, datum_0, new_auto_swap]
      : [datum_0, datum_1, new_auto_swap];
  }

  // Swap the zero group address to the end of the list
  inline_swap_zero_group_address(address_0: string, address_1: string) {
    if (
      address_0 ==
      'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc'
    ) {
      return [address_1, address_0];
    } else {
      return [address_0, address_1];
    }
  }
}
