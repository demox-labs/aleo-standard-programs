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




function burn_public:
    input r0 as address.public;
    input r1 as u64.public;
    cast r1 into r2 as u128;
    call multi_token_support_program_v1.aleo/burn_public 0field r0 r2 into r3;
    async burn_public r3 into r4;
    output r4 as pondo_token.aleo/burn_public.future;

finalize burn_public:
    input r0 as multi_token_support_program_v1.aleo/burn_public.future;
    await r0;




function burn_private:
    input r0 as multi_token_support_program_v1.aleo/Token.record;
    input r1 as u128.private;
    call multi_token_support_program_v1.aleo/burn_private r0 r1 into r2 r3;
    async burn_private into r4;
    output r2 as multi_token_support_program_v1.aleo/Token.record;
    output r4 as pondo_token.aleo/burn_private.future;

finalize burn_private:
    assert.eq true true;




function initialize_token:
    assert.eq self.caller pondo_core_protocol.aleo;
    call multi_token_support_program_v1.aleo/register_token 0field 345466889327u128 1347306575u128 6u8 1_000_000_000_000_000u128 false pondo_token.aleo into r0;
    call multi_token_support_program_v1.aleo/mint_public 0field pondo_token.aleo 1_000_000_000_000_000u128 4294967295u32 into r1;
    async initialize_token r0 r1 into r2;
    output r2 as pondo_token.aleo/initialize_token.future;

finalize initialize_token:
    input r0 as multi_token_support_program_v1.aleo/register_token.future;
    input r1 as multi_token_support_program_v1.aleo/mint_public.future;
    await r0;
    await r1;

