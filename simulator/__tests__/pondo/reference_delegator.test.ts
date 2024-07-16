import {
  credits,
  oracle,
  referenceDelegator,
} from "../../src/contracts/pondoProgramsIndex";
import { block } from "../../src/PNDO/ChainEmulator";

const VALIDATOR =
  "aleo1j0zju7f0fpgv98gulyywtkxk6jca99l6425uqhnd5kccu4jc2grstjx0mt";
const ADMIN = "aleo1j0zju7f0fpgv98gulyywtkxk6jca99l6425uqhnd5kccu4jc2grstjx0mt";

describe("ReferenceDelegator tests", () => {
  let block: block;
  let creditsContract: credits;
  let oracleContract: oracle;
  let referenceDelegatorContract: referenceDelegator;

  beforeEach(() => {
    // Setup
    block = { height: BigInt(0) };
    creditsContract = new credits(block);
    oracleContract = new oracle(creditsContract);
    referenceDelegatorContract = new referenceDelegator(
      oracleContract,
      creditsContract,
      block,
      ADMIN,
      VALIDATOR
    );
  });

  it("initialize bonds, and registers with oracle", () => {});
});
