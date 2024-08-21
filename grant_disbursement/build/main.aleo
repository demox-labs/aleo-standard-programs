import credits.aleo;
import multi_token_support_program.aleo;
import mtsp_credits.aleo;
import pondo_oracle.aleo;
import pondo_staked_aleo_token.aleo;
import pondo_token.aleo;
import pondo_delegator1.aleo;
import pondo_delegator2.aleo;
import pondo_delegator3.aleo;
import pondo_delegator4.aleo;
import pondo_delegator5.aleo;
import pondo_core_protocol.aleo;
program grant_disbursement.aleo;


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


struct admin_operation:
    arg as field;
    op_type as u8;
    request_id as u64;

struct validator_state:
    validator as address;
    commission as u8;

struct Grant:
    credits_amount as u64;
    paleo_amount as u64;
    recipient_rewards_key as address;
    recipient_principal_key as address;
    start_block as u32;
    cliff_block as u32;
    fully_vested_block as u32;


mapping grants:
	key as u64.public;
	value as Grant.public;


function create_grant:
    input r0 as u64.public;
    input r1 as u64.public;
    input r2 as u64.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as u32.public;
    input r6 as u32.public;
    call pondo_core_protocol.aleo/deposit_public_as_signer r1 r2 grant_disbursement.aleo into r7;
    cast r2 into r8 as u128;
    call multi_token_support_program.aleo/transfer_public_as_signer 1751493913335802797273486270793650302076377624243810059080883537084141842600field grant_disbursement.aleo r8 into r9;
    gt r6 r5 into r10;
    assert.eq r10 true;
    async create_grant r7 r9 r0 r1 r2 r3 r4 r5 r6 into r11;
    output r11 as grant_disbursement.aleo/create_grant.future;

finalize create_grant:
    input r0 as pondo_core_protocol.aleo/deposit_public_as_signer.future;
    input r1 as multi_token_support_program.aleo/transfer_public_as_signer.future;
    input r2 as u64.public;
    input r3 as u64.public;
    input r4 as u64.public;
    input r5 as address.public;
    input r6 as address.public;
    input r7 as u32.public;
    input r8 as u32.public;
    await r0;
    await r1;
    cast r3 r4 r5 r6 block.height r7 r8 into r9 as Grant;
    lt block.height r9.cliff_block into r10;
    assert.eq r10 true;
    contains grants[r2] into r11;
    not r11 into r12;
    assert.eq r12 true;
    set r9 into grants[r2];




function withdraw_rewards:
    input r0 as u64.private;
    input r1 as u64.private;
    cast r1 into r2 as u128;
    call multi_token_support_program.aleo/transfer_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.caller r2 into r3;
    async withdraw_rewards r3 r0 r1 self.caller into r4;
    output r4 as grant_disbursement.aleo/withdraw_rewards.future;

finalize withdraw_rewards:
    input r0 as multi_token_support_program.aleo/transfer_public.future;
    input r1 as u64.public;
    input r2 as u64.public;
    input r3 as address.public;
    await r0;
    get grants[r1] into r4;
    assert.eq r3 r4.recipient_rewards_key;
    lt block.height r4.cliff_block into r5;
    assert.eq r5 true;
    sub r4.paleo_amount r2 into r6;
    get pondo_core_protocol.aleo/protocol_state[0u8] into r7;
    is.neq r7 1u8 into r8;
    assert.eq r8 true;
    get multi_token_support_program.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r9;
    get pondo_core_protocol.aleo/balances[0u8] into r10;
    get.or_use credits.aleo/account[grant_disbursement.aleo] 0u64 into r11;
    get pondo_core_protocol.aleo/balances[2u8] into r12;
    add r10 r11 into r13;
    sub r13 r12 into r14;
    cast r14 into r15 as u128;
    cast r6 into r16 as u128;
    mul r15 r16 into r17;
    div r17 r9.supply into r18;
    cast r4.credits_amount into r19 as u128;
    gte r18 r19 into r20;
    assert.eq r20 true;
    cast r4.credits_amount r6 r4.recipient_rewards_key r4.recipient_principal_key r4.start_block r4.cliff_block r4.fully_vested_block into r21 as Grant;
    set r21 into grants[r1];




function withdraw_principal:
    input r0 as u64.private;
    input r1 as u64.private;
    cast r1 into r2 as u128;
    call multi_token_support_program.aleo/transfer_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.caller r2 into r3;
    async withdraw_principal r3 r0 r1 self.caller into r4;
    output r4 as grant_disbursement.aleo/withdraw_principal.future;

finalize withdraw_principal:
    input r0 as multi_token_support_program.aleo/transfer_public.future;
    input r1 as u64.public;
    input r2 as u64.public;
    input r3 as address.public;
    await r0;
    get grants[r1] into r4;
    assert.eq r3 r4.recipient_principal_key;
    gte block.height r4.cliff_block into r5;
    assert.eq r5 true;
    sub r4.paleo_amount r2 into r6;
    get pondo_core_protocol.aleo/protocol_state[0u8] into r7;
    is.neq r7 1u8 into r8;
    assert.eq r8 true;
    get multi_token_support_program.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r9;
    get pondo_core_protocol.aleo/balances[0u8] into r10;
    get.or_use credits.aleo/account[grant_disbursement.aleo] 0u64 into r11;
    get pondo_core_protocol.aleo/balances[2u8] into r12;
    add r10 r11 into r13;
    sub r13 r12 into r14;
    cast r14 into r15 as u128;
    cast r6 into r16 as u128;
    mul r15 r16 into r17;
    div r17 r9.supply into r18;
    sub block.height r4.start_block into r19;
    sub r4.fully_vested_block r4.start_block into r20;
    cast r4.credits_amount into r21 as u128;
    cast r19 into r22 as u128;
    mul r21 r22 into r23;
    cast r20 into r24 as u128;
    div r23 r24 into r25;
    cast r4.credits_amount into r26 as u128;
    lt r25 r26 into r27;
    cast r4.credits_amount into r28 as u128;
    ternary r27 r25 r28 into r29;
    cast r4.credits_amount into r30 as u128;
    sub r30 r29 into r31;
    cast r31 into r32 as u128;
    gte r18 r32 into r33;
    assert.eq r33 true;
    cast r4.credits_amount r6 r4.recipient_rewards_key r4.recipient_principal_key r4.start_block r4.cliff_block r4.fully_vested_block into r34 as Grant;
    set r34 into grants[r1];

