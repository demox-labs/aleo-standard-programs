import { PrivateKey } from '@demox-labs/aleo-sdk';
import { delegateTransaction } from '../aleo/index.js';
import { initializeMappings, initializeContracts } from '../aleo/simulator.js';
import { pondoProgramResolver, pondoDependencyResolver } from '../aleo/pondo.js';
import { hashNonNestedStruct, snarkVMToJs } from '../aleo/snarkvm.js';
import { FUNCTIONS } from '../config/index.js';
import { PROGRAMS } from '../config/index.js';
export async function instantWithdrawPublic(rpcProvider, privateKeyString, paleoBurnAmount, network = "TestnetV0") {
    const privateKey = PrivateKey.from_string(network, privateKeyString);
    const address = privateKey.to_address().to_string();
    const inputs = await getInstantWithdrawPublicInputs(rpcProvider, address, paleoBurnAmount);
    const transactionUUID = await delegateTransaction(rpcProvider, {
        privateKey,
        ...FUNCTIONS.instantWithdrawPublic,
        inputs,
        feeCredits: FUNCTIONS.instantWithdrawPublic.feeCredits,
    }, pondoProgramResolver, pondoDependencyResolver);
    return {
        transactionUUID,
        withdralCredits: Number(inputs[1].slice(0, -3)) / 1_000_000
    };
}
async function getInstantWithdrawPublicInputs(rpcProvider, aleoAddress, paleoBurnAmount) {
    let contracts = await initializeContracts();
    const pondoTokenOwner = `{account: ${aleoAddress}, token_id: ${contracts.PNDOInstance.PALEO_TOKEN_ID}}`;
    const pondoTokenOwnerJson = JSON.stringify({ account: aleoAddress, token_id: contracts.PNDOInstance.PALEO_TOKEN_ID });
    const pondoTokenOwnerHash = await hashNonNestedStruct(pondoTokenOwner);
    let prevWithdrawalMicrocredits = null;
    let withdrawalMicrocredits = BigInt("1");
    // get withdrawal microcredits until converges
    while (prevWithdrawalMicrocredits !== withdrawalMicrocredits) {
        prevWithdrawalMicrocredits = withdrawalMicrocredits;
        withdrawalMicrocredits = await getInstantWithdrawalMicocredits(rpcProvider, aleoAddress, paleoBurnAmount, withdrawalMicrocredits, pondoTokenOwnerJson, pondoTokenOwnerHash);
    }
    const paleoBurnAmountU64 = `${paleoBurnAmount}u64`;
    const withdrawalMicoreditsU64 = `${withdrawalMicrocredits}u64`;
    return [
        paleoBurnAmountU64,
        withdrawalMicoreditsU64
    ];
}
async function getInstantWithdrawalMicocredits(rpcProvider, aleoAddress, paleoBurnAmount, formerWithdrawalMicrocredits, pondoTokenOwnerJson, pondoTokenOwnerHash) {
    let contracts = await initializeContracts();
    await initializeMappings(rpcProvider, instantWithdrawPublicPresetMappingKeys(contracts, aleoAddress, pondoTokenOwnerHash), { [pondoTokenOwnerHash]: pondoTokenOwnerJson });
    contracts.coreProtocolInstance.signer = aleoAddress;
    contracts.coreProtocolInstance.caller = aleoAddress;
    contracts.coreProtocolInstance.instant_withdraw_public(BigInt(paleoBurnAmount), formerWithdrawalMicrocredits);
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
export async function withdrawPublic(rpcProvider, privateKeyString, paleoBurnAmount, network = "TestnetV0") {
    const privateKey = PrivateKey.from_string(network, privateKeyString);
    const address = privateKey.to_address().to_string();
    const inputs = await getWithdrawPublicInputs(paleoBurnAmount);
    const withdralCredits = await getWithdralCredits(rpcProvider, address, paleoBurnAmount);
    const transactionUUID = await delegateTransaction(rpcProvider, {
        privateKey,
        ...FUNCTIONS.withdrawPublic,
        inputs,
        feeCredits: FUNCTIONS.withdrawPublic.feeCredits,
    }, pondoProgramResolver, pondoDependencyResolver);
    return {
        transactionUUID,
        withdralCredits
    };
}
async function getWithdrawPublicInputs(paleoBurnAmount) {
    const paleoBurnAmountU64 = `${paleoBurnAmount}u64`;
    return [paleoBurnAmountU64];
}
export async function getWithdralCredits(rpcProvider, aleoAddress, paleoBurnAmount) {
    let contracts = await initializeContracts();
    const pondoTokenOwner = `{account: ${aleoAddress}, token_id: ${contracts.PNDOInstance.PALEO_TOKEN_ID}}`;
    const pondoTokenOwnerJson = JSON.stringify({ account: aleoAddress, token_id: contracts.PNDOInstance.PALEO_TOKEN_ID });
    const pondoTokenOwnerHash = await hashNonNestedStruct(pondoTokenOwner);
    await initializeMappings(rpcProvider, instantWithdrawPublicPresetMappingKeys(contracts, aleoAddress, pondoTokenOwnerHash), { [pondoTokenOwnerHash]: pondoTokenOwnerJson });
    contracts.coreProtocolInstance.signer = aleoAddress;
    contracts.coreProtocolInstance.caller = aleoAddress;
    contracts.coreProtocolInstance.withdraw_public(BigInt(paleoBurnAmount));
    return Number(contracts.coreProtocolInstance.computed_credits_withdrawal.toString()) / 1_000_000;
}
export async function claimWithdrawalPublic(rpcProvider, privateKeyString, destination, creditsWithdrawal, network = "TestnetV0") {
    const microcreditsWithdrawal = creditsWithdrawal * 1_000_000;
    const privateKey = PrivateKey.from_string(network, privateKeyString);
    const address = privateKey.to_address().to_string();
    const inputs = await getClaimWithdrawalPublicInputs(destination, microcreditsWithdrawal);
    await checkClaimWithdrawalPublicSucceeds(rpcProvider, address, destination, microcreditsWithdrawal);
    const transactionUUID = await delegateTransaction(rpcProvider, {
        privateKey,
        ...FUNCTIONS.claimWithdrawalPublic,
        inputs,
        feeCredits: FUNCTIONS.claimWithdrawalPublic.feeCredits,
    }, pondoProgramResolver, pondoDependencyResolver);
    return { transactionUUID };
}
async function getClaimWithdrawalPublicInputs(destination, microcreditsWithdrawal) {
    const microcreditsWithdrawalU64 = `${microcreditsWithdrawal}u64`;
    return [destination, microcreditsWithdrawalU64];
}
export async function checkClaimWithdrawalPublicSucceeds(rpcProvider, aleoAddress, destination, microcreditsWithdrawal) {
    let contracts = await initializeContracts();
    contracts.coreProtocolInstance.block.height = BigInt(await rpcProvider.latest_height());
    await initializeMappings(rpcProvider, claimWithdrawalPublicPresetMappingKeys(contracts, destination));
    contracts.coreProtocolInstance.signer = aleoAddress;
    contracts.coreProtocolInstance.caller = aleoAddress;
    contracts.coreProtocolInstance.claim_withdrawal_public(destination, BigInt(microcreditsWithdrawal));
    return contracts.coreProtocolInstance.computed_credits_withdrawal;
}
function claimWithdrawalPublicPresetMappingKeys(contracts, destination) {
    return [
        [PROGRAMS.coreProtocol.id, "balances", `${contracts.coreProtocolInstance.CLAIMABLE_WITHDRAWALS}u8`],
        [PROGRAMS.credits.id, "account", PROGRAMS.coreProtocol.address],
        [PROGRAMS.coreProtocol.id, "withdrawals", destination],
    ];
}
export async function getClaimableWithdrawal(rpcProvider, addressString) {
    const withdrawal = await rpcProvider.getMappingValue(PROGRAMS.coreProtocol.id, "withdrawals", addressString);
    if (withdrawal == null) {
        return null;
    }
    const { microcredits, claim_block } = snarkVMToJs(withdrawal);
    const availableAtBlock = Number(claim_block.toString());
    const amountCredits = Number(microcredits.toString()) / 1_000_000;
    return { amountCredits, availableAtBlock };
}
