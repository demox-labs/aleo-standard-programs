import { after, before, describe, it } from 'node:test';
import { NETWORK, PALEO_TOKEN_ID, PALEO_TOKEN_ID_DEFAULT, PRIVATE_KEY } from '../../constants';
import * as Aleo from '@demox-labs/aleo-sdk';
import { airDropCredits, getMappingValue, getMTSPBalance, getProgram, getPublicBalance, isTransactionAccepted } from '../../aleo/client';
import { killAuthorizePool } from '../../aleo/execute';
import { pondoPrograms } from '../../compiledPrograms';
import { calculatePaleoForDeposit, depositAsSigner, depositViaAllowance } from '../../protocol/userActions';
import assert from 'node:assert';

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

  const testUserPK1 = 'APrivateKey1zkp5fjQuBAeRnvPXFfde17Jm11S8wbF4iprqUBfG8AkLTkL';
  const testUser1 = 'aleo1znrtvcdvxtjtw2ty9rex9yj0yf2cpxejktfmncj5et7ud9nunsqqczmczk';
  const testUserPK2 = 'APrivateKey1zkpBBU1h6pHmUfGpq7gZF9ckRaSwoNxSrWJe26YQhC2mzfT';
  const testUser2 = 'aleo1w7vqw25w4yktzlucuxzekxm8r5jee40z5p0wjq35qqdrq257mupqssgj7q';

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
    console.log(`Paleo minted to core protocol: ${paleoMintedToCoreProtocol}`);
    assert(paleoMintedToCoreProtocol === BigInt(101000000), 'Paleo minted to core protocol is not as expected');
    protocolState = await getMappingValue('0u8', protocolId, 'protocol_state');
    assert(protocolState === '0u8', 'Protocol state is not 0u8, or normal'); // normal
    console.log(`Protocol state: ${protocolState}`);

    const txResult1 = await airDropCredits(testUser2, BigInt(10_000_000_000));
    const txResult = await airDropCredits(testUser1, BigInt(10_000_000_000));
    const airDropComplete = await isTransactionAccepted(txResult);
    console.log(`Airdrop complete: ${airDropComplete}`);
    const testUserBalance = await getPublicBalance(testUser1);
    console.log(`Test user balance: ${testUserBalance}`);
  });

  after(async () => {
    await killAuthorizePool();
  });

  describe('normal state, not earning rewards', async () => {
    describe('deposit_public_as_signer', async () => {
      it('should increase aleo pool and mint expected paleo to the test account', async () => {
        const depositAmount = BigInt(500_000_000);
        const expectedPaleoMinted = await calculatePaleoForDeposit(depositAmount);
        console.log(`Expected paleo minted: ${expectedPaleoMinted}`);
        const depositTx = await depositAsSigner(depositAmount, testUserPK1, expectedPaleoMinted);
        const depositComplete = await isTransactionAccepted(depositTx);
        const testUserPaleo = await getMTSPBalance(testUser1, PALEO_TOKEN_ID, true);
        console.log(`Test user paleo balance: ${testUserPaleo}`);

        assert(testUserPaleo === expectedPaleoMinted, 'Test user paleo balance is not as expected');
      });

      it('allows double deposits', async () => {
        const currentPaleo = await getMTSPBalance(testUser1, PALEO_TOKEN_ID, true);
        const depositAmount = BigInt(500_000_000);
        const expectedPaleoMinted = await calculatePaleoForDeposit(depositAmount);
        console.log(`Expected paleo minted: ${expectedPaleoMinted}`);
        const depositTx = await depositAsSigner(depositAmount, testUserPK1, expectedPaleoMinted);
        const depositComplete = await isTransactionAccepted(depositTx);
        const testUserPaleo = await getMTSPBalance(testUser1, PALEO_TOKEN_ID, true);
        console.log(`Test user paleo balance: ${testUserPaleo}`);

        assert(testUserPaleo === expectedPaleoMinted + currentPaleo, 'Test user paleo balance is not as expected');
      });
    });

    describe('deposit_public', async () => {
      it('should increase aleo pool and mint expected paleo to the test account', async () => {
        const depositAmount = BigInt(500_000_000);
        const expectedPaleoMinted = await calculatePaleoForDeposit(depositAmount);
        console.log(`Expected paleo minted: ${expectedPaleoMinted}`);
        const depositAllowance = await depositViaAllowance(depositAmount, testUserPK2, expectedPaleoMinted);
        const depositAllowanceComplete = await isTransactionAccepted(depositAllowance);
        const testUserPaleo = await getMTSPBalance(testUser2, PALEO_TOKEN_ID, true);
        console.log(`Test user paleo balance: ${testUserPaleo}`);

        assert(testUserPaleo === expectedPaleoMinted, 'Test user paleo balance is not as expected');
      });

      it('allows double deposits', async () => {
        const currentPaleo = await getMTSPBalance(testUser2, PALEO_TOKEN_ID, true);
        const depositAmount = BigInt(500_000_000);
        const expectedPaleoMinted = await calculatePaleoForDeposit(depositAmount);
        console.log(`Expected paleo minted: ${expectedPaleoMinted}`);
        
        const depositAllowance = await depositViaAllowance(depositAmount, testUserPK2, expectedPaleoMinted);
        const depositAllowanceComplete = await isTransactionAccepted(depositAllowance);
        const testUserPaleo = await getMTSPBalance(testUser2, PALEO_TOKEN_ID, true);
        console.log(`Test user paleo balance: ${testUserPaleo}`);

        assert(testUserPaleo === expectedPaleoMinted + currentPaleo, 'Test user paleo balance is not as expected');
      });
    });
  });
});