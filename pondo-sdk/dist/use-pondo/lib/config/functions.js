import { PROGRAMS } from './programs.js';
export const FUNCTIONS = {
    depositPublicAsSigner: {
        programId: PROGRAMS.coreProtocol.id,
        functionName: "deposit_public_as_signer",
        feeCredits: 10
    },
    instantWithdraw: {
        programId: PROGRAMS.coreProtocol.id,
        functionName: "instant_withdraw_public",
        feeCredits: 10
    },
};
