program time_oracle.aleo;

struct admin_operation:
    arg as field;
    op_type as u8;
    request_id as u64;


mapping timestamp:
	key as u8.public;
	value as u64.public;


mapping admin_operations:
	key as u64.public;
	value as admin_operation.public;


mapping admins:
	key as address.public;
	value as boolean.public;


function initialize:
    async initialize into r0;
    output r0 as time_oracle.aleo/initialize.future;

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
    output r16 as time_oracle.aleo/update_timestamp.future;

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
    output r18 as time_oracle.aleo/update_admin.future;

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

