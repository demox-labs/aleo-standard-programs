import credits.aleo;
import token_registry.aleo;
import wrapped_credits.aleo;
import validator_oracle.aleo;
import pondo_token.aleo;
import pondo_protocol_token.aleo;
import delegator1.aleo;
import delegator2.aleo;
import delegator3.aleo;
import delegator4.aleo;
import delegator5.aleo;
import pondo_protocol.aleo;
import time_oracle.aleo;
program token_disbursement.aleo;


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

struct Claim:
    credits_amount as u128;
    paleo_amount as u128;
    recipient as address;


mapping claims:
	key as u64.public;
	value as Claim.public;


function create:
    input r0 as u64.public;
    input r1 as u128.public;
    input r2 as address.public;
    call token_registry.aleo/transfer_public_as_signer 1751493913335802797273486270793650302076377624243810059080883537084141842600field token_disbursement.aleo r1 into r3;
    async create r3 r0 r1 r2 into r4;
    output r4 as token_disbursement.aleo/create.future;

finalize create:
    input r0 as token_registry.aleo/transfer_public_as_signer.future;
    input r1 as u64.public;
    input r2 as u128.public;
    input r3 as address.public;
    await r0;
    contains claims[r1] into r4;
    not r4 into r5;
    assert.eq r5 true;
    cast r2 r2 r3 into r6 as Claim;
    set r6 into claims[r1];




function withdraw_rewards:
    input r0 as u64.public;
    input r1 as u128.public;
    call token_registry.aleo/transfer_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.caller r1 into r2;
    async withdraw_rewards r2 r0 r1 self.caller into r3;
    output r3 as token_disbursement.aleo/withdraw_rewards.future;

finalize withdraw_rewards:
    input r0 as token_registry.aleo/transfer_public.future;
    input r1 as u64.public;
    input r2 as u128.public;
    input r3 as address.public;
    await r0;
    get claims[r1] into r4;
    assert.eq r3 r4.recipient;
    get time_oracle.aleo/timestamp[0u8] into r5;
    lt r5 1_757_015_686u64 into r6;
    assert.eq r6 true;
    sub r4.paleo_amount r2 into r7;
    get pondo_protocol.aleo/protocol_state[0u8] into r8;
    is.neq r8 2u8 into r9;
    assert.eq r9 true;
    get token_registry.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r10;
    get pondo_protocol.aleo/owed_commission[0u8] into r11;
    cast r11 into r12 as u128;
    add r10.supply r12 into r13;
    get pondo_protocol.aleo/balances[0u8] into r14;
    get.or_use credits.aleo/account[pondo_protocol.aleo] 0u64 into r15;
    get pondo_protocol.aleo/balances[2u8] into r16;
    add r14 r15 into r17;
    sub r17 r16 into r18;
    cast r18 into r19 as u128;
    mul r19 r7 into r20;
    div r20 r13 into r21;
    cast r4.credits_amount into r22 as u128;
    gte r21 r22 into r23;
    assert.eq r23 true;
    cast r4.credits_amount r7 r4.recipient into r24 as Claim;
    set r24 into claims[r1];




function withdraw_principal:
    input r0 as u64.public;
    input r1 as u128.public;
    call token_registry.aleo/transfer_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.caller r1 into r2;
    async withdraw_principal r2 r0 r1 self.caller into r3;
    output r3 as token_disbursement.aleo/withdraw_principal.future;

finalize withdraw_principal:
    input r0 as token_registry.aleo/transfer_public.future;
    input r1 as u64.public;
    input r2 as u128.public;
    input r3 as address.public;
    await r0;
    get claims[r1] into r4;
    assert.eq r3 r4.recipient;
    get time_oracle.aleo/timestamp[0u8] into r5;
    gte r5 1_757_015_686u64 into r6;
    assert.eq r6 true;
    sub r4.paleo_amount r2 into r7;
    cast r4.credits_amount r7 r4.recipient into r8 as Claim;
    set r8 into claims[r1];




function cancel:
    input r0 as u64.public;
    input r1 as u128.public;
    call token_registry.aleo/transfer_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field aleo12shtwnmf49t5atmad2jnk3e58ahtp749d9trctt9z3wryxyzt5pspp0nd0 r1 into r2;
    async cancel r2 r0 r1 into r3;
    output r3 as token_disbursement.aleo/cancel.future;

finalize cancel:
    input r0 as token_registry.aleo/transfer_public.future;
    input r1 as u64.public;
    input r2 as u128.public;
    await r0;
    gt block.height 22_500_000u32 into r3;
    assert.eq r3 true;
    get claims[r1] into r4;
    assert.eq r4.paleo_amount r2;
    remove claims[r1];

