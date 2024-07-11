import { Token } from './multi_token_support_program';
import { multi_token_support_programProgram } from './multi_token_support_program';

import assert from 'assert';
// interfaces
export class pondo_tokenProgram {
  signer: string = "not set";
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  PONDO_TOKEN_ID = "0field";
  multi_token_support_program_v1: multi_token_support_programProgram;
  constructor(
    // constructor args
    multi_token_support_program_v1Contract: multi_token_support_programProgram,
  ) {
    // constructor body
    this.multi_token_support_program_v1 = multi_token_support_program_v1Contract;
  }

  //program pondo_token.aleo {
// The Pondo token is only minted once and the total supply is fixed.
  initialize_token(
  ) {
    assert(this.caller === "pondo_core_protocol.aleo");

    let name: bigint = BigInt("345466889327");
    let symbol: bigint = BigInt("1347306575");
    let decimals: bigint = BigInt("6");
    let max_supply: bigint = BigInt("1000000000000000");
    let external_authorization_required: boolean = false;
    let external_authorization_party: string = "pondo_token.aleo";

    this.multi_token_support_program_v1.caller = "pondo_token.aleo";
    this.multi_token_support_program_v1.register_token(this.PONDO_TOKEN_ID, name, symbol, decimals, max_supply, external_authorization_required, external_authorization_party);
    this.multi_token_support_program_v1.caller = "pondo_token.aleo";
    this.multi_token_support_program_v1.mint_public(this.PONDO_TOKEN_ID, "pondo_token.aleo", max_supply, BigInt("4294967295"));

    return this.finalize_initialize_token( );
    }

  finalize_initialize_token(
  ) {


    }

  burn_public(
    burner: string,
    amount: bigint,
  ) {
    this.multi_token_support_program_v1.caller = "pondo_token.aleo";
    this.multi_token_support_program_v1.burn_public(this.PONDO_TOKEN_ID, burner, amount);
    return this.finalize_burn_public();
    }

  finalize_burn_public(
  ) {

    }

  burn_private(
    input_record: Token,
    burn_amount: bigint,
  ): Token {
    this.multi_token_support_program_v1.caller = "pondo_token.aleo";
    return this.multi_token_support_program_v1.burn_private(input_record, burn_amount);
    }

  finalize_burn_private(
  ) {
    assert(true);
    }
    }
