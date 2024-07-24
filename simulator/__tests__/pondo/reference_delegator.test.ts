import {
  credits,
  oracle,
  referenceDelegator,
} from '../../src/contracts/pondoProgramsIndex';
import {
  MICROCREDITS_TO_CREDITS,
  committee_state,
} from '../../src/contracts/credits';
import { block } from '../../src/pondo/ChainEmulator';

import assert from 'assert';

const VALIDATOR =
  'aleo1j0zju7f0fpgv98gulyywtkxk6jca99l6425uqhnd5kccu4jc2grstjx0mt';
const ADMIN = 'aleo1j0zju7f0fpgv98gulyywtkxk6jca99l6425uqhnd5kccu4jc2grstjx0mt';

const oneMillionCredits = 1000000 * MICROCREDITS_TO_CREDITS;

interface Program {
  signer: string;
  //address: string;
  [key: string]: any;
}

describe('ReferenceDelegator tests', () => {
  let block: block;
  let creditsContract: credits;
  let oracleContract: oracle;
  let referenceDelegatorContract: referenceDelegator;
  let programs: Array<Program>;
  let testDelegatedAmount: bigint;
  let initialAdminBalance = BigInt(oneMillionCredits);

  beforeEach(() => {
    // Setup
    block = { height: BigInt(0) };
    creditsContract = new credits(block);
    oracleContract = new oracle(creditsContract);
    referenceDelegatorContract = new referenceDelegator(
      oracleContract,
      creditsContract,
      ADMIN,
      VALIDATOR
    );
    setup();
  });

  const set_signer = (address: string) => {
    for (const program of programs) {
      program.signer = address;
    }
  };

  const initializeBalances = () => {
    creditsContract.account.set(
      referenceDelegatorContract.ADMIN,
      initialAdminBalance
    );
    creditsContract.account.set(
      referenceDelegatorContract.address,
      testDelegatedAmount
    );
  };

  const setup = () => {
    programs = [creditsContract, oracleContract, referenceDelegatorContract];
    testDelegatedAmount = BigInt(referenceDelegatorContract.MIN_DELEGATION);
    initializeBalances();
  };

  const initializeReferenceDelegator = () => {
    referenceDelegatorContract.caller = referenceDelegatorContract.ADMIN;
    set_signer(referenceDelegatorContract.ADMIN);
    let state: committee_state = {
      is_open: true,
      commission: oracleContract.MAX_COMMISSION - BigInt('1'),
    };
    creditsContract.committee.set(VALIDATOR, state);
    referenceDelegatorContract.initialize();
  };

  it('initialize can only be called by admin', () => {
    referenceDelegatorContract.caller = 'not admin';
    expect(() => referenceDelegatorContract.initialize()).toThrow();
  });

  it('validator must be in commitee on initialize', () => {
    referenceDelegatorContract.caller = referenceDelegatorContract.ADMIN;
    set_signer(referenceDelegatorContract.ADMIN);

    expect(() => referenceDelegatorContract.initialize()).toThrow();
  });

  it('bond and propose delegator to oracle', () => {
    initializeReferenceDelegator();

    assert.equal(
      oracleContract.delegator_to_validator.get(
        referenceDelegatorContract.address
      ),
      VALIDATOR,
      'oracle should map reference delegator to the right validator'
    );
    assert.equal(
      referenceDelegatorContract.initialized.get(BigInt('0')),
      BigInt('8'),
      'reference delegator should be initialized after initialize call'
    );
  });

  it('remove can only be called by admin', () => {
    referenceDelegatorContract.caller = 'not admin';
    expect(() => referenceDelegatorContract.remove(BigInt('0'))).toThrow();
  });

  it('remove reference delegator', () => {
    oracleContract.initialize();
    initializeReferenceDelegator();

    oracleContract.caller = oracleContract.INITIAL_DELEGATOR_APPROVER_ADDRESS;
    oracleContract.add_delegator(referenceDelegatorContract.address);

    block.height = oracleContract.UPDATE_BLOCKS_DISALLOWED + BigInt('1');
    oracleContract.update_data(referenceDelegatorContract.address);

    block.height =
      oracleContract.UPDATE_BLOCKS_DISALLOWED +
      oracleContract.BLOCKS_PER_EPOCH -
      BigInt('1');
    referenceDelegatorContract.remove(testDelegatedAmount);

    // Question for Chris:
    // Is it normal that before removing a validator, you have to call update data at least once first ?
  });

  it('withdraw all credits from reference delegator to admin', () => {
    referenceDelegatorContract.withdraw(testDelegatedAmount);

    assert.equal(
      creditsContract.account.get(referenceDelegatorContract.address),
      BigInt('0'),
      'reference delegator credits balance should be empty after withdraw'
    );

    assert.equal(
      creditsContract.account.get(referenceDelegatorContract.ADMIN),
      initialAdminBalance + testDelegatedAmount,
      'admin credits balance should be credited after withdraw'
    );
  });

  it('withdraw too much credits from reference delegator', () => {
    expect(() =>
      referenceDelegatorContract.withdraw(testDelegatedAmount + BigInt('1'))
    ).toThrow();
  });

  it('withdraw not enough credits from reference delegator', () => {
    expect(() =>
      referenceDelegatorContract.withdraw(testDelegatedAmount - BigInt('1'))
    ).toThrow();
  });
});
