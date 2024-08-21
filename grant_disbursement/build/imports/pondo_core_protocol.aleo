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
program pondo_core_protocol.aleo;

struct bond_state:
    validator as address;
    microcredits as u64;

struct unbond_state:
    microcredits as u64;
    height as u32;


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


struct validator_datum:
    delegator as address;
    validator as address;
    block_height as u32;
    bonded_microcredits as u64;
    microcredits_yield_per_epoch as u128;
    commission as u8;
    boost as u128;

struct admin_operation:
    arg as field;
    op_type as u8;
    request_id as u64;

struct validator_state:
    validator as address;
    commission as u8;

struct withdrawal_state:
    microcredits as u64;
    claim_block as u32;


mapping validator_set:
	key as u8.public;
	value as [validator_state; 5u32].public;


mapping protocol_state:
	key as u8.public;
	value as u8.public;


mapping balances:
	key as u8.public;
	value as u64.public;


mapping owed_commission:
	key as u8.public;
	value as u64.public;


mapping last_rebalance_epoch:
	key as u8.public;
	value as u32.public;


mapping withdrawals:
	key as address.public;
	value as withdrawal_state.public;


function initialize:
    input r0 as u64.private;
    gte r0 100_000_000u64 into r1;
    assert.eq r1 true;
    call credits.aleo/transfer_public_as_signer pondo_core_protocol.aleo r0 into r2;
    call pondo_staked_aleo_token.aleo/register_token into r3;
    cast r0 into r4 as u128;
    call multi_token_support_program.aleo/mint_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field pondo_core_protocol.aleo r4 4294967295u32 into r5;
    call pondo_token.aleo/initialize_token into r6;
    call pondo_delegator1.aleo/initialize into r7;
    call pondo_delegator2.aleo/initialize into r8;
    call pondo_delegator3.aleo/initialize into r9;
    call pondo_delegator4.aleo/initialize into r10;
    call pondo_delegator5.aleo/initialize into r11;
    async initialize r2 r3 r5 r6 r7 r8 r9 r10 r11 r0 into r12;
    output r12 as pondo_core_protocol.aleo/initialize.future;

finalize initialize:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as pondo_staked_aleo_token.aleo/register_token.future;
    input r2 as multi_token_support_program.aleo/mint_public.future;
    input r3 as pondo_token.aleo/initialize_token.future;
    input r4 as pondo_delegator1.aleo/initialize.future;
    input r5 as pondo_delegator2.aleo/initialize.future;
    input r6 as pondo_delegator3.aleo/initialize.future;
    input r7 as pondo_delegator4.aleo/initialize.future;
    input r8 as pondo_delegator5.aleo/initialize.future;
    input r9 as u64.public;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    await r5;
    await r6;
    await r7;
    await r8;
    contains protocol_state[0u8] into r10;
    assert.eq r10 false;
    set r9 into balances[0u8];
    set 0u64 into balances[1u8];
    set 0u64 into balances[2u8];
    set 0u64 into owed_commission[0u8];
    set 2u8 into protocol_state[0u8];
    cast  aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 into r11 as [address; 10u32];
    get.or_use pondo_oracle.aleo/top_validators[0u8] r11 into r12;
    cast aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 0u32 0u64 0u128 40u8 0u128 into r13 as validator_datum;
    get.or_use pondo_oracle.aleo/validator_data[r12[0u32]] r13 into r14;
    get.or_use pondo_oracle.aleo/validator_data[r12[1u32]] r13 into r15;
    get.or_use pondo_oracle.aleo/validator_data[r12[2u32]] r13 into r16;
    get.or_use pondo_oracle.aleo/validator_data[r12[3u32]] r13 into r17;
    get.or_use pondo_oracle.aleo/validator_data[r12[4u32]] r13 into r18;
    cast r14.validator r14.commission into r19 as validator_state;
    cast r15.validator r15.commission into r20 as validator_state;
    cast r16.validator r16.commission into r21 as validator_state;
    cast r17.validator r17.commission into r22 as validator_state;
    cast r18.validator r18.commission into r23 as validator_state;
    cast  r19 r20 r21 r22 r23 into r24 as [validator_state; 5u32];
    set r24 into validator_set[1u8];
    div block.height 120_960u32 into r25;
    set r25 into last_rebalance_epoch[0u8];




function prep_rebalance:
    call pondo_delegator1.aleo/prep_rebalance into r0;
    call pondo_delegator2.aleo/prep_rebalance into r1;
    call pondo_delegator3.aleo/prep_rebalance into r2;
    call pondo_delegator4.aleo/prep_rebalance into r3;
    call pondo_delegator5.aleo/prep_rebalance into r4;
    async prep_rebalance r0 r1 r2 r3 r4 into r5;
    output r5 as pondo_core_protocol.aleo/prep_rebalance.future;

finalize prep_rebalance:
    input r0 as pondo_delegator1.aleo/prep_rebalance.future;
    input r1 as pondo_delegator2.aleo/prep_rebalance.future;
    input r2 as pondo_delegator3.aleo/prep_rebalance.future;
    input r3 as pondo_delegator4.aleo/prep_rebalance.future;
    input r4 as pondo_delegator5.aleo/prep_rebalance.future;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    div block.height 120_960u32 into r5;
    get last_rebalance_epoch[0u8] into r6;
    gt r5 r6 into r7;
    assert.eq r7 true;
    set r5 into last_rebalance_epoch[0u8];
    get protocol_state[0u8] into r8;
    is.eq r8 0u8 into r9;
    assert.eq r9 true;
    set 1u8 into protocol_state[0u8];
    rem block.height 120_960u32 into r10;
    lt r10 17_280u32 into r11;
    is.eq r6 4294967295u32 into r12;
    or r11 r12 into r13;
    assert.eq r13 true;
    cast  aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 into r14 as [address; 10u32];
    get.or_use pondo_oracle.aleo/top_validators[0u8] r14 into r15;
    cast aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 0u32 0u64 0u128 40u8 0u128 into r16 as validator_datum;
    get.or_use pondo_oracle.aleo/validator_data[r15[0u32]] r16 into r17;
    get.or_use pondo_oracle.aleo/validator_data[r15[1u32]] r16 into r18;
    get.or_use pondo_oracle.aleo/validator_data[r15[2u32]] r16 into r19;
    get.or_use pondo_oracle.aleo/validator_data[r15[3u32]] r16 into r20;
    get.or_use pondo_oracle.aleo/validator_data[r15[4u32]] r16 into r21;
    cast r17.validator r17.commission into r22 as validator_state;
    cast r18.validator r18.commission into r23 as validator_state;
    cast r19.validator r19.commission into r24 as validator_state;
    cast r20.validator r20.commission into r25 as validator_state;
    cast r21.validator r21.commission into r26 as validator_state;
    cast  r22 r23 r24 r25 r26 into r27 as [validator_state; 5u32];
    set r27 into validator_set[1u8];








