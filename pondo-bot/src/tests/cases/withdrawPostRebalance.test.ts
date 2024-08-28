import { after, before, describe, it } from 'node:test';
import { NETWORK, PALEO_TOKEN_ID, PALEO_TOKEN_ID_DEFAULT, PRIVATE_KEY } from '../../constants';
import * as Aleo from '@demox-labs/aleo-sdk';
import { getMappingValue, getMTSPBalance, getProgram, getPublicBalance, isTransactionAccepted } from '../../aleo/client';
import { killAuthorizePool } from '../../aleo/execute';
import { pondoPrograms } from '../../compiledPrograms';
import { batchedWithdraw, batchedWithdrawSigner, calculateAleoForWithdrawal, depositAsSigner, instantWithdraw, instantWithdrawSigner } from '../../protocol/userActions';
import assert from 'node:assert';
import { TestUserState, TestUserStates } from '../../utils/ledgerCreator';
import { distributeDeposits } from '../../protocol/validatorActions';

// run with the normalWithdraw state
describe('withdraw', async () => {
  const userWithWithdraw = 'aleo1ljmstpa72uzaqk3l76rtc6ltlm3r43rc0dypft02sk67n2s82yzse0jqj0';
  const userFail = 'aleo1why72udqq3f4z7s0xgnxkcqun0kxe0wjsmg9d9aahl7s2dr0nsysx6x7dc';
  const userSuccess = 'aleo18uxpr8m5x2vmvk7rltkjfq5zlmqv8mfqur7aarunj26h8j8jwqfq88xcwm';
  const noDeposits = 'aleo1se69lfndps5yk2dm8vtf0xxujxhylhzz76wkwyxunkvwjc3sfg8smekrc2';
  const bigMoney = 'aleo107knze72u4slh92nt86jrp8cawphmemalt22g8cfap6hvp945u9s29vew7';
  const smallWithdraw = 'aleo17epfc7c9wqnxst5t9093s2tpwwsn5s7r80kt2yqegxezd3ggn59qqsl6m7';
  const userTestStates: TestUserStates = new Map();
  const userTestState: TestUserState = {
    privateKey: 'APrivateKey1zkp2nBamyqaXD6hSwJjcs6ocMD3ZnuBbSX8PSLiWHFA1Xgo',
    microcredits: BigInt('149988979527'),
    deposits: [{ micropaleo: BigInt('9998993'), blockHeight: 344 }],
    withdraws: [{ micropaleo: BigInt('-1000000'), blockHeight: 372 }],
  };
  userTestStates.set(userWithWithdraw, userTestState);
  const userTestState2: TestUserState = {
    privateKey: 'APrivateKey1zkpJbi2v9d9waFe1ZDL3A4CxMhbFkF9uNXYBz5ZxbdG5b1t',
    microcredits: BigInt('149952512464'),
    deposits: [{ micropaleo: BigInt('46998961'), blockHeight: 351 }],
    withdraws: [],
  };
  userTestStates.set(userFail, userTestState2);
  const userTestState3: TestUserState = {
    privateKey: 'APrivateKey1zkpC3BEAcruaUpCMgz3fm83rBKZUkfy6Uo3z8gZ2TV2Jz96',
    microcredits: BigInt('149961512464'),
    deposits: [{ micropaleo: BigInt('37998961'), blockHeight: 360 }],
    withdraws: [],
  };
  userTestStates.set(userSuccess, userTestState3);
  const bigMoneyTestState: TestUserState = {
    privateKey: 'APrivateKey1zkp9jqUKPWBHRvVzzDo3PsEDGBupAkXAQbRud3FxP6VfGzo',
    microcredits: BigInt('139998979527'),
    deposits: [
      { micropaleo: BigInt('9999881450'), blockHeight: 396 }
    ],
    withdraws: [
      { micropaleo: BigInt('-7500000000'), blockHeight: 565 }
    ]
  };
  userTestStates.set(bigMoney, bigMoneyTestState);

  const smallFryTestState: TestUserState = {
    privateKey: 'APrivateKey1zkpJStjQEFY5NciEfHDVCHTnLcfSSDnMFn3z6bhF95Mkk3T',
    microcredits: BigInt('111179527'),
    deposits: [
      { micropaleo: BigInt('87699647'), blockHeight: 461 }
    ],
    withdraws: [
      { micropaleo: BigInt('-70800000'), blockHeight: 605 }
    ]
  };
  userTestStates.set(smallWithdraw, smallFryTestState);
  const noDepositsTestState: TestUserState = {
    privateKey: 'APrivateKey1zkpCgWYg72g3gM1kvRA2xrADx969aN6epL7SuxBukFf9CsH',
    microcredits: BigInt('150000000000'),
    deposits: [],
    withdraws: []
  };
  userTestStates.set(noDeposits, noDepositsTestState);
  let protocolProgram: string;
  let paleoProgram: string;
  let pondoTokenProgram: string;
  let protocolState: string;

  const protocolId: string = pondoPrograms.find((program) =>
    program.includes('pondo_core_protocol')
  )!;
  const paleoId: string = pondoPrograms.find((program) =>
    program.includes('pondo_staked_token')
  )!;
  const pondoTokenId: string = pondoPrograms.find((program) =>
    program.includes('pondo_token')
  )!;
  const mtspId: string = pondoPrograms.find((program) =>
    program.includes('multi_token_support_program')
  )!;

  let protocolProgramAddress: string;
  let paleoMintedToCoreProtocol: BigInt;

  before(async () => {
    // assert that program states are as expected
    protocolProgram = await getProgram(protocolId);
    protocolProgramAddress = Aleo.Program.fromString(NETWORK!, protocolProgram).toAddress();
    const protocolAccountBalance = await getPublicBalance(protocolProgramAddress);
    console.log(`Protocol account balance: ${protocolAccountBalance}`);
    const protocolDelegatedBalance = await getMappingValue('0u8', protocolId, 'balances');
    console.log(`Protocol delegated balance: ${protocolDelegatedBalance}`);
    const protocolBondedWithdrawals = await getMappingValue('1u8', protocolId, 'balances');
    console.log(`Protocol bonded withdrawals: ${protocolBondedWithdrawals}`);
    const protocolClaimableWithdrawals = await getMappingValue('2u8', protocolId, 'balances');
    console.log(`Protocol claimable withdrawals: ${protocolClaimableWithdrawals}`);
    const owedCommission = await getMappingValue('0u8', protocolId, 'owed_commission');
    console.log(`Owed commission: ${owedCommission}`);
    console.log(`Protocol program address: ${protocolProgramAddress}`);
    console.log('expected minted address: aleo1f2feyx0alhy4tx0chs5f3z66u03nekzav90ry388jcrummghegxq0rcg7k');
    paleoMintedToCoreProtocol = await getMTSPBalance(protocolProgramAddress, PALEO_TOKEN_ID, true);
    console.log(`Paleo minted to core protocol: ${paleoMintedToCoreProtocol}`);
    assert(paleoMintedToCoreProtocol === BigInt(101000000), 'Paleo minted to core protocol is not as expected');
    protocolState = await getMappingValue('0u8', protocolId, 'protocol_state');
    assert(protocolState === '0u8', 'Protocol state is not 0u8, or normal'); // normal
    console.log(`Protocol state: ${protocolState}`);

    const bigDeposit = await depositAsSigner(BigInt(10_000_000_000), noDepositsTestState.privateKey, BigInt(9_000_000_000));
    const bigDepositDone = await isTransactionAccepted(bigDeposit);
    console.log(`Big deposit done: ${bigDepositDone}`);

    const distributeTx = await distributeDeposits();
    const distributeComplete = await isTransactionAccepted(distributeTx);
    console.log(`Distribute complete: ${distributeComplete}`);
  });

  after(async () => {
    await killAuthorizePool();
  });

  describe('normal state, earning rewards', async () => {
    describe('instant_withdraw_public', async () => {
      it('fails if there are not enough credits left for batched withdrawals', async () => {
        console.log('protocol account balance: ', await getPublicBalance(protocolProgramAddress));
        console.log('reserved for withdrawal', await getMappingValue('2u8', protocolId, 'balances'));
        const withdraw = await instantWithdraw(BigInt(9_000_000_000), noDepositsTestState.privateKey, BigInt(7_000_000_000));
        const withdrawDone = await isTransactionAccepted(withdraw);
        console.log(`Withdraw done: ${withdrawDone}`);
        assert(!withdrawDone, 'Withdraw should not be done');
      });
    });

    describe('instant_withdraw_public_signer', async () => {
      it('fails if there are not enough credits left for batched withdrawals', async () => {
        console.log('protocol account balance: ', await getPublicBalance(protocolProgramAddress));
        console.log('reserved for withdrawal', await getMappingValue('2u8', protocolId, 'balances'));
        const withdraw = await instantWithdrawSigner(BigInt(9_000_000_000), noDepositsTestState.privateKey, BigInt(7_000_000_000));
        const withdrawDone = await isTransactionAccepted(withdraw);
        console.log(`Withdraw done: ${withdrawDone}`);
        assert(!withdrawDone, 'Withdraw should not be done');
      });
    });
  });
});