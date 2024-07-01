program credits.aleo;

mapping committee:
    key as address.public;
    value as committee_state.public;

struct committee_state:
    microcredits as u64;
    is_open as boolean;

mapping metadata:
    key as address.public;
    value as u32.public;

mapping bonded:
    key as address.public;
    value as bond_state.public;

struct bond_state:
    validator as address;
    microcredits as u64;

mapping unbonding:
    key as address.public;
    value as unbond_state.public;

struct unbond_state:
    microcredits as u64;
    height as u32;

mapping account:
    key as address.public;
    value as u64.public;

mapping withdraw:
    key as address.public;
    value as address.public;

record credits:
    owner as address.private;
    microcredits as u64.private;

function bond_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    gte r2 1000000u64 into r3;
    assert.eq r3 true ;
    is.eq self.caller r0 into r4;
    is.eq self.caller self.signer into r5;
    ternary r4 r5 true into r6;
    assert.eq r6 true ;
    async bond_public self.caller r0 r1 r2 into r7;
    output r7 as credits.aleo/bond_public.future;

finalize bond_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u64.public;
    get.or_use withdraw[r0] r2 into r4;
    assert.eq r2 r4 ;
    is.eq r0 r1 into r5;
    branch.eq r5 true to bond_validator;
    branch.eq r5 false to bond_delegator;
    position bond_validator;
    contains committee[r0] into r6;
    branch.eq r6 true to continue_bond_validator;
    get.or_use metadata[aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc] 0u32 into r7;
    add r7 1u32 into r8;
    set r8 into metadata[aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc];
    set r2 into withdraw[r0];
    position continue_bond_validator;
    cast 0u64 true into r9 as committee_state;
    get.or_use committee[r0] r9 into r10;
    add r10.microcredits r3 into r11;
    cast r11 r10.is_open into r12 as committee_state;
    cast r0 0u64 into r13 as bond_state;
    get.or_use bonded[r0] r13 into r14;
    assert.eq r14.validator r0 ;
    add r14.microcredits r3 into r15;
    gte r15 10000000000000u64 into r16;
    assert.eq r16 true ;
    cast r0 r15 into r17 as bond_state;
    get account[r0] into r18;
    sub r18 r3 into r19;
    set r12 into committee[r0];
    set r17 into bonded[r0];
    set r19 into account[r0];
    branch.eq true true to end;
    position bond_delegator;
    contains committee[r0] into r20;
    assert.eq r20 false ;
    get committee[r1] into r21;
    add r21.microcredits r3 into r22;
    cast r22 r21.is_open into r23 as committee_state;
    contains bonded[r0] into r24;
    branch.eq r24 true to continue_bond_delegator;
    assert.eq r21.is_open true ;
    get.or_use metadata[aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0] 0u32 into r25;
    add r25 1u32 into r26;
    lte r26 100000u32 into r27;
    assert.eq r27 true ;
    set r26 into metadata[aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0];
    set r2 into withdraw[r0];
    position continue_bond_delegator;
    cast r1 0u64 into r28 as bond_state;
    get.or_use bonded[r0] r28 into r29;
    assert.eq r29.validator r1 ;
    add r29.microcredits r3 into r30;
    gte r30 10000000000u64 into r31;
    assert.eq r31 true ;
    cast r1 r30 into r32 as bond_state;
    get account[r0] into r33;
    sub r33 r3 into r34;
    set r23 into committee[r1];
    set r32 into bonded[r0];
    set r34 into account[r0];
    position end;

function unbond_public:
    input r0 as u64.public;
    async unbond_public self.caller r0 into r1;
    output r1 as credits.aleo/unbond_public.future;

