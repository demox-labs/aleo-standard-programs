import { PrivateKey } from '@demox-labs/aleo-sdk';

import { delegateTransaction } from '../aleo/index.js';
import { FUNCTIONS } from '../config/index.js';
import { PROGRAMS } from '../config/index.js';

import { initializeMappings, initializeContracts } from '../aleo/simulator.js';

import { pondoProgramResolver, pondoDependencyResolver } from '../aleo/pondo.js';

import { hashNonNestedStruct } from '../aleo/snarkvm.js';


export async function instantWithdrawPublic(
  rpcProvider,
  privateKeyString,
  paleoBurnAmount,
  network = "TestnetV0"
) {
  const privateKey = PrivateKey.from_string(network, privateKeyString);
  const address = privateKey.to_address().to_string();
  const inputs = await getInstantWithdrawPublicInputs(
    rpcProvider, address, paleoBurnAmount,
  );
  const transactionUUID = await delegateTransaction(
    rpcProvider,
    {
      privateKey,
      ...FUNCTIONS.instantWithdrawPublic,
      inputs,
      feeCredits: FUNCTIONS.instantWithdrawPublic.feeCredits,
    },
    pondoProgramResolver,
    pondoDependencyResolver
  );
  return {
    transactionUUID,
    withdralCredits: BigInt(inputs[1].slice(0, -3))
  };
}


async function getInstantWithdrawPublicInputs(
  rpcProvider, aleoAddress, paleoBurnAmount,
) {
  let contracts = await initializeContracts();
  const pondoTokenOwner = `{account: ${aleoAddress}, token_id: ${contracts.PNDOInstance.PALEO_TOKEN_ID}}`;
  const pondoTokenOwnerJson = JSON.stringify({ account: aleoAddress, token_id: contracts.PNDOInstance.PALEO_TOKEN_ID })
  const pondoTokenOwnerHash = await hashNonNestedStruct(pondoTokenOwner);

  let prevWithdrawalCredits = null;
  let withdrawalCredits = BigInt("1");

  // get withdrawal credits until converges 
  while (prevWithdrawalCredits !== withdrawalCredits) {
    prevWithdrawalCredits = withdrawalCredits
    withdrawalCredits = await getInstantWithdrawalCredits(
      rpcProvider, aleoAddress, paleoBurnAmount, withdrawalCredits, pondoTokenOwnerJson, pondoTokenOwnerHash
    )
  }

  const paleoBurnAmountU64 = `${paleoBurnAmount}u64`;
  const withdrawalCreditsU64 = `${withdrawalCredits}u64`;

  return [
    paleoBurnAmountU64,
    withdrawalCreditsU64
  ];
}


async function getInstantWithdrawalCredits(
  rpcProvider, aleoAddress, paleoBurnAmount, formerWithdrawalCredits, pondoTokenOwnerJson, pondoTokenOwnerHash,
) {
  let contracts = await initializeContracts();
  await initializeMappings(
    rpcProvider,
    instantWithdrawPublicPresetMappingKeys(contracts, aleoAddress, pondoTokenOwnerHash),
    { [pondoTokenOwnerHash]: pondoTokenOwnerJson }
  );
  contracts.coreProtocolInstance.signer = aleoAddress;
  contracts.coreProtocolInstance.caller = aleoAddress;
  contracts.coreProtocolInstance.instant_withdraw_public(
    BigInt(paleoBurnAmount),
    formerWithdrawalCredits,
    ''
  );
  return contracts.coreProtocolInstance.computed_credits_withdrawal;
}


