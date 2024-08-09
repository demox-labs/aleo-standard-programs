import credits.aleo;
import multi_token_support_program.aleo;
program mtsp_credits.aleo;


struct TokenMetadata:
    token_id as field;
    name as u128;
    symbol as u128;
    decimals as u8;
    supply as u128;
    max_supply as u128;
    admin as address;
    external_authorization_required as boolean;
    external_authorization_party as address;

struct TokenOwner:
    account as address;
    token_id as field;




function deposit_credits_public_signer:
    input r0 as u64.public;
    call credits.aleo/transfer_public_as_signer mtsp_credits.aleo r0 into r1;
    cast r0 into r2 as u128;
    call multi_token_support_program.aleo/mint_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field self.signer r2 4294967295u32 into r3;
    async deposit_credits_public_signer r1 r3 into r4;
    output r4 as mtsp_credits.aleo/deposit_credits_public_signer.future;

finalize deposit_credits_public_signer:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as multi_token_support_program.aleo/mint_public.future;
    await r0;
    await r1;




function deposit_credits_private:
    input r0 as credits.aleo/credits.record;
    input r1 as u64.private;
    call credits.aleo/transfer_private_to_public r0 mtsp_credits.aleo r1 into r2 r3;
    cast r1 into r4 as u128;
    call multi_token_support_program.aleo/mint_private 3443843282313283355522573239085696902919850365217539366784739393210722344986field mtsp_credits.aleo r4 false 4294967295u32 into r5 r6;
    async deposit_credits_private r3 r6 into r7;
    output r2 as credits.aleo/credits.record;
    output r5 as multi_token_support_program.aleo/Token.record;
    output r7 as mtsp_credits.aleo/deposit_credits_private.future;

finalize deposit_credits_private:
    input r0 as credits.aleo/transfer_private_to_public.future;
    input r1 as multi_token_support_program.aleo/mint_private.future;
    await r0;
    await r1;




function withdraw_credits_public:
    input r0 as u64.private;
    call credits.aleo/transfer_public self.caller r0 into r1;
    cast r0 into r2 as u128;
    call multi_token_support_program.aleo/burn_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field self.caller r2 into r3;
    async withdraw_credits_public r1 r3 into r4;
    output r4 as mtsp_credits.aleo/withdraw_credits_public.future;

finalize withdraw_credits_public:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as multi_token_support_program.aleo/burn_public.future;
    await r0;
    await r1;




function withdraw_credits_public_signer:
    input r0 as u64.private;
    call credits.aleo/transfer_public self.signer r0 into r1;
    cast r0 into r2 as u128;
    call multi_token_support_program.aleo/burn_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field self.signer r2 into r3;
    async withdraw_credits_public_signer r1 r3 into r4;
    output r4 as mtsp_credits.aleo/withdraw_credits_public_signer.future;

finalize withdraw_credits_public_signer:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as multi_token_support_program.aleo/burn_public.future;
    await r0;
    await r1;




function withdraw_credits_private:
    input r0 as multi_token_support_program.aleo/Token.record;
    input r1 as u64.private;
    call credits.aleo/transfer_public_to_private r0.owner r1 into r2 r3;
    cast r1 into r4 as u128;
    call multi_token_support_program.aleo/burn_private r0 r4 into r5 r6;
    async withdraw_credits_private r3 r6 into r7;
    output r5 as multi_token_support_program.aleo/Token.record;
    output r2 as credits.aleo/credits.record;
    output r7 as mtsp_credits.aleo/withdraw_credits_private.future;

finalize withdraw_credits_private:
    input r0 as credits.aleo/transfer_public_to_private.future;
    input r1 as multi_token_support_program.aleo/burn_private.future;
    await r0;
    await r1;

