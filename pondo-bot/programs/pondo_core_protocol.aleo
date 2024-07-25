import credits.aleo;
import multi_token_support_program_v1.aleo;
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


mapping withdrawal_batches:
	key as u32.public;
	value as u64.public;


function initialize:
    input r0 as u64.private;
    gte r0 102u64 into r1;
    assert.eq r1 true;
    call credits.aleo/transfer_public_as_signer pondo_core_protocol.aleo r0 into r2;
    call pondo_staked_aleo_token.aleo/register_token into r3;
    call pondo_staked_aleo_token.aleo/mint_public r0 self.signer into r4;
    call pondo_token.aleo/initialize_token into r5;
    call pondo_delegator1.aleo/initialize into r6;
    call pondo_delegator2.aleo/initialize into r7;
    call pondo_delegator3.aleo/initialize into r8;
    call pondo_delegator4.aleo/initialize into r9;
    call pondo_delegator5.aleo/initialize into r10;
    async initialize r2 r3 r4 r5 r6 r7 r8 r9 r10 r0 into r11;
    output r11 as pondo_core_protocol.aleo/initialize.future;

finalize initialize:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as pondo_staked_aleo_token.aleo/register_token.future;
    input r2 as pondo_staked_aleo_token.aleo/mint_public.future;
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
    set r9 into balances[0u8];
    set 0u64 into balances[1u8];
    set 0u64 into balances[2u8];
    set 0u64 into owed_commission[0u8];
    set 2u8 into protocol_state[0u8];
    cast  aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 into r10 as [address; 10u32];
    get.or_use pondo_oracle.aleo/top_validators[0u8] r10 into r11;
    cast aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0 0u32 0u64 0u128 40u8 0u128 into r12 as validator_datum;
    get.or_use pondo_oracle.aleo/validator_data[r11[0u32]] r12 into r13;
    get.or_use pondo_oracle.aleo/validator_data[r11[1u32]] r12 into r14;
    get.or_use pondo_oracle.aleo/validator_data[r11[2u32]] r12 into r15;
    get.or_use pondo_oracle.aleo/validator_data[r11[3u32]] r12 into r16;
    get.or_use pondo_oracle.aleo/validator_data[r11[4u32]] r12 into r17;
    cast r13.validator r13.commission into r18 as validator_state;
    cast r14.validator r14.commission into r19 as validator_state;
    cast r15.validator r15.commission into r20 as validator_state;
    cast r16.validator r16.commission into r21 as validator_state;
    cast r17.validator r17.commission into r22 as validator_state;
    cast  r18 r19 r20 r21 r22 into r23 as [validator_state; 5u32];
    set r23 into validator_set[1u8];
    div block.height 120_960u32 into r24;
    set r24 into last_rebalance_epoch[0u8];




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
    call pondo_staked_aleo_token.aleo/mint_public r1 self.signer into r5;
    async deposit_public_as_signer r4 r5 r0 r1 into r6;
    output r6 as pondo_core_protocol.aleo/deposit_public_as_signer.future;

