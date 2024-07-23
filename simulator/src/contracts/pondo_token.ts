import { multi_token_support_programProgram } from './multi_token_support_program';

import assert from 'assert';
// interfaces
export interface Balance {
  token_id: string;
  account: string;
  balance: bigint;
  authorized_until: bigint;
}
export interface TokenOwner {
  account: string;
  token_id: string;
}
export interface TokenMetadata {
  token_id: string;
  name: bigint;
  symbol: bigint;
  decimals: bigint;
  supply: bigint;
  max_supply: bigint;
  admin: string;
  external_authorization_required: boolean;
  external_authorization_party: string;
}
export class pondo_tokenProgram {
  signer: string = 'not set';
  caller: string = 'not set';
  address: string = 'pondo_token.aleo';
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  PRECISION = BigInt('1000000');
  PONDO_FOUNDATION_ADDRESS =
    'aleo1hmrpe0ts2khluprhex3y46cqqy44pme7lwc40ls9nexftx0xhu8sxxpnd0';
  PALEO_TOKEN_ID =
    '1751493913335802797273486270793650302076377624243810059080883537084141842600field';
  PONDO_TOKEN_ID =
    '1751493913335802797273486270793650302076377624243810059080883537084141842601field';
  multi_token_support_program: multi_token_support_programProgram;
  constructor(
    // constructor args
    multi_token_support_programContract: multi_token_support_programProgram
  ) {
    // constructor body
    this.multi_token_support_program = multi_token_support_programContract;
  }

  //program pondo_token.aleo {
  // shadowed from multi_token_support_program.aleo

  // shadowed from multi_token_support_program.aleo

  // shadowed from multi_token_support_program.aleo

  // The Pondo token is only minted once and the total supply is fixed.
  initialize_token() {
    assert(this.caller === 'pondo_core_protocol.aleo');

    let name: bigint = BigInt.asUintN(
      128,
      BigInt('97240284627655645872219502')
    ); // "Pondo Token", ascii encoded
    let symbol: bigint = BigInt.asUintN(128, BigInt('1347306575')); // "PNDO", ascii encoded
    let decimals: bigint = BigInt.asUintN(8, BigInt('6'));
    let max_supply: bigint = BigInt.asUintN(128, BigInt('1000000000000000'));
    let external_authorization_required: boolean = false;
    let external_authorization_party: string = 'pondo_token.aleo';

    this.multi_token_support_program.signer = this.signer;
    this.multi_token_support_program.caller = 'pondo_token.aleo';
    this.multi_token_support_program.register_token(
      this.PONDO_TOKEN_ID,
      name,
      symbol,
      decimals,
      max_supply,
      external_authorization_required,
      external_authorization_party
    );

    this.multi_token_support_program.signer = this.signer;
    this.multi_token_support_program.caller = 'pondo_token.aleo';
    this.multi_token_support_program.mint_public(
      this.PONDO_TOKEN_ID,
      this.PONDO_FOUNDATION_ADDRESS,
      max_supply,
      BigInt('4294967295')
    );

    return this.finalize_initialize_token();
  }

  finalize_initialize_token() {}

  burn_public(burner: string, amount: bigint, paleo_amount: bigint) {
    // Sanity checks to ensure that the amounts are greater than 0
    assert(amount > BigInt('0'));
    assert(paleo_amount > BigInt('0'));

    let signed_by_owner: boolean = this.signer == burner;
    let called_by_owner: boolean = this.caller == burner;
    assert(signed_by_owner || called_by_owner);

    this.multi_token_support_program.signer = this.signer;
    this.multi_token_support_program.caller = 'pondo_token.aleo';
    this.multi_token_support_program.burn_public(
      this.PONDO_TOKEN_ID,
      burner,
      amount
    );

    this.multi_token_support_program.signer = this.signer;
    this.multi_token_support_program.caller = 'pondo_token.aleo';
    this.multi_token_support_program.transfer_public(
      this.PALEO_TOKEN_ID,
      burner,
      paleo_amount
    );

    return this.finalize_burn_public(amount, paleo_amount);
  }

  finalize_burn_public(amount: bigint, paleo_amount: bigint) {
    // Get the total supply of pondo
    let pondo_supply_after: TokenMetadata =
      this.multi_token_support_program.registered_tokens.get(
        this.PONDO_TOKEN_ID
      )!;
    assert(pondo_supply_after !== undefined);

    // Get the pondo_token's balance of paleo
    let token_owner: TokenOwner = {
      account: 'pondo_token.aleo',
      token_id: this.PALEO_TOKEN_ID,
    };
    let balance_key: string = JSON.stringify(token_owner);
    let paleo_balance_after: Balance =
      this.multi_token_support_program.authorized_balances.get(balance_key)!;
    assert(paleo_balance_after !== undefined);

    // Calculate the pondo to paleo ratio
    let pondo_paleo_ratio: bigint = BigInt.asUintN(
      128,
      (pondo_supply_after.supply * this.PRECISION) / paleo_balance_after.balance
    );
    let withdrawal_ratio: bigint = BigInt.asUintN(
      128,
      (amount * this.PRECISION) / paleo_amount
    );

    // Ensure that the pondo to paleo ratio is greater than the withdrawal ratio
    let valid_withdrawal: boolean = pondo_paleo_ratio >= withdrawal_ratio;
    assert(valid_withdrawal);
  }
}
