import { credits } from './credits';
import { creditsProgram } from './credits';

import assert from 'assert';
// interfaces
export interface Allowance {
  account: string;
  spender: string;
  token_id: string;
}
export interface Balance {
  token_id: string;
  account: string;
  balance: bigint;
  authorized_until: bigint;
}
export interface TokenOwner {
  account: string;
  token_id: string;
}
export interface TokenMetadata {
  token_id: string;
  name: bigint;
  symbol: bigint;
  decimals: bigint;
  supply: bigint;
  max_supply: bigint;
  admin: string;
  external_authorization_required: boolean;
  external_authorization_party: string;
}
export interface Token {
  owner: string;
  amount: bigint;
  token_id: string;
  external_authorization_required: boolean;
  authorized_until: bigint;
}
export class multi_token_support_programProgram {
  signer: string = 'not set';
  caller: string = 'not set';
  address: string = 'multi_token_support_program.aleo';
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  roles: Map<string, bigint> = new Map();
  SUPPLY_MANAGER_ROLE = BigInt('3');
  BURNER_ROLE = BigInt('2');
  MINTER_ROLE = BigInt('1');
  allowances: Map<string, bigint> = new Map();
  authorized_balances: Map<string, Balance> = new Map();
  balances: Map<string, Balance> = new Map();
  registered_tokens: Map<string, TokenMetadata> = new Map();
  CREDITS_RESERVED_TOKEN_ID =
    '3443843282313283355522573239085696902919850365217539366784739393210722344986field';
  credits: creditsProgram;
  constructor(
    // constructor args
    creditsContract: creditsProgram
  ) {
    // constructor body
    this.credits = creditsContract;
    this.block = this.credits.block;
  }

  // The 'mtsp' program.
  //program multi_token_support_program.aleo {

  // -------------------------
  // Called by token admins
  // -------------------------

  initialize() {
    return this.finalize_initialize();
  }

  finalize_initialize() {
    // Initialize the CREDITS_RESERVED_TOKEN_ID token
    let credits_reserved_token: TokenMetadata = {
      token_id: this.CREDITS_RESERVED_TOKEN_ID,
      name: BigInt('1095517519'),
      symbol: BigInt('1095517519'),
      decimals: BigInt('6'),
      supply: BigInt('1500000000000000'),
      max_supply: BigInt('1500000000000000'),
      admin: this.address,
      external_authorization_required: false,
      external_authorization_party: this.address,
    };

    this.registered_tokens.set(
      this.CREDITS_RESERVED_TOKEN_ID,
      credits_reserved_token
    );
  }

  register_token(
    token_id: string,
    name: bigint,
    symbol: bigint,
    decimals: bigint,
    max_supply: bigint,
    external_authorization_required: boolean,
    external_authorization_party: string
  ) {
    assert(token_id != this.CREDITS_RESERVED_TOKEN_ID);
    let token: TokenMetadata = {
      token_id: token_id,
      name: name,
      symbol: symbol,
      decimals: decimals,
      supply: BigInt('0'),
      max_supply: max_supply,
      admin: this.caller,
      external_authorization_required: external_authorization_required,
      external_authorization_party: external_authorization_party,
    };

    return this.finalize_register_token(token);
  }

  finalize_register_token(token: TokenMetadata) {
    // Make sure token doesn't already exist
    let token_exists: boolean = this.registered_tokens.has(token.token_id);
    assert(token_exists === false);
    // Set new token
    this.registered_tokens.set(token.token_id, token);
  }

  update_token_management(
    token_id: string,
    admin: string,
    external_authorization_party: string
  ) {
    assert(token_id != this.CREDITS_RESERVED_TOKEN_ID);
    return this.finalize_update_token_management(
      token_id,
      admin,
      external_authorization_party,
      this.caller
    );
  }

  finalize_update_token_management(
    token_id: string,
    admin: string,
    external_authorization_party: string,
    caller: string
  ) {
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    assert(caller === token.admin);

    let new_metadata: TokenMetadata = {
      token_id: token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: token.supply,
      max_supply: token.max_supply,
      admin: admin,
      external_authorization_required: token.external_authorization_required,
      external_authorization_party: external_authorization_party,
    };
    this.registered_tokens.set(token_id, new_metadata);
  }

  set_role(token_id: string, account: string, role: bigint) {
    assert(token_id != this.CREDITS_RESERVED_TOKEN_ID);
    return this.finalize_set_role(token_id, account, role, this.caller);
  }

  finalize_set_role(
    token_id: string,
    account: string,
    role: bigint,
    caller: string
  ) {
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    assert(caller === token.admin);

    let role_owner: TokenOwner = {
      account: account,
      token_id: token_id,
    };
    let role_owner_hash: string = JSON.stringify(role_owner);

    this.roles.set(role_owner_hash, role);
  }

