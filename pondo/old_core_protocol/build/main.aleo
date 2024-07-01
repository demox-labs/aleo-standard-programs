import credits.aleo;
import oracle.aleo;
import ale.aleo;
import axel.aleo;
import delegator1.aleo;
import delegator2.aleo;
program core_protocol.aleo;

struct state:
    stake as u64;
    reward as u64;
    performance as u64;
    unbond_amount as u64;
    validator as address;
    ideal_portion as u128;

struct delegator_imbalance:
    delegator as address;
    imbalance as i128;


mapping boost_pool:
	key as address.public;
	value as u64.public;


mapping portion_delegator:
	key as u128.public;
	value as address.public;


mapping delegator_performance:
	key as address.public;
	value as u64.public;


mapping delegator_state:
	key as address.public;
	value as state.public;


mapping core_protocol_balance:
	key as u8.public;
	value as u64.public;


mapping last_rebalance_height:
	key as u8.public;
	value as u64.public;


mapping protocol_state:
	key as u8.public;
	value as u8.public;

function boost:
    input r0 as address.public;
    input r1 as u64.public;
    input r2 as credits.aleo/credits.record;
    assert.neq r0 aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    gt r1 5_000_000u64 into r3;
    assert.eq r3 true;
    call credits.aleo/transfer_private_to_public r2 aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0 r1 into r4 r5;
    async boost r5 r0 r1 into r6;
    output r6 as core_protocol.aleo/boost.future;

finalize boost:
    input r0 as credits.aleo/transfer_private_to_public.future;
    input r1 as address.public;
    input r2 as u64.public;
    await r0;
    get protocol_state[0u8] into r3;
    assert.eq r3 0u8;
    get.or_use boost_pool[r1] 0u64 into r4;
    add r4 r2 into r5;
    set r5 into boost_pool[r1];
    get.or_use boost_pool[aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0] 0u64 into r6;
    add r6 r2 into r7;
    set r5 into boost_pool[aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0];


function clear_boost_pool:
    input r0 as address.public;
    assert.neq r0 aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    async clear_boost_pool r0 into r1;
    output r1 as core_protocol.aleo/clear_boost_pool.future;

finalize clear_boost_pool:
    input r0 as address.public;
    get protocol_state[0u8] into r1;
    assert.eq r1 2u8;
    get.or_use boost_pool[r0] 0u64 into r2;
    set 0u64 into boost_pool[r0];
    get.or_use boost_pool[aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0] 0u64 into r3;
    sub r3 r2 into r4;
    set r4 into boost_pool[aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0];


function clear_boost_pool_bulk:
    input r0 as [address; 15u32].public;
    async clear_boost_pool_bulk r0 into r1;
    output r1 as core_protocol.aleo/clear_boost_pool_bulk.future;

