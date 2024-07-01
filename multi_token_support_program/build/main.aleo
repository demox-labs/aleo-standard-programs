import credits.aleo;
program multi_token_support_program_v1.aleo;


record Token:
    owner as address.private;
    amount as u128.private;
    token_id as field.private;
    external_authorization_required as boolean.private;
    authorized_until as u32.private;

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

struct Balance:
    token_id as field;
    account as address;
    balance as u128;
    authorized_until as u32;

struct Allowance:
    account as address;
    spender as address;
    token_id as field;


mapping registered_tokens:
	key as field.public;
	value as TokenMetadata.public;


mapping balances:
	key as field.public;
	value as Balance.public;


mapping authorized_balances:
	key as field.public;
	value as Balance.public;


mapping allowances:
	key as field.public;
	value as u128.public;


function transfer_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    async transfer_public r0 r1 r2 self.caller into r3;
    output r3 as multi_token_support_program_v1.aleo/transfer_public.future;

finalize transfer_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as address.public;
    cast r3 r0 into r4 as TokenOwner;
    hash.bhp256 r4 into r5 as field;
    get authorized_balances[r5] into r6;
    sub r6.balance r2 into r7;
    cast r0 r3 r7 r6.authorized_until into r8 as Balance;
    set r8 into authorized_balances[r5];
    cast r1 r0 into r9 as TokenOwner;
    hash.bhp256 r9 into r10 as field;
    get registered_tokens[r0] into r11;
    ternary r11.external_authorization_required 0u32 4294967295u32 into r12;
    cast r0 r1 0u128 r12 into r13 as Balance;
    get.or_use balances[r10] r13 into r14;
    get.or_use authorized_balances[r10] r13 into r15;
    ternary r11.external_authorization_required r14.token_id r15.token_id into r16;
    ternary r11.external_authorization_required r14.account r15.account into r17;
    ternary r11.external_authorization_required r14.balance r15.balance into r18;
    ternary r11.external_authorization_required r14.authorized_until r15.authorized_until into r19;
    cast r16 r17 r18 r19 into r20 as Balance;
    add r20.balance r2 into r21;
    cast r0 r1 r21 r6.authorized_until into r22 as Balance;
    branch.eq r11.external_authorization_required false to end_then_0_0;
    set r22 into balances[r10];
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    set r22 into authorized_balances[r10];
    position end_otherwise_0_1;




function transfer_public_as_signer:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    async transfer_public_as_signer r0 r1 r2 self.signer into r3;
    output r3 as multi_token_support_program_v1.aleo/transfer_public_as_signer.future;

finalize transfer_public_as_signer:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as address.public;
    cast r3 r0 into r4 as TokenOwner;
    hash.bhp256 r4 into r5 as field;
    get authorized_balances[r5] into r6;
    sub r6.balance r2 into r7;
    cast r0 r3 r7 r6.authorized_until into r8 as Balance;
    set r8 into authorized_balances[r5];
    cast r1 r0 into r9 as TokenOwner;
    hash.bhp256 r9 into r10 as field;
    get registered_tokens[r0] into r11;
    ternary r11.external_authorization_required 0u32 4294967295u32 into r12;
    cast r0 r1 0u128 r12 into r13 as Balance;
    get.or_use balances[r10] r13 into r14;
    get.or_use authorized_balances[r10] r13 into r15;
    ternary r11.external_authorization_required r14.token_id r15.token_id into r16;
    ternary r11.external_authorization_required r14.account r15.account into r17;
    ternary r11.external_authorization_required r14.balance r15.balance into r18;
    ternary r11.external_authorization_required r14.authorized_until r15.authorized_until into r19;
    cast r16 r17 r18 r19 into r20 as Balance;
    add r20.balance r2 into r21;
    cast r0 r1 r21 r6.authorized_until into r22 as Balance;
    branch.eq r11.external_authorization_required false to end_then_0_2;
    set r22 into balances[r10];
    branch.eq true true to end_otherwise_0_3;
    position end_then_0_2;
    set r22 into authorized_balances[r10];
    position end_otherwise_0_3;




