import * as Aleo from '@demox-labs/aleo-sdk';
import { expose } from 'threads/worker';

const authorizeDeployment = async (
  network: string,
  privateKey: string,
  deployment: string,
  feeCredits: number,
  feeRecord?: string
): Promise<{
  deployment: string;
  feeAuthorization: string;
  owner: string;
}> => {
  const aleoPrivateKey = Aleo.PrivateKey.from_string(network, privateKey);
  const aleoRecord = feeRecord ? Aleo.RecordPlaintext.fromString(network, feeRecord) : undefined;
  const authJson = await Aleo.ProgramManager.authorize_deploy(aleoPrivateKey, deployment, feeCredits, aleoRecord);
  const auth = JSON.parse(authJson);
  return {
    deployment: auth.deployment,
    feeAuthorization: auth.fee_authorization,
    owner: auth.owner
  };
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AuthorizeDeployment = typeof authorizeDeployment;

expose(authorizeDeployment);