program oracle.aleo;

struct delegator_distribution:
    block_height as u32;
    validators as [address; 5u32];
    performances as [u64; 5u32];
    rewards as [u64; 5u32];


mapping delegator_state:
	key as u8.public;
	value as delegator_distribution.public;


mapping orphaned_delegator:
	key as address.public;
	value as u64.public;


mapping residual_delegator:
	key as address.public;
	value as u64.public;


mapping average_block_reward:
	key as u8.public;
	value as u64.public;

function set_data:
    input r0 as u32.public;
    input r1 as [address; 5u32].public;
    input r2 as [u64; 5u32].public;
    input r3 as [u64; 5u32].public;
    async set_data r0 r1 r2 r3 into r4;
    output r4 as oracle.aleo/set_data.future;

finalize set_data:
    input r0 as u32.public;
    input r1 as [address; 5u32].public;
    input r2 as [u64; 5u32].public;
    input r3 as [u64; 5u32].public;
    cast r0 r1 r2 r3 into r4 as delegator_distribution;
    set r4 into delegator_state[1u8];


function confirm_data:
    input r0 as [address; 5u32].public;
    input r1 as [u64; 5u32].public;
    input r2 as [u64; 5u32].public;
    async confirm_data r0 r1 r2 into r3;
    output r3 as oracle.aleo/confirm_data.future;

finalize confirm_data:
    input r0 as [address; 5u32].public;
    input r1 as [u64; 5u32].public;
    input r2 as [u64; 5u32].public;
    get delegator_state[1u8] into r3;
    assert.eq r3.validators r0;
    assert.eq r3.performances r1;
    assert.eq r3.rewards r2;


function set_orphaned_delegator:
    input r0 as address.public;
    input r1 as u64.public;
    async set_orphaned_delegator r0 r1 into r2;
    output r2 as oracle.aleo/set_orphaned_delegator.future;

finalize set_orphaned_delegator:
    input r0 as address.public;
    input r1 as u64.public;
    set r1 into orphaned_delegator[r0];


function confirm_orphaned_delegator:
    input r0 as address.public;
    input r1 as u64.public;
    async confirm_orphaned_delegator r0 r1 into r2;
    output r2 as oracle.aleo/confirm_orphaned_delegator.future;

finalize confirm_orphaned_delegator:
    input r0 as address.public;
    input r1 as u64.public;
    get orphaned_delegator[r0] into r2;
    assert.eq r2 r1;


function set_average_block_reward:
    input r0 as u64.public;
    async set_average_block_reward r0 into r1;
    output r1 as oracle.aleo/set_average_block_reward.future;

finalize set_average_block_reward:
    input r0 as u64.public;
    set r0 into average_block_reward[0u8];


function confirm_average_block_reward:
    input r0 as u64.public;
    async confirm_average_block_reward r0 into r1;
    output r1 as oracle.aleo/confirm_average_block_reward.future;

finalize confirm_average_block_reward:
    input r0 as u64.public;
    get average_block_reward[0u8] into r1;
    assert.eq r1 r0;


function set_residual_delegator:
    input r0 as address.public;
    input r1 as u64.public;
    async set_residual_delegator r0 r1 into r2;
    output r2 as oracle.aleo/set_residual_delegator.future;

finalize set_residual_delegator:
    input r0 as address.public;
    input r1 as u64.public;
    set r1 into residual_delegator[r0];


function clear_residual_delegator:
    input r0 as address.public;
    input r1 as u64.public;
    async clear_residual_delegator r0 r1 into r2;
    output r2 as oracle.aleo/clear_residual_delegator.future;

finalize clear_residual_delegator:
    input r0 as address.public;
    input r1 as u64.public;
    get orphaned_delegator[r0] into r2;
    assert.eq r2 r1;
    remove residual_delegator[r0];