function transfer_private:
    input r0 as address.private;
    input r1 as u128.private;
    input r2 as Token.record;
    sub r2.amount r1 into r3;
    cast r2.owner r3 r2.token_id r2.external_authorization_required r2.authorized_until into r4 as Token.record;
    ternary r2.external_authorization_required 0u32 4294967295u32 into r5;
    cast r0 r1 r2.token_id r2.external_authorization_required r5 into r6 as Token.record;
    async transfer_private r2.external_authorization_required r2.authorized_until into r7;
    output r4 as Token.record;
    output r6 as Token.record;
    output r7 as multi_token_support_program_v1.aleo/transfer_private.future;

finalize transfer_private:
    input r0 as boolean.public;
    input r1 as u32.public;
    lte block.height r1 into r2;
    not r0 into r3;
    or r2 r3 into r4;
    assert.eq r4 true;




function transfer_private_to_public:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as Token.record;
    sub r2.amount r1 into r3;
    cast r2.owner r3 r2.token_id r2.external_authorization_required r2.authorized_until into r4 as Token.record;
    async transfer_private_to_public r2.token_id r0 r1 into r5;
    output r4 as Token.record;
    output r5 as multi_token_support_program_v1.aleo/transfer_private_to_public.future;

finalize transfer_private_to_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    cast r1 r0 into r3 as TokenOwner;
    hash.bhp256 r3 into r4 as field;
    get registered_tokens[r0] into r5;
    ternary r5.external_authorization_required 0u32 4294967295u32 into r6;
    cast r0 r1 0u128 r6 into r7 as Balance;
    get.or_use balances[r4] r7 into r8;
    get.or_use authorized_balances[r4] r7 into r9;
    ternary r5.external_authorization_required r8.token_id r9.token_id into r10;
    ternary r5.external_authorization_required r8.account r9.account into r11;
    ternary r5.external_authorization_required r8.balance r9.balance into r12;
    ternary r5.external_authorization_required r8.authorized_until r9.authorized_until into r13;
    cast r10 r11 r12 r13 into r14 as Balance;
    add r14.balance r2 into r15;
    cast r0 r1 r15 r14.authorized_until into r16 as Balance;
    branch.eq r5.external_authorization_required false to end_then_0_4;
    set r16 into balances[r4];
    branch.eq true true to end_otherwise_0_5;
    position end_then_0_4;
    set r16 into authorized_balances[r4];
    position end_otherwise_0_5;




function transfer_public_to_private:
    input r0 as field.public;
    input r1 as address.private;
    input r2 as u128.public;
    input r3 as boolean.public;
    ternary r3 0u32 4294967295u32 into r4;
    cast r1 r2 r0 r3 r4 into r5 as Token.record;
    async transfer_public_to_private r0 r2 self.caller r3 into r6;
    output r5 as Token.record;
    output r6 as multi_token_support_program_v1.aleo/transfer_public_to_private.future;

finalize transfer_public_to_private:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as address.public;
    input r3 as boolean.public;
    get registered_tokens[r0] into r4;
    assert.eq r4.external_authorization_required r3;
    cast r2 r0 into r5 as TokenOwner;
    hash.bhp256 r5 into r6 as field;
    get authorized_balances[r6] into r7;
    sub r7.balance r1 into r8;
    cast r0 r2 r8 r7.authorized_until into r9 as Balance;
    set r9 into authorized_balances[r6];




function initialize:
    async initialize into r0;
    output r0 as multi_token_support_program_v1.aleo/initialize.future;

finalize initialize:
    cast 3443843282313283355522573239085696902919850365217539366784739393210722344986field 1095517519u128 1095517519u128 6u8 1_500_000_000_000_000u128 1_500_000_000_000_000u128 multi_token_support_program_v1.aleo false multi_token_support_program_v1.aleo into r0 as TokenMetadata;
    set r0 into registered_tokens[3443843282313283355522573239085696902919850365217539366784739393210722344986field];




