import {
  credits,
  delegator1,
  oracle,
} from '../../src/contracts/pondoProgramsIndex';
import { block } from '../../src/pondo/ChainEmulator';

import {
  MINIMUM_BOND_POOL,
  committee_state,
  unbond_state,
} from '../../src/contracts/credits';

import assert from 'assert';

const VALIDATOR =
  'aleo1j0zju7f0fpgv98gulyywtkxk6jca99l6425uqhnd5kccu4jc2grstjx0mt';

describe('Pondo delegator tests', () => {
  let block: block;
  let creditsContract: credits;
  let oracleContract: oracle;
  let delegator: delegator1;

  let testCommission: bigint;

  let stateMappingKey = BigInt(0);

  beforeEach(() => {
    // Setup
    block = { height: BigInt(0) };
    creditsContract = new credits(block);
    oracleContract = new oracle(creditsContract);
    delegator = new delegator1(oracleContract, creditsContract);

    testCommission = delegator.MAX_COMMISSION - BigInt(1);
  });

  it('initialize can only be called by core protocol, sets terminal state', () => {
    delegator.caller = 'not core protocol';
    expect(() => delegator.initialize()).toThrow();

    delegator.caller = 'pondo_core_protocol.aleo';
    delegator.initialize();
    expect(delegator.state_mapping.get(stateMappingKey)).toBe(
      delegator.TERMINAL
    );
  });

  it('prep_rebalance only transitions from UNBOND_NOT_ALLOWED to UNBOND_ALLOWED', () => {});

  it('set validator by can only be called by core protocol', () => {
    delegator.caller = 'not core protocol';
    expect(() => delegator.set_validator(VALIDATOR, testCommission)).toThrow();
  });

  it('set validator by can only be called when state is terminal', () => {
    delegator.caller = 'pondo_core_protocol.aleo';
    expect(() => delegator.set_validator(VALIDATOR, testCommission)).toThrow();

    delegator.caller = 'pondo_core_protocol.aleo';
    delegator.state_mapping.set(stateMappingKey, delegator.TERMINAL);
    delegator.set_validator(VALIDATOR, testCommission);
  });

  it('set validator fails if commission is too high', () => {
    const commission = oracleContract.MAX_COMMISSION + BigInt(1);
    let state: committee_state = {
      is_open: true,
      commission: commission,
    };
    creditsContract.committee.set(VALIDATOR, state);

    delegator.caller = 'pondo_core_protocol.aleo';
    delegator.state_mapping.set(stateMappingKey, delegator.TERMINAL);
    expect(() => delegator.set_validator(VALIDATOR, commission)).toThrow();
  });

  const initializeValidator = (validator: string) => {
    let state: committee_state = {
      is_open: true,
      commission: oracleContract.MAX_COMMISSION - BigInt('1'),
    };
    creditsContract.committee.set(validator, state);

    delegator.caller = 'pondo_core_protocol.aleo';
    delegator.state_mapping.set(stateMappingKey, delegator.TERMINAL);
    delegator.set_validator(validator, testCommission);
  };

  it('on bond, validator must be in committee', () => {
    const amount = BigInt(MINIMUM_BOND_POOL);
    creditsContract.account.set(delegator.address, amount);
    expect(() => delegator.bond(VALIDATOR, amount)).toThrow();
  });

  it('bond must leave balance empty', () => {
    initializeValidator(VALIDATOR);
    const amount = BigInt(MINIMUM_BOND_POOL);
    creditsContract.account.set(delegator.address, amount + BigInt('1'));
    expect(() => delegator.bond(VALIDATOR, amount)).toThrow();
  });

  it('must bond to the right validator', () => {
    const amount = BigInt(MINIMUM_BOND_POOL);
    creditsContract.account.set(delegator.address, MINIMUM_BOND_POOL);
    initializeValidator(VALIDATOR);
    delegator.bond(VALIDATOR, amount);

    initializeValidator('other validator');
    expect(() => delegator.bond('other validator', amount)).toThrow(
      'bonded to different validator'
    );
  });

  it('unbond requires to be in UNBOND_ALLOWED state', () => {
    initializeValidator(VALIDATOR);
    const amount = BigInt(MINIMUM_BOND_POOL);
    creditsContract.account.set(delegator.address, MINIMUM_BOND_POOL);
    delegator.bond(VALIDATOR, amount);

    expect(() => delegator.unbond(amount)).toThrow();
  });

  it('unbond', () => {
    initializeValidator(VALIDATOR);
    const amount = BigInt(MINIMUM_BOND_POOL);
    creditsContract.account.set(delegator.address, MINIMUM_BOND_POOL);
    delegator.bond(VALIDATOR, amount);

    delegator.state_mapping.set(stateMappingKey, delegator.UNBOND_ALLOWED);
    delegator.unbond(amount);
    assert.equal(
      delegator.state_mapping.get(stateMappingKey),
      delegator.UNBONDING
    );

    // assert we don't ban validator
    assert(!delegator.banned_validators.get(VALIDATOR));
  });

  it('unbond and allow ban when commission augmented too much', () => {
    let state: committee_state = {
      is_open: true,
      commission: BigInt('1'),
    };
    creditsContract.committee.set(VALIDATOR, state);

    delegator.caller = 'pondo_core_protocol.aleo';
    delegator.state_mapping.set(stateMappingKey, delegator.TERMINAL);
    delegator.set_validator(VALIDATOR, BigInt('1'));

    const amount = BigInt(MINIMUM_BOND_POOL);
    creditsContract.account.set(delegator.address, MINIMUM_BOND_POOL);
    delegator.bond(VALIDATOR, amount);

    // Raise commission
    const new_commission = BigInt('2') + delegator.MAX_COMMISSION_INCREASE;
    let new_state: committee_state = {
      is_open: true,
      commission: new_commission,
    };
    creditsContract.committee.set(VALIDATOR, new_state);

    delegator.unbond(amount);
    assert.equal(
      delegator.state_mapping.get(stateMappingKey),
      delegator.UNBONDING
    );

    // assert we can ban validator
    assert(delegator.banned_validators.get(VALIDATOR));
  });

  it('unbond and allow ban when commision goes beyond limit', () => {
    let state: committee_state = {
      is_open: true,
      commission: delegator.MAX_COMMISSION,
    };
    creditsContract.committee.set(VALIDATOR, state);

    delegator.caller = 'pondo_core_protocol.aleo';
    delegator.state_mapping.set(stateMappingKey, delegator.TERMINAL);
    delegator.set_validator(VALIDATOR, delegator.MAX_COMMISSION);

    const amount = BigInt(MINIMUM_BOND_POOL);
    creditsContract.account.set(delegator.address, MINIMUM_BOND_POOL);
    delegator.bond(VALIDATOR, amount);

    const new_commission = delegator.MAX_COMMISSION + BigInt('1');
    let new_state: committee_state = {
      is_open: true,
      commission: new_commission,
    };
    creditsContract.committee.set(VALIDATOR, new_state);

    delegator.unbond(amount);

    assert(delegator.banned_validators.get(VALIDATOR));
  });

  // terminal_state

  it('terminal state cannot be called when in BOND_ALLOWED state', () => {
    delegator.state_mapping.set(stateMappingKey, delegator.BOND_ALLOWED);
    expect(() => delegator.terminal_state()).toThrow();
  });

  it('terminal state transitions correctly', () => {});

  it('transfer to core protocol, must be called in TERMINAL state', () => {
    const amount = BigInt(MINIMUM_BOND_POOL);
    delegator.caller = 'pondo_core_protocol.aleo';
    creditsContract.account.set('pondo_delegator1.aleo', amount);
    expect(() => delegator.transfer_to_core_protocol(amount)).toThrow();
  });

  it('transfer to core protocol', () => {
    const amount = BigInt(MINIMUM_BOND_POOL);
    delegator.caller = 'pondo_core_protocol.aleo';
    creditsContract.account.set('pondo_delegator1.aleo', amount);

    delegator.state_mapping.set(stateMappingKey, delegator.TERMINAL);
    delegator.transfer_to_core_protocol(amount);
  });

  it('call bond failed with no valid reason', () => {
    initializeValidator(VALIDATOR);
    creditsContract.account.set(delegator.address, MINIMUM_BOND_POOL);
    expect(() => delegator.bond_failed()).toThrow();
  });

  it('call bond failed, reason: validator unbonding', () => {
    initializeValidator(VALIDATOR);
    creditsContract.account.set(delegator.address, MINIMUM_BOND_POOL);
    let unbond: unbond_state = {
      microcredits: BigInt('1'),
      height: BigInt('1'),
    };
    creditsContract.unbonding.set(VALIDATOR, unbond);
    delegator.bond_failed();
  });

  it('call bond failed, reason: is_open false', () => {
    let state: committee_state = {
      is_open: false,
      commission: oracleContract.MAX_COMMISSION - BigInt('1'),
    };
    creditsContract.committee.set(VALIDATOR, state);

    delegator.caller = 'pondo_core_protocol.aleo';
    delegator.state_mapping.set(stateMappingKey, delegator.TERMINAL);
    delegator.set_validator(VALIDATOR, testCommission);
    creditsContract.account.set(delegator.address, MINIMUM_BOND_POOL);
    delegator.bond_failed();
  });

  it('valid insufficient balance call', () => {
    creditsContract.account.set('pondo_delegator1.aleo', BigInt('1'));
    delegator.state_mapping.set(stateMappingKey, delegator.BOND_ALLOWED);
    delegator.insufficient_balance();
  });

  it('invalid insufficient balance call', () => {
    creditsContract.account.set('pondo_delegator1.aleo', BigInt('10000000000'));
    delegator.state_mapping.set(stateMappingKey, delegator.BOND_ALLOWED);
    expect(() => delegator.insufficient_balance()).toThrow();
  });

  it('ban validator, banned_validators must have validator and oracle must be initialized', () => {
    oracleContract.initialize();
    expect(() => delegator.ban_validator(VALIDATOR)).toThrow();
    delegator.banned_validators.set(VALIDATOR, true);
    delegator.ban_validator(VALIDATOR);
  });
});
