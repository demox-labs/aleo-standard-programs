// TODO: replace with ARC-20 standard, plus burn/mint
program axel.aleo {
    mapping account: address => u64;

    // 0u8 -- total minted
    // 1u8 -- total burned
    mapping totals: u8 => u64;

    record token {
        owner: address,
        amount: u64
    }

    struct approval {
        approver: address,
        spender: address
    }

    mapping approvals: field => u64;

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
        let new_approvals_value: u64 = approvals_value.sub(amount);

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
        let new_approvals_value: u64 = approvals_value.sub(amount);
        Mapping::set(approvals, approval_hash, new_approvals_value);

        let approver_balance: u64 = Mapping::get(account, approver);
        let new_approver_balance: u64 = approver_balance.sub(amount);
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
        let new_sender_balance: u64 = sender_balance.sub(amount);
        Mapping::set(account, sender, new_sender_balance);

        let receiver_balance: u64 = Mapping::get_or_use(account, receiver, 0u64);
        let new_receiver_balance: u64 = receiver_balance.add(amount);
        Mapping::set(account, receiver, new_receiver_balance);
    }


    transition transfer_private(private input_record: token, private receiver: address, private amount: u64) -> (private token, private token) {
        let new_input_record: token = token {
            owner: input_record.owner,
            amount: input_record.amount.sub(amount)
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
            amount: input_record.amount.sub(amount)
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
        let new_sender_balance: u64 = sender_balance.sub(amount);
        Mapping::set(account, sender, new_sender_balance);
    }

    transition mint_public(public amount: u64, public receiver: address) {
        // assert self.caller == address of core_protocol.aleo;
        
        return then finalize (amount, receiver);

    }

    finalize mint_public(public amount: u64, public receiver: address) {
        let total_minted: u64 = totals.get_or_use(0u8, 0u64);
        // one time mint
        assert_eq(total_minted, 0u64);
        let new_total_minted: u64 = total_minted.add(amount);
        totals.set(0u8, new_total_minted);

        let receiver_balance: u64 = account.get_or_use(receiver, 0u64);
        let new_receiver_balance: u64 = receiver_balance.add(amount);
        account.set(receiver, new_receiver_balance);
    }

    transition burn_private(private input_record: token) {
        // assert self.caller == address of core_protocol.aleo;
        return then finalize(input_record.amount);
    }

    finalize burn_private(public amount: u64) {
        let total_burned: u64 = totals.get_or_use(1u8, 0u64);
        let new_total_burned: u64 = total_burned.add(amount);
        totals.set(1u8, new_total_burned);
    }

    transition burn_public(public burner: address, public amount: u64) {
        // assert self.caller == address of core_protocol.aleo;
        return then finalize(burner, amount);
    }

    finalize burn_public(public burner: address, public amount: u64) {
        let burner_balance: u64 = account.get_or_use(burner, 0u64);
        // TODO: Check, should be protected by underflow
        let new_burner_balance: u64 = burner_balance.sub(amount);
        account.set(burner, new_burner_balance);

        let total_burned: u64 = totals.get_or_use(1u8, 0u64);
        let new_total_burned: u64 = total_burned.add(amount);
        totals.set(1u8, new_total_burned);
    }
}