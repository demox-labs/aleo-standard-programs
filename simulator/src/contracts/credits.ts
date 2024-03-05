export interface credits {
  owner: string;
  microcredits: bigint;
}

export class creditsProgram {
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  account: Map<string, bigint> = new Map();
  transfer_public_to_private(
    receiver: string,
    amount: bigint,
  ) {
    const receiverRecord: credits = {
        owner: receiver,
        microcredits: amount
      };

    return receiverRecord;
  }

  finalize_transfer_public_to_private(
    sender: string,
    amount: bigint
  ) {
    const senderBalance: bigint = this.account.get(sender)!;
    const newSenderBalance: bigint = senderBalance - amount;
    this.account.set(sender, newSenderBalance);
  }
}