import multi_token_support_program_v02.aleo;

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
    let external_authorization_party: address = pondo_staked_aleo_token.aleo;

    let f0: Future = multi_token_support_program_v02.aleo/register_token(PALEO_TOKEN_ID, name, symbol, decimals, max_supply, external_authorization_required, external_authorization_party);

    return finalize_register_token(f0);
  }

  async function finalize_register_token(f0: Future) {
    f0.await();
  }

  async transition mint_public(
    public amount: u64,
    public receiver: address
  ) -> Future {
    assert_eq(self.caller, pondo_core_protocol.aleo);

    // Mint the pALEO tokens to the receiver, with u32::MAX as the expiration time
    let f0: Future = multi_token_support_program_v02.aleo/mint_public(PALEO_TOKEN_ID, receiver, amount as u128, 4294967295u32);
    return finalize_mint_public(f0);
  }

  async function finalize_mint_public(f0: Future) {
    f0.await();
  }

  async transition burn_public(
    public amount: u64,
    public owner: address
  ) -> Future {
    assert_eq(self.caller, pondo_core_protocol.aleo);

    let f0: Future = multi_token_support_program_v02.aleo/burn_public(PALEO_TOKEN_ID, owner, amount as u128);
    return finalize_burn_public(f0);
  }

  async function finalize_burn_public(f0: Future) {
    f0.await();
  }
}