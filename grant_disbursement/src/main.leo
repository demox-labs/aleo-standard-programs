import credits.aleo;
import token_registry.aleo;
import pondo_protocol.aleo;
import time_oracle.aleo;

// The 'grant_disbursement' program.
program grant_disbursement.aleo {
  const GRANTEE_REWARDS_KEY: address = aleo12shtwnmf49t5atmad2jnk3e58ahtp749d9trctt9z3wryxyzt5pspp0nd0;
  const GRANTEE_PRINCIPAL_KEY: address = aleo1z9y9afh0h6dnyj3f0hvjc4mhayjy06fj42ppcq0rvpmmyky6fuzs449sjr;
  const CREDITS_AMOUNT: u64 = 1_000_000_000u64;
  const START_TIMESTAMP: u64 = 0u64;
  const CLIFF_TIMESTAMP: u64 = 1_000_000_000u64;
  const FULLY_VESTED_TIMESTAMP: u64 = 2_000_000_000u64;

  const PALEO_TOLERANCE: u128 = 999u128;
  const PALEO_PRECISION: u128 = 1_000u128;

  struct Grant {
    credits_amount: u64, // The amount of Aleo credits to be distributed
    paleo_amount: u128, // The amount of paleo to be distributed
    recipient_rewards_key: address, // The address that can withdraw the rewards
    recipient_principal_key: address, // The address that can withdraw the principal
    start_timestamp: u64, // The timestamp at which the grant was created
    cliff_timestamp: u64, // The timestamp at which the recipient can start withdrawing principal
    fully_vested_timestamp: u64 // The timestamp at which the recipient can withdraw the full principal
  }

  mapping grants: u8 => Grant;

  async transition initialize() -> Future {
    return finalize_initialize();
  }

  async function finalize_initialize() {
    // Ensure the protocol is not already initialized
    let already_initialized: bool = grants.contains(0u8);
    assert(!already_initialized);

    // Create the initial grant
    let initial_grant: Grant = Grant {
      credits_amount: CREDITS_AMOUNT,
      paleo_amount: 0u128,
      recipient_rewards_key: GRANTEE_REWARDS_KEY,
      recipient_principal_key: GRANTEE_PRINCIPAL_KEY,
      start_timestamp: START_TIMESTAMP,
      cliff_timestamp: CLIFF_TIMESTAMP,
      fully_vested_timestamp: FULLY_VESTED_TIMESTAMP
    };

    // Add the grant to the mapping
    grants.set(0u8, initial_grant);
  }

  async transition process_grant(
    grant_id: u8,
    credits_amount: u64,
    paleo_amount: u128,
  ) -> Future {
    // Transfer the credits to signer temporarily to deposit into the pondo core protocol
    let f0: Future = credits.aleo/transfer_public(self.signer, credits_amount);
    // Deposit the credits into the pondo core protocol
    let f1: Future = pondo_protocol.aleo/deposit_public_as_signer(credits_amount, paleo_amount as u64, self.address);
    // Transfer the pAleo to the grant disbursement program
    let f2: Future = token_registry.aleo/transfer_public_as_signer(PALEO_TOKEN_ID, self.address, paleo_amount);

    return finalize_process_grant(f0, f1, f2, grant_id, credits_amount, paleo_amount);
  }

  async function finalize_process_grant(
    f0: Future,
    f1: Future,
    f2: Future,
    grant_id: u8,
    credits_amount: u64,
    paleo_amount: u128
  ) {
    f0.await();
    f1.await();
    f2.await();

    /* START Verify deposit as sufficient */

    // Calculate the total pAleo
    let minted_paleo: u128 = token_registry.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply;
    let paleo_commission: u64 = pondo_protocol.aleo/owed_commission.get(0u8);
    let total_paleo_pool: u128 = minted_paleo + paleo_commission as u128 - paleo_amount;

    // Calculate the total credits
    let delegated_credits: u64 = pondo_protocol.aleo/balances.get(DELEGATED_BALANCE);
    let core_protocol_account: u64 = credits.aleo/account.get_or_use(pondo_protocol.aleo, 0u64);
    let reserved_for_withdrawal: u64 = pondo_protocol.aleo/balances.get(CLAIMABLE_WITHDRAWALS);
    let total_credits_pool: u64 = delegated_credits + core_protocol_account - reserved_for_withdrawal - credits_amount;

    // Calculate the amount of pAleo that should be minted
    let ideal_paleo_to_mint: u128 = ((credits_amount as u128) * total_paleo_pool) / (total_credits_pool as u128);
    let min_paleo_to_mint: u128 = ideal_paleo_to_mint * PALEO_TOLERANCE / PALEO_PRECISION;

    // Ensure the amount of pAleo minted is within the tolerance
    assert(paleo_amount >= min_paleo_to_mint);

    /* END Verify deposit as sufficient */

    // Get the grant
    let grant: Grant = grants.get(grant_id);

    // Assert the credits amount is the same
    assert_eq(credits_amount, grant.credits_amount);

    // Update the grant, with the new paleo amount
    let updated_grant: Grant = Grant {
      credits_amount: grant.credits_amount,
      paleo_amount: paleo_amount,
      recipient_rewards_key: grant.recipient_rewards_key,
      recipient_principal_key: grant.recipient_principal_key,
      start_timestamp: grant.start_timestamp,
      cliff_timestamp: grant.cliff_timestamp,
      fully_vested_timestamp: grant.fully_vested_timestamp
    };
    grants.set(grant_id, updated_grant);
  }

  async transition withdraw_rewards(
    id: u8,
    paleo_amount: u128
  ) -> Future {
    // Transfer the pAleo to the recipient_rewards_key
    let f0: Future = token_registry.aleo/transfer_public(PALEO_TOKEN_ID, self.caller, paleo_amount);

    return finalize_withdraw_rewards(f0, id, paleo_amount, self.caller);
  }

  async function finalize_withdraw_rewards(
    f0: Future,
    id: u8,
    paleo_amount: u128,
    caller: address
  ) {
    f0.await();

    // Get the grant
    let grant: Grant = grants.get(id);

    // Ensure the caller is the recipient_rewards_key
    assert_eq(caller, grant.recipient_rewards_key);

    // Get the current timestamp
    let current_timestamp: u64 = time_oracle.aleo/timestamp.get(0u8);

    // Assert that the grant is before the cliff
    assert(current_timestamp < grant.cliff_timestamp);

    // Subtract the amount from the grant
    let remaining_paleo: u128 = grant.paleo_amount - paleo_amount;

    // Assert Pondo not in rebalancing state
    let current_state: u8 = pondo_protocol.aleo/protocol_state.get(PROTOCOL_STATE_KEY);
    assert(current_state != REBALANCING_STATE);

    // Ensure the number of credits in the principal remains above the initial deposit
    // Note: the paleo pool and the credits pool are always an underestimate (assuming no slashing) as it does not include rewards & owed commissions
    // We use this underestimate because it as significantly reduces gas costs and should be close to the actual amount
    // As it is an underestimate, the downside is it will slightly reduce the amount of paleo that can be withdrawn
    let minted_paleo: u128 = token_registry.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply;
    let paleo_commission: u64 = pondo_protocol.aleo/owed_commission.get(0u8);
    let total_paleo_pool: u128 = minted_paleo + paleo_commission as u128;
    let delegated_credits: u64 = pondo_protocol.aleo/balances.get(DELEGATED_BALANCE);
    let core_protocol_account: u64 = credits.aleo/account.get_or_use(pondo_protocol.aleo, 0u64);
    let reserved_for_withdrawal: u64 = pondo_protocol.aleo/balances.get(CLAIMABLE_WITHDRAWALS);
    let total_credits_pool: u64 = delegated_credits + core_protocol_account - reserved_for_withdrawal;

    let grantee_credits_balance: u128 = total_credits_pool as u128 * remaining_paleo / total_paleo_pool;
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
    id: u8,
    paleo_amount: u128
  ) -> Future {
    // Transfer the pAleo to the recipient_rewards_key
    let f0: Future = token_registry.aleo/transfer_public(PALEO_TOKEN_ID, self.caller, paleo_amount);

    return finalize_withdraw_principal(f0, id, paleo_amount, self.caller);
  }

  async function finalize_withdraw_principal(
    f0: Future,
    id: u8,
    paleo_amount: u128,
    caller: address
  ) {
    f0.await();

    // Get the grant
    let grant: Grant = grants.get(id);

    // Ensure the caller is the recipient_rewards_key
    assert_eq(caller, grant.recipient_principal_key);

    // Get the current timestamp
    let current_timestamp: u64 = time_oracle.aleo/timestamp.get(0u8);

    // Assert that the grant is before the cliff
    assert(current_timestamp >= grant.cliff_timestamp);

    // Subtract the amount from the grant
    let remaining_paleo: u128 = grant.paleo_amount - paleo_amount;

    // Assert Pondo not in rebalancing state
    let current_state: u8 = pondo_protocol.aleo/protocol_state.get(PROTOCOL_STATE_KEY);
    assert(current_state != REBALANCING_STATE);

    // Ensure the number of credits in the principal remains above the initial deposit
    // Note: the paleo pool and the credits pool are always an underestimate (assuming no slashing) as it does not include rewards & owed commissions
    // We use this underestimate because it as significantly reduces gas costs and should be close to the actual amount
    // As it is an underestimate, the downside is it will slightly reduce the amount of paleo that can be withdrawn
    let minted_paleo: u128 = token_registry.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply;
    let paleo_commission: u64 = pondo_protocol.aleo/owed_commission.get(0u8);
    let total_paleo_pool: u128 = minted_paleo + paleo_commission as u128;
    let delegated_credits: u64 = pondo_protocol.aleo/balances.get(DELEGATED_BALANCE);
    let core_protocol_account: u64 = credits.aleo/account.get_or_use(pondo_protocol.aleo, 0u64);
    let reserved_for_withdrawal: u64 = pondo_protocol.aleo/balances.get(CLAIMABLE_WITHDRAWALS);
    let total_credits_pool: u64 = delegated_credits + core_protocol_account - reserved_for_withdrawal;

    let grantee_credits_balance: u128 = total_credits_pool as u128 * remaining_paleo / total_paleo_pool;

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

  // Copied from pondo_protocol_token.aleo
  const PALEO_TOKEN_ID: field = 1751493913335802797273486270793650302076377624243810059080883537084141842600field;
  // Copied from pondo_protocol.aleo
  const PROTOCOL_STATE_KEY: u8 = 0u8;
  const REBALANCING_STATE: u8 = 2u8;
  const DELEGATED_BALANCE: u8 = 0u8;
  const CLAIMABLE_WITHDRAWALS: u8 = 2u8;

  // shadowed from token_registry.aleo
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

  // shadowed from token_registry.aleo
  struct TokenOwner {
    account: address,
    token_id: field
  }

  // shadowed from token_registry.aleo
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