finalize clear_boost_pool_bulk:
    input r0 as [address; 15u32].public;
    get protocol_state[0u8] into r1;
    assert.eq r1 2u8;
    get.or_use boost_pool[aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0] 0u64 into r2;
    assert.neq r0[0u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[0u32]] 0u64 into r3;
    set 0u64 into boost_pool[r0[0u32]];
    sub r2 r3 into r4;
    assert.neq r0[1u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[1u32]] 0u64 into r5;
    set 0u64 into boost_pool[r0[1u32]];
    sub r4 r5 into r6;
    assert.neq r0[2u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[2u32]] 0u64 into r7;
    set 0u64 into boost_pool[r0[2u32]];
    sub r6 r7 into r8;
    assert.neq r0[3u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[3u32]] 0u64 into r9;
    set 0u64 into boost_pool[r0[3u32]];
    sub r8 r9 into r10;
    assert.neq r0[4u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[4u32]] 0u64 into r11;
    set 0u64 into boost_pool[r0[4u32]];
    sub r10 r11 into r12;
    assert.neq r0[5u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[5u32]] 0u64 into r13;
    set 0u64 into boost_pool[r0[5u32]];
    sub r12 r13 into r14;
    assert.neq r0[6u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[6u32]] 0u64 into r15;
    set 0u64 into boost_pool[r0[6u32]];
    sub r14 r15 into r16;
    assert.neq r0[7u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[7u32]] 0u64 into r17;
    set 0u64 into boost_pool[r0[7u32]];
    sub r16 r17 into r18;
    assert.neq r0[8u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[8u32]] 0u64 into r19;
    set 0u64 into boost_pool[r0[8u32]];
    sub r18 r19 into r20;
    assert.neq r0[9u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[9u32]] 0u64 into r21;
    set 0u64 into boost_pool[r0[9u32]];
    sub r20 r21 into r22;
    assert.neq r0[10u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[10u32]] 0u64 into r23;
    set 0u64 into boost_pool[r0[10u32]];
    sub r22 r23 into r24;
    assert.neq r0[11u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[11u32]] 0u64 into r25;
    set 0u64 into boost_pool[r0[11u32]];
    sub r24 r25 into r26;
    assert.neq r0[12u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[12u32]] 0u64 into r27;
    set 0u64 into boost_pool[r0[12u32]];
    sub r26 r27 into r28;
    assert.neq r0[13u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[13u32]] 0u64 into r29;
    set 0u64 into boost_pool[r0[13u32]];
    sub r28 r29 into r30;
    assert.neq r0[14u32] aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    get.or_use boost_pool[r0[14u32]] 0u64 into r31;
    set 0u64 into boost_pool[r0[14u32]];
    sub r30 r31 into r32;
    set r32 into boost_pool[aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0];


function prep_rebalance:
    input r0 as [address; 5u32].public;
    input r1 as [address; 5u32].public;
    input r2 as [u64; 5u32].public;
    input r3 as [u64; 5u32].public;
    input r4 as [u64; 5u32].public;
    input r5 as [u128; 5u32].public;
    call oracle.aleo/confirm_data r1 r2 r4 into r6;
    async prep_rebalance r6 r0 r1 r2 r3 r4 r5 into r7;
    output r7 as core_protocol.aleo/prep_rebalance.future;

