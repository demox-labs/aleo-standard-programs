import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const NETWORK = process.env.NETWORK;

export const RPC_URL = process.env.RPC_URL;
export const CLIENT_URL = process.env.CLIENT_URL;

// If no private key or network is provided, throw an error
if (!PRIVATE_KEY) {
  throw new Error("No private key provided");
}
if (!NETWORK) {
  throw new Error("No network provided");
}
if (!RPC_URL) {
  throw new Error("No RPC URL provided");
}

export const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
export const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS;
export const DEFAULT_VALIDATOR_ADDRESS = process.env.DEFAULT_VALIDATOR_ADDRESS;

export const EPOCH_BLOCKS_DEFAULT = 120_960;
export const EPOCH_BLOCKS = process.env.EPOCH_BLOCKS ? parseInt(process.env.EPOCH_BLOCKS) : EPOCH_BLOCKS_DEFAULT;
export const ORACLE_UPDATE_BLOCKS_DEFAULT = 103_680;
export const ORACLE_UPDATE_BLOCKS = process.env.ORACLE_UPDATE_BLOCKS ? parseInt(process.env.ORACLE_UPDATE_BLOCKS) : ORACLE_UPDATE_BLOCKS_DEFAULT;
export const REBALANCE_BLOCKS_DEFAULT = 17_280;
export const REBALANCE_BLOCKS = process.env.REBALANCE_BLOCKS ? parseInt(process.env.REBALANCE_BLOCKS) : REBALANCE_BLOCKS_DEFAULT;

// Non .env constants
export const CREDITS_PROGRAM = 'credits.aleo';
export const ZERO_ADDRESS = `aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc`;
export const MIN_DELEGATION = BigInt(10_000_000_000); // 10k credits