function register_token:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as u128.public;
    input r3 as u8.public;
    input r4 as u128.public;
    input r5 as boolean.public;
    input r6 as address.public;
    is.neq r0 3443843282313283355522573239085696902919850365217539366784739393210722344986field into r7;
    assert.eq r7 true;
    cast r0 r1 r2 r3 0u128 r4 self.caller r5 r6 into r8 as TokenMetadata;
    async register_token r8 into r9;
    output r9 as multi_token_support_program_v1.aleo/register_token.future;

finalize register_token:
    input r0 as TokenMetadata.public;
    contains registered_tokens[r0.token_id] into r1;
    assert.eq r1 false;
    set r0 into registered_tokens[r0.token_id];




function update_token_management:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as address.public;
    is.neq r0 3443843282313283355522573239085696902919850365217539366784739393210722344986field into r3;
    assert.eq r3 true;
    async update_token_management r0 r1 r2 self.caller into r4;
    output r4 as multi_token_support_program_v1.aleo/update_token_management.future;

finalize update_token_management:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as address.public;
    get registered_tokens[r0] into r4;
    assert.eq r3 r4.admin;
    cast r0 r4.name r4.symbol r4.decimals r4.supply r4.max_supply r1 r4.external_authorization_required r2 into r5 as TokenMetadata;




function mint_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as u32.public;
    is.neq r0 3443843282313283355522573239085696902919850365217539366784739393210722344986field into r4;
    assert.eq r4 true;
    async mint_public r0 r1 r2 r3 self.caller into r5;
    output r5 as multi_token_support_program_v1.aleo/mint_public.future;

finalize mint_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as u32.public;
    input r4 as address.public;
    get registered_tokens[r0] into r5;
    assert.eq r5.admin r4;
    add r5.supply r2 into r6;
    lte r6 r5.max_supply into r7;
    assert.eq r7 true;
    cast r1 r0 into r8 as TokenOwner;
    hash.bhp256 r8 into r9 as field;
    cast r0 r1 0u128 r3 into r10 as Balance;
    get.or_use balances[r9] r10 into r11;
    get.or_use authorized_balances[r9] r10 into r12;
    ternary r5.external_authorization_required r11.token_id r12.token_id into r13;
    ternary r5.external_authorization_required r11.account r12.account into r14;
    ternary r5.external_authorization_required r11.balance r12.balance into r15;
    ternary r5.external_authorization_required r11.authorized_until r12.authorized_until into r16;
    cast r13 r14 r15 r16 into r17 as Balance;
    add r17.balance r2 into r18;
    cast r0 r1 r18 r17.authorized_until into r19 as Balance;
    branch.eq r5.external_authorization_required false to end_then_0_6;
    set r19 into balances[r9];
    branch.eq true true to end_otherwise_0_7;
    position end_then_0_6;
    set r19 into authorized_balances[r9];
    position end_otherwise_0_7;
    cast r0 r5.name r5.symbol r5.decimals r6 r5.max_supply r5.admin r5.external_authorization_required r5.external_authorization_party into r20 as TokenMetadata;
    set r20 into registered_tokens[r0];




function mint_private:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as boolean.public;
    input r4 as u32.public;
    is.neq r0 3443843282313283355522573239085696902919850365217539366784739393210722344986field into r5;
    assert.eq r5 true;
    cast r1 r2 r0 r3 r4 into r6 as Token.record;
    async mint_private r0 r1 r2 r3 r4 self.caller into r7;
    output r6 as Token.record;
    output r7 as multi_token_support_program_v1.aleo/mint_private.future;

finalize mint_private:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as boolean.public;
    input r4 as u32.public;
    input r5 as address.public;
    get registered_tokens[r0] into r6;
    assert.eq r6.admin r5;
    add r6.supply r2 into r7;
    lte r7 r6.max_supply into r8;
    assert.eq r8 true;
    assert.eq r6.external_authorization_required r3;
    cast r0 r6.name r6.symbol r6.decimals r7 r6.max_supply r6.admin r6.external_authorization_required r6.external_authorization_party into r9 as TokenMetadata;
    set r9 into registered_tokens[r0];




function burn_public:
    input r0 as TokenOwner.public;
    input r1 as u128.public;
    is.neq r0.token_id 3443843282313283355522573239085696902919850365217539366784739393210722344986field into r2;
    assert.eq r2 true;
    async burn_public r0 r1 self.caller into r3;
    output r3 as multi_token_support_program_v1.aleo/burn_public.future;

