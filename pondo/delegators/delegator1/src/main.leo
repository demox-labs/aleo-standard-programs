// The 'delegator' program.
import credits.aleo;

program delegator1.aleo {
    // this delegator program must have had credits sent to it or it will fail.
    // must be at least 1 full credit, and the total bonded amount of the delegator must be at least 10,000 full credits
    // the validator this delegator is bonded to must have at least 10 million credits.
    transition bond(public validator: address, public amount: u64) {
        assert_eq(self.caller, pondo_core_protocol.aleo);
        credits.aleo/bond_public(validator, pondo_core_protocol.aleo, amount);
    }

    // if the remaining balance would fall to below 10 full credits,
    // then the entire remaining balance is unstaked.
    transition unbond(amount: u64) {
        assert_eq(self.caller, pondo_core_protocol.aleo);
        credits.aleo/unbond_public(amount);
    }

    transition transfer_to_core_protocol(public amount: u64) {
        assert_eq(self.caller, pondo_core_protocol.aleo);
        credits.aleo/transfer_public(pondo_core_protocol.aleo, amount);
    }

    transition transfer_to_ale(public amount: u64) {
        assert_eq(self.caller, pondo_core_protocol.aleo);
        credits.aleo/transfer_public(pondo_staked_aleo_token.aleo, amount);
    }
}
