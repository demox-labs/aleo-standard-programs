import { after, before, describe, it } from 'node:test';
import { NETWORK, PALEO_TOKEN_ID, PALEO_TOKEN_ID_DEFAULT, PRIVATE_KEY } from '../../constants';
import * as Aleo from '@demox-labs/aleo-sdk';
import { airDropCredits, getMappingValue, getMTSPBalance, getProgram, getPublicBalance, isTransactionAccepted } from '../../aleo/client';
import { killAuthorizePool } from '../../aleo/execute';
import { pondoPrograms } from '../../compiledPrograms';
import { calculatePaleoForDeposit, depositAsSigner, depositViaAllowance } from '../../protocol/userActions';
import assert from 'node:assert';

// run with the prepRebalance state
describe('deposit', async () => {
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

  const testUserPK4 = 'APrivateKey1zkp3E4uqZn688rnY9CMndMWK9P7DtSeBaTkmP8jY16McQ7S';
  const testUser4 = 'aleo1m7zzuywplwmjqgcqy0xmlwywpss8470xgd7z39dzmglml44tf5zsfqd9m4';
  const testUserPK5 = 'APrivateKey1zkpEVGjGSxZTAP8mqe1ZRZ51RXv1ga79LgR4uJgBW6JJQxx';
  const testUser5 = 'aleo18c73yzxjsghezg84ftv62vumgxwj5df7tajf0gl4gsesk5arrvzq2fwy5t';

  before(async () => {
    // assert that program states are as expected
    // for aleo credits:
    // need delegators + pondo protocol
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
    protocolState = await getMappingValue('0u8', protocolId, 'protocol_state');
    console.log(`Protocol state: ${protocolState}`);
    assert(protocolState === '1u8', 'Protocol state is not 1u8, or prep rebalance');

    const txResult1 = await airDropCredits(testUser4, BigInt(10_000_000_000));
    const txResult = await airDropCredits(testUser5, BigInt(10_000_000_000));
    const airDropComplete = await isTransactionAccepted(txResult);
    console.log(`Airdrop complete: ${airDropComplete}`);
    const testUserBalance = await getPublicBalance(testUser5);
    console.log(`Test user balance: ${testUserBalance}`);
  });

  after(async () => {
    await killAuthorizePool();
  });

  describe('prep rebalance state, not earning rewards', async () => {
    describe('deposit_public_as_signer', async () => {
      it('does not allow depositing for greater paleo than expected', async () => {
        const depositAmount = BigInt(1_000_000);
        const expectedPaleoMinted = await calculatePaleoForDeposit(depositAmount) + BigInt(1);
        const depositTx = await depositAsSigner(depositAmount, testUserPK5, expectedPaleoMinted);
        const depositComplete = await isTransactionAccepted(depositTx);
        console.log(`Deposit complete: ${depositComplete}`);
        const testUserPaleo = await getMTSPBalance(testUser5, PALEO_TOKEN_ID, true);
        console.log(`Test user paleo balance: ${testUserPaleo}`);

        assert(testUserPaleo === BigInt(0), 'Test user should not have received any paleo');
        assert(!depositComplete, 'Deposit transaction should not have completed.');
      });

      it('should increase aleo pool and mint expected paleo to the test account', async () => {
        const depositAmount = BigInt(500_000_000);
        const expectedPaleoMinted = await calculatePaleoForDeposit(depositAmount) - BigInt(1_000);
        console.log(`Expected paleo minted: ${expectedPaleoMinted}`);
        const depositTx = await depositAsSigner(depositAmount, testUserPK5, expectedPaleoMinted);
        const depositComplete = await isTransactionAccepted(depositTx);
        const testUserPaleo = await getMTSPBalance(testUser5, PALEO_TOKEN_ID, true);
        console.log(`Test user paleo balance: ${testUserPaleo}`);

        assert(testUserPaleo === expectedPaleoMinted, 'Test user paleo balance is not as expected');
      });

      it('allows double deposits', async () => {
        const currentPaleo = await getMTSPBalance(testUser5, PALEO_TOKEN_ID, true);
        const depositAmount = BigInt(500_000_000);
        const expectedPaleoMinted = await calculatePaleoForDeposit(depositAmount) - BigInt(1_000);
        console.log(`Expected paleo minted: ${expectedPaleoMinted}`);
        const depositTx = await depositAsSigner(depositAmount, testUserPK5, expectedPaleoMinted);
        const depositComplete = await isTransactionAccepted(depositTx);
        const testUserPaleo = await getMTSPBalance(testUser5, PALEO_TOKEN_ID, true);
        console.log(`Test user paleo balance: ${testUserPaleo}`);

        assert(testUserPaleo === expectedPaleoMinted + currentPaleo, 'Test user paleo balance is not as expected');
      });
    });

    describe('deposit_public', async () => {
      it('does not allow depositing for greater paleo than expected', async () => {
        const depositAmount = BigInt(1_000_000);
        const expectedPaleoMinted = await calculatePaleoForDeposit(depositAmount) + BigInt(1);
        const depositTx = await depositViaAllowance(depositAmount, testUserPK4, expectedPaleoMinted);
        const depositComplete = await isTransactionAccepted(depositTx);
        console.log(`Deposit complete: ${depositComplete}`);
        const testUserPaleo = await getMTSPBalance(testUser4, PALEO_TOKEN_ID, true);
        console.log(`Test user paleo balance: ${testUserPaleo}`);

        assert(testUserPaleo === BigInt(0), 'Test user should not have received any paleo');
        assert(!depositComplete, 'Deposit transaction should not have completed.');
      });

      it('should increase aleo pool and mint expected paleo to the test account', async () => {
        const depositAmount = BigInt(500_000_000);
        const expectedPaleoMinted = await calculatePaleoForDeposit(depositAmount) - BigInt(1_000);;
        console.log(`Expected paleo minted: ${expectedPaleoMinted}`);
        const depositAllowance = await depositViaAllowance(depositAmount, testUserPK4, expectedPaleoMinted);
        const depositAllowanceComplete = await isTransactionAccepted(depositAllowance);
        const testUserPaleo = await getMTSPBalance(testUser4, PALEO_TOKEN_ID, true);
        console.log(`Test user paleo balance: ${testUserPaleo}`);

        assert(testUserPaleo === expectedPaleoMinted, 'Test user paleo balance is not as expected');
      });

      it('allows double deposits', async () => {
        const currentPaleo = await getMTSPBalance(testUser4, PALEO_TOKEN_ID, true);
        const depositAmount = BigInt(500_000_000);
        const expectedPaleoMinted = await calculatePaleoForDeposit(depositAmount) - BigInt(1_000);;
        console.log(`Expected paleo minted: ${expectedPaleoMinted}`);
        
        const depositAllowance = await depositViaAllowance(depositAmount, testUserPK4, expectedPaleoMinted);
        const depositAllowanceComplete = await isTransactionAccepted(depositAllowance);
        const testUserPaleo = await getMTSPBalance(testUser4, PALEO_TOKEN_ID, true);
        console.log(`Test user paleo balance: ${testUserPaleo}`);

        assert(testUserPaleo === expectedPaleoMinted + currentPaleo, 'Test user paleo balance is not as expected');
      });
    });
  });
});