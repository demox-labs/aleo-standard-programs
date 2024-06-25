import multi_token_support_program.aleo;

// -----------------------------------------------------------
// pALEO Token Program
// -----------------------------------------------------------
program pondo_staked_aleo_token.aleo {
    record claim {
        owner: address,
        amount: u64,
        min_claim_height: u32
    }

    async transition mint_public(
        public amount: u64,
        public receiver: address
    ) -> Future {
        assert_eq(self.caller, pondo_core_protocol.aleo);

        return multi_token_support_program.aleo/mint_public();
    }

    async transition burn_public(public amount: u64) -> Future {
        assert_eq(self.caller, pondo_core_protocol.aleo);

        return multi_token_support_program.aleo/burn_public();
    }

    transition mint_private(
        public amount: u64,
        private receiver: address
    ) -> multi_token_support_program.aleo/Token {
        assert_eq(self.caller, pondo_core_protocol.aleo);

        return multi_token_support_program.aleo/mint_private();
    }

    transition burn_private(
        private input_record: multi_token_support_program.aleo/Token,
        private burn_amount: u64,
        private credits_claim_amount: u64,
        private min_block_height: u32
    ) -> (multi_token_support_program.aleo/Token, claim) {
        assert_eq(self.caller, pondo_core_protocol.aleo);

        let output_token: multi_token_support_program.aleo/Token = multi_token_support_program.aleo/burn_private(input_record, burn_amount);
        let output_claim: claim = claim {
            owner: input_record.owner,
            amount: credits_claim_amount,
            min_claim_height: min_block_height
        };

        return (output_token, output_claim);
    }

    // -----------------------------------------------------------
    // ARC-21 functions
    // -----------------------------------------------------------

    transition approve_public(public spender: address, public amount: u64) {
        let approve: approval = approval {
            approver: self.caller,
            spender: spender
        };
        let approval_hash: field = BHP256::hash_to_field(approve);

        return then finalize(approval_hash, amount);
    }

    finalize approve_public(public approval_hash: field, public amount: u64) {
        let approvals_value: u64 = Mapping::get_or_use(approvals, approval_hash, 0u64);
        let new_approvals_value: u64 = approvals_value.add(amount);
        Mapping::set(approvals, approval_hash, new_approvals_value);
    }

    transition unapprove_public(public spender: address, public amount: u64) {
        let approve: approval = approval {
            approver: self.caller,
            spender: spender
        };
        let approval_hash: field = BHP256::hash_to_field(approve);

        return then finalize(approval_hash, amount);
    }

    finalize unapprove_public(public approval_hash: field, public amount: u64) {
        let approvals_value: u64 = Mapping::get_or_use(approvals, approval_hash, 0u64);
        let new_approvals_value: u64 = approvals_value - amount;

        Mapping::set(approvals, approval_hash, new_approvals_value);
    }

    transition transfer_from_public(public approver: address, public receiver: address, public amount: u64) {
        let approve: approval = approval {
            approver: approver,
            spender: self.caller
        };

        let approval_hash: field = BHP256::hash_to_field(approve);

        return then finalize(approval_hash, approver, receiver, amount);
    }

    finalize transfer_from_public(public approval_hash: field, public approver: address, public receiver: address, public amount: u64) {
        let approvals_value: u64 = Mapping::get(approvals, approval_hash);
        let new_approvals_value: u64 = approvals_value - amount;
        Mapping::set(approvals, approval_hash, new_approvals_value);

        let approver_balance: u64 = Mapping::get(account, approver);
        let new_approver_balance: u64 = approver_balance - amount;
        Mapping::set(account, approver, new_approver_balance);

        let receiver_balance: u64 = Mapping::get_or_use(account, receiver, 0u64);
        let new_receiver_balance: u64 = receiver_balance.add(amount);
        Mapping::set(account, receiver, new_receiver_balance);
    }

    transition transfer_public(public receiver: address, public amount: u64) {
        return then finalize(self.caller, receiver, amount);
    }

    finalize transfer_public(public sender: address, public receiver: address, public amount: u64) {
        let sender_balance: u64 = Mapping::get_or_use(account, sender, 0u64);
        let new_sender_balance: u64 = sender_balance - amount;
        Mapping::set(account, sender, new_sender_balance);

        let receiver_balance: u64 = Mapping::get_or_use(account, receiver, 0u64);
        let new_receiver_balance: u64 = receiver_balance.add(amount);
        Mapping::set(account, receiver, new_receiver_balance);
    }

    transition transfer_private(private input_record: token, private receiver: address, private amount: u64) -> (private token, private token) {
        let new_input_record: token = token {
            owner: input_record.owner,
            amount: input_record.amount - amount
        };

        let receiver_record: token = token {
            owner: receiver,
            amount: amount
        };

        return (new_input_record, receiver_record);
    }

    transition transfer_private_to_public(private input_record: token, public receiver: address, public amount: u64) -> (private token) {
        let output_record: token = token {
            owner: input_record.owner,
            amount: input_record.amount - amount
        };

        return output_record then finalize(receiver, amount);
    }

    finalize transfer_private_to_public(public receiver: address, public amount: u64) {
        let receiver_balance: u64 = Mapping::get_or_use(account, receiver, 0u64);
        let new_receiver_balance: u64 = receiver_balance.add(amount);
        Mapping::set(account, receiver, new_receiver_balance);
    }

    transition transfer_public_to_private(public receiver: address, public amount: u64) -> (private token) {
        let output_record: token = token {
            owner: receiver,
            amount: amount
        };

        return output_record then finalize(self.caller, amount);
    }

    finalize transfer_public_to_private(public sender: address, public amount: u64) {
        let sender_balance: u64 = Mapping::get_or_use(account, sender, 0u64);
        let new_sender_balance: u64 = sender_balance - amount;
        Mapping::set(account, sender, new_sender_balance);
    }
}