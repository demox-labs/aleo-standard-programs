import assert from 'assert';
import {
  credits,
  MTSP,
  coreProtocol,
  oracle,
  referenceDelegator,
  pALEO,
  PNDO,
  delegator1,
  delegator2,
  delegator3,
  delegator4,
  delegator5,
} from '../contracts/pondoProgramsIndex';
import { OracleManager } from './OracleManager';

export interface block {
  height: bigint;
}

export class ChainEmulator {
  block: block = { height: BigInt(0) };
  credits: credits;
  mtsp: MTSP;
  oracle: OracleManager;

  constructor() {
    this.credits = new credits();
    this.credits.block = this.block;
    this.mtsp = new MTSP(this.credits);
    this.oracle = new OracleManager(this.credits);
  }

  establishOracleHistory() {}
}
