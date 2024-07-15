import {
  referenceDelegator,
  oracle,
  credits,
} from "../contracts/pondoProgramsIndex";
import { block } from "./ChainEmulator";

export class OracleManager {
  block: block;
  credits: credits;
  oracle: oracle;
  referenceDelegators: referenceDelegator[] = [];

  constructor(credits: credits, block: block) {
    this.block = block;
    this.credits = credits;
    this.oracle = new oracle(credits, block);
  }

  createReferenceDelegator(): referenceDelegator {
    const referenceDelegatorContract = new referenceDelegator(
      this.oracle,
      this.credits,
      this.block
    );
    this.referenceDelegators.push(referenceDelegatorContract);
    return referenceDelegatorContract;
  }
}