finalize prep_rebalance:
    input r0 as oracle.aleo/confirm_data.future;
    input r1 as [address; 5u32].public;
    input r2 as [address; 5u32].public;
    input r3 as [u64; 5u32].public;
    input r4 as [u64; 5u32].public;
    input r5 as [u64; 5u32].public;
    input r6 as [u128; 5u32].public;
    await r0;
    get delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4] into r7;
    get delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc] into r8;
    get delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt] into r9;
    get delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k] into r10;
    get delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n] into r11;
    assert.eq r1[0u32] r7.validator;
    assert.eq r1[1u32] r8.validator;
    assert.eq r1[2u32] r9.validator;
    assert.eq r1[3u32] r10.validator;
    assert.eq r1[4u32] r11.validator;
    cast r7.stake into r12 as i128;
    cast r8.stake into r13 as i128;
    cast r9.stake into r14 as i128;
    cast r10.stake into r15 as i128;
    cast r11.stake into r16 as i128;
    cast r5[0u32] into r17 as i128;
    add r12 r17 into r18;
    cast r5[1u32] into r19 as i128;
    add r13 r19 into r20;
    cast r5[2u32] into r21 as i128;
    add r14 r21 into r22;
    cast r5[3u32] into r23 as i128;
    add r15 r23 into r24;
    cast r5[4u32] into r25 as i128;
    add r16 r25 into r26;
    add r18 r20 into r27;
    add r27 r22 into r28;
    add r28 r24 into r29;
    add r29 r26 into r30;
    mul r18 1000i128 into r31;
    mul r20 1000i128 into r32;
    mul r22 1000i128 into r33;
    mul r24 1000i128 into r34;
    mul r26 1000i128 into r35;
    div r31 r30 into r36;
    div r32 r30 into r37;
    div r33 r30 into r38;
    div r34 r30 into r39;
    div r35 r30 into r40;
    cast r6[0u32] into r41 as i128;
    sub r36 r41 into r42;
    cast r6[1u32] into r43 as i128;
    sub r37 r43 into r44;
    cast r6[2u32] into r45 as i128;
    sub r38 r45 into r46;
    cast r6[3u32] into r47 as i128;
    sub r39 r47 into r48;
    cast r6[4u32] into r49 as i128;
    sub r40 r49 into r50;
    gt r42 0i128 into r51;
    gt r44 0i128 into r52;
    gt r46 0i128 into r53;
    gt r48 0i128 into r54;
    gt r50 0i128 into r55;
    mul r42 r30 into r56;
    div r56 1000i128 into r57;
    mul r44 r30 into r58;
    div r58 1000i128 into r59;
    mul r46 r30 into r60;
    div r60 1000i128 into r61;
    mul r48 r30 into r62;
    div r62 1000i128 into r63;
    mul r50 r30 into r64;
    div r64 1000i128 into r65;
    cast r57 into r66 as u64;
    ternary r51 r66 0u64 into r67;
    cast r59 into r68 as u64;
    ternary r52 r68 0u64 into r69;
    cast r61 into r70 as u64;
    ternary r53 r70 0u64 into r71;
    cast r63 into r72 as u64;
    ternary r54 r72 0u64 into r73;
    cast r65 into r74 as u64;
    ternary r55 r74 0u64 into r75;
    assert.eq r67 r4[0u32];
    assert.eq r69 r4[1u32];
    assert.eq r71 r4[2u32];
    assert.eq r73 r4[3u32];
    assert.eq r75 r4[4u32];
    cast r7.stake r5[0u32] r3[0u32] r4[0u32] r7.validator r6[0u32] into r76 as state;
    cast r8.stake r5[1u32] r3[1u32] r4[1u32] r8.validator r6[1u32] into r77 as state;
    cast r9.stake r5[2u32] r3[2u32] r4[2u32] r9.validator r6[2u32] into r78 as state;
    cast r10.stake r5[3u32] r3[3u32] r4[3u32] r10.validator r6[3u32] into r79 as state;
    cast r11.stake r5[4u32] r3[4u32] r4[4u32] r11.validator r6[4u32] into r80 as state;
    set r76 into delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4];
    set r77 into delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc];
    set r78 into delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt];
    set r79 into delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k];
    set r80 into delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n];
    set aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4 into portion_delegator[r6[0u32]];
    set aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc into portion_delegator[r6[1u32]];
    set aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt into portion_delegator[r6[2u32]];
    set aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k into portion_delegator[r6[3u32]];
    set aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n into portion_delegator[r6[4u32]];
    set r3[0u32] into delegator_performance[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4];
    set r3[1u32] into delegator_performance[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc];
    set r3[2u32] into delegator_performance[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt];
    set r3[3u32] into delegator_performance[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k];
    set r3[4u32] into delegator_performance[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n];
    get portion_delegator[400u128] into r81;
    get portion_delegator[250u128] into r82;
    get portion_delegator[160u128] into r83;
    get portion_delegator[110u128] into r84;
    get portion_delegator[80u128] into r85;
    get delegator_performance[r81] into r86;
    get delegator_performance[r82] into r87;
    get delegator_performance[r83] into r88;
    get delegator_performance[r84] into r89;
    get delegator_performance[r85] into r90;
    gte r86 r87 into r91;
    assert.eq r91 true;
    gte r87 r88 into r92;
    assert.eq r92 true;
    gte r88 r89 into r93;
    assert.eq r93 true;
    gte r89 r90 into r94;
    assert.eq r94 true;
    get protocol_state[0u8] into r95;
    lte r95 1u8 into r96;
    assert.eq r96 true;
    set 1u8 into protocol_state[0u8];


