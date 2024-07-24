import * as Aleo from '@demox-labs/aleo-sdk';
import { expose } from 'threads/worker';


const authorizeTransaction = async (
  network: string,
  privateKey: string,
  program: string,
  functionName: string,
  inputs: string[],
  feeCredits: number,
  feeRecord?: string,
  imports?: { [key: string]: string }
): Promise<{
  authorization: string;
  fee_authorization: string;
}> => {
  const aleoPrivateKey = Aleo.PrivateKey.from_string(network, privateKey);
  const aleoRecord = feeRecord ? Aleo.RecordPlaintext.fromString(network, feeRecord) : undefined;
  const authJson = await Aleo.ProgramManager.authorize_transaction(
    aleoPrivateKey,
    program,
    functionName,
    inputs,
    feeCredits,
    aleoRecord,
    imports
    );
  const auth = JSON.parse(authJson);
  return {
    authorization: auth.authorization,
    fee_authorization: auth.fee_authorization
  };
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AuthorizeTransaction = typeof authorizeTransaction;

expose(authorizeTransaction);