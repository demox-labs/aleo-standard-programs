import multi_token_support_program.aleo;

program cat_no_hat.aleo {
    const ADMIN: address = aleo1784rtr929xtrag6xr5kqntafuzc8ktrgav89s27m5swpschdz5gqhdem0x;

    async transition initialize() -> Future {
      assert_eq(ADMIN, self.caller);

      let f0: Future = multi_token_support_program.aleo/register_token(
        4846247369341682004field, // token_id: field,
        4846247369341682004u128, // name: u128,
        4846247369341682004u128, // symbol: u128, CATNOHAT
        6u8, // decimals: u8,
        1_000_000_000_000_000u128, // max_supply: u128,
        false, // external_authorization_required: bool
        cat_no_hat.aleo, // external_authorization_party: address
      );

      let f1: Future = multi_token_support_program.aleo/mint_public(
        4846247369341682004field, // token_id: field,
        ADMIN, // recipient: address,
        1_000_000_000_000_000u128, // amount: u128,
        4_294_967_295u32 // authorized_until: u32
      );

      return finalize_initialize(f0, f1);
    }

    async function finalize_initialize(
      f0: Future,
      f1: Future
    ) {
      f0.await();
      f1.await();
    }
}
