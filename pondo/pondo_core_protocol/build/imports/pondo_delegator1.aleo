import credits.aleo;
import pondo_oracle.aleo;
program pondo_delegator1.aleo;

struct committee_state:
    is_open as boolean;
    commission as u8;


struct admin_operation:
    arg as field;
    op_type as u8;
    request_id as u64;

struct validator_state:
    validator as address;
    commission as u8;


mapping state_mapping:
	key as u8.public;
	value as u8.public;


mapping validator_mapping:
	key as u8.public;
	value as validator_state.public;


mapping banned_validators:
	key as address.public;
	value as boolean.public;


function initialize:
    assert.eq self.caller pondo_core_protocol.aleo;
    async initialize into r0;
    output r0 as pondo_delegator1.aleo/initialize.future;

finalize initialize:
    set 4u8 into state_mapping[0u8];




function ban_validator:
    input r0 as address.public;
    call pondo_oracle.aleo/pondo_ban_validator r0 into r1;
    async ban_validator r0 r1 into r2;
    output r2 as pondo_delegator1.aleo/ban_validator.future;

finalize ban_validator:
    input r0 as address.public;
    input r1 as pondo_oracle.aleo/pondo_ban_validator.future;
    await r1;
    contains banned_validators[r0] into r2;
    assert.eq r2 true;




function prep_rebalance:
    assert.eq self.caller pondo_core_protocol.aleo;
    async prep_rebalance into r0;
    output r0 as pondo_delegator1.aleo/prep_rebalance.future;

finalize prep_rebalance:
    get state_mapping[0u8] into r0;
    is.neq r0 3u8 into r1;
    assert.eq r1 true;
    is.eq r0 1u8 into r2;
    branch.eq r2 false to end_then_0_0;
    set 2u8 into state_mapping[0u8];
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    position end_otherwise_0_1;
    is.eq r0 0u8 into r3;
    branch.eq r3 false to end_then_0_2;
    set 4u8 into state_mapping[0u8];
    branch.eq true true to end_otherwise_0_3;
    position end_then_0_2;
    position end_otherwise_0_3;




function set_validator:
    input r0 as address.public;
    input r1 as u8.public;
    assert.eq self.caller pondo_core_protocol.aleo;
    async set_validator r0 r1 into r2;
    output r2 as pondo_delegator1.aleo/set_validator.future;

finalize set_validator:
    input r0 as address.public;
    input r1 as u8.public;
    cast r0 r1 into r2 as validator_state;
    set r2 into validator_mapping[0u8];
    get state_mapping[0u8] into r3;
    is.eq r3 4u8 into r4;
    assert.eq r4 true;
    set 0u8 into state_mapping[0u8];




function bond:
    input r0 as address.public;
    input r1 as u64.public;
    call credits.aleo/bond_public r0 pondo_delegator1.aleo r1 into r2;
    async bond r0 r2 into r3;
    output r3 as pondo_delegator1.aleo/bond.future;

finalize bond:
    input r0 as address.public;
    input r1 as credits.aleo/bond_public.future;
    await r1;
    get validator_mapping[0u8] into r2;
    assert.eq r0 r2.validator;
    get credits.aleo/account[pondo_delegator1.aleo] into r3;
    lt r3 1_000_000u64 into r4;
    assert.eq r4 true;
    get state_mapping[0u8] into r5;
    is.eq r5 0u8 into r6;
    is.eq r5 1u8 into r7;
    or r6 r7 into r8;
    assert.eq r8 true;
    set 1u8 into state_mapping[0u8];




function unbond:
    input r0 as u64.public;
    call credits.aleo/unbond_public pondo_delegator1.aleo r0 into r1;
    async unbond r1 into r2;
    output r2 as pondo_delegator1.aleo/unbond.future;

finalize unbond:
    input r0 as credits.aleo/unbond_public.future;
    await r0;
    contains credits.aleo/bonded[pondo_delegator1.aleo] into r1;
    assert.eq r1 false;
    get validator_mapping[0u8] into r2;
    cast true 0u8 into r3 as committee_state;
    get.or_use credits.aleo/committee[r2.validator] r3 into r4;
    add r2.commission 10u8 into r5;
    gt r4.commission r5 into r6;
    gt r4.commission 50u8 into r7;
    or r6 r7 into r8;
    branch.eq r8 false to end_then_0_4;
    set true into banned_validators[r2.validator];
    branch.eq true true to end_otherwise_0_5;
    position end_then_0_4;
    get state_mapping[0u8] into r9;
    assert.eq r9 2u8;
    position end_otherwise_0_5;
    set 3u8 into state_mapping[0u8];




function terminal_state:
    async terminal_state into r0;
    output r0 as pondo_delegator1.aleo/terminal_state.future;

finalize terminal_state:
    contains credits.aleo/bonded[pondo_delegator1.aleo] into r0;
    assert.eq r0 false;
    contains credits.aleo/unbonding[pondo_delegator1.aleo] into r1;
    assert.eq r1 false;
    get state_mapping[0u8] into r2;
    is.neq r2 0u8 into r3;
    assert.eq r3 true;
    is.eq r2 1u8 into r4;
    branch.eq r4 false to end_then_0_6;
    get validator_mapping[0u8] into r5;
    set true into banned_validators[r5.validator];
    branch.eq true true to end_otherwise_0_7;
    position end_then_0_6;
    position end_otherwise_0_7;
    set 4u8 into state_mapping[0u8];




function transfer_to_core_protocol:
    input r0 as u64.public;
    assert.eq self.caller pondo_core_protocol.aleo;
    call credits.aleo/transfer_public pondo_core_protocol.aleo r0 into r1;
    async transfer_to_core_protocol r1 into r2;
    output r2 as pondo_delegator1.aleo/transfer_to_core_protocol.future;

finalize transfer_to_core_protocol:
    input r0 as credits.aleo/transfer_public.future;
    await r0;
    get credits.aleo/account[pondo_delegator1.aleo] into r1;
    lt r1 1_000_000u64 into r2;
    assert.eq r2 true;
    get state_mapping[0u8] into r3;
    assert.eq r3 4u8;




function bond_failed:
    async bond_failed into r0;
    output r0 as pondo_delegator1.aleo/bond_failed.future;

finalize bond_failed:
    get validator_mapping[0u8] into r0;
    get credits.aleo/committee[r0.validator] into r1;
    is.eq r1.is_open false into r2;
    assert.eq r2 true;
    get state_mapping[0u8] into r3;
    is.eq r3 0u8 into r4;
    assert.eq r4 true;
    set 4u8 into state_mapping[0u8];
    set true into banned_validators[r0.validator];

