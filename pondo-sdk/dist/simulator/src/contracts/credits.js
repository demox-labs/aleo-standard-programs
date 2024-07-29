import assert from "assert";
export const MINIMUM_BOND_POOL = BigInt(10000000000);
export const MICROCREDITS_TO_CREDITS = 1000000;
export class creditsProgram {
    caller = "not set";
    signer = "not set";
    block;
    UNBONDING_PERIOD = BigInt("360");
    account = new Map();
    bonded = new Map();
    unbonding = new Map();
    committee = new Map();
    withdraw = new Map();
    constructor(block) {
        this.block = block || { height: BigInt(0) };
    }
    transfer_public_to_private(receiver, amount) {
        const receiverRecord = {
            owner: receiver,
            microcredits: amount,
        };
        this.finalize_transfer_public_to_private(this.caller, amount);
        return receiverRecord;
    }
    finalize_transfer_public_to_private(sender, amount) {
        const senderBalance = this.account.get(sender);
        const newSenderBalance = senderBalance - amount;
        this.account.set(sender, newSenderBalance);
    }
    transfer_private_to_public(input_record, recipient, amount) {
        const recipientBalance = this.account.get(recipient) || BigInt(0);
        const newRecipientBalance = recipientBalance + amount;
        this.account.set(recipient, newRecipientBalance);
        input_record.microcredits -= amount;
        return input_record;
    }
    transfer_public(recipient, amount) {
        this.finalize_transfer_public(this.caller, recipient, amount);
    }
    finalize_transfer_public(sender, recipient, amount) {
        const senderBalance = this.account.get(sender);
        const newSenderBalance = senderBalance - amount;
        assert(newSenderBalance >= BigInt(0), "insufficient balance");
        this.account.set(sender, newSenderBalance);
        const recipientBalance = this.account.get(recipient) || BigInt(0);
        const newRecipientBalance = recipientBalance + amount;
        this.account.set(recipient, newRecipientBalance);
    }
    transfer_public_as_signer(recipient, amount) {
        this.finalize_transfer_public(this.signer, recipient, amount);
    }
    bond_public(validator, withdraw, amount) {
        this.finalize_bond_public(this.caller, validator, withdraw, amount);
    }
    finalize_bond_public(delegator, validator, withdraw, amount) {
        assert(this.committee.has(validator));
        const bonded = this.bonded.get(delegator) || {
            microcredits: BigInt(0),
            validator: validator,
        };
        assert(bonded.validator === validator, "bonded to different validator");
        assert(bonded.microcredits !== BigInt(0) || amount >= BigInt(MINIMUM_BOND_POOL), "minimum bond amount not met");
        assert(bonded.microcredits === BigInt(0) ||
            amount >= BigInt(1 * MICROCREDITS_TO_CREDITS), "must bond at least 1 credit");
        bonded.microcredits += amount;
        const newSenderBalance = this.account.get(delegator) - amount;
        this.bonded.set(delegator, bonded);
        assert(newSenderBalance >= BigInt(0), "insufficient balance");
        this.account.set(delegator, newSenderBalance);
        if (this.withdraw.has(delegator)) {
            assert(this.withdraw.get(delegator) === withdraw, "withdraw address mismatch");
        }
        this.withdraw.set(delegator, withdraw);
    }
    unbond_public(delegator, amount) {
        this.finalize_unbond_public(delegator, amount);
    }
    finalize_unbond_public(delegator, amount) {
        // TODO: assert that the caller is allowed to call unbond for the delegator
        const bonded = this.bonded.get(delegator);
        assert(bonded !== undefined, "not bonded");
        assert(bonded.microcredits >= amount, "insufficient credits to unbond");
        let unbondAmount = amount;
        const remainingBond = bonded.microcredits - amount;
        if (remainingBond < BigInt(MINIMUM_BOND_POOL)) {
            unbondAmount = bonded.microcredits;
            this.bonded.delete(delegator);
        }
        else {
            bonded.microcredits = remainingBond;
            this.bonded.set(delegator, bonded);
        }
        const unbonding = this.unbonding.get(delegator) || {
            microcredits: BigInt(0),
            height: this.block.height,
        };
        unbonding.microcredits += unbondAmount;
        unbonding.height = this.block.height + this.UNBONDING_PERIOD;
        this.unbonding.set(delegator, unbonding);
    }
    claim_unbond_public(delegator) {
        this.finalize_claim_unbond_public(delegator);
    }
    finalize_claim_unbond_public(delegator) {
        const unbonding = this.unbonding.get(delegator);
        assert(unbonding !== undefined, "not unbonding");
        assert(this.block.height >= unbonding.height, `unbonding period has not passed ${this.block.height} ${unbonding.height}`);
        const credits = unbonding.microcredits;
        this.unbonding.delete(delegator);
        this.account.set(delegator, this.account.get(delegator) + credits);
    }
}