  remove_role(token_id: string, account: string) {
    assert(token_id != this.CREDITS_RESERVED_TOKEN_ID);
    return this.finalize_remove_role(token_id, account, this.caller);
  }

  finalize_remove_role(token_id: string, account: string, caller: string) {
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    assert(caller === token.admin);

    let role_owner: TokenOwner = {
      account: account,
      token_id: token_id,
    };
    let role_owner_hash: string = JSON.stringify(role_owner);

    this.roles.delete(role_owner_hash);
  }

  mint_public(
    token_id: string,
    recipient: string,
    amount: bigint,
    authorized_until: bigint
  ) {
    assert(token_id != this.CREDITS_RESERVED_TOKEN_ID);
    return this.finalize_mint_public(
      token_id,
      recipient,
      amount,
      authorized_until,
      this.caller
    );
  }

  finalize_mint_public(
    token_id: string,
    recipient: string,
    amount: bigint,
    authorized_until: bigint,
    caller: string
  ) {
    // Check that the token exists, and that the caller has permission to mint
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    let is_admin: boolean = caller == token.admin;
    if (!is_admin) {
      let role_owner: TokenOwner = {
        account: caller,
        token_id: token_id,
      };
      let role_owner_hash: string = JSON.stringify(role_owner);
      let role: bigint = BigInt.asUintN(8, this.roles.get(role_owner_hash)!);
      assert(role !== undefined);
      assert(role == this.MINTER_ROLE || role == this.SUPPLY_MANAGER_ROLE);
    }

    // Check that the token supply + amount <= max_supply
    let new_supply: bigint = BigInt.asUintN(128, token.supply + amount);
    assert(new_supply <= token.max_supply);

    // Get or create the balance for the recipient
    let token_owner: TokenOwner = {
      account: recipient,
      token_id: token_id,
    };
    let balance_key: string = JSON.stringify(token_owner);
    let default_balance: Balance = {
      token_id: token_id,
      account: recipient,
      balance: BigInt('0'),
      authorized_until: authorized_until,
    };
    let authorization_required: boolean = token.external_authorization_required;
    // Get the locked balance if authorization is required, otherwise get the authorized balance
    let balance: Balance = authorization_required
      ? this.balances.get(balance_key) || default_balance
      : this.authorized_balances.get(balance_key) || default_balance;
    let new_balance: Balance = {
      token_id: token_id,
      account: recipient,
      balance: balance.balance + amount,
      authorized_until: balance.authorized_until,
    };
    // Update the appropriate balance
    if (authorization_required) {
      this.balances.set(balance_key, new_balance);
    } else {
      this.authorized_balances.set(balance_key, new_balance);
    }

    // Update the token supply
    let new_metadata: TokenMetadata = {
      token_id: token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: new_supply,
      max_supply: token.max_supply,
      admin: token.admin,
      external_authorization_required: token.external_authorization_required,
      external_authorization_party: token.external_authorization_party,
    };
    this.registered_tokens.set(token_id, new_metadata);
  }

  mint_private(
    token_id: string,
    recipient: string,
    amount: bigint,
    external_authorization_required: boolean,
    authorized_until: bigint
  ) {
    assert(token_id != this.CREDITS_RESERVED_TOKEN_ID);
    let token: Token = {
      owner: recipient,
      amount: amount,
      token_id: token_id,
      external_authorization_required: external_authorization_required,
      authorized_until: authorized_until,
    };

    return [
      token,
      this.finalize_mint_private(
        token_id,
        amount,
        external_authorization_required,
        authorized_until,
        this.caller
      ),
    ];
  }

  finalize_mint_private(
    token_id: string,
    amount: bigint,
    external_authorization_required: boolean,
    authorized_until: bigint,
    caller: string
  ) {
    // Check that the token exists, and that the caller has permission to mint
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    let is_admin: boolean = caller == token.admin;
    if (!is_admin) {
      let role_owner: TokenOwner = {
        account: caller,
        token_id: token_id,
      };
      let role_owner_hash: string = JSON.stringify(role_owner);
      let role: bigint = BigInt.asUintN(8, this.roles.get(role_owner_hash)!);
      assert(role !== undefined);
      assert(role == this.MINTER_ROLE || role == this.SUPPLY_MANAGER_ROLE);
    }

    // Check that the token supply + amount <= max_supply
    let new_supply: bigint = BigInt.asUintN(128, token.supply + amount);
    assert(new_supply <= token.max_supply);

    // Check that whether the token is authorized or not matches the authorized parameter
    let authorization_required: boolean = token.external_authorization_required;
    assert(authorization_required === external_authorization_required);
    assert(authorized_until == BigInt('0') || !authorization_required);

    // Update the token supply
    let new_metadata: TokenMetadata = {
      token_id: token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: new_supply,
      max_supply: token.max_supply,
      admin: token.admin,
      external_authorization_required: token.external_authorization_required,
      external_authorization_party: token.external_authorization_party,
    };
    this.registered_tokens.set(token_id, new_metadata);
  }

