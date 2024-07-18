import {
  coreProtocol,
  credits,
  oracle,
} from '../../src/contracts/pondoProgramsIndex';

describe('Pondo oracle tests', () => {
  let oracleInstance: oracle;
  let creditsContract: credits;

  beforeEach(() => {
    creditsContract = new credits();
    oracleInstance = new oracle(creditsContract);
  });

  it('initialize sets initial control addresses and delegator allocations', () => {
    const defaultDelegatorAllocation = [
      coreProtocol.prototype.PORTION_1,
      coreProtocol.prototype.PORTION_2,
      coreProtocol.prototype.PORTION_3,
      coreProtocol.prototype.PORTION_4,
      coreProtocol.prototype.PORTION_5,
      coreProtocol.prototype.PORTION_5,
      coreProtocol.prototype.PORTION_5,
      coreProtocol.prototype.PORTION_5,
      coreProtocol.prototype.PORTION_5,
      coreProtocol.prototype.PORTION_5,
    ];

    oracleInstance.initialize();

    expect(
      oracleInstance.control_addresses.get(
        oracleInstance.INITIAL_DELEGATOR_APPROVER_ADDRESS
      )
    ).toEqual(true);
    expect(
      oracleInstance.control_addresses.get('pondo_delegator1.aleo')
    ).toEqual(false);
    expect(
      oracleInstance.control_addresses.get('pondo_delegator2.aleo')
    ).toEqual(false);
    expect(
      oracleInstance.control_addresses.get('pondo_delegator3.aleo')
    ).toEqual(false);
    expect(
      oracleInstance.control_addresses.get('pondo_delegator4.aleo')
    ).toEqual(false);
    expect(
      oracleInstance.control_addresses.get('pondo_delegator5.aleo')
    ).toEqual(false);
    expect(oracleInstance.delegator_allocation.get(BigInt('0'))).toEqual(
      defaultDelegatorAllocation
    );
  });

  it('add control address can only be called by the admin', () => {
    oracleInstance.initialize();

    expect(() => {
      oracleInstance.caller = 'pondo_delegator1.aleo';
      oracleInstance.add_control_address('control address');
    }).toThrow();

    oracleInstance.caller = oracleInstance.INITIAL_DELEGATOR_APPROVER_ADDRESS;
    oracleInstance.add_control_address('control address');
    expect(oracleInstance.control_addresses.get('control address')).toEqual(
      false
    );
  });

  it('remove control address can only be called by the admin', () => {
    oracleInstance.initialize();

    expect(() => {
      oracleInstance.caller = 'pondo_delegator1.aleo';
      oracleInstance.remove_control_address('control address');
    }).toThrow();

    oracleInstance.caller = oracleInstance.INITIAL_DELEGATOR_APPROVER_ADDRESS;
    oracleInstance.remove_control_address('control address');
    expect(oracleInstance.control_addresses.has('control address')).toBe(false);
  });

  it('update admin can only be called by the admin', () => {
    oracleInstance.initialize();

    expect(() => {
      oracleInstance.caller = 'pondo_delegator1.aleo';
      oracleInstance.update_admin('new admin');
    }).toThrow();

    oracleInstance.caller = oracleInstance.INITIAL_DELEGATOR_APPROVER_ADDRESS;
    oracleInstance.update_admin('new admin');
    expect(oracleInstance.control_addresses.get('new admin')).toBe(true);
    expect(
      oracleInstance.control_addresses.has(
        oracleInstance.INITIAL_DELEGATOR_APPROVER_ADDRESS
      )
    ).toBe(false);
  });

  it('update delegator allocations can only be called by the admin', () => {
    const newDelegatorAllocation = [
      coreProtocol.prototype.PORTION_2,
      coreProtocol.prototype.PORTION_3,
      coreProtocol.prototype.PORTION_4,
    ];

    oracleInstance.initialize();

    expect(() => {
      oracleInstance.caller = 'pondo_delegator1.aleo';
      oracleInstance.update_delegator_allocations(newDelegatorAllocation);
    }).toThrow();

    oracleInstance.caller = oracleInstance.INITIAL_DELEGATOR_APPROVER_ADDRESS;
    oracleInstance.update_delegator_allocations(newDelegatorAllocation);
    expect(oracleInstance.delegator_allocation.get(BigInt('0'))).toEqual(
      newDelegatorAllocation
    );
  });

  it('propose delegator must be called by a program', () => {
    expect(() => {
      oracleInstance.caller = 'reference delegator';
      oracleInstance.signer = 'reference delegator';
      oracleInstance.propose_delegator('validator');
    }).toThrow();

    oracleInstance.signer = 'validator';
    oracleInstance.caller = 'reference delegator';
    oracleInstance.propose_delegator('validator');
    expect(
      oracleInstance.delegator_to_validator.get('reference delegator')
    ).toEqual('validator');
  });

  it('propose delegator cannot propose a banned validator', () => {
    oracleInstance.banned_validators.set('validator', true);
    oracleInstance.signer = 'validator';
    oracleInstance.caller = 'reference delegator';

    expect(() => oracleInstance.propose_delegator('validator')).toThrow();
  });

  it('a delegator contract can only be proposed once', () => {
    oracleInstance.signer = 'validator';
    oracleInstance.caller = 'reference delegator';
    oracleInstance.propose_delegator('validator');
    expect(
      oracleInstance.delegator_to_validator.get('reference delegator')
    ).toEqual('validator');

    oracleInstance.signer = 'validator2';
    oracleInstance.caller = 'reference delegator';
    expect(() => oracleInstance.propose_delegator('validator2')).toThrow();
  });

  it('pondo ban validator must be called by a control address', () => {
    oracleInstance.initialize();
    expect(() => {
      oracleInstance.caller = 'validator';
      oracleInstance.pondo_ban_validator('validator');
    }).toThrow();

    oracleInstance.caller = 'pondo_delegator1.aleo';
    oracleInstance.pondo_ban_validator('validator');
    expect(oracleInstance.banned_validators.get('validator')).toEqual(true);

    oracleInstance.caller = oracleInstance.INITIAL_DELEGATOR_APPROVER_ADDRESS;
    oracleInstance.add_control_address('new control address');
    oracleInstance.caller = 'new control address';
    oracleInstance.pondo_ban_validator('validator1');
    expect(oracleInstance.banned_validators.get('validator1')).toEqual(true);
  });

  it('ban validator confirms the validator violated terms', () => {});

  const setUpBanValidator = (
    isOpen: boolean,
    commission: bigint,
    isUpdatePeriod: boolean,
    hasReferenceDelegator: boolean
  ) => {
    // committe state, is open
    // update period
    // no reference delegator
  };

  it('set pondo tvl can only be called by the core protocol', () => {
    expect(() => {
      oracleInstance.caller = 'validator';
      oracleInstance.set_pondo_tvl(BigInt('100'));
    }).toThrow();

    oracleInstance.caller = 'pondo_core_protocol.aleo';
    oracleInstance.set_pondo_tvl(BigInt('100'));
    expect(oracleInstance.pondo_tvl.get(BigInt('0'))).toEqual(BigInt('100'));
  });

  const setUpBanSelf = (inCommittee: boolean, isWithdrawAddress: boolean) => {
    if (inCommittee) {
      creditsContract.committee.set('validator', {
        is_open: true,
        commission: BigInt('40'),
      });
    }

    if (isWithdrawAddress) {
      creditsContract.withdraw.set('validator', 'withdraw address');
      oracleInstance.caller = 'withdraw address';
    } else {
      oracleInstance.caller = 'validator';
    }
  };

  it('ban self not called by withdraw address, not in committee, fails', () => {
    setUpBanSelf(false, false);

    expect(() => oracleInstance.ban_self('validator')).toThrow();
  });

  it('ban self not called by withdraw address, in committee, fails', () => {
    setUpBanSelf(true, false);

    expect(() => oracleInstance.ban_self('validator')).toThrow();
  });

  it('ban self called by withdraw address, not in committee, fails', () => {
    setUpBanSelf(false, true);

    expect(() => oracleInstance.ban_self('validator')).toThrow();
  });

  it('ban self called by withdraw address, in committee, succeeds', () => {
    setUpBanSelf(true, true);

    oracleInstance.ban_self('validator');
    expect(oracleInstance.banned_validators.get('validator')).toEqual(true);
  });

  const setUpBoostValidator = (isUpdatePeriod: boolean) => {
    if (isUpdatePeriod) {
      oracleInstance.block.height = oracleInstance.UPDATE_BLOCKS_DISALLOWED;
    } else {
      oracleInstance.block.height = BigInt('5');
    }
  };

  /**
   * add delegator
   * update data
   * remove delegator
   * ban validator
   * boost validator
   * swap validator data
   * swap zero group address
   */
});