function deposit_public_as_signer:
    input r0 as u64.public;
    input r1 as u64.public;
    input r2 as address.public;
    gte r1 1u64 into r3;
    assert.eq r3 true;
    call credits.aleo/transfer_public_as_signer pondo_core_protocol.aleo r0 into r4;
    cast r1 into r5 as u128;
    call multi_token_support_program.aleo/mint_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.signer r5 4294967295u32 into r6;
    async deposit_public_as_signer r4 r6 r0 r1 into r7;
    output r7 as pondo_core_protocol.aleo/deposit_public_as_signer.future;

finalize deposit_public_as_signer:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as multi_token_support_program.aleo/mint_public.future;
    input r2 as u64.public;
    input r3 as u64.public;
    await r0;
    await r1;
    get protocol_state[0u8] into r4;
    is.neq r4 2u8 into r5;
    assert.eq r5 true;
    cast pondo_core_protocol.aleo 0u64 into r6 as bond_state;
    get.or_use credits.aleo/bonded[pondo_delegator1.aleo] r6 into r7;
    get.or_use credits.aleo/bonded[pondo_delegator2.aleo] r6 into r8;
    get.or_use credits.aleo/bonded[pondo_delegator3.aleo] r6 into r9;
    get.or_use credits.aleo/bonded[pondo_delegator4.aleo] r6 into r10;
    get.or_use credits.aleo/bonded[pondo_delegator5.aleo] r6 into r11;
    cast 0u64 0u32 into r12 as unbond_state;
    get.or_use credits.aleo/unbonding[pondo_delegator1.aleo] r12 into r13;
    get.or_use credits.aleo/unbonding[pondo_delegator2.aleo] r12 into r14;
    get.or_use credits.aleo/unbonding[pondo_delegator3.aleo] r12 into r15;
    get.or_use credits.aleo/unbonding[pondo_delegator4.aleo] r12 into r16;
    get.or_use credits.aleo/unbonding[pondo_delegator5.aleo] r12 into r17;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r18;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r19;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r20;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r21;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r22;
    add r7.microcredits r8.microcredits into r23;
    add r23 r9.microcredits into r24;
    add r24 r10.microcredits into r25;
    add r25 r11.microcredits into r26;
    add r18 r19 into r27;
    add r27 r20 into r28;
    add r28 r21 into r29;
    add r29 r22 into r30;
    add r13.microcredits r14.microcredits into r31;
    add r31 r15.microcredits into r32;
    add r32 r16.microcredits into r33;
    add r33 r17.microcredits into r34;
    get balances[1u8] into r35;
    add r26 r30 into r36;
    add r36 r34 into r37;
    sub r37 r35 into r38;
    get balances[0u8] into r39;
    gt r39 r38 into r40;
    ternary r40 r38 r39 into r41;
    get owed_commission[0u8] into r42;
    get multi_token_support_program.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r43;
    cast r42 into r44 as u128;
    add r43.supply r44 into r45;
    cast r3 into r46 as u128;
    sub r45 r46 into r47;
    gt r38 r41 into r48;
    cast r38 into r49 as i64;
    cast r41 into r50 as i64;
    sub r49 r50 into r51;
    ternary r48 r51 0i64 into r52;
    cast r52 into r53 as u128;
    mul r53 1000u128 into r54;
    div r54 10_000u128 into r55;
    cast r55 into r56 as u64;
    cast r52 into r57 as u64;
    sub r57 r56 into r58;
    add r41 r58 into r59;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r60;
    get balances[2u8] into r61;
    sub r60 r2 into r62;
    sub r62 r61 into r63;
    cast r59 into r64 as u128;
    cast r63 into r65 as u128;
    cast r56 into r66 as u128;
    add r64 r65 into r67;
    add r67 r66 into r68;
    mul r47 r68 into r69;
    div r69 r67 into r70;
    sub r70 r47 into r71;
    cast r71 into r72 as u64;
    add r42 r72 into r73;
    set r73 into owed_commission[0u8];
    cast r72 into r74 as u128;
    add r47 r74 into r75;
    add r59 r56 into r76;
    set r76 into balances[0u8];
    cast r76 into r77 as u128;
    cast r63 into r78 as u128;
    cast r2 into r79 as u128;
    add r77 r78 into r80;
    add r80 r79 into r81;
    mul r75 r81 into r82;
    div r82 r80 into r83;
    sub r83 r75 into r84;
    cast r84 into r85 as u64;
    gte r85 r3 into r86;
    assert.eq r86 true;




function deposit_public:
    input r0 as u64.public;
    input r1 as u64.public;
    input r2 as address.public;
    gte r1 1u64 into r3;
    assert.eq r3 true;
    cast r0 into r4 as u128;
    call multi_token_support_program.aleo/transfer_from_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field self.caller pondo_core_protocol.aleo r4 into r5;
    call mtsp_credits.aleo/withdraw_credits_public r0 into r6;
    cast r1 into r7 as u128;
    call multi_token_support_program.aleo/mint_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.caller r7 4294967295u32 into r8;
    async deposit_public r5 r6 r8 r0 r1 into r9;
    output r9 as pondo_core_protocol.aleo/deposit_public.future;

