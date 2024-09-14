import { after, before, describe, it } from "node:test";
import * as Aleo from "@demox-labs/aleo-sdk";
import { pondoDependencyTree, pondoProgramToCode } from "../../compiledPrograms";
import { airDropCredits, getMappingValue, getMTSPBalance, getProgram, getPublicBalance, isTransactionAccepted } from "../../aleo/client";
import {
  ADDRESS,
  MULTI_SIG_ADDRESS_0,
  MULTI_SIG_ADDRESS_1,
  MULTI_SIG_ADDRESS_2,
  MULTI_SIG_PRIVATE_KEY_0,
  MULTI_SIG_PRIVATE_KEY_1,
  MULTI_SIG_PRIVATE_KEY_2,
  NETWORK, PALEO_TOKEN_ID, PRIVATE_KEY
} from "../../constants";
import { killAuthorizePool, submitTransaction } from "../../aleo/execute";
import { deployProgram, resolveImports } from "../../aleo/deploy";
import assert from "node:assert";
import { delay, formatAleoString } from "../../util";
import { calculatePaleoForDeposit } from "../../protocol/userActions";


const timeOracleId = 'time_oracle.aleo';
const oldGrantDisbursementId = 'grant_disbursement.aleo';
const grantDisbursementId = 'grant_disbursement_1.aleo';
const grantAmount = 1_000_000_000n;
const imports = pondoDependencyTree[oldGrantDisbursementId];
const withdrawRewardsAddress = MULTI_SIG_ADDRESS_0!;
const withdrawRewardsPrivateKey = MULTI_SIG_PRIVATE_KEY_0!;
const withdrawPrincipalAddress = MULTI_SIG_ADDRESS_1!;
const withdrawPrincipalPrivateKey = MULTI_SIG_PRIVATE_KEY_1!;


