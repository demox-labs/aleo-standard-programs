import credits.aleo;
import token_registry.aleo;
import wrapped_credits.aleo;
import validator_oracle.aleo;
import paleo_token.aleo;
import pondo_protocol_token.aleo;
import delegator1.aleo;
import delegator2.aleo;
import delegator3.aleo;
import delegator4.aleo;
import delegator5.aleo;
import pondo_protocol.aleo;
import time_oracle.aleo;
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
    paleo_amount as u128;
    recipient_rewards_key as address;
    recipient_principal_key as address;
    start_timestamp as u64;
    cliff_timestamp as u64;
    fully_vested_timestamp as u64;


mapping grants:
	key as u8.public;
	value as Grant.public;


function initialize:
    async initialize into r0;
    output r0 as grant_disbursement.aleo/initialize.future;

finalize initialize:
    contains grants[0u8] into r0;
    not r0 into r1;
    assert.eq r1 true;
    cast 1_000_000_000u64 0u128 aleo12shtwnmf49t5atmad2jnk3e58ahtp749d9trctt9z3wryxyzt5pspp0nd0 aleo1z9y9afh0h6dnyj3f0hvjc4mhayjy06fj42ppcq0rvpmmyky6fuzs449sjr 0u64 1_000_000_000u64 2_000_000_000u64 into r2 as Grant;
    set r2 into grants[0u8];




function process_grant:
    input r0 as u8.private;
    input r1 as u64.private;
    input r2 as u128.private;
    call credits.aleo/transfer_public self.caller r1 into r3;
    cast r2 into r4 as u64;
    call pondo_protocol.aleo/deposit_public_as_signer r1 r4 grant_disbursement.aleo into r5;
    call token_registry.aleo/transfer_public_as_signer 1751493913335802797273486270793650302076377624243810059080883537084141842600field grant_disbursement.aleo r2 into r6;
    async process_grant r3 r5 r6 r0 r1 r2 into r7;
    output r7 as grant_disbursement.aleo/process_grant.future;

finalize process_grant:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as pondo_protocol.aleo/deposit_public_as_signer.future;
    input r2 as token_registry.aleo/transfer_public_as_signer.future;
    input r3 as u8.public;
    input r4 as u64.public;
    input r5 as u128.public;
    await r0;
    await r1;
    await r2;
    get token_registry.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r6;
    get pondo_protocol.aleo/owed_commission[0u8] into r7;
    cast r7 into r8 as u128;
    add r6.supply r8 into r9;
    sub r9 r5 into r10;
    get pondo_protocol.aleo/balances[0u8] into r11;
    get.or_use credits.aleo/account[grant_disbursement.aleo] 0u64 into r12;
    get pondo_protocol.aleo/balances[2u8] into r13;
    add r11 r12 into r14;
    sub r14 r13 into r15;
    sub r15 r4 into r16;
    cast r4 into r17 as u128;
    mul r17 r10 into r18;
    cast r16 into r19 as u128;
    div r18 r19 into r20;
    mul r20 9_999u128 into r21;
    div r21 10_000u128 into r22;
    gte r5 r22 into r23;
    assert.eq r23 true;
    get grants[r3] into r24;
    assert.eq r4 r24.credits_amount;
    cast r24.credits_amount r5 r24.recipient_rewards_key r24.recipient_principal_key r24.start_timestamp r24.cliff_timestamp r24.fully_vested_timestamp into r25 as Grant;
    set r25 into grants[r3];




function withdraw_rewards:
    input r0 as u8.private;
    input r1 as u128.private;
    call token_registry.aleo/transfer_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.caller r1 into r2;
    async withdraw_rewards r2 r0 r1 self.caller into r3;
    output r3 as grant_disbursement.aleo/withdraw_rewards.future;

