import credits.aleo;
import multi_token_support_program_v02.aleo;
import pondo_core_protocol.aleo;

program test_program.aleo {
  const PALEO_TOKEN_ID: field = 1751493913335802797273486270793650302076377624243810059080883537084141842600field;
  const CREDITS_TOKEN_ID: field = 3443843282313283355522573239085696902919850365217539366784739393210722344986field;


  async transition double_deposit(deposit: u64, expected_paleo: u64) -> Future {
    let f0: Future = pondo_core_protocol.aleo/deposit_public_as_signer(deposit, expected_paleo, self.address);
    let f1: Future = pondo_core_protocol.aleo/deposit_public_as_signer(deposit, expected_paleo, self.address);

    return finalize_double_deposit(f0, f1);
  }

  async function finalize_double_deposit(f0: Future, f1: Future) {
    f0.await();
    f1.await();
  }

  async transition deposit_withdraw(deposit: u64, expected_paleo: u64) -> Future {
    let f0: Future = pondo_core_protocol.aleo/deposit_public_as_signer(deposit, expected_paleo, self.address);
    let f1: Future = pondo_core_protocol.aleo/withdraw_public(expected_paleo);

    return finalize_deposit_withdraw(f0, f1);
  }

  async function finalize_deposit_withdraw(f0: Future, f1: Future) {
    f0.await();
    f1.await();
  }

  async transition deposit_instant_withdraw(deposit: u64, expected_paleo: u64) -> Future {
    let f0: Future = multi_token_support_program_v02.aleo/deposit_credits_public(deposit);
    let f1: Future = multi_token_support_program_v02.aleo/approve_public(CREDITS_TOKEN_ID, pondo_core_protocol.aleo, deposit as u128);

    let f2: Future = pondo_core_protocol.aleo/deposit_public(deposit, expected_paleo, self.address);
    let f3: Future = pondo_core_protocol.aleo/instant_withdraw_public(expected_paleo, deposit);

    return finalize_deposit_instant_withdraw(f0, f1, f2, f3);
  }

  async function finalize_deposit_instant_withdraw(f0: Future, f1: Future, f2: Future, f3: Future) {
    f0.await();
    f1.await();
    f2.await();
    f3.await();
  }
}
