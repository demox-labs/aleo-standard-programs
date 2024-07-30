import { TEST_USER0_PRIVATE_KEY } from '../constants';

import { batchedWithdraw } from '../protocol/userActions';

const [amount, privateKey] = process.argv.slice(2);

async function batchedWithdrawal(amount: string, privateKey: string) {
  await batchedWithdraw(
    BigInt(amount || 1000),
    privateKey || TEST_USER0_PRIVATE_KEY
  );
}

batchedWithdrawal(amount, privateKey);
