import { token } from './ale';
import { credits } from './credits';

import assert from 'assert';
// interfaces
export interface delegator_distribution {
  block_height: bigint;
        // validators must be in order of delegator contracts.
        // delegator1's validator is validators[0]
        // delegator5's validator is validators[4]
  validators: string[];
        // validator performances must be in the same order as the validators
        // should be in the expected % yield per week
  performances: bigint[];
  rewards: bigint[];
}
export class oracleProgram {
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  average_block_reward: Map<bigint, bigint> = new Map();
  residual_delegator: Map<string, bigint> = new Map();
  orphaned_delegator: Map<string, bigint> = new Map();
  delegator_state: Map<bigint, delegator_distribution> = new Map();
  constructor(
    // constructor args
  ) {
    // constructor body
  }
  // The 'oracle' program.
  //program oracle.aleo {    
// map a starting block that makes this proposal active to the distribution
// 0u8 current distribution
// 1u8 next distribution
    
// 0u8 => average block reward
    
  set_data(
    new_block_height: bigint,
    new_validators: string[],
    new_performances: bigint[],
    new_rewards: bigint[],
  ) {
// assert that distribution adds up to PRECISION
    return this.finalize_set_data(new_block_height, new_validators, new_performances, new_rewards);
    }
    
  finalize_set_data(
    new_block_height: bigint,
    new_validators: string[],
    new_performances: bigint[],
    new_rewards: bigint[],
  ) {
    let new_state: delegator_distribution = {
    block_height: new_block_height,
    validators: new_validators,
    performances: new_performances,
    rewards: new_rewards
    };
    this.delegator_state.set(BigInt("1"), new_state);
    }
    
  confirm_data(
    validators: string[],
    performances: bigint[],
    rewards: bigint[],
  ) {
    return this.finalize_confirm_data(validators, performances, rewards);
    }
    
  finalize_confirm_data(
    validators: string[],
    performances: bigint[],
    rewards: bigint[],
  ) {
    let dist_state: delegator_distribution = this.delegator_state.get(BigInt("1"))!;
    assert(dist_state.validators === validators);
    assert(dist_state.performances === performances);
    assert(dist_state.rewards === rewards);
    }
    
  set_orphaned_delegator(
    delegator: string,
    amount: bigint,
  ) {
    return this.finalize_set_orphaned_delegator(delegator, amount);
    }
    
  finalize_set_orphaned_delegator(
    delegator: string,
    amount: bigint,
  ) {
    this.orphaned_delegator.set(delegator, amount);
    }
    
  confirm_orphaned_delegator(
    delegator: string,
    amount: bigint,
  ) {
    return this.finalize_confirm_orphaned_delegator(delegator, amount);
    }
    
  finalize_confirm_orphaned_delegator(
    delegator: string,
    amount: bigint,
  ) {
    let orphaned_amount: bigint = this.orphaned_delegator.get(delegator)!;
    assert(orphaned_amount === amount);
    }
    
  set_average_block_reward(
    amount: bigint,
  ) {
    return this.finalize_set_average_block_reward(amount);
    }
    
  finalize_set_average_block_reward(
    amount: bigint,
  ) {
    this.average_block_reward.set(BigInt("0"), amount);
    }
    
  confirm_average_block_reward(
    amount: bigint,
  ) {
    return this.finalize_confirm_average_block_reward(amount);
    }
    
  finalize_confirm_average_block_reward(
    amount: bigint,
  ) {
    let average_amount: bigint = this.average_block_reward.get(BigInt("0"))!;
    assert(average_amount === amount);
    }
    
  set_residual_delegator(
    delegator: string,
    amount: bigint,
  ) {
    return this.finalize_set_residual_delegator(delegator, amount);
    }
    
  finalize_set_residual_delegator(
    delegator: string,
    amount: bigint,
  ) {
    this.residual_delegator.set(delegator, amount);
    }
    
  clear_residual_delegator(
    delegator: string,
    amount: bigint,
  ) {
    return this.finalize_clear_residual_delegator(delegator, amount);
    }
    
  finalize_clear_residual_delegator(
    delegator: string,
    amount: bigint,
  ) {
    let orphaned_amount: bigint = this.orphaned_delegator.get(delegator)!;
    assert(orphaned_amount === amount);
    this.residual_delegator.delete(delegator);
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
