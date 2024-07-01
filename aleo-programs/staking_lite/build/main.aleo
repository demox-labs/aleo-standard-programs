import credits.aleo;
program staking_lite.aleo;





struct withdrawal_state:
    microcredits as u64;
    claim_block as u32;


mapping commission_percent:
	key as u8.public;
	value as u128.public;


mapping validator:
	key as u8.public;
	value as address.public;


mapping state:
	key as u8.public;
	value as u8.public;


mapping is_initalized:
	key as u8.public;
	value as u8.public;


mapping total_shares:
	key as u8.public;
	value as u64.public;


mapping delegator_shares:
	key as address.public;
	value as u64.public;


mapping total_balance:
	key as u8.public;
	value as u64.public;


mapping pending_withdrawal:
	key as u8.public;
	value as u64.public;


mapping current_batch_height:
	key as u8.public;
	value as u32.public;


mapping withdrawals:
	key as address.public;
	value as withdrawal_state.public;

function initialize:
    input r0 as u128.private;
    input r1 as address.private;
    assert.eq self.caller aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru;
    lt r0 1000u128 into r2;
    assert.eq r2 true;
    async initialize r0 r1 into r3;
    output r3 as staking_lite.aleo/initialize.future;

finalize initialize:
    input r0 as u128.public;
    input r1 as address.public;
    get.or_use is_initalized[0u8] 0u8 into r2;
    assert.eq r2 0u8;
    set 1u8 into is_initalized[0u8];
    set r0 into commission_percent[0u8];
    set r1 into validator[0u8];
    set 0u8 into state[0u8];
    set 0u64 into total_shares[0u8];
    set 0u64 into total_balance[0u8];
    set 0u64 into pending_withdrawal[0u8];
    set 0u32 into current_batch_height[0u8];


function initial_deposit:
    input r0 as credits.aleo/credits.record;
    input r1 as u64.private;
    input r2 as address.private;
    assert.eq self.caller aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru;
    call credits.aleo/transfer_private_to_public r0 aleo17hwvp7fl5da40hd29heasjjm537uqce489hhuc3lwhxfm0njucpq0rvfny r1 into r3 r4;
    call credits.aleo/bond_public r2 r1 into r5;
    async initial_deposit r4 r5 r1 into r6;
    output r3 as credits.aleo/credits.record;
    output r6 as staking_lite.aleo/initial_deposit.future;

finalize initial_deposit:
    input r0 as credits.aleo/transfer_private_to_public.future;
    input r1 as credits.aleo/bond_public.future;
    input r2 as u64.public;
    await r0;
    await r1;
    get.or_use is_initalized[0u8] 0u8 into r3;
    assert.eq r3 1u8;
    get.or_use total_balance[0u8] 0u64 into r4;
    get.or_use total_shares[0u8] 0u64 into r5;
    get.or_use pending_withdrawal[0u8] 0u64 into r6;
    assert.eq r4 0u64;
    assert.eq r5 0u64;
    assert.eq r6 0u64;
    set r2 into total_balance[0u8];
    set r2 into total_shares[0u8];
    set r2 into delegator_shares[aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru];






function set_commission_percent:
    input r0 as u128.private;
    assert.eq self.caller aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru;
    lt r0 1000u128 into r1;
    assert.eq r1 true;
    lt r0 500u128 into r2;
    assert.eq r2 true;
    async set_commission_percent r0 into r3;
    output r3 as staking_lite.aleo/set_commission_percent.future;