finalize deposit_public_as_signer:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as pondo_staked_aleo_token.aleo/mint_public.future;
    input r2 as u64.public;
    input r3 as u64.public;
    await r0;
    await r1;
    cast pondo_core_protocol.aleo 0u64 into r4 as bond_state;
    get.or_use credits.aleo/bonded[pondo_delegator1.aleo] r4 into r5;
    get.or_use credits.aleo/bonded[pondo_delegator2.aleo] r4 into r6;
    get.or_use credits.aleo/bonded[pondo_delegator3.aleo] r4 into r7;
    get.or_use credits.aleo/bonded[pondo_delegator4.aleo] r4 into r8;
    get.or_use credits.aleo/bonded[pondo_delegator5.aleo] r4 into r9;
    cast 0u64 0u32 into r10 as unbond_state;
    get.or_use credits.aleo/unbonding[pondo_delegator1.aleo] r10 into r11;
    get.or_use credits.aleo/unbonding[pondo_delegator2.aleo] r10 into r12;
    get.or_use credits.aleo/unbonding[pondo_delegator3.aleo] r10 into r13;
    get.or_use credits.aleo/unbonding[pondo_delegator4.aleo] r10 into r14;
    get.or_use credits.aleo/unbonding[pondo_delegator5.aleo] r10 into r15;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r16;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r17;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r18;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r19;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r20;
    add r5.microcredits r6.microcredits into r21;
    add r21 r7.microcredits into r22;
    add r22 r8.microcredits into r23;
    add r23 r9.microcredits into r24;
    add r16 r17 into r25;
    add r25 r18 into r26;
    add r26 r19 into r27;
    add r27 r20 into r28;
    add r11.microcredits r12.microcredits into r29;
    add r29 r13.microcredits into r30;
    add r30 r14.microcredits into r31;
    add r31 r15.microcredits into r32;
    get balances[1u8] into r33;
    cast r24 into r34 as i64;
    cast r28 into r35 as i64;
    add r34 r35 into r36;
    cast r32 into r37 as i64;
    add r36 r37 into r38;
    cast r33 into r39 as i64;
    sub r38 r39 into r40;
    get balances[0u8] into r41;
    get owed_commission[0u8] into r42;
    get multi_token_support_program_v1.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r43;
    cast r42 into r44 as u128;
    add r43.supply r44 into r45;
    cast r3 into r46 as u128;
    sub r45 r46 into r47;
    cast r41 into r48 as i64;
    gt r40 r48 into r49;
    cast r41 into r50 as i64;
    sub r40 r50 into r51;
    ternary r49 r51 0i64 into r52;
    cast r52 into r53 as u128;
    mul r53 1000u128 into r54;
    div r54 10_000u128 into r55;
    cast r55 into r56 as u64;
    cast r52 into r57 as u64;
    sub r57 r56 into r58;
    add r41 r58 into r59;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r60;
    get balances[2u8] into r61;
    get protocol_state[0u8] into r62;
    is.neq r62 2u8 into r63;
    sub r60 r2 into r64;
    sub r64 r61 into r65;
    sub r60 r59 into r66;
    sub r66 r2 into r67;
    sub r67 r61 into r68;
    ternary r63 r65 r68 into r69;
    cast r59 into r70 as u128;
    cast r69 into r71 as u128;
    cast r56 into r72 as u128;
    add r70 r71 into r73;
    add r73 r72 into r74;
    mul r47 r74 into r75;
    div r75 r73 into r76;
    sub r76 r47 into r77;
    cast r77 into r78 as u64;
    add r42 r78 into r79;
    set r79 into owed_commission[0u8];
    cast r78 into r80 as u128;
    add r47 r80 into r81;
    add r59 r56 into r82;
    set r82 into balances[0u8];
    cast r82 into r83 as u128;
    cast r69 into r84 as u128;
    cast r2 into r85 as u128;
    add r83 r84 into r86;
    add r86 r85 into r87;
    mul r81 r87 into r88;
    div r88 r86 into r89;
    sub r89 r81 into r90;
    cast r90 into r91 as u64;
    gte r91 r3 into r92;
    assert.eq r92 true;




function deposit_public:
    input r0 as u64.public;
    input r1 as u64.public;
    input r2 as address.public;
    gte r1 1u64 into r3;
    assert.eq r3 true;
    cast r0 into r4 as u128;
    call multi_token_support_program_v1.aleo/transfer_from_public 3443843282313283355522573239085696902919850365217539366784739393210722344986field self.caller pondo_core_protocol.aleo r4 into r5;
    call multi_token_support_program_v1.aleo/withdraw_credits_public r0 into r6;
    call pondo_staked_aleo_token.aleo/mint_public r1 self.caller into r7;
    async deposit_public r5 r6 r7 r0 r1 into r8;
    output r8 as pondo_core_protocol.aleo/deposit_public.future;

