import { pondo_oracleProgram } from './pondo_oracle';
import { creditsProgram } from './credits';

import assert from 'assert';
// interfaces
export class reference_delegatorProgram {
  signer: string = "not set";
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  initialized: Map<bigint, bigint> = new Map();
  MIN_DELEGATION = BigInt("10_000_000_000");
  VALIDATOR = "aleo1j0zju7f0fpgv98gulyywtkxk6jca99l6425uqhnd5kccu4jc2grstjx0mt";
  ADMIN = "aleo1j0zju7f0fpgv98gulyywtkxk6jca99l6425uqhnd5kccu4jc2grstjx0mt";
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

  //program reference_delegator.aleo {// The address of the person who controls this program
  // The address of the validator who will be delegated to
  // The minimum delegation set by the credits.aleo program

  // A mapping to set a bit that the program has been initialized

  initialize(
  ) {
    // Ensure the admin is calling
    assert(this.caller === this.ADMIN);

    // Transfer 10K credits to the program
    this.credits.caller = "reference_delegator.aleo";
    this.credits.transfer_public_as_signer("reference_delegator.aleo", this.MIN_DELEGATION);

    // Delegate those 10K credits to a validator
    this.credits.caller = "reference_delegator.aleo";
    this.credits.bond_public(this.VALIDATOR, "reference_delegator.aleo", this.MIN_DELEGATION);

    // Register the reference delegation with the pondo oracle
    this.pondo_oracle.caller = "reference_delegator.aleo";
    this.pondo_oracle.propose_delegator(this.VALIDATOR);

    return this.finalize_initialize();
  }

  finalize_initialize(
  ) {
    // Await all of the cross program invocations
    // transfer_public_as_signer to this program
    // bond_public to the specified validator
    // propose_reference_delegator

    // Ensure this program can only be initialized one time
    let is_initialized: boolean = this.initialized.has(BigInt("0"));
    assert(is_initialized === false);

    // Set to 8 as 8 is lucky
    this.initialized.set(BigInt("0"), BigInt("8"));
  }

  // In order to successfully call remove, the amount input must be enough to fully unbond the delegator
  // credits.aleo/bonded[reference_delegator.aleo].microcredits - 10K credits < amount <= credits.aleo/bonded[reference_delegator.aleo].microcredits
  remove(
    amount: bigint,
  ) {
    // Ensure the admin is calling
    assert(this.caller === this.ADMIN);

    // Unbond_public
    this.credits.caller = "reference_delegator.aleo";
    this.credits.unbond_public("reference_delegator.aleo", amount);

    // Remove the reference delegator
    this.pondo_oracle.caller = "reference_delegator.aleo";
    this.pondo_oracle.remove_delegator();

    return this.finalize_remove();
  }

  finalize_remove(
  ) {
    // Await all of the cross program invocations
    // unbond_public
    // remove_reference_delegator

    // Assert that the delegator is fully unbonded
    let still_bonded: boolean = this.credits.bonded.has("reference_delegator.aleo");
    assert(still_bonded === false);
  }

  // In order to call this, someone has to call credits.aleo/claim_unbond_public
  // As it is a permissionless call, anyone can call it first
  withdraw(
    amount: bigint,
  ) {
    // Transfer all of the balance to the admin
    this.credits.caller = "reference_delegator.aleo";
    this.credits.transfer_public(this.ADMIN, amount);

    return this.withdraw_balance();
  }

  withdraw_balance(
  ) {
    // Await the transfer_public


    // Ensure there's not remaining balance
    let balance: bigint = this.credits.account.get("reference_delegator.aleo") || BigInt("0");
    assert(balance === BigInt("0"));
  }
}
