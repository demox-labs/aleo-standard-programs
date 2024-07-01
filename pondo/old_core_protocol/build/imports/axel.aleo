program axel.aleo;

record token:
    owner as address.private;
    amount as u64.private;

struct approval:
    approver as address;
    spender as address;


mapping account:
	key as address.public;
	value as u64.public;


mapping totals:
	key as u8.public;
	value as u64.public;


mapping approvals:
	key as field.public;
	value as u64.public;

function approve_public:
    input r0 as address.public;
    input r1 as u64.public;
    cast self.caller r0 into r2 as approval;
    hash.bhp256 r2 into r3 as field;
    async approve_public r3 r1 into r4;
    output r4 as axel.aleo/approve_public.future;

finalize approve_public:
    input r0 as field.public;
    input r1 as u64.public;
    get.or_use approvals[r0] 0u64 into r2;
    add r2 r1 into r3;
    set r3 into approvals[r0];


function unapprove_public:
    input r0 as address.public;
    input r1 as u64.public;
    cast self.caller r0 into r2 as approval;
    hash.bhp256 r2 into r3 as field;
    async unapprove_public r3 r1 into r4;
    output r4 as axel.aleo/unapprove_public.future;

finalize unapprove_public:
    input r0 as field.public;
    input r1 as u64.public;
    get.or_use approvals[r0] 0u64 into r2;
    sub r2 r1 into r3;
    set r3 into approvals[r0];


function transfer_from_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    cast r0 self.caller into r3 as approval;
    hash.bhp256 r3 into r4 as field;
    async transfer_from_public r4 r0 r1 r2 into r5;
    output r5 as axel.aleo/transfer_from_public.future;

finalize transfer_from_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u64.public;
    get approvals[r0] into r4;
    sub r4 r3 into r5;
    set r5 into approvals[r0];
    get account[r1] into r6;
    sub r6 r3 into r7;
    set r7 into account[r1];
    get.or_use account[r2] 0u64 into r8;
    add r8 r3 into r9;
    set r9 into account[r2];


function transfer_public:
    input r0 as address.public;
    input r1 as u64.public;
    async transfer_public self.caller r0 r1 into r2;
    output r2 as axel.aleo/transfer_public.future;

finalize transfer_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get.or_use account[r0] 0u64 into r3;
    sub r3 r2 into r4;
    set r4 into account[r0];
    get.or_use account[r1] 0u64 into r5;
    add r5 r2 into r6;
    set r6 into account[r1];


function transfer_private:
    input r0 as token.record;
    input r1 as address.private;
    input r2 as u64.private;
    sub r0.amount r2 into r3;
    cast r0.owner r3 into r4 as token.record;
    cast r1 r2 into r5 as token.record;
    output r4 as token.record;
    output r5 as token.record;


function transfer_private_to_public:
    input r0 as token.record;
    input r1 as address.public;
    input r2 as u64.public;
    sub r0.amount r2 into r3;
    cast r0.owner r3 into r4 as token.record;
    async transfer_private_to_public r1 r2 into r5;
    output r4 as token.record;
    output r5 as axel.aleo/transfer_private_to_public.future;

finalize transfer_private_to_public:
    input r0 as address.public;
    input r1 as u64.public;
    get.or_use account[r0] 0u64 into r2;
    add r2 r1 into r3;
    set r3 into account[r0];


function transfer_public_to_private:
    input r0 as address.public;
    input r1 as u64.public;
    cast r0 r1 into r2 as token.record;
    async transfer_public_to_private self.caller r1 into r3;
    output r2 as token.record;
    output r3 as axel.aleo/transfer_public_to_private.future;

finalize transfer_public_to_private:
    input r0 as address.public;
    input r1 as u64.public;
    get.or_use account[r0] 0u64 into r2;
    sub r2 r1 into r3;
    set r3 into account[r0];


function mint_public:
    input r0 as u64.public;
    input r1 as address.public;
    async mint_public r0 r1 into r2;
    output r2 as axel.aleo/mint_public.future;

finalize mint_public:
    input r0 as u64.public;
    input r1 as address.public;
    get.or_use totals[0u8] 0u64 into r2;
    assert.eq r2 0u64;
    add r2 r0 into r3;
    set r3 into totals[0u8];
    get.or_use account[r1] 0u64 into r4;
    add r4 r0 into r5;
    set r5 into account[r1];


function burn_private:
    input r0 as token.record;
    async burn_private r0.amount into r1;
    output r1 as axel.aleo/burn_private.future;

finalize burn_private:
    input r0 as u64.public;
    get.or_use totals[1u8] 0u64 into r1;
    add r1 r0 into r2;
    set r2 into totals[1u8];


function burn_public:
    input r0 as address.public;
    input r1 as u64.public;
    async burn_public r0 r1 into r2;
    output r2 as axel.aleo/burn_public.future;

finalize burn_public:
    input r0 as address.public;
    input r1 as u64.public;
    get.or_use account[r0] 0u64 into r2;
    sub r2 r1 into r3;
    set r3 into account[r0];
    get.or_use totals[1u8] 0u64 into r4;
    add r4 r1 into r5;
    set r5 into totals[1u8];
