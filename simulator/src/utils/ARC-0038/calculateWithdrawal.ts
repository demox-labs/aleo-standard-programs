const args = process.argv.slice(2);
const [balance, withdrawal_shares, current_shares, pendingDeposits] = args.map(x => BigInt(x.replace(/[,_]/g, '')));
const full_pool = balance + (pendingDeposits || BigInt(0));
const result = (withdrawal_shares * full_pool * BigInt(1000)) / (current_shares * BigInt(1000));
console.log(result.toLocaleString());