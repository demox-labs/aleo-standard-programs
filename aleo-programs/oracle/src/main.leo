// The 'oracle' program.
program oracle.aleo {
    struct delegator_distribution {
      block_height: u32,
      // validators must be in order of delegator contracts.
      // delegator1's validator is validators[0]
      // delegator5's validator is validators[4]
      validators: [address; 5],
      // validator performances must be in the same order as the validators
      // should be in the expected % yield per week
      performances: [u64; 5],
      rewards: [u64; 5]
    }

    // map a starting block that makes this proposal active to the distribution
    // 0u8 current distribution
    // 1u8 next distribution
    mapping delegator_state: u8 => delegator_distribution;
    mapping orphaned_delegator: address => u64;
    mapping residual_delegator: address => u64;

    // 0u8 => average block reward
    mapping average_block_reward: u8 => u64;

    transition set_data(
      public new_block_height: u32,
      public new_validators: [address; 5],
      public new_performances: [u64; 5],
      public new_rewards: [u64; 5]
      ) {
      // assert that distribution adds up to PRECISION
      return then finalize(new_block_height, new_validators, new_performances, new_rewards);
    }

    finalize set_data(
      public new_block_height: u32,
      public new_validators: [address; 5],
      public new_performances: [u64; 5],
      public new_rewards: [u64; 5]
      ) {
      let new_state: delegator_distribution = delegator_distribution {
        block_height: new_block_height,
        validators: new_validators,
        performances: new_performances,
        rewards: new_rewards
      };
      delegator_state.set(1u8, new_state);
    }

    transition confirm_data(
      public validators: [address; 5],
      public performances: [u64; 5],
      public rewards: [u64; 5]
      ) {
      return then finalize(validators, performances, rewards);
    }

    finalize confirm_data(
      public validators: [address; 5],
      public performances: [u64; 5],
      public rewards: [u64; 5]
      ) {
      let dist_state: delegator_distribution = delegator_state.get(1u8);
      assert_eq(dist_state.validators, validators);
      assert_eq(dist_state.performances, performances);
      assert_eq(dist_state.rewards, rewards);
    }

    transition set_orphaned_delegator(
      public delegator: address,
      public amount: u64
      ) {
      return then finalize(delegator, amount);
    }

    finalize set_orphaned_delegator(
      public delegator: address,
      public amount: u64
      ) {
      orphaned_delegator.set(delegator, amount);
    }

    transition confirm_orphaned_delegator(
      public delegator: address,
      public amount: u64
      ) {
      return then finalize(delegator, amount);
    }

    finalize confirm_orphaned_delegator(
      public delegator: address,
      public amount: u64
      ) {
      let orphaned_amount: u64 = orphaned_delegator.get(delegator);
      assert_eq(orphaned_amount, amount);
    }

    transition set_average_block_reward(
      public amount: u64
      ) {
      return then finalize(amount);
    }

    finalize set_average_block_reward(
      public amount: u64
      ) {
      average_block_reward.set(0u8, amount);
    }

    transition confirm_average_block_reward(
      public amount: u64
      ) {
      return then finalize(amount);
    }

    finalize confirm_average_block_reward(
      public amount: u64
      ) {
      let average_amount: u64 = average_block_reward.get(0u8);
      assert_eq(average_amount, amount);
    }

    transition set_residual_delegator(
      public delegator: address,
      public amount: u64
      ) {
      return then finalize(delegator, amount);
    }

    finalize set_residual_delegator(
      public delegator: address,
      public amount: u64
      ) {
      residual_delegator.set(delegator, amount);
    }

    transition clear_residual_delegator(
      public delegator: address,
      public amount: u64
      ) {
      return then finalize(delegator, amount);
    }

    finalize clear_residual_delegator(
      public delegator: address,
      public amount: u64
      ) {
      let orphaned_amount: u64 = orphaned_delegator.get(delegator);
      assert_eq(orphaned_amount, amount);
      residual_delegator.remove(delegator);
    }
}
  // 1. Data oracles provide (hardcode who the oracles are)
  // Should take an array of N validators addresses & N percentages
  // Should be called once a week and we have a specific address that can make the request
  // We may want to make this multi-sig where multiple addresses have to put in a data update
  // Create approval records for other oracles

//finalize oracle_set_data:
//  input Array<Addresses>
//  input Array<u64>

  // Assert caller is part of oracle set

  // An active and non-expired proposal will force failure
//  current_proposal = get validator_blockstate[u64.MAX] || empty_proposal_with_block_height_set to u64MAX
//  assert(current_proposal.height <= current_block_height)

//  set validator_block_state[u64.MAX] = new Proposal {
//    ...format inputs
//    block_height = current_block_height + SOME_NUMBER_OF_BLOCKS

//  }

//transition approve_oracle_state:
  // 1. Input an approve record
  // 2. Add one to approval for mapping

//}
