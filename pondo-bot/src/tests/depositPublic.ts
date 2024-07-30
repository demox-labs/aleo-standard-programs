import { TEST_USER0_PRIVATE_KEY } from '../constants';
import { depositViaAllowance } from '../protocol/userActions';

const [amount, privateKey] = process.argv.slice(2);

async function depositPublic(amount: string, privateKey: string) {
  await depositViaAllowance(
    BigInt(amount || 1_000_000_000),
    privateKey || TEST_USER0_PRIVATE_KEY
  );
}

depositPublic(amount, privateKey);
