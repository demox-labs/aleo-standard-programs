import multi_token_support_program_v1.aleo;

program pondo_token.aleo {
  const PONDO_TOKEN_ID: field = 0field;

  // The Pondo token is only minted once and the total supply is fixed.
  async transition initialize_token() -> Future {
    assert_eq(self.caller, pondo_core_protocol.aleo);

    let name: u128 = 97240284627655645872219502u128; // "Pondo Token", ascii encoded
    let symbol: u128 = 1347306575u128; // "PNDO", ascii encoded
    let decimals: u8 = 6u8;
    let max_supply: u128 = 1_000_000_000_000_000u128;
    let external_authorization_required: bool = false;
    let external_authorization_party: address = pondo_token.aleo;

    let f0: Future = multi_token_support_program_v1.aleo/register_token(PONDO_TOKEN_ID, name, symbol, decimals, max_supply, external_authorization_required, external_authorization_party);
    let f1: Future = multi_token_support_program_v1.aleo/mint_public(PONDO_TOKEN_ID, pondo_token.aleo, max_supply, 4294967295u32);

    return finalize_initialize_token(f0, f1);
  }

  async function finalize_initialize_token(
    f0: Future,
    f1: Future
  ) {
    f0.await();
    f1.await();
  }

  async transition burn_public(public burner: address, public amount: u64) -> Future {
    let signed_by_owner: bool = self.signer == burner;
    let called_by_owner: bool = self.caller == burner;
    assert(signed_by_owner || called_by_owner);

    let f0: Future = multi_token_support_program_v1.aleo/burn_public(PONDO_TOKEN_ID, burner, amount as u128);
    return finalize_burn_public(f0);
  }

  async function finalize_burn_public(f0: Future) {
    f0.await();
  }

  async transition burn_private(
    private input_record: multi_token_support_program_v1.aleo/Token,
    private burn_amount: u128
  ) -> (multi_token_support_program_v1.aleo/Token, Future) {
    let output: (multi_token_support_program_v1.aleo/Token, Future) = multi_token_support_program_v1.aleo/burn_private(input_record, burn_amount);

    return (output.0, finalize_burn_private());
  }

  async function finalize_burn_private() {
    assert(true);
  }
}