import credits.aleo;

// The 'mtsp' program.
program multi_token_support_program.aleo {
  record Token {
    owner: address,
    amount: u128,
    token_id: field,
    external_authorization_required: bool,
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
    external_authorization_required: bool, // whether or not this token requires authorization from an external program before transferring
    external_authorization_party: address
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

  const CREDITS_RESERVED_TOKEN_ID: field = 3443843282313283355522573239085696902919850365217539366784739393210722344986field;
  mapping registered_tokens: field => TokenMetadata;
  mapping balances: field => Balance; // hash(token_id, account) => Balance
  mapping authorized_balances: field => Balance; // hash(token_id, account) => Balance
  mapping allowances: field => u128; // hash(token_id, account, spender) => Allowance

  // mapping struct_balances: TokenOwner => Balance;
  // mapping struct_authorized_balances: TokenOwner => Balance;
  // mapping struct_allowances: Allowance => u128;

  // -------------------------
  // Called by token admins
  // -------------------------

  async transition initialize() -> Future {
    return finalize_initialize();
  }

  async function finalize_initialize() {
    // Initialize the CREDITS_RESERVED_TOKEN_ID token
    let credits_reserved_token: TokenMetadata = TokenMetadata {
      token_id: CREDITS_RESERVED_TOKEN_ID,
      name: 1095517519u128,
      symbol: 1095517519u128,
      decimals: 6u8,
      supply: 1_500_000_000_000_000u128,
      max_supply: 1_500_000_000_000_000u128,
      admin: multi_token_support_program.aleo,
      external_authorization_required: false,
      external_authorization_party: multi_token_support_program.aleo
    };

    registered_tokens.set(CREDITS_RESERVED_TOKEN_ID, credits_reserved_token);
  }

  async transition register_token(
    token_id: field,
    name: u128,
    symbol: u128,
    decimals: u8,
    max_supply: u128,
    external_authorization_required: bool,
    external_authorization_party: address
    ) -> Future {
    assert(token_id != CREDITS_RESERVED_TOKEN_ID);
    let token: TokenMetadata = TokenMetadata {
      token_id: token_id,
      name: name,
      symbol: symbol,
      decimals: decimals,
      supply: 0u128,
      max_supply: max_supply,
      admin: self.caller,
      external_authorization_required: external_authorization_required,
      external_authorization_party: external_authorization_party
    };

    return finalize_register_token(token);
  }

  async function finalize_register_token(token: TokenMetadata) {
    // Make sure token doesn't already exist
    let token_exists: bool = registered_tokens.contains(token.token_id);
    assert_eq(token_exists, false);
    // Set new token
    registered_tokens.set(token.token_id, token);
  }

  async transition update_token_management(
    token_id: field,
    admin: address,
    external_authorization_party: address
  ) -> Future {
    assert(token_id != CREDITS_RESERVED_TOKEN_ID);
    return finalize_update_token_management(token_id, admin, external_authorization_party, self.caller);
  }

  async function finalize_update_token_management(
    token_id: field,
    admin: address,
    external_authorization_party: address,
    caller: address
  ) {
    let token: TokenMetadata = registered_tokens.get(token_id);
    assert_eq(caller, token.admin);

    let new_metadata: TokenMetadata = TokenMetadata {
      token_id: token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: token.supply,
      max_supply: token.max_supply,
      admin: admin,
      external_authorization_required: token.external_authorization_required,
      external_authorization_party: external_authorization_party
    };
  }

  async transition mint_public(
    token_id: field,
    recipient: address,
    amount: u128,
    authorized_until: u32
  ) -> Future {
    assert(token_id != CREDITS_RESERVED_TOKEN_ID);
    return finalize_mint_public(token_id, recipient, amount, authorized_until, self.caller);
  }

  async function finalize_mint_public(
    token_id: field,
    recipient: address,
    amount: u128,
    authorized_until: u32,
    token_admin: address
  ) {
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
      external_authorization_required: token.external_authorization_required,
      external_authorization_party: token.external_authorization_party
    };
    registered_tokens.set(token_id, new_metadata);
  }

  async transition mint_private(
    token_id: field,
    recipient: address,
    amount: u128,
    external_authorization_required: bool,
    authorized_until: u32
    ) -> (Token, Future) {
    assert(token_id != CREDITS_RESERVED_TOKEN_ID);
    let token: Token = Token {
      owner: recipient,
      amount: amount,
      token_id: token_id,
      external_authorization_required: external_authorization_required,
      authorized_until: authorized_until
    };

    return (token, finalize_mint_private(token_id, recipient, amount, external_authorization_required, authorized_until, self.caller));
  }

  async function finalize_mint_private(
    token_id: field,
    recipient: address,
    amount: u128,
    external_authorization_required: bool,
    authorized_until: u32,
    token_admin: address
  ) {
    // Check that the token exists, and that the caller is the token admin
    // Check that the token supply + amount <= max_supply
    let token: TokenMetadata = registered_tokens.get(token_id);
    assert_eq(token.admin, token_admin);
    let new_supply: u128 = token.supply + amount;
    assert(new_supply <= token.max_supply);

    // Check that whether the token is authorized or not matches the authorized parameter
    let authorization_required: bool = token.external_authorization_required;
    assert_eq(authorization_required, external_authorization_required);

    // Update the token supply
    let new_metadata: TokenMetadata = TokenMetadata {
      token_id: token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: new_supply,
      max_supply: token.max_supply,
      admin: token.admin,
      external_authorization_required: token.external_authorization_required,
      external_authorization_party: token.external_authorization_party
    };
    registered_tokens.set(token_id, new_metadata);
  }

  async transition burn_public(owner: TokenOwner, amount: u128) -> Future {
    assert(owner.token_id != CREDITS_RESERVED_TOKEN_ID);
    return finalize_burn_public(owner, amount, self.caller);
  }

  async function finalize_burn_public(owner: TokenOwner, amount: u128, token_admin: address) {
    // Check that the token exists, and that the caller is the token admin
    // Check that the token supply - amount >= 0
    let token: TokenMetadata = registered_tokens.get(owner.token_id);
    assert_eq(token.admin, token_admin);
    let new_supply: u128 = token.supply - amount; // underflow will be caught by the VM

    // Get the locked balance for the recipient
    let default_balance: Balance = Balance {
      token_id: owner.token_id,
      account: owner.account,
      balance: 0u128,
      authorized_until: 0u32
    };
    let balance_key: field = BHP256::hash_to_field(owner);
    let balance: Balance = balances.get_or_use(balance_key, default_balance);
    let remaining_after_burn: i128 = balance.balance as i128 - amount as i128;
    // Burn from locked balance
    let new_locked_balance: u128 = remaining_after_burn >= 0i128 ? remaining_after_burn as u128 : 0u128;
    let new_balance: Balance = Balance {
      token_id: owner.token_id,
      account: owner.account,
      balance: new_locked_balance,
      authorized_until: balance.authorized_until
    };
    balances.set(balance_key, new_balance);

    // Burn from authorized balance
    if (remaining_after_burn < 0i128) {
      let remaining_burn_balance: u128 = amount - balance.balance;
      let authorized_balance: Balance = authorized_balances.get(balance_key);
      let new_authorized_balance: Balance = Balance {
        token_id: owner.token_id,
        account: owner.account,
        balance: authorized_balance.balance - remaining_burn_balance,
        authorized_until: authorized_balance.authorized_until
      };
      authorized_balances.set(balance_key, new_authorized_balance);
    }

    // Update the token supply
    let new_metadata: TokenMetadata = TokenMetadata {
      token_id: owner.token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: new_supply,
      max_supply: token.max_supply,
      admin: token.admin,
      external_authorization_required: token.external_authorization_required,
      external_authorization_party: token.external_authorization_party
    };
    registered_tokens.set(owner.token_id, new_metadata);
  }

  async transition burn_private(input_record: Token, amount: u128) -> (Token, Future) {
    assert(input_record.token_id != CREDITS_RESERVED_TOKEN_ID);
    let output_record: Token = Token {
        owner: input_record.owner,
        amount: input_record.amount - amount,
        token_id: input_record.token_id,
        external_authorization_required: input_record.external_authorization_required,
        authorized_until: input_record.authorized_until
    };
    return (output_record, finalize_burn_private(input_record.token_id, amount, self.caller));
  }

  async function finalize_burn_private(token_id: field, amount: u128, token_admin: address) {
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
      external_authorization_required: token.external_authorization_required,
      external_authorization_party: token.external_authorization_party
    };
    registered_tokens.set(token_id, new_metadata);
  }

  async transition prehook_public(
    owner: TokenOwner,
    amount: u128,
    authorized_until: u32
  ) -> Future {
    return finalize_prehook_public(owner, amount, authorized_until, self.caller);
  }

  async function finalize_prehook_public(
    owner: TokenOwner,
    amount: u128,
    authorized_until: u32,
    caller: address
  ) {
    // Check that the caller has permission to authorize
    let token: TokenMetadata = registered_tokens.get(owner.token_id);
    let token_admin: address = token.admin;
    let external_authorization_party: address = token.external_authorization_party;
    assert(caller == token_admin || caller == external_authorization_party);

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

  async transition prehook_private(input_record: Token, amount: u128, authorized_until: u32) -> (Token, Token, Future) {
    let unauthorized_record: Token = Token {
        owner: input_record.owner,
        amount: input_record.amount - amount,
        token_id: input_record.token_id,
        external_authorization_required: input_record.external_authorization_required,
        authorized_until: input_record.authorized_until
    };
    let authorized_record: Token = Token {
        owner: input_record.owner,
        amount: amount,
        token_id: input_record.token_id,
        external_authorization_required: input_record.external_authorization_required,
        authorized_until: authorized_until
    };
    return (unauthorized_record, authorized_record, finalize_prehook_private(input_record.token_id, self.caller));
  }

  async function finalize_prehook_private(token_id: field, caller: address) {
    // Check that the caller has permission to authorize
    let token: TokenMetadata = registered_tokens.get(token_id);
    let token_admin: address = token.admin;
    let external_authorization_party: address = token.external_authorization_party;
    assert(caller == token_admin || caller == external_authorization_party);
  }

  // -------------------------
  // Called by token owners/DeFi contracts
  // -------------------------

  async transition transfer_public(token_id: field, recipient: address, amount: u128) -> Future {
    return finalize_transfer_public(token_id, recipient, amount, self.caller);
  }

  async function finalize_transfer_public(
    token_id: field,
    recipient: address,
    amount: u128,
    owner: address
  ) {
    let sender_key: TokenOwner = TokenOwner {
      account: owner,
      token_id: token_id
    };

    // Get stored balance for the owner
    let sender_key_hash: field = BHP256::hash_to_field(sender_key);
    let balance: Balance = authorized_balances.get(sender_key_hash);
    // Update the balance, and check that the balance >= amount
    let new_balance: Balance = Balance {
      token_id: token_id,
      account: owner,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until
    };
    // Update sender balance
    authorized_balances.set(sender_key_hash, new_balance);

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

    // Update recipient balance
    if (authorization_required) {
      balances.set(recipient_balance_key, new_recipient_balance);
    } else {
      authorized_balances.set(recipient_balance_key, new_recipient_balance);
    }
  }

  async transition transfer_public_as_signer(token_id: field, recipient: address, amount: u128) -> Future {
    return finalize_transfer_public_as_signer(token_id, recipient, amount, self.signer);
  }

  async function finalize_transfer_public_as_signer(
    token_id: field,
    recipient: address,
    amount: u128,
    owner: address
  ) {
    let sender_key: TokenOwner = TokenOwner {
      account: owner,
      token_id: token_id
    };

    // Get stored balance for the owner
    let sender_key_hash: field = BHP256::hash_to_field(sender_key);
    let balance: Balance = authorized_balances.get(sender_key_hash);
    // Update the balance, and check that the balance >= amount
    let new_balance: Balance = Balance {
      token_id: token_id,
      account: owner,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until
    };
    // Update sender balance
    authorized_balances.set(sender_key_hash, new_balance);

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

    // Update recipient balance
    if (authorization_required) {
      balances.set(recipient_balance_key, new_recipient_balance);
    } else {
      authorized_balances.set(recipient_balance_key, new_recipient_balance);
    }
  }

  async transition approve_public(token_id: field, spender: address, amount: u128) -> Future {
    return finalize_approve_public(token_id, spender, amount, self.caller);
  }

  async function finalize_approve_public(token_id: field, spender: address, amount: u128, owner: address) {
    let owner_key: TokenOwner = TokenOwner {
      account: owner,
      token_id: token_id
    };
    let owner_key_hash: field = BHP256::hash_to_field(owner);
    let has_locked_balance: bool = balances.contains(owner_key_hash);
    let has_authorized_balance: bool = authorized_balances.contains(owner_key_hash);
    // Confirm that the caller has a balance in the token
    assert(has_locked_balance || has_authorized_balance);

    let allowance: Allowance = Allowance {
      account: owner,
      spender: spender,
      token_id: token_id
    };
    let allowance_key: field = BHP256::hash_to_field(allowance);
    let current_allowance: u128 = allowances.get_or_use(allowance_key, 0u128);
    // Increase or create the allowance amount
    allowances.set(allowance_key, current_allowance + amount);
  }

  async transition unapprove_public(
    token_id: field,
    spender: address,
    amount: u128
  ) -> Future {
    return finalize_unapprove_public(token_id, spender, amount, self.caller);
  }

  async function finalize_unapprove_public(
    token_id: field,
    spender: address,
    amount: u128,
    owner: address
  ) {
    let allowance: Allowance = Allowance {
      account: owner,
      spender: spender,
      token_id: token_id
    };
    let allowance_key: field = BHP256::hash_to_field(allowance);
    let current_allowance: u128 = allowances.get(allowance_key);
    assert(current_allowance >= amount);
    // Decrease the allowance amount
    allowances.set(allowance_key, current_allowance - amount);
  }

  async transition transfer_from_public(
    token_id: field,
    owner: address,
    recipient: address,
    amount: u128
  ) -> Future {
    return finalize_transfer_from_public(token_id, owner, recipient, amount, self.caller);
  }

  async function finalize_transfer_from_public(
    token_id: field,
    owner: address,
    recipient: address,
    amount: u128,
    spender: address
  ) {
    // Check that the spender is authorized to spend the amount
    let allowance: Allowance = Allowance {
      account: owner,
      spender: spender,
      token_id: token_id
    };
    let allowance_key: field = BHP256::hash_to_field(allowance);
    let current_allowance: u128 = allowances.get(allowance_key);
    assert(current_allowance >= amount);
    // Decrease the allowance by the amount being spent
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
      account: owner,
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

  async transition transfer_public_to_private(
    token_id: field,
    recipient: address,
    amount: u128,
    external_authorization_required: bool
  ) -> (Token, Future) {
    let authorized_until: u32 = external_authorization_required ? 0u32 : 4294967295u32;
    let token: Token = Token {
      owner: recipient,
      amount: amount,
      token_id: token_id,
      external_authorization_required: external_authorization_required,
      authorized_until: authorized_until
    };
    return (token, finalize_transfer_public_to_private(token_id, recipient, amount, self.caller, external_authorization_required));
  }

  async function finalize_transfer_public_to_private(
    token_id: field,
    recipient: address,
    amount: u128,
    owner: address,
    external_authorization_required: bool
  ) {
    // Check that the transfer record's authorization matches the token's external_authorization_required
    let token: TokenMetadata = registered_tokens.get(token_id);
    assert_eq(token.external_authorization_required, external_authorization_required);

    let sender_key: TokenOwner = TokenOwner {
      account: owner,
      token_id: token_id
    };

    // Get stored balances for the owner
    let sender_key_hash: field = BHP256::hash_to_field(sender_key);
    let balance: Balance = authorized_balances.get(sender_key_hash);
    // Update the balance
    let new_balance: Balance = Balance {
      token_id: token_id,
      account: owner,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until
    };
    authorized_balances.set(sender_key_hash, new_balance);
  }

  async transition transfer_from_public_to_private(
    token_id: field,
    owner: address,
    recipient: address,
    amount: u128,
    external_authorization_required: bool
  ) -> (Token, Future) {
    let authorized_until: u32 = external_authorization_required ? 0u32 : 4294967295u32;
    let token: Token = Token {
      owner: recipient,
      amount: amount,
      token_id: token_id,
      external_authorization_required: external_authorization_required,
      authorized_until: authorized_until
    };
    return (token, finalize_transfer_from_public_to_private(token_id, owner, recipient, amount, self.caller, external_authorization_required));
  }

  async function finalize_transfer_from_public_to_private(
    token_id: field,
    owner: address,
    recipient: address,
    amount: u128,
    spender: address,
    external_authorization_required: bool
  ) {
    // Check that the transfer record's authorization matches the token's external_authorization_required
    let token: TokenMetadata = registered_tokens.get(token_id);
    assert_eq(token.external_authorization_required, external_authorization_required);

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
      account: owner,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until
    };
    authorized_balances.set(owner_key_hash, new_balance);
  }

  async transition transfer_private(
    recipient: address,
    amount: u128,
    input_record: Token
  ) -> (Token, Token, Future) {
    let updated_record: Token = Token {
      owner: input_record.owner,
      amount: input_record.amount - amount,
      token_id: input_record.token_id,
      external_authorization_required: input_record.external_authorization_required,
      authorized_until: input_record.authorized_until
    };

    let external_authorization_required: bool = input_record.external_authorization_required;
    let authorized_until: u32 = external_authorization_required ? 0u32 : 4294967295u32;
    let transfer_record: Token = Token {
      owner: recipient,
      amount: amount,
      token_id: input_record.token_id,
      external_authorization_required: external_authorization_required,
      authorized_until: authorized_until
    };

    return (updated_record, transfer_record, finalize_transfer_private(external_authorization_required, input_record.authorized_until));
  }

  async function finalize_transfer_private(
    external_authorization_required: bool,
    input_token_authorized_until: u32
  ) {
    assert(block.height <= input_token_authorized_until || !external_authorization_required);
  }

  async transition transfer_private_to_public(
    recipient: address,
    amount: u128,
    input_record: Token
  ) -> (Token, Future) {
    let updated_record: Token = Token {
      owner: input_record.owner,
      amount: input_record.amount - amount,
      token_id: input_record.token_id,
      external_authorization_required: input_record.external_authorization_required,
      authorized_until: input_record.authorized_until
    };

    return (updated_record, finalize_transfer_private_to_public(input_record.token_id, recipient, amount));
  }

  async function finalize_transfer_private_to_public(token_id: field, recipient: address, amount: u128) {
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

  async transition deposit_credits_public(
    amount: u64,
    token_id: field
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

  async transition withdraw_credits_public(
    amount: u64
  ) -> Future {
    let f0: Future = credits.aleo/transfer_public(self.caller, amount);
    return finalize_withdraw_credits_public(f0, amount as u128, self.caller);
  }

  async function finalize_withdraw_credits_public(
    f0: Future,
    amount: u128,
    caller: address
  ) {
    f0.await();
    // Get the credits balance for the caller
    let balance_key: TokenOwner = TokenOwner {
      account: caller,
      token_id: CREDITS_RESERVED_TOKEN_ID
    };
    let balance_key_hash: field = BHP256::hash_to_field(balance_key);
    let balance: Balance = authorized_balances.get(balance_key_hash);
    // Decrement the balance by the amount withdrawn, underflow will be caught by the VM
    let new_balance: Balance = Balance {
      token_id: CREDITS_RESERVED_TOKEN_ID,
      account: caller,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until
    };
    authorized_balances.set(balance_key_hash, new_balance);
  }

  // async transition struct_mint_public(
  //   token_id: field,
  //   recipient: address,
  //   amount: u128,
  //   authorized_until: u32
  // ) -> Future {
  //   return struct_finalize_mint_public(token_id, recipient, amount, authorized_until, self.caller);
  // }

  // async function struct_finalize_mint_public(
  //   token_id: field,
  //   recipient: address,
  //   amount: u128,
  //   authorized_until: u32,
  //   token_admin: address
  // ) {
  //   // Check that the token exists, and that the caller is the token admin
  //   // Check that the token supply + amount <= max_supply
  //   let token: TokenMetadata = registered_tokens.get(token_id);
  //   assert_eq(token.admin, token_admin);
  //   let new_supply: u128 = token.supply + amount;
  //   assert(new_supply <= token.max_supply);

  //   // Get or create the balance for the recipient
  //   let balance_key: TokenOwner = TokenOwner {
  //     account: recipient,
  //     token_id: token_id
  //   };
  //   let default_balance: Balance = Balance {
  //     token_id: token_id,
  //     account: recipient,
  //     balance: 0u128,
  //     authorized_until: authorized_until
  //   };
  //   let authorization_required: bool = token.external_authorization_required;
  //   // Get the locked balance if authorization is required, otherwise get the authorized balance
  //   let balance: Balance = authorization_required ? struct_balances.get_or_use(balance_key, default_balance) : struct_authorized_balances.get_or_use(balance_key, default_balance);
  //   let new_balance: Balance = Balance {
  //     token_id: token_id,
  //     account: recipient,
  //     balance: balance.balance + amount,
  //     authorized_until: balance.authorized_until
  //   };
  //   // Update the appropriate balance
  //   if (authorization_required) {
  //     struct_balances.set(balance_key, new_balance);
  //   } else {
  //     struct_authorized_balances.set(balance_key, new_balance);
  //   }

  //   // Update the token supply
  //   let new_metadata: TokenMetadata = TokenMetadata {
  //     token_id: token_id,
  //     name: token.name,
  //     symbol: token.symbol,
  //     decimals: token.decimals,
  //     supply: new_supply,
  //     max_supply: token.max_supply,
  //     admin: token.admin,
  //     external_authorization_required: token.external_authorization_required,
  //     external_authorization_party: token.external_authorization_party
  //   };
  //   registered_tokens.set(token_id, new_metadata);
  // }

  // async transition struct_transfer_public(token_id: field, recipient: address, amount: u128) -> Future {
  //   return struct_finalize_transfer_public(token_id, recipient, amount, self.caller);
  // }

  // async function struct_finalize_transfer_public(
  //   token_id: field,
  //   recipient: address,
  //   amount: u128,
  //   owner: address
  // ) {
  //   let sender_key: TokenOwner = TokenOwner {
  //     account: owner,
  //     token_id: token_id
  //   };

  //   // Get stored balance for the owner
  //   let balance: Balance = struct_authorized_balances.get(sender_key);
  //   // Update the balance, and check that the balance >= amount
  //   let new_balance: Balance = Balance {
  //     token_id: token_id,
  //     account: owner,
  //     balance: balance.balance - amount,
  //     authorized_until: balance.authorized_until
  //   };
  //   // Update sender balance
  //   struct_authorized_balances.set(sender_key, new_balance);

  //   // Get or create the balance for the recipient
  //   let recipient_balance_key: TokenOwner = TokenOwner {
  //     account: recipient,
  //     token_id: token_id
  //   };
  //   // Get the locked balance if authorization is required, otherwise get the authorized balance
  //   let authorization_required: bool = registered_tokens.get(token_id).external_authorization_required;
  //   let default_expiration: u32 = authorization_required ? 0u32 : 4294967295u32;
  //   let default_balance: Balance = Balance {
  //     token_id: token_id,
  //     account: recipient,
  //     balance: 0u128,
  //     authorized_until: default_expiration
  //   };
  //   let recipient_balance: Balance = authorization_required ? struct_balances.get_or_use(recipient_balance_key, default_balance) : struct_authorized_balances.get_or_use(recipient_balance_key, default_balance);
  //   let new_recipient_balance: Balance = Balance {
  //     token_id: token_id,
  //     account: recipient,
  //     balance: recipient_balance.balance + amount,
  //     authorized_until: balance.authorized_until
  //   };

  //   // Update recipient balance
  //   if (authorization_required) {
  //     struct_balances.set(recipient_balance_key, new_recipient_balance);
  //   } else {
  //     struct_authorized_balances.set(recipient_balance_key, new_recipient_balance);
  //   }
  // }

  // async transition struct_approve_public(token_id: field, spender: address, amount: u128) -> Future {
  //   return struct_finalize_approve_public(token_id, spender, amount, self.caller);
  // }

  // async function struct_finalize_approve_public(token_id: field, spender: address, amount: u128, owner: address) {
  //   let owner_key: TokenOwner = TokenOwner {
  //     account: owner,
  //     token_id: token_id
  //   };
  //   let has_locked_balance: bool = struct_balances.contains(owner_key);
  //   let has_authorized_balance: bool = struct_authorized_balances.contains(owner_key);
  //   // Confirm that the caller has a balance in the token
  //   assert(has_locked_balance || has_authorized_balance);

  //   let allowance_key: Allowance = Allowance {
  //     account: owner,
  //     spender: spender,
  //     token_id: token_id
  //   };
  //   let current_allowance: u128 = struct_allowances.get_or_use(allowance_key, 0u128);
  //   // Increase or create the allowance amount
  //   struct_allowances.set(allowance_key, current_allowance + amount);
  // }

  // async transition struct_transfer_from_public(
  //   token_id: field,
  //   owner: address,
  //   recipient: address,
  //   amount: u128
  // ) -> Future {
  //   return struct_finalize_transfer_from_public(token_id, owner, recipient, amount, self.caller);
  // }

  // async function struct_finalize_transfer_from_public(
  //   token_id: field,
  //   owner: address,
  //   recipient: address,
  //   amount: u128,
  //   spender: address
  // ) {
  //   // Check that the spender is authorized to spend the amount
  //   let allowance_key: Allowance = Allowance {
  //     account: owner,
  //     spender: spender,
  //     token_id: token_id
  //   };
  //   let current_allowance: u128 = struct_allowances.get(allowance_key);
  //   assert(current_allowance >= amount);
  //   // Decrease the allowance by the amount being spent
  //   struct_allowances.set(allowance_key, current_allowance - amount);

  //   // Check that the owner has enough authorized balance
  //   let owner_key: TokenOwner = TokenOwner {
  //     account: owner,
  //     token_id: token_id
  //   };
  //   let balance: Balance = struct_authorized_balances.get(owner_key);
  //   assert_eq(owner, balance.account);
  //   assert(balance.balance >= amount);

  //   // Update the balance for the owner
  //   let new_balance: Balance = Balance {
  //     token_id: token_id,
  //     account: owner,
  //     balance: balance.balance - amount,
  //     authorized_until: balance.authorized_until
  //   };
  //   struct_authorized_balances.set(owner_key, new_balance);

  //   // Get or create the balance for the recipient
  //   let recipient_balance_key: TokenOwner = TokenOwner {
  //     account: recipient,
  //     token_id: token_id
  //   };
  //   // Get the locked balance if authorization is required, otherwise get the authorized balance
  //   let authorization_required: bool = registered_tokens.get(token_id).external_authorization_required;
  //   let default_expiration: u32 = authorization_required ? 0u32 : 4294967295u32;
  //   let default_balance: Balance = Balance {
  //     token_id: token_id,
  //     account: recipient,
  //     balance: 0u128,
  //     authorized_until: default_expiration
  //   };
  //   let recipient_balance: Balance = authorization_required ? struct_balances.get_or_use(recipient_balance_key, default_balance) : struct_authorized_balances.get_or_use(recipient_balance_key, default_balance);
  //   let new_recipient_balance: Balance = Balance {
  //     token_id: token_id,
  //     account: recipient,
  //     balance: recipient_balance.balance + amount,
  //     authorized_until: balance.authorized_until
  //   };
  //   // Update the balance of the recipient
  //   if (authorization_required) {
  //     struct_balances.set(recipient_balance_key, new_recipient_balance);
  //   } else {
  //     struct_authorized_balances.set(recipient_balance_key, new_recipient_balance);
  //   }
  // }
}