  burn_public(token_id: string, owner: string, amount: bigint) {
    assert(token_id != this.CREDITS_RESERVED_TOKEN_ID);

    let token_owner: TokenOwner = {
      account: owner,
      token_id: token_id,
    };

    return this.finalize_burn_public(token_owner, amount, this.caller);
  }

  finalize_burn_public(owner: TokenOwner, amount: bigint, caller: string) {
    // Check that the token exists, and that the caller has permission to burn
    let token: TokenMetadata = this.registered_tokens.get(owner.token_id)!;
    assert(token !== undefined);
    if (caller != token.admin) {
      let role_owner: TokenOwner = {
        account: caller,
        token_id: owner.token_id,
      };
      let role_owner_hash: string = JSON.stringify(role_owner);
      let role: bigint = BigInt.asUintN(8, this.roles.get(role_owner_hash)!);
      assert(role !== undefined);
      assert(role == this.BURNER_ROLE || role == this.SUPPLY_MANAGER_ROLE);
    }

    // Update the token supply
    let new_metadata: TokenMetadata = {
      token_id: token.token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: token.supply - amount, // underflow will be caught by the VM
      max_supply: token.max_supply,
      admin: token.admin,
      external_authorization_required: token.external_authorization_required,
      external_authorization_party: token.external_authorization_party,
    };
    this.registered_tokens.set(owner.token_id, new_metadata);

    // Get the authorized balance for the recipient
    let default_balance: Balance = {
      token_id: owner.token_id,
      account: owner.account,
      balance: BigInt('0'),
      authorized_until: BigInt('0'),
    };
    let balance_key: string = JSON.stringify(owner);
    let authorized_balance: Balance =
      this.authorized_balances.get(balance_key) || default_balance;
    // Check if the authorized balance is enough to burn
    if (authorized_balance.balance > BigInt('0')) {
      // Burn from authorized balance
      if (authorized_balance.balance > amount) {
        let new_authorized_balance: Balance = {
          token_id: owner.token_id,
          account: owner.account,
          balance: authorized_balance.balance - amount,
          authorized_until: authorized_balance.authorized_until,
        };
        this.authorized_balances.set(balance_key, new_authorized_balance);
        return; // Done burning
      } else {
        this.authorized_balances.delete(balance_key);
        let left_to_burn: bigint = BigInt.asUintN(
          128,
          amount - authorized_balance.balance
        );
        // Burn remainder from locked balance
        let locked_balance: Balance = this.balances.get(balance_key)!;
        assert(locked_balance !== undefined);
        let new_locked_balance: Balance = {
          token_id: owner.token_id,
          account: owner.account,
          balance: locked_balance.balance - left_to_burn,
          authorized_until: locked_balance.authorized_until,
        };
        this.balances.set(balance_key, new_locked_balance);
      }
    } else {
      // Otherwise burn directly from locked balance
      let locked_balance: Balance = this.balances.get(balance_key)!;
      assert(locked_balance !== undefined);
      let new_locked_balance: Balance = {
        token_id: owner.token_id,
        account: owner.account,
        balance: locked_balance.balance - amount,
        authorized_until: locked_balance.authorized_until,
      };
      this.balances.set(balance_key, new_locked_balance);
    }
  }

  burn_private(input_record: Token, amount: bigint) {
    assert(input_record.token_id != this.CREDITS_RESERVED_TOKEN_ID);
    let output_record: Token = {
      owner: input_record.owner,
      amount: input_record.amount - amount,
      token_id: input_record.token_id,
      external_authorization_required:
        input_record.external_authorization_required,
      authorized_until: input_record.authorized_until,
    };
    return [
      output_record,
      this.finalize_burn_private(input_record.token_id, amount, this.caller),
    ];
  }

  finalize_burn_private(token_id: string, amount: bigint, caller: string) {
    // Check that the token exists, and that the caller has permission to burn
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    let is_admin: boolean = caller == token.admin;
    if (!is_admin) {
      let role_owner: TokenOwner = {
        account: caller,
        token_id: token_id,
      };
      let role_owner_hash: string = JSON.stringify(role_owner);
      let role: bigint = BigInt.asUintN(8, this.roles.get(role_owner_hash)!);
      assert(role !== undefined);
      assert(role == this.BURNER_ROLE || role == this.SUPPLY_MANAGER_ROLE);
    }

    // Check that the token supply - amount >= 0
    let new_supply: bigint = BigInt.asUintN(128, token.supply - amount); // underflow will be caught by the VM

    // Update the token supply
    let new_metadata: TokenMetadata = {
      token_id: token_id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: new_supply,
      max_supply: token.max_supply,
      admin: token.admin,
      external_authorization_required: token.external_authorization_required,
      external_authorization_party: token.external_authorization_party,
    };
    this.registered_tokens.set(token_id, new_metadata);
  }