function rebalance_unbond:
    input r0 as [address; 5u32].public;
    input r1 as [address; 5u32].public;
    input r2 as [u64; 5u32].public;
    input r3 as [u64; 5u32].public;
    call delegator1.aleo/unbond r2[0u32] into r4;
    call delegator2.aleo/unbond r2[1u32] into r5;
    call ale.aleo/mint_public 0u64 r0[0u32] into r6;
    call ale.aleo/mint_public 0u64 r0[1u32] into r7;
    call ale.aleo/mint_public 0u64 r0[2u32] into r8;
    call ale.aleo/mint_public 0u64 r0[3u32] into r9;
    call ale.aleo/mint_public 0u64 r0[4u32] into r10;
    call ale.aleo/mint_public 0u64 aleo1fwwj46afvuv7n940zjmkn0vjp3fz3n5vnmz7gqgafxmzuym0w5gqad7hxq into r11;
    async rebalance_unbond r4 r5 r6 r7 r8 r9 r10 r11 r0 r1 r2 r3 into r12;
    output r12 as core_protocol.aleo/rebalance_unbond.future;

finalize rebalance_unbond:
    input r0 as delegator1.aleo/unbond.future;
    input r1 as delegator2.aleo/unbond.future;
    input r2 as ale.aleo/mint_public.future;
    input r3 as ale.aleo/mint_public.future;
    input r4 as ale.aleo/mint_public.future;
    input r5 as ale.aleo/mint_public.future;
    input r6 as ale.aleo/mint_public.future;
    input r7 as ale.aleo/mint_public.future;
    input r8 as [address; 5u32].public;
    input r9 as [address; 5u32].public;
    input r10 as [u64; 5u32].public;
    input r11 as [u64; 5u32].public;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    await r5;
    await r6;
    await r7;
    get delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4] into r12;
    get delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc] into r13;
    get delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt] into r14;
    get delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k] into r15;
    get delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n] into r16;
    assert.eq r8[0u32] r12.validator;
    assert.eq r8[1u32] r13.validator;
    assert.eq r8[2u32] r14.validator;
    assert.eq r8[3u32] r15.validator;
    assert.eq r8[4u32] r16.validator;
    assert.eq r10[0u32] r12.unbond_amount;
    assert.eq r10[1u32] r13.unbond_amount;
    assert.eq r10[2u32] r14.unbond_amount;
    assert.eq r10[3u32] r15.unbond_amount;
    assert.eq r10[4u32] r16.unbond_amount;
    assert.eq r11[0u32] r12.reward;
    assert.eq r11[1u32] r13.reward;
    assert.eq r11[2u32] r14.reward;
    assert.eq r11[3u32] r15.reward;
    assert.eq r11[4u32] r16.reward;
    sub r12.stake r10[0u32] into r17;
    add r17 r11[0u32] into r18;
    cast r18 0u64 r12.performance r10[0u32] r9[0u32] r12.ideal_portion into r19 as state;
    sub r13.stake r10[1u32] into r20;
    add r20 r11[1u32] into r21;
    cast r21 0u64 r13.performance r10[1u32] r9[1u32] r13.ideal_portion into r22 as state;
    sub r14.stake r10[2u32] into r23;
    add r23 r11[2u32] into r24;
    cast r24 0u64 r14.performance r10[2u32] r9[2u32] r14.ideal_portion into r25 as state;
    sub r15.stake r10[3u32] into r26;
    add r26 r11[3u32] into r27;
    cast r27 0u64 r15.performance r10[3u32] r9[3u32] r15.ideal_portion into r28 as state;
    sub r16.stake r10[4u32] into r29;
    add r29 r11[4u32] into r30;
    cast r30 0u64 r16.performance r10[4u32] r9[4u32] r16.ideal_portion into r31 as state;
    set r19 into delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4];
    set r22 into delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc];
    set r25 into delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt];
    set r28 into delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k];
    set r31 into delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n];
    get protocol_state[0u8] into r32;
    assert.eq r32 1u8;
    set 2u8 into protocol_state[0u8];