finalize withdraw_rewards:
    input r0 as token_registry.aleo/transfer_public.future;
    input r1 as u8.public;
    input r2 as u128.public;
    input r3 as address.public;
    await r0;
    get grants[r1] into r4;
    assert.eq r3 r4.recipient_rewards_key;
    get time_oracle.aleo/timestamp[0u8] into r5;
    lt r5 r4.cliff_timestamp into r6;
    assert.eq r6 true;
    sub r4.paleo_amount r2 into r7;
    get pondo_protocol.aleo/protocol_state[0u8] into r8;
    is.neq r8 1u8 into r9;
    assert.eq r9 true;
    get token_registry.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r10;
    get pondo_protocol.aleo/owed_commission[0u8] into r11;
    cast r11 into r12 as u128;
    add r10.supply r12 into r13;
    get pondo_protocol.aleo/balances[0u8] into r14;
    get.or_use credits.aleo/account[grant_disbursement.aleo] 0u64 into r15;
    get pondo_protocol.aleo/balances[2u8] into r16;
    add r14 r15 into r17;
    sub r17 r16 into r18;
    cast r18 into r19 as u128;
    mul r19 r7 into r20;
    div r20 r13 into r21;
    cast r4.credits_amount into r22 as u128;
    gte r21 r22 into r23;
    assert.eq r23 true;
    cast r4.credits_amount r7 r4.recipient_rewards_key r4.recipient_principal_key r4.start_timestamp r4.cliff_timestamp r4.fully_vested_timestamp into r24 as Grant;
    set r24 into grants[r1];




function withdraw_principal:
    input r0 as u8.private;
    input r1 as u128.private;
    call token_registry.aleo/transfer_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.caller r1 into r2;
    async withdraw_principal r2 r0 r1 self.caller into r3;
    output r3 as grant_disbursement.aleo/withdraw_principal.future;

finalize withdraw_principal:
    input r0 as token_registry.aleo/transfer_public.future;
    input r1 as u8.public;
    input r2 as u128.public;
    input r3 as address.public;
    await r0;
    get grants[r1] into r4;
    assert.eq r3 r4.recipient_principal_key;
    get time_oracle.aleo/timestamp[0u8] into r5;
    gte r5 r4.cliff_timestamp into r6;
    assert.eq r6 true;
    sub r4.paleo_amount r2 into r7;
    get pondo_protocol.aleo/protocol_state[0u8] into r8;
    is.neq r8 1u8 into r9;
    assert.eq r9 true;
    get token_registry.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r10;
    get pondo_protocol.aleo/owed_commission[0u8] into r11;
    cast r11 into r12 as u128;
    add r10.supply r12 into r13;
    get pondo_protocol.aleo/balances[0u8] into r14;
    get.or_use credits.aleo/account[grant_disbursement.aleo] 0u64 into r15;
    get pondo_protocol.aleo/balances[2u8] into r16;
    add r14 r15 into r17;
    sub r17 r16 into r18;
    cast r18 into r19 as u128;
    mul r19 r7 into r20;
    div r20 r13 into r21;
    sub r5 r4.start_timestamp into r22;
    sub r4.fully_vested_timestamp r4.start_timestamp into r23;
    cast r4.credits_amount into r24 as u128;
    cast r22 into r25 as u128;
    mul r24 r25 into r26;
    cast r23 into r27 as u128;
    div r26 r27 into r28;
    cast r4.credits_amount into r29 as u128;
    lt r28 r29 into r30;
    cast r4.credits_amount into r31 as u128;
    ternary r30 r28 r31 into r32;
    cast r4.credits_amount into r33 as u128;
    sub r33 r32 into r34;
    cast r34 into r35 as u128;
    gte r21 r35 into r36;
    assert.eq r36 true;
    cast r4.credits_amount r7 r4.recipient_rewards_key r4.recipient_principal_key r4.start_timestamp r4.cliff_timestamp r4.fully_vested_timestamp into r37 as Grant;
    set r37 into grants[r1];