  prehook_public(owner: TokenOwner, amount: bigint, authorized_until: bigint) {
    return this.finalize_prehook_public(
      owner,
      amount,
      authorized_until,
      this.caller
    );
  }

  finalize_prehook_public(
    owner: TokenOwner,
    amount: bigint,
    authorized_until: bigint,
    caller: string
  ) {
    // Check that the caller has permission to authorize
    let token: TokenMetadata = this.registered_tokens.get(owner.token_id)!;
    assert(token !== undefined);
    assert(caller == token.external_authorization_party);

    let default_balance: Balance = {
      token_id: owner.token_id,
      account: owner.account,
      balance: BigInt('0'),
      authorized_until: BigInt('0'),
    };
    let balance_key: string = JSON.stringify(owner);
    // Get the locked balance for the recipient
    let locked_balance: Balance =
      this.balances.get(balance_key) || default_balance;
    // Get the authorized balance for the recipient
    let authorized_balance: Balance =
      this.authorized_balances.get(balance_key) || default_balance;
    // Check if the authorized balance is expired
    let authorized_balance_expired: boolean =
      authorized_balance.authorized_until < this.block.height;
    // If the authorized balance is expired, treat is as part of the locked balance
    let actual_locked_balance: bigint = BigInt.asUintN(
      128,
      authorized_balance_expired
        ? locked_balance.balance + authorized_balance.balance
        : locked_balance.balance
    );
    let actual_authorized_balance: bigint = BigInt.asUintN(
      128,
      authorized_balance_expired ? BigInt('0') : authorized_balance.balance
    );
    // Move the amount from the locked balance to the authorized balance
    let new_locked_balance: bigint = BigInt.asUintN(
      128,
      actual_locked_balance - amount
    );
    let new_authorized_balance: bigint = BigInt.asUintN(
      128,
      actual_authorized_balance + amount
    );

    // Update the authorized balance with the incremented amount and new expiration
    let new_authorized_balance_struct: Balance = {
      token_id: owner.token_id,
      account: owner.account,
      balance: new_authorized_balance,
      authorized_until: authorized_until,
    };
    this.authorized_balances.set(balance_key, new_authorized_balance_struct);

    // Update the locked balance
    let new_locked_balance_struct: Balance = {
      token_id: owner.token_id,
      account: owner.account,
      balance: new_locked_balance,
      authorized_until: locked_balance.authorized_until,
    };
    this.balances.set(balance_key, new_locked_balance_struct);
  }

  prehook_private(
    input_record: Token,
    amount: bigint,
    authorized_until: bigint
  ) {
    let unauthorized_record: Token = {
      owner: input_record.owner,
      amount: input_record.amount - amount,
      token_id: input_record.token_id,
      external_authorization_required:
        input_record.external_authorization_required,
      authorized_until: input_record.authorized_until,
    };
    let authorized_record: Token = {
      owner: input_record.owner,
      amount: amount,
      token_id: input_record.token_id,
      external_authorization_required:
        input_record.external_authorization_required,
      authorized_until: authorized_until,
    };
    return [
      unauthorized_record,
      authorized_record,
      this.finalize_prehook_private(input_record.token_id, this.caller),
    ];
  }

  finalize_prehook_private(token_id: string, caller: string) {
    // Check that the caller has permission to authorize
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    assert(caller == token.external_authorization_party);
  }

  // -------------------------
  // Called by token owners/DeFi contracts
  // -------------------------

  transfer_public(token_id: string, recipient: string, amount: bigint) {
    return this.finalize_transfer_public(
      token_id,
      recipient,
      amount,
      this.caller
    );
  }