function rebalance_claim_unbond:
    input r0 as [u64; 5u32].public;
    input r1 as [u64; 5u32].public;
    input r2 as [address; 5u32].public;
    call delegator1.aleo/claim_unbond into r3;
    call delegator1.aleo/transfer_to_core_protocol r0[0u32] into r4;
    call delegator2.aleo/claim_unbond into r5;
    call delegator2.aleo/transfer_to_core_protocol r0[1u32] into r6;
    call credits.aleo/transfer_public aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4 r1[0u32] into r7;
    call delegator1.aleo/bond r2[0u32] r1[0u32] into r8;
    call credits.aleo/transfer_public aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc r1[1u32] into r9;
    call delegator2.aleo/bond r2[1u32] r1[1u32] into r10;
    async rebalance_claim_unbond r3 r4 r5 r6 r7 r8 r9 r10 r0 r1 r2 into r11;
    output r11 as core_protocol.aleo/rebalance_claim_unbond.future;

finalize rebalance_claim_unbond:
    input r0 as delegator1.aleo/claim_unbond.future;
    input r1 as delegator1.aleo/transfer_to_core_protocol.future;
    input r2 as delegator2.aleo/claim_unbond.future;
    input r3 as delegator2.aleo/transfer_to_core_protocol.future;
    input r4 as credits.aleo/transfer_public.future;
    input r5 as delegator1.aleo/bond.future;
    input r6 as credits.aleo/transfer_public.future;
    input r7 as delegator2.aleo/bond.future;
    input r8 as [u64; 5u32].public;
    input r9 as [u64; 5u32].public;
    input r10 as [address; 5u32].public;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    await r5;
    await r6;
    await r7;
    get delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4] into r11;
    get delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc] into r12;
    get delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt] into r13;
    get delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k] into r14;
    get delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n] into r15;
    get.or_use boost_pool[aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0] 0u64 into r16;
    assert.eq r16 0u64;
    assert.eq r8[0u32] r11.unbond_amount;
    assert.eq r8[1u32] r12.unbond_amount;
    assert.eq r8[2u32] r13.unbond_amount;
    assert.eq r8[3u32] r14.unbond_amount;
    assert.eq r8[4u32] r15.unbond_amount;
    assert.eq r10[0u32] r11.validator;
    assert.eq r10[1u32] r12.validator;
    assert.eq r10[2u32] r13.validator;
    assert.eq r10[3u32] r14.validator;
    assert.eq r10[4u32] r15.validator;
    cast r11.stake into r17 as i128;
    cast r12.stake into r18 as i128;
    cast r13.stake into r19 as i128;
    cast r14.stake into r20 as i128;
    cast r15.stake into r21 as i128;
    cast r9[0u32] into r22 as i128;
    add r17 r22 into r23;
    cast r9[1u32] into r24 as i128;
    add r18 r24 into r25;
    cast r9[2u32] into r26 as i128;
    add r19 r26 into r27;
    cast r9[3u32] into r28 as i128;
    add r20 r28 into r29;
    cast r9[4u32] into r30 as i128;
    add r21 r30 into r31;
    add r23 r25 into r32;
    add r32 r27 into r33;
    add r33 r29 into r34;
    add r34 r31 into r35;
    mul r23 1000i128 into r36;
    mul r25 1000i128 into r37;
    mul r27 1000i128 into r38;
    mul r29 1000i128 into r39;
    mul r31 1000i128 into r40;
    div r36 r35 into r41;
    div r37 r35 into r42;
    div r38 r35 into r43;
    div r39 r35 into r44;
    div r40 r35 into r45;
    cast r41 into r46 as u128;
    get portion_delegator[r46] into r47;
    assert.eq aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4 r47;
    cast r42 into r48 as u128;
    get portion_delegator[r48] into r49;
    assert.eq aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc r49;
    cast r43 into r50 as u128;
    get portion_delegator[r50] into r51;
    assert.eq aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt r51;
    cast r44 into r52 as u128;
    get portion_delegator[r52] into r53;
    assert.eq aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k r53;
    cast r45 into r54 as u128;
    get portion_delegator[r54] into r55;
    assert.eq aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n r55;
    add r11.stake r9[0u32] into r56;
    cast r56 0u64 r11.performance 0u64 r11.validator r11.ideal_portion into r57 as state;
    add r12.stake r9[1u32] into r58;
    cast r58 0u64 r12.performance 0u64 r12.validator r12.ideal_portion into r59 as state;
    add r13.stake r9[2u32] into r60;
    cast r60 0u64 r13.performance 0u64 r13.validator r13.ideal_portion into r61 as state;
    add r14.stake r9[3u32] into r62;
    cast r62 0u64 r14.performance 0u64 r14.validator r14.ideal_portion into r63 as state;
    add r15.stake r9[4u32] into r64;
    cast r64 0u64 r15.performance 0u64 r15.validator r15.ideal_portion into r65 as state;
    set r57 into delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4];
    set r59 into delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc];
    set r61 into delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt];
    set r63 into delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k];
    set r65 into delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n];
    get protocol_state[0u8] into r66;
    assert.eq r66 2u8;
    set 0u8 into protocol_state[0u8];


