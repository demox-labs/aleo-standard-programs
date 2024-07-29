import { PrivateKey } from '@demox-labs/aleo-sdk';
import { delegateTransaction } from '../aleo/index.js';
import { FUNCTIONS } from '../config/index.js';
import { PROGRAMS } from '../config/index.js';
import { initializeMappings, initializeContracts } from '../aleo/simulator.js';
import { pondoProgramResolver, pondoDependencyResolver } from '../aleo/pondo.js';
export async function depositPublic(rpcProvider, privateKeyString, depositCredits, referrer, network = "TestnetV0") {
    const privateKey = PrivateKey.from_string(network, privateKeyString);
    const address = privateKey.to_address().to_string();
    const inputs = await getDepositPublicInputs(rpcProvider, address, depositCredits, referrer);
    const transactionUUID = await delegateTransaction(rpcProvider, {
        privateKey,
        ...FUNCTIONS.depositPublicAsSigner,
        inputs,
        feeCredits: 10,
    }, pondoProgramResolver, pondoDependencyResolver);
    return {
        transactionUUID,
        mintedPaleo: BigInt(inputs[1].slice(0, -3))
    };
}
async function getDepositPublicInputs(rpcProvider, aleoAddress, depositCredits, referrer) {
    const depositMicrocredits = depositCredits * 1_000_000;
    let contracts = await initializeContracts();
    await initializeMappings(rpcProvider, depositPublicPresetMappingKeys(contracts, aleoAddress));
    contracts.coreProtocolInstance.signer = aleoAddress;
    contracts.coreProtocolInstance.deposit_public_as_signer(BigInt(depositMicrocredits), BigInt("1"), '');
    const paleoForDeposit = contracts.coreProtocolInstance.computed_paleo_for_deposit;
    const depositMicrocreditsU64 = `${depositMicrocredits}u64`;
    const paleoForDepositU64 = `${paleoForDeposit}u64`;
    return [
        depositMicrocreditsU64,
        paleoForDepositU64,
        referrer
    ];
}
const depositPublicPresetMappingKeys = (contracts, signer) => ([
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
    [PROGRAMS.coreProtocol.id, "protocol_state", `${contracts.coreProtocolInstance.PROTOCOL_STATE_KEY}u8`],
    [PROGRAMS.coreProtocol.id, "owed_commission", '0u8'],
    [PROGRAMS.mtsp.id, "registered_tokens", contracts.MTSPInstance.CREDITS_RESERVED_TOKEN_ID],
    [PROGRAMS.mtsp.id, "registered_tokens", contracts.PNDOInstance.PONDO_TOKEN_ID],
    [PROGRAMS.mtsp.id, "registered_tokens", contracts.PNDOInstance.PALEO_TOKEN_ID],
]);