finalize deposit_public:
    input r0 as multi_token_support_program_v1.aleo/transfer_from_public.future;
    input r1 as multi_token_support_program_v1.aleo/withdraw_credits_public.future;
    input r2 as pondo_staked_aleo_token.aleo/mint_public.future;
    input r3 as u64.public;
    input r4 as u64.public;
    await r0;
    await r1;
    await r2;
    cast pondo_core_protocol.aleo 0u64 into r5 as bond_state;
    get.or_use credits.aleo/bonded[pondo_delegator1.aleo] r5 into r6;
    get.or_use credits.aleo/bonded[pondo_delegator2.aleo] r5 into r7;
    get.or_use credits.aleo/bonded[pondo_delegator3.aleo] r5 into r8;
    get.or_use credits.aleo/bonded[pondo_delegator4.aleo] r5 into r9;
    get.or_use credits.aleo/bonded[pondo_delegator5.aleo] r5 into r10;
    cast 0u64 0u32 into r11 as unbond_state;
    get.or_use credits.aleo/unbonding[pondo_delegator1.aleo] r11 into r12;
    get.or_use credits.aleo/unbonding[pondo_delegator2.aleo] r11 into r13;
    get.or_use credits.aleo/unbonding[pondo_delegator3.aleo] r11 into r14;
    get.or_use credits.aleo/unbonding[pondo_delegator4.aleo] r11 into r15;
    get.or_use credits.aleo/unbonding[pondo_delegator5.aleo] r11 into r16;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r17;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r18;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r19;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r20;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r21;
    add r6.microcredits r7.microcredits into r22;
    add r22 r8.microcredits into r23;
    add r23 r9.microcredits into r24;
    add r24 r10.microcredits into r25;
    add r17 r18 into r26;
    add r26 r19 into r27;
    add r27 r20 into r28;
    add r28 r21 into r29;
    add r12.microcredits r13.microcredits into r30;
    add r30 r14.microcredits into r31;
    add r31 r15.microcredits into r32;
    add r32 r16.microcredits into r33;
    get balances[1u8] into r34;
    cast r25 into r35 as i64;
    cast r29 into r36 as i64;
    add r35 r36 into r37;
    cast r33 into r38 as i64;
    add r37 r38 into r39;
    cast r34 into r40 as i64;
    sub r39 r40 into r41;
    get balances[0u8] into r42;
    get owed_commission[0u8] into r43;
    get multi_token_support_program_v1.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r44;
    cast r43 into r45 as u128;
    add r44.supply r45 into r46;
    cast r4 into r47 as u128;
    sub r46 r47 into r48;
    cast r42 into r49 as i64;
    gt r41 r49 into r50;
    cast r42 into r51 as i64;
    sub r41 r51 into r52;
    ternary r50 r52 0i64 into r53;
    cast r53 into r54 as u128;
    mul r54 1000u128 into r55;
    div r55 10_000u128 into r56;
    cast r56 into r57 as u64;
    cast r53 into r58 as u64;
    sub r58 r57 into r59;
    add r42 r59 into r60;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r61;
    get balances[2u8] into r62;
    get protocol_state[0u8] into r63;
    is.neq r63 2u8 into r64;
    sub r61 r3 into r65;
    sub r65 r62 into r66;
    sub r61 r60 into r67;
    sub r67 r3 into r68;
    sub r68 r62 into r69;
    ternary r64 r66 r69 into r70;
    cast r60 into r71 as u128;
    cast r70 into r72 as u128;
    cast r57 into r73 as u128;
    add r71 r72 into r74;
    add r74 r73 into r75;
    mul r48 r75 into r76;
    div r76 r74 into r77;
    sub r77 r48 into r78;
    cast r78 into r79 as u64;
    add r43 r79 into r80;
    set r80 into owed_commission[0u8];
    cast r79 into r81 as u128;
    add r48 r81 into r82;
    add r60 r57 into r83;
    set r83 into balances[0u8];
    cast r83 into r84 as u128;
    cast r70 into r85 as u128;
    cast r3 into r86 as u128;
    add r84 r85 into r87;
    add r87 r86 into r88;
    mul r82 r88 into r89;
    div r89 r87 into r90;
    sub r90 r82 into r91;
    cast r91 into r92 as u64;
    gte r92 r4 into r93;
    assert.eq r93 true;






