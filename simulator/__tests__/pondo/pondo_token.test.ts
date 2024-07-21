import { credits, PNDO, MTSP } from '../../src/contracts/pondoProgramsIndex';

describe('Pondo token tests', () => {
  let creditsInstance: credits;
  let mtsp: MTSP;
  let pondo: PNDO;

  beforeEach(() => {
    creditsInstance = new credits();
    mtsp = new MTSP(creditsInstance);
    pondo = new PNDO(mtsp);
  });

  it('', () => {});
});