finalize set_commission_percent:
    input r0 as u128.public;
    get.or_use is_initalized[0u8] 0u8 into r1;
    assert.eq r1 1u8;
    get state[0u8] into r2;
    assert.eq r2 0u8;
    get total_balance[0u8] into r3;
    get total_shares[0u8] into r4;
    sub 0u64 r3 into r5;
    get commission_percent[0u8] into r6;
    gt r5 0u64 into r7;
    cast r5 into r8 as u128;
    mul r8 r6 into r9;
    div r9 1000u128 into r10;
    cast r10 into r11 as u64;
    ternary r7 r11 0u64 into r12;
    sub r5 r12 into r13;
    add r3 r13 into r14;
    cast r14 into r15 as u128;
    cast r12 into r16 as u128;
    cast r4 into r17 as u128;
    gt r15 0u128 into r18;
    ternary r18 r15 1u128 into r19;
    mul r17 1000u128 into r20;
    div r20 r19 into r21;
    add r15 r16 into r22;
    mul r22 r21 into r23;
    div r23 1000u128 into r24;
    sub r24 r17 into r25;
    gt r15 0u128 into r26;
    cast r25 into r27 as u64;
    cast r16 into r28 as u64;
    ternary r26 r27 r28 into r29;
    get.or_use delegator_shares[aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru] 0u64 into r30;
    add r30 r29 into r31;
    set r31 into delegator_shares[aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru];
    add r4 r29 into r32;
    set r32 into total_shares[0u8];
    add r14 r12 into r33;
    set r33 into total_balance[0u8];
    set r0 into commission_percent[0u8];


function unbond_all:
    input r0 as u64.private;
    assert.eq self.caller aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru;
    call credits.aleo/unbond_public r0 into r1;
    async unbond_all r1 into r2;
    output r2 as staking_lite.aleo/unbond_all.future;

finalize unbond_all:
    input r0 as credits.aleo/unbond_public.future;
    await r0;
    get.or_use is_initalized[0u8] 0u8 into r1;
    assert.eq r1 1u8;
    get total_balance[0u8] into r2;
    assert.eq r2 0u64;
    set 1u8 into state[0u8];


function claim_all:
    assert.eq self.caller aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru;
    call credits.aleo/claim_unbond_public into r0;
    async claim_all r0 into r1;
    output r1 as staking_lite.aleo/claim_all.future;

finalize claim_all:
    input r0 as credits.aleo/claim_unbond_public.future;
    await r0;
    get.or_use is_initalized[0u8] 0u8 into r1;
    assert.eq r1 1u8;
    get state[0u8] into r2;
    assert.eq r2 1u8;
    set 2u8 into state[0u8];
    remove current_batch_height[0u8];


function bond_all:
    input r0 as address.private;
    input r1 as u64.private;
    assert.eq self.caller aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru;
    call credits.aleo/bond_public r0 r1 into r2;
    async bond_all r2 r0 r1 into r3;
    output r3 as staking_lite.aleo/bond_all.future;

finalize bond_all:
    input r0 as credits.aleo/bond_public.future;
    input r1 as address.public;
    input r2 as u64.public;
    await r0;
    get.or_use is_initalized[0u8] 0u8 into r3;
    assert.eq r3 1u8;
    get state[0u8] into r4;
    is.eq r4 0u8 into r5;
    is.eq r4 2u8 into r6;
    or r5 r6 into r7;
    assert.eq r7 true;
    assert.eq 0u64 0u64;
    get pending_withdrawal[0u8] into r8;
    sub 0u64 r8 into r9;
    lte r2 r9 into r10;
    assert.eq r10 true;
    set r1 into validator[0u8];
    set 0u8 into state[0u8];


function claim_commission:
    assert.eq self.caller aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru;
    async claim_commission into r0;
    output r0 as staking_lite.aleo/claim_commission.future;

finalize claim_commission:
    get.or_use is_initalized[0u8] 0u8 into r0;
    assert.eq r0 1u8;
    get state[0u8] into r1;
    assert.eq r1 0u8;
    get total_balance[0u8] into r2;
    get total_shares[0u8] into r3;
    sub 0u64 r2 into r4;
    get commission_percent[0u8] into r5;
    gt r4 0u64 into r6;
    cast r4 into r7 as u128;
    mul r7 r5 into r8;
    div r8 1000u128 into r9;
    cast r9 into r10 as u64;
    ternary r6 r10 0u64 into r11;
    sub r4 r11 into r12;
    add r2 r12 into r13;
    cast r13 into r14 as u128;
    cast r11 into r15 as u128;
    cast r3 into r16 as u128;
    gt r14 0u128 into r17;
    ternary r17 r14 1u128 into r18;
    mul r16 1000u128 into r19;
    div r19 r18 into r20;
    add r14 r15 into r21;
    mul r21 r20 into r22;
    div r22 1000u128 into r23;
    sub r23 r16 into r24;
    gt r14 0u128 into r25;
    cast r24 into r26 as u64;
    cast r15 into r27 as u64;
    ternary r25 r26 r27 into r28;
    get.or_use delegator_shares[aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru] 0u64 into r29;
    add r29 r28 into r30;
    set r30 into delegator_shares[aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru];
    add r3 r28 into r31;
    set r31 into total_shares[0u8];
    add r13 r11 into r32;
    set r32 into total_balance[0u8];


