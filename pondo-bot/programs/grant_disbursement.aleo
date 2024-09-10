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
    start_timestamp as u64;
    cliff_timestamp as u64;
    fully_vested_timestamp as u64;


mapping timestamp:
	key as u8.public;
	value as u64.public;


mapping admin_operations:
	key as u64.public;
	value as admin_operation.public;


mapping admins:
	key as address.public;
	value as boolean.public;


mapping grants:
	key as u64.public;
	value as Grant.public;


function initialize:
    async initialize into r0;
    output r0 as grant_disbursement.aleo/initialize.future;

finalize initialize:
    contains timestamp[0u8] into r0;
    not r0 into r1;
    assert.eq r1 true;
    set 0u64 into timestamp[0u8];
    set true into admins[aleo12shtwnmf49t5atmad2jnk3e58ahtp749d9trctt9z3wryxyzt5pspp0nd0];
    set true into admins[aleo1z9y9afh0h6dnyj3f0hvjc4mhayjy06fj42ppcq0rvpmmyky6fuzs449sjr];
    set true into admins[aleo19x0ctad8llm9y0qssw7eup045c5wxxp6k4al3n0d5r8maulkzu8sh3jwew];
    set true into admins[aleo16ycrg9g4208lp5y4g5s3gn43xknc5gdsr7wjrpqq9htznj5qk5yqd6px5a];
    set true into admins[aleo1q59hxe2zmexlu4vgtmtmvyxm4ew047zlf50h5l5zsrdvljusdvrqn78u7s];




function update_admin:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as signature.public;
    input r3 as address.public;
    input r4 as signature.public;
    input r5 as address.public;
    input r6 as signature.public;
    input r7 as address.public;
    input r8 as u64.public;
    cast  r0 r1 into r9 as [address; 2u32];
    hash.bhp256 r9 into r10 as field;
    cast r10 1u8 r8 into r11 as admin_operation;
    hash.bhp256 r11 into r12 as field;
    sign.verify r2 r3 r12 into r13;
    sign.verify r4 r5 r12 into r14;
    sign.verify r6 r7 r12 into r15;
    and r13 r14 into r16;
    and r16 r15 into r17;
    assert.eq r17 true;
    assert.neq r3 r5;
    assert.neq r3 r7;
    assert.neq r5 r7;
    async update_admin r0 r1 r3 r5 r7 r11 into r18;
    output r18 as grant_disbursement.aleo/update_admin.future;

finalize update_admin:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as admin_operation.public;
    get admins[r2] into r6;
    get admins[r3] into r7;
    get admins[r4] into r8;
    and r6 r7 into r9;
    and r9 r8 into r10;
    assert.eq r10 true;
    contains admin_operations[r5.request_id] into r11;
    assert.eq r11 false;
    set r5 into admin_operations[r5.request_id];
    remove admins[r0];
    set true into admins[r1];




function update_timestamp:
    input r0 as u64.public;
    input r1 as signature.public;
    input r2 as address.public;
    input r3 as signature.public;
    input r4 as address.public;
    input r5 as signature.public;
    input r6 as address.public;
    input r7 as u64.public;
    hash.bhp256 r0 into r8 as field;
    cast r8 0u8 r7 into r9 as admin_operation;
    hash.bhp256 r9 into r10 as field;
    sign.verify r1 r2 r10 into r11;
    sign.verify r3 r4 r10 into r12;
    sign.verify r5 r6 r10 into r13;
    and r11 r12 into r14;
    and r14 r13 into r15;
    assert.eq r15 true;
    assert.neq r2 r4;
    assert.neq r2 r6;
    assert.neq r4 r6;
    async update_timestamp r0 r2 r4 r6 r9 into r16;
    output r16 as grant_disbursement.aleo/update_timestamp.future;

finalize update_timestamp:
    input r0 as u64.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as address.public;
    input r4 as admin_operation.public;
    get admins[r1] into r5;
    get admins[r2] into r6;
    get admins[r3] into r7;
    and r5 r6 into r8;
    and r8 r7 into r9;
    assert.eq r9 true;
    contains admin_operations[r4.request_id] into r10;
    assert.eq r10 false;
    set r4 into admin_operations[r4.request_id];
    set r0 into timestamp[0u8];




function create_grant:
    input r0 as u64.public;
    input r1 as u64.public;
    input r2 as u64.public;
    input r3 as address.public;
    input r4 as address.public;
    input r5 as u64.public;
    input r6 as u64.public;
    input r7 as u64.public;
    call pondo_protocol.aleo/deposit_public_as_signer r1 r2 grant_disbursement.aleo into r8;
    cast r2 into r9 as u128;
    call token_registry.aleo/transfer_public_as_signer 1751493913335802797273486270793650302076377624243810059080883537084141842600field grant_disbursement.aleo r9 into r10;
    gt r5 r6 into r11;
    assert.eq r11 true;
    gt r7 r6 into r12;
    assert.eq r12 true;
    async create_grant r8 r10 r0 r1 r2 r3 r4 r5 r6 r7 into r13;
    output r13 as grant_disbursement.aleo/create_grant.future;

