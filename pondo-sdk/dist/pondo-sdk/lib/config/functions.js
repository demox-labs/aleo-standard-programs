import { PROGRAMS } from './programs.js';
export const FUNCTIONS = {
    depositPublicAsSigner: {
        programId: PROGRAMS.coreProtocol.id,
        functionName: "deposit_public_as_signer",
        feeCredits: 10
    },
    instantWithdrawPublic: {
        programId: PROGRAMS.coreProtocol.id,
        functionName: "instant_withdraw_public",
        feeCredits: 10
    },
    withdrawPublic: {
        programId: PROGRAMS.coreProtocol.id,
        functionName: "withdraw_public",
        feeCredits: 10
    },
    claimWithdrawalPublic: {
        programId: PROGRAMS.coreProtocol.id,
        functionName: "claim_withdrawal_public",
        feeCredits: 10
    }
};