function deposit_public:
    input r0 as credits.aleo/credits.record;
    input r1 as u64.private;
    input r2 as address.private;
    input r3 as u64.private;
    input r4 as u64.private;
    call credits.aleo/transfer_private_to_public r0 aleo17hwvp7fl5da40hd29heasjjm537uqce489hhuc3lwhxfm0njucpq0rvfny r1 into r5 r6;
    call credits.aleo/bond_public r2 r1 into r7;
    async deposit_public r6 r7 self.caller r1 r2 r3 r4 into r8;
    output r5 as credits.aleo/credits.record;
    output r8 as staking_lite.aleo/deposit_public.future;

finalize deposit_public:
    input r0 as credits.aleo/transfer_private_to_public.future;
    input r1 as credits.aleo/bond_public.future;
    input r2 as address.public;
    input r3 as u64.public;
    input r4 as address.public;
    input r5 as u64.public;
    input r6 as u64.public;
    await r0;
    await r1;
    get.or_use is_initalized[0u8] 0u8 into r7;
    assert.eq r7 1u8;
    get validator[0u8] into r8;
    assert.eq r4 r8;
    get state[0u8] into r9;
    assert.eq r9 0u8;
    get total_balance[0u8] into r10;
    get total_shares[0u8] into r11;
    sub 0u64 r10 into r12;
    get commission_percent[0u8] into r13;
    gt r12 0u64 into r14;
    cast r12 into r15 as u128;
    mul r15 r13 into r16;
    div r16 1000u128 into r17;
    cast r17 into r18 as u64;
    ternary r14 r18 0u64 into r19;
    sub r12 r19 into r20;
    add r10 r20 into r21;
    cast r21 into r22 as u128;
    cast r19 into r23 as u128;
    cast r11 into r24 as u128;
    gt r22 0u128 into r25;
    ternary r25 r22 1u128 into r26;
    mul r24 1000u128 into r27;
    div r27 r26 into r28;
    add r22 r23 into r29;
    mul r29 r28 into r30;
    div r30 1000u128 into r31;
    sub r31 r24 into r32;
    gt r22 0u128 into r33;
    cast r32 into r34 as u64;
    cast r23 into r35 as u64;
    ternary r33 r34 r35 into r36;
    get.or_use delegator_shares[aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru] 0u64 into r37;
    add r37 r36 into r38;
    set r38 into delegator_shares[aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru];
    add r11 r36 into r39;
    add r21 r19 into r40;
    cast r40 into r41 as u128;
    cast r3 into r42 as u128;
    cast r39 into r43 as u128;
    gt r41 0u128 into r44;
    ternary r44 r41 1u128 into r45;
    mul r43 1000u128 into r46;
    div r46 r45 into r47;
    add r41 r42 into r48;
    mul r48 r47 into r49;
    div r49 1000u128 into r50;
    sub r50 r43 into r51;
    gt r41 0u128 into r52;
    cast r51 into r53 as u64;
    cast r42 into r54 as u64;
    ternary r52 r53 r54 into r55;
    gte r55 1u64 into r56;
    assert.eq r56 true;
    gte r55 r6 into r57;
    assert.eq r57 true;
    lte r55 r5 into r58;
    assert.eq r58 true;
    get.or_use delegator_shares[r2] 0u64 into r59;
    add r59 r55 into r60;
    set r60 into delegator_shares[r2];
    add r39 r55 into r61;
    set r61 into total_shares[0u8];
    add r40 r3 into r62;
    set r62 into total_balance[0u8];




function withdraw_public:
    input r0 as u64.private;
    input r1 as u64.private;
    call credits.aleo/unbond_public r1 into r2;
    async withdraw_public r2 r0 r1 self.caller into r3;
    output r3 as staking_lite.aleo/withdraw_public.future;

