import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { NETWORK, PALEO_TOKEN_ID, PALEO_TOKEN_ID_DEFAULT, PRIVATE_KEY } from '../../constants';
import * as Aleo from '@demox-labs/aleo-sdk';
import { airDropCredits, getMappingValue, getMTSPBalance, getProgram, getPublicBalance, isTransactionAccepted } from '../../aleo/client';
import { killAuthorizePool } from '../../aleo/execute';
import { pondoPrograms } from '../../compiledPrograms';
import { calculatePaleoForDeposit, depositAsSigner } from '../../protocol/userActions';

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

  const testUserPK = 'APrivateKey1zkp5fjQuBAeRnvPXFfde17Jm11S8wbF4iprqUBfG8AkLTkL';
  const testUser = 'aleo1znrtvcdvxtjtw2ty9rex9yj0yf2cpxejktfmncj5et7ud9nunsqqczmczk';

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
    paleoMintedToCoreProtocol = await getMTSPBalance(protocolProgramAddress, PALEO_TOKEN_ID, true);
    console.log(`Paleo minted to core protocol: ${paleoMintedToCoreProtocol}`);
    assert(paleoMintedToCoreProtocol === BigInt(101000000));
    protocolState = await getMappingValue('0u8', protocolId, 'protocol_state');
    assert(protocolState === '2u8'); // rebalancing
    console.log(`Protocol state: ${protocolState}`);

    const bigUserPrivateKey = Aleo.PrivateKey.from_string(NETWORK!, PRIVATE_KEY!);

    const bigUserBalance = await getPublicBalance(bigUserPrivateKey.to_address().to_string());

    const txResult = await airDropCredits(testUser, BigInt(10_000_000_000));
    const airDropComplete = await isTransactionAccepted(txResult);
    console.log(`Airdrop complete: ${airDropComplete}`);
    const testUserBalance = await getPublicBalance(testUser);
    console.log(`Big user balance: ${bigUserBalance}`);
    console.log(`Test user balance: ${testUserBalance}`);
  });

  after(async () => {
    await killAuthorizePool();
  });

  describe('rebalancing state', async () => {
    describe('deposit_public_as_signer', async () => {
      it('should fail', async () => {
        const depositAmount = BigInt(500_000_000);
        const expectedPaleoMinted = await calculatePaleoForDeposit(depositAmount);
        const depositTx = await depositAsSigner(depositAmount, testUserPK);
        const depositComplete = await isTransactionAccepted(depositTx);
        console.log(`Deposit complete: ${depositComplete}`);
        const testUserPaleo = await getMTSPBalance(testUser, PALEO_TOKEN_ID, true);
        console.log(`Test user paleo balance: ${testUserPaleo}`);

        assert(testUserPaleo === BigInt(0), 'Test user should not have received any paleo');
        assert(!depositComplete, 'Deposit transaction should not have completed.');
      });
    });
  });
});