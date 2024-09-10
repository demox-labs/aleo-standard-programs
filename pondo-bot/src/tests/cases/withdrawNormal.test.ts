import { after, before, describe, it } from 'node:test';
import { NETWORK, PALEO_TOKEN_ID, PALEO_TOKEN_ID_DEFAULT, PRIVATE_KEY } from '../../constants';
import * as Aleo from '@demox-labs/aleo-sdk';
import { getHeight, getMappingValue, getMTSPBalance, getProgram, getPublicBalance, isTransactionAccepted } from '../../aleo/client';
import { killAuthorizePool } from '../../aleo/execute';
import { pondoPrograms } from '../../compiledPrograms';
import { batchedWithdraw, batchedWithdrawSigner, calculateAleoForWithdrawal, instantWithdraw, instantWithdrawSigner } from '../../protocol/userActions';
import assert from 'node:assert';
import { TestUserState, TestUserStates } from '../../utils/ledgerCreator';

// run with the normalWithdraw state
describe('withdraw', async () => {
  const userWithWithdraw = 'aleo1ljmstpa72uzaqk3l76rtc6ltlm3r43rc0dypft02sk67n2s82yzse0jqj0';
  const userFail = 'aleo1why72udqq3f4z7s0xgnxkcqun0kxe0wjsmg9d9aahl7s2dr0nsysx6x7dc';
  const userSuccess = 'aleo18uxpr8m5x2vmvk7rltkjfq5zlmqv8mfqur7aarunj26h8j8jwqfq88xcwm';
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
  let protocolProgram: string;
  let paleoProgram: string;
  let pondoTokenProgram: string;
  let protocolState: string;

  const protocolId: string = pondoPrograms.find((program) =>
    program.includes('pondo_protocol')
  )!;
  const paleoId: string = pondoPrograms.find((program) =>
    program.includes('pondo_staked_token')
  )!;
  const pondoTokenId: string = pondoPrograms.find((program) =>
    program.includes('pondo_protocol_token')
  )!;
  const mtspId: string = pondoPrograms.find((program) =>
    program.includes('token_registry')
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
  });

  after(async () => {
    await killAuthorizePool();
  });

  describe('normal state, earning rewards', async () => {
    describe('instant_withdraw_public', async () => {
      it('fails if user has another withdraw in progress', async () => {
        const withdrawPaleoAmount = BigInt(1_000);
        const withdrawTx = await instantWithdraw(withdrawPaleoAmount, userTestStates.get(userWithWithdraw)?.privateKey);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        assert(!withdrawComplete, 'Withdraw should not be complete');
      });

      // it('fails if there are not enough credits left for batched withdrawals', async () => {
      // });

      it('fails if user attempts to withdraw more credits than the paleo is worth', async () => {
        const withdrawPaleoAmount = BigInt(1_000);
        const overestimatedAleoValue = await calculateAleoForWithdrawal(withdrawPaleoAmount) + BigInt(10);
        const withdrawTx = await instantWithdraw(withdrawPaleoAmount, userTestStates.get(userFail)?.privateKey, overestimatedAleoValue);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        assert(!withdrawComplete, 'Withdraw should not be complete');
      });

      it('fails if user attempts to withdraw more credits than they have', async () => {
        const userFailBalance = userTestStates.get(userFail)?.deposits[0].micropaleo!;
        const withdrawPaleoAmount = userFailBalance + BigInt(1);
        const withdrawTx = await instantWithdraw(withdrawPaleoAmount, userTestStates.get(userFail)?.privateKey);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        assert(!withdrawComplete, 'Withdraw should not be complete');
      });

      it('on success, reduces the user\'s paleo balance by the amount withdrawn', async () => {
        const currentPaleo = await getMTSPBalance(userSuccess, PALEO_TOKEN_ID, true);
        const withdrawPaleoAmount = BigInt(1_000);
        const withdrawTx = await instantWithdraw(withdrawPaleoAmount, userTestStates.get(userSuccess)?.privateKey);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        const newPaleo = await getMTSPBalance(userSuccess, PALEO_TOKEN_ID, true);
        const deltaPaleo = currentPaleo - newPaleo;

        assert(deltaPaleo === withdrawPaleoAmount, 'User paleo balance should be reduced by the amount withdrawn');
        assert(withdrawComplete, 'Withdraw should be complete');
      });
    });

    describe('instant_withdraw_public_signer', async () => {
      it('fails if user has another withdraw in progress', async () => {
        const withdrawPaleoAmount = BigInt(1_000);
        const withdrawTx = await instantWithdrawSigner(withdrawPaleoAmount, userTestStates.get(userWithWithdraw)?.privateKey!);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        assert(!withdrawComplete, 'Withdraw should not be complete');
      });

      it('fails if user attempts to withdraw more credits than the paleo is worth', async () => {
        const withdrawPaleoAmount = BigInt(1_000);
        const overestimatedAleoValue = await calculateAleoForWithdrawal(withdrawPaleoAmount) + BigInt(10);
        const withdrawTx = await instantWithdrawSigner(withdrawPaleoAmount, userTestStates.get(userFail)?.privateKey!, overestimatedAleoValue);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        assert(!withdrawComplete, 'Withdraw should not be complete');
      });

      it('fails if user attempts to withdraw more credits than they have', async () => {
        const userFailBalance = userTestStates.get(userFail)?.deposits[0].micropaleo!;
        const withdrawPaleoAmount = userFailBalance + BigInt(1);
        const withdrawTx = await instantWithdrawSigner(withdrawPaleoAmount, userTestStates.get(userFail)?.privateKey!);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        assert(!withdrawComplete, 'Withdraw should not be complete');
      });

      // it('fails if there are not enough credits left for batched withdrawals', async () => {
      // });

      it('on success, reduces the user\'s paleo balance by the amount withdrawn', async () => {
        const currentPaleo = await getMTSPBalance(userSuccess, PALEO_TOKEN_ID, true);
        const withdrawPaleoAmount = BigInt(1_000);
        const withdrawTx = await instantWithdrawSigner(withdrawPaleoAmount, userTestStates.get(userSuccess)?.privateKey!);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        const newPaleo = await getMTSPBalance(userSuccess, PALEO_TOKEN_ID, true);
        const deltaPaleo = currentPaleo - newPaleo;

        assert(deltaPaleo === withdrawPaleoAmount, 'User paleo balance should be reduced by the amount withdrawn');
        assert(withdrawComplete, 'Withdraw should be complete');
      });
    });

    describe('withdraw_public', async () => {
      it('fails if user has another withdraw in progress', async () => {
        const withdrawPaleoAmount = BigInt(1_000);
        const withdrawTx = await batchedWithdraw(withdrawPaleoAmount, userTestStates.get(userWithWithdraw)?.privateKey);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        assert(!withdrawComplete, 'Withdraw should not be complete');
      });

      it('fails if user attempts to withdraw more credits than they have', async () => {
        const userFailBalance = userTestStates.get(userFail)?.deposits[0].micropaleo!;
        const withdrawPaleoAmount = userFailBalance + BigInt(1);
        const withdrawTx = await batchedWithdraw(withdrawPaleoAmount, userTestStates.get(userFail)?.privateKey);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        assert(!withdrawComplete, 'Withdraw should not be complete');
      });

      it('on success, reduces the user\'s paleo balance by the amount withdrawn and sets a withdraw', async () => {
        const currentPaleo = await getMTSPBalance(userSuccess, PALEO_TOKEN_ID, true);
        const withdrawPaleoAmount = BigInt(1_000);
        const withdrawTx = await batchedWithdraw(withdrawPaleoAmount, userTestStates.get(userSuccess)?.privateKey);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        const newPaleo = await getMTSPBalance(userSuccess, PALEO_TOKEN_ID, true);
        const deltaPaleo = currentPaleo - newPaleo;

        const withdrawalState = await getMappingValue(userSuccess, protocolId, 'withdrawals');
        assert(withdrawalState !== null, 'user should have a withdrawal state');
        assert(deltaPaleo === withdrawPaleoAmount, 'User paleo balance should be reduced by the amount withdrawn');
        assert(withdrawComplete, 'Withdraw should be complete');
      });
    });

    describe('withdraw_public_as_signer', async () => {
      it('fails if user has another withdraw in progress', async () => {
        const withdrawPaleoAmount = BigInt(1_000);
        const withdrawTx = await batchedWithdrawSigner(withdrawPaleoAmount, userTestStates.get(userWithWithdraw)?.privateKey);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        assert(!withdrawComplete, 'Withdraw should not be complete');
      });

      it('fails if user attempts to withdraw more credits than they have', async () => {
        const userFailBalance = userTestStates.get(userFail)?.deposits[0].micropaleo!;
        const withdrawPaleoAmount = userFailBalance + BigInt(1);
        const withdrawTx = await batchedWithdrawSigner(withdrawPaleoAmount, userTestStates.get(userFail)?.privateKey);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        assert(!withdrawComplete, 'Withdraw should not be complete');
      });

      it('on success, reduces the user\'s paleo balance by the amount withdrawn and sets a withdraw', async () => {
        const currentPaleo = await getMTSPBalance(userFail, PALEO_TOKEN_ID, true);
        const withdrawPaleoAmount = BigInt(1_000);
        const withdrawTx = await batchedWithdrawSigner(withdrawPaleoAmount, userTestStates.get(userFail)?.privateKey);
        const withdrawComplete = await isTransactionAccepted(withdrawTx);
        const newPaleo = await getMTSPBalance(userFail, PALEO_TOKEN_ID, true);
        const deltaPaleo = currentPaleo - newPaleo;
        const currentHeight = await getHeight();

        const withdrawalState = await getMappingValue(userFail, protocolId, 'withdrawals');
        console.log(`Withdrawal state: ${withdrawalState}`);
        assert(withdrawalState !== null, 'user should have a withdrawal state');
        // assert(withdrawalState.claim_block >= currentHeight);
        assert(deltaPaleo === withdrawPaleoAmount, 'User paleo balance should be reduced by the amount withdrawn');
        assert(withdrawComplete, 'Withdraw should be complete');
      });
    });
  });
});