finalize burn_public:
    input r0 as TokenOwner.public;
    input r1 as u128.public;
    input r2 as address.public;
    get registered_tokens[r0.token_id] into r3;
    assert.eq r3.admin r2;
    sub r3.supply r1 into r4;
    cast r0.token_id r0.account 0u128 0u32 into r5 as Balance;
    hash.bhp256 r0 into r6 as field;
    get.or_use balances[r6] r5 into r7;
    cast r7.balance into r8 as i128;
    cast r1 into r9 as i128;
    sub r8 r9 into r10;
    gte r10 0i128 into r11;
    cast r10 into r12 as u128;
    ternary r11 r12 0u128 into r13;
    cast r0.token_id r0.account r13 r7.authorized_until into r14 as Balance;
    set r14 into balances[r6];
    lt r10 0i128 into r15;
    branch.eq r15 false to end_then_0_8;
    sub r1 r7.balance into r16;
    get authorized_balances[r6] into r17;
    sub r17.balance r16 into r18;
    cast r0.token_id r0.account r18 r17.authorized_until into r19 as Balance;
    set r19 into authorized_balances[r6];
    branch.eq true true to end_otherwise_0_9;
    position end_then_0_8;
    position end_otherwise_0_9;
    cast r0.token_id r3.name r3.symbol r3.decimals r4 r3.max_supply r3.admin r3.external_authorization_required r3.external_authorization_party into r20 as TokenMetadata;
    set r20 into registered_tokens[r0.token_id];




function burn_private:
    input r0 as Token.record;
    input r1 as u128.public;
    is.neq r0.token_id 3443843282313283355522573239085696902919850365217539366784739393210722344986field into r2;
    assert.eq r2 true;
    sub r0.amount r1 into r3;
    cast r0.owner r3 r0.token_id r0.external_authorization_required r0.authorized_until into r4 as Token.record;
    async burn_private r0.token_id r1 self.caller into r5;
    output r4 as Token.record;
    output r5 as multi_token_support_program_v1.aleo/burn_private.future;

finalize burn_private:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as address.public;
    get registered_tokens[r0] into r3;
    assert.eq r3.admin r2;
    sub r3.supply r1 into r4;
    cast r0 r3.name r3.symbol r3.decimals r4 r3.max_supply r3.admin r3.external_authorization_required r3.external_authorization_party into r5 as TokenMetadata;
    set r5 into registered_tokens[r0];




function prehook_public:
    input r0 as TokenOwner.public;
    input r1 as u128.public;
    input r2 as u32.public;
    async prehook_public r0 r1 r2 self.caller into r3;
    output r3 as multi_token_support_program_v1.aleo/prehook_public.future;

finalize prehook_public:
    input r0 as TokenOwner.public;
    input r1 as u128.public;
    input r2 as u32.public;
    input r3 as address.public;
    get registered_tokens[r0.token_id] into r4;
    is.eq r3 r4.external_authorization_party into r5;
    assert.eq r5 true;
    hash.bhp256 r0 into r6 as field;
    get balances[r6] into r7;
    sub r7.balance r1 into r8;
    cast r0.token_id r0.account r8 r7.authorized_until into r9 as Balance;
    set r9 into balances[r6];
    cast r0.token_id r0.account 0u128 r2 into r10 as Balance;
    get.or_use authorized_balances[r6] r10 into r11;
    add r11.balance r1 into r12;
    cast r0.token_id r0.account r12 r2 into r13 as Balance;
    set r13 into authorized_balances[r6];




function prehook_private:
    input r0 as Token.record;
    input r1 as u128.private;
    input r2 as u32.private;
    sub r0.amount r1 into r3;
    cast r0.owner r3 r0.token_id r0.external_authorization_required r0.authorized_until into r4 as Token.record;
    cast r0.owner r1 r0.token_id r0.external_authorization_required r2 into r5 as Token.record;
    async prehook_private r0.token_id self.caller into r6;
    output r4 as Token.record;
    output r5 as Token.record;
    output r6 as multi_token_support_program_v1.aleo/prehook_private.future;