finalize deposit_public:
    input r0 as multi_token_support_program.aleo/transfer_from_public.future;
    input r1 as mtsp_credits.aleo/withdraw_credits_public.future;
    input r2 as multi_token_support_program.aleo/mint_public.future;
    input r3 as u64.public;
    input r4 as u64.public;
    await r0;
    await r1;
    await r2;
    get protocol_state[0u8] into r5;
    is.neq r5 2u8 into r6;
    assert.eq r6 true;
    cast pondo_core_protocol.aleo 0u64 into r7 as bond_state;
    get.or_use credits.aleo/bonded[pondo_delegator1.aleo] r7 into r8;
    get.or_use credits.aleo/bonded[pondo_delegator2.aleo] r7 into r9;
    get.or_use credits.aleo/bonded[pondo_delegator3.aleo] r7 into r10;
    get.or_use credits.aleo/bonded[pondo_delegator4.aleo] r7 into r11;
    get.or_use credits.aleo/bonded[pondo_delegator5.aleo] r7 into r12;
    cast 0u64 0u32 into r13 as unbond_state;
    get.or_use credits.aleo/unbonding[pondo_delegator1.aleo] r13 into r14;
    get.or_use credits.aleo/unbonding[pondo_delegator2.aleo] r13 into r15;
    get.or_use credits.aleo/unbonding[pondo_delegator3.aleo] r13 into r16;
    get.or_use credits.aleo/unbonding[pondo_delegator4.aleo] r13 into r17;
    get.or_use credits.aleo/unbonding[pondo_delegator5.aleo] r13 into r18;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r19;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r20;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r21;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r22;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r23;
    add r8.microcredits r9.microcredits into r24;
    add r24 r10.microcredits into r25;
    add r25 r11.microcredits into r26;
    add r26 r12.microcredits into r27;
    add r19 r20 into r28;
    add r28 r21 into r29;
    add r29 r22 into r30;
    add r30 r23 into r31;
    add r14.microcredits r15.microcredits into r32;
    add r32 r16.microcredits into r33;
    add r33 r17.microcredits into r34;
    add r34 r18.microcredits into r35;
    get balances[1u8] into r36;
    add r27 r31 into r37;
    add r37 r35 into r38;
    sub r38 r36 into r39;
    get balances[0u8] into r40;
    gt r40 r39 into r41;
    ternary r41 r39 r40 into r42;
    get owed_commission[0u8] into r43;
    get multi_token_support_program.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r44;
    cast r43 into r45 as u128;
    add r44.supply r45 into r46;
    cast r4 into r47 as u128;
    sub r46 r47 into r48;
    gt r39 r42 into r49;
    cast r39 into r50 as i64;
    cast r42 into r51 as i64;
    sub r50 r51 into r52;
    ternary r49 r52 0i64 into r53;
    cast r53 into r54 as u128;
    mul r54 1000u128 into r55;
    div r55 10_000u128 into r56;
    cast r56 into r57 as u64;
    cast r53 into r58 as u64;
    sub r58 r57 into r59;
    add r42 r59 into r60;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r61;
    get balances[2u8] into r62;
    sub r61 r3 into r63;
    sub r63 r62 into r64;
    cast r60 into r65 as u128;
    cast r64 into r66 as u128;
    cast r57 into r67 as u128;
    add r65 r66 into r68;
    add r68 r67 into r69;
    mul r48 r69 into r70;
    div r70 r68 into r71;
    sub r71 r48 into r72;
    cast r72 into r73 as u64;
    add r43 r73 into r74;
    set r74 into owed_commission[0u8];
    cast r73 into r75 as u128;
    add r48 r75 into r76;
    add r60 r57 into r77;
    set r77 into balances[0u8];
    cast r77 into r78 as u128;
    cast r64 into r79 as u128;
    cast r3 into r80 as u128;
    add r78 r79 into r81;
    add r81 r80 into r82;
    mul r76 r82 into r83;
    div r83 r81 into r84;
    sub r84 r76 into r85;
    cast r85 into r86 as u64;
    gte r86 r4 into r87;
    assert.eq r87 true;






function distribute_deposits:
    input r0 as [u64; 5u32].public;
    gte r0[0u32] 1_000_000u64 into r1;
    assert.eq r1 true;
    gte r0[1u32] 1_000_000u64 into r2;
    assert.eq r2 true;
    gte r0[2u32] 1_000_000u64 into r3;
    assert.eq r3 true;
    gte r0[3u32] 1_000_000u64 into r4;
    assert.eq r4 true;
    gte r0[4u32] 1_000_000u64 into r5;
    assert.eq r5 true;
    call credits.aleo/transfer_public pondo_delegator1.aleo r0[0u32] into r6;
    call credits.aleo/transfer_public pondo_delegator2.aleo r0[1u32] into r7;
    call credits.aleo/transfer_public pondo_delegator3.aleo r0[2u32] into r8;
    call credits.aleo/transfer_public pondo_delegator4.aleo r0[3u32] into r9;
    call credits.aleo/transfer_public pondo_delegator5.aleo r0[4u32] into r10;
    async distribute_deposits r6 r7 r8 r9 r10 r0 into r11;
    output r11 as pondo_core_protocol.aleo/distribute_deposits.future;

finalize distribute_deposits:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as credits.aleo/transfer_public.future;
    input r2 as credits.aleo/transfer_public.future;
    input r3 as credits.aleo/transfer_public.future;
    input r4 as credits.aleo/transfer_public.future;
    input r5 as [u64; 5u32].public;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    get protocol_state[0u8] into r6;
    is.eq r6 0u8 into r7;
    assert.eq r7 true;
    get balances[0u8] into r8;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r9;
    get balances[2u8] into r10;
    sub r9 r10 into r11;
    cast r8 into r12 as u128;
    mul r12 250u128 into r13;
    div r13 10_000u128 into r14;
    cast 250_000_000_000u64 into r15 as u128;
    gt r14 r15 into r16;
    cast r14 into r17 as u64;
    ternary r16 250_000_000_000u64 r17 into r18;
    gte r11 r18 into r19;
    assert.eq r19 true;
    cast  3700u128 2600u128 1600u128 1200u128 900u128 900u128 900u128 900u128 900u128 900u128 into r20 as [u128; 10u32];
    get.or_use pondo_oracle.aleo/delegator_allocation[0u8] r20 into r21;
    add r5[0u32] r5[1u32] into r22;
    add r22 r5[2u32] into r23;
    add r23 r5[3u32] into r24;
    add r24 r5[4u32] into r25;
    cast r25 into r26 as u128;
    cast r5[0u32] into r27 as u128;
    mul r27 10_000u128 into r28;
    div r28 r26 into r29;
    cast r5[1u32] into r30 as u128;
    mul r30 10_000u128 into r31;
    div r31 r26 into r32;
    cast r5[2u32] into r33 as u128;
    mul r33 10_000u128 into r34;
    div r34 r26 into r35;
    cast r5[3u32] into r36 as u128;
    mul r36 10_000u128 into r37;
    div r37 r26 into r38;
    cast r5[4u32] into r39 as u128;
    mul r39 10_000u128 into r40;
    div r40 r26 into r41;
    sub r21[0u32] r29 into r42;
    lte r42 2u128 into r43;
    assert.eq r43 true;
    sub r21[1u32] r32 into r44;
    lte r44 2u128 into r45;
    assert.eq r45 true;
    sub r21[2u32] r35 into r46;
    lte r46 2u128 into r47;
    assert.eq r47 true;
    sub r21[3u32] r38 into r48;
    lte r48 2u128 into r49;
    assert.eq r49 true;
    sub r21[4u32] r41 into r50;
    lte r50 2u128 into r51;
    assert.eq r51 true;
    add r8 r25 into r52;
    set r52 into balances[0u8];






