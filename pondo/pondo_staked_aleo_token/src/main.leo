import multi_token_support_program.aleo;

// -----------------------------------------------------------
// pALEO Token Program
// -----------------------------------------------------------
program pondo_staked_aleo_token.aleo {
  const PALEO_TOKEN_ID: field = 1751493913335802797273486270793650302076377624243810059080883537084141842600field;

  async transition register_token() -> Future {
    assert_eq(self.caller, pondo_core_protocol.aleo);

    let name: u128 = 1631421259099656974472467909989204u128; // "Pondo Aleo LST" ascii encoded
    let symbol: u128 = 482131854671u128; // "pALEO" ascii encoded
    let decimals: u8 = 6u8;
    let max_supply: u128 = 1_000_000_000_000_000u128;
    let external_authorization_required: bool = false;
    let external_authorization_party: address = self.address;

    let f0: Future = multi_token_support_program.aleo/register_token(
      PALEO_TOKEN_ID,
      name,
      symbol,
      decimals,
      max_supply,
      external_authorization_required,
      external_authorization_party
      );

    let f1: Future = multi_token_support_program.aleo/set_role(
      PALEO_TOKEN_ID,
      pondo_core_protocol.aleo,
      3u8 // SUPPLY_MANAGER_ROLE
      );

    return finalize_register_token(f0, f1);
  }

  async function finalize_register_token(f0: Future, f1: Future) {
    f0.await();
    f1.await();
  }
}