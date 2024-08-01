import credits.aleo;
import multi_token_support_program_v02.aleo;
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




function deposit_withdraw:
    input r0 as u64.private;
    input r1 as u64.private;
    call pondo_core_protocol.aleo/deposit_public_as_signer r0 r1 test_program.aleo into r2;
    call pondo_core_protocol.aleo/withdraw_public r1 into r3;
    async deposit_withdraw r2 r3 into r4;
    output r4 as test_program.aleo/deposit_withdraw.future;

finalize deposit_withdraw:
    input r0 as pondo_core_protocol.aleo/deposit_public_as_signer.future;
    input r1 as pondo_core_protocol.aleo/withdraw_public.future;
    await r0;
    await r1;




function deposit_instant_withdraw:
    input r0 as u64.private;
    input r1 as u64.private;
    call multi_token_support_program_v02.aleo/deposit_credits_public r0 into r2;
    cast r0 into r3 as u128;
    call multi_token_support_program_v02.aleo/approve_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field pondo_core_protocol.aleo r3 into r4;
    call pondo_core_protocol.aleo/deposit_public r0 r1 test_program.aleo into r5;
    call pondo_core_protocol.aleo/instant_withdraw_public r1 r0 into r6;
    async deposit_instant_withdraw r2 r4 r5 r6 into r7;
    output r7 as test_program.aleo/deposit_instant_withdraw.future;

finalize deposit_instant_withdraw:
    input r0 as multi_token_support_program_v02.aleo/deposit_credits_public.future;
    input r1 as multi_token_support_program_v02.aleo/approve_public.future;
    input r2 as pondo_core_protocol.aleo/deposit_public.future;
    input r3 as pondo_core_protocol.aleo/instant_withdraw_public.future;
    await r0;
    await r1;
    await r2;
    await r3;

