import '../utils/fetch.js';
import {
  depositPublic,
  instantWithdrawPublic,
  withdrawPublic,
  LiveRpcProvider,
  TestRpcProvider,
  getWithdralCredits
} from './index.js';

import { PROGRAMS } from '../config/index.js';


/* Usage Example 
const RPC_URL = 'https://testnetbeta.aleorpc.com';
const rpcProvider = await LiveRpcProvider.from_url(RPC_URL);

await depositPublic(
  rpcProvider,
  "APrivateKey1zkpBz6J75Ndv4MwcFb6pccC1teFfMTb6BNNMwLkssp1xcH7",
  10000000000000,
  "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
);
*/

async function testDepositPublic() {
  const mappingValues = [
    [PROGRAMS.credits.id, "account", "aleo1q6atlm8t7x67kc98lz97fcp0n2pml2vz5wyttpsryuh32u4wwg9qvfzyt4", "1000000000000000000000u64"],
    [PROGRAMS.mtsp.id, "registered_tokens", "3443843282313283355522573239085696902919850365217539366784739393210722344986field", "{token_id: 3443843282313283355522573239085696902919850365217539366784739393210722344986field, name: 1095517519u128, symbol: 1095517519u128, decimals: 6u8, supply: 1500000000000000u128, max_supply: 1500000000000000u128, admin: aleo129xmhqrxf63e774q7pq2k4ulcleped8hcdkxz7phuky97q9w4cxqqjmcln, external_authorization_required: false, external_authorization_party: aleo129xmhqrxf63e774q7pq2k4ulcleped8hcdkxz7phuky97q9w4cxqqjmcln}"],
    [PROGRAMS.mtsp.id, "registered_tokens", "1751493913335802797273486270793650302076377624243810059080883537084141842601field", "{token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842601field, name: 97240284627655645872219502u128, symbol: 1347306575u128, decimals: 6u8, supply: 0u128, max_supply: 1000000000000000u128, admin: aleo1z7m9qvmpkdwpwe465j5hae7mgcfcp36mnguf7qe2r8qnjnch6crqt34tsk, external_authorization_required: false, external_authorization_party: aleo1z7m9qvmpkdwpwe465j5hae7mgcfcp36mnguf7qe2r8qnjnch6crqt34tsk}"],
    [PROGRAMS.mtsp.id, "registered_tokens", "1751493913335802797273486270793650302076377624243810059080883537084141842600field", "{token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842600field, name: 1631421259099656974472467909989204u128, symbol: 482131854671u128, decimals: 6u8, supply: 0u128, max_supply: 1000000000000000u128, admin: aleo19pk6q22kk5vdwpkuh3ag8lmrvallu5kqpsm0t4f3ul6je3ec0gyqkvnycl, external_authorization_required: false, external_authorization_party: aleo19pk6q22kk5vdwpkuh3ag8lmrvallu5kqpsm0t4f3ul6je3ec0gyqkvnycl}"],
    [PROGRAMS.coreProtocol.id, "balances", "0u8", "100000000000000u64"],
    [PROGRAMS.coreProtocol.id, "balances", "1u8", "100000000u64"],
    [PROGRAMS.coreProtocol.id, "balances", "2u8", "10000000u64"],
    [PROGRAMS.coreProtocol.id, "owed_commission", "0u8", "1000000000u64"],
    [PROGRAMS.coreProtocol.id, "protocol_state", "0u8", "0u8"],
  ];
  const rpcProvider = new TestRpcProvider(mappingValues);

  console.log(
    await depositPublic(
      rpcProvider,
      "APrivateKey1zkpBz6J75Ndv4MwcFb6pccC1teFfMTb6BNNMwLkssp1xcH7",
      10000000000000,
      "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
    )
  );
}