function instantWithdrawPublicPresetMappingKeys(contracts, signer, tokenOwnerHash) {
  return [
    [PROGRAMS.coreProtocol.id, "protocol_state", `${contracts.coreProtocolInstance.PROTOCOL_STATE_KEY}u8`],
    [PROGRAMS.credits.id, "bonded", PROGRAMS.delegator1.address],
    [PROGRAMS.credits.id, "bonded", PROGRAMS.delegator2.address],
    [PROGRAMS.credits.id, "bonded", PROGRAMS.delegator3.address],
    [PROGRAMS.credits.id, "bonded", PROGRAMS.delegator4.address],
    [PROGRAMS.credits.id, "bonded", PROGRAMS.delegator5.address],
    [PROGRAMS.credits.id, "unbonding", PROGRAMS.delegator1.address],
    [PROGRAMS.credits.id, "unbonding", PROGRAMS.delegator2.address],
    [PROGRAMS.credits.id, "unbonding", PROGRAMS.delegator3.address],
    [PROGRAMS.credits.id, "unbonding", PROGRAMS.delegator4.address],
    [PROGRAMS.credits.id, "unbonding", PROGRAMS.delegator5.address],
    [PROGRAMS.credits.id, "account", PROGRAMS.delegator1.address],
    [PROGRAMS.credits.id, "account", PROGRAMS.delegator2.address],
    [PROGRAMS.credits.id, "account", PROGRAMS.delegator3.address],
    [PROGRAMS.credits.id, "account", PROGRAMS.delegator4.address],
    [PROGRAMS.credits.id, "account", PROGRAMS.delegator5.address],
    [PROGRAMS.credits.id, "account", signer],
    [PROGRAMS.coreProtocol.id, "balances", `${contracts.coreProtocolInstance.BONDED_WITHDRAWALS}u8`],
    [PROGRAMS.coreProtocol.id, "balances", `${contracts.coreProtocolInstance.DELEGATED_BALANCE}u8`],
    [PROGRAMS.coreProtocol.id, "balances", `${contracts.coreProtocolInstance.CLAIMABLE_WITHDRAWALS}u8`],
    [PROGRAMS.coreProtocol.id, "owed_commission", '0u8'],
    [PROGRAMS.mtsp.id, "registered_tokens", contracts.MTSPInstance.CREDITS_RESERVED_TOKEN_ID],
    [PROGRAMS.mtsp.id, "registered_tokens", contracts.PNDOInstance.PONDO_TOKEN_ID],
    [PROGRAMS.mtsp.id, "registered_tokens", contracts.PNDOInstance.PALEO_TOKEN_ID],
    [PROGRAMS.credits.id, "account", PROGRAMS.coreProtocol.address],
    [PROGRAMS.mtsp.id, "balances", tokenOwnerHash],
  ];
}



export async function withdrawPublic(
  rpcProvider,
  privateKeyString,
  paleoBurnAmount,
  network = "TestnetV0"
) {
  const privateKey = PrivateKey.from_string(network, privateKeyString);
  const address = privateKey.to_address().to_string();
  const inputs = await getWithdrawPublicInputs(paleoBurnAmount);
  const withdralCredits = await getWithdralCredits(
    rpcProvider, address, paleoBurnAmount
  );
  const transactionUUID = await delegateTransaction(
    rpcProvider,
    {
      privateKey,
      ...FUNCTIONS.withdrawPublic,
      inputs,
      feeCredits: FUNCTIONS.withdrawPublic.feeCredits,
    },
    pondoProgramResolver,
    pondoDependencyResolver
  );
  return {
    transactionUUID,
    withdralCredits
  };
}


async function getWithdrawPublicInputs(paleoBurnAmount) {
  const paleoBurnAmountU64 = `${paleoBurnAmount}u64`;

  return [paleoBurnAmountU64,];
}


export async function getWithdralCredits(
  rpcProvider, aleoAddress, paleoBurnAmount,
) {
  let contracts = await initializeContracts();
  const pondoTokenOwner = `{account: ${aleoAddress}, token_id: ${contracts.PNDOInstance.PALEO_TOKEN_ID}}`;
  const pondoTokenOwnerJson = JSON.stringify({ account: aleoAddress, token_id: contracts.PNDOInstance.PALEO_TOKEN_ID })
  const pondoTokenOwnerHash = await hashNonNestedStruct(pondoTokenOwner);

  await initializeMappings(
    rpcProvider,
    instantWithdrawPublicPresetMappingKeys(contracts, aleoAddress, pondoTokenOwnerHash),
    { [pondoTokenOwnerHash]: pondoTokenOwnerJson }
  );
  contracts.coreProtocolInstance.signer = aleoAddress;
  contracts.coreProtocolInstance.caller = aleoAddress;
  contracts.coreProtocolInstance.withdraw_public(
    BigInt(paleoBurnAmount),
    ''
  );
  return contracts.coreProtocolInstance.computed_credits_withdrawal;
}


/*
export async function claimWithdrawalPublic(
  rpcProvider,
  privateKeyString,
  paleoBurnAmount,
  network = "TestnetV0"
) {
  const privateKey = PrivateKey.from_string(network, privateKeyString);
  const address = privateKey.to_address().to_string();
  const inputs = await getWithdrawPublicInputs(paleoBurnAmount);
  const withdralCredits = await getWithdralCredits(
    rpcProvider, address, paleoBurnAmount
  );
  const transactionUUID = await delegateTransaction(
    rpcProvider,
    {
      privateKey,
      ...FUNCTIONS.withdrawPublic,
      inputs,
      feeCredits: FUNCTIONS.withdrawPublic.feeCredits,
    },
    pondoProgramResolver,
    pondoDependencyResolver
  );
  return {
    transactionUUID,
    withdralCredits
  };
*/