finalize withdraw_public:
    input r0 as credits.aleo/unbond_public.future;
    input r1 as u64.public;
    input r2 as u64.public;
    input r3 as address.public;
    await r0;
    get.or_use is_initalized[0u8] 0u8 into r4;
    assert.eq r4 1u8;
    get state[0u8] into r5;
    assert.eq r5 0u8;
    contains withdrawals[r3] into r6;
    assert.eq r6 false;
    get.or_use current_batch_height[0u8] 0u32 into r7;
    add block.height 360u32 into r8;
    is.eq r7 0u32 into r9;
    gte r7 r8 into r10;
    or r9 r10 into r11;
    assert.eq r11 true;
    get delegator_shares[r3] into r12;
    gte r12 r1 into r13;
    assert.eq r13 true;
    get total_balance[0u8] into r14;
    get total_shares[0u8] into r15;
    sub 0u64 r14 into r16;
    get commission_percent[0u8] into r17;
    gt r16 0u64 into r18;
    cast r16 into r19 as u128;
    mul r19 r17 into r20;
    div r20 1000u128 into r21;
    cast r21 into r22 as u64;
    ternary r18 r22 0u64 into r23;
    sub r16 r23 into r24;
    add r14 r24 into r25;
    cast r25 into r26 as u128;
    cast r23 into r27 as u128;
    cast r15 into r28 as u128;
    gt r26 0u128 into r29;
    ternary r29 r26 1u128 into r30;
    mul r28 1000u128 into r31;
    div r31 r30 into r32;
    add r26 r27 into r33;
    mul r33 r32 into r34;
    div r34 1000u128 into r35;
    sub r35 r28 into r36;
    gt r26 0u128 into r37;
    cast r36 into r38 as u64;
    cast r27 into r39 as u64;
    ternary r37 r38 r39 into r40;
    get.or_use delegator_shares[aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru] 0u64 into r41;
    add r41 r40 into r42;
    set r42 into delegator_shares[aleo1kf3dgrz9lqyklz8kqfy0hpxxyt78qfuzshuhccl02a5x43x6nqpsaapqru];
    add r15 r40 into r43;
    add r25 r23 into r44;
    cast r1 into r45 as u128;
    mul r45 1000u128 into r46;
    cast r43 into r47 as u128;
    div r46 r47 into r48;
    cast r44 into r49 as u128;
    mul r49 r48 into r50;
    div r50 1000u128 into r51;
    cast r2 into r52 as u128;
    gte r51 r52 into r53;
    assert.eq r53 true;
    div block.height 1_000u32 into r54;
    mul r54 1_000u32 into r55;
    add r55 1_000u32 into r56;
    ternary r9 r56 r7 into r57;
    set r57 into current_batch_height[0u8];
    cast r2 r57 into r58 as withdrawal_state;
    set r58 into withdrawals[r3];
    get pending_withdrawal[0u8] into r59;
    add r59 r2 into r60;
    set r60 into pending_withdrawal[0u8];
    sub r44 r2 into r61;
    set r61 into total_balance[0u8];
    sub r43 r1 into r62;
    set r62 into total_shares[0u8];
    sub r12 r1 into r63;
    set r63 into delegator_shares[r3];


function withdraw_claim:
    input r0 as u64.private;
    call credits.aleo/claim_unbond_public into r1;
    call credits.aleo/transfer_public self.caller r0 into r2;
    async withdraw_claim r1 r2 self.caller r0 into r3;
    output r3 as staking_lite.aleo/withdraw_claim.future;

finalize withdraw_claim:
    input r0 as credits.aleo/claim_unbond_public.future;
    input r1 as credits.aleo/transfer_public.future;
    input r2 as address.public;
    input r3 as u64.public;
    await r0;
    await r1;
    get.or_use is_initalized[0u8] 0u8 into r4;
    assert.eq r4 1u8;
    get withdrawals[r2] into r5;
    gte block.height r5.claim_block into r6;
    assert.eq r6 true;
    assert.eq r5.microcredits r3;
    remove current_batch_height[0u8];
    remove withdrawals[r2];
    get pending_withdrawal[0u8] into r7;
    sub r7 r3 into r8;
    set r8 into pending_withdrawal[0u8];
