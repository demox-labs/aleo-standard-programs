import {
  credits,
  delegator1,
  oracle,
} from "../../src/contracts/pondoProgramsIndex";
import { block } from "../../src/PNDO/ChainEmulator";

describe("Pondo delegator tests", () => {
  let block: block;
  let creditsContract: credits;
  let oracleContract: oracle;
  let delegator: delegator1;

  beforeEach(() => {
    // Setup
    block = { height: BigInt(0) };
    creditsContract = new credits(block);
    oracleContract = new oracle(creditsContract);
    delegator = new delegator1(oracleContract, creditsContract);
  });

  it("initialize can only be called by core protocol, sets terminal state", () => {
    delegator.caller = "not core protocol";
    expect(() => delegator.initialize()).toThrow();

    delegator.caller = "pondo_core_protocol.aleo";
    delegator.initialize();
    expect(delegator.state_mapping.get(BigInt(0))).toBe(delegator.TERMINAL);
  });
});
