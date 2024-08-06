import multi_token_support_program.aleo;

// The 'simple_token' program.
program simple_token_v2.aleo {
  const ADMIN: address = aleo15xd9tee983ts3urff8j22q64wvcyc8geakghyc3ew5u0v8jfuqgs958t6d;


  struct TokenOwner {
    account: address,
    token_id: field
  }
  
  async transition initialize() -> Future {
    assert_eq(self.caller, ADMIN);
    let r0: Future = multi_token_support_program.aleo/register_token(
      4846247369341682005field, // token_id: field
      4846247369341682004u128, // name: u128, CATNOHAT ascii encoded
      4846247369341682004u128, // symbol: u128, CATNOHAT ascii encoded
      6u8, // decimals: u8
      1_000_000_000_000_000u128, // max_supply: u128
      false, // external_authorization_required: boolean
      self.address // external_authorization_party: address
    );
    let r1: Future = multi_token_support_program.aleo/mint_public(
      4846247369341682005field, // token_id: field
      ADMIN,
      1_000_000_000_000_000u128,
      4_294_967_295u32
    );
    return initialize_future(r0, r1);
  }

  async function initialize_future(
    r0: Future,
    r1: Future
  ) {
    r0.await();
    r1.await();
  }
}