function instant_withdraw_public:
    input r0 as u64.public;
    input r1 as u64.public;
    cast r0 into r2 as u128;
    call multi_token_support_program.aleo/burn_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.caller r2 into r3;
    call credits.aleo/transfer_public self.caller r1 into r4;
    async instant_withdraw_public r3 r4 r0 r1 self.caller into r5;
    output r5 as pondo_core_protocol.aleo/instant_withdraw_public.future;

finalize instant_withdraw_public:
    input r0 as multi_token_support_program.aleo/burn_public.future;
    input r1 as credits.aleo/transfer_public.future;
    input r2 as u64.public;
    input r3 as u64.public;
    input r4 as address.public;
    await r0;
    await r1;
    get protocol_state[0u8] into r5;
    is.neq r5 2u8 into r6;
    assert.eq r6 true;
    contains withdrawals[r4] into r7;
    not r7 into r8;
    assert.eq r8 true;
    cast pondo_core_protocol.aleo 0u64 into r9 as bond_state;
    get.or_use credits.aleo/bonded[pondo_delegator1.aleo] r9 into r10;
    get.or_use credits.aleo/bonded[pondo_delegator2.aleo] r9 into r11;
    get.or_use credits.aleo/bonded[pondo_delegator3.aleo] r9 into r12;
    get.or_use credits.aleo/bonded[pondo_delegator4.aleo] r9 into r13;
    get.or_use credits.aleo/bonded[pondo_delegator5.aleo] r9 into r14;
    cast 0u64 0u32 into r15 as unbond_state;
    get.or_use credits.aleo/unbonding[pondo_delegator1.aleo] r15 into r16;
    get.or_use credits.aleo/unbonding[pondo_delegator2.aleo] r15 into r17;
    get.or_use credits.aleo/unbonding[pondo_delegator3.aleo] r15 into r18;
    get.or_use credits.aleo/unbonding[pondo_delegator4.aleo] r15 into r19;
    get.or_use credits.aleo/unbonding[pondo_delegator5.aleo] r15 into r20;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r21;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r22;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r23;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r24;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r25;
    add r10.microcredits r11.microcredits into r26;
    add r26 r12.microcredits into r27;
    add r27 r13.microcredits into r28;
    add r28 r14.microcredits into r29;
    add r21 r22 into r30;
    add r30 r23 into r31;
    add r31 r24 into r32;
    add r32 r25 into r33;
    add r16.microcredits r17.microcredits into r34;
    add r34 r18.microcredits into r35;
    add r35 r19.microcredits into r36;
    add r36 r20.microcredits into r37;
    get balances[1u8] into r38;
    add r29 r33 into r39;
    add r39 r37 into r40;
    sub r40 r38 into r41;
    get balances[0u8] into r42;
    gt r42 r41 into r43;
    ternary r43 r41 r42 into r44;
    get owed_commission[0u8] into r45;
    get multi_token_support_program.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r46;
    cast r45 into r47 as u128;
    add r46.supply r47 into r48;
    cast r2 into r49 as u128;
    add r48 r49 into r50;
    gt r41 r44 into r51;
    cast r41 into r52 as i64;
    cast r44 into r53 as i64;
    sub r52 r53 into r54;
    ternary r51 r54 0i64 into r55;
    cast r55 into r56 as u128;
    mul r56 1000u128 into r57;
    div r57 10_000u128 into r58;
    cast r58 into r59 as u64;
    cast r55 into r60 as u64;
    sub r60 r59 into r61;
    add r44 r61 into r62;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r63;
    get balances[2u8] into r64;
    gte r63 r64 into r65;
    assert.eq r65 true;
    sub r63 r64 into r66;
    add r66 r3 into r67;
    cast r62 into r68 as u128;
    cast r67 into r69 as u128;
    cast r59 into r70 as u128;
    add r68 r69 into r71;
    add r71 r70 into r72;
    mul r50 r72 into r73;
    div r73 r71 into r74;
    sub r74 r50 into r75;
    cast r75 into r76 as u64;
    add r45 r76 into r77;
    cast r76 into r78 as u128;
    add r50 r78 into r79;
    add r62 r59 into r80;
    set r80 into balances[0u8];
    cast r80 into r81 as u128;
    cast r67 into r82 as u128;
    add r81 r82 into r83;
    cast r2 into r84 as u128;
    mul r84 025u128 into r85;
    div r85 10_000u128 into r86;
    cast r86 into r87 as u64;
    sub r2 r87 into r88;
    cast r88 into r89 as u128;
    cast r83 into r90 as u128;
    mul r89 r90 into r91;
    cast r79 into r92 as u128;
    div r91 r92 into r93;
    cast r93 into r94 as u64;
    lte r3 r94 into r95;
    assert.eq r95 true;
    add r77 r87 into r96;
    set r96 into owed_commission[0u8];




function instant_withdraw_public_signer:
    input r0 as u64.public;
    input r1 as u64.public;
    cast r0 into r2 as u128;
    call multi_token_support_program.aleo/burn_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.signer r2 into r3;
    call credits.aleo/transfer_public self.signer r1 into r4;
    async instant_withdraw_public_signer r3 r4 r0 r1 self.signer into r5;
    output r5 as pondo_core_protocol.aleo/instant_withdraw_public_signer.future;