finalize create_grant:
    input r0 as pondo_protocol.aleo/deposit_public_as_signer.future;
    input r1 as token_registry.aleo/transfer_public_as_signer.future;
    input r2 as u64.public;
    input r3 as u64.public;
    input r4 as u64.public;
    input r5 as address.public;
    input r6 as address.public;
    input r7 as u64.public;
    input r8 as u64.public;
    input r9 as u64.public;
    await r0;
    await r1;
    cast r3 r4 r5 r6 r7 r8 r9 into r10 as Grant;
    get timestamp[0u8] into r11;
    lt r11 r10.start_timestamp into r12;
    assert.eq r12 true;
    contains grants[r2] into r13;
    not r13 into r14;
    assert.eq r14 true;
    set r10 into grants[r2];




function withdraw_rewards:
    input r0 as u64.private;
    input r1 as u64.private;
    cast r1 into r2 as u128;
    call token_registry.aleo/transfer_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.caller r2 into r3;
    async withdraw_rewards r3 r0 r1 self.caller into r4;
    output r4 as grant_disbursement.aleo/withdraw_rewards.future;

finalize withdraw_rewards:
    input r0 as token_registry.aleo/transfer_public.future;
    input r1 as u64.public;
    input r2 as u64.public;
    input r3 as address.public;
    await r0;
    get grants[r1] into r4;
    assert.eq r3 r4.recipient_rewards_key;
    get timestamp[0u8] into r5;
    lt r5 r4.cliff_timestamp into r6;
    assert.eq r6 true;
    gte r5 r4.start_timestamp into r7;
    assert.eq r7 true;
    sub r4.paleo_amount r2 into r8;
    get pondo_protocol.aleo/protocol_state[0u8] into r9;
    is.neq r9 1u8 into r10;
    assert.eq r10 true;
    get token_registry.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r11;
    get pondo_protocol.aleo/owed_commission[0u8] into r12;
    cast r12 into r13 as u128;
    add r11.supply r13 into r14;
    get pondo_protocol.aleo/balances[0u8] into r15;
    get.or_use credits.aleo/account[grant_disbursement.aleo] 0u64 into r16;
    get pondo_protocol.aleo/balances[2u8] into r17;
    add r15 r16 into r18;
    sub r18 r17 into r19;
    cast r19 into r20 as u128;
    cast r8 into r21 as u128;
    mul r20 r21 into r22;
    div r22 r14 into r23;
    cast r4.credits_amount into r24 as u128;
    gte r23 r24 into r25;
    assert.eq r25 true;
    cast r4.credits_amount r8 r4.recipient_rewards_key r4.recipient_principal_key r4.start_timestamp r4.cliff_timestamp r4.fully_vested_timestamp into r26 as Grant;
    set r26 into grants[r1];




function withdraw_principal:
    input r0 as u64.private;
    input r1 as u64.private;
    cast r1 into r2 as u128;
    call token_registry.aleo/transfer_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.caller r2 into r3;
    async withdraw_principal r3 r0 r1 self.caller into r4;
    output r4 as grant_disbursement.aleo/withdraw_principal.future;

finalize withdraw_principal:
    input r0 as token_registry.aleo/transfer_public.future;
    input r1 as u64.public;
    input r2 as u64.public;
    input r3 as address.public;
    await r0;
    get grants[r1] into r4;
    assert.eq r3 r4.recipient_principal_key;
    get timestamp[0u8] into r5;
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
    cast r7 into r20 as u128;
    mul r19 r20 into r21;
    div r21 r13 into r22;
    sub r5 r4.start_timestamp into r23;
    sub r4.fully_vested_timestamp r4.start_timestamp into r24;
    cast r4.credits_amount into r25 as u128;
    cast r23 into r26 as u128;
    mul r25 r26 into r27;
    cast r24 into r28 as u128;
    div r27 r28 into r29;
    cast r4.credits_amount into r30 as u128;
    lt r29 r30 into r31;
    cast r4.credits_amount into r32 as u128;
    ternary r31 r29 r32 into r33;
    cast r4.credits_amount into r34 as u128;
    sub r34 r33 into r35;
    cast r35 into r36 as u128;
    gte r22 r36 into r37;
    assert.eq r37 true;
    cast r4.credits_amount r7 r4.recipient_rewards_key r4.recipient_principal_key r4.start_timestamp r4.cliff_timestamp r4.fully_vested_timestamp into r38 as Grant;
    set r38 into grants[r1];