finalize unbond_public:
    input r0 as address.public;
    input r1 as u64.public;
    cast 0u64 0u32 into r2 as unbond_state;
    get.or_use unbonding[r0] r2 into r3;
    add block.height 360u32 into r4;
    contains committee[r0] into r5;
    branch.eq r5 true to unbond_validator;
    branch.eq r5 false to unbond_delegator;
    position unbond_validator;
    get committee[r0] into r6;
    sub r6.microcredits r1 into r7;
    get bonded[r0] into r8;
    assert.eq r8.validator r0 ;
    sub r8.microcredits r1 into r9;
    gte r9 10000000000000u64 into r10;
    branch.eq r10 true to decrement_validator;
    branch.eq r10 false to remove_validator;
    position decrement_validator;
    cast r7 r6.is_open into r11 as committee_state;
    set r11 into committee[r0];
    cast r0 r9 into r12 as bond_state;
    set r12 into bonded[r0];
    add r3.microcredits r1 into r13;
    cast r13 r4 into r14 as unbond_state;
    set r14 into unbonding[r0];
    branch.eq true true to end;
    position remove_validator;
    assert.eq r6.microcredits r8.microcredits ;
    remove committee[r0];
    get metadata[aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc] into r15;
    sub r15 1u32 into r16;
    set r16 into metadata[aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc];
    remove bonded[r0];
    add r3.microcredits r8.microcredits into r17;
    cast r17 r4 into r18 as unbond_state;
    set r18 into unbonding[r0];
    branch.eq true true to end;
    position unbond_delegator;
    get bonded[r0] into r19;
    sub r19.microcredits r1 into r20;
    gte r20 10000000000u64 into r21;
    branch.eq r21 true to decrement_delegator;
    branch.eq r21 false to remove_delegator;
    position decrement_delegator;
    get committee[r19.validator] into r22;
    sub r22.microcredits r1 into r23;
    cast r23 r22.is_open into r24 as committee_state;
    set r24 into committee[r19.validator];
    cast r19.validator r20 into r25 as bond_state;
    set r25 into bonded[r0];
    add r3.microcredits r1 into r26;
    cast r26 r4 into r27 as unbond_state;
    set r27 into unbonding[r0];
    branch.eq true true to end;
    position remove_delegator;
    get committee[r19.validator] into r28;
    sub r28.microcredits r19.microcredits into r29;
    cast r29 r28.is_open into r30 as committee_state;
    set r30 into committee[r19.validator];
    get metadata[aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0] into r31;
    sub r31 1u32 into r32;
    set r32 into metadata[aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0];
    remove bonded[r0];
    add r3.microcredits r19.microcredits into r33;
    cast r33 r4 into r34 as unbond_state;
    set r34 into unbonding[r0];
    position end;

function unbond_delegator_as_validator:
    input r0 as address.public;
    async unbond_delegator_as_validator self.caller r0 into r1;
    output r1 as credits.aleo/unbond_delegator_as_validator.future;

finalize unbond_delegator_as_validator:
    input r0 as address.public;
    input r1 as address.public;
    get committee[r0] into r2;
    assert.eq r2.is_open false ;
    contains committee[r1] into r3;
    assert.eq r3 false ;
    get bonded[r1] into r4;
    assert.eq r4.validator r0 ;
    sub r2.microcredits r4.microcredits into r5;
    cast r5 r2.is_open into r6 as committee_state;
    get metadata[aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0] into r7;
    sub r7 1u32 into r8;
    cast 0u64 0u32 into r9 as unbond_state;
    get.or_use unbonding[r1] r9 into r10;
    add r10.microcredits r4.microcredits into r11;
    add block.height 360u32 into r12;
    cast r11 r12 into r13 as unbond_state;
    set r6 into committee[r0];
    remove bonded[r1];
    set r13 into unbonding[r1];
    set r8 into metadata[aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0];

function claim_unbond_public:
    async claim_unbond_public self.caller into r0;
    output r0 as credits.aleo/claim_unbond_public.future;

finalize claim_unbond_public:
    input r0 as address.public;
    get unbonding[r0] into r1;
    gte block.height r1.height into r2;
    assert.eq r2 true ;
    get withdraw[r0] into r3;
    get.or_use account[r3] 0u64 into r4;
    add r1.microcredits r4 into r5;
    set r5 into account[r3];
    remove unbonding[r0];
    contains bonded[r0] into r6;
    branch.eq r6 true to end;
    remove withdraw[r0];
    position end;

