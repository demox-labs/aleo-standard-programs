// The 'mtsp_credits_wrapper' program.
program mtsp_credits_wrapper.aleo {
  async transition deposit_credits_public(
    public amount: u64
  ) -> Future {
    let f0: Future = credits.aleo/transfer_public_as_signer(multi_token_support_program.aleo, amount);
    return finalize_deposit_credits_public(f0, amount as u128, self.caller);
  }

  async function finalize_deposit_credits_public(
    f0: Future,
    amount: u128,
    caller: address
  ) {
    f0.await();
    // Get or create a credits balance for the caller
    let balance_key: TokenOwner = TokenOwner {
      account: caller,
      token_id: CREDITS_RESERVED_TOKEN_ID
    };
    let balance_key_hash: field = BHP256::hash_to_field(balance_key);
    let default_balance: Balance = Balance {
      token_id: CREDITS_RESERVED_TOKEN_ID,
      account: caller,
      balance: 0u128,
      authorized_until: 4294967295u32
    };
    let balance: Balance = authorized_balances.get_or_use(balance_key_hash, default_balance);
    // Increment the balance by the amount deposited
    let new_balance: Balance = Balance {
      token_id: CREDITS_RESERVED_TOKEN_ID,
      account: caller,
      balance: balance.balance + amount,
      authorized_until: balance.authorized_until
    };
    // Update the balance
    authorized_balances.set(balance_key_hash, new_balance);
  }

  async transition deposit_credits_private(
    input_record: credits.aleo/credits,
    amount: u64
  ) -> (credits.aleo/credits, Token, Future) {
    let updated_record: (credits.aleo/credits, Future) = credits.aleo/transfer_private_to_public(input_record, multi_token_support_program.aleo, amount);
    let token: Token = Token {
      owner: input_record.owner,
      amount: amount as u128,
      token_id: CREDITS_RESERVED_TOKEN_ID,
      external_authorization_required: false,
      authorized_until: 4294967295u32
    };

    return (updated_record.0, token, finalize_deposit_credits_private());
  }

  async function finalize_deposit_credits_private() {
    return;
  }
}
