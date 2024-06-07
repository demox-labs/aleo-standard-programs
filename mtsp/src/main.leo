import credits.aleo;

// The 'mtsp' program.
program mtsp.aleo {
  record Token {
    owner: address,
    amount: u128,
    token_id: field,
    authorized: bool,
    authorized_until: u32
  }

  struct TokenMetadata {
    token_id: field,
    name: u128, // ASCII text represented in bits, and the u128 value of the bitstring
    symbol: u128, // ASCII text represented in bits, and the u128 value of the bitstring
    decimals: u8,
    supply: u128,
    max_supply: u128,
    admin: address,
    external_authorization_required: bool // whether or not this token requires authorization from an external program before transferring
  }

  struct TokenOwner {
    account: address,
    token_id: field
  }

  struct Balance {
    token_id: field,
    account: address,
    balance: u128,
    authorized_until: u32
  }

  struct Allowance {
    account: address,
    spender: address,
    token_id: field
  }

  mapping registered_tokens: field => TokenMetadata;
  mapping balances: field => Balance; // hash(token_id, account) => Balance
  mapping authorized_balances: field => Balance; // hash(token_id, account) => Balance
  mapping allowances: field => u128; // hash(token_id, account, spender) => Allowance

  // -------------------------
  // Called by token admins
  // -------------------------

  transition register_token(token_id: field, name: u128, symbol: u128, decimals: u8, max_supply: u128, external_authorization_required: bool) {
    let token: TokenMetadata = TokenMetadata {
      token_id: token_id,
      name: name,
      symbol: symbol,
      decimals: decimals,
      supply: 0u128,
      max_supply: max_supply,
      admin: self.caller,
      external_authorization_required: external_authorization_required
    };
    return then finalize(token);
  }

  finalize register_token(token: TokenMetadata) {
    // Make sure token doesn't already exist
    let token_exists: bool = registered_tokens.contains(token.token_id);
    assert_eq(token_exists, false);
    // Set new token
    registered_tokens.set(token.token_id, token);
  }

  // TODO: update_token_metadata

  transition mint_public(token_id: field, recipient: address, amount: u128, authorized_until: u32) {
    return then finalize(token_id, recipient, amount, authorized_until, self.caller);
  }

  finalize mint_public(token_id: field, recipient: address, amount: u128, authorized_until: u32, token_admin: address) {
    // Check that the token exists, and that the caller is the token admin
    // Check that the token supply + amount <= max_supply
    let token: TokenMetadata = registered_tokens.get(token_id);
    assert_eq(token.admin, token_admin);
    let new_supply: u128 = token.supply + amount;
    assert(new_supply <= token.max_supply);

    // Get or create the balance for the recipient
    let token_owner: TokenOwner = TokenOwner {
      account: recipient,
      token_id: token_id
    };
    let balance_key: field = BHP256::hash_to_field(token_owner);
    let default_balance: Balance = Balance {
      token_id: token_id,
      account: recipient,
      balance: 0u128,
      authorized_until: authorized_until
    };
    let authorization_required: bool = token.external_authorization_required;
    // Get the locked balance if authorization is required, otherwise get the authorized balance
    let balance: Balance = authorization_required ? balances.get_or_use(balance_key, default_balance) : authorized_balances.get_or_use(balance_key, default_balance);
    let new_balance: Balance = Balance {
      token_id: token_id,
      account: recipient,
      balance: balance.balance + amount,
      authorized_until: balance.authorized_until
    };
    // Update the appropriate balance
    if (authorization_required) {
      balances.set(balance_key, new_balance);
    } else {
      authorized_balances.set(balance_key, new_balance);
    }

    // Update the token supply
    let new_metadata: TokenMetadata = TokenMetadata {
      token_id: token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: new_supply,
      max_supply: token.max_supply,
      admin: token.admin,
      external_authorization_required: token.external_authorization_required
    };
    registered_tokens.set(token_id, new_metadata);
  }

  transition mint_private(token_id: field, recipient: address, amount: u128, authorized: bool, authorized_until: u32) -> Token {
    let token: Token = Token {
      owner: recipient,
      amount: amount,
      token_id: token_id,
      authorized: authorized,
      authorized_until: authorized_until
    };

    return token then finalize(token_id, recipient, amount, authorized, self.caller);
  }

  finalize mint_private(token_id: field, recipient: address, amount: u128, authorized: bool, token_admin: address) {
    // Check that the token exists, and that the caller is the token admin
    // Check that the token supply + amount <= max_supply
    let token: TokenMetadata = registered_tokens.get(token_id);
    assert_eq(token.admin, token_admin);
    let new_supply: u128 = token.supply + amount;
    assert(new_supply <= token.max_supply);

    // Check that whether the token is authorized or not matches the authorized parameter
    assert_eq(token.external_authorization_required, authorized);

    // Update the token supply
    let new_metadata: TokenMetadata = TokenMetadata {
      token_id: token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: new_supply,
      max_supply: token.max_supply,
      admin: token.admin,
      external_authorization_required: token.external_authorization_required
    };
    registered_tokens.set(token_id, new_metadata);
  }

  transition burn_public(owner: TokenOwner, amount: u128) {
    return then finalize(owner, amount, self.caller);
  }

  finalize burn_public(owner: TokenOwner, amount: u128, token_admin: address) {
    // Check that the token exists, and that the caller is the token admin
    // Check that the token supply - amount >= 0
    let token: TokenMetadata = registered_tokens.get(owner.token_id);
    assert_eq(token.admin, token_admin);
    let new_supply: u128 = token.supply - amount; // underflow will be caught by the VM

    // Get the balance for the recipient
    let balance_key: field = BHP256::hash_to_field(owner);
    let balance: Balance = balances.get(balance_key);
    // Update the balance, and check that the balance >= 0
    // TODO: Should we allow burning of authorized balances? or add the ability to deauthorize before burning?
    let new_balance: Balance = Balance {
      token_id: owner.token_id,
      account: owner.account,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until
    };
    balances.set(balance_key, new_balance);

    // Update the token supply
    let new_metadata: TokenMetadata = TokenMetadata {
      token_id: owner.token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: new_supply,
      max_supply: token.max_supply,
      admin: token.admin,
      external_authorization_required: token.external_authorization_required
    };
    registered_tokens.set(owner.token_id, new_metadata);
  }

  transition burn_private(input_record: Token, amount: u128) -> Token {
    let output_record: Token = Token {
        owner: input_record.owner,
        amount: input_record.amount - amount,
        token_id: input_record.token_id,
        authorized: input_record.authorized,
        authorized_until: input_record.authorized_until
    };
    return output_record then finalize(input_record.token_id, amount, self.caller);
  }

  finalize burn_private(token_id: field, amount: u128, token_admin: address) {
    // Check that the token exists, and that the caller is the token admin
    // Check that the token supply - amount >= 0
    let token: TokenMetadata = registered_tokens.get(token_id);
    assert_eq(token.admin, token_admin);
    let new_supply: u128 = token.supply - amount; // underflow will be caught by the VM

    // Update the token supply
    let new_metadata: TokenMetadata = TokenMetadata {
      token_id: token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: new_supply,
      max_supply: token.max_supply,
      admin: token.admin,
      external_authorization_required: token.external_authorization_required
    };
    registered_tokens.set(token_id, new_metadata);
  }

  transition authorize_public(owner: TokenOwner, amount: u128, authorized_until: u32) {
    return then finalize(owner, amount, authorized_until, self.caller);
  }

  finalize authorize_public(owner: TokenOwner, amount: u128, authorized_until: u32, token_admin: address) {
    // Check that the caller is the token admin
    let token: TokenMetadata = registered_tokens.get(owner.token_id);
    assert_eq(token.admin, token_admin);

    // Get the balance for the recipient
    let balance_key: field = BHP256::hash_to_field(owner);
    let balance: Balance = balances.get(balance_key);
    // Update the balance, and check that the balance >= 0
    let new_balance: Balance = Balance {
      token_id: owner.token_id,
      account: owner.account,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until
    };
    balances.set(balance_key, new_balance);

    // Move balance to authorized_balances
    let default_balance: Balance = Balance {
      token_id: owner.token_id,
      account: owner.account,
      balance: 0u128,
      authorized_until: authorized_until
    };
    let authorized_balance: Balance = authorized_balances.get_or_use(balance_key, default_balance);
    let new_authorized_balance: Balance = Balance {
      token_id: owner.token_id,
      account: owner.account,
      balance: authorized_balance.balance + amount,
      authorized_until: authorized_until
    };
    authorized_balances.set(balance_key, new_authorized_balance);
  }

  transition authorize_private(input_record: Token, amount: u128, authorized_until: u32) -> (Token, Token) {
    let unauthorized_record: Token = Token {
        owner: input_record.owner,
        amount: input_record.amount - amount,
        token_id: input_record.token_id,
        authorized: input_record.authorized,
        authorized_until: input_record.authorized_until
    };
    let authorized_record: Token = Token {
        owner: input_record.owner,
        amount: amount,
        token_id: input_record.token_id,
        authorized: true,
        authorized_until: authorized_until
    };
    return (unauthorized_record, authorized_record) then finalize(input_record.token_id, self.caller);
  }

  finalize authorize_private(token_id: field, token_admin: address) {
    // Check that the caller is the token admin
    let token: TokenMetadata = registered_tokens.get(token_id);
    assert_eq(token.admin, token_admin);
  }

  // -------------------------
  // Called by token owners/DeFi contracts
  // -------------------------

  transition transfer_public(token_id: field, recipient: address, amount: u128) {
    let preauthorized: bool = self.caller != self.signer; // calls from DeFi contracts are preauthorized
    return then finalize(token_id, recipient, amount, self.caller, preauthorized);
  }

  finalize transfer_public(token_id: field, recipient: address, amount: u128, owner: address, preauthorized: bool) {
    let sender_key: TokenOwner = TokenOwner {
      account: owner,
      token_id: token_id
    };

    // Get stored balances for the owner
    let sender_key_hash: field = BHP256::hash_to_field(sender_key);
    let default_balance: Balance = Balance {
      token_id: token_id,
      account: owner,
      balance: 0u128,
      authorized_until: 0u32
    };
    let authorized_balance: Balance = authorized_balances.get_or_use(sender_key_hash, default_balance);
    let unauthorized_balance: Balance = balances.get_or_use(sender_key_hash, default_balance);
    // Check that the owner has enough authorized balance
    let enough_authorized_balance: bool = authorized_balance.balance >= amount;
    // If the owner doesn't have enough authorized balance, check that they are preauthorized and have enough unauthorized balance
    assert(enough_authorized_balance || (preauthorized && unauthorized_balance.balance >= amount));
    let balance: Balance = enough_authorized_balance ? authorized_balance : unauthorized_balance;
    // Update the balance, and check that the balance >= 0
    let new_balance: Balance = Balance {
      token_id: token_id,
      account: account,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until
    };
    if (enough_authorized_balance) {
      authorized_balances.set(sender_key_hash, new_balance);
    } else {
      balances.set(sender_key_hash, new_balance);
    }

    // Get or create the balance for the recipient
    let recipient_key: TokenOwner = TokenOwner {
      account: recipient,
      token_id: token_id
    };
    let recipient_balance_key: field = BHP256::hash_to_field(recipient_key);
    // Get the locked balance if authorization is required, otherwise get the authorized balance
    let authorization_required: bool = registered_tokens.get(token_id).external_authorization_required;
    let default_expiration: u32 = authorization_required ? 0u32 : 4294967295u32;
    let default_balance: Balance = Balance {
      token_id: token_id,
      account: recipient,
      balance: 0u128,
      authorized_until: default_expiration
    };
    let recipient_balance: Balance = authorization_required ? balances.get_or_use(recipient_balance_key, default_balance) : authorized_balances.get_or_use(recipient_balance_key, default_balance);
    let new_recipient_balance: Balance = Balance {
      token_id: token_id,
      account: recipient,
      balance: recipient_balance.balance + amount,
      authorized_until: balance.authorized_until
    };
    // Update the balance
    if (authorization_required) {
      balances.set(recipient_balance_key, new_recipient_balance);
    } else {
      authorized_balances.set(recipient_balance_key, new_recipient_balance);
    }
  }

  transition approve_public(token_id: field, spender: address, amount: u128) {
    return then finalize(token_id, spender, amount, self.caller);
  }

  finalize approve_public(token_id: field, spender: address, amount: u128, owner: address) {
    let owner_key: TokenOwner = TokenOwner {
      account: owner,
      token_id: token_id
    };
    let owner_key_hash: field = BHP256::hash_to_field(owner);
    let has_locked_balance: bool = balances.contains(owner_key_hash);
    let has_authorized_balance: bool = authorized_balances.contains(owner_key_hash);
    assert(has_locked_balance || has_authorized_balance);

    let allowance: Allowance = Allowance {
      account: owner,
      spender: spender,
      token_id: token_id
    };
    let allowance_key: field = BHP256::hash_to_field(allowance);
    let current_allowance: u128 = allowances.get_or_use(allowance_key, 0u128);
    allowances.set(allowance_key, current_allowance + amount);
  }

  transition unapprove_public(token_id: field, spender: address, amount: u128) {
    return then finalize(token_id, spender, amount, self.caller);
  }

  finalize unapprove_public(token_id: field, spender: address, amount: u128, owner: address) {
    let allowance: Allowance = Allowance {
      account: owner,
      spender: spender,
      token_id: token_id
    };
    let allowance_key: field = BHP256::hash_to_field(allowance);
    let current_allowance: u128 = allowances.get(allowance_key);
    assert(current_allowance >= amount);
    allowances.set(allowance_key, current_allowance - amount);
  }

  // Note: transfer_from_public does not implement preauthorization,
  // it is assumed that contracts will simply transfer to other contracts they want to use instead of using approve/transferFrom
  transition transfer_from_public(token_id: field, owner: address, recipient: address, amount: u128) {
    return then finalize(token_id, owner, recipient, amount, self.caller);
  }

  finalize transfer_from_public(token_id: field, owner: address, recipient: address, amount: u128, spender: address) {
    // Check that the spender is authorized to spend the amount
    let allowance: Allowance = Allowance {
      account: owner,
      spender: spender,
      token_id: token_id
    };
    let allowance_key: field = BHP256::hash_to_field(allowance);
    let current_allowance: u128 = allowances.get(allowance_key);
    assert(current_allowance >= amount);
    // Update the allowance
    allowances.set(allowance_key, current_allowance - amount);

    // Check that the owner has enough authorized balance
    let owner_key: TokenOwner = TokenOwner {
      account: owner,
      token_id: token_id
    };
    let owner_key_hash: field = BHP256::hash_to_field(owner);
    let balance: Balance = authorized_balances.get(owner_key_hash);
    assert_eq(owner, balance.account);
    assert(balance.balance >= amount);

    // Update the balance for the owner
    let new_balance: Balance = Balance {
      token_id: token_id,
      account: account,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until
    };
    authorized_balances.set(owner_key_hash, new_balance);

    // Get or create the balance for the recipient
    let recipient_key: TokenOwner = TokenOwner {
      account: recipient,
      token_id: token_id
    };
    let recipient_balance_key: field = BHP256::hash_to_field(recipient_key);
    // Get the locked balance if authorization is required, otherwise get the authorized balance
    let authorization_required: bool = registered_tokens.get(token_id).external_authorization_required;
    let default_expiration: u32 = authorization_required ? 0u32 : 4294967295u32;
    let default_balance: Balance = Balance {
      token_id: token_id,
      account: recipient,
      balance: 0u128,
      authorized_until: default_expiration
    };
    let recipient_balance: Balance = authorization_required ? balances.get_or_use(recipient_balance_key, default_balance) : authorized_balances.get_or_use(recipient_balance_key, default_balance);
    let new_recipient_balance: Balance = Balance {
      token_id: token_id,
      account: recipient,
      balance: recipient_balance.balance + amount,
      authorized_until: balance.authorized_until
    };
    // Update the balance of the recipient
    if (authorization_required) {
      balances.set(recipient_balance_key, new_recipient_balance);
    } else {
      authorized_balances.set(recipient_balance_key, new_recipient_balance);
    }
  }

  transition transfer_public_to_private(token_id: field, recipient: address, amount: u128, preauthorize_transfer_record: bool) -> Token {
    let authorized_until: u32 = preauthorize_transfer_record ? 4294967295u32 : 0u32;
    let token: Token = Token {
      owner: recipient,
      amount: amount,
      token_id: token_id,
      authorized: preauthorize_transfer_record,
      authorized_until: authorized_until
    };
    let preauthorized: bool = self.caller != self.signer; // calls from DeFi contracts are preauthorized
    return token then finalize(token_id, recipient, amount, self.caller, preauthorized, preauthorize_transfer_record);
  }

  finalize transfer_public_to_private(token_id: field, recipient: address, amount: u128, owner: address, preauthorized: bool, record_authorized: bool) {
    // Check that the transfer record's authorization matches the token's external_authorization_required
    let token: TokenMetadata = registered_tokens.get(token_id);
    assert_eq(token.external_authorization_required, record_authorized);

    let sender_key: TokenOwner = TokenOwner {
      account: owner,
      token_id: token_id
    };

    // Get stored balances for the owner
    let sender_key_hash: field = BHP256::hash_to_field(sender_key);
    let default_balance: Balance = Balance {
      token_id: token_id,
      account: owner,
      balance: 0u128,
      authorized_until: 0u32
    };
    let authorized_balance: Balance = authorized_balances.get_or_use(sender_key_hash, default_balance);
    let unauthorized_balance: Balance = balances.get_or_use(sender_key_hash, default_balance);
    // Check that the owner has enough authorized balance
    let enough_authorized_balance: bool = authorized_balance.balance >= amount;
    // If the owner doesn't have enough authorized balance, check that they are preauthorized and have enough unauthorized balance
    assert(enough_authorized_balance || (preauthorized && unauthorized_balance.balance >= amount));
    let balance: Balance = enough_authorized_balance ? authorized_balance : unauthorized_balance;
    // Update the balance
    let new_balance: Balance = Balance {
      token_id: token_id,
      account: account,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until
    };
    if (enough_authorized_balance) {
      authorized_balances.set(sender_key_hash, new_balance);
    } else {
      balances.set(sender_key_hash, new_balance);
    }
  }

  transition transfer_from_public_to_private(token_id: field, owner: address, recipient: address, amount: u128, preauthorize_transfer_record: bool) -> Token {
    let authorized_until: u32 = preauthorize_transfer_record ? 4294967295u32 : 0u32;
    let token: Token = Token {
      owner: recipient,
      amount: amount,
      token_id: token_id,
      authorized: preauthorize_transfer_record,
      authorized_until: authorized_until
    };
    return token then finalize(token_id, owner, recipient, amount, self.caller, preauthorize_transfer_record);
  }

  finalize transfer_from_public_to_private(token_id: field, owner: address, recipient: address, amount: u128, spender: address, record_authorized: bool) {
    // Check that the transfer record's authorization matches the token's external_authorization_required
    let token: TokenMetadata = registered_tokens.get(token_id);
    assert_eq(token.external_authorization_required, record_authorized);

    // Check that the spender is authorized to spend the amount
    let allowance: Allowance = Allowance {
      account: owner,
      spender: spender,
      token_id: token_id
    };
    let allowance_key: field = BHP256::hash_to_field(allowance);
    let current_allowance: u128 = allowances.get(allowance_key);
    assert(current_allowance >= amount);
    // Update the allowance
    allowances.set(allowance_key, current_allowance - amount);

    // Check that the owner has enough authorized balance
    let owner_key: TokenOwner = TokenOwner {
      account: owner,
      token_id: token_id
    };
    let owner_key_hash: field = BHP256::hash_to_field(owner);
    let balance: Balance = authorized_balances.get(owner_key_hash);
    assert_eq(owner, balance.account);
    assert(balance.balance >= amount);

    // Update the balance for the owner
    let new_balance: Balance = Balance {
      token_id: token_id,
      account: account,
      balance: balance.balance - amount
      authorized_until: balance.authorized_until
    };
    authorized_balances.set(owner_key_hash, new_balance);
  }

  transition transfer_private(recipient: address, amount: u128, input_record: Token, preauthorize_transfer_record: bool) -> (Token, Token) {
    assert(input_record.owner == self.caller);
    assert(input_record.amount >= amount);
    assert(input_record.authorized);
    let updated_record: Token = Token {
      owner: input_record.owner,
      amount: input_record.amount - amount,
      token_id: input_record.token_id,
      authorized: input_record.authorized,
      authorized_until: input_record.authorized_until
    };

    let authorized_until: u32 = preauthorize_transfer_record ? 4294967295u32 : 0u32;
    let transfer_record: Token = Token {
      owner: recipient,
      amount: amount,
      token_id: input_record.token_id,
      authorized: preauthorize_transfer_record,
      authorized_until: authorized_until
    };

    return (updated_record, transfer_record) then finalize(input_record.token_id, preauthorize_transfer_record, input_record.authorized_until);
  }

  finalize transfer_private(token_id: field, token_preauthorized: bool, input_token_authorized_until: u32) {
    // Check that the authorization matches the token's external_authorization_required
    let token: TokenMetadata = registered_tokens.get(token_id);
    assert_eq(token.external_authorization_required, token_preauthorized);

    assert(block.height <= input_token_authorized_until);
  }

  transition transfer_private_to_public(recipient: address, amount: u128, input_record: Token) -> Token {
    assert(input_record.owner == self.caller);
    assert(input_record.amount >= amount);
    assert(input_record.authorized);
    let updated_record: Token = Token {
      owner: input_record.owner,
      amount: input_record.amount - amount,
      token_id: input_record.token_id,
      authorized: input_record.authorized,
      authorized_until: input_record.authorized_until
    };

    return updated_record then finalize(input_record.token_id, recipient, amount);
  }

  finalize transfer_private_to_public(token_id: field, recipient: address, amount: u128) {
    // Get or create the balance for the recipient
    let recipient_key: TokenOwner = TokenOwner {
      account: recipient,
      token_id: token_id
    };
    let recipient_balance_key: field = BHP256::hash_to_field(recipient_key);
    // Get the locked balance if authorization is required, otherwise get the authorized balance
    let authorization_required: bool = registered_tokens.get(token_id).external_authorization_required;
    let default_expiration: u32 = authorization_required ? 0u32 : 4294967295u32;
    let default_balance: Balance = Balance {
      token_id: token_id,
      account: recipient,
      balance: 0u128,
      authorized_until: default_expiration
    };
    let recipient_balance: Balance = authorization_required ? balances.get_or_use(recipient_balance_key, default_balance) : authorized_balances.get_or_use(recipient_balance_key, default_balance);
    let new_recipient_balance: Balance = Balance {
      token_id: token_id,
      account: recipient,
      balance: recipient_balance.balance + amount,
      authorized_until: recipient_balance.authorized_until
    };
    // Update the balance of the recipient
    if (authorization_required) {
      balances.set(recipient_balance_key, new_recipient_balance);
    } else {
      authorized_balances.set(recipient_balance_key, new_recipient_balance);
    }
  }

  // -------------------------
  // credits.aleo wrapper
  // -------------------------

  transition credits_transfer_public_as_signer(recipient: address, amount: u64) {
    credits.aleo/transfer_public_as_signer(recipient, amount);
  }

  transition credits_transfer_private(input_record: credits.aleo/credits, amount: u64) -> credits.aleo/credits {
    return credits.aleo/transfer_private(input_record, amount);
  }

  transition credits_transfer_private_to_public(input_record: credits.aleo/credits, recipient: address, amount: u64) -> credits.aleo/credits {
    return credits.aleo/transfer_private_to_public(input_record, recipient, amount);
  }
}
