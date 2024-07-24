import {
  referenceDelegator,
  oracle,
  credits,
} from '../contracts/pondoProgramsIndex';

export class ReferenceDelegator {
  credits: credits;
  oracle: oracle;
  contract: referenceDelegator;

  constructor(
    credits: credits,
    oracle: oracle,
    admin: string,
    validator: string
  ) {
    this.credits = credits;
    this.oracle = oracle;
    this.contract = new referenceDelegator(
      this.oracle,
      this.credits,
      admin,
      validator
    );
  }
}