finalize instant_withdraw_public_signer:
    input r0 as multi_token_support_program.aleo/burn_public.future;
    input r1 as credits.aleo/transfer_public.future;
    input r2 as u64.public;
    input r3 as u64.public;
    input r4 as address.public;
    await r0;
    await r1;
    get protocol_state[0u8] into r5;
    is.neq r5 2u8 into r6;
    assert.eq r6 true;
    contains withdrawals[r4] into r7;
    not r7 into r8;
    assert.eq r8 true;
    cast pondo_core_protocol.aleo 0u64 into r9 as bond_state;
    get.or_use credits.aleo/bonded[pondo_delegator1.aleo] r9 into r10;
    get.or_use credits.aleo/bonded[pondo_delegator2.aleo] r9 into r11;
    get.or_use credits.aleo/bonded[pondo_delegator3.aleo] r9 into r12;
    get.or_use credits.aleo/bonded[pondo_delegator4.aleo] r9 into r13;
    get.or_use credits.aleo/bonded[pondo_delegator5.aleo] r9 into r14;
    cast 0u64 0u32 into r15 as unbond_state;
    get.or_use credits.aleo/unbonding[pondo_delegator1.aleo] r15 into r16;
    get.or_use credits.aleo/unbonding[pondo_delegator2.aleo] r15 into r17;
    get.or_use credits.aleo/unbonding[pondo_delegator3.aleo] r15 into r18;
    get.or_use credits.aleo/unbonding[pondo_delegator4.aleo] r15 into r19;
    get.or_use credits.aleo/unbonding[pondo_delegator5.aleo] r15 into r20;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r21;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r22;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r23;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r24;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r25;
    add r10.microcredits r11.microcredits into r26;
    add r26 r12.microcredits into r27;
    add r27 r13.microcredits into r28;
    add r28 r14.microcredits into r29;
    add r21 r22 into r30;
    add r30 r23 into r31;
    add r31 r24 into r32;
    add r32 r25 into r33;
    add r16.microcredits r17.microcredits into r34;
    add r34 r18.microcredits into r35;
    add r35 r19.microcredits into r36;
    add r36 r20.microcredits into r37;
    get balances[1u8] into r38;
    add r29 r33 into r39;
    add r39 r37 into r40;
    sub r40 r38 into r41;
    get balances[0u8] into r42;
    gt r42 r41 into r43;
    ternary r43 r41 r42 into r44;
    get owed_commission[0u8] into r45;
    get multi_token_support_program.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r46;
    cast r45 into r47 as u128;
    add r46.supply r47 into r48;
    cast r2 into r49 as u128;
    add r48 r49 into r50;
    gt r41 r44 into r51;
    cast r41 into r52 as i64;
    cast r44 into r53 as i64;
    sub r52 r53 into r54;
    ternary r51 r54 0i64 into r55;
    cast r55 into r56 as u128;
    mul r56 1000u128 into r57;
    div r57 10_000u128 into r58;
    cast r58 into r59 as u64;
    cast r55 into r60 as u64;
    sub r60 r59 into r61;
    add r44 r61 into r62;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r63;
    get balances[2u8] into r64;
    gte r63 r64 into r65;
    assert.eq r65 true;
    sub r63 r64 into r66;
    add r66 r3 into r67;
    cast r62 into r68 as u128;
    cast r67 into r69 as u128;
    cast r59 into r70 as u128;
    add r68 r69 into r71;
    add r71 r70 into r72;
    mul r50 r72 into r73;
    div r73 r71 into r74;
    sub r74 r50 into r75;
    cast r75 into r76 as u64;
    add r45 r76 into r77;
    cast r76 into r78 as u128;
    add r50 r78 into r79;
    add r62 r59 into r80;
    set r80 into balances[0u8];
    cast r80 into r81 as u128;
    cast r67 into r82 as u128;
    add r81 r82 into r83;
    cast r2 into r84 as u128;
    mul r84 025u128 into r85;
    div r85 10_000u128 into r86;
    cast r86 into r87 as u64;
    sub r2 r87 into r88;
    cast r88 into r89 as u128;
    cast r83 into r90 as u128;
    mul r89 r90 into r91;
    cast r79 into r92 as u128;
    div r91 r92 into r93;
    cast r93 into r94 as u64;
    lte r3 r94 into r95;
    assert.eq r95 true;
    add r77 r87 into r96;
    set r96 into owed_commission[0u8];






function withdraw_public:
    input r0 as u64.public;
    cast r0 into r1 as u128;
    call multi_token_support_program.aleo/burn_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.caller r1 into r2;
    async withdraw_public r2 r0 self.caller into r3;
    output r3 as pondo_core_protocol.aleo/withdraw_public.future;

finalize withdraw_public:
    input r0 as multi_token_support_program.aleo/burn_public.future;
    input r1 as u64.public;
    input r2 as address.public;
    await r0;
    get protocol_state[0u8] into r3;
    is.neq r3 2u8 into r4;
    assert.eq r4 true;
    contains withdrawals[r2] into r5;
    not r5 into r6;
    assert.eq r6 true;
    cast pondo_core_protocol.aleo 0u64 into r7 as bond_state;
    get.or_use credits.aleo/bonded[pondo_delegator1.aleo] r7 into r8;
    get.or_use credits.aleo/bonded[pondo_delegator2.aleo] r7 into r9;
    get.or_use credits.aleo/bonded[pondo_delegator3.aleo] r7 into r10;
    get.or_use credits.aleo/bonded[pondo_delegator4.aleo] r7 into r11;
    get.or_use credits.aleo/bonded[pondo_delegator5.aleo] r7 into r12;
    cast 0u64 0u32 into r13 as unbond_state;
    get.or_use credits.aleo/unbonding[pondo_delegator1.aleo] r13 into r14;
    get.or_use credits.aleo/unbonding[pondo_delegator2.aleo] r13 into r15;
    get.or_use credits.aleo/unbonding[pondo_delegator3.aleo] r13 into r16;
    get.or_use credits.aleo/unbonding[pondo_delegator4.aleo] r13 into r17;
    get.or_use credits.aleo/unbonding[pondo_delegator5.aleo] r13 into r18;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r19;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r20;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r21;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r22;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r23;
    add r8.microcredits r9.microcredits into r24;
    add r24 r10.microcredits into r25;
    add r25 r11.microcredits into r26;
    add r26 r12.microcredits into r27;
    add r19 r20 into r28;
    add r28 r21 into r29;
    add r29 r22 into r30;
    add r30 r23 into r31;
    add r14.microcredits r15.microcredits into r32;
    add r32 r16.microcredits into r33;
    add r33 r17.microcredits into r34;
    add r34 r18.microcredits into r35;
    get balances[1u8] into r36;
    add r27 r31 into r37;
    add r37 r35 into r38;
    sub r38 r36 into r39;
    get balances[0u8] into r40;
    gt r40 r39 into r41;
    ternary r41 r39 r40 into r42;
    get owed_commission[0u8] into r43;
    get multi_token_support_program.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r44;
    cast r43 into r45 as u128;
    add r44.supply r45 into r46;
    cast r1 into r47 as u128;
    add r46 r47 into r48;
    cast r39 into r49 as i64;
    cast r42 into r50 as i64;
    gt r49 r50 into r51;
    cast r39 into r52 as i64;
    cast r42 into r53 as i64;
    sub r52 r53 into r54;
    ternary r51 r54 0i64 into r55;
    cast r55 into r56 as u128;
    mul r56 1000u128 into r57;
    div r57 10_000u128 into r58;
    cast r58 into r59 as u64;
    cast r55 into r60 as u64;
    sub r60 r59 into r61;
    add r42 r61 into r62;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r63;
    get balances[2u8] into r64;
    sub r63 r64 into r65;
    cast r62 into r66 as u128;
    cast r65 into r67 as u128;
    cast r59 into r68 as u128;
    add r66 r67 into r69;
    add r69 r68 into r70;
    mul r48 r70 into r71;
    div r71 r69 into r72;
    sub r72 r48 into r73;
    cast r73 into r74 as u64;
    add r43 r74 into r75;
    set r75 into owed_commission[0u8];
    cast r74 into r76 as u128;
    add r48 r76 into r77;
    add r62 r59 into r78;
    cast r78 into r79 as u128;
    cast r65 into r80 as u128;
    add r79 r80 into r81;
    cast r1 into r82 as u128;
    cast r81 into r83 as u128;
    mul r82 r83 into r84;
    cast r77 into r85 as u128;
    div r84 r85 into r86;
    cast r86 into r87 as u64;
    add r36 r87 into r88;
    set r88 into balances[1u8];
    sub r78 r87 into r89;
    set r89 into balances[0u8];
    add block.height 43_200u32 into r90;
    div r90 120_960u32 into r91;
    add r91 1u32 into r92;
    mul r92 120_960u32 into r93;
    add r93 17_280u32 into r94;
    add r94 1u32 into r95;
    cast r87 r95 into r96 as withdrawal_state;
    set r96 into withdrawals[r2];




