import {
  coreProtocol,
  credits,
  oracle,
} from '../../src/contracts/pondoProgramsIndex';
import {
  PORTION_1,
  PORTION_2,
  PORTION_3,
  PORTION_4,
  PORTION_5,
} from '../../src/pondo/constants';

const ZERO_GROUP_ADDRESS =
  'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc';

describe('Pondo oracle tests', () => {
  let oracleInstance: oracle;
  let creditsContract: credits;

  beforeEach(() => {
    creditsContract = new credits();
    oracleInstance = new oracle(creditsContract);
  });

  it('initialize sets initial control addresses and delegator allocations', () => {
    const defaultDelegatorAllocation = [
      PORTION_1,
      PORTION_2,
      PORTION_3,
      PORTION_4,
      PORTION_5,
      PORTION_5,
      PORTION_5,
      PORTION_5,
      PORTION_5,
      PORTION_5,
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

  const setUpAddDelegator = (
    hasReferenceDelegator: boolean,
    withdrawAddressMatches: boolean,
    bondedCorrectly: boolean,
    validatorNotBanned: boolean,
    inCommittee: boolean,
    validatorOpen: boolean = true,
    validCommission: boolean = true
  ) => {
    oracleInstance.initialize();
    if (hasReferenceDelegator) {
      oracleInstance.delegator_to_validator.set(
        'reference delegator',
        'validator'
      );
    }
    if (withdrawAddressMatches) {
      creditsContract.withdraw.set(
        'reference delegator',
        'reference delegator'
      );
    }
    if (bondedCorrectly) {
      creditsContract.bonded.set('reference delegator', {
        microcredits: BigInt('10000'),
        validator: 'validator',
      });
    }
    if (!validatorNotBanned) {
      oracleInstance.banned_validators.set('validator', true);
    }
    const committeeState = {
      is_open: validatorOpen,
      commission: validCommission ? BigInt('40') : BigInt('51'),
    };
    if (inCommittee) {
      creditsContract.committee.set('validator', committeeState);
    }

    return {
      delegator: 'reference delegator',
      validator: 'validator',
      block_height: oracleInstance.block.height,
      bonded_microcredits: BigInt('10000'),
      microcredits_yield_per_epoch: BigInt('0'),
      commission: committeeState.commission,
      boost: BigInt('0'),
    };
  };

  it('add delegator can only be called by the admin', () => {
    const initialData = setUpAddDelegator(true, true, true, true, true);
    expect(() => {
      oracleInstance.caller = 'validator';
      oracleInstance.add_delegator('reference delegator');
    }).toThrow();

    oracleInstance.caller = oracleInstance.INITIAL_DELEGATOR_APPROVER_ADDRESS;
    oracleInstance.add_delegator('reference delegator');
    expect(oracleInstance.validator_data.get('reference delegator')).toEqual(
      initialData
    );
  });

  const addDelegatorTestCases = [
    // hasReferenceDelegator, withdrawAddressMatches, bondedCorrectly, validatorNotBanned, inCommittee, validatorOpen, validCommission
    {
      args: [false, true, true, true, true],
      reason: 'delegator not proposed',
    },
    {
      args: [true, false, true, true, true],
      reason: 'delegator withdraw address does not match',
    },
    {
      args: [true, true, false, true, true],
      reason: 'delegator not bonded to validator',
    },
    {
      args: [true, true, true, false, true],
      reason: 'validator is banned',
    },
    {
      args: [true, true, true, true, false],
      reason: 'validator not in committee',
    },
    {
      args: [true, true, true, true, true, false],
      reason: 'validator is not open',
    },
    {
      args: [true, true, true, true, true, true, false],
      reason: 'validator commission too high',
    },
  ];

  it.each([addDelegatorTestCases])(
    'add delegator, $reason, fails',
    ({ args }) => {
      (<any>setUpAddDelegator)(...args);
      oracleInstance.caller = oracleInstance.INITIAL_DELEGATOR_APPROVER_ADDRESS;
      expect(() =>
        oracleInstance.add_delegator('reference delegator')
      ).toThrow();
    }
  );

  it('add delegator, already added, fails', () => {
    const initialData = setUpAddDelegator(true, true, true, true, true);
    oracleInstance.validator_data.set('reference delegator', initialData);
    oracleInstance.caller = oracleInstance.INITIAL_DELEGATOR_APPROVER_ADDRESS;

    expect(() => oracleInstance.add_delegator('reference delegator')).toThrow();
  });

  const setupUpdateData = (
    hasExistingData: boolean,
    notBanned: boolean,
    isUpdatePeriod: boolean,
    isNewData: boolean,
    bonded: boolean,
    inCommittee: boolean,
    isOpen: boolean,
    validCommission: boolean
  ) => {
    // existing data
    // banned
    // update period
    // hasn't update this epoch
    // has valid committee state
    // is bonded
  };

  const setUpRemoveDelegator = (
    outsideUpdatePeriod: boolean,
    hasReferenceDelegator: boolean,
    hasData: boolean,
    topTenInitialized: boolean,
    rank: number = -1
  ) => {
    if (!outsideUpdatePeriod) {
      oracleInstance.block.height = oracleInstance.UPDATE_BLOCKS_DISALLOWED;
    } else {
      oracleInstance.block.height = BigInt('5');
    }

    oracleInstance.delegator_to_validator.set(
      'reference delegator1',
      'validator1'
    );
    if (hasReferenceDelegator) {
      oracleInstance.delegator_to_validator.set(
        'reference delegator',
        'validator'
      );
    }

    oracleInstance.validator_data.set('reference delegator1', {
      delegator: 'reference delegator1',
      validator: 'validator1',
      block_height: BigInt('0'),
      bonded_microcredits: BigInt('10000000000'),
      microcredits_yield_per_epoch: BigInt('100000000'),
      commission: BigInt('10'),
      boost: BigInt('0'),
    });
    if (hasData) {
      oracleInstance.validator_data.set('reference delegator', {
        delegator: 'reference delegator',
        validator: 'validator',
        block_height: BigInt('0'),
        bonded_microcredits: BigInt('10000000000'),
        microcredits_yield_per_epoch: BigInt('100000000'),
        commission: BigInt('10'),
        boost: BigInt('0'),
      });
    }

    const topTen = topTenInitialized
      ? [
          'reference delegator1',
          'reference delegator2',
          'reference delegator3',
          'reference delegator4',
          'reference delegator5',
          'reference delegator6',
          'reference delegator7',
          'reference delegator8',
          'reference delegator9',
          'reference delegator10',
        ]
      : Array(10).fill(ZERO_GROUP_ADDRESS);
    if (rank > -1) {
      topTen[rank] = 'reference delegator';
    }

    oracleInstance.top_validators.set(BigInt('0'), topTen);
  };

  it('remove delegator called during update period, fails', () => {
    setUpRemoveDelegator(false, true, true, true, 0);

    oracleInstance.caller = 'reference delegator';
    expect(() => oracleInstance.remove_delegator()).toThrow();
    expect(
      oracleInstance.delegator_to_validator.get('reference delegator')
    ).toEqual('validator');
  });

  it('remove delegator, reference delegator not present, does nothing', () => {
    setUpRemoveDelegator(true, true, false, true);
    const initialTopTen = oracleInstance.top_validators.get(BigInt('0'));
    const initialDelegatorToValidator = oracleInstance.delegator_to_validator;

    oracleInstance.caller = 'reference delegator';
    oracleInstance.remove_delegator();
    expect(oracleInstance.top_validators.get(BigInt('0'))).toEqual(
      initialTopTen
    );
    expect(oracleInstance.delegator_to_validator).toEqual(
      initialDelegatorToValidator
    );
  });

  it('remove delegator, reference delegator present, removes delegator', () => {
    setUpRemoveDelegator(true, true, false, true);

    oracleInstance.caller = 'reference delegator';
    oracleInstance.remove_delegator();
    expect(
      oracleInstance.delegator_to_validator.get('reference delegator')
    ).toBeUndefined();
  });

  it.each([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])(
    'remove delegator, reference delegator present, removes delegator from top ten, regardless of rank',
    (rank: number) => {
      setUpRemoveDelegator(true, true, true, true, rank);
      const initialTopTen = oracleInstance.top_validators.get(BigInt('0'))!;
      const expectedTopTen = initialTopTen
        .toSpliced(rank, 1)
        .concat([ZERO_GROUP_ADDRESS]);

      oracleInstance.caller = 'reference delegator';
      oracleInstance.remove_delegator();
      expect(oracleInstance.top_validators.get(BigInt('0'))).toEqual(
        expectedTopTen
      );
    }
  );

  it('remove delegator, no data, does nothing', () => {
    setUpRemoveDelegator(true, true, false, true);
    const initialData = oracleInstance.validator_data;

    oracleInstance.caller = 'reference delegator';
    oracleInstance.remove_delegator();
    expect(
      oracleInstance.delegator_to_validator.get('reference delegator')
    ).toBeUndefined();
    expect(oracleInstance.validator_data).toEqual(initialData);
  });

  it('remove delegator, data present, removes data', () => {
    setUpRemoveDelegator(true, true, true, true);

    oracleInstance.caller = 'reference delegator';
    oracleInstance.remove_delegator();
    expect(oracleInstance.validator_data.get('validator')).toBeUndefined();
  });

  it('remove delegator, not in top ten, does nothing', () => {
    setUpRemoveDelegator(true, true, true, true, -1);
    const initialTopTen = oracleInstance.top_validators.get(BigInt('0'));

    oracleInstance.caller = 'reference delegator';
    oracleInstance.remove_delegator();
    expect(oracleInstance.top_validators.get(BigInt('0'))).toEqual(
      initialTopTen
    );
  });

  it('remove delegator, only one delegator in top ten, clears top ten', () => {
    setUpRemoveDelegator(true, true, true, false, 0);

    oracleInstance.caller = 'reference delegator';
    oracleInstance.remove_delegator();
    expect(oracleInstance.top_validators.get(BigInt('0'))).toEqual(
      Array(10).fill(ZERO_GROUP_ADDRESS)
    );
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

  const setUpBanValidator = (
    isOpen: boolean,
    commission: bigint,
    isUpdatePeriod: boolean,
    hasReferenceDelegator: boolean
  ) => {
    if (isUpdatePeriod) {
      oracleInstance.block.height = oracleInstance.UPDATE_BLOCKS_DISALLOWED;
    } else {
      oracleInstance.block.height = BigInt('5');
    }

    creditsContract.committee.set('validator', {
      is_open: isOpen,
      commission: commission,
    });

    if (hasReferenceDelegator) {
      oracleInstance.delegator_to_validator.set(
        'reference delegator',
        'validator'
      );
    }
  };

  it('ban validator called outside update period, fails', () => {
    setUpBanValidator(true, BigInt('40'), false, true);

    oracleInstance.caller = 'validator';
    expect(() => oracleInstance.ban_validator('reference delegator')).toThrow();
  });

  it('ban validator called during update period, validator state valid, fails', () => {
    setUpBanValidator(true, BigInt('40'), true, true);

    oracleInstance.caller = 'validator';
    expect(() => oracleInstance.ban_validator('reference delegator')).toThrow();
  });

  it('ban validator, reference delegator invalid, fails', () => {
    setUpBanValidator(true, BigInt('40'), true, false);

    oracleInstance.caller = 'validator';
    expect(() => oracleInstance.ban_validator('reference delegator')).toThrow();
  });

  it('ban validator, validator closed, succeeds', () => {
    setUpBanValidator(false, BigInt('40'), true, true);

    oracleInstance.caller = 'validator';
    oracleInstance.ban_validator('reference delegator');
    expect(oracleInstance.banned_validators.get('validator')).toEqual(true);
  });

  it('ban validator, commission too high, succeeds', () => {
    setUpBanValidator(true, BigInt('51'), true, true);

    oracleInstance.caller = 'validator';
    oracleInstance.ban_validator('reference delegator');
    expect(oracleInstance.banned_validators.get('validator')).toEqual(true);
  });

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

  const setUpBoostValidator = (
    isUpdatePeriod: boolean,
    hasBoost: boolean,
    isFirstEpoch: boolean = true
  ) => {
    creditsContract.account.set('validator', BigInt('10000'));
    oracleInstance.signer = 'validator';
    oracleInstance.caller = 'validator';
    if (isUpdatePeriod) {
      oracleInstance.block.height = oracleInstance.UPDATE_BLOCKS_DISALLOWED;
    } else {
      const epochStart: bigint = isFirstEpoch
        ? BigInt('0')
        : oracleInstance.BLOCKS_PER_EPOCH;
      oracleInstance.block.height = epochStart + BigInt('5');
    }

    if (hasBoost) {
      oracleInstance.validator_boosting.set('validator', {
        epoch: isFirstEpoch ? BigInt('0') : BigInt('1'),
        boost_amount: BigInt('10000'),
      });
    }
  };

  it('boost validator cannot be called during the update period', () => {
    setUpBoostValidator(true, false);

    expect(() =>
      oracleInstance.boost_validator('validator', BigInt('10000'))
    ).toThrow();
  });

  it('boost validator adds new boost and transfers to core protocol', () => {
    setUpBoostValidator(false, false);

    oracleInstance.boost_validator('validator', BigInt('10000'));
    expect(oracleInstance.validator_boosting.get('validator')).toEqual({
      epoch: BigInt('0'),
      boost_amount: BigInt('10000'),
    });
    expect(creditsContract.account.get('validator')).toEqual(BigInt('0'));
    expect(creditsContract.account.get('pondo_core_protocol.aleo')).toEqual(
      BigInt('10000')
    );
  });

  it.each([true, false])(
    'boost validator updates existing boost',
    (isFirstEpoch: boolean) => {
      setUpBoostValidator(false, true, isFirstEpoch);

      oracleInstance.boost_validator('validator', BigInt('10000'));
      expect(oracleInstance.validator_boosting.get('validator')).toEqual({
        epoch: isFirstEpoch ? BigInt('0') : BigInt('1'),
        boost_amount: BigInt('20000'),
      });
    }
  );

  it('boost validator ignores old boosts', () => {
    setUpBoostValidator(false, true);

    oracleInstance.block.height =
      oracleInstance.BLOCKS_PER_EPOCH * BigInt('2') + BigInt('5');
    oracleInstance.boost_validator('validator', BigInt('10000'));
    expect(oracleInstance.validator_boosting.get('validator')).toEqual({
      epoch: BigInt('2'),
      boost_amount: BigInt('10000'),
    });
  });

  it('swap validator data works as expected', () => {});

  it.each([
    [ZERO_GROUP_ADDRESS, '2', true],
    ['1', ZERO_GROUP_ADDRESS, false],
    [ZERO_GROUP_ADDRESS, ZERO_GROUP_ADDRESS, false],
    ['1', '2', false],
  ])(
    'swap zero group address, swaps correctly',
    (address1: string, address2: string, shouldSwap: boolean) => {
      const unSwapped = [address1, address2];
      const swapped = [address2, address1];

      const result = oracleInstance.inline_swap_zero_group_address(
        address1,
        address2
      );
      expect(result).toEqual(shouldSwap ? swapped : unSwapped);
    }
  );

  /**
   * update data
   * swap validator data
   */
});
