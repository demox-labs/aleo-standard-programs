import credits.aleo;
import multi_token_support_program.aleo;
import pondo_core_protocol.aleo;

// The 'grant_disbursement' program.
program grant_disbursement.aleo {
  struct Grant {
    credits_amount: u64, // The amount of paleo to be distributed
    paleo_amount: u64, // The amount of paleo to be distributed
    recipient_rewards_key: address, // The address that can withdraw the rewards
    recipient_principal_key: address, // The address that can withdraw the principal
    start_block: u32, // The block at which the grant was created
    cliff_block: u32, // The block at which the recipient can start withdrawing principal
    fully_vested_block: u32 // The block at which the recipient can withdraw the full principal
  }

  mapping grants: u64 => Grant;

  async transition create_grant(
    public id: u64,
    public credits_amount: u64,
    public paleo_amount: u64,
    public recipient_rewards_key: address,
    public recipient_principal_key: address,
    public cliff_block: u32,
    public fully_vested_block: u32
  ) -> Future {
    // Deposit the credits into the pondo core protocol
    let f0: Future = pondo_core_protocol.aleo/deposit_public_as_signer(credits_amount, paleo_amount, self.address);
    // Transfer the pAleo to the grant disbursement program
    let f1: Future = multi_token_support_program.aleo/transfer_public_as_signer(PALEO_TOKEN_ID, self.address, paleo_amount as u128);

    assert(fully_vested_block > cliff_block);

    return finalize_create_grant(
      f0,
      f1,
      id,
      credits_amount,
      paleo_amount,
      recipient_rewards_key,
      recipient_principal_key,
      cliff_block,
      fully_vested_block
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
    cliff_block: u32,
    fully_vested_block: u32
  ) {
    f0.await();
    f1.await();

    let grant: Grant = Grant {
      credits_amount: credits_amount,
      paleo_amount: paleo_amount,
      recipient_rewards_key: recipient_rewards_key,
      recipient_principal_key: recipient_principal_key,
      start_block: block.height,
      cliff_block: cliff_block,
      fully_vested_block: fully_vested_block
    };

    // Ensure the cliff block is in the future
    assert(block.height < grant.cliff_block);

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

    // Assert that the grant is before the cliff
    assert(block.height < grant.cliff_block);

    // Subtract the amount from the grant
    let remaining_paleo: u64 = grant.paleo_amount - paleo_amount;

    // Assert Pondo not in rebalancing state
    let current_state: u8 = pondo_core_protocol.aleo/protocol_state.get(PROTOCOL_STATE_KEY);
    assert(current_state != REBALANCING_STATE);

    // Ensure the number of credits in the principal remains above the initial deposit
    // Note: the paleo pool and the credits pool are always an underestimate (assuming no slashing) as it does not include rewards & owed commissions
    // We use this underestimate because it as significantly reduces gas costs and should be close to the actual amount
    // As it is an underestimate, the downside is it will slightly reduce the amount of paleo that can be withdrawn
    let total_paleo_pool: u128 = multi_token_support_program.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply;
    let total_credits_pool: u64 = pondo_core_protocol.aleo/balances.get(DELEGATED_BALANCE);

    let grantee_credits_balance: u128 = total_credits_pool as u128 * remaining_paleo as u128 / total_paleo_pool;
    assert(grantee_credits_balance >= grant.credits_amount as u128);

    // Update the grant
    let updated_grant: Grant = Grant {
      credits_amount: grant.credits_amount,
      paleo_amount: remaining_paleo,
      recipient_rewards_key: grant.recipient_rewards_key,
      recipient_principal_key: grant.recipient_principal_key,
      start_block: grant.start_block,
      cliff_block: grant.cliff_block,
      fully_vested_block: grant.fully_vested_block
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

    // Assert that the grant is before the cliff
    assert(block.height >= grant.cliff_block);

    // Subtract the amount from the grant
    let remaining_paleo: u64 = grant.paleo_amount - paleo_amount;

    // Assert Pondo not in rebalancing state
    let current_state: u8 = pondo_core_protocol.aleo/protocol_state.get(PROTOCOL_STATE_KEY);
    assert(current_state != REBALANCING_STATE);

    // Ensure the number of credits in the principal remains above the initial deposit
    // Note: the paleo pool and the credits pool are always an underestimate (assuming no slashing) as it does not include rewards & owed commissions
    // We use this underestimate because it as significantly reduces gas costs and should be close to the actual amount
    // As it is an underestimate, the downside is it will slightly reduce the amount of paleo that can be withdrawn
    let total_paleo_pool: u128 = multi_token_support_program.aleo/registered_tokens.get(PALEO_TOKEN_ID).supply;
    let total_credits_pool: u64 = pondo_core_protocol.aleo/balances.get(DELEGATED_BALANCE);

    let grantee_credits_balance: u128 = total_credits_pool as u128 * remaining_paleo as u128 / total_paleo_pool;

    // Calculate the vested credits
    let blocks_since_start: u32 = block.height - grant.start_block;
    let total_vesting_blocks: u32 = grant.fully_vested_block - grant.start_block;
    let vested_credits: u128 = grant.credits_amount as u128 * blocks_since_start as u128 / total_vesting_blocks as u128;
    let bounded_vested_credits: u128 = vested_credits < grant.credits_amount as u128 ? vested_credits : grant.credits_amount as u128;
    let minimum_credits_balance: u128 = grant.credits_amount as u128 - bounded_vested_credits;
    assert(grantee_credits_balance >= minimum_credits_balance as u128);

    // Update the grant
    let updated_grant: Grant = Grant {
      credits_amount: grant.credits_amount,
      paleo_amount: remaining_paleo,
      recipient_rewards_key: grant.recipient_rewards_key,
      recipient_principal_key: grant.recipient_principal_key,
      start_block: grant.start_block,
      cliff_block: grant.cliff_block,
      fully_vested_block: grant.fully_vested_block
    };
    grants.set(id, updated_grant);
  }

  // Copied from pondo_token.aleo
  const PALEO_TOKEN_ID: field = 1751493913335802797273486270793650302076377624243810059080883537084141842600field;
  // Copied from pondo_core_protocol.aleo
  const PROTOCOL_STATE_KEY: u8 = 0u8;
  const REBALANCING_STATE: u8 = 1u8;
  const DELEGATED_BALANCE: u8 = 0u8;

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