function withdraw_public_as_signer:
    input r0 as u64.public;
    cast r0 into r1 as u128;
    call multi_token_support_program.aleo/burn_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field self.signer r1 into r2;
    async withdraw_public_as_signer r2 r0 self.signer into r3;
    output r3 as pondo_core_protocol.aleo/withdraw_public_as_signer.future;

finalize withdraw_public_as_signer:
    input r0 as multi_token_support_program.aleo/burn_public.future;
    input r1 as u64.public;
    input r2 as address.public;
    await r0;
    get protocol_state[0u8] into r3;
    is.neq r3 2u8 into r4;
    assert.eq r4 true;
    contains withdrawals[r2] into r5;
    not r5 into r6;
    assert.eq r6 true;
    cast pondo_core_protocol.aleo 0u64 into r7 as bond_state;
    get.or_use credits.aleo/bonded[pondo_delegator1.aleo] r7 into r8;
    get.or_use credits.aleo/bonded[pondo_delegator2.aleo] r7 into r9;
    get.or_use credits.aleo/bonded[pondo_delegator3.aleo] r7 into r10;
    get.or_use credits.aleo/bonded[pondo_delegator4.aleo] r7 into r11;
    get.or_use credits.aleo/bonded[pondo_delegator5.aleo] r7 into r12;
    cast 0u64 0u32 into r13 as unbond_state;
    get.or_use credits.aleo/unbonding[pondo_delegator1.aleo] r13 into r14;
    get.or_use credits.aleo/unbonding[pondo_delegator2.aleo] r13 into r15;
    get.or_use credits.aleo/unbonding[pondo_delegator3.aleo] r13 into r16;
    get.or_use credits.aleo/unbonding[pondo_delegator4.aleo] r13 into r17;
    get.or_use credits.aleo/unbonding[pondo_delegator5.aleo] r13 into r18;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r19;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r20;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r21;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r22;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r23;
    add r8.microcredits r9.microcredits into r24;
    add r24 r10.microcredits into r25;
    add r25 r11.microcredits into r26;
    add r26 r12.microcredits into r27;
    add r19 r20 into r28;
    add r28 r21 into r29;
    add r29 r22 into r30;
    add r30 r23 into r31;
    add r14.microcredits r15.microcredits into r32;
    add r32 r16.microcredits into r33;
    add r33 r17.microcredits into r34;
    add r34 r18.microcredits into r35;
    get balances[1u8] into r36;
    add r27 r31 into r37;
    add r37 r35 into r38;
    sub r38 r36 into r39;
    get balances[0u8] into r40;
    gt r40 r39 into r41;
    ternary r41 r39 r40 into r42;
    get owed_commission[0u8] into r43;
    get multi_token_support_program.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r44;
    cast r43 into r45 as u128;
    add r44.supply r45 into r46;
    cast r1 into r47 as u128;
    add r46 r47 into r48;
    cast r39 into r49 as i64;
    cast r42 into r50 as i64;
    gt r49 r50 into r51;
    cast r39 into r52 as i64;
    cast r42 into r53 as i64;
    sub r52 r53 into r54;
    ternary r51 r54 0i64 into r55;
    cast r55 into r56 as u128;
    mul r56 1000u128 into r57;
    div r57 10_000u128 into r58;
    cast r58 into r59 as u64;
    cast r55 into r60 as u64;
    sub r60 r59 into r61;
    add r42 r61 into r62;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r63;
    get balances[2u8] into r64;
    sub r63 r64 into r65;
    cast r62 into r66 as u128;
    cast r65 into r67 as u128;
    cast r59 into r68 as u128;
    add r66 r67 into r69;
    add r69 r68 into r70;
    mul r48 r70 into r71;
    div r71 r69 into r72;
    sub r72 r48 into r73;
    cast r73 into r74 as u64;
    add r43 r74 into r75;
    set r75 into owed_commission[0u8];
    cast r74 into r76 as u128;
    add r48 r76 into r77;
    add r62 r59 into r78;
    cast r78 into r79 as u128;
    cast r65 into r80 as u128;
    add r79 r80 into r81;
    cast r1 into r82 as u128;
    cast r81 into r83 as u128;
    mul r82 r83 into r84;
    cast r77 into r85 as u128;
    div r84 r85 into r86;
    cast r86 into r87 as u64;
    add r36 r87 into r88;
    set r88 into balances[1u8];
    sub r78 r87 into r89;
    set r89 into balances[0u8];
    add block.height 43_200u32 into r90;
    div r90 120_960u32 into r91;
    add r91 1u32 into r92;
    mul r92 120_960u32 into r93;
    add r93 17_280u32 into r94;
    add r94 1u32 into r95;
    cast r87 r95 into r96 as withdrawal_state;
    set r96 into withdrawals[r2];




