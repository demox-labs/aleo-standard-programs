## Pondo State Machine "Happy Path"

### Initialize

_What happens in the core protocol?_

We call `initialize` which does the following:

1. Transfers the given `transfer_amount` to the core protocol
2. Registers the pALEO and PNDO tokens in the MTSP
3. Mints the caller pALEO for their deposit
4. Initializes the Pondo delegator contracts
5. Sets the initial validator set in preparation for a "rebalance"

_What happens with delegators?_

They're initialized to the `TERMINAL` state

### Normal State (0u8)

The protocol spends the vast majority of an epoch in this state

_What happens in the core protocol?_

If we are within the `REBALANCE_PERIOD` we attempt to rebalance (see: Prep Rebalance State)

Anyone may call `distribute_deposits` if there are enough credits to distribute

Users may call `deposit_public_as_signer`, `deposit_public`, `instant_withdraw_public`, `withdraw_public` and `claim_withdraw_public` ("user functions" hereafter)

_What happens with delegators?_
They are in the `BOND_ALLOWED` or `UNBOND_NOT_ALLOWED` state

- If in the `BOND_ALLOWED` state, the bot will call `bond` on each of them

### Prep Rebalance State (1u8)

`prep_rebalance` is only allowed to begin within the `REBALANCE_PERIOD` (the first day of an epoch by default), but once it is prepped, the protocol can progress through the rest of a rebalance

_What happens in the core protocol?_

1. We call `prep_rebalance` on each delegator so they can begin to unbond
2. The next validator set is decided based on the Oracle data
3. Once all delegators are done unbonding, `rebalance_retrieve_credits` is called

Users may still call all user functions

_What happens with delegators?_

They are all moved from `UNBOND_NOT_ALLOWED` to `UNBOND_ALLOWED` and the bot will progress each to `TERMINAL` by:

1. Calling `unbond` on each
2. Waiting until unbonding is complete and call `claim_unbond_public` directly in `credits.aleo`
3. And finally calling `terminal_state` on each

### Rebalancing State (2u8)

The protocol should spend very little time in this state, <=1 block ideally

_What happens in the core protocol?_

`rebalance_retrieve_credits` is called which:

1. Returns all credits from the delegators to the core protocol
2. Mints any `owed_commission` to the PNDO pool address
3. Completes the withdrawal batch by updated `reserved_for_withdrawals` and `bonded_withdrawals`

Users may call all user functions **except instant_withdraw_public**

Later, `rebalance_redistribute` is called which:

1. Transfers each delegator the appropriate portion of credits (while maintaining the liquidity pool)
2. Calls `set_validator` on each with the new validator and commission information
3. Confirms the validator state matches the next set and updates the current set
4. Moves the protocol back to `NORMAL_STATE`

_What happens with delegators?_
The bot calls `transfer_to_core_protocol` on each and they are in the `TERMINAL` state until `rebalance_redistribute` is called. After that, they are moved to `BOND_ALLOWED` and the cycle restarts.