function clear_residual_delegators:
    input r0 as [u64; 5u32].public;
    gt r0[0u32] 0u64 into r1;
    call oracle.aleo/clear_residual_delegator aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4 r0[0u32] into r2;
    call delegator1.aleo/unbond r0[0u32] into r3;
    gt r0[1u32] 0u64 into r4;
    call oracle.aleo/clear_residual_delegator aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc r0[1u32] into r5;
    call delegator2.aleo/unbond r0[1u32] into r6;
    async clear_residual_delegators r2 r3 r5 r6 r0 into r7;
    output r7 as core_protocol.aleo/clear_residual_delegators.future;

finalize clear_residual_delegators:
    input r0 as oracle.aleo/clear_residual_delegator.future;
    input r1 as delegator1.aleo/unbond.future;
    input r2 as oracle.aleo/clear_residual_delegator.future;
    input r3 as delegator2.aleo/unbond.future;
    input r4 as [u64; 5u32].public;
    await r0;
    await r1;
    await r2;
    await r3;
    get protocol_state[0u8] into r5;
    assert.eq r5 2u8;
    get delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4] into r6;
    get delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc] into r7;
    get delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt] into r8;
    get delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k] into r9;
    get delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n] into r10;
    add r6.unbond_amount r4[0u32] into r11;
    cast r6.stake r6.reward r6.performance r11 r6.validator r6.ideal_portion into r12 as state;
    add r7.unbond_amount r4[1u32] into r13;
    cast r7.stake r7.reward r7.performance r13 r7.validator r7.ideal_portion into r14 as state;
    add r8.unbond_amount r4[2u32] into r15;
    cast r8.stake r8.reward r8.performance r15 r8.validator r8.ideal_portion into r16 as state;
    add r9.unbond_amount r4[3u32] into r17;
    cast r9.stake r9.reward r9.performance r17 r9.validator r9.ideal_portion into r18 as state;
    add r10.unbond_amount r4[4u32] into r19;
    cast r10.stake r10.reward r10.performance r19 r10.validator r10.ideal_portion into r20 as state;
    set r12 into delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4];
    set r14 into delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc];
    set r16 into delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt];
    set r18 into delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k];
    set r20 into delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n];


function fix_orphaned_delegators:
    input r0 as [u64; 5u32].public;
    gt r0[0u32] 0u64 into r1;
    call delegator1.aleo/claim_unbond into r2;
    call delegator1.aleo/transfer_to_core_protocol r0[0u32] into r3;
    call oracle.aleo/confirm_orphaned_delegator aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4 r0[0u32] into r4;
    gt r0[1u32] 0u64 into r5;
    call delegator2.aleo/claim_unbond into r6;
    call delegator2.aleo/transfer_to_core_protocol r0[1u32] into r7;
    call oracle.aleo/confirm_orphaned_delegator aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc r0[1u32] into r8;
    async fix_orphaned_delegators r2 r3 r4 r6 r7 r8 r0 into r9;
    output r9 as core_protocol.aleo/fix_orphaned_delegators.future;

