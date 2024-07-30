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


export async function getCurrentValidators(rpcProvider, addressString) {
  let contracts = await initializeContracts();
  const stakePortions = [
    contracts.coreProtocolInstance.PORTION_1,
    contracts.coreProtocolInstance.PORTION_2,
    contracts.coreProtocolInstance.PORTION_3,
    contracts.coreProtocolInstance.PORTION_4,
    contracts.coreProtocolInstance.PORTION_5,
  ];
  const delegatorPrograms = [
    PROGRAMS.delegator1,
    PROGRAMS.delegator2,
    PROGRAMS.delegator3,
    PROGRAMS.delegator4,
    PROGRAMS.delegator5,
  ];
  const validatorStates = await Promise.all(
    delegatorPrograms.map(
      (program) => rpcProvider.getMappingValue(
        program.id, "validator_mapping", "0u8"
      )
    )
  );
  const validators = validatorStates.map(
    (validatorState, index) => {
      const state = snarkVMToJs(validatorState);
      return {
        address: state.validator,
        commission: Number(state.commission.toString()) / 10_000,
        poolPortion: Number(stakePortions[index].toString()) / 10_000
      }
    }
  );
  return { validators };
}