function distribute_deposits:
    input r0 as [u64; 5u32].public;
    call credits.aleo/transfer_public pondo_delegator1.aleo r0[0u32] into r1;
    call credits.aleo/transfer_public pondo_delegator2.aleo r0[1u32] into r2;
    call credits.aleo/transfer_public pondo_delegator3.aleo r0[2u32] into r3;
    call credits.aleo/transfer_public pondo_delegator4.aleo r0[3u32] into r4;
    call credits.aleo/transfer_public pondo_delegator5.aleo r0[4u32] into r5;
    async distribute_deposits r1 r2 r3 r4 r5 into r6;
    output r6 as pondo_core_protocol.aleo/distribute_deposits.future;

finalize distribute_deposits:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as credits.aleo/transfer_public.future;
    input r2 as credits.aleo/transfer_public.future;
    input r3 as credits.aleo/transfer_public.future;
    input r4 as credits.aleo/transfer_public.future;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    get balances[0u8] into r5;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r6;
    get balances[2u8] into r7;
    sub r6 r7 into r8;
    cast r5 into r9 as u128;
    mul r9 250u128 into r10;
    div r10 10_000u128 into r11;
    cast 250_000_000_000u64 into r12 as u128;
    gt r11 r12 into r13;
    cast r11 into r14 as u64;
    ternary r13 250_000_000_000u64 r14 into r15;
    gte r8 r15 into r16;
    assert.eq r16 true;
    get pondo_delegator1.aleo/state_mapping[0u8] into r17;
    get pondo_delegator2.aleo/state_mapping[0u8] into r18;
    get pondo_delegator3.aleo/state_mapping[0u8] into r19;
    get pondo_delegator4.aleo/state_mapping[0u8] into r20;
    get pondo_delegator5.aleo/state_mapping[0u8] into r21;
    is.eq r17 0u8 into r22;
    is.eq r17 1u8 into r23;
    or r22 r23 into r24;
    assert.eq r24 true;
    is.eq r18 0u8 into r25;
    is.eq r18 1u8 into r26;
    or r25 r26 into r27;
    assert.eq r27 true;
    is.eq r19 0u8 into r28;
    is.eq r19 1u8 into r29;
    or r28 r29 into r30;
    assert.eq r30 true;
    is.eq r20 0u8 into r31;
    is.eq r20 1u8 into r32;
    or r31 r32 into r33;
    assert.eq r33 true;
    is.eq r21 0u8 into r34;
    is.eq r21 1u8 into r35;
    or r34 r35 into r36;
    assert.eq r36 true;






function instant_withdraw_public:
    input r0 as u64.public;
    input r1 as u64.public;
    call pondo_staked_aleo_token.aleo/burn_public r0 self.caller into r2;
    call credits.aleo/transfer_public self.caller r1 into r3;
    async instant_withdraw_public r2 r3 r0 r1 self.caller into r4;
    output r4 as pondo_core_protocol.aleo/instant_withdraw_public.future;

