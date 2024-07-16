import { credits, PNDO, MTSP } from "../../src/contracts/pondoProgramsIndex";

describe("Pondo token tests", () => {
  let credits: credits;
  let mtsp: MTSP;
  let pondo: PNDO;

  beforeEach(() => {
    mtsp = new MTSP(credits);
    pondo = new PNDO(mtsp);
  });

  it("", () => {});
});
