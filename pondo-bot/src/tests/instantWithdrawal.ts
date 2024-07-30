import { TEST_USER0_PRIVATE_KEY } from '../constants';

import { instantWithdraw } from '../protocol/userActions';

const [amount, privateKey] = process.argv.slice(2);

async function instantWithdrawal(amount: string, privateKey: string) {
  await instantWithdraw(
    BigInt(amount || 1000),
    privateKey || TEST_USER0_PRIVATE_KEY
  );
}

instantWithdrawal(amount, privateKey);
