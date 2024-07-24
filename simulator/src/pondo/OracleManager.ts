import { oracle, credits } from '../contracts/pondoProgramsIndex';
import { ReferenceDelegator } from './ReferenceDelegator';
import { block } from './ChainEmulator';

export class OracleManager {
  block: block;
  credits: credits;
  oracle: oracle;

  constructor(credits: credits) {
    this.block = credits.block;
    this.credits = credits;
    this.oracle = new oracle(credits);
  }

  createReferenceDelegator(
    admin: string,
    validator: string
  ): ReferenceDelegator {
    const referenceDelegatorContract = new ReferenceDelegator(
      this.credits,
      this.oracle,
      admin,
      validator
    );
    return referenceDelegatorContract;
  }

  // define default set of validators
  // deploy reference delegator contracts with each of them
  // map from validator address to reference delegator contract and corresponding admin address
  // fund admin accounts
}
