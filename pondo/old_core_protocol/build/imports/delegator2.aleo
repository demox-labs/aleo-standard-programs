import credits.aleo;
program delegator2.aleo;



mapping unbond_available:
	key as u8.public;
	value as u8.public;


mapping validator_address:
	key as u8.public;
	value as address.public;

function set_validator:
    input r0 as address.public;
    async set_validator r0 into r1;
    output r1 as delegator2.aleo/set_validator.future;

finalize set_validator:
    input r0 as address.public;
    set r0 into validator_address[0u8];


function transfer_to_core_protocol:
    input r0 as u64.public;
    assert.eq self.caller aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    call credits.aleo/transfer_public aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0 r0 into r1;
    async transfer_to_core_protocol r1 into r2;
    output r2 as delegator2.aleo/transfer_to_core_protocol.future;

finalize transfer_to_core_protocol:
    input r0 as credits.aleo/transfer_public.future;
    await r0;


function bond:
    input r0 as address.public;
    input r1 as u64.public;
    assert.eq self.caller aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    call credits.aleo/bond_public r0 r1 into r2;
    async bond r2 r0 into r3;
    output r3 as delegator2.aleo/bond.future;

finalize bond:
    input r0 as credits.aleo/bond_public.future;
    input r1 as address.public;
    await r0;
    get validator_address[0u8] into r2;
    assert.eq r1 r2;


function unbond:
    input r0 as u64.private;
    assert.eq self.caller aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    call credits.aleo/unbond_public r0 into r1;
    async unbond r1 r0 into r2;
    output r2 as delegator2.aleo/unbond.future;

finalize unbond:
    input r0 as credits.aleo/unbond_public.future;
    input r1 as u64.public;
    await r0;
    get unbond_available[0u8] into r2;
    assert.eq r2 1u8;
    set 0u8 into unbond_available[0u8];


function claim_unbond:
    assert.eq self.caller aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    call credits.aleo/claim_unbond_public into r0;
    async claim_unbond r0 into r1;
    output r1 as delegator2.aleo/claim_unbond.future;

finalize claim_unbond:
    input r0 as credits.aleo/claim_unbond_public.future;
    await r0;
    set 1u8 into unbond_available[0u8];