finalize instant_withdraw_public:
    input r0 as pondo_staked_aleo_token.aleo/burn_public.future;
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
    cast r29 into r39 as i64;
    cast r33 into r40 as i64;
    add r39 r40 into r41;
    cast r37 into r42 as i64;
    add r41 r42 into r43;
    cast r38 into r44 as i64;
    sub r43 r44 into r45;
    get balances[0u8] into r46;
    get owed_commission[0u8] into r47;
    get multi_token_support_program_v1.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r48;
    cast r47 into r49 as u128;
    add r48.supply r49 into r50;
    cast r2 into r51 as u128;
    add r50 r51 into r52;
    cast r46 into r53 as i64;
    gt r45 r53 into r54;
    cast r46 into r55 as i64;
    sub r45 r55 into r56;
    ternary r54 r56 0i64 into r57;
    cast r57 into r58 as u128;
    mul r58 1000u128 into r59;
    div r59 10_000u128 into r60;
    cast r60 into r61 as u64;
    cast r57 into r62 as u64;
    sub r62 r61 into r63;
    add r46 r63 into r64;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r65;
    get balances[2u8] into r66;
    sub r65 r66 into r67;
    add r67 r3 into r68;
    cast r64 into r69 as u128;
    cast r68 into r70 as u128;
    cast r61 into r71 as u128;
    add r69 r70 into r72;
    add r72 r71 into r73;
    mul r52 r73 into r74;
    div r74 r72 into r75;
    sub r75 r52 into r76;
    cast r76 into r77 as u64;
    add r47 r77 into r78;
    cast r77 into r79 as u128;
    add r52 r79 into r80;
    add r64 r61 into r81;
    cast r81 into r82 as u128;
    cast r68 into r83 as u128;
    add r82 r83 into r84;
    cast r2 into r85 as u128;
    mul r85 025u128 into r86;
    div r86 10_000u128 into r87;
    cast r87 into r88 as u64;
    sub r2 r88 into r89;
    cast r89 into r90 as u128;
    cast r84 into r91 as u128;
    mul r90 r91 into r92;
    cast r80 into r93 as u128;
    div r92 r93 into r94;
    cast r94 into r95 as u64;
    lte r3 r95 into r96;
    assert.eq r96 true;
    add r78 r88 into r97;
    set r97 into owed_commission[0u8];






function withdraw_public:
    input r0 as u64.public;
    call pondo_staked_aleo_token.aleo/burn_public r0 self.caller into r1;
    async withdraw_public r1 r0 self.caller into r2;
    output r2 as pondo_core_protocol.aleo/withdraw_public.future;

