import { credits } from './credits';

import assert from 'assert';
// interfaces
export interface approval {
  approver: string;
  spender: string;
}
export interface token {
  owner: string;
  amount: bigint;
}
export class axelProgram {
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  approvals: Map<string, bigint> = new Map();
  totals: Map<bigint, bigint> = new Map();
  account: Map<string, bigint> = new Map();
  constructor(
    // constructor args
  ) {
    // constructor body
  }
  // TODO: replace with ARC-20 standard, plus burn/mint
  //program axel.aleo {    
// 0u8 -- total minted
// 1u8 -- total burned
    
    
    
    
  approve_public(
    spender: string,
    amount: bigint,
  ) {
    let approve: approval = {
    approver: this.caller,
    spender: spender
    };
    let approval_hash: string = approve.toString();
    
    return this.finalize_approve_public(approval_hash, amount);
    }
    
  finalize_approve_public(
    approval_hash: string,
    amount: bigint,
  ) {
    let approvals_value: bigint = this.approvals.get(approval_hash) || BigInt("0");
    let new_approvals_value: bigint = approvals_value + amount;
    this.approvals.set(approval_hash, new_approvals_value);
    }
    
  unapprove_public(
    spender: string,
    amount: bigint,
  ) {
    let approve: approval = {
    approver: this.caller,
    spender: spender
    };
    let approval_hash: string = approve.toString();
    
    return this.finalize_unapprove_public(approval_hash, amount);
    }
    
  finalize_unapprove_public(
    approval_hash: string,
    amount: bigint,
  ) {
    let approvals_value: bigint = this.approvals.get(approval_hash) || BigInt("0");
    let new_approvals_value: bigint = approvals_value - amount;
    
    this.approvals.set(approval_hash, new_approvals_value);
    }
    
  transfer_from_public(
    approver: string,
    receiver: string,
    amount: bigint,
  ) {
    let approve: approval = {
    approver: approver,
    spender: this.caller
    };
    
    let approval_hash: string = approve.toString();
    
    return this.finalize_transfer_from_public(approval_hash, approver, receiver, amount);
    }
    
  finalize_transfer_from_public(
    approval_hash: string,
    approver: string,
    receiver: string,
    amount: bigint,
  ) {
    let approvals_value: bigint = this.approvals.get(approval_hash)!;
    let new_approvals_value: bigint = approvals_value - amount;
    this.approvals.set(approval_hash, new_approvals_value);
    
    let approver_balance: bigint = this.account.get(approver)!;
    let new_approver_balance: bigint = approver_balance - amount;
    this.account.set(approver, new_approver_balance);
    
    let receiver_balance: bigint = this.account.get(receiver) || BigInt("0");
    let new_receiver_balance: bigint = receiver_balance + amount;
    this.account.set(receiver, new_receiver_balance);
    }
    
  transfer_public(
    receiver: string,
    amount: bigint,
  ) {
    return this.finalize_transfer_public(this.caller, receiver, amount);
    }
    
  finalize_transfer_public(
    sender: string,
    receiver: string,
    amount: bigint,
  ) {
    let sender_balance: bigint = this.account.get(sender) || BigInt("0");
    let new_sender_balance: bigint = sender_balance - amount;
    this.account.set(sender, new_sender_balance);
    
    let receiver_balance: bigint = this.account.get(receiver) || BigInt("0");
    let new_receiver_balance: bigint = receiver_balance + amount;
    this.account.set(receiver, new_receiver_balance);
    }
    
    
  transfer_private(
    input_record: token,
    receiver: string,
    amount: bigint,
  ) {
    let new_input_record: token = {
    owner: input_record.owner,
    amount: input_record.amount - amount
    };
    
    let receiver_record: token = {
    owner: receiver,
    amount: amount
    };
    
    return [new_input_record, receiver_record];
    }
    
    
  transfer_private_to_public(
    input_record: token,
    receiver: string,
    amount: bigint,
  ) {
    let output_record: token = {
    owner: input_record.owner,
    amount: input_record.amount - amount
    };
    
    this.finalize_transfer_private_to_public(receiver, amount);
    return output_record;  
}
    
  finalize_transfer_private_to_public(
    receiver: string,
    amount: bigint,
  ) {
    let receiver_balance: bigint = this.account.get(receiver) || BigInt("0");
    let new_receiver_balance: bigint = receiver_balance + amount;
    this.account.set(receiver, new_receiver_balance);
    }
    
    
  transfer_public_to_private(
    receiver: string,
    amount: bigint,
  ) {
    let output_record: token = {
    owner: receiver,
    amount: amount
    };
    
    this.finalize_transfer_public_to_private(this.caller, amount);
    return output_record;  
}
    
  finalize_transfer_public_to_private(
    sender: string,
    amount: bigint,
  ) {
    let sender_balance: bigint = this.account.get(sender) || BigInt("0");
    let new_sender_balance: bigint = sender_balance - amount;
    this.account.set(sender, new_sender_balance);
    }
    
  mint_public(
    amount: bigint,
    receiver: string,
  ) {
// assert self.caller == address of core_protocol.aleo;
    
    return this.finalize_mint_public (amount, receiver);
    
    }
    
  finalize_mint_public(
    amount: bigint,
    receiver: string,
  ) {
    let total_minted: bigint = this.totals.get(BigInt("0")) || BigInt("0");
// one time mint
    assert(total_minted === BigInt("0"));
    let new_total_minted: bigint = total_minted + amount;
    this.totals.set(BigInt("0"), new_total_minted);
    
    let receiver_balance: bigint = this.account.get(receiver) || BigInt("0");
    let new_receiver_balance: bigint = receiver_balance + amount;
    this.account.set(receiver, new_receiver_balance);
    }
    
  burn_private(
    input_record: token,
  ) {
// assert self.caller == address of core_protocol.aleo;
    return this.finalize_burn_private(input_record.amount);
    }
    
  finalize_burn_private(
    amount: bigint,
  ) {
    let total_burned: bigint = this.totals.get(BigInt("1")) || BigInt("0");
    let new_total_burned: bigint = total_burned + amount;
    this.totals.set(BigInt("1"), new_total_burned);
    }
    
  burn_public(
    burner: string,
    amount: bigint,
  ) {
// assert self.caller == address of core_protocol.aleo;
    return this.finalize_burn_public(burner, amount);
    }
    
  finalize_burn_public(
    burner: string,
    amount: bigint,
  ) {
    let burner_balance: bigint = this.account.get(burner) || BigInt("0");
// TODO: Check, should be protected by underflow
    let new_burner_balance: bigint = burner_balance - amount;
    this.account.set(burner, new_burner_balance);
    
    let total_burned: bigint = this.totals.get(BigInt("1")) || BigInt("0");
    let new_total_burned: bigint = total_burned + amount;
    this.totals.set(BigInt("1"), new_total_burned);
    }
    }
