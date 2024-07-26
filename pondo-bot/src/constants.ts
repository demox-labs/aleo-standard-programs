import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const NETWORK = process.env.NETWORK;

export const RPC_URL = process.env.RPC_URL;
export const CLIENT_URL = process.env.CLIENT_URL;

export const TEST = process.env.TEST;

// If no private key or network is provided, throw an error
if (!PRIVATE_KEY) {
  throw new Error('No private key provided');
}
if (!NETWORK) {
  throw new Error('No network provided');
}
if (!RPC_URL) {
  throw new Error('No RPC URL provided');
}

export const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
export const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS;
export const DEFAULT_VALIDATOR_ADDRESS = process.env.DEFAULT_VALIDATOR_ADDRESS;

export const EPOCH_BLOCKS_DEFAULT = 120_960;
export const EPOCH_BLOCKS = process.env.EPOCH_BLOCKS
  ? parseInt(process.env.EPOCH_BLOCKS)
  : EPOCH_BLOCKS_DEFAULT;
export const ORACLE_UPDATE_BLOCKS_DEFAULT = 103_680;
export const ORACLE_UPDATE_BLOCKS = process.env.ORACLE_UPDATE_BLOCKS
  ? parseInt(process.env.ORACLE_UPDATE_BLOCKS)
  : ORACLE_UPDATE_BLOCKS_DEFAULT;
export const REBALANCE_BLOCKS_DEFAULT = 17_280;
export const REBALANCE_BLOCKS = process.env.REBALANCE_BLOCKS
  ? parseInt(process.env.REBALANCE_BLOCKS)
  : REBALANCE_BLOCKS_DEFAULT;

export const PONDO_COMMISSION_DEFAULT = BigInt(1_000);
export const PONDO_COMMISSION = process.env.PONDO_COMMISSION
  ? BigInt(process.env.PONDO_COMMISSION)
  : PONDO_COMMISSION_DEFAULT;
export const PONDO_WITHDRAW_FEE_DEFAULT = BigInt(25);
export const PONDO_WITHDRAW_FEE = process.env.PONDO_WITHDRAW_FEE
  ? BigInt(process.env.PONDO_WITHDRAW_FEE)
  : PONDO_WITHDRAW_FEE_DEFAULT;
export const PALEO_TOKEN_ID_DEFAULT =
  '1751493913335802797273486270793650302076377624243810059080883537084141842600field';
export const PALEO_TOKEN_ID = process.env.PALEO_TOKEN_ID
  ? process.env.PALEO_TOKEN_ID
  : PALEO_TOKEN_ID_DEFAULT;
export const PONDO_TOKEN_ID_DEFAULT =
  '1751493913335802797273486270793650302076377624243810059080883537084141842601field';
export const PONDO_TOKEN_ID = process.env.PONDO_TOKEN_ID
  ? process.env.PONDO_TOKEN_ID
  : PONDO_TOKEN_ID_DEFAULT;

// Non .env constants
export const CREDITS_PROGRAM = 'credits.aleo';
export const ZERO_ADDRESS = `aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc`;
export const MIN_DELEGATION = BigInt(10_000_000_000); // 10k credits
export const PRECISION_UNSIGNED = BigInt(10_000);
