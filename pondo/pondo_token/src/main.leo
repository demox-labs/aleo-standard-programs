import multi_token_support_program_v1.aleo;

program pondo_token.aleo {
  const PONDO_TOKEN_ID: field = 1751493913335802797273486270793650302076377624243810059080883537084141842601field;
  const PALEO_TOKEN_ID: field = 1751493913335802797273486270793650302076377624243810059080883537084141842600field;
  const PONDO_FOUNDATION_ADDRESS: address = aleo1hmrpe0ts2khluprhex3y46cqqy44pme7lwc40ls9nexftx0xhu8sxxpnd0;
  const PRECISION: u128 = 1_000_000u128;

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
    let f1: Future = multi_token_support_program_v1.aleo/mint_public(PONDO_TOKEN_ID, PONDO_FOUNDATION_ADDRESS, max_supply, 4294967295u32);

    return finalize_initialize_token(f0, f1);
  }

  async function finalize_initialize_token(
    f0: Future,
    f1: Future
  ) {
    f0.await();
    f1.await();
  }

  async transition burn_public(public burner: address, public amount: u128, public paleo_amount: u128) -> Future {
    // Sanity checks to ensure that the amounts are greater than 0
    assert(amount > 0u128);
    assert(paleo_amount > 0u128);

    let signed_by_owner: bool = self.signer == burner;
    let called_by_owner: bool = self.caller == burner;
    assert(signed_by_owner || called_by_owner);

    let f0: Future = multi_token_support_program_v1.aleo/burn_public(PONDO_TOKEN_ID, burner, amount);

    let f1: Future = multi_token_support_program_v1.aleo/transfer_public(PALEO_TOKEN_ID, burner, paleo_amount);

    return finalize_burn_public(f0, f1, amount, paleo_amount);
  }

  async function finalize_burn_public(f0: Future, f1: Future, amount: u128, paleo_amount: u128) {
    f0.await();
    f1.await();

    // Get the total supply of pondo
    let pondo_supply_after: TokenMetadata = multi_token_support_program_v1.aleo/registered_tokens.get(PONDO_TOKEN_ID);

    // Get the pondo_token's balance of paleo
    let token_owner: TokenOwner = TokenOwner {
      account: pondo_token.aleo,
      token_id: PALEO_TOKEN_ID
    };
    let balance_key: field = BHP256::hash_to_field(token_owner);
    let paleo_balance_after: Balance = multi_token_support_program_v1.aleo/authorized_balances.get(balance_key);

    // Calculate the pondo to paleo ratio
    let pondo_paleo_ratio: u128 = pondo_supply_after.supply * PRECISION / paleo_balance_after.balance;
    let withdrawal_ratio: u128 = amount * PRECISION / paleo_amount;

    // Ensure that the pondo to paleo ratio is greater than the withdrawal ratio
    let valid_withdrawal: bool = pondo_paleo_ratio >= withdrawal_ratio;
    assert(valid_withdrawal);
  }
}