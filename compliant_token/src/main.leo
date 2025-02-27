import credits.aleo;
import token_registry.aleo;

// The 'compliant_token' program.
program compliant_token.aleo {
  // Constants defining the token parameters.
  const COMPLAINT_TOKEN_ID: field = 71619063553950105623552field; // Unique token identifier
  const ADMIN_ADDRESS: address = aleo10047h9c9efxz3d0u69xn7alclvsvt96ysuhts80p7h2eh57kh5zsjwsp8f; // Admin address with minting and issuing privileges
  const MAX_SUPPLY: u128 = 1_000_000_000_000_000u128; // Maximum supply of the token
  const BLOCKS_IN_A_DAY: u32 = 28_800u32; // Number of blocks per day for epoch-based calculations
  const MAX_SPEND_PER_DAY: u128 = 10_000_000_000u128; // Daily spending limit per user
  const MAX_U32: u32 = 4294967295u32; // Maximum value of a u32, used for transaction expiration

  // Record defining the spend limit for a user.
  record SpendLimit {
    owner: address,      // The owner of the spend limit
    amount_spent: u128,  // Amount spent in the current epoch
    epoch_spent: u32     // The epoch in which the last transaction occurred
  }

  // Mapping to track whether the token has been minted (prevents multiple minting).
  mapping has_minted: u8 => bool;
  
  // Mapping to track whether a user has an active spend limit.
  mapping has_spend_limit: field => bool;

  /**
   * Initializes the compliant token by registering it with the token registry.
   * Can only be called by the ADMIN_ADDRESS.
   */
  async transition initialize() -> Future {
    assert_eq(self.caller, ADMIN_ADDRESS);

    let name: u128 = 71619063553950105623552u128; // "compliant" encoded in ASCII
    let symbol: u128 = 71619063553950105623552u128; // "compliant" encoded in ASCII
    let decimals: u8 = 6u8; // Decimal places for the token
    let max_supply: u128 = 10_000_000_000_000_000u128; // Maximum supply
    let external_authorization_required: bool = true; // Requires external authorization
    let external_authorization_party: address = self.address; // Authorization controlled by this contract

    // Register the token in the token registry
    let f0: Future = token_registry.aleo/register_token(
      COMPLAINT_TOKEN_ID,
      name,
      symbol,
      decimals,
      max_supply,
      external_authorization_required,
      external_authorization_party
    );

    return finalize_register_token(f0);
  }

  /**
   * Awaits the completion of the token registration process.
   */
  async function finalize_register_token(f0: Future) {
    f0.await();
  }

  /**
   * Mints the maximum supply of tokens to the ADMIN_ADDRESS.
   * Can only be called once by the ADMIN_ADDRESS.
   */
  async transition mint_private() -> (token_registry.aleo/Token, Future) {
    assert_eq(self.caller, ADMIN_ADDRESS);
    
    // Mint private tokens to the admin
    let mint_output: (token_registry.aleo/Token, Future) = token_registry.aleo/mint_private(
      COMPLAINT_TOKEN_ID,
      ADMIN_ADDRESS,
      MAX_SUPPLY,
      true,
      MAX_U32
    );

    return (mint_output.0, finalize_mint_private(mint_output.1));
  }

  /**
   * Finalizes the minting process and ensures that tokens are minted only once.
   */
  async function finalize_mint_private(f0: Future) {
    f0.await();

    let has_already_minted: bool = has_minted.contains(0u8);
    assert(!has_already_minted); // Ensure tokens are minted only once
    has_minted.set(0u8, true);
  }

  /**
   * Issues a new spend limit record for a specific user.
   * Can only be called by the ADMIN_ADDRESS.
   */
  transition issue_limit(
    owner: address
  ) -> SpendLimit {
    assert_eq(self.caller, ADMIN_ADDRESS);

    // Create a new spend limit record for the user
    return SpendLimit {
      owner: owner,
      amount_spent: 0u128,
      epoch_spent: 0u32
    };
  }

  /**
   * Transfers tokens privately while enforcing the user's spend limit.
   * Ensures that the user cannot exceed the daily spend limit.
   */
  async transition transfer_private(
    input_token: token_registry.aleo/Token, // The input token record to be spent
    spend_limit: SpendLimit, // The user's spend limit record
    amount: u128, // Amount to transfer
    recipient: address, // Recipient address
    public epoch: u32 // Current epoch
  ) -> (SpendLimit, token_registry.aleo/Token, token_registry.aleo/Token, token_registry.aleo/Token, Future) {
    
    // Determine the updated amount spent based on the epoch
    let updated_amount_spent: u128 = spend_limit.epoch_spent < epoch 
        ? amount // Reset the spend amount if in a new epoch
        : amount + spend_limit.amount_spent; // Otherwise, accumulate the spend amount
    
    // Ensure the updated spend amount does not exceed the daily limit
    assert(updated_amount_spent <= MAX_SPEND_PER_DAY);

    // Create the updated spend limit record
    let updated_spend_limit: SpendLimit = SpendLimit {
      owner: spend_limit.owner,
      amount_spent: updated_amount_spent,
      epoch_spent: epoch
    };

    // **Authorize the token record**: Converts it into an authorized state so it can be transferred.
    // This produces 3 outputs:
    // - An unauthorized token record with the remaining balance
    // - An authorized token record with the specified transfer amount
    // - A future that must be awaited
    let prehook_output: (token_registry.aleo/Token, token_registry.aleo/Token, Future) = token_registry.aleo/prehook_private(
      input_token,
      amount,
      MAX_U32
    );

    // **Transfer the authorized token** to the recipient.
    // This produces 3 outputs:
    // - A token record with the remaining balance (always 0)
    // - An unauthorized token with the transferred amount
    // - A future that must be awaited
    let transfer_output: (token_registry.aleo/Token, token_registry.aleo/Token, Future) = token_registry.aleo/transfer_private(
      recipient,
      amount,
      prehook_output.1
    );

    return (
      updated_spend_limit, // The updated spend limit record
      prehook_output.0,    // Remaining balance from authorization
      transfer_output.0,   // Remaining balance from transfer (should be 0)
      transfer_output.1,   // The token record sent to the recipient
      finalize_transfer_private(prehook_output.2, transfer_output.2, epoch) // Await the finalization process
    );
  }

  /**
   * Finalizes the transfer by awaiting the completion of both authorization and transfer transactions.
   */
  async function finalize_transfer_private(
    f0: Future, // Future from prehook_private
    f1: Future, // Future from transfer_private
    epoch: u32
  ) {
    f0.await();
    f1.await();

    let current_epoch: u32 = block.height % BLOCKS_IN_A_DAY;
    assert_eq(epoch, current_epoch);
  }
}