finalize withdraw_public:
    input r0 as pondo_staked_aleo_token.aleo/burn_public.future;
    input r1 as u64.public;
    input r2 as address.public;
    await r0;
    contains withdrawals[r2] into r3;
    not r3 into r4;
    assert.eq r4 true;
    cast pondo_core_protocol.aleo 0u64 into r5 as bond_state;
    get.or_use credits.aleo/bonded[pondo_delegator1.aleo] r5 into r6;
    get.or_use credits.aleo/bonded[pondo_delegator2.aleo] r5 into r7;
    get.or_use credits.aleo/bonded[pondo_delegator3.aleo] r5 into r8;
    get.or_use credits.aleo/bonded[pondo_delegator4.aleo] r5 into r9;
    get.or_use credits.aleo/bonded[pondo_delegator5.aleo] r5 into r10;
    cast 0u64 0u32 into r11 as unbond_state;
    get.or_use credits.aleo/unbonding[pondo_delegator1.aleo] r11 into r12;
    get.or_use credits.aleo/unbonding[pondo_delegator2.aleo] r11 into r13;
    get.or_use credits.aleo/unbonding[pondo_delegator3.aleo] r11 into r14;
    get.or_use credits.aleo/unbonding[pondo_delegator4.aleo] r11 into r15;
    get.or_use credits.aleo/unbonding[pondo_delegator5.aleo] r11 into r16;
    get.or_use credits.aleo/account[pondo_delegator1.aleo] 0u64 into r17;
    get.or_use credits.aleo/account[pondo_delegator2.aleo] 0u64 into r18;
    get.or_use credits.aleo/account[pondo_delegator3.aleo] 0u64 into r19;
    get.or_use credits.aleo/account[pondo_delegator4.aleo] 0u64 into r20;
    get.or_use credits.aleo/account[pondo_delegator5.aleo] 0u64 into r21;
    add r6.microcredits r7.microcredits into r22;
    add r22 r8.microcredits into r23;
    add r23 r9.microcredits into r24;
    add r24 r10.microcredits into r25;
    add r17 r18 into r26;
    add r26 r19 into r27;
    add r27 r20 into r28;
    add r28 r21 into r29;
    add r12.microcredits r13.microcredits into r30;
    add r30 r14.microcredits into r31;
    add r31 r15.microcredits into r32;
    add r32 r16.microcredits into r33;
    get balances[1u8] into r34;
    cast r25 into r35 as i64;
    cast r29 into r36 as i64;
    add r35 r36 into r37;
    cast r33 into r38 as i64;
    add r37 r38 into r39;
    cast r34 into r40 as i64;
    sub r39 r40 into r41;
    get balances[0u8] into r42;
    get owed_commission[0u8] into r43;
    get multi_token_support_program_v1.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r44;
    cast r43 into r45 as u128;
    add r44.supply r45 into r46;
    cast r1 into r47 as u128;
    add r46 r47 into r48;
    cast r42 into r49 as i64;
    gt r41 r49 into r50;
    cast r42 into r51 as i64;
    sub r41 r51 into r52;
    ternary r50 r52 0i64 into r53;
    cast r53 into r54 as u128;
    mul r54 1000u128 into r55;
    div r55 10_000u128 into r56;
    cast r56 into r57 as u64;
    cast r53 into r58 as u64;
    sub r58 r57 into r59;
    add r42 r59 into r60;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r61;
    get balances[2u8] into r62;
    get protocol_state[0u8] into r63;
    is.neq r63 2u8 into r64;
    sub r61 r62 into r65;
    sub r61 r60 into r66;
    sub r66 r62 into r67;
    ternary r64 r65 r67 into r68;
    cast r60 into r69 as u128;
    cast r68 into r70 as u128;
    cast r57 into r71 as u128;
    add r69 r70 into r72;
    add r72 r71 into r73;
    mul r48 r73 into r74;
    div r74 r72 into r75;
    sub r75 r48 into r76;
    cast r76 into r77 as u64;
    add r43 r77 into r78;
    set r78 into owed_commission[0u8];
    cast r77 into r79 as u128;
    add r48 r79 into r80;
    add r60 r57 into r81;
    cast r81 into r82 as u128;
    cast r68 into r83 as u128;
    add r82 r83 into r84;
    cast r1 into r85 as u128;
    cast r84 into r86 as u128;
    mul r85 r86 into r87;
    cast r80 into r88 as u128;
    div r87 r88 into r89;
    cast r89 into r90 as u64;
    add r34 r90 into r91;
    set r91 into balances[1u8];
    sub r81 r90 into r92;
    set r92 into balances[0u8];
    add block.height 43_200u32 into r93;
    div r93 120_960u32 into r94;
    add r94 1u32 into r95;
    mul r95 120_960u32 into r96;
    add r96 17_280u32 into r97;
    add r97 1u32 into r98;
    cast r90 r98 into r99 as withdrawal_state;
    set r99 into withdrawals[r2];
    get.or_use withdrawal_batches[r94] 0u64 into r100;
    add r100 r90 into r101;
    set r101 into withdrawal_batches[r94];




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
    get withdrawals[r1] into r3;
    lt r3.claim_block block.height into r4;
    assert.eq r4 true;
    is.eq r3.microcredits r2 into r5;
    branch.eq r5 false to end_then_0_0;
    remove withdrawals[r1];
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    sub r3.microcredits r2 into r6;
    cast r6 r3.claim_block into r7 as withdrawal_state;
    set r7 into withdrawals[r1];
    position end_otherwise_0_1;
    get balances[2u8] into r8;
    sub r8 r2 into r9;
    set r9 into balances[2u8];




