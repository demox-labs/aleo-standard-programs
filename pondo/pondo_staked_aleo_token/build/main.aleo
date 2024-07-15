import credits.aleo;
import multi_token_support_program_v1.aleo;
program pondo_staked_aleo_token.aleo;


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




function register_token:
    assert.eq self.caller pondo_core_protocol.aleo;
    call multi_token_support_program_v1.aleo/register_token 1751493913335802797273486270793650302076377624243810059080883537084141842600field 1631421259099656974472467909989204u128 482131854671u128 6u8 1_000_000_000_000_000u128 false pondo_staked_aleo_token.aleo into r0;
    async register_token r0 into r1;
    output r1 as pondo_staked_aleo_token.aleo/register_token.future;

finalize register_token:
    input r0 as multi_token_support_program_v1.aleo/register_token.future;
    await r0;




function mint_public:
    input r0 as u64.public;
    input r1 as address.public;
    assert.eq self.caller pondo_core_protocol.aleo;
    cast r0 into r2 as u128;
    call multi_token_support_program_v1.aleo/mint_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field r1 r2 4294967295u32 into r3;
    async mint_public r3 into r4;
    output r4 as pondo_staked_aleo_token.aleo/mint_public.future;

finalize mint_public:
    input r0 as multi_token_support_program_v1.aleo/mint_public.future;
    await r0;




function burn_public:
    input r0 as u64.public;
    input r1 as address.public;
    assert.eq self.caller pondo_core_protocol.aleo;
    cast r0 into r2 as u128;
    call multi_token_support_program_v1.aleo/burn_public 1751493913335802797273486270793650302076377624243810059080883537084141842600field r1 r2 into r3;
    async burn_public r3 into r4;
    output r4 as pondo_staked_aleo_token.aleo/burn_public.future;

finalize burn_public:
    input r0 as multi_token_support_program_v1.aleo/burn_public.future;
    await r0;