async function testInstantWithdrawPublic() {
  const mappingValues = [
    [PROGRAMS.credits.id, "account", "aleo1q6atlm8t7x67kc98lz97fcp0n2pml2vz5wyttpsryuh32u4wwg9qvfzyt4", "1000000000000000000000000000000u64"],
    [PROGRAMS.mtsp.id, "registered_tokens", "3443843282313283355522573239085696902919850365217539366784739393210722344986field", "{token_id: 3443843282313283355522573239085696902919850365217539366784739393210722344986field, name: 1095517519u128, symbol: 1095517519u128, decimals: 6u8, supply: 1500000000000000u128, max_supply: 1500000000000000u128, admin: aleo129xmhqrxf63e774q7pq2k4ulcleped8hcdkxz7phuky97q9w4cxqqjmcln, external_authorization_required: false, external_authorization_party: aleo129xmhqrxf63e774q7pq2k4ulcleped8hcdkxz7phuky97q9w4cxqqjmcln}"],
    [PROGRAMS.mtsp.id, "registered_tokens", "1751493913335802797273486270793650302076377624243810059080883537084141842601field", "{token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842601field, name: 97240284627655645872219502u128, symbol: 1347306575u128, decimals: 6u8, supply: 0u128, max_supply: 1000000000000000u128, admin: aleo1z7m9qvmpkdwpwe465j5hae7mgcfcp36mnguf7qe2r8qnjnch6crqt34tsk, external_authorization_required: false, external_authorization_party: aleo1z7m9qvmpkdwpwe465j5hae7mgcfcp36mnguf7qe2r8qnjnch6crqt34tsk}"],
    [PROGRAMS.mtsp.id, "registered_tokens", "1751493913335802797273486270793650302076377624243810059080883537084141842600field", "{token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842600field, name: 1631421259099656974472467909989204u128, symbol: 482131854671u128, decimals: 6u8, supply: 0u128, max_supply: 1000000000000000u128, admin: aleo19pk6q22kk5vdwpkuh3ag8lmrvallu5kqpsm0t4f3ul6je3ec0gyqkvnycl, external_authorization_required: false, external_authorization_party: aleo19pk6q22kk5vdwpkuh3ag8lmrvallu5kqpsm0t4f3ul6je3ec0gyqkvnycl}"],
    [PROGRAMS.coreProtocol.id, "balances", "0u8", "100000000000000u64"],
    [PROGRAMS.coreProtocol.id, "balances", "1u8", "100000000u64"],
    [PROGRAMS.coreProtocol.id, "balances", "2u8", "10000000u64"],
    [PROGRAMS.coreProtocol.id, "owed_commission", "0u8", "1000000000u64"],
    [PROGRAMS.coreProtocol.id, "protocol_state", "0u8", "0u8"],
    [PROGRAMS.mtsp.id, "balances", "3356920822463525405405595062347335658714826303408421158682726508848612583633field", "{token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842600field, account: aleo1q6atlm8t7x67kc98lz97fcp0n2pml2vz5wyttpsryuh32u4wwg9qvfzyt4, balance: 100000000u128, authorized_until: 10000000000000u32}"],
    [PROGRAMS.credits.id, "account", PROGRAMS.coreProtocol.address, "1000000000000000000000000000000u64"],
  ];
  const rpcProvider = new TestRpcProvider(mappingValues);
  console.log(
    await instantWithdrawPublic(
      rpcProvider,
      "APrivateKey1zkpBz6J75Ndv4MwcFb6pccC1teFfMTb6BNNMwLkssp1xcH7",
      100000000,
    )
  );
}


async function testWithdrawPublic() {
  const mappingValues = [
    [PROGRAMS.credits.id, "account", "aleo1q6atlm8t7x67kc98lz97fcp0n2pml2vz5wyttpsryuh32u4wwg9qvfzyt4", "1000000000000000000000000000000u64"],
    [PROGRAMS.mtsp.id, "registered_tokens", "3443843282313283355522573239085696902919850365217539366784739393210722344986field", "{token_id: 3443843282313283355522573239085696902919850365217539366784739393210722344986field, name: 1095517519u128, symbol: 1095517519u128, decimals: 6u8, supply: 1500000000000000u128, max_supply: 1500000000000000u128, admin: aleo129xmhqrxf63e774q7pq2k4ulcleped8hcdkxz7phuky97q9w4cxqqjmcln, external_authorization_required: false, external_authorization_party: aleo129xmhqrxf63e774q7pq2k4ulcleped8hcdkxz7phuky97q9w4cxqqjmcln}"],
    [PROGRAMS.mtsp.id, "registered_tokens", "1751493913335802797273486270793650302076377624243810059080883537084141842601field", "{token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842601field, name: 97240284627655645872219502u128, symbol: 1347306575u128, decimals: 6u8, supply: 0u128, max_supply: 1000000000000000u128, admin: aleo1z7m9qvmpkdwpwe465j5hae7mgcfcp36mnguf7qe2r8qnjnch6crqt34tsk, external_authorization_required: false, external_authorization_party: aleo1z7m9qvmpkdwpwe465j5hae7mgcfcp36mnguf7qe2r8qnjnch6crqt34tsk}"],
    [PROGRAMS.mtsp.id, "registered_tokens", "1751493913335802797273486270793650302076377624243810059080883537084141842600field", "{token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842600field, name: 1631421259099656974472467909989204u128, symbol: 482131854671u128, decimals: 6u8, supply: 0u128, max_supply: 1000000000000000u128, admin: aleo19pk6q22kk5vdwpkuh3ag8lmrvallu5kqpsm0t4f3ul6je3ec0gyqkvnycl, external_authorization_required: false, external_authorization_party: aleo19pk6q22kk5vdwpkuh3ag8lmrvallu5kqpsm0t4f3ul6je3ec0gyqkvnycl}"],
    [PROGRAMS.coreProtocol.id, "balances", "0u8", "100000000000000u64"],
    [PROGRAMS.coreProtocol.id, "balances", "1u8", "100000000u64"],
    [PROGRAMS.coreProtocol.id, "balances", "2u8", "10000000u64"],
    [PROGRAMS.coreProtocol.id, "owed_commission", "0u8", "1000000000u64"],
    [PROGRAMS.coreProtocol.id, "protocol_state", "0u8", "0u8"],
    [PROGRAMS.mtsp.id, "balances", "3356920822463525405405595062347335658714826303408421158682726508848612583633field", "{token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842600field, account: aleo1q6atlm8t7x67kc98lz97fcp0n2pml2vz5wyttpsryuh32u4wwg9qvfzyt4, balance: 100000000u128, authorized_until: 10000000000000u32}"],
    [PROGRAMS.credits.id, "account", PROGRAMS.coreProtocol.address, "1000000000000000000000000000000u64"],
  ];
  const rpcProvider = new TestRpcProvider(mappingValues);
  console.log(
    await instantWithdrawPublic(
      rpcProvider,
      "APrivateKey1zkpBz6J75Ndv4MwcFb6pccC1teFfMTb6BNNMwLkssp1xcH7",
      100000000,
    )
  );
}


