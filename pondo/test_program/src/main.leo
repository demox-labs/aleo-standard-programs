import credits.aleo;
import token_registry.aleo;
import pondo_protocol.aleo;

program test_program.aleo {
  const PALEO_TOKEN_ID: field = 1751493913335802797273486270793650302076377624243810059080883537084141842600field;
  const CREDITS_TOKEN_ID: field = 3443843282313283355522573239085696902919850365217539366784739393210722344986field;
  const PRECISION_UNSIGNED: u128 = 10_000u128;
  const INSTANT_WITHDRAW_FEE: u128 = 025u128; // out of 10,000, 0.25% fee


  async transition double_deposit(deposit: u64, expected_paleo: u64) -> Future {
    let f0: Future = pondo_protocol.aleo/deposit_public_as_signer(deposit, expected_paleo, self.address);
    let f1: Future = pondo_protocol.aleo/deposit_public_as_signer(deposit, expected_paleo, self.address);

    return finalize_double_deposit(f0, f1);
  }

  async function finalize_double_deposit(f0: Future, f1: Future) {
    f0.await();
    f1.await();
  }

  async transition deposit_withdraw_as_signer(deposit: u64, expected_paleo: u64) -> Future {
    let f0: Future = pondo_protocol.aleo/deposit_public_as_signer(deposit, expected_paleo, self.address);
    let f1: Future = pondo_protocol.aleo/withdraw_public_as_signer(expected_paleo);

    return finalize_deposit_withdraw_as_signer(f0, f1);
  }

  async function finalize_deposit_withdraw_as_signer(f0: Future, f1: Future) {
    f0.await();
    f1.await();
  }

  async transition deposit_instant_withdraw_signer(deposit: u64, expected_paleo: u64, subtract_fee: bool) -> Future {
    let f0: Future = pondo_protocol.aleo/deposit_public_as_signer(deposit, expected_paleo, self.address);

    let expectedAleo: u128 = subtract_fee ? deposit as u128 - (deposit as u128 * INSTANT_WITHDRAW_FEE / PRECISION_UNSIGNED) : deposit as u128;
    let f1: Future = pondo_protocol.aleo/instant_withdraw_public_signer(expected_paleo, expectedAleo as u64);

    return finalize_deposit_instant_withdraw_signer(f0, f1);
  }

  async function finalize_deposit_instant_withdraw_signer(f0: Future, f1: Future) {
    f0.await();
    f1.await();
  }

  async transition deposit_withdraw(deposit: u64, expected_paleo: u64, subtract_fee: bool) -> Future {
    let f0: Future = token_registry.aleo/transfer_from_public(CREDITS_TOKEN_ID, self.caller, self.address, deposit as u128);
    let f1: Future = token_registry.aleo/approve_public(CREDITS_TOKEN_ID, pondo_protocol.aleo, deposit as u128);

    let f2: Future = pondo_protocol.aleo/deposit_public(deposit, expected_paleo, self.address);
    let f3: Future = pondo_protocol.aleo/withdraw_public(expected_paleo);

    return finalize_deposit_withdraw(f0, f1, f2, f3);
  }

  async function finalize_deposit_withdraw(f0: Future, f1: Future, f2: Future, f3: Future) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
  }

  async transition deposit_instant_withdraw(deposit: u64, expected_paleo: u64, subtract_fee: bool) -> Future {
    let f0: Future = token_registry.aleo/transfer_from_public(CREDITS_TOKEN_ID, self.caller, self.address, deposit as u128);
    let f1: Future = token_registry.aleo/approve_public(CREDITS_TOKEN_ID, pondo_protocol.aleo, deposit as u128);

    let expectedAleo: u128 = subtract_fee ? deposit as u128 - (deposit as u128 * INSTANT_WITHDRAW_FEE / PRECISION_UNSIGNED) : deposit as u128;
    let f2: Future = pondo_protocol.aleo/deposit_public(deposit, expected_paleo, self.address);
    let f3: Future = pondo_protocol.aleo/instant_withdraw_public(expected_paleo, expectedAleo as u64);

    return finalize_deposit_instant_withdraw(f0, f1, f2, f3);
  }

  async function finalize_deposit_instant_withdraw(f0: Future, f1: Future, f2: Future, f3: Future) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
  }
}
