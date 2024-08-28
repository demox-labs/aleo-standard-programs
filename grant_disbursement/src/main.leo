import credits.aleo;
import multi_token_support_program.aleo;
import pondo_core_protocol.aleo;

// The 'grant_disbursement' program.
program grant_disbursement.aleo {
  // Admins who set the global timestamp
  const ADMIN_0: address = aleo12shtwnmf49t5atmad2jnk3e58ahtp749d9trctt9z3wryxyzt5pspp0nd0;
  const ADMIN_1: address = aleo1z9y9afh0h6dnyj3f0hvjc4mhayjy06fj42ppcq0rvpmmyky6fuzs449sjr;
  const ADMIN_2: address = aleo19x0ctad8llm9y0qssw7eup045c5wxxp6k4al3n0d5r8maulkzu8sh3jwew;
  const ADMIN_3: address = aleo16ycrg9g4208lp5y4g5s3gn43xknc5gdsr7wjrpqq9htznj5qk5yqd6px5a;
  const ADMIN_4: address = aleo1q59hxe2zmexlu4vgtmtmvyxm4ew047zlf50h5l5zsrdvljusdvrqn78u7s;

  struct admin_operation {
    arg: field,
    op_type: u8,
    request_id: u64
  }

  // The admin operation types
  const UPDATE_TIMESTAMP_OPERATION: u8 = 0u8;
  const UPDATE_ADMIN_OPERATION: u8 = 1u8;

  struct Grant {
    credits_amount: u64, // The amount of Aleo credits to be distributed
    paleo_amount: u64, // The amount of paleo to be distributed
    recipient_rewards_key: address, // The address that can withdraw the rewards
    recipient_principal_key: address, // The address that can withdraw the principal
    start_timestamp: u64, // The timestamp at which the grant was created
    cliff_timestamp: u64, // The timestamp at which the recipient can start withdrawing principal
    fully_vested_timestamp: u64 // The timestamp at which the recipient can withdraw the full principal
  }

  mapping timestamp: u8 => u64;
  mapping admin_operations: u64 => admin_operation;
  mapping admins: address => bool;
  mapping grants: u64 => Grant;

  async transition initialize() -> Future {
    return finalize_initialize();
  }

  async function finalize_initialize() {
    // Ensure the protocol is not already initialized
    let already_initialized: bool = timestamp.contains(0u8);
    assert(!already_initialized);

    // Set the initial timestamp
    timestamp.set(0u8, 0u64);

    // Set the admins
    admins.set(ADMIN_0, true);
    admins.set(ADMIN_1, true);
    admins.set(ADMIN_2, true);
    admins.set(ADMIN_3, true);
    admins.set(ADMIN_4, true);
  }

  async transition update_timestamp(
    public new_timestamp: u64,
    public sig_1: signature,
    public admin_1: address,
    public sig_2: signature,
    public admin_2: address,
    public sig_3: signature,
    public admin_3: address,
    public request_id: u64
  ) -> Future {
    let arg: field = BHP256::hash_to_field(new_timestamp);
    let admin_op: admin_operation = admin_operation {
      arg: arg,
      op_type: UPDATE_TIMESTAMP_OPERATION,
      request_id: request_id
    };
    let op_hash: field = BHP256::hash_to_field(admin_op);
    let is_verified_1: bool = sig_1.verify(admin_1, op_hash);
    let is_verified_2: bool = sig_2.verify(admin_2, op_hash);
    let is_verified_3: bool = sig_3.verify(admin_3, op_hash);
    assert(is_verified_1 && is_verified_2 && is_verified_3);

    // Ensure the admin addresses are not the same
    assert_neq(admin_1, admin_2);
    assert_neq(admin_1, admin_3);
    assert_neq(admin_2, admin_3); 

    return finalize_update_timestamp(
      new_timestamp,
      admin_1,
      admin_2,
      admin_3,
      admin_op
      );
  }

  async function finalize_update_timestamp(
    public new_timestamp: u64,
    public admin_1: address,
    public admin_2: address,
    public admin_3: address,
    public admin_op: admin_operation
  ) {
    /* Start Verify Admin Operation */

    // Ensure the admin addresses are each admins
    let is_admin_1: bool = admins.get(admin_1);
    let is_admin_2: bool = admins.get(admin_2);
    let is_admin_3: bool = admins.get(admin_3);
    assert(is_admin_1 && is_admin_2 && is_admin_3);

    // Ensure the request hasn't been made before
    let request_exists: bool = admin_operations.contains(admin_op.request_id);
    assert_eq(request_exists, false);

    // Set the admin operation
    admin_operations.set(admin_op.request_id, admin_op);

    /* End Verify Admin Operation */

    // Set the new timestamp
    timestamp.set(0u8, new_timestamp);
  }

  // Used for the multi-sig to update an admin addresses
  async transition update_admin(
    public old_admin: address,
    public new_admin: address,
    public sig_1: signature,
    public admin_1: address,
    public sig_2: signature,
    public admin_2: address,
    public sig_3: signature,
    public admin_3: address,
    public request_id: u64
  ) -> Future {
    let args: [address; 2] = [old_admin, new_admin];
    let arg: field = BHP256::hash_to_field(args);
    let admin_op: admin_operation = admin_operation {
      arg: arg,
      op_type: UPDATE_ADMIN_OPERATION,
      request_id: request_id
    };
    let op_hash: field = BHP256::hash_to_field(admin_op);
    let is_verified_1: bool = sig_1.verify(admin_1, op_hash);
    let is_verified_2: bool = sig_2.verify(admin_2, op_hash);
    let is_verified_3: bool = sig_3.verify(admin_3, op_hash);
    assert(is_verified_1 && is_verified_2 && is_verified_3);

    // Ensure the admin addresses are not the same
    assert_neq(admin_1, admin_2);
    assert_neq(admin_1, admin_3);
    assert_neq(admin_2, admin_3);

    return finalize_update_admin(old_admin, new_admin, admin_1, admin_2, admin_3, admin_op);
  }

  async function finalize_update_admin(
    public old_admin: address,
    public new_admin: address,
    public admin_1: address,
    public admin_2: address,
    public admin_3: address,
    public admin_op: admin_operation
  ) {
    /* Start Verify Admin Operation */

    // Ensure the admin addresses are each admins
    let is_admin_1: bool = admins.get(admin_1);
    let is_admin_2: bool = admins.get(admin_2);
    let is_admin_3: bool = admins.get(admin_3);
    assert(is_admin_1 && is_admin_2 && is_admin_3);

    // Ensure the request hasn't been made before
    let request_exists: bool = admin_operations.contains(admin_op.request_id);
    assert_eq(request_exists, false);

    // Set the admin operation
    admin_operations.set(admin_op.request_id, admin_op);

    /* End Verify Admin Operation */

    // Remove the old admin
    admins.remove(old_admin);

    // Set the new admin
    admins.set(new_admin, true);
  }

  async transition create_grant(
    public id: u64,
    public credits_amount: u64,
    public paleo_amount: u64,
    public recipient_rewards_key: address,
    public recipient_principal_key: address,
    public start_timestamp: u64,
    public cliff_timestamp: u64,
    public fully_vested_timestamp: u64
  ) -> Future {
    // Deposit the credits into the pondo core protocol
    let f0: Future = pondo_core_protocol.aleo/deposit_public_as_signer(credits_amount, paleo_amount, self.address);
    // Transfer the pAleo to the grant disbursement program
    let f1: Future = multi_token_support_program.aleo/transfer_public_as_signer(PALEO_TOKEN_ID, self.address, paleo_amount as u128);

    assert(start_timestamp > cliff_timestamp);
    assert(fully_vested_timestamp > cliff_timestamp);

    return finalize_create_grant(
      f0,
      f1,
      id,
      credits_amount,
      paleo_amount,
      recipient_rewards_key,
      recipient_principal_key,
      start_timestamp,
      cliff_timestamp,
      fully_vested_timestamp
      );
  }

  async function finalize_create_grant(
    f0: Future,
    f1: Future,
    id: u64,
    credits_amount: u64,
    paleo_amount: u64,
    recipient_rewards_key: address,
    recipient_principal_key: address,
    start_timestamp: u64,
    cliff_timestamp: u64,
    fully_vested_timestamp: u64
  ) {
    f0.await();
    f1.await();

    let grant: Grant = Grant {
      credits_amount: credits_amount,
      paleo_amount: paleo_amount,
      recipient_rewards_key: recipient_rewards_key,
      recipient_principal_key: recipient_principal_key,
      start_timestamp: start_timestamp,
      cliff_timestamp: cliff_timestamp,
      fully_vested_timestamp: fully_vested_timestamp
    };

    // Get the current timestamp
    let current_timestamp: u64 = timestamp.get(0u8);

    // Ensure the cliff timestamp is in the future
    assert(current_timestamp < grant.start_timestamp);

    // Ensure the mapping doesn't already contain the id
    assert(!grants.contains(id));

    // Add the grant to the mapping
    grants.set(id, grant);
  }

  async transition withdraw_rewards(
    id: u64,
    paleo_amount: u64
  ) -> Future {
    // Transfer the pAleo to the recipient_rewards_key
    let f0: Future = multi_token_support_program.aleo/transfer_public(PALEO_TOKEN_ID, self.caller, paleo_amount as u128);

    return finalize_withdraw_rewards(f0, id, paleo_amount, self.caller);
  }

  async function finalize_withdraw_rewards(
    f0: Future,
    id: u64,
    paleo_amount: u64,
    caller: address
  ) {
    f0.await();

    // Get the grant
    let grant: Grant = grants.get(id);

    // Ensure the caller is the recipient_rewards_key
    assert_eq(caller, grant.recipient_rewards_key);

    // Get the current timestamp
    let current_timestamp: u64 = timestamp.get(0u8);

    // Assert that the grant is before the cliff
    assert(current_timestamp < grant.cliff_timestamp);
    assert(current_timestamp >= grant.start_timestamp);

    // Subtract the amount from the grant
    let remaining_paleo: u64 = grant.paleo_amount - paleo_amount;

    // Assert Pondo not in rebalancing state
    let current_state: u8 = pondo_core_protocol.aleo/protocol_state.get(PROTOCOL_STATE_KEY);
    assert(current_state != REBALANCING_STATE);

    // Ensure the number of credits in the principal remains above the initial deposit
    // Note: the paleo pool and the credits pool are always an underestimate (assuming no slashing) as it does not include rewards & owed commissions
    // We use this underestimate because it as significantly reduces gas costs and should be close to the actual amount
    // As it is an underestimate, the downside is it will slightly reduce the amount of paleo that can be withdrawn
    let minted_paleo: u128 = multi_token_support_program.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply;
    let paleo_commission: u64 = pondo_core_protocol.aleo/owed_commission.get(0u8);
    let total_paleo_pool: u128 = minted_paleo + paleo_commission as u128;
    let delegated_credits: u64 = pondo_core_protocol.aleo/balances.get(DELEGATED_BALANCE);
    let core_protocol_account: u64 = credits.aleo/account.get_or_use(self.address, 0u64);
    let reserved_for_withdrawal: u64 = pondo_core_protocol.aleo/balances.get(CLAIMABLE_WITHDRAWALS);
    let total_credits_pool: u64 = delegated_credits + core_protocol_account - reserved_for_withdrawal;

    let grantee_credits_balance: u128 = total_credits_pool as u128 * remaining_paleo as u128 / total_paleo_pool;
    assert(grantee_credits_balance >= grant.credits_amount as u128);

    // Update the grant
    let updated_grant: Grant = Grant {
      credits_amount: grant.credits_amount,
      paleo_amount: remaining_paleo,
      recipient_rewards_key: grant.recipient_rewards_key,
      recipient_principal_key: grant.recipient_principal_key,
      start_timestamp: grant.start_timestamp,
      cliff_timestamp: grant.cliff_timestamp,
      fully_vested_timestamp: grant.fully_vested_timestamp
    };
    grants.set(id, updated_grant);
  }

  async transition withdraw_principal(
    id: u64,
    paleo_amount: u64
  ) -> Future {
    // Transfer the pAleo to the recipient_rewards_key
    let f0: Future = multi_token_support_program.aleo/transfer_public(PALEO_TOKEN_ID, self.caller, paleo_amount as u128);

    return finalize_withdraw_principal(f0, id, paleo_amount, self.caller);
  }

  async function finalize_withdraw_principal(
    f0: Future,
    id: u64,
    paleo_amount: u64,
    caller: address
  ) {
    f0.await();

    // Get the grant
    let grant: Grant = grants.get(id);

    // Ensure the caller is the recipient_rewards_key
    assert_eq(caller, grant.recipient_principal_key);

    // Get the current timestamp
    let current_timestamp: u64 = timestamp.get(0u8);

    // Assert that the grant is before the cliff
    assert(current_timestamp >= grant.cliff_timestamp);

    // Subtract the amount from the grant
    let remaining_paleo: u64 = grant.paleo_amount - paleo_amount;

    // Assert Pondo not in rebalancing state
    let current_state: u8 = pondo_core_protocol.aleo/protocol_state.get(PROTOCOL_STATE_KEY);
    assert(current_state != REBALANCING_STATE);

    // Ensure the number of credits in the principal remains above the initial deposit
    // Note: the paleo pool and the credits pool are always an underestimate (assuming no slashing) as it does not include rewards & owed commissions
    // We use this underestimate because it as significantly reduces gas costs and should be close to the actual amount
    // As it is an underestimate, the downside is it will slightly reduce the amount of paleo that can be withdrawn
    let minted_paleo: u128 = multi_token_support_program.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply;
    let paleo_commission: u64 = pondo_core_protocol.aleo/owed_commission.get(0u8);
    let total_paleo_pool: u128 = minted_paleo + paleo_commission as u128;
    let delegated_credits: u64 = pondo_core_protocol.aleo/balances.get(DELEGATED_BALANCE);
    let core_protocol_account: u64 = credits.aleo/account.get_or_use(self.address, 0u64);
    let reserved_for_withdrawal: u64 = pondo_core_protocol.aleo/balances.get(CLAIMABLE_WITHDRAWALS);
    let total_credits_pool: u64 = delegated_credits + core_protocol_account - reserved_for_withdrawal;

    let grantee_credits_balance: u128 = total_credits_pool as u128 * remaining_paleo as u128 / total_paleo_pool;

    // Calculate the vested credits
    let timestamps_since_start: u64 = current_timestamp - grant.start_timestamp;
    let total_vesting_timestamps: u64 = grant.fully_vested_timestamp - grant.start_timestamp;
    let vested_credits: u128 = grant.credits_amount as u128 * timestamps_since_start as u128 / total_vesting_timestamps as u128;
    let bounded_vested_credits: u128 = vested_credits < grant.credits_amount as u128 ? vested_credits : grant.credits_amount as u128;
    let minimum_credits_balance: u128 = grant.credits_amount as u128 - bounded_vested_credits;
    assert(grantee_credits_balance >= minimum_credits_balance as u128);

    // Update the grant
    let updated_grant: Grant = Grant {
      credits_amount: grant.credits_amount,
      paleo_amount: remaining_paleo,
      recipient_rewards_key: grant.recipient_rewards_key,
      recipient_principal_key: grant.recipient_principal_key,
      start_timestamp: grant.start_timestamp,
      cliff_timestamp: grant.cliff_timestamp,
      fully_vested_timestamp: grant.fully_vested_timestamp
    };
    grants.set(id, updated_grant);
  }

  // Copied from pondo_token.aleo
  const PALEO_TOKEN_ID: field = 1751493913335802797273486270793650302076377624243810059080883537084141842600field;
  // Copied from pondo_core_protocol.aleo
  const PROTOCOL_STATE_KEY: u8 = 0u8;
  const REBALANCING_STATE: u8 = 1u8;
  const DELEGATED_BALANCE: u8 = 0u8;
  const CLAIMABLE_WITHDRAWALS: u8 = 2u8;

  // shadowed from multi_token_support_program.aleo
  struct TokenMetadata {
    token_id: field,
    name: u128,
    symbol: u128,
    decimals: u8,
    supply: u128,
    max_supply: u128,
    admin: address,
    external_authorization_required: bool,
    external_authorization_party: address
  }

  // shadowed from multi_token_support_program.aleo
  struct TokenOwner {
    account: address,
    token_id: field
  }

  // shadowed from multi_token_support_program.aleo
  struct Balance {
    token_id: field,
    account: address,
    balance: u128,
    authorized_until: u32
  }

  // copied from credits.aleo, as structs are not importable
  struct bond_state {
    validator: address,
    microcredits: u64
  }

  // copied from credits.aleo, as structs are not importable
  struct unbond_state {
    microcredits: u64,
    height: u32
  }
}
