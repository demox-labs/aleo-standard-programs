import {
  referenceDelegator,
  oracle,
  credits,
} from '../contracts/pondoProgramsIndex';
import { block } from './ChainEmulator';

export class ReferenceDelegator {
  credits: credits;
  oracle: oracle;
  contract: referenceDelegator;

  constructor(credits: credits, oracle: oracle, block: block) {
    this.credits = credits;
    this.oracle = oracle;
    this.contract = new referenceDelegator(this.oracle, this.credits);
  }
}