finalize fix_orphaned_delegators:
    input r0 as delegator1.aleo/claim_unbond.future;
    input r1 as delegator1.aleo/transfer_to_core_protocol.future;
    input r2 as oracle.aleo/confirm_orphaned_delegator.future;
    input r3 as delegator2.aleo/claim_unbond.future;
    input r4 as delegator2.aleo/transfer_to_core_protocol.future;
    input r5 as oracle.aleo/confirm_orphaned_delegator.future;
    input r6 as [u64; 5u32].public;
    await r0;
    await r1;
    await r2;
    await r3;
    await r4;
    await r5;
    get delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4] into r7;
    get delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc] into r8;
    get delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt] into r9;
    get delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k] into r10;
    get delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n] into r11;
    sub r7.stake r6[0u32] into r12;
    cast r12 0u64 r7.performance 0u64 r7.validator r7.ideal_portion into r13 as state;
    sub r8.stake r6[1u32] into r14;
    cast r14 0u64 r8.performance 0u64 r8.validator r8.ideal_portion into r15 as state;
    sub r9.stake r6[2u32] into r16;
    cast r16 0u64 r9.performance 0u64 r9.validator r9.ideal_portion into r17 as state;
    sub r10.stake r6[3u32] into r18;
    cast r18 0u64 r10.performance 0u64 r10.validator r10.ideal_portion into r19 as state;
    sub r11.stake r6[4u32] into r20;
    cast r20 0u64 r11.performance 0u64 r11.validator r11.ideal_portion into r21 as state;
    set r13 into delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4];
    set r15 into delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc];
    set r17 into delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt];
    set r19 into delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k];
    set r21 into delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n];


function withdraw_private:
    input r0 as ale.aleo/token.record;
    input r1 as u64.private;






function deposit_private:
    input r0 as credits.aleo/credits.record;
    input r1 as u64.public;
    input r2 as address.public;
    input r3 as [u128; 5u32].public;
    input r4 as [u64; 5u32].public;
    input r5 as u128.private;
    input r6 as u64.private;
    input r7 as u64.private;
    add r1 100u64 into r8;
    call credits.aleo/transfer_private_to_public r0 aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0 r8 into r9 r10;
    call ale.aleo/mint_private r6 self.caller into r11 r12;
    async deposit_private r10 r12 r1 r3 r4 r5 r6 r7 self.caller into r13;
    output r9 as credits.aleo/credits.record;
    output r13 as core_protocol.aleo/deposit_private.future;

finalize deposit_private:
    input r0 as credits.aleo/transfer_private_to_public.future;
    input r1 as ale.aleo/mint_private.future;
    input r2 as u64.public;
    input r3 as [u128; 5u32].public;
    input r4 as [u64; 5u32].public;
    input r5 as u128.public;
    input r6 as u64.public;
    input r7 as u64.public;
    input r8 as address.public;
    await r0;
    await r1;
    get delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4] into r9;
    get delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc] into r10;
    get delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt] into r11;
    get delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k] into r12;
    get delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n] into r13;
    add r9.stake r10.stake into r14;
    add r14 r11.stake into r15;
    add r15 r12.stake into r16;
    add r16 r13.stake into r17;
    get last_rebalance_height[0u8] into r18;
    sub block.height r18 into r19;
    mul r19 r7 into r20;
    add r17 r20 into r21;
    cast r2 into r22 as u128;
    cast r21 into r23 as u128;
    mul r5 1000u128 into r24;
    div r24 r23 into r25;
    div r25 1000u128 into r26;
    add r23 r22 into r27;
    mul r27 r26 into r28;
    div r28 1000u128 into r29;
    sub r29 r5 into r30;
    cast r30 into r31 as u64;
    assert.eq r31 r6;
    gte r31 1u64 into r32;
    assert.eq r32 true;
    get.or_use core_protocol_balance[0u8] 0u64 into r33;
    add r33 r2 into r34;
    set r34 into core_protocol_balance[0u8];




