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
    bond: "388200",
    unbond: "780078",
    terminal_state: "69096",
  },
  "pondo_delegator2v1.aleo": {
    bond: "388200",
    unbond: "780078",
    terminal_state: "69096",
  },
  "pondo_delegator3v1.aleo": {
    bond: "388200",
    unbond: "780078",
    terminal_state: "69096",
  },
  "pondo_delegator4v1.aleo": {
    bond: "388200",
    unbond: "780078",
    terminal_state: "69096",
  },
  "pondo_delegator5v1.aleo": {},
  "pondo_core_protocolv1.aleo": {
    initialize: "1032812",
    prep_rebalance: "529697",
    deposit_public_as_signer: "669023",
    distribute_deposits: "594708",
    withdraw_public: "738315",
    rebalance_retrieve_credits: "1466846",
    rebalance_redistribute: "1103486",
    set_oracle_tvl: "204334",
  },
  "reference_delegatorgizgkl.aleo": { initialize: "543166" },
};