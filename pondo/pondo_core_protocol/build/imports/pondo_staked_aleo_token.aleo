import credits.aleo;
import multi_token_support_program.aleo;
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
    call multi_token_support_program.aleo/register_token 1751493913335802797273486270793650302076377624243810059080883537084141842600field 1631421259099656974472467909989204u128 482131854671u128 6u8 1_000_000_000_000_000u128 false pondo_staked_aleo_token.aleo into r0;
    call multi_token_support_program.aleo/set_role 1751493913335802797273486270793650302076377624243810059080883537084141842600field pondo_core_protocol.aleo 3u8 into r1;
    async register_token r0 r1 into r2;
    output r2 as pondo_staked_aleo_token.aleo/register_token.future;

finalize register_token:
    input r0 as multi_token_support_program.aleo/register_token.future;
    input r1 as multi_token_support_program.aleo/set_role.future;
    await r0;
    await r1;