function bond_deposit_pool:
    input r0 as [address; 5u32].private;
    input r1 as [u64; 5u32].private;
    call credits.aleo/transfer_public aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4 r1[0u32] into r2;
    call delegator1.aleo/bond r0[0u32] r1[0u32] into r3;
    async bond_deposit_pool r2 r3 r0 r1 into r4;
    output r4 as core_protocol.aleo/bond_deposit_pool.future;

finalize bond_deposit_pool:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as delegator1.aleo/bond.future;
    input r2 as [address; 5u32].public;
    input r3 as [u64; 5u32].public;
    await r0;
    await r1;
    get protocol_state[0u8] into r4;
    is.eq r4 0u8 into r5;
    is.eq r4 2u8 into r6;
    or r5 r6 into r7;
    assert.eq r7 true;
    get.or_use core_protocol_balance[0u8] 0u64 into r8;
    cast 1_000_000u64 into r9 as u128;
    mul r9 1000u128 into r10;
    div r10 80u128 into r11;
    cast r11 into r12 as u64;
    add r12 10_000_000u64 into r13;
    gte r8 r13 into r14;
    assert.eq r14 true;
    add r3[0u32] r3[1u32] into r15;
    add r15 r3[2u32] into r16;
    add r16 r3[3u32] into r17;
    add r17 r3[4u32] into r18;
    get delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4] into r19;
    get delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc] into r20;
    get delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt] into r21;
    get delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k] into r22;
    get delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n] into r23;
    cast r18 into r24 as u128;
    mul r19.ideal_portion r24 into r25;
    div r25 1000u128 into r26;
    cast r18 into r27 as u128;
    mul r20.ideal_portion r27 into r28;
    div r28 1000u128 into r29;
    cast r18 into r30 as u128;
    mul r21.ideal_portion r30 into r31;
    div r31 1000u128 into r32;
    cast r18 into r33 as u128;
    mul r22.ideal_portion r33 into r34;
    div r34 1000u128 into r35;
    cast r18 into r36 as u128;
    mul r23.ideal_portion r36 into r37;
    div r37 1000u128 into r38;
    cast r26 into r39 as u64;
    assert.eq r3[0u32] r39;
    cast r29 into r40 as u64;
    assert.eq r3[1u32] r40;
    cast r32 into r41 as u64;
    assert.eq r3[2u32] r41;
    cast r35 into r42 as u64;
    assert.eq r3[3u32] r42;
    cast r38 into r43 as u64;
    assert.eq r3[4u32] r43;
    assert.eq r2[0u32] r19.validator;
    assert.eq r2[1u32] r20.validator;
    assert.eq r2[2u32] r21.validator;
    assert.eq r2[3u32] r22.validator;
    assert.eq r2[4u32] r23.validator;
    add r19.stake r3[0u32] into r44;
    cast r44 r19.reward r19.performance r19.unbond_amount r19.validator r19.ideal_portion into r45 as state;
    add r20.stake r3[1u32] into r46;
    cast r46 r20.reward r20.performance r20.unbond_amount r20.validator r20.ideal_portion into r47 as state;
    add r21.stake r3[2u32] into r48;
    cast r48 r21.reward r21.performance r21.unbond_amount r21.validator r21.ideal_portion into r49 as state;
    add r22.stake r3[3u32] into r50;
    cast r50 r22.reward r22.performance r22.unbond_amount r22.validator r22.ideal_portion into r51 as state;
    add r23.stake r3[4u32] into r52;
    cast r52 r23.reward r23.performance r23.unbond_amount r23.validator r23.ideal_portion into r53 as state;
    set r45 into delegator_state[aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4];
    set r47 into delegator_state[aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc];
    set r49 into delegator_state[aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt];
    set r51 into delegator_state[aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k];
    set r53 into delegator_state[aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n];
    sub r8 r18 into r54;
    gt r54 0u64 into r55;
    ternary r55 r54 0u64 into r56;
    set r54 into core_protocol_balance[0u8];
