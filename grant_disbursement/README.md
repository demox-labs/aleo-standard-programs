## Overview

The grant disbursement program is a program give a grant to a grantee with following parameters:

`credits_amount`: The amount of credits 
`paleo_amount`: The amount of pAleo (a liquid staking token)
`recipient_rewards_key`: The key of the recipient used to withdraw rewards before the cliff
`recipient_principal_key`: The key of the recipient used to withdraw the grant principal after the cliff,
`start_block`: Automatically calculated when the grant is created,
`cliff_block`: The block height at which the principal becomes available to withdraw.
`fully_vested_block`: The block height at which all of the principal is available to withdraw.

Each grant is represented in credits that are then deposited in Pondo and saved as pAleo, a liquid staking protocol.
As the liquid staking token accurues rewards, the pAleo amount will represent more credits than the initial credits amount.

A grantee using their `recipient_rewards_key` can withdraw these rewards (without dipping into the credits principal) until the `cliff_block`

After the `cliff_block`, the grantee can use their `recipient_principal_key` to start withdrawing their principal.
The amount of vested credits is `= (current_block_height - start_block) / (fully_vested_block - start_block)`

## Available methods

### initialize

Used to create all of the grants. All grants must be hard coded into the initialize method so they can be funded by a simple credits.aleo/transfer_public

The `paleo_amount` is set to 0 initially.
```
async transition create_grant(
    public id: u64,
    public credits_amount: u64,
    public paleo_amount: u128,
    public recipient_rewards_key: address,
    public recipient_principal_key: address,
    public cliff_block: u32,
    public fully_vested_block: u32
  ) -> Future
```

### process_grant

The actual funder for the grant is expected to transfer credits (using credits.aleo transfer_public or transfer_public_as_signer) directly to the program address.

Once the credits are transferred to the program. Anyone can call `process_grant` to deposit the credits into pAleo.
By default, the pondo deposit is constrained to be within 99.99% of the ideal pAleo minted given a certain credits balance.

Calling `process_grant` deposits the credits into the Pondo Protocol, mints the near ideal pAleo and then transfers the pAleo to this program, later to be distributed.

```
async transition process_grant(
    grant_id: u8,
    credits_amount: u64,
    paleo_amount: u128,
  ) -> Future
```

### withdraw_rewards

Used by the grantee with the `recipient_rewards_key` to claim `pAleo` without touching the principal before the `cliff_block`

```
async transition withdraw_rewards(
    id: u8,
    paleo_amount: u128
  ) -> Future
```

### withdraw_principal

Used by the grantee with the `recipient_principal_key` to claim `pAleo` vested principal after the `cliff_block` and becomes fully claimable after the `fully_vested_block`

```
async transition withdraw_principal(
    id: u8,
    paleo_amount: u128
  ) -> Future 
```