import credits.aleo;
import multi_token_support_program.aleo;

// The 'mtsp_credits' program.
program mtsp_credits.aleo {
  const CREDITS_RESERVED_TOKEN_ID: field = 3443843282313283355522573239085696902919850365217539366784739393210722344986field;

  async transition deposit_credits_public_signer(
    public amount: u64
  ) -> Future {
    let f0: Future = credits.aleo/transfer_public_as_signer(self.address, amount);
    let f1: Future = multi_token_support_program.aleo/mint_public(
      CREDITS_RESERVED_TOKEN_ID,
      self.signer,
      amount as u128,
      4294967295u32
    );

    return finalize_deposit_credits_public_signer(f0, f1);
  }

  async function finalize_deposit_credits_public_signer(
    f0: Future,
    f1: Future
  ) {
    f0.await();
    f1.await();
  }

  async transition deposit_credits_private(
    input_record: credits.aleo/credits,
    amount: u64
  ) -> (credits.aleo/credits, multi_token_support_program.aleo/Token, Future) {
    let transfer_output: (credits.aleo/credits, Future) = credits.aleo/transfer_private_to_public(input_record, self.address, amount);
    let mint_output: (multi_token_support_program.aleo/Token, Future) = multi_token_support_program.aleo/mint_private(
      CREDITS_RESERVED_TOKEN_ID,
      self.address,
      amount as u128,
      false,
      4294967295u32
    );
    return (transfer_output.0, mint_output.0, finalize_deposit_credits_private());
  }

  async function finalize_deposit_credits_private() {
    assert(true);
  }

  async transition withdraw_credits_public(
    amount: u64
  ) -> Future {
    let f0: Future = credits.aleo/transfer_public(self.caller, amount);
    let f1: Future = multi_token_support_program.aleo/burn_public(
      CREDITS_RESERVED_TOKEN_ID,
      self.caller,
      amount as u128
    );
    return finalize_withdraw_credits_public(f0, f1);
  }

  async function finalize_withdraw_credits_public(
    f0: Future,
    f1: Future
  ) {
    f0.await();
    f1.await();
  }

  async transition withdraw_credits_public_signer(
    amount: u64
  ) -> Future {
    let f0: Future = credits.aleo/transfer_public(self.signer, amount);
    let f1: Future = multi_token_support_program.aleo/burn_public(
      CREDITS_RESERVED_TOKEN_ID,
      self.signer,
      amount as u128
    );
    return finalize_withdraw_credits_public_signer(f0, f1);
  }

  async function finalize_withdraw_credits_public_signer(
    f0: Future,
    f1: Future
  ) {
    f0.await();
    f1.await();
  }

  async transition withdraw_credits_private(
    input_token: multi_token_support_program.aleo/Token,
    amount: u64
  ) -> (multi_token_support_program.aleo/Token, credits.aleo/credits, Future) {
    let transfer_output: (credits.aleo/credits, Future) = credits.aleo/transfer_public_to_private(input_token.owner, amount);
    let burn_output: (multi_token_support_program.aleo/Token, Future) = multi_token_support_program.aleo/burn_private(
      input_token,
      amount as u128
    );

    return (burn_output.0, transfer_output.0, finalize_withdraw_credits_private());
  }

  async function finalize_withdraw_credits_private() {
    assert(true);
  }
}