describe('Time Oracle and Grant Disbursement', async () => {
  let resolvedImports: any;
  let timeOracleProgram: string;
  let grantDisbursementProgram: string;
  let grantDisbursementAddress: string;
  let pondoProtocolAddress: string;

  before(async () => {
    console.log('Deploying time oracle and grant disbursement programs...');
    resolvedImports = await resolveImports(imports);
    timeOracleProgram = await getProgram(timeOracleId);
    grantDisbursementProgram = pondoProgramToCode[oldGrantDisbursementId];
    grantDisbursementProgram = grantDisbursementProgram.replaceAll(oldGrantDisbursementId, grantDisbursementId);
    grantDisbursementAddress = Aleo.Program.fromString(NETWORK!, grantDisbursementProgram).toAddress();
    const pondoProgram = await getProgram('pondo_protocol.aleo');
    pondoProtocolAddress = Aleo.Program.fromString(NETWORK!, pondoProgram).toAddress();
  });

  after(async () => {
    await killAuthorizePool();
  });

  describe('Initialize time oracle', async () => {
    it('Should be able to initialize the time_oracle', async () => {
      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        timeOracleProgram,
        'initialize',
        [], // 10_000 credits
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, `${timeOracleId} initialize was rejected, but should have been accepted`);

      const timeOracleTimestamp = await getMappingValue('0u8', timeOracleId, 'timestamp');
      assert(timeOracleTimestamp == '0u64', `Time Oracle timestamp not set: ${timeOracleTimestamp}`);
    });

    it('Should be not able to initialize the time_oracle twice', async () => {
      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        timeOracleProgram,
        'initialize',
        [], // 10_000 credits
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, `${timeOracleId} initialize was accepted, but should have been rejected`);
    });
  });

  describe('Deploy and initialize the grant disbursement program', () => {
    const isProgramDeployed = async (programId: string, retries = 15, timeDelay = 3_000) => {
      for (let i = 0; i < retries; i++) {
        const program = await getProgram(programId);
        if (program) {
          return true;
        }
        await delay(timeDelay);
      }
      return false;
    }

    it('Should be able to deploy the grant disbursement program', async () => {
      await deployProgram(
        NETWORK!,
        PRIVATE_KEY!,
        grantDisbursementProgram,
        resolvedImports,
        25
      );

      const wasAccepted = await isProgramDeployed(grantDisbursementId);
      assert(wasAccepted, `${grantDisbursementId} deploy was rejected, but should have been accepted`);
    });

    it('Should be able to initialize the grant disbursement program', async () => {
      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        grantDisbursementProgram,
        'initialize',
        [],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, `${grantDisbursementId} initialize was rejected, but should have been accepted`);
    });

    it('Should be not able to initialize the grant disbursement program twice', async () => {
      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        grantDisbursementProgram,
        'initialize',
        [],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, `${grantDisbursementId} initialize was accepted, but should have been rejected`);
    });
  });

  describe('Process grant', () => {
    it('Should not be able to process a grant without funding first', async () => {
      const expectedPaleoMinted = await calculatePaleoForDeposit(grantAmount);
      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        grantDisbursementProgram,
        'process_grant',
        ['0u8', `${grantAmount.toString()}u64`, `${expectedPaleoMinted.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, `process_grant was accepted, but should have been rejected`);
    });

    it('Should be able to fund the grant disbursement program', async () => {
      const airDropResult = await airDropCredits(grantDisbursementAddress, grantAmount);
      const airDropAccepted = await isTransactionAccepted(airDropResult);
      assert(airDropAccepted, `Air drop was rejected, but should have been accepted`);

      const creditsBalance = await getPublicBalance(grantDisbursementAddress);
      assert(creditsBalance == grantAmount, `Credits balance not set: ${creditsBalance}`);

      const expectedPaleoMinted = await calculatePaleoForDeposit(grantAmount);

      /**
       * Should not be able to process a grant with too few paleo minted
       */
      const tooFewPaleo = (expectedPaleoMinted * 998n) / 1_000n;
      const tooFewPaleoResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        grantDisbursementProgram,
        'process_grant',
        ['0u8', `${grantAmount.toString()}u64`, `${tooFewPaleo.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );

      const tooFewPaleoAccepted = await isTransactionAccepted(tooFewPaleoResult);
      assert(!tooFewPaleoAccepted, `process_grant was accepted, but should have been rejected due to too few paleo minted`);

      /**
       * Should not be able to process a grant with too many paleo minted
       */
      const tooManyPaleo = (expectedPaleoMinted * 1_001n) / 1_000n;
      const tooManyPaleoResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        grantDisbursementProgram,
        'process_grant',
        ['0u8', `${grantAmount.toString()}u64`, `${tooManyPaleo.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );
      const tooManyPaleoAccepted = await isTransactionAccepted(tooManyPaleoResult);
      assert(!tooManyPaleoAccepted, `process_grant was accepted, but should have been rejected due to too many paleo minted`);

      /**
       * Should be able to process a grant with the correct amount of paleo minted
       */
      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        grantDisbursementProgram,
        'process_grant',
        ['0u8', `${grantAmount.toString()}u64`, `${expectedPaleoMinted.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, `process_grant was rejected, but should have been accepted`);

      const grant = await getMappingValue('0u8', grantDisbursementId, 'grants');
      assert(grant, `Grant not found: ${grant}`);

      const grantObject = JSON.parse(formatAleoString(grant));
      assert(grantObject.credits_amount === `${grantAmount.toString()}u64`, `Grant credits amount not set: ${grantObject.credits_amount}`);
      assert(grantObject.paleo_amount === `${expectedPaleoMinted.toString()}u128`, `Grant paleo amount not set: ${grantObject.paleo_amount}`);

      const creditsBalanceAfter = await getPublicBalance(grantDisbursementAddress);
      assert(creditsBalanceAfter == 0n, `Credits balance not set: ${creditsBalanceAfter}`);

      const paleoBalance = await getMTSPBalance(grantDisbursementAddress, PALEO_TOKEN_ID, true);
      assert(paleoBalance == expectedPaleoMinted, `Paleo balance not set: ${paleoBalance}, expected: ${expectedPaleoMinted}`);
    });
  });

  describe('Withdraw rewards', () => {
    it('Should be able to fund the withdrawal rewards and withdrawal principal addresses', async () => {
      const airDropResult = await airDropCredits(withdrawRewardsAddress, 1_000_000_000n);
      const airDropAccepted = await isTransactionAccepted(airDropResult);
      assert(airDropAccepted, `Air drop was rejected, but should have been accepted`);

      const airDropPrincipalResult = await airDropCredits(withdrawPrincipalAddress, 1_000_000_000n);
      const airDropPrincipalAccepted = await isTransactionAccepted(airDropPrincipalResult);
      assert(airDropPrincipalAccepted, `Air drop was rejected, but should have been accepted`);
    });

    it('Should not be able to withdraw rewards if no rewards', async () => {
      const txResult = await submitTransaction(
        NETWORK!,
        MULTI_SIG_PRIVATE_KEY_0!,
        grantDisbursementProgram,
        'withdraw_rewards',
        ['0u8', '1u128'],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, `withdraw_rewards was accepted, but should have been rejected due to no rewards`);
    });

    it('Should be able to withdraw rewards', async () => {
      // Airdrop to Pondo Protocol to simulate rewards
      // At this point, the Pondo Protocol should have 101,000 credits & 101,000 paleo minted
      const protocolTVL = 101_000_000_000n;
      const airDropResult = await airDropCredits(pondoProtocolAddress, protocolTVL);
      const airDropAccepted = await isTransactionAccepted(airDropResult);
      assert(airDropAccepted, `Air drop was rejected, but should have been accepted`);

      const expectedPaleoWithdrawLimit = grantAmount / 2n;

      /**
       * Should not be able to withdraw too many paleo
       */
      const tooManyPaleo = expectedPaleoWithdrawLimit + 1n;
      const tooManyPaleoResult = await submitTransaction(
        NETWORK!,
        MULTI_SIG_PRIVATE_KEY_0!,
        grantDisbursementProgram,
        'withdraw_rewards',
        ['0u8', `${tooManyPaleo.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );

      const tooManyPaleoAccepted = await isTransactionAccepted(tooManyPaleoResult);
      assert(!tooManyPaleoAccepted, `withdraw_rewards was accepted, but should have been rejected due to too many paleo`);

      /**
       * Should not be able to withdraw paleo with wrong address
       */

      const wrongAddressResult = await submitTransaction(
        NETWORK!,
        withdrawPrincipalPrivateKey,
        grantDisbursementProgram,
        'withdraw_rewards',
        ['0u8', `${expectedPaleoWithdrawLimit.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );

      const wrongAddressAccepted = await isTransactionAccepted(wrongAddressResult);
      assert(!wrongAddressAccepted, `withdraw_rewards was accepted, but should have been rejected due to wrong address`);

      /**
       * Should not be able to withdraw paleo with for the wrong grant it
       */

      const wrongGrantResult = await submitTransaction(
        NETWORK!,
        withdrawRewardsPrivateKey,
        grantDisbursementProgram,
        'withdraw_rewards',
        ['1u8', `${expectedPaleoWithdrawLimit.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );

      const wrongGrantAccepted = await isTransactionAccepted(wrongGrantResult);
      assert(!wrongGrantAccepted, `withdraw_rewards was accepted, but should have been rejected due to wrong grant`);

      /**
       * Should be able to withdraw rewards
       */

      const txResult = await submitTransaction(
        NETWORK!,
        withdrawRewardsPrivateKey,
        grantDisbursementProgram,
        'withdraw_rewards',
        ['0u8', `${expectedPaleoWithdrawLimit.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, `withdraw_rewards was rejected, but should have been accepted`);

      const rewardsBalance = await getMTSPBalance(withdrawRewardsAddress, PALEO_TOKEN_ID, true);
      assert(rewardsBalance == expectedPaleoWithdrawLimit, `Rewards balance not set: ${rewardsBalance}`);

      const grant = await getMappingValue('0u8', grantDisbursementId, 'grants');
      assert(grant, `Grant not found: ${grant}`);

      const grantObject = JSON.parse(formatAleoString(grant));
      assert(grantObject.credits_amount === `${grantAmount.toString()}u64`, `Grant credits amount not set: ${grantObject.credits_amount}`);
      assert(grantObject.paleo_amount === `${grantAmount - expectedPaleoWithdrawLimit}u128`, `Grant paleo amount not set: ${grantObject.paleo_amount}`);

      /**
       * Should not be able to withdraw rewards beyond the limit
       */
      const txResult2 = await submitTransaction(
        NETWORK!,
        withdrawRewardsPrivateKey,
        grantDisbursementProgram,
        'withdraw_rewards',
        ['0u8', `1u128`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted2 = await isTransactionAccepted(txResult2);
      assert(!wasAccepted2, `withdraw_rewards was accepted, but should have been rejected due to exceeding the limit`);
    });
  });

  describe('Time oracle', () => {
    it('Should not be able to withdraw principal before cliff block', async () => {
      const txResult = await submitTransaction(
        NETWORK!,
        withdrawPrincipalPrivateKey,
        grantDisbursementProgram,
        'withdraw_principal',
        ['0u8', `1u128`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, `withdraw_principal was accepted, but should have been rejected due to before cliff block`);
    });

    it('Should be able to update the time', async () => {
      const requestId = BigInt(Math.floor(Math.random() * 1_000_000_000));
      const newTime = '1500000000u64'; // After the cliff, 75% done with vesting
      const timeHash = Aleo.Plaintext.fromString(NETWORK!, newTime).hashBhp256();
      const plaintextString = `{
        arg: ${timeHash},
        op_type: 0u8,
        request_id: ${requestId}u64
      }`;
      const hashedField = Aleo.Plaintext.fromString(NETWORK!, plaintextString).hashBhp256();
  
      // Sign the hash with the oracle private keys
      const signature0 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_0!, hashedField).to_string();
      const signature1 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_1!, hashedField).to_string();
      const signature2 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_2!, hashedField).to_string();

      /**
       * Should not be able to update the time with a signature from a non-admin
       */
      const wrongSignature = Aleo.Signature.sign_plaintext(NETWORK!, PRIVATE_KEY!, hashedField).to_string();
      const wrongAdminResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        timeOracleProgram,
        'update_timestamp',
        [
          newTime,
          signature0,
          MULTI_SIG_ADDRESS_0!,
          signature1,
          MULTI_SIG_ADDRESS_1!,
          wrongSignature,
          ADDRESS!,
          `${requestId.toString()}u64`
        ],
        4
      );

      const wrongAdminAccepted = await isTransactionAccepted(wrongAdminResult);
      assert(!wrongAdminAccepted, `update_time was accepted, but should have been rejected due to wrong admin signature`);

      /**
       * Should not be able to update the time with a wrong signature
       */

      try {
        await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          timeOracleProgram,
          'update_timestamp',
          [
            newTime,
            signature0,
            MULTI_SIG_ADDRESS_0!,
            signature1,
            MULTI_SIG_ADDRESS_1!,
            wrongSignature,
            MULTI_SIG_ADDRESS_2!,
            `${requestId.toString()}u64`
          ],
          4
        );
        assert(false, `update_time was accepted, but should have been rejected due to wrong signature`);
      } catch (e) {
        console.log('Transaction failed as expected due to wrong signature');
      }

      /**
       * Should not be able to update the time with the wrong request id
       */

      try {
        await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          timeOracleProgram,
          'update_timestamp',
          [
            newTime,
            signature0,
            MULTI_SIG_ADDRESS_0!,
            signature1,
            MULTI_SIG_ADDRESS_1!,
            signature2,
            MULTI_SIG_ADDRESS_2!,
            `${(requestId + 1n).toString()}u64`
          ],
          4
        );
        assert(false, `update_time was accepted, but should have been rejected due to wrong request id`);
      } catch (e) {
        console.log('Transaction failed as expected due to wrong request id');
      }

      /**
       * Should not be able to update the time with the wrong time
       */

      try {
        await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          timeOracleProgram,
          'update_timestamp',
          [
            '1000u64',
            signature0,
            MULTI_SIG_ADDRESS_0!,
            signature1,
            MULTI_SIG_ADDRESS_1!,
            signature2,
            MULTI_SIG_ADDRESS_2!,
            `${requestId.toString()}u64`
          ],
          4
        );
        assert(false, `update_time was accepted, but should have been rejected due to wrong time`);
      } catch (e) {
        console.log('Transaction failed as expected due to wrong time');
      }

      /**
       * Should not be able to update the time with a duplicate signature
       */

      const duplicateSignature = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_0!, hashedField).to_string();
      try {
        await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          timeOracleProgram,
          'update_timestamp',
          [
            newTime,
            signature0,
            MULTI_SIG_ADDRESS_0!,
            duplicateSignature,
            MULTI_SIG_ADDRESS_0!,
            signature2,
            MULTI_SIG_ADDRESS_2!,
            `${requestId.toString()}u64`
          ],
          4
        );
        assert(false, `update_time was accepted, but should have been rejected due to duplicate signature`);
      } catch (e) {
        console.log('Transaction failed as expected due to duplicate signature');
      }

      /**
       * Should be able to update the time with the correct signatures
       */

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        timeOracleProgram,
        'update_timestamp',
        [
          newTime,
          signature0,
          MULTI_SIG_ADDRESS_0!,
          signature1,
          MULTI_SIG_ADDRESS_1!,
          signature2,
          MULTI_SIG_ADDRESS_2!,
          `${requestId.toString()}u64`
        ],
        4
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, `update_time was rejected, but should have been accepted`);

      const timeOracleTimestamp = await getMappingValue('0u8', timeOracleId, 'timestamp');
      assert(timeOracleTimestamp == newTime, `Time Oracle timestamp not set: ${timeOracleTimestamp}`);
    });
  });

  describe('Withdraw principal', () => {
    it('Should not be able to withdraw rewards after cliff block', async () => {
      const txResult = await submitTransaction(
        NETWORK!,
        withdrawRewardsPrivateKey,
        grantDisbursementProgram,
        'withdraw_rewards',
        ['0u8', `1u128`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(!wasAccepted, `withdraw_rewards was accepted, but should have been rejected due to after cliff block`);
    });

    it('Should be able to withdraw principal', async () => {
      const expectedPaleoWithdrawLimit = (grantAmount / 2n) * 7500n / 10000n - 1_000n;

      /**
       * Should not be able to withdraw too many paleo
       */
      const tooManyPaleo = expectedPaleoWithdrawLimit + 10_000n;
      const tooManyPaleoResult = await submitTransaction(
        NETWORK!,
        withdrawPrincipalPrivateKey,
        grantDisbursementProgram,
        'withdraw_principal',
        ['0u8', `${tooManyPaleo.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );

      const tooManyPaleoAccepted = await isTransactionAccepted(tooManyPaleoResult);
      assert(!tooManyPaleoAccepted, `withdraw_principal was accepted, but should have been rejected due to too many paleo`);

      /**
       * Should not be able to withdraw paleo with wrong address
       */
      const wrongAddressResult = await submitTransaction(
        NETWORK!,
        withdrawRewardsPrivateKey,
        grantDisbursementProgram,
        'withdraw_principal',
        ['0u8', `${expectedPaleoWithdrawLimit.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );

      const wrongAddressAccepted = await isTransactionAccepted(wrongAddressResult);
      assert(!wrongAddressAccepted, `withdraw_principal was accepted, but should have been rejected due to wrong address`);

      /**
       * Should not be able to withdraw paleo with for the wrong grant it
       */
      const wrongGrantResult = await submitTransaction(
        NETWORK!,
        withdrawPrincipalPrivateKey,
        grantDisbursementProgram,
        'withdraw_principal',
        ['1u8', `${expectedPaleoWithdrawLimit.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );

      const wrongGrantAccepted = await isTransactionAccepted(wrongGrantResult);
      assert(!wrongGrantAccepted, `withdraw_principal was accepted, but should have been rejected due to wrong grant`);

      /**
       * Should be able to withdraw principal
       */
      const txResult = await submitTransaction(
        NETWORK!,
        withdrawPrincipalPrivateKey,
        grantDisbursementProgram,
        'withdraw_principal',
        ['0u8', `${expectedPaleoWithdrawLimit.toString()}u128`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, `withdraw_principal was rejected, but should have been accepted`);

      const principalBalance = await getMTSPBalance(withdrawPrincipalAddress, PALEO_TOKEN_ID, true);
      assert(principalBalance == expectedPaleoWithdrawLimit, `Principal balance not set: ${principalBalance}`);

      const grant = await getMappingValue('0u8', grantDisbursementId, 'grants');
      assert(grant, `Grant not found: ${grant}`);

      const grantObject = JSON.parse(formatAleoString(grant));
      assert(grantObject.credits_amount === `${grantAmount.toString()}u64`, `Grant credits amount not set: ${grantObject.credits_amount}`);
      assert(grantObject.paleo_amount === `${grantAmount / 2n - expectedPaleoWithdrawLimit}u128`, `Grant paleo amount not set: ${grantObject.paleo_amount}`);

      /**
       * Should not be able to withdraw principal beyond the limit
       */
      const txResult2 = await submitTransaction(
        NETWORK!,
        withdrawPrincipalPrivateKey,
        grantDisbursementProgram,
        'withdraw_principal',
        ['0u8', `10_000_000u128`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted2 = await isTransactionAccepted(txResult2);
      assert(!wasAccepted2, `withdraw_principal was accepted, but should have been rejected due to exceeding the vested limit`);
    });

    it('Should be able to withdraw the remaining principal after the full vest', async () => {
      const requestId = BigInt(Math.floor(Math.random() * 1_000_000_000));
      const newTime = '2000000001u64'; // After full vesting
      const timeHash = Aleo.Plaintext.fromString(NETWORK!, newTime).hashBhp256();
      const plaintextString = `{
        arg: ${timeHash},
        op_type: 0u8,
        request_id: ${requestId}u64
      }`;
      const hashedField = Aleo.Plaintext.fromString(NETWORK!, plaintextString).hashBhp256();
  
      // Sign the hash with the oracle private keys
      const signature0 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_0!, hashedField).to_string();
      const signature1 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_1!, hashedField).to_string();
      const signature2 = Aleo.Signature.sign_plaintext(NETWORK!, MULTI_SIG_PRIVATE_KEY_2!, hashedField).to_string();

      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        timeOracleProgram,
        'update_timestamp',
        [
          newTime,
          signature0,
          MULTI_SIG_ADDRESS_0!,
          signature1,
          MULTI_SIG_ADDRESS_1!,
          signature2,
          MULTI_SIG_ADDRESS_2!,
          `${requestId.toString()}u64`
        ],
        4
      );

      const wasAccepted = await isTransactionAccepted(txResult);
      assert(wasAccepted, `update_time was rejected, but should have been accepted`);

      const grant = await getMappingValue('0u8', grantDisbursementId, 'grants');
      assert(grant, `Grant not found: ${grant}`);

      const grantObject = JSON.parse(formatAleoString(grant));
      assert(grantObject.credits_amount === `${grantAmount.toString()}u64`, `Grant credits amount not set: ${grantObject.credits_amount}`);
      const expectedPaleoWithdrawLimit = BigInt(grantObject.paleo_amount.slice(0, -4));
      
      const txResult2 = await submitTransaction(
        NETWORK!,
        withdrawPrincipalPrivateKey,
        grantDisbursementProgram,
        'withdraw_principal',
        ['0u8', `${expectedPaleoWithdrawLimit}u128`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted2 = await isTransactionAccepted(txResult2);
      assert(wasAccepted2, `withdraw_principal was rejected, but should have been accepted`);

      const principalBalance = await getMTSPBalance(withdrawPrincipalAddress, PALEO_TOKEN_ID, true);
      assert(principalBalance == grantAmount / 2n, `Principal balance not set: ${principalBalance}`);

      const grant2 = await getMappingValue('0u8', grantDisbursementId, 'grants');
      assert(grant2, `Grant not found: ${grant2}`);

      const grantObject2 = JSON.parse(formatAleoString(grant2));
      assert(grantObject2.credits_amount === `${grantAmount.toString()}u64`, `Grant credits amount not set: ${grantObject2.credits_amount}`);
      assert(grantObject2.paleo_amount === '0u128', `Grant paleo amount not set: ${grantObject2.paleo_amount}`);

      /**
       * Should not be able to withdraw principal after the full vest
       */
      const txResult3 = await submitTransaction(
        NETWORK!,
        withdrawPrincipalPrivateKey,
        grantDisbursementProgram,
        'withdraw_principal',
        ['0u8', `1u128`],
        4,
        undefined,
        resolvedImports
      );

      const wasAccepted3 = await isTransactionAccepted(txResult3);
      assert(!wasAccepted3, `withdraw_principal was accepted, but should have been rejected due to after full vest`);
    });
  });
});