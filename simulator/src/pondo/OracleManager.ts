import {
  referenceDelegator,
  oracle,
  credits,
} from '../contracts/pondoProgramsIndex';
import { block } from './ChainEmulator';

export class OracleManager {
  block: block;
  credits: credits;
  oracle: oracle;
  referenceDelegators: referenceDelegator[] = [];

  constructor(credits: credits) {
    this.block = credits.block;
    this.credits = credits;
    this.oracle = new oracle(credits);
  }

  createReferenceDelegator(): referenceDelegator {
    const referenceDelegatorContract = new referenceDelegator(
      this.oracle,
      this.credits
    );
    this.referenceDelegators.push(referenceDelegatorContract);
    return referenceDelegatorContract;
  }
}
