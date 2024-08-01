import * as Aleo from '@demox-labs/aleo-sdk';

import { getMappingValue, getPublicBalance, isTransactionAccepted } from "../../aleo/client";
import { submitTransaction } from "../../aleo/execute";
import { resolveImports } from "../../aleo/deploy";
import { NETWORK, ORACLE_ADDRESS, ORACLE_PRIVATE_KEY, PONDO_ORACLE_PROGRAM, PONDO_ORACLE_PROGRAM_CODE, PRIVATE_KEY } from "../../constants";
import { pondoDependencyTree } from '../../compiledPrograms';
import assert from 'assert';


async function testControlAddress() {
  const imports = pondoDependencyTree[PONDO_ORACLE_PROGRAM!];
  const resolvedImports = await resolveImports(imports);

  /**
   * Test Case 1: Add control address using an existing control address
   * Expected: Success
   */
  const newPrivateKey = new Aleo.PrivateKey(NETWORK!);
  const newAddress = newPrivateKey.to_address();
  console.log(`Test adding a new control address ${newAddress.to_string()} with a valid control address`);

  const transactionResult = await submitTransaction(
    NETWORK!,
    ORACLE_PRIVATE_KEY!,
    PONDO_ORACLE_PROGRAM_CODE!,
    'add_control_address',
    [newAddress.to_string()],
    3,
    undefined,
    resolvedImports
  );
  const transactionAccepted = await isTransactionAccepted(transactionResult);
  assert(transactionAccepted, `Failed to add control address ${newAddress.to_string()}`);

  const controlAddressResult = await getMappingValue(newAddress.to_string(), PONDO_ORACLE_PROGRAM!, 'control_addresses');
  assert(controlAddressResult == 'false', 'Control address added successfully, not as super admin');

  /**
   * Test Case 2: Add control address using a non-control address
   * Expected: Failure
   */
  const failedPrivateKey = new Aleo.PrivateKey(NETWORK!);
  const failedAddress = failedPrivateKey.to_address();
  console.log(`Test adding a new control address ${failedAddress.to_string()} with an invalid control address`);

  const failedTransactionResult = await submitTransaction(
    NETWORK!,
    PRIVATE_KEY!, // This assumes it's different than the oracle's private key
    PONDO_ORACLE_PROGRAM_CODE!,
    'add_control_address',
    [failedAddress.to_string()],
    3,
    undefined,
    resolvedImports
  );

  const failedTransactionAccepted = await isTransactionAccepted(failedTransactionResult);
  assert(!failedTransactionAccepted, `Added control address ${failedAddress.to_string()} with a non-control address`);

  const failedControlAddressResult = await getMappingValue(failedAddress.to_string(), PONDO_ORACLE_PROGRAM!, 'control_addresses');
  assert(failedControlAddressResult == null, 'Control address added successfully, not as super admin');
}

async function testPondoBanValidator() {
  const imports = pondoDependencyTree[PONDO_ORACLE_PROGRAM!];
  const resolvedImports = await resolveImports(imports);

  /**
   * Test Case 1: Ban a validator using an existing control address
   * Expected: Success
   */
  const newPrivateKey = new Aleo.PrivateKey(NETWORK!);
  const newAddress = newPrivateKey.to_address();
  console.log(`Test banning a validator ${newAddress.to_string()} with a valid control address`);

  const transactionResult = await submitTransaction(
    NETWORK!,
    ORACLE_PRIVATE_KEY!,
    PONDO_ORACLE_PROGRAM_CODE!,
    'pondo_ban_validator',
    [newAddress.to_string()],
    3,
    undefined,
    resolvedImports
  );
  const transactionAccepted = await isTransactionAccepted(transactionResult);
  assert(transactionAccepted, `Failed to ban address ${newAddress.to_string()}`);

  const controlAddressResult = await getMappingValue(newAddress.to_string(), PONDO_ORACLE_PROGRAM!, 'banned_validators');
  assert(controlAddressResult == 'true', 'Failed to ban validator successfully');

  /**
   * Test Case 2: Ban a validator using a non-control address
   * Expected: Failure
   */
  const failedPrivateKey = new Aleo.PrivateKey(NETWORK!);
  const failedAddress = failedPrivateKey.to_address();
  console.log(`Test banning a validator ${failedAddress.to_string()} with an invalid control address`);

  const failedTransactionResult = await submitTransaction(
    NETWORK!,
    PRIVATE_KEY!, // This assumes it's different than the oracle's private key
    PONDO_ORACLE_PROGRAM_CODE!,
    'pondo_ban_validator',
    [failedAddress.to_string()],
    3,
    undefined,
    resolvedImports
  );

  const failedTransactionAccepted = await isTransactionAccepted(failedTransactionResult);
  assert(!failedTransactionAccepted, `Banned a validator ${failedAddress.to_string()} with a non-control address`);

  const failedControlAddressResult = await getMappingValue(failedAddress.to_string(), PONDO_ORACLE_PROGRAM!, 'banned_validators');
  assert(failedControlAddressResult == null, 'Banned validator successfully without control address');
}

async function main() {
  // Transfer some funds to the oracle to pay for the next transaction
  const publicBalance = await getPublicBalance(ORACLE_ADDRESS!);
  if (publicBalance < BigInt(5_000_000)) {
    console.log('Transferring funds to the oracle');
    await submitTransaction(
      NETWORK!,
      PRIVATE_KEY!,
      Aleo.Program.getCreditsProgram(NETWORK!).toString(),
      'transfer_public',
      [ORACLE_ADDRESS!, '50_000_000u64'],
      0.1
    );
  }

  await testControlAddress();
  await testPondoBanValidator();
}

main()