  finalize_transfer_public(
    token_id: string,
    recipient: string,
    amount: bigint,
    owner: string
  ) {
    let sender_key: TokenOwner = {
      account: owner,
      token_id: token_id,
    };

    // Get stored balance for the owner
    let sender_key_hash: string = JSON.stringify(sender_key);
    let balance: Balance = this.authorized_balances.get(sender_key_hash)!;
    assert(balance !== undefined);
    // Assert that the balance authorization is not expired or that the token does not require authorization
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    assert(
      this.block.height <= balance.authorized_until ||
        !token.external_authorization_required
    );
    // Update the balance, and check that the balance >= amount
    let new_balance: Balance = {
      token_id: token_id,
      account: owner,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until,
    };
    // Update sender balance
    this.authorized_balances.set(sender_key_hash, new_balance);

    // Get or create the balance for the recipient
    let recipient_key: TokenOwner = {
      account: recipient,
      token_id: token_id,
    };
    let recipient_balance_key: string = JSON.stringify(recipient_key);
    // Get the locked balance if authorization is required, otherwise get the authorized balance
    let authorization_required: boolean =
      this.registered_tokens.get(token_id)!.external_authorization_required;
    assert(authorization_required !== undefined);
    let default_expiration: bigint = BigInt.asUintN(
      32,
      authorization_required ? BigInt('0') : BigInt('4294967295')
    );
    let default_balance: Balance = {
      token_id: token_id,
      account: recipient,
      balance: BigInt('0'),
      authorized_until: default_expiration,
    };
    let recipient_balance: Balance = authorization_required
      ? this.balances.get(recipient_balance_key) || default_balance
      : this.authorized_balances.get(recipient_balance_key) || default_balance;
    let new_recipient_balance: Balance = {
      token_id: token_id,
      account: recipient,
      balance: recipient_balance.balance + amount,
      authorized_until: recipient_balance.authorized_until,
    };

    // Update recipient balance
    if (authorization_required) {
      this.balances.set(recipient_balance_key, new_recipient_balance);
    } else {
      this.authorized_balances.set(
        recipient_balance_key,
        new_recipient_balance
      );
    }
  }

  transfer_public_as_signer(
    token_id: string,
    recipient: string,
    amount: bigint
  ) {
    return this.finalize_transfer_public_as_signer(
      token_id,
      recipient,
      amount,
      this.signer
    );
  }

  finalize_transfer_public_as_signer(
    token_id: string,
    recipient: string,
    amount: bigint,
    owner: string
  ) {
    let sender_key: TokenOwner = {
      account: owner,
      token_id: token_id,
    };

    // Get stored balance for the owner
    let sender_key_hash: string = JSON.stringify(sender_key);
    let balance: Balance = this.authorized_balances.get(sender_key_hash)!;
    assert(balance !== undefined);
    // Assert that the balance authorization is not expired or that the token does not require authorization
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    assert(
      this.block.height <= balance.authorized_until ||
        !token.external_authorization_required
    );
    // Update the balance, and check that the balance >= amount
    let new_balance: Balance = {
      token_id: token_id,
      account: owner,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until,
    };
    // Update sender balance
    this.authorized_balances.set(sender_key_hash, new_balance);

    // Get or create the balance for the recipient
    let recipient_key: TokenOwner = {
      account: recipient,
      token_id: token_id,
    };
    let recipient_balance_key: string = JSON.stringify(recipient_key);
    // Get the locked balance if authorization is required, otherwise get the authorized balance
    let authorization_required: boolean =
      this.registered_tokens.get(token_id)!.external_authorization_required;
    assert(authorization_required !== undefined);
    let default_expiration: bigint = BigInt.asUintN(
      32,
      authorization_required ? BigInt('0') : BigInt('4294967295')
    );
    let default_balance: Balance = {
      token_id: token_id,
      account: recipient,
      balance: BigInt('0'),
      authorized_until: default_expiration,
    };
    let recipient_balance: Balance = authorization_required
      ? this.balances.get(recipient_balance_key) || default_balance
      : this.authorized_balances.get(recipient_balance_key) || default_balance;
    let new_recipient_balance: Balance = {
      token_id: token_id,
      account: recipient,
      balance: recipient_balance.balance + amount,
      authorized_until: recipient_balance.authorized_until,
    };

    // Update recipient balance
    if (authorization_required) {
      this.balances.set(recipient_balance_key, new_recipient_balance);
    } else {
      this.authorized_balances.set(
        recipient_balance_key,
        new_recipient_balance
      );
    }
  }

  approve_public(token_id: string, spender: string, amount: bigint) {
    return this.finalize_approve_public(token_id, spender, amount, this.caller);
  }

  finalize_approve_public(
    token_id: string,
    spender: string,
    amount: bigint,
    owner: string
  ) {
    let owner_key: TokenOwner = {
      account: owner,
      token_id: token_id,
    };

    let allowance: Allowance = {
      account: owner,
      spender: spender,
      token_id: token_id,
    };
    let allowance_key: string = JSON.stringify(allowance);
    let current_allowance: bigint = BigInt.asUintN(
      128,
      this.allowances.get(allowance_key) || BigInt('0')
    );
    // Increase or create the allowance amount
    this.allowances.set(allowance_key, current_allowance + amount);
  }

  unapprove_public(token_id: string, spender: string, amount: bigint) {
    return this.finalize_unapprove_public(
      token_id,
      spender,
      amount,
      this.caller
    );
  }

