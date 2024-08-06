import credits.aleo;
import multi_token_support_program.aleo;
import pondo_oracle.aleo;
import pondo_staked_aleo_token.aleo;
import pondo_token.aleo;
import pondo_delegator1.aleo;
import pondo_delegator2.aleo;
import pondo_delegator3.aleo;
import pondo_delegator4.aleo;
import pondo_delegator5.aleo;
import pondo_core_protocol.aleo;
program test_program.aleo;


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


struct validator_state:
    validator as address;
    commission as u8;



function double_deposit:
    input r0 as u64.private;
    input r1 as u64.private;
    call pondo_core_protocol.aleo/deposit_public_as_signer r0 r1 test_program.aleo into r2;
    call pondo_core_protocol.aleo/deposit_public_as_signer r0 r1 test_program.aleo into r3;
    async double_deposit r2 r3 into r4;
    output r4 as test_program.aleo/double_deposit.future;

finalize double_deposit:
    input r0 as pondo_core_protocol.aleo/deposit_public_as_signer.future;
    input r1 as pondo_core_protocol.aleo/deposit_public_as_signer.future;
    await r0;
    await r1;




function deposit_withdraw_as_signer:
    input r0 as u64.private;
    input r1 as u64.private;
    call pondo_core_protocol.aleo/deposit_public_as_signer r0 r1 test_program.aleo into r2;
    call pondo_core_protocol.aleo/withdraw_public_as_signer r1 into r3;
    async deposit_withdraw_as_signer r2 r3 into r4;
    output r4 as test_program.aleo/deposit_withdraw_as_signer.future;

finalize deposit_withdraw_as_signer:
    input r0 as pondo_core_protocol.aleo/deposit_public_as_signer.future;
    input r1 as pondo_core_protocol.aleo/withdraw_public_as_signer.future;
    await r0;
    await r1;




function deposit_instant_withdraw_signer:
    input r0 as u64.private;
    input r1 as u64.private;
    input r2 as boolean.private;
    call pondo_core_protocol.aleo/deposit_public_as_signer r0 r1 test_program.aleo into r3;
    cast r0 into r4 as u128;
    cast r0 into r5 as u128;
    mul r5 025u128 into r6;
    div r6 10_000u128 into r7;
    sub r4 r7 into r8;
    cast r0 into r9 as u128;
    ternary r2 r8 r9 into r10;
    cast r10 into r11 as u64;
    call pondo_core_protocol.aleo/instant_withdraw_public_signer r1 r11 into r12;
    async deposit_instant_withdraw_signer r3 r12 into r13;
    output r13 as test_program.aleo/deposit_instant_withdraw_signer.future;

finalize deposit_instant_withdraw_signer:
    input r0 as pondo_core_protocol.aleo/deposit_public_as_signer.future;
    input r1 as pondo_core_protocol.aleo/instant_withdraw_public_signer.future;
    await r0;
    await r1;




function deposit_withdraw:
    input r0 as u64.private;
    input r1 as u64.private;
    input r2 as boolean.private;
    cast r0 into r3 as u128;
    call multi_token_support_program.aleo/transfer_from_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field self.caller test_program.aleo r3 into r4;
    cast r0 into r5 as u128;
    call multi_token_support_program.aleo/approve_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field pondo_core_protocol.aleo r5 into r6;
    call pondo_core_protocol.aleo/deposit_public r0 r1 test_program.aleo into r7;
    call pondo_core_protocol.aleo/withdraw_public r1 into r8;
    async deposit_withdraw r4 r6 r7 r8 into r9;
    output r9 as test_program.aleo/deposit_withdraw.future;

finalize deposit_withdraw:
    input r0 as multi_token_support_program.aleo/transfer_from_public.future;
    input r1 as multi_token_support_program.aleo/approve_public.future;
    input r2 as pondo_core_protocol.aleo/deposit_public.future;
    input r3 as pondo_core_protocol.aleo/withdraw_public.future;
    await r0;
    await r1;
    await r2;
    await r3;




function deposit_instant_withdraw:
    input r0 as u64.private;
    input r1 as u64.private;
    input r2 as boolean.private;
    cast r0 into r3 as u128;
    call multi_token_support_program.aleo/transfer_from_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field self.caller test_program.aleo r3 into r4;
    cast r0 into r5 as u128;
    call multi_token_support_program.aleo/approve_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field pondo_core_protocol.aleo r5 into r6;
    cast r0 into r7 as u128;
    cast r0 into r8 as u128;
    mul r8 025u128 into r9;
    div r9 10_000u128 into r10;
    sub r7 r10 into r11;
    cast r0 into r12 as u128;
    ternary r2 r11 r12 into r13;
    call pondo_core_protocol.aleo/deposit_public r0 r1 test_program.aleo into r14;
    cast r13 into r15 as u64;
    call pondo_core_protocol.aleo/instant_withdraw_public r1 r15 into r16;
    async deposit_instant_withdraw r4 r6 r14 r16 into r17;
    output r17 as test_program.aleo/deposit_instant_withdraw.future;

finalize deposit_instant_withdraw:
    input r0 as multi_token_support_program.aleo/transfer_from_public.future;
    input r1 as multi_token_support_program.aleo/approve_public.future;
    input r2 as pondo_core_protocol.aleo/deposit_public.future;
    input r3 as pondo_core_protocol.aleo/instant_withdraw_public.future;
    await r0;
    await r1;
    await r2;
    await r3;