function claim_withdrawal_public:
    input r0 as address.public;
    input r1 as u64.public;
    call credits.aleo/transfer_public r0 r1 into r2;
    async claim_withdrawal_public r2 r0 r1 into r3;
    output r3 as pondo_core_protocol.aleo/claim_withdrawal_public.future;

finalize claim_withdrawal_public:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as address.public;
    input r2 as u64.public;
    await r0;
    get protocol_state[0u8] into r3;
    is.neq r3 2u8 into r4;
    assert.eq r4 true;
    get withdrawals[r1] into r5;
    lt r5.claim_block block.height into r6;
    assert.eq r6 true;
    is.eq r5.microcredits r2 into r7;
    branch.eq r7 false to end_then_0_0;
    remove withdrawals[r1];
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    sub r5.microcredits r2 into r8;
    cast r8 r5.claim_block into r9 as withdrawal_state;
    set r9 into withdrawals[r1];
    position end_otherwise_0_1;
    get balances[2u8] into r10;
    sub r10 r2 into r11;
    set r11 into balances[2u8];




function rebalance_retrieve_credits:
    input r0 as [u64; 5u32].public;
    input r1 as u64.public;
    gte r1 0u64 into r2;
    assert.eq r2 true;
    call pondo_delegator1.aleo/transfer_to_core_protocol r0[0u32] into r3;
    call pondo_delegator2.aleo/transfer_to_core_protocol r0[1u32] into r4;
    call pondo_delegator3.aleo/transfer_to_core_protocol r0[2u32] into r5;
    call pondo_delegator4.aleo/transfer_to_core_protocol r0[3u32] into r6;
    call pondo_delegator5.aleo/transfer_to_core_protocol r0[4u32] into r7;
    cast r1 into r8 as u128;
    call multi_token_support_program.aleo/mint_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field pondo_token.aleo r8 4294967295u32 into r9;
    async rebalance_retrieve_credits r3 r4 r5 r6 r7 r9 r0 r1 into r10;
    output r10 as pondo_core_protocol.aleo/rebalance_retrieve_credits.future;

finalize rebalance_retrieve_credits:
    input r0 as pondo_delegator1.aleo/transfer_to_core_protocol.future;
    input r1 as pondo_delegator2.aleo/transfer_to_core_protocol.future;
    input r2 as pondo_delegator3.aleo/transfer_to_core_protocol.future;
    input r3 as pondo_delegator4.aleo/transfer_to_core_protocol.future;
    input r4 as pondo_delegator5.aleo/transfer_to_core_protocol.future;
    input r5 as multi_token_support_program.aleo/mint_public.future;
    input r6 as [u64; 5u32].public;
    input r7 as u64.public;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    await r5;
    get balances[1u8] into r8;
    add r6[0u32] r6[1u32] into r9;
    add r9 r6[2u32] into r10;
    add r10 r6[3u32] into r11;
    add r11 r6[4u32] into r12;
    sub r12 r8 into r13;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r14;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r15;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r16;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r17;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r18;
    add r14 r15 into r19;
    add r19 r16 into r20;
    add r20 r17 into r21;
    add r21 r18 into r22;
    add r13 r22 into r23;
    get balances[0u8] into r24;
    gt r24 r23 into r25;
    ternary r25 r23 r24 into r26;
    get owed_commission[0u8] into r27;
    get multi_token_support_program.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r28;
    cast r27 into r29 as u128;
    add r28.supply r29 into r30;
    cast r7 into r31 as u128;
    sub r30 r31 into r32;
    gt r23 r26 into r33;
    cast r23 into r34 as i64;
    cast r26 into r35 as i64;
    sub r34 r35 into r36;
    ternary r33 r36 0i64 into r37;
    cast r37 into r38 as u128;
    mul r38 1000u128 into r39;
    div r39 10_000u128 into r40;
    cast r40 into r41 as u64;
    cast r37 into r42 as u64;
    sub r42 r41 into r43;
    add r26 r43 into r44;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r45;
    get balances[2u8] into r46;
    add r46 r8 into r47;
    set r47 into balances[2u8];
    set 0u64 into balances[1u8];
    sub r45 r13 into r48;
    sub r48 r46 into r49;
    cast r44 into r50 as u128;
    cast r49 into r51 as u128;
    cast r41 into r52 as u128;
    add r50 r51 into r53;
    add r53 r52 into r54;
    mul r32 r54 into r55;
    div r55 r53 into r56;
    sub r56 r32 into r57;
    cast r57 into r58 as u64;
    mul r27 98u64 into r59;
    div r59 100u64 into r60;
    gte r7 r60 into r61;
    assert.eq r61 true;
    add r27 r58 into r62;
    sub r62 r7 into r63;
    set r63 into owed_commission[0u8];
    add r44 r41 into r64;
    set r64 into balances[0u8];
    get protocol_state[0u8] into r65;
    is.eq r65 1u8 into r66;
    assert.eq r66 true;
    set 2u8 into protocol_state[0u8];




function rebalance_redistribute:
    input r0 as [validator_state; 5u32].public;
    input r1 as [u64; 5u32].public;
    call credits.aleo/transfer_public pondo_delegator1.aleo r1[0u32] into r2;
    call credits.aleo/transfer_public pondo_delegator2.aleo r1[1u32] into r3;
    call credits.aleo/transfer_public pondo_delegator3.aleo r1[2u32] into r4;
    call credits.aleo/transfer_public pondo_delegator4.aleo r1[3u32] into r5;
    call credits.aleo/transfer_public pondo_delegator5.aleo r1[4u32] into r6;
    call pondo_delegator1.aleo/set_validator r0[0u32].validator r0[0u32].commission into r7;
    call pondo_delegator2.aleo/set_validator r0[1u32].validator r0[1u32].commission into r8;
    call pondo_delegator3.aleo/set_validator r0[2u32].validator r0[2u32].commission into r9;
    call pondo_delegator4.aleo/set_validator r0[3u32].validator r0[3u32].commission into r10;
    call pondo_delegator5.aleo/set_validator r0[4u32].validator r0[4u32].commission into r11;
    async rebalance_redistribute r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r0 r1 into r12;
    output r12 as pondo_core_protocol.aleo/rebalance_redistribute.future;

