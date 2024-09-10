import { getMappingValue, isTransactionAccepted } from "../aleo/client";
import { resolveImports } from '../aleo/deploy';
import { submitTransaction } from "../aleo/execute";
import { pondoDependencyTree } from "../compiledPrograms";
import { BOOST_AMOUNT, NETWORK, PONDO_ORACLE_PROGRAM, PONDO_ORACLE_PROGRAM_CODE, PRIVATE_KEY } from "../constants";
import { formatAleoString } from "../util";


const hasValidatorBoostedInEpoch = async (address: string, epoch: bigint): Promise<boolean> => {
  const validatorBoostMappingValue = await getMappingValue(address, PONDO_ORACLE_PROGRAM, 'validator_boosting');
  console.log(`Validator boost mapping value: ${validatorBoostMappingValue}`);
  if (!validatorBoostMappingValue) {
    return false;
  }
  const validatorBoost = JSON.parse(formatAleoString(validatorBoostMappingValue));
  const boostEpoch = BigInt(validatorBoost.epoch.slice(0, -3));
  console.log(`Validator: ${address} has boosted in epoch: ${boostEpoch} by ${validatorBoost.boost_amount}`);

  if (epoch < boostEpoch) {
    return false;
  }

  return true;
}

export const boostValidator = async (validatorAddress: string, epoch: bigint): Promise<void> => {
  const hasValidatorBoosted = await hasValidatorBoostedInEpoch(validatorAddress, epoch);
  if (hasValidatorBoosted) {
    console.log(`Validator: ${validatorAddress} already boosted in this epoch`);
    return;
  }

  console.log(`Boosting validator: ${validatorAddress} in epoch: ${epoch} by ${BOOST_AMOUNT}`);
  // Submit the boost transaction
  let imports = pondoDependencyTree[PONDO_ORACLE_PROGRAM!];
  let resolvedImports = await resolveImports(imports);

  const txResult = await submitTransaction(
    NETWORK!,
    PRIVATE_KEY!,
    PONDO_ORACLE_PROGRAM_CODE,
    'boost_validator',
    [
      validatorAddress,
      `${BOOST_AMOUNT}u64`,
    ],
    0.085602,
    undefined,
    resolvedImports
  );

  const transactionAccepted = await isTransactionAccepted(txResult);
  console.log(`Boost transaction accepted: ${transactionAccepted}`);
}