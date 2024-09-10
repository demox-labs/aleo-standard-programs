import credits.aleo;
import pondo_oracle.aleo;

program reference_delegatornkpuru.aleo;

struct admin_operation:
    arg as field;
    op_type as u8;
    request_id as u64;

mapping initialized:
    key as u8.public;
    value as u8.public;

function initialize:
    call credits.aleo/transfer_public_as_signer reference_delegatornkpuru.aleo 10000000000u64 into r0;
    call credits.aleo/bond_public aleo12tf856xd9we5ay090zkep0s3q5e8srzwqr37ds0ppvv5kkzad5fqvwndmx reference_delegatornkpuru.aleo 10000000000u64 into r1;
    call pondo_oracle.aleo/propose_delegator aleo12tf856xd9we5ay090zkep0s3q5e8srzwqr37ds0ppvv5kkzad5fqvwndmx into r2;
    async initialize r0 r1 r2 into r3;
    output r3 as reference_delegatornkpuru.aleo/initialize.future;

finalize initialize:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as credits.aleo/bond_public.future;
    input r2 as pondo_oracle.aleo/propose_delegator.future;
    await r0;
    await r1;
    await r2;
    contains initialized[0u8] into r3;
    assert.eq r3 false ;
    set 8u8 into initialized[0u8];

function remove:
    input r0 as u64.public;
    assert.eq self.caller aleo1gy3j7p6hfecwuvx930pxhw8ydt65at6094vl7vfdws8cv29e4szqrvpnd0 ;
    call credits.aleo/unbond_public reference_delegatornkpuru.aleo r0 into r1;
    call pondo_oracle.aleo/remove_delegator into r2;
    async remove r1 r2 into r3;
    output r3 as reference_delegatornkpuru.aleo/remove.future;

finalize remove:
    input r0 as credits.aleo/unbond_public.future;
    input r1 as pondo_oracle.aleo/remove_delegator.future;
    await r0;
    await r1;
    contains credits.aleo/bonded[reference_delegatornkpuru.aleo] into r2;
    assert.eq r2 false ;

function withdraw:
    input r0 as u64.private;
    call credits.aleo/transfer_public aleo1gy3j7p6hfecwuvx930pxhw8ydt65at6094vl7vfdws8cv29e4szqrvpnd0 r0 into r1;
    async withdraw r1 into r2;
    output r2 as reference_delegatornkpuru.aleo/withdraw.future;

finalize withdraw:
    input r0 as credits.aleo/transfer_public.future;
    await r0;
    get.or_use credits.aleo/account[reference_delegatornkpuru.aleo] 0u64 into r1;
    assert.eq r1 0u64 ;
