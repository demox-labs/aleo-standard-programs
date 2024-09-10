import { token_registryProgram } from './token_registry';

import assert from 'assert';
// interfaces
export class paleo_tokenProgram {
  signer: string = "not set";
  caller: string = "not set";
  address: string = "paleo_token.aleo";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  PALEO_TOKEN_ID = "1751493913335802797273486270793650302076377624243810059080883537084141842600field";
  token_registry: token_registryProgram;
  constructor(
    // constructor args
    token_registryContract: token_registryProgram,
  ) {
    // constructor body
    this.token_registry = token_registryContract;
  }
      
// -----------------------------------------------------------
// pALEO Token Program
// -----------------------------------------------------------
  //program paleo_token.aleo {    
  register_token(
  ) {
    assert(this.caller === "pondo_protocol.aleo");
    
    let name: bigint = BigInt.asUintN(128, BigInt("1631421259099656974472467909989204")); // "Pondo Aleo LST" ascii encoded
    let symbol: bigint = BigInt.asUintN(128, BigInt("482131854671")); // "pALEO" ascii encoded
    let decimals: bigint = BigInt.asUintN(8, BigInt("6"));
    let max_supply: bigint = BigInt.asUintN(128, BigInt("1000000000000000"));
    let external_authorization_required: boolean = false;
    let external_authorization_party: string = "paleo_token.aleo";
    
    
      this.token_registry.signer = this.signer;
      this.token_registry.caller = "paleo_token.aleo";
          this.token_registry.register_token(this.PALEO_TOKEN_ID, name, symbol, decimals, max_supply, external_authorization_required, external_authorization_party);
    
    
    return this.finalize_register_token();
    }
    
  finalize_register_token(
  ) {
    
    }
    
  mint_public(
    amount: bigint,
    receiver: string,
  ) {
    assert(this.caller === "pondo_protocol.aleo");
    
// Mint the pALEO tokens to the receiver, with u32::MAX as the expiration time
    
      this.token_registry.signer = this.signer;
      this.token_registry.caller = "paleo_token.aleo";
          this.token_registry.mint_public(this.PALEO_TOKEN_ID, receiver, amount, BigInt("4294967295"));
    
    return this.finalize_mint_public();
    }
    
  finalize_mint_public(
  ) {
    
    }
    
  burn_public(
    amount: bigint,
    owner: string,
  ) {
    assert(this.caller === "pondo_protocol.aleo");
    
    
      this.token_registry.signer = this.signer;
      this.token_registry.caller = "paleo_token.aleo";
          this.token_registry.burn_public(this.PALEO_TOKEN_ID, owner, amount);
    
    return this.finalize_burn_public();
    }
    
  finalize_burn_public(
  ) {
    
    }
    }
