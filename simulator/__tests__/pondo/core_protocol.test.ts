import { validator_state } from '../../src/contracts/pondo_core_protocol';
import {
  credits,
  coreProtocol,
  delegator1,
  delegator2,
  delegator3,
  delegator4,
  delegator5,
  MTSP,
  oracle,
  pALEO,
  PNDO,
} from '../../src/contracts/pondoProgramsIndex';
import { ZERO_GROUP_ADDRESS } from '../../src/pondo/constants';

const ADMIN = 'admin';
const USER0 = 'user0';
const USER1 = 'user1';
const defaultValidatorState: validator_state = {
  validator: ZERO_GROUP_ADDRESS,
  commission: BigInt(0),
};

describe('Pondo core protocol tests', () => {
  let creditsInstance: credits;
  let coreProtocolInstance: coreProtocol;
  let delegator1Instance: delegator1;
  let delegator2Instance: delegator2;
  let delegator3Instance: delegator3;
  let delegator4Instance: delegator4;
  let delegator5Instance: delegator5;
  let MTSPInstance: MTSP;
  let oracleInstance: oracle;
  let pALEOInstance: pALEO;
  let PNDOInstance: PNDO;

  beforeEach(() => {
    creditsInstance = new credits();
    creditsInstance.account.set(ADMIN, BigInt('10000000000000'));
    creditsInstance.account.set(USER0, BigInt('10000000000000'));
    creditsInstance.account.set(USER1, BigInt('10000000000000'));

    oracleInstance = new oracle(creditsInstance);
    MTSPInstance = new MTSP(creditsInstance);
    MTSPInstance.initialize();

    delegator1Instance = new delegator1(oracleInstance, creditsInstance);
    delegator2Instance = new delegator2(oracleInstance, creditsInstance);
    delegator3Instance = new delegator3(oracleInstance, creditsInstance);
    delegator4Instance = new delegator4(oracleInstance, creditsInstance);
    delegator5Instance = new delegator5(oracleInstance, creditsInstance);
    pALEOInstance = new pALEO(MTSPInstance);
    PNDOInstance = new PNDO(MTSPInstance);
    coreProtocolInstance = new coreProtocol(
      delegator5Instance,
      delegator4Instance,
      delegator3Instance,
      delegator2Instance,
      delegator1Instance,
      PNDOInstance,
      pALEOInstance,
      oracleInstance,
      MTSPInstance,
      creditsInstance
    );
  });

  it('initialize sets up token contracts', () => {
    coreProtocolInstance.signer = ADMIN;
    coreProtocolInstance.initialize(BigInt('102'));
    expect(creditsInstance.account.get(ADMIN)).toEqual(BigInt('9999999999898'));
    expect(creditsInstance.account.get(coreProtocolInstance.address)).toEqual(
      BigInt('102')
    );

    const pondoTokenMetadata = MTSPInstance.registered_tokens.get(
      PNDOInstance.PONDO_TOKEN_ID
    )!;
    expect(pondoTokenMetadata.supply).toEqual(pondoTokenMetadata.max_supply);

    const paleoTokenMetadata = MTSPInstance.registered_tokens.get(
      pALEOInstance.PALEO_TOKEN_ID
    )!;
    expect(paleoTokenMetadata.supply).toEqual(BigInt('102'));
  });

  it('initialize initializes delegators', () => {
    coreProtocolInstance.signer = ADMIN;
    coreProtocolInstance.initialize(BigInt('102'));

    const delegator1State = delegator1Instance.state_mapping.get(BigInt('0'))!;
    expect(delegator1State).toEqual(coreProtocolInstance.TERMINAL);
    const delegator2State = delegator2Instance.state_mapping.get(BigInt('0'))!;
    expect(delegator2State).toEqual(coreProtocolInstance.TERMINAL);
    const delegator3State = delegator3Instance.state_mapping.get(BigInt('0'))!;
    expect(delegator3State).toEqual(coreProtocolInstance.TERMINAL);
    const delegator4State = delegator4Instance.state_mapping.get(BigInt('0'))!;
    expect(delegator4State).toEqual(coreProtocolInstance.TERMINAL);
    const delegator5State = delegator5Instance.state_mapping.get(BigInt('0'))!;
    expect(delegator5State).toEqual(coreProtocolInstance.TERMINAL);
  });

  it('initialize initializes internal mappings', () => {
    coreProtocolInstance.signer = ADMIN;
    coreProtocolInstance.initialize(BigInt('102'));

    expect(
      coreProtocolInstance.balances.get(coreProtocolInstance.DELEGATED_BALANCE)
    ).toEqual(BigInt('0'));
    expect(
      coreProtocolInstance.balances.get(coreProtocolInstance.BONDED_WITHDRAWALS)
    ).toEqual(BigInt('0'));
    expect(
      coreProtocolInstance.balances.get(
        coreProtocolInstance.CLAIMABLE_WITHDRAWALS
      )
    ).toEqual(BigInt('0'));
    expect(coreProtocolInstance.owed_commission.get(BigInt('0'))).toEqual(
      BigInt('0')
    );
    expect(
      coreProtocolInstance.protocol_state.get(
        coreProtocolInstance.PROTOCOL_STATE_KEY
      )
    ).toEqual(coreProtocolInstance.NORMAL_STATE);
  });

  it('initialize initializes the validator set', () => {
    coreProtocolInstance.signer = ADMIN;
    coreProtocolInstance.initialize(BigInt('102'));

    const expectedValidatorState = Array(5).fill(defaultValidatorState);
    expect(coreProtocolInstance.validator_set.get(BigInt(1))).toEqual(
      expectedValidatorState
    );
    expect(() =>
      coreProtocolInstance.rebalance_redistribute(expectedValidatorState, [
        BigInt(37),
        BigInt(26),
        BigInt(16),
        BigInt(12),
        BigInt(9),
      ])
    ).not.toThrow();
  });

  it('initialize fails if deposit too small', () => {
    coreProtocolInstance.signer = ADMIN;
    expect(() => coreProtocolInstance.initialize(BigInt('1'))).toThrow();
  });

  it('initialize can only be called once', () => {
    coreProtocolInstance.signer = ADMIN;
    coreProtocolInstance.initialize(BigInt('102'));

    expect(() => coreProtocolInstance.initialize(BigInt('102'))).toThrow();
  });

  const initializeAndDistribute = (
    initialDeposit: number = 102,
    transferAmounts: number[] = [37, 26, 16, 12, 9],
    rewards: number = 0
  ) => {
    coreProtocolInstance.signer = ADMIN;
    coreProtocolInstance.initialize(BigInt(initialDeposit));

    coreProtocolInstance.rebalance_redistribute(
      Array(5).fill(defaultValidatorState),
      [
        BigInt(transferAmounts[0]),
        BigInt(transferAmounts[1]),
        BigInt(transferAmounts[2]),
        BigInt(transferAmounts[3]),
        BigInt(transferAmounts[4]),
      ]
    );
    const delegator1Account = creditsInstance.account.get(
      'pondo_delegator1.aleo'
    )!;
    creditsInstance.account.set(
      'pondo_delegator1.aleo',
      delegator1Account + BigInt(rewards)
    );
  };

  it.each([
    [100000000, 100000000, 100000002, 100000102, 0, 0],
    [100000000, 11298, 100000002, 11411, 1000000, 11],
  ])(
    'deposit_public_as_signer, first deposit, works',
    (
      depositAmount,
      expectedPaleo,
      resultingProtocolBalance,
      expectedPaleoSupply,
      rewards,
      owedCommission
    ) => {
      initializeAndDistribute(102, [37, 26, 16, 12, 9], rewards);
      coreProtocolInstance.signer = USER0;
      coreProtocolInstance.deposit_public_as_signer(
        BigInt(depositAmount),
        BigInt(expectedPaleo),
        ''
      );
      expect(creditsInstance.account.get(coreProtocolInstance.address)).toEqual(
        BigInt(resultingProtocolBalance)
      );
      expect(
        MTSPInstance.registered_tokens.get(pALEOInstance.PALEO_TOKEN_ID)!.supply
      ).toEqual(BigInt(expectedPaleoSupply) - BigInt(owedCommission));
      expect(coreProtocolInstance.owed_commission.get(BigInt(0))).toEqual(
        BigInt(owedCommission)
      );
      expect(
        coreProtocolInstance.balances.get(
          coreProtocolInstance.DELEGATED_BALANCE
        )
      ).toEqual(BigInt(100 + rewards));
    }
  );

  const createAllowance = (caller: string, amount: number) => {
    MTSPInstance.signer = caller;
    MTSPInstance.caller = caller;
    MTSPInstance.deposit_credits_public(BigInt(amount));
    MTSPInstance.approve_public(
      MTSPInstance.CREDITS_RESERVED_TOKEN_ID,
      coreProtocolInstance.address,
      BigInt(amount)
    );
  };

  it.each([[100000000, 100000000, 100000002, 100000102, 0]])(
    'deposit_public, first deposit, works',
    (
      depositAmount,
      expectedPaleo,
      resultingProtocolBalance,
      expectedPaleoSupply,
      rewards
    ) => {
      initializeAndDistribute(102, [37, 26, 16, 12, 9], rewards);
      coreProtocolInstance.signer = USER0;
      coreProtocolInstance.caller = USER0;
      createAllowance(USER0, depositAmount);
      coreProtocolInstance.deposit_public(
        BigInt(depositAmount),
        BigInt(expectedPaleo),
        ''
      );
      expect(creditsInstance.account.get(coreProtocolInstance.address)).toEqual(
        BigInt(resultingProtocolBalance)
      );
      expect(
        MTSPInstance.registered_tokens.get(pALEOInstance.PALEO_TOKEN_ID)!.supply
      ).toEqual(BigInt(expectedPaleoSupply));
      expect(
        coreProtocolInstance.balances.get(
          coreProtocolInstance.DELEGATED_BALANCE
        )
      ).toEqual(BigInt(100 + rewards));
    }
  );

  it('instant_withdraw_public admin can clear liquidity pool', () => {
    initializeAndDistribute(102, [37, 26, 16, 12, 9]);

    coreProtocolInstance.signer = ADMIN;
    coreProtocolInstance.caller = ADMIN;
    coreProtocolInstance.instant_withdraw_public(BigInt(2), BigInt(2));
    expect(creditsInstance.account.get(coreProtocolInstance.address)).toEqual(
      BigInt(0)
    );
    expect(creditsInstance.account.get(ADMIN)).toEqual(BigInt(9999999999900));
    expect(
      MTSPInstance.registered_tokens.get(pALEOInstance.PALEO_TOKEN_ID)!.supply
    ).toEqual(BigInt(100));
  });
});
