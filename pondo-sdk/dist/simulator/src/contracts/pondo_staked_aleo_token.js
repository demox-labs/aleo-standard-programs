import assert from 'assert';
// interfaces
export class pondo_staked_aleo_tokenProgram {
    signer = "not set";
    caller = "not set";
    address = "pondo_staked_aleo_token.aleo";
    block = { height: BigInt(0) };
    // params
    PALEO_TOKEN_ID = "1751493913335802797273486270793650302076377624243810059080883537084141842600field";
    multi_token_support_program;
    constructor(
    // constructor args
    multi_token_support_programContract) {
        // constructor body
        this.multi_token_support_program = multi_token_support_programContract;
    }
    // -----------------------------------------------------------
    // pALEO Token Program
    // -----------------------------------------------------------
    //program pondo_staked_aleo_token.aleo {    
    register_token() {
        assert(this.caller === "pondo_core_protocol.aleo");
        let name = BigInt.asUintN(128, BigInt("1631421259099656974472467909989204")); // "Pondo Aleo LST" ascii encoded
        let symbol = BigInt.asUintN(128, BigInt("482131854671")); // "pALEO" ascii encoded
        let decimals = BigInt.asUintN(8, BigInt("6"));
        let max_supply = BigInt.asUintN(128, BigInt("1000000000000000"));
        let external_authorization_required = false;
        let external_authorization_party = "pondo_staked_aleo_token.aleo";
        this.multi_token_support_program.signer = this.signer;
        this.multi_token_support_program.caller = "pondo_staked_aleo_token.aleo";
        this.multi_token_support_program.register_token(this.PALEO_TOKEN_ID, name, symbol, decimals, max_supply, external_authorization_required, external_authorization_party);
        return this.finalize_register_token();
    }
    finalize_register_token() {
    }
    mint_public(amount, receiver) {
        assert(this.caller === "pondo_core_protocol.aleo");
        // Mint the pALEO tokens to the receiver, with u32::MAX as the expiration time
        this.multi_token_support_program.signer = this.signer;
        this.multi_token_support_program.caller = "pondo_staked_aleo_token.aleo";
        this.multi_token_support_program.mint_public(this.PALEO_TOKEN_ID, receiver, amount, BigInt("4294967295"));
        return this.finalize_mint_public();
    }
    finalize_mint_public() {
    }
    burn_public(amount, owner) {
        assert(this.caller === "pondo_core_protocol.aleo");
        this.multi_token_support_program.signer = this.signer;
        this.multi_token_support_program.caller = "pondo_staked_aleo_token.aleo";
        this.multi_token_support_program.burn_public(this.PALEO_TOKEN_ID, owner, amount);
        return this.finalize_burn_public();
    }
    finalize_burn_public() {
    }
}