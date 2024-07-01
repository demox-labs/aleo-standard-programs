import credits.aleo;
import multi_token_support_program_v1.aleo;
program cat_no_hat.aleo;


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
    assert.eq aleo1784rtr929xtrag6xr5kqntafuzc8ktrgav89s27m5swpschdz5gqhdem0x self.caller;
    call multi_token_support_program_v1.aleo/register_token 4846247369341682004field 4846247369341682004u128 4846247369341682004u128 6u8 1_000_000_000_000_000u128 false cat_no_hat.aleo into r0;
    call multi_token_support_program_v1.aleo/mint_public 4846247369341682004field aleo1784rtr929xtrag6xr5kqntafuzc8ktrgav89s27m5swpschdz5gqhdem0x 1_000_000_000_000_000u128 4_294_967_295u32 into r1;
    async initialize r0 r1 into r2;
    output r2 as cat_no_hat.aleo/initialize.future;

finalize initialize:
    input r0 as multi_token_support_program_v1.aleo/register_token.future;
    input r1 as multi_token_support_program_v1.aleo/mint_public.future;
    await r0;
    await r1;

