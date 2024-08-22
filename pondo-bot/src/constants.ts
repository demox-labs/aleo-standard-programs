import * as dotenv from 'dotenv';
import { pondoProgramToCode, pondoPrograms } from './compiledPrograms';

// Load environment variables
dotenv.config();

export const ADDRESS = process.env.ADDRESS;
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const NETWORK = process.env.NETWORK;

export const RPC_URL = process.env.RPC_URL;
export const CLIENT_URL = process.env.CLIENT_URL;

export const TEST = process.env.TEST;
export const TEST_USER0_PRIVATE_KEY = process.env.TEST_USER0_PRIVATE_KEY;
export const TEST_USER0_ADDRESS = process.env.TEST_USER0_ADDRESS;
export const TEST_USER1_PRIVATE_KEY = process.env.TEST_USER1_PRIVATE_KEY;
export const TEST_USER1_ADDRESS = process.env.TEST_USER1_ADDRESS;
export const TEST_USER2_PRIVATE_KEY = process.env.TEST_USER2_PRIVATE_KEY;
export const TEST_USER2_ADDRESS = process.env.TEST_USER2_ADDRESS;

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

// Oracle constants
export const MULTI_SIG_PRIVATE_KEY_0 = process.env.MULTI_SIG_PRIVATE_KEY_0;
export const MULTI_SIG_ADDRESS_0 = process.env.MULTI_SIG_ADDRESS_0;
export const MULTI_SIG_PRIVATE_KEY_1 = process.env.MULTI_SIG_PRIVATE_KEY_1;
export const MULTI_SIG_ADDRESS_1 = process.env.MULTI_SIG_ADDRESS_1;
export const MULTI_SIG_PRIVATE_KEY_2 = process.env.MULTI_SIG_PRIVATE_KEY_2;
export const MULTI_SIG_ADDRESS_2 = process.env.MULTI_SIG_ADDRESS_2;
export const MULTI_SIG_PRIVATE_KEY_3 = process.env.MULTI_SIG_PRIVATE_KEY_3;
export const MULTI_SIG_ADDRESS_3 = process.env.MULTI_SIG_ADDRESS_3;
export const MULTI_SIG_PRIVATE_KEY_4 = process.env.MULTI_SIG_PRIVATE_KEY_4;
export const MULTI_SIG_ADDRESS_4 = process.env.MULTI_SIG_ADDRESS_4;

export const DEFAULT_VALIDATOR_ADDRESS = process.env.DEFAULT_VALIDATOR_ADDRESS;
export const DEFAULT_PONDO_FOUNDATION_ADDRESS = 'aleo1hmrpe0ts2khluprhex3y46cqqy44pme7lwc40ls9nexftx0xhu8sxxpnd0';
export const PONDO_FOUNDATION_ADDRESS = process.env.PONDO_FOUNDATION_ADDRESS || DEFAULT_PONDO_FOUNDATION_ADDRESS;

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
export const WITHDRAW_WAIT_MINIMUM_DEFAULT = BigInt(43_200);
export const WITHDRAW_WAIT_MINIMUM = process.env.WITHDRAW_WAIT_MINIMUM
  ? BigInt(process.env.WITHDRAW_WAIT_MINIMUM)
  : WITHDRAW_WAIT_MINIMUM_DEFAULT;
export const PONDO_WITHDRAW_FEE_DEFAULT = BigInt(25);
export const PONDO_WITHDRAW_FEE = process.env.PONDO_WITHDRAW_FEE
  ? BigInt(process.env.PONDO_WITHDRAW_FEE)
  : PONDO_WITHDRAW_FEE_DEFAULT;
export const MAX_GUARANTEED_LIQUIDITY_DEFAULT = BigInt(250_000_000_000);
export const MAX_GUARANTEED_LIQUIDITY = process.env.MAX_GUARANTEED_LIQUIDITY
  ? BigInt(process.env.MAX_GUARANTEED_LIQUIDITY)
  : MAX_GUARANTEED_LIQUIDITY_DEFAULT;
export const MIN_LIQUIDITY_PERCENT_DEFAULT = BigInt(250);
export const MIN_LIQUIDITY_PERCENT = process.env.MIN_LIQUIDITY_PERCENT
  ? BigInt(process.env.MIN_LIQUIDITY_PERCENT)
  : MIN_LIQUIDITY_PERCENT_DEFAULT;

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
export const VERSION = process.env.VERSION ? process.env.VERSION : '';
export const ORACLE_ONLY = process.env.ORACLE_ONLY === 'true' || false;
export const PONDO_ORACLE_PROGRAM = pondoPrograms.find(program => program.includes('pondo_oracle'));
export const PONDO_ORACLE_PROGRAM_CODE = pondoProgramToCode[PONDO_ORACLE_PROGRAM!];
export const MANUAL_DEPLOY = process.env.MANUAL_DEPLOY === 'true' || false;
export const INITIALIZATION_AMOUNT = process.env.INITIALIZATION_AMOUNT || '101_000_000u64';
export const BOT_DELAY = process.env.BOT_DELAY ? parseInt(process.env.BOT_DELAY) : 15_000;

// Non .env constants
export const CREDITS_PROGRAM = 'credits.aleo';
export const ZERO_ADDRESS = `aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc`;
export const MIN_DELEGATION = BigInt(10_000_000_000); // 10k credits
export const PRECISION_UNSIGNED = BigInt(10_000);
export const CREDITS_TOKEN_ID =
  '3443843282313283355522573239085696902919850365217539366784739393210722344986field';