finalize prehook_private:
    input r0 as field.public;
    input r1 as address.public;
    get registered_tokens[r0] into r2;
    is.eq r1 r2.external_authorization_party into r3;
    assert.eq r3 true;




function approve_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    async approve_public r0 r1 r2 self.caller into r3;
    output r3 as multi_token_support_program_v1.aleo/approve_public.future;

finalize approve_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as address.public;
    cast r3 r0 into r4 as TokenOwner;
    hash.bhp256 r3 into r5 as field;
    contains balances[r5] into r6;
    contains authorized_balances[r5] into r7;
    or r6 r7 into r8;
    assert.eq r8 true;
    cast r3 r1 r0 into r9 as Allowance;
    hash.bhp256 r9 into r10 as field;
    get.or_use allowances[r10] 0u128 into r11;
    add r11 r2 into r12;
    set r12 into allowances[r10];




function unapprove_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    async unapprove_public r0 r1 r2 self.caller into r3;
    output r3 as multi_token_support_program_v1.aleo/unapprove_public.future;

finalize unapprove_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as address.public;
    cast r3 r1 r0 into r4 as Allowance;
    hash.bhp256 r4 into r5 as field;
    get allowances[r5] into r6;
    gte r6 r2 into r7;
    assert.eq r7 true;
    sub r6 r2 into r8;
    set r8 into allowances[r5];




function transfer_from_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u128.public;
    async transfer_from_public r0 r1 r2 r3 self.caller into r4;
    output r4 as multi_token_support_program_v1.aleo/transfer_from_public.future;

finalize transfer_from_public:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as address.public;
    cast r1 r4 r0 into r5 as Allowance;
    hash.bhp256 r5 into r6 as field;
    get allowances[r6] into r7;
    gte r7 r3 into r8;
    assert.eq r8 true;
    sub r7 r3 into r9;
    set r9 into allowances[r6];
    cast r1 r0 into r10 as TokenOwner;
    hash.bhp256 r1 into r11 as field;
    get authorized_balances[r11] into r12;
    assert.eq r1 r12.account;
    gte r12.balance r3 into r13;
    assert.eq r13 true;
    sub r12.balance r3 into r14;
    cast r0 r1 r14 r12.authorized_until into r15 as Balance;
    set r15 into authorized_balances[r11];
    cast r2 r0 into r16 as TokenOwner;
    hash.bhp256 r16 into r17 as field;
    get registered_tokens[r0] into r18;
    ternary r18.external_authorization_required 0u32 4294967295u32 into r19;
    cast r0 r2 0u128 r19 into r20 as Balance;
    get.or_use balances[r17] r20 into r21;
    get.or_use authorized_balances[r17] r20 into r22;
    ternary r18.external_authorization_required r21.token_id r22.token_id into r23;
    ternary r18.external_authorization_required r21.account r22.account into r24;
    ternary r18.external_authorization_required r21.balance r22.balance into r25;
    ternary r18.external_authorization_required r21.authorized_until r22.authorized_until into r26;
    cast r23 r24 r25 r26 into r27 as Balance;
    add r27.balance r3 into r28;
    cast r0 r2 r28 r12.authorized_until into r29 as Balance;
    branch.eq r18.external_authorization_required false to end_then_0_10;
    set r29 into balances[r17];
    branch.eq true true to end_otherwise_0_11;
    position end_then_0_10;
    set r29 into authorized_balances[r17];
    position end_otherwise_0_11;




function transfer_from_public_to_private:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as address.private;
    input r3 as u128.public;
    input r4 as boolean.public;
    ternary r4 0u32 4294967295u32 into r5;
    cast r2 r3 r0 r4 r5 into r6 as Token.record;
    async transfer_from_public_to_private r0 r1 r3 self.caller r4 into r7;
    output r6 as Token.record;
    output r7 as multi_token_support_program_v1.aleo/transfer_from_public_to_private.future;