finalize rebalance_redistribute:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as credits.aleo/transfer_public.future;
    input r2 as credits.aleo/transfer_public.future;
    input r3 as credits.aleo/transfer_public.future;
    input r4 as credits.aleo/transfer_public.future;
    input r5 as pondo_delegator1.aleo/set_validator.future;
    input r6 as pondo_delegator2.aleo/set_validator.future;
    input r7 as pondo_delegator3.aleo/set_validator.future;
    input r8 as pondo_delegator4.aleo/set_validator.future;
    input r9 as pondo_delegator5.aleo/set_validator.future;
    input r10 as [validator_state; 5u32].public;
    input r11 as [u64; 5u32].public;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    await r5;
    await r6;
    await r7;
    await r8;
    await r9;
    get validator_set[1u8] into r12;
    set r12 into validator_set[0u8];
    remove validator_set[1u8];
    is.eq r10[0u32].validator r12[0u32].validator into r13;
    is.eq r10[0u32].commission r12[0u32].commission into r14;
    and r13 r14 into r15;
    assert.eq r15 true;
    is.eq r10[1u32].validator r12[1u32].validator into r16;
    is.eq r10[1u32].commission r12[1u32].commission into r17;
    and r16 r17 into r18;
    assert.eq r18 true;
    is.eq r10[2u32].validator r12[2u32].validator into r19;
    is.eq r10[2u32].commission r12[2u32].commission into r20;
    and r19 r20 into r21;
    assert.eq r21 true;
    is.eq r10[3u32].validator r12[3u32].validator into r22;
    is.eq r10[3u32].commission r12[3u32].commission into r23;
    and r22 r23 into r24;
    assert.eq r24 true;
    is.eq r10[4u32].validator r12[4u32].validator into r25;
    is.eq r10[4u32].commission r12[4u32].commission into r26;
    and r25 r26 into r27;
    assert.eq r27 true;
    cast  3700u128 2600u128 1600u128 1200u128 900u128 900u128 900u128 900u128 900u128 900u128 into r28 as [u128; 10u32];
    get.or_use pondo_oracle.aleo/delegator_allocation[0u8] r28 into r29;
    add r11[0u32] r11[1u32] into r30;
    add r30 r11[2u32] into r31;
    add r31 r11[3u32] into r32;
    add r32 r11[4u32] into r33;
    cast r33 into r34 as u128;
    cast r11[0u32] into r35 as u128;
    mul r35 10_000u128 into r36;
    div r36 r34 into r37;
    cast r11[1u32] into r38 as u128;
    mul r38 10_000u128 into r39;
    div r39 r34 into r40;
    cast r11[2u32] into r41 as u128;
    mul r41 10_000u128 into r42;
    div r42 r34 into r43;
    cast r11[3u32] into r44 as u128;
    mul r44 10_000u128 into r45;
    div r45 r34 into r46;
    cast r11[4u32] into r47 as u128;
    mul r47 10_000u128 into r48;
    div r48 r34 into r49;
    sub r29[0u32] r37 into r50;
    lte r50 2u128 into r51;
    assert.eq r51 true;
    sub r29[1u32] r40 into r52;
    lte r52 2u128 into r53;
    assert.eq r53 true;
    sub r29[2u32] r43 into r54;
    lte r54 2u128 into r55;
    assert.eq r55 true;
    sub r29[3u32] r46 into r56;
    lte r56 2u128 into r57;
    assert.eq r57 true;
    sub r29[4u32] r49 into r58;
    lte r58 2u128 into r59;
    assert.eq r59 true;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r60;
    get balances[2u8] into r61;
    sub r60 r61 into r62;
    mul r34 250u128 into r63;
    div r63 10_000u128 into r64;
    cast 250_000_000_000u64 into r65 as u128;
    gt r64 r65 into r66;
    cast r64 into r67 as u64;
    ternary r66 250_000_000_000u64 r67 into r68;
    gte r62 r68 into r69;
    assert.eq r69 true;
    add r68 10_000_000u64 into r70;
    lte r62 r70 into r71;
    assert.eq r71 true;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r72;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r73;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r74;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r75;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r76;
    add r72 r73 into r77;
    add r77 r74 into r78;
    add r78 r75 into r79;
    add r79 r76 into r80;
    set r80 into balances[0u8];
    get protocol_state[0u8] into r81;
    is.eq r81 2u8 into r82;
    assert.eq r82 true;
    set 0u8 into protocol_state[0u8];




function set_oracle_tvl:
    input r0 as u64.public;
    call pondo_oracle.aleo/set_pondo_tvl r0 into r1;
    async set_oracle_tvl r1 r0 into r2;
    output r2 as pondo_core_protocol.aleo/set_oracle_tvl.future;

finalize set_oracle_tvl:
    input r0 as pondo_oracle.aleo/set_pondo_tvl.future;
    input r1 as u64.public;
    await r0;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r2;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r3;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r4;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r5;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r6;
    cast pondo_core_protocol.aleo 0u64 into r7 as bond_state;
    get.or_use credits.aleo/bonded[pondo_delegator1.aleo] r7 into r8;
    get.or_use credits.aleo/bonded[pondo_delegator2.aleo] r7 into r9;
    get.or_use credits.aleo/bonded[pondo_delegator3.aleo] r7 into r10;
    get.or_use credits.aleo/bonded[pondo_delegator4.aleo] r7 into r11;
    get.or_use credits.aleo/bonded[pondo_delegator5.aleo] r7 into r12;
    cast 0u64 0u32 into r13 as unbond_state;
    get.or_use credits.aleo/unbonding[pondo_delegator1.aleo] r13 into r14;
    get.or_use credits.aleo/unbonding[pondo_delegator2.aleo] r13 into r15;
    get.or_use credits.aleo/unbonding[pondo_delegator3.aleo] r13 into r16;
    get.or_use credits.aleo/unbonding[pondo_delegator4.aleo] r13 into r17;
    get.or_use credits.aleo/unbonding[pondo_delegator5.aleo] r13 into r18;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r19;
    add r2 r3 into r20;
    add r20 r4 into r21;
    add r21 r5 into r22;
    add r22 r6 into r23;
    add r23 r8.microcredits into r24;
    add r24 r9.microcredits into r25;
    add r25 r10.microcredits into r26;
    add r26 r11.microcredits into r27;
    add r27 r12.microcredits into r28;
    add r28 r19 into r29;
    add r29 r14.microcredits into r30;
    add r30 r15.microcredits into r31;
    add r31 r16.microcredits into r32;
    add r32 r17.microcredits into r33;
    add r33 r18.microcredits into r34;
    mul r1 98u64 into r35;
    div r35 100u64 into r36;
    gte r34 r36 into r37;
    mul r1 102u64 into r38;
    div r38 100u64 into r39;
    lte r34 r39 into r40;
    and r37 r40 into r41;
    assert.eq r41 true;