function set_validator_state:
    input r0 as boolean.public;
    async set_validator_state self.caller r0 into r1;
    output r1 as credits.aleo/set_validator_state.future;

finalize set_validator_state:
    input r0 as address.public;
    input r1 as boolean.public;
    get committee[r0] into r2;
    cast r2.microcredits r1 into r3 as committee_state;
    set r3 into committee[r0];

function transfer_public:
    input r0 as address.public;
    input r1 as u64.public;
    async transfer_public self.caller r0 r1 into r2;
    output r2 as credits.aleo/transfer_public.future;

finalize transfer_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get account[r0] into r3;
    sub r3 r2 into r4;
    set r4 into account[r0];
    get.or_use account[r1] 0u64 into r5;
    add r5 r2 into r6;
    set r6 into account[r1];

function transfer_public_as_signer:
    input r0 as address.public;
    input r1 as u64.public;
    async transfer_public_as_signer self.signer r0 r1 into r2;
    output r2 as credits.aleo/transfer_public_as_signer.future;

finalize transfer_public_as_signer:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get account[r0] into r3;
    sub r3 r2 into r4;
    set r4 into account[r0];
    get.or_use account[r1] 0u64 into r5;
    add r5 r2 into r6;
    set r6 into account[r1];

function transfer_private:
    input r0 as credits.record;
    input r1 as address.private;
    input r2 as u64.private;
    sub r0.microcredits r2 into r3;
    cast r1 r2 into r4 as credits.record;
    cast r0.owner r3 into r5 as credits.record;
    output r4 as credits.record;
    output r5 as credits.record;

function transfer_private_to_public:
    input r0 as credits.record;
    input r1 as address.public;
    input r2 as u64.public;
    sub r0.microcredits r2 into r3;
    cast r0.owner r3 into r4 as credits.record;
    async transfer_private_to_public r1 r2 into r5;
    output r4 as credits.record;
    output r5 as credits.aleo/transfer_private_to_public.future;

finalize transfer_private_to_public:
    input r0 as address.public;
    input r1 as u64.public;
    get.or_use account[r0] 0u64 into r2;
    add r1 r2 into r3;
    set r3 into account[r0];

function transfer_public_to_private:
    input r0 as address.private;
    input r1 as u64.public;
    cast r0 r1 into r2 as credits.record;
    async transfer_public_to_private self.caller r1 into r3;
    output r2 as credits.record;
    output r3 as credits.aleo/transfer_public_to_private.future;

finalize transfer_public_to_private:
    input r0 as address.public;
    input r1 as u64.public;
    get account[r0] into r2;
    sub r2 r1 into r3;
    set r3 into account[r0];

function join:
    input r0 as credits.record;
    input r1 as credits.record;
    add r0.microcredits r1.microcredits into r2;
    cast r0.owner r2 into r3 as credits.record;
    output r3 as credits.record;

function split:
    input r0 as credits.record;
    input r1 as u64.private;
    sub r0.microcredits r1 into r2;
    sub r2 10000u64 into r3;
    cast r0.owner r1 into r4 as credits.record;
    cast r0.owner r3 into r5 as credits.record;
    output r4 as credits.record;
    output r5 as credits.record;

function fee_private:
    input r0 as credits.record;
    input r1 as u64.public;
    input r2 as u64.public;
    input r3 as field.public;
    assert.neq r1 0u64 ;
    assert.neq r3 0field ;
    add r1 r2 into r4;
    sub r0.microcredits r4 into r5;
    cast r0.owner r5 into r6 as credits.record;
    output r6 as credits.record;

function fee_public:
    input r0 as u64.public;
    input r1 as u64.public;
    input r2 as field.public;
    assert.neq r0 0u64 ;
    assert.neq r2 0field ;
    add r0 r1 into r3;
    async fee_public self.signer r3 into r4;
    output r4 as credits.aleo/fee_public.future;

finalize fee_public:
    input r0 as address.public;
    input r1 as u64.public;
    get account[r0] into r2;
    sub r2 r1 into r3;
    set r3 into account[r0];