function rebalance_retrieve_credits:
    input r0 as [u64; 5u32].public;
    input r1 as u64.public;
    call pondo_delegator1.aleo/transfer_to_core_protocol r0[0u32] into r2;
    call pondo_delegator2.aleo/transfer_to_core_protocol r0[1u32] into r3;
    call pondo_delegator3.aleo/transfer_to_core_protocol r0[2u32] into r4;
    call pondo_delegator4.aleo/transfer_to_core_protocol r0[3u32] into r5;
    call pondo_delegator5.aleo/transfer_to_core_protocol r0[4u32] into r6;
    call pondo_staked_aleo_token.aleo/mint_public r1 pondo_token.aleo into r7;
    async rebalance_retrieve_credits r2 r3 r4 r5 r6 r7 r0 r1 into r8;
    output r8 as pondo_core_protocol.aleo/rebalance_retrieve_credits.future;

finalize rebalance_retrieve_credits:
    input r0 as pondo_delegator1.aleo/transfer_to_core_protocol.future;
    input r1 as pondo_delegator2.aleo/transfer_to_core_protocol.future;
    input r2 as pondo_delegator3.aleo/transfer_to_core_protocol.future;
    input r3 as pondo_delegator4.aleo/transfer_to_core_protocol.future;
    input r4 as pondo_delegator5.aleo/transfer_to_core_protocol.future;
    input r5 as pondo_staked_aleo_token.aleo/mint_public.future;
    input r6 as [u64; 5u32].public;
    input r7 as u64.public;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    await r5;
    add r6[0u32] r6[1u32] into r8;
    add r8 r6[2u32] into r9;
    add r9 r6[3u32] into r10;
    add r10 r6[4u32] into r11;
    get balances[0u8] into r12;
    get owed_commission[0u8] into r13;
    get multi_token_support_program_v1.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842600field] into r14;
    cast r13 into r15 as u128;
    add r14.supply r15 into r16;
    cast r7 into r17 as u128;
    sub r16 r17 into r18;
    gt r11 r12 into r19;
    cast r11 into r20 as i64;
    cast r12 into r21 as i64;
    sub r20 r21 into r22;
    ternary r19 r22 0i64 into r23;
    cast r23 into r24 as u128;
    mul r24 1000u128 into r25;
    div r25 10_000u128 into r26;
    cast r26 into r27 as u64;
    cast r23 into r28 as u64;
    sub r28 r27 into r29;
    add r12 r29 into r30;
    get.or_use credits.aleo/account[pondo_core_protocol.aleo] 0u64 into r31;
    get balances[2u8] into r32;
    sub r31 r11 into r33;
    sub r33 r32 into r34;
    cast r30 into r35 as u128;
    cast r34 into r36 as u128;
    cast r27 into r37 as u128;
    add r35 r36 into r38;
    add r38 r37 into r39;
    mul r18 r39 into r40;
    div r40 r38 into r41;
    sub r41 r18 into r42;
    cast r42 into r43 as u64;
    add r13 r43 into r44;
    sub r44 r7 into r45;
    set r45 into owed_commission[0u8];
    add r30 r27 into r46;
    set r46 into balances[0u8];
    div block.height 120_960u32 into r47;
    sub r47 1u32 into r48;
    get.or_use withdrawal_batches[r48] 0u64 into r49;
    add r32 r49 into r50;
    set r50 into balances[2u8];
    get balances[1u8] into r51;
    sub r51 r49 into r52;
    set r52 into balances[1u8];
    get protocol_state[0u8] into r53;
    is.eq r53 1u8 into r54;
    assert.eq r54 true;
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
    add r68 250u64 into r70;
    lte r62 r70 into r71;
    assert.eq r71 true;
    set r33 into balances[0u8];
    get protocol_state[0u8] into r72;
    is.eq r72 2u8 into r73;
    assert.eq r73 true;
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

