import { distributeDeposits } from '../protocol/validatorActions';

async function main() {
  await distributeDeposits();
}

main();