async function testGetWithdralCredits() {
  const mappingValues = [
    [PROGRAMS.credits.id, "account", "aleo1q6atlm8t7x67kc98lz97fcp0n2pml2vz5wyttpsryuh32u4wwg9qvfzyt4", "1000000000000000000000000000000u64"],
    [PROGRAMS.mtsp.id, "registered_tokens", "3443843282313283355522573239085696902919850365217539366784739393210722344986field", "{token_id: 3443843282313283355522573239085696902919850365217539366784739393210722344986field, name: 1095517519u128, symbol: 1095517519u128, decimals: 6u8, supply: 1500000000000000u128, max_supply: 1500000000000000u128, admin: aleo129xmhqrxf63e774q7pq2k4ulcleped8hcdkxz7phuky97q9w4cxqqjmcln, external_authorization_required: false, external_authorization_party: aleo129xmhqrxf63e774q7pq2k4ulcleped8hcdkxz7phuky97q9w4cxqqjmcln}"],
    [PROGRAMS.mtsp.id, "registered_tokens", "1751493913335802797273486270793650302076377624243810059080883537084141842601field", "{token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842601field, name: 97240284627655645872219502u128, symbol: 1347306575u128, decimals: 6u8, supply: 0u128, max_supply: 1000000000000000u128, admin: aleo1z7m9qvmpkdwpwe465j5hae7mgcfcp36mnguf7qe2r8qnjnch6crqt34tsk, external_authorization_required: false, external_authorization_party: aleo1z7m9qvmpkdwpwe465j5hae7mgcfcp36mnguf7qe2r8qnjnch6crqt34tsk}"],
    [PROGRAMS.mtsp.id, "registered_tokens", "1751493913335802797273486270793650302076377624243810059080883537084141842600field", "{token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842600field, name: 1631421259099656974472467909989204u128, symbol: 482131854671u128, decimals: 6u8, supply: 0u128, max_supply: 1000000000000000u128, admin: aleo19pk6q22kk5vdwpkuh3ag8lmrvallu5kqpsm0t4f3ul6je3ec0gyqkvnycl, external_authorization_required: false, external_authorization_party: aleo19pk6q22kk5vdwpkuh3ag8lmrvallu5kqpsm0t4f3ul6je3ec0gyqkvnycl}"],
    [PROGRAMS.coreProtocol.id, "balances", "0u8", "100000000000000u64"],
    [PROGRAMS.coreProtocol.id, "balances", "1u8", "100000000u64"],
    [PROGRAMS.coreProtocol.id, "balances", "2u8", "10000000u64"],
    [PROGRAMS.coreProtocol.id, "owed_commission", "0u8", "1000000000u64"],
    [PROGRAMS.coreProtocol.id, "protocol_state", "0u8", "0u8"],
    [PROGRAMS.mtsp.id, "balances", "3356920822463525405405595062347335658714826303408421158682726508848612583633field", "{token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842600field, account: aleo1q6atlm8t7x67kc98lz97fcp0n2pml2vz5wyttpsryuh32u4wwg9qvfzyt4, balance: 100000000u128, authorized_until: 10000000000000u32}"],
    [PROGRAMS.credits.id, "account", PROGRAMS.coreProtocol.address, "1000000000000000000000000000000u64"],
  ];
  const rpcProvider = new TestRpcProvider(mappingValues);
  console.log(
    await getWithdralCredits(
      rpcProvider,
      "aleo1q6atlm8t7x67kc98lz97fcp0n2pml2vz5wyttpsryuh32u4wwg9qvfzyt4",
      100000000,
    )
  );
}

// await testDepositPublic();
// await testInstantWithdrawPublic();
// await testWithdrawPublic();
await testGetWithdralCredits();