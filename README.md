<h1 align="center">
        <img alt="pondo" src="./media/pondo-logo.png" height="30" style="display: inline-block;  vertical-align: middle;">
        <span style="display: inline-block;  vertical-align: middle;">Pondo</span>
</h1>

<p align="center">
    <a href="https://docs.leo.app/"> <img alt="Website" src="https://img.shields.io/badge/docs-online-blue"></a>
    <a href="https://status.leo.app/"><img src="https://img.shields.io/badge/status-ℹ-green"/></a>
</p>

<p align="center">
    <b>Liquid Staking Protocol on Aleo</b>
</p>

## What is Pondo?

Pondo enables you to **earn rewards on your ALEO tokens while maintaining liquidity**. It rebalances delegation of your ALEO credits to the validators with the most yield on the network, to ensure **optimal performance without centralized control.**

## How to use Pondo?

Install Pondo Wasm SDK:

```bash
npm install @demox-labs/pondo-sdk
```

### Deposit

Here is an example of how you can delegate **100 ACs** for staking in Pondo:

```js
import { depositPublic, LiveRpcProvider } from '@demox-labs/pondo-sdk';

const RPC_URL = 'https://testnetbeta.aleorpc.com';

const rpcProvider = await LiveRpcProvider.from_url(RPC_URL);
const privateKeyString = "APrivateKey1zkpBz6J75Ndv4MwcFb6pccC1teFfMTb6BNNMwLkssp1xcH7";
const creditsAmount = 100; // ALEO Credits
const referrer = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc";

const { transactionUUID } = await depositPublic(
  rpcProvider,
  privateKeyString,
  creditsAmount,
  referrer
);
const { status } = await rpcProvider.getGeneratedTransaction(transactionUUID);

console.log(`Transaction '${transactionUUID}' submitted, current status: '${status}'.`);
```

As the outcome of the transaction, you will **mint a certain quantity of pALEO tokens**, that represent your **current share in the Pondo staked pool.** The more you wait, the more ALEO credits you can get from those same pALEO tokens you own. These Credits come from the rewards of your staked ALEO.

### Withdraw

To get your delegated credits back, along with associated reward, you must burn the pAleo tokens you own.

There are two possiblities for doing so:

- **Instant Withdraw** - Getting your credits back **instantly**, in one transaction, but paying a **0.25% fee**.
- **Two steps Withdraw** - Burn your pAleo tokens in a first transaction, then wait a minimum of **~2.5 Days** before you can claim associated credits back.

### Instant Withdraw

```js
import { instantWithdrawPublic, LiveRpcProvider } from '@demox-labs/pondo-sdk';

const RPC_URL = 'https://testnetbeta.aleorpc.com';

const rpcProvider = await LiveRpcProvider.from_url(RPC_URL);
const privateKeyString = "APrivateKey1zkpBz6J75Ndv4MwcFb6pccC1teFfMTb6BNNMwLkssp1xcH7";
const paleoBurnAmount = 10;

const { transactionUUID } = await instantWithdrawPublic(
  rpcProvider,
  privateKeyString,
  paleoBurnAmount,
);
const { status, withdralCredits } = await rpcProvider.getGeneratedTransaction(transactionUUID);

console.log(`Transaction '${transactionUUID}' submitted, current status: '${status}'.`);
console.log(`Credits withdrawn: '${withdralCredits}'.`);
```

### Two step withdraw

#### Initiate withdrawal

```js
import { withdrawPublic, LiveRpcProvider } from '@demox-labs/pondo-sdk';

const RPC_URL = 'https://testnetbeta.aleorpc.com';

const rpcProvider = await LiveRpcProvider.from_url(RPC_URL);
const privateKeyString = "APrivateKey1zkpBz6J75Ndv4MwcFb6pccC1teFfMTb6BNNMwLkssp1xcH7";
const paleoBurnAmount = 10;

const { transactionUUID, withdralCredits } = await withdrawPublic(
  rpcProvider,
  privateKeyString,
  paleoBurnAmount,
);
const { status } = await rpcProvider.getGeneratedTransaction(transactionUUID);

console.log(`Transaction '${transactionUUID}' submitted, current status: '${status}'.`);
console.log(`Credits to be withdrawn: '${withdralCredits}'.`);
```

#### Wait period

You must wait for 43,200 blocks (or 2.5 days, assuming 5 sec per block), before you can claim credits associated with the withdrawal.

**TODO:** Get time left SDK function.

#### Withdraw Credits

```js
import { claimWithdrawalPublic, LiveRpcProvider } from '@demox-labs/pondo-sdk';

const RPC_URL = 'https://testnetbeta.aleorpc.com';

const rpcProvider = await LiveRpcProvider.from_url(RPC_URL);
const privateKeyString = "APrivateKey1zkpBz6J75Ndv4MwcFb6pccC1teFfMTb6BNNMwLkssp1xcH7";
const paleoBurnAmount = 10;

const { transactionUUID, withdralCredits } = await claimWithdrawalPublic(
  rpcProvider,
  privateKeyString,
  paleoBurnAmount,
);
const { status } = await rpcProvider.getGeneratedTransaction(transactionUUID);

console.log(`Transaction '${transactionUUID}' submitted, current status: '${status}'.`);
console.log(`Credits to be withdrawn: '${withdralCredits}'.`);
```

### Get ALEO credits for pALEO burnt

Here is an example of how to get the amount of credits you could get for burning a specific amount of pAleo tokens you currently own.

```js
import { getWithdralCredits, LiveRpcProvider } from '@demox-labs/pondo-sdk';

const RPC_URL = 'https://testnetbeta.aleorpc.com';

const rpcProvider = await LiveRpcProvider.from_url(RPC_URL);
const addressString = "aleo1q6atlm8t7x67kc98lz97fcp0n2pml2vz5wyttpsryuh32u4wwg9qvfzyt4";
const paleoBurnAmount = 10;

const withdralCredits = await getWithdralCredits(
  rpcProvider,
  addressString,
  paleoBurnAmount,
);
console.log(`Credits to be withdrawn: '${withdralCredits}'.`);
```
