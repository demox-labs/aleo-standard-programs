import { after, before, describe, it } from "node:test";
import * as Aleo from "@demox-labs/aleo-sdk";
import { pondoDependencyTree, pondoPrograms } from "../../compiledPrograms";
import { airDropCredits, getMappingValue, getMTSPBalance, getProgram, getPublicBalance, isTransactionAccepted } from "../../aleo/client";
import {
  ADDRESS,
  MULTI_SIG_ADDRESS_0,
  MULTI_SIG_PRIVATE_KEY_0,
  MULTI_SIG_PRIVATE_KEY_1,
  NETWORK, PRIVATE_KEY
} from "../../constants";
import { killAuthorizePool, submitTransaction } from "../../aleo/execute";
import { resolveImports } from "../../aleo/deploy";
import assert from "node:assert";
import { formatAleoString } from "../../util";


// Use the pondoRebalance saved ledger state
describe("Rebalance State Machine Tests", () => {
  let paleoTokenProgram: string;
  let pondoTokenProgram: string;
  let pondoCoreProgram: string;
  let mtspProgram: string;

  let paleoTokenAddress: string;
  let pondoTokenAddress: string;
  let pondoCoreAddress: string;

  const paleoTokenProgramId: string = pondoPrograms.find((program) =>
    program.includes('pondo_staked_aleo_token')
  )!;
  const pondoTokenProgramId: string = pondoPrograms.find((program) =>
    program.includes('pondo_token')
  )!;
  const pondoCoreProgramId: string = pondoPrograms.find((program) =>
    program.includes('pondo_core')
  )!;
  const mtspProgramId: string = pondoPrograms.find((program) =>
    program.includes('multi_token')
  )!;
  const PALEO_TOKEN_ID = '1751493913335802797273486270793650302076377624243810059080883537084141842600field';
  const PONDO_TOKEN_ID = '1751493913335802797273486270793650302076377624243810059080883537084141842601field';
  const PONDO_SUPPLY = BigInt(1_000_000_000_000_000);

  before(async () => {
    paleoTokenProgram = await getProgram(paleoTokenProgramId);
    pondoTokenProgram = await getProgram(pondoTokenProgramId);
    pondoCoreProgram = await getProgram(pondoCoreProgramId);
    mtspProgram = await getProgram(mtspProgramId);

    paleoTokenAddress = Aleo.Program.fromString(NETWORK!, paleoTokenProgram).toAddress();
    pondoTokenAddress = Aleo.Program.fromString(NETWORK!, pondoTokenProgram).toAddress();
    pondoCoreAddress = Aleo.Program.fromString(NETWORK!, pondoCoreProgram).toAddress();
  });

  after(async () => {
    await killAuthorizePool();
  });

  describe("Pondo Token", () => {
    it("Pondo state should be initialized correctly", async () => {
      // Check the paleo token data
      const paleoTokenDataString = await getMappingValue(PALEO_TOKEN_ID, mtspProgramId, 'registered_tokens');
      const paleoTokenData = JSON.parse(formatAleoString(paleoTokenDataString));
      assert(paleoTokenData.token_id == PALEO_TOKEN_ID, 'Paleo token data is incorrect');
      assert(paleoTokenData.name == '1631421259099656974472467909989204u128', 'Paleo token admin is incorrect');
      assert(paleoTokenData.symbol == '482131854671u128', 'Paleo token symbol is incorrect');
      assert(paleoTokenData.decimals == '6u8', 'Paleo token decimals is incorrect');
      assert(paleoTokenData.max_supply == '1000000000000000u128', 'Paleo token max_supply is incorrect');
      assert(paleoTokenData.admin == paleoTokenAddress, 'Paleo token admin is incorrect');
      assert(paleoTokenData.external_authorization_required == 'false', 'Paleo token external_authorization_required is incorrect');
      assert(
        paleoTokenData.external_authorization_party == paleoTokenAddress,
        `Paleo token external_authorization_party is incorrect: ${paleoTokenData.external_authorization_party} !== ${paleoTokenAddress}`
      );

      // Check the pondo token data
      const pondoTokenDataString = await getMappingValue(PONDO_TOKEN_ID, mtspProgramId, 'registered_tokens');
      const pondoTokenData = JSON.parse(formatAleoString(pondoTokenDataString));
      assert(pondoTokenData.token_id == PONDO_TOKEN_ID, 'Pondo token data is incorrect');
      assert(pondoTokenData.name == '97240284627655645872219502u128', 'Pondo token admin is incorrect');
      assert(pondoTokenData.symbol == '1347306575u128', 'Pondo token symbol is incorrect');
      assert(pondoTokenData.decimals == '6u8', 'Pondo token decimals is incorrect');
      assert(pondoTokenData.supply == '0u128', 'Pondo token supply is incorrect');
      assert(pondoTokenData.max_supply == '1000000000000000u128', 'Pondo token max_supply is incorrect');
      assert(pondoTokenData.admin == pondoTokenAddress, `Pondo token admin is incorrect: ${pondoTokenData.admin} !== ${ADDRESS}`);
      assert(pondoTokenData.external_authorization_required == 'false', 'Pondo token external_authorization_required is incorrect');
      assert(
        pondoTokenData.external_authorization_party == pondoTokenAddress,
        `Pondo token external_authorization_party is incorrect: ${pondoTokenData.external_authorization_party} !== ${pondoTokenAddress}`
      );
    });

    it("Wrong address should not be able to initialize twice", async () => {
      const imports = pondoDependencyTree[pondoTokenProgramId];
      const resolvedImports = await resolveImports(imports);

      try {
        await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          pondoTokenProgram,
          'initialize_token',
          [],
          4,
          undefined,
          resolvedImports
        );
        assert(false, 'initialize_token was accepted, but should have been rejected due to wrong address & already initialized');
      } catch (error) {
        console.log('initialize_token was rejected as expected');
      }
    });

    it("Wrong address should not be able to mint", async () => {
      const imports = pondoDependencyTree[pondoTokenProgramId];
      const resolvedImports = await resolveImports(imports);

      try {
        await submitTransaction(
          NETWORK!,
          PRIVATE_KEY!,
          pondoTokenProgram,
          'mint_public',
          [],
          4,
          undefined,
          resolvedImports
        );
        assert(false, 'mint_public was accepted, but should have been rejected due to wrong address');
      } catch (error) {
        console.log('mint_public was rejected as expected');
      }
    });

    it("Should be able to mint with the correct address", async () => {
      await airDropCredits(MULTI_SIG_ADDRESS_0!, 100_000_000n);

      const imports = pondoDependencyTree[pondoTokenProgramId];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        MULTI_SIG_PRIVATE_KEY_0!,
        pondoTokenProgram,
        'mint_public',
        [],
        4,
        undefined,
        resolvedImports
      );

      const mintComplete = await isTransactionAccepted(txResult);
      assert(mintComplete, 'mint_public was not accepted');
      const balance = await getMTSPBalance(MULTI_SIG_ADDRESS_0!, PONDO_TOKEN_ID, true);
      assert(balance == PONDO_SUPPLY, 'balance is not as expected');
    });

    it("Should not be able to mint twice with the correct address", async () => {
      await airDropCredits(MULTI_SIG_ADDRESS_0!, 100_000_000n);

      const imports = pondoDependencyTree[pondoTokenProgramId];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        MULTI_SIG_PRIVATE_KEY_0!,
        pondoTokenProgram,
        'mint_public',
        [],
        4,
        undefined,
        resolvedImports
      );

      const mintComplete = await isTransactionAccepted(txResult);
      assert(!mintComplete, 'mint_public was should not have been accepted twice');
      // Ensure the balance is the same as before
      const balance = await getMTSPBalance(MULTI_SIG_ADDRESS_0!, PONDO_TOKEN_ID, true);
      assert(balance == PONDO_SUPPLY, 'balance is not as expected');
    });

    it("Should be able to transfer pondo", async () => {
      const amount = 10_000_000_000n;
      const imports = pondoDependencyTree[pondoTokenProgramId];
      const resolvedImports = await resolveImports(imports);

      const txResult = await submitTransaction(
        NETWORK!,
        MULTI_SIG_PRIVATE_KEY_0!,
        mtspProgram,
        'transfer_public',
        [PONDO_TOKEN_ID, ADDRESS!, `${amount}u128`],
        4,
        undefined,
        resolvedImports
      );

      const transferComplete = await isTransactionAccepted(txResult);
      assert(transferComplete, 'transfer_public was not accepted');
      const balance = await getMTSPBalance(ADDRESS!, PONDO_TOKEN_ID, true);
      assert(balance == amount, 'balance is not as expected');
    });

    it("Should be able to burn pondo for pAleo", async () => {
      // The snapshot has the amount of pAleo owned by the pondo token as 145050
      // With the pondoAmount below: 145050 * 10000000000 / 1000000000000000 = 1.4505
      // So we should be able to mint 1 micro pAleo but not 2
      const pondoAmount = 10_000_000_000n; // Amount of pondo transfered from previous test
      const imports = pondoDependencyTree[pondoTokenProgramId];
      const resolvedImports = await resolveImports(imports);

      const pAleoBalance = await getMTSPBalance(pondoTokenAddress, PALEO_TOKEN_ID, true);
      const pAleoAmount = (pondoAmount * pAleoBalance) / PONDO_SUPPLY;
      console.log(`pAleo balance: ${pAleoBalance}, pAleo amount: ${pAleoAmount}, pondo amount: ${pondoAmount}`);
      
      /**
       * Should not be able to burn pondo for too much pAleo
       */
      const invalidBurnResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoTokenProgram,
        'burn_public',
        [ADDRESS!, `${pondoAmount}u128`, `${pAleoAmount + 1n}u128`],
        4,
        undefined,
        resolvedImports
      );

      const invalidBurnComplete = await isTransactionAccepted(invalidBurnResult);
      assert(!invalidBurnComplete, 'burn_public was accepted with too much pAleo');

      /**
       * Should not be able to burn more pondo than available
       */
      const invalidBurnResult2 = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoTokenProgram,
        'burn_public',
        [ADDRESS!, `${pondoAmount + 1n}u128`, `${pAleoAmount}u128`],
        4,
        undefined,
        resolvedImports
      );

      const invalidBurnComplete2 = await isTransactionAccepted(invalidBurnResult2);
      assert(!invalidBurnComplete2, 'burn_public was accepted with too much pondo');

      /**
       * Should not be able to burn pondo for wrong address
       */
      try {
        await submitTransaction(
          NETWORK!,
          MULTI_SIG_PRIVATE_KEY_0!,
          pondoTokenProgram,
          'burn_public',
          [ADDRESS!, `${pondoAmount}u128`, `${pAleoAmount}u128`],
          4,
          undefined,
          resolvedImports
        );
        assert(false, 'burn_public was accepted, but should have been rejected due to wrong address');
      } catch (error) {
        console.log('burn_public was rejected as expected');
      }

      /**
       * Should be able to burn pondo for the correct amount of pAleo
       */
      const txResult = await submitTransaction(
        NETWORK!,
        PRIVATE_KEY!,
        pondoTokenProgram,
        'burn_public',
        [ADDRESS!, `${pondoAmount}u128`, `${pAleoAmount}u128`],
        4,
        undefined,
        resolvedImports
      );

      const burnComplete = await isTransactionAccepted(txResult);
      assert(burnComplete, 'burn_public was not accepted');
      const balance = await getMTSPBalance(ADDRESS!, PONDO_TOKEN_ID, true);
      assert(balance == 0n, 'balance is not as expected');
      const pAleoBalanceAfter = await getMTSPBalance(pondoTokenAddress, PALEO_TOKEN_ID, true);
      assert(pAleoBalanceAfter == pAleoBalance - pAleoAmount, 'program pAleo balance is not as expected');
      const userPAleoBalance = await getMTSPBalance(ADDRESS!, PALEO_TOKEN_ID, true);
      assert(userPAleoBalance == pAleoAmount, 'user balance is not as expected');
      const pondoTokenData = await getMappingValue(PONDO_TOKEN_ID, mtspProgramId, 'registered_tokens');
      const pondoSupply = BigInt(JSON.parse(formatAleoString(pondoTokenData)).supply.slice(0, -4));
      assert(pondoSupply == PONDO_SUPPLY - pondoAmount, 'pondo supply is not as expected');
    });
  });
});