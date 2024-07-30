import { distributeDeposits } from '../../protocol/validatorActions';
import {
  depositAsSigner,
  depositViaAllowance,
  batchedWithdraw,
  instantWithdraw,
} from '../../protocol/userActions';
import { TEST_USER0_PRIVATE_KEY } from '../../constants';

const [script, amount, privateKey] = process.argv.slice(2);

enum SCRIPT_TYPES {
  instant_withdraw_public = 'instant_withdraw_public',
  withdraw_public = 'withdraw_public',
  deposit_public = 'deposit_public',
  deposit_public_as_signer = 'deposit_public_as_signer',
  distribute_deposits = 'distribute_deposits',
}

async function main(script: SCRIPT_TYPES, amount: string, privateKey: string) {
  switch (script) {
    case SCRIPT_TYPES.instant_withdraw_public:
      await instantWithdrawal(amount, privateKey);
    case SCRIPT_TYPES.withdraw_public:
      await callBatchedWithdraw(amount, privateKey);
    case SCRIPT_TYPES.deposit_public:
      await callDepositPublic(amount, privateKey);
    case SCRIPT_TYPES.distribute_deposits:
      await distributeDeposits();
  }
}

async function instantWithdrawal(amount: string, privateKey: string) {
  await instantWithdraw(
    BigInt(amount || 1000),
    privateKey || TEST_USER0_PRIVATE_KEY
  );
}

export const callBatchedWithdraw = async (
  amount: string,
  privateKey: string
) => {
  await batchedWithdraw(
    BigInt(amount || 1000),
    privateKey || TEST_USER0_PRIVATE_KEY
  );
};

export const callDepositPublic = async (amount: string, privateKey: string) => {
  await depositViaAllowance(
    BigInt(amount || 1_000_000_000),
    privateKey || TEST_USER0_PRIVATE_KEY
  );
};

main(SCRIPT_TYPES[script], amount, privateKey);