  finalize_unapprove_public(
    token_id: string,
    spender: string,
    amount: bigint,
    owner: string
  ) {
    let allowance: Allowance = {
      account: owner,
      spender: spender,
      token_id: token_id,
    };
    let allowance_key: string = JSON.stringify(allowance);
    let current_allowance: bigint = BigInt.asUintN(
      128,
      this.allowances.get(allowance_key)!
    );
    assert(current_allowance !== undefined);
    // Decrease the allowance amount
    this.allowances.set(allowance_key, current_allowance - amount);
  }

  transfer_from_public(
    token_id: string,
    owner: string,
    recipient: string,
    amount: bigint
  ) {
    return this.finalize_transfer_from_public(
      token_id,
      owner,
      recipient,
      amount,
      this.caller
    );
  }

  finalize_transfer_from_public(
    token_id: string,
    owner: string,
    recipient: string,
    amount: bigint,
    spender: string
  ) {
    // Check that the spender is authorized to spend the amount
    let allowance: Allowance = {
      account: owner,
      spender: spender,
      token_id: token_id,
    };
    let allowance_key: string = JSON.stringify(allowance);
    let current_allowance: bigint = BigInt.asUintN(
      128,
      this.allowances.get(allowance_key)!
    );
    assert(current_allowance !== undefined);
    // Decrease the allowance by the amount being spent
    this.allowances.set(allowance_key, current_allowance - amount);

    // Check that the owner has enough authorized balance
    let owner_key: TokenOwner = {
      account: owner,
      token_id: token_id,
    };
    let owner_key_hash: string = JSON.stringify(owner_key);
    let balance: Balance = this.authorized_balances.get(owner_key_hash)!;
    assert(balance !== undefined);
    // Assert that the balance authorization is not expired or that the token does not require authorization
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    assert(
      this.block.height <= balance.authorized_until ||
        !token.external_authorization_required
    );

    // Update the balance for the owner
    let new_balance: Balance = {
      token_id: token_id,
      account: owner,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until,
    };
    this.authorized_balances.set(owner_key_hash, new_balance);

    // Get or create the balance for the recipient
    let recipient_key: TokenOwner = {
      account: recipient,
      token_id: token_id,
    };
    let recipient_balance_key: string = JSON.stringify(recipient_key);
    // Get the locked balance if authorization is required, otherwise get the authorized balance
    let authorization_required: boolean =
      this.registered_tokens.get(token_id)!.external_authorization_required;
    assert(authorization_required !== undefined);
    let default_expiration: bigint = BigInt.asUintN(
      32,
      authorization_required ? BigInt('0') : BigInt('4294967295')
    );
    let default_balance: Balance = {
      token_id: token_id,
      account: recipient,
      balance: BigInt('0'),
      authorized_until: default_expiration,
    };
    let recipient_balance: Balance = authorization_required
      ? this.balances.get(recipient_balance_key) || default_balance
      : this.authorized_balances.get(recipient_balance_key) || default_balance;
    let new_recipient_balance: Balance = {
      token_id: token_id,
      account: recipient,
      balance: recipient_balance.balance + amount,
      authorized_until: recipient_balance.authorized_until,
    };
    // Update the balance of the recipient
    if (authorization_required) {
      this.balances.set(recipient_balance_key, new_recipient_balance);
    } else {
      this.authorized_balances.set(
        recipient_balance_key,
        new_recipient_balance
      );
    }
  }

  transfer_public_to_private(
    token_id: string,
    recipient: string,
    amount: bigint,
    external_authorization_required: boolean
  ) {
    let authorized_until: bigint = BigInt.asUintN(
      32,
      external_authorization_required ? BigInt('0') : BigInt('4294967295')
    );
    let token: Token = {
      owner: recipient,
      amount: amount,
      token_id: token_id,
      external_authorization_required: external_authorization_required,
      authorized_until: authorized_until,
    };
    return [
      token,
      this.finalize_transfer_public_to_private(
        token_id,
        amount,
        this.caller,
        external_authorization_required
      ),
    ];
  }

