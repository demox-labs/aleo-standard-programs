import * as Aleo from '@demox-labs/aleo-sdk';

import { getMappingValue, getPublicBalance } from '../aleo/client';
import {
  TEST_USER0_PRIVATE_KEY,
  TEST_USER0_ADDRESS,
  TEST_USER1_PRIVATE_KEY,
  TEST_USER1_ADDRESS,
  TEST_USER2_PRIVATE_KEY,
  TEST_USER2_ADDRESS,
  NETWORK,
  PRIVATE_KEY,
  PALEO_TOKEN_ID,
} from '../constants';
import { submitTransaction } from '../aleo/execute';
import { depositAsSigner } from '../protocol/userActions';
import { pondoPrograms } from '../compiledPrograms';
import { formatAleoString } from '../util';

const MTSP_PROGRAM = pondoPrograms.find((program) =>
  program.includes('multi_token_support_program')
);

const fundTestAccountIfNecessary = async (address: string) => {
  const balance = await getPublicBalance(address);
  if (balance < BigInt(1_000_000)) {
    console.log(`Funding test account ${address}`);
    await submitTransaction(
      NETWORK!,
      PRIVATE_KEY!,
      Aleo.Program.getCreditsProgram(NETWORK).toString(),
      'transfer_public',
      [address, '10_000_000_000u64'],
      2 // TODO: set the correct fee
    );
    if (address === TEST_USER0_ADDRESS) {
      await depositAsSigner(BigInt(1_000_000_000), TEST_USER0_PRIVATE_KEY);
    }
  } else {
    console.log(`Test account ${address} already funded, balance: ${balance}`);
  }
};

export const fundTestAccountsIfNecessary = async () => {
  if (TEST_USER0_PRIVATE_KEY) {
    await fundTestAccountIfNecessary(TEST_USER0_ADDRESS);
  }
  if (TEST_USER1_PRIVATE_KEY) {
    await fundTestAccountIfNecessary(TEST_USER1_ADDRESS);
  }
  if (TEST_USER2_PRIVATE_KEY) {
    await fundTestAccountIfNecessary(TEST_USER2_ADDRESS);
  }
};

export const runTests = async () => {
  if (TEST_USER0_PRIVATE_KEY) {
    const tokenOwnerString = `{ account: ${TEST_USER0_ADDRESS}, token_id: ${PALEO_TOKEN_ID} }`;
    const tokenOwnerHash = Aleo.Plaintext.fromString(
      NETWORK,
      tokenOwnerString
    ).hashBhp256();
    const paleoBalance = await getMappingValue(
      tokenOwnerHash,
      MTSP_PROGRAM!,
      'authorized_balances'
    );
    const paleoBalanceValue = paleoBalance
      ? JSON.parse(formatAleoString(paleoBalance))['balance'].slice(0, -4)
      : '0';
    if (paleoBalanceValue === '0') {
      console.log(
        'Test account 0 does not have any pALEO, depositing 1,000 credits'
      );
      await depositAsSigner(BigInt(1_000_000_000), TEST_USER0_PRIVATE_KEY);
    } else {
      console.log(
        `Test account 0 already has pALEO, balance: ${paleoBalanceValue}`
      );
    }
  }
};

// const protocolState = await getMappingValue(
//   '0u8',
//   CORE_PROTOCOL_PROGRAM,
//   'protocol_state'
// );
