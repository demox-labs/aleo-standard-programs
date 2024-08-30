/**
 * This file was automatically generated using the `yarn estimateFees` command.
 */

type FeeActions = Record<string, string>;

type CalculatedFees = {
  [program: string]: FeeActions;
};

export const calculatedFees: CalculatedFees = {
  "multi_token_support_programv1.aleo": { initialize: "48650" },
  "mtsp_creditsv1.aleo": {},
  "pondo_oraclev1.aleo": {
    initialize: "238840",
    add_delegator: "169508",
    update_data: "1222149",
  },
  "pondo_staked_aleo_tokenv1.aleo": {},
  "pondo_tokenv1.aleo": {},
  "pondo_delegator1v1.aleo": {
    bond: "217640", // Manually set to lower value
    unbond: "426138", // Manually set to lower value
    terminal_state: "69096",
  },
  "pondo_delegator2v1.aleo": {
    bond: "217640", // Manually set to lower value
    unbond: "426138", // Manually set to lower value
    terminal_state: "69096",
  },
  "pondo_delegator3v1.aleo": {
    bond: "217640", // Manually set to lower value
    unbond: "426138", // Manually set to lower value
    terminal_state: "69096",
  },
  "pondo_delegator4v1.aleo": {
    bond: "217640", // Manually set to lower value
    unbond: "426138", // Manually set to lower value
    terminal_state: "69096",
  },
  "pondo_delegator5v1.aleo": {},
  "pondo_core_protocolv1.aleo": {
    initialize: "1032812",
    prep_rebalance: "355766", // Manually set to lower value
    deposit_public_as_signer: "487534", // Manually set to lower value
    distribute_deposits: "346768", // Manually set to lower value
    instant_withdraw_public: "556319", // Manually set to lower value
    withdraw_public: "532935", // Manually set to lower value
    claim_withdrawal_public: "126015", // Manually set to lower value
    rebalance_retrieve_credits: "732545", // Manually set to lower value
    rebalance_redistribute: "677000", // Manually set to lower value
    set_oracle_tvl: "293434",
  },
  "reference_delegatorgizgkl.aleo": { initialize: "543166" },
};