  finalize_transfer_public_to_private(
    token_id: string,
    amount: bigint,
    owner: string,
    external_authorization_required: boolean
  ) {
    // Check that the transfer record's authorization matches the token's external_authorization_required
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    assert(
      token.external_authorization_required === external_authorization_required
    );

    let sender_key: TokenOwner = {
      account: owner,
      token_id: token_id,
    };

    // Get stored balances for the owner
    let sender_key_hash: string = JSON.stringify(sender_key);
    let balance: Balance = this.authorized_balances.get(sender_key_hash)!;
    assert(balance !== undefined);
    // Assert that the balance authorization is not expired or that the token does not require authorization
    let token_metadata: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token_metadata !== undefined);
    assert(
      this.block.height <= balance.authorized_until ||
        !token_metadata.external_authorization_required
    );
    // Update the balance
    let new_balance: Balance = {
      token_id: token_id,
      account: owner,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until,
    };
    this.authorized_balances.set(sender_key_hash, new_balance);
  }

  transfer_from_public_to_private(
    token_id: string,
    owner: string,
    recipient: string,
    amount: bigint,
    external_authorization_required: boolean
  ) {
    let authorized_until: bigint = BigInt.asUintN(
      32,
      external_authorization_required ? BigInt('0') : BigInt('4294967295')
    );
    let token: Token = {
      owner: recipient,
      amount: amount,
      token_id: token_id,
      external_authorization_required: external_authorization_required,
      authorized_until: authorized_until,
    };
    return [
      token,
      this.finalize_transfer_from_public_to_private(
        token_id,
        owner,
        amount,
        this.caller,
        external_authorization_required
      ),
    ];
  }

  finalize_transfer_from_public_to_private(
    token_id: string,
    owner: string,
    amount: bigint,
    spender: string,
    external_authorization_required: boolean
  ) {
    // Check that the transfer record's authorization matches the token's external_authorization_required
    let token: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token !== undefined);
    assert(
      token.external_authorization_required === external_authorization_required
    );

    // Check that the spender is authorized to spend the amount
    let allowance: Allowance = {
      account: owner,
      spender: spender,
      token_id: token_id,
    };
    let allowance_key: string = JSON.stringify(allowance);
    let current_allowance: bigint = BigInt.asUintN(
      128,
      this.allowances.get(allowance_key)!
    );
    assert(current_allowance !== undefined);
    // Update the allowance
    this.allowances.set(allowance_key, current_allowance - amount);

    // Check that the owner has enough authorized balance
    let owner_key: TokenOwner = {
      account: owner,
      token_id: token_id,
    };
    let owner_key_hash: string = JSON.stringify(owner_key);
    let balance: Balance = this.authorized_balances.get(owner_key_hash)!;
    assert(balance !== undefined);
    // Assert that the balance authorization is not expired or that the token does not require authorization
    let token_metadata: TokenMetadata = this.registered_tokens.get(token_id)!;
    assert(token_metadata !== undefined);
    assert(
      this.block.height <= balance.authorized_until ||
        !token_metadata.external_authorization_required
    );
    // Update the balance for the owner
    let new_balance: Balance = {
      token_id: token_id,
      account: owner,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until,
    };
    this.authorized_balances.set(owner_key_hash, new_balance);
  }

  transfer_private(recipient: string, amount: bigint, input_record: Token) {
    let updated_record: Token = {
      owner: input_record.owner,
      amount: input_record.amount - amount,
      token_id: input_record.token_id,
      external_authorization_required:
        input_record.external_authorization_required,
      authorized_until: input_record.authorized_until,
    };

    let external_authorization_required: boolean =
      input_record.external_authorization_required;
    let authorized_until: bigint = BigInt.asUintN(
      32,
      external_authorization_required ? BigInt('0') : BigInt('4294967295')
    );
    let transfer_record: Token = {
      owner: recipient,
      amount: amount,
      token_id: input_record.token_id,
      external_authorization_required: external_authorization_required,
      authorized_until: authorized_until,
    };

    return [
      updated_record,
      transfer_record,
      this.finalize_transfer_private(
        external_authorization_required,
        input_record.authorized_until
      ),
    ];
  }

  finalize_transfer_private(
    external_authorization_required: boolean,
    input_token_authorized_until: bigint
  ) {
    assert(
      this.block.height <= input_token_authorized_until ||
        !external_authorization_required
    );
  }

  transfer_private_to_public(
    recipient: string,
    amount: bigint,
    input_record: Token
  ) {
    let updated_record: Token = {
      owner: input_record.owner,
      amount: input_record.amount - amount,
      token_id: input_record.token_id,
      external_authorization_required:
        input_record.external_authorization_required,
      authorized_until: input_record.authorized_until,
    };

    return [
      updated_record,
      this.finalize_transfer_private_to_public(
        input_record.token_id,
        recipient,
        amount,
        input_record.authorized_until,
        input_record.external_authorization_required
      ),
    ];
  }

  finalize_transfer_private_to_public(
    token_id: string,
    recipient: string,
    amount: bigint,
    record_authorized_until: bigint,
    external_authorization_required: boolean
  ) {
    // Assert that the record authorization is not expired
    assert(
      this.block.height <= record_authorized_until ||
        !external_authorization_required
    );
    // Get or create the balance for the recipient
    let recipient_key: TokenOwner = {
      account: recipient,
      token_id: token_id,
    };
    let recipient_balance_key: string = JSON.stringify(recipient_key);
    // Get the locked balance if authorization is required, otherwise get the authorized balance
    let authorization_required: boolean =
      this.registered_tokens.get(token_id)!.external_authorization_required;
    assert(authorization_required !== undefined);
    let default_expiration: bigint = BigInt.asUintN(
      32,
      authorization_required ? BigInt('0') : BigInt('4294967295')
    );
    let default_balance: Balance = {
      token_id: token_id,
      account: recipient,
      balance: BigInt('0'),
      authorized_until: default_expiration,
    };
    let recipient_balance: Balance = authorization_required
      ? this.balances.get(recipient_balance_key) || default_balance
      : this.authorized_balances.get(recipient_balance_key) || default_balance;
    let new_recipient_balance: Balance = {
      token_id: token_id,
      account: recipient,
      balance: recipient_balance.balance + amount,
      authorized_until: recipient_balance.authorized_until,
    };
    // Update the balance of the recipient
    if (authorization_required) {
      this.balances.set(recipient_balance_key, new_recipient_balance);
    } else {
      this.authorized_balances.set(
        recipient_balance_key,
        new_recipient_balance
      );
    }
  }

  // -------------------------
  // credits.aleo wrapper
  // -------------------------

  deposit_credits_public(amount: bigint) {
    this.credits.signer = this.signer;
    this.credits.caller = 'multi_token_support_program.aleo';
    this.credits.transfer_public_as_signer(this.address, amount);

    return this.finalize_deposit_credits_public(amount, this.signer);
  }

  finalize_deposit_credits_public(amount: bigint, signer: string) {
    // Get or create a credits balance for the signer
    let balance_key: TokenOwner = {
      account: signer,
      token_id: this.CREDITS_RESERVED_TOKEN_ID,
    };
    let balance_key_hash: string = JSON.stringify(balance_key);
    let default_balance: Balance = {
      token_id: this.CREDITS_RESERVED_TOKEN_ID,
      account: signer,
      balance: BigInt('0'),
      authorized_until: BigInt('4294967295'),
    };
    let balance: Balance =
      this.authorized_balances.get(balance_key_hash) || default_balance;
    // Increment the balance by the amount deposited
    let new_balance: Balance = {
      token_id: this.CREDITS_RESERVED_TOKEN_ID,
      account: signer,
      balance: balance.balance + amount,
      authorized_until: balance.authorized_until,
    };
    // Update the balance
    this.authorized_balances.set(balance_key_hash, new_balance);
  }

  deposit_credits_private(input_record: credits, amount: bigint) {
    this.credits.signer = this.signer;
    this.credits.caller = 'multi_token_support_program.aleo';
    let transfer_output: credits = this.credits.transfer_private_to_public(
      input_record,
      this.address,
      amount
    );

    let token: Token = {
      owner: input_record.owner,
      amount: amount,
      token_id: this.CREDITS_RESERVED_TOKEN_ID,
      external_authorization_required: false,
      authorized_until: BigInt('4294967295'),
    };
    return [transfer_output, token, this.finalize_deposit_credits_private()];
  }

  finalize_deposit_credits_private() {
    assert(true);
  }

  withdraw_credits_public(amount: bigint) {
    this.credits.signer = this.signer;
    this.credits.caller = 'multi_token_support_program.aleo';
    this.credits.transfer_public(this.caller, amount);

    return this.finalize_withdraw_credits_public(amount, this.caller);
  }

  finalize_withdraw_credits_public(amount: bigint, caller: string) {
    // Get the credits balance for the caller
    let balance_key: TokenOwner = {
      account: caller,
      token_id: this.CREDITS_RESERVED_TOKEN_ID,
    };
    let balance_key_hash: string = JSON.stringify(balance_key);
    let balance: Balance = this.authorized_balances.get(balance_key_hash)!;
    assert(balance !== undefined);
    // Decrement the balance by the amount withdrawn, underflow will be caught by the VM
    let new_balance: Balance = {
      token_id: this.CREDITS_RESERVED_TOKEN_ID,
      account: caller,
      balance: balance.balance - amount,
      authorized_until: balance.authorized_until,
    };
    this.authorized_balances.set(balance_key_hash, new_balance);
  }

  withdraw_credits_private(input_token: Token, amount: bigint) {
    assert(input_token.token_id == this.CREDITS_RESERVED_TOKEN_ID);

    this.credits.signer = this.signer;
    this.credits.caller = 'multi_token_support_program.aleo';
    let transfer_output: credits = this.credits.transfer_public_to_private(
      input_token.owner,
      amount
    );

    let updated_token: Token = {
      owner: input_token.owner,
      amount: input_token.amount - amount,
      token_id: input_token.token_id,
      external_authorization_required:
        input_token.external_authorization_required,
      authorized_until: input_token.authorized_until,
    };

    return [
      updated_token,
      transfer_output,
      this.finalize_withdraw_credits_private(),
    ];
  }

  finalize_withdraw_credits_private() {
    assert(true);
  }
}