finalize transfer_from_public_to_private:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as address.public;
    input r4 as boolean.public;
    get registered_tokens[r0] into r5;
    assert.eq r5.external_authorization_required r4;
    cast r1 r3 r0 into r6 as Allowance;
    hash.bhp256 r6 into r7 as field;
    get allowances[r7] into r8;
    gte r8 r2 into r9;
    assert.eq r9 true;
    sub r8 r2 into r10;
    set r10 into allowances[r7];
    cast r1 r0 into r11 as TokenOwner;
    hash.bhp256 r1 into r12 as field;
    get authorized_balances[r12] into r13;
    assert.eq r1 r13.account;
    gte r13.balance r2 into r14;
    assert.eq r14 true;
    sub r13.balance r2 into r15;
    cast r0 r1 r15 r13.authorized_until into r16 as Balance;
    set r16 into authorized_balances[r12];




function deposit_credits_public:
    input r0 as u64.public;
    call credits.aleo/transfer_public_as_signer multi_token_support_program_v1.aleo r0 into r1;
    cast r0 into r2 as u128;
    async deposit_credits_public r1 r2 self.caller into r3;
    output r3 as multi_token_support_program_v1.aleo/deposit_credits_public.future;

finalize deposit_credits_public:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as u128.public;
    input r2 as address.public;
    await r0;
    cast r2 3443843282313283355522573239085696902919850365217539366784739393210722344986field into r3 as TokenOwner;
    hash.bhp256 r3 into r4 as field;
    cast 3443843282313283355522573239085696902919850365217539366784739393210722344986field r2 0u128 4294967295u32 into r5 as Balance;
    get.or_use authorized_balances[r4] r5 into r6;
    add r6.balance r1 into r7;
    cast 3443843282313283355522573239085696902919850365217539366784739393210722344986field r2 r7 r6.authorized_until into r8 as Balance;
    set r8 into authorized_balances[r4];




function deposit_credits_private:
    input r0 as credits.aleo/credits.record;
    input r1 as u64.private;
    call credits.aleo/transfer_private_to_public r0 multi_token_support_program_v1.aleo r1 into r2 r3;
    cast r1 into r4 as u128;
    cast r0.owner r4 3443843282313283355522573239085696902919850365217539366784739393210722344986field false 4294967295u32 into r5 as Token.record;
    async deposit_credits_private r3 into r6;
    output r2 as credits.aleo/credits.record;
    output r5 as Token.record;
    output r6 as multi_token_support_program_v1.aleo/deposit_credits_private.future;

finalize deposit_credits_private:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;




function withdraw_credits_public:
    input r0 as u64.private;
    call credits.aleo/transfer_public self.caller r0 into r1;
    cast r0 into r2 as u128;
    async withdraw_credits_public r1 r2 self.caller into r3;
    output r3 as multi_token_support_program_v1.aleo/withdraw_credits_public.future;

finalize withdraw_credits_public:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as u128.public;
    input r2 as address.public;
    await r0;
    cast r2 3443843282313283355522573239085696902919850365217539366784739393210722344986field into r3 as TokenOwner;
    hash.bhp256 r3 into r4 as field;
    get authorized_balances[r4] into r5;
    sub r5.balance r1 into r6;
    cast 3443843282313283355522573239085696902919850365217539366784739393210722344986field r2 r6 r5.authorized_until into r7 as Balance;
    set r7 into authorized_balances[r4];




function withdraw_credits_private:
    input r0 as Token.record;
    input r1 as u64.private;
    is.eq r0.token_id 3443843282313283355522573239085696902919850365217539366784739393210722344986field into r2;
    assert.eq r2 true;
    call credits.aleo/transfer_public_to_private r0.owner r1 into r3 r4;
    cast r1 into r5 as u128;
    sub r0.amount r5 into r6;
    cast r0.owner r6 r0.token_id r0.external_authorization_required r0.authorized_until into r7 as Token.record;
    async withdraw_credits_private r4 into r8;
    output r7 as Token.record;
    output r3 as credits.aleo/credits.record;
    output r8 as multi_token_support_program_v1.aleo/withdraw_credits_private.future;

finalize withdraw_credits_private:
    input r0 as credits.aleo/transfer_public_to_private.future;
    await r0;

