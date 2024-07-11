import { multi_token_support_programProgram } from './multi_token_support_program';

import assert from 'assert';
// interfaces
export class pondo_staked_aleo_tokenProgram {
  signer: string = "not set";
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  PALEO_TOKEN_ID = "1751493913335802797273486270793650302076377624243810059080883537084141842600field";
  multi_token_support_program_v1: multi_token_support_programProgram;
  constructor(
    // constructor args
    multi_token_support_program_v1Contract: multi_token_support_programProgram,
  ) {
    // constructor body
    this.multi_token_support_program_v1 = multi_token_support_program_v1Contract;
  }

// -----------------------------------------------------------
// pALEO Token Program
// -----------------------------------------------------------
  //program pondo_staked_aleo_token.aleo {
  register_token(
  ) {
    assert(this.caller === "pondo_core_protocol.aleo");

    let name: bigint = BigInt("1480444737813606060884");
    let symbol: bigint = BigInt("482131854671");
    let decimals: bigint = BigInt("6");
    let max_supply: bigint = BigInt("1000000000000000");
    let external_authorization_required: boolean = false;
    let external_authorization_party: string = "pondo_staked_aleo_token.aleo";

    this.multi_token_support_program_v1.caller = "pondo_staked_aleo_token.aleo";
    this.multi_token_support_program_v1.register_token(this.PALEO_TOKEN_ID, name, symbol, decimals, max_supply, external_authorization_required, external_authorization_party);

    return this.finalize_register_token();
    }

  finalize_register_token(
  ) {

    }

  mint_public(
    amount: bigint,
    receiver: string,
  ) {
    assert(this.caller === "pondo_core_protocol.aleo");

    this.multi_token_support_program_v1.caller = "pondo_staked_aleo_token.aleo";
    this.multi_token_support_program_v1.mint_public(this.PALEO_TOKEN_ID, receiver, amount, BigInt("4294967295"));
    return this.finalize_mint_public();
    }

  finalize_mint_public(
  ) {

    }

  burn_public(
    amount: bigint,
    owner: string,
  ) {
    assert(this.caller === "pondo_core_protocol.aleo");

    this.multi_token_support_program_v1.caller = "pondo_staked_aleo_token.aleo";
    this.multi_token_support_program_v1.burn_public(this.PALEO_TOKEN_ID, owner, amount);
    return this.finalize_burn_public();
    }

  finalize_burn_public(
  ) {

    }
    }
