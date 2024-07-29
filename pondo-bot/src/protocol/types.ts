export type EPOCH_PERIOD = 'rebalance' | 'earn' | 'updateOracle';

export type PONDO_DELEGATOR_STATE = '0u8' | '1u8' | '2u8' | '3u8' | '4u8';
export const PONDO_DELEGATOR_STATE_TO_VALUE = {
  '0u8': 'bond_allowed',
  '1u8': 'unbond_not_allowed',
  '2u8': 'unbond_allowed',
  '3u8': 'unbonding',
  '4u8': 'terminal',
};

export enum PONDO_PROTOCOL_STATE {
  NORMAL = '0u8',
  PREP_REBALANCE = '1u8',
  REBALANCING = '2u8',
}
