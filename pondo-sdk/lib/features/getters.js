import { initializeContracts } from '../aleo/simulator.js';
import { hashNonNestedStruct, snarkVMToJs } from '../aleo/snarkvm.js';
import { PROGRAMS } from '../config/index.js';


export async function getPaleoBalance(rpcProvider, addressString) {
  let contracts = await initializeContracts();
  const pondoTokenOwner = `{account: ${addressString}, token_id: ${contracts.PNDOInstance.PALEO_TOKEN_ID}}`;
  const pondoTokenOwnerHash = await hashNonNestedStruct(pondoTokenOwner);
  console.log(pondoTokenOwnerHash);
  const balanceObj = await rpcProvider.getMappingValue(
    PROGRAMS.mtsp.id, "balances", pondoTokenOwnerHash
  );
  if (balanceObj == null) {
    return null
  }
  const { balance } = snarkVMToJs(balanceObj);
  return { balance };
}
