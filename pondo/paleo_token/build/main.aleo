import credits.aleo;
import token_registry.aleo;
program paleo_token.aleo;


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
    assert.eq self.caller pondo_protocol.aleo;
    call token_registry.aleo/register_token 1751493913335802797273486270793650302076377624243810059080883537084141842600field 1631421259099656974472467909989204u128 482131854671u128 6u8 10_000_000_000_000_000u128 false paleo_token.aleo into r0;
    call token_registry.aleo/set_role 1751493913335802797273486270793650302076377624243810059080883537084141842600field pondo_protocol.aleo 3u8 into r1;
    async register_token r0 r1 into r2;
    output r2 as paleo_token.aleo/register_token.future;

finalize register_token:
    input r0 as token_registry.aleo/register_token.future;
    input r1 as token_registry.aleo/set_role.future;
    await r0;
    await r1;

