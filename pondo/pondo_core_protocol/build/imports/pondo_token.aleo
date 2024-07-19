import credits.aleo;
import multi_token_support_program_v1.aleo;
program pondo_token.aleo;


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




function burn_public:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as u128.public;
    gt r1 0u128 into r3;
    assert.eq r3 true;
    gt r2 0u128 into r4;
    assert.eq r4 true;
    is.eq self.signer r0 into r5;
    is.eq self.caller r0 into r6;
    or r5 r6 into r7;
    assert.eq r7 true;
    call multi_token_support_program_v1.aleo/burn_public 1751493913335802797273486270793650302076377624243810059080883537084141842601field r0 r1 into r8;
    call multi_token_support_program_v1.aleo/transfer_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field r0 r2 into r9;
    async burn_public r8 r9 r1 r2 into r10;
    output r10 as pondo_token.aleo/burn_public.future;

finalize burn_public:
    input r0 as multi_token_support_program_v1.aleo/burn_public.future;
    input r1 as multi_token_support_program_v1.aleo/transfer_public.future;
    input r2 as u128.public;
    input r3 as u128.public;
    await r0;
    await r1;
    get multi_token_support_program_v1.aleo/registered_tokens[1751493913335802797273486270793650302076377624243810059080883537084141842601field] into r4;
    cast pondo_token.aleo 1751493913335802797273486270793650302076377624243810059080883537084141842600field into r5 as TokenOwner;
    hash.bhp256 r5 into r6 as field;
    get multi_token_support_program_v1.aleo/authorized_balances[r6] into r7;
    mul r4.supply 1_000_000u128 into r8;
    div r8 r7.balance into r9;
    mul r2 1_000_000u128 into r10;
    div r10 r3 into r11;
    gte r9 r11 into r12;
    assert.eq r12 true;




function initialize_token:
    assert.eq self.caller pondo_core_protocol.aleo;
    call multi_token_support_program_v1.aleo/register_token 1751493913335802797273486270793650302076377624243810059080883537084141842601field 97240284627655645872219502u128 1347306575u128 6u8 1_000_000_000_000_000u128 false pondo_token.aleo into r0;
    call multi_token_support_program_v1.aleo/mint_public 1751493913335802797273486270793650302076377624243810059080883537084141842601field aleo1hmrpe0ts2khluprhex3y46cqqy44pme7lwc40ls9nexftx0xhu8sxxpnd0 1_000_000_000_000_000u128 4294967295u32 into r1;
    async initialize_token r0 r1 into r2;
    output r2 as pondo_token.aleo/initialize_token.future;

finalize initialize_token:
    input r0 as multi_token_support_program_v1.aleo/register_token.future;
    input r1 as multi_token_support_program_v1.aleo/mint_public.future;
    await r0;
    await r1;

