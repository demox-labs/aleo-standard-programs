import credits.aleo;
import multi_token_support_program.aleo;
program simple_token_v2.aleo;


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




function initialize:
    assert.eq self.caller aleo15xd9tee983ts3urff8j22q64wvcyc8geakghyc3ew5u0v8jfuqgs958t6d;
    call multi_token_support_program.aleo/register_token 4846247369341682005field 4846247369341682004u128 4846247369341682004u128 6u8 1_000_000_000_000_000u128 false simple_token_v2.aleo into r0;
    call multi_token_support_program.aleo/mint_public 4846247369341682005field aleo15xd9tee983ts3urff8j22q64wvcyc8geakghyc3ew5u0v8jfuqgs958t6d 1_000_000_000_000_000u128 4_294_967_295u32 into r1;
    async initialize r0 r1 into r2;
    output r2 as simple_token_v2.aleo/initialize.future;

finalize initialize:
    input r0 as multi_token_support_program.aleo/register_token.future;
    input r1 as multi_token_support_program.aleo/mint_public.future;
    await r0;
    await r1;



function generate_hash:
    input r0 as field.public;
    input r1 as address.public;
    call multi_token_support_program.aleo/generate_hash r0 r1 into r2;
    output r2 as field.private;
