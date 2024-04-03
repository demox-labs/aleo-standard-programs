// The 'delegator' program.
import credits.aleo;
// should be deployed with paramaters like the validator address
// this delegator should be bonded to

program delegator1.aleo {
    const CORE_PROTOCOL: address = aleo1v7zqs7fls3ryy8dvtl77ytszk4p9af9mxx2kclq529jd3et7hc8qqlhsq0;
    const ALE: address = aleo1zpy3xyaf40uqt6v42wm8f9kzp7rhzrjy34kv5yyx3va4r9hgcsxstggn0q;
    // 0u8 -> 0u8 = unbonding unavailable, 1u8 = unbonding available
    mapping unbond_available: u8 => u8;
    // 0u8 -> address = validator address
    mapping validator_address: u8 => address;

    transition set_validator(public validator: address) {
        // assert_eq(self.caller, CORE_PROTOCOL);
        return then finalize(validator);
    }

    finalize set_validator(public validator: address) {
        validator_address.set(0u8, validator);
    }

    transition transfer_to_core_protocol(public amount: u64) {
        assert_eq(self.caller, CORE_PROTOCOL);
        credits.aleo/transfer_public(CORE_PROTOCOL, amount);
    }

    transition transfer_to_ale(public amount: u64) {
        assert_eq(self.caller, CORE_PROTOCOL);
        credits.aleo/transfer_public(ALE, amount);
    }

    // this delegator program must have had credits sent to it or it will fail.
    // must be at least 1 full credit, and the total bonded amount of the delegator must be at least 10 full credits
    // the validator this delegator is bonded to must have at least 1 million credits.
    transition bond(public validator: address, public amount: u64) {
        assert_eq(self.caller, CORE_PROTOCOL);
        credits.aleo/bond_public(validator, amount);

        return then finalize(validator);
    }

    finalize bond(public validator: address) {
        let bound_validator: address = validator_address.get(0u8);
        assert_eq(validator, bound_validator);
    }

    // if the remaining balance would fall to below 10 full credits,
    // then the entire remaining balance is unstaked.
    transition unbond(amount: u64) {
        assert_eq(self.caller, CORE_PROTOCOL);
        credits.aleo/unbond_public(amount);

        return then finalize(amount);
    }

    finalize unbond(amount: u64) {
        assert_eq(unbond_available.get(0u8), 1u8);
        // unbonding no longer available
        unbond_available.set(0u8, 0u8);
    }

    transition claim_unbond() {
        assert_eq(self.caller, CORE_PROTOCOL);
        credits.aleo/claim_unbond_public();

        return then finalize();
    }

    finalize claim_unbond() {
        // unbonding available again
        unbond_available.set(0u8, 1u8);
    }
}
