import * as Aleo from '@demox-labs/aleo-sdk';
import { NETWORK } from '../../constants';

const [privateKey, requestId, timestamp] = process.argv.slice(2);

const timestampHash = Aleo.Plaintext.fromString(
  NETWORK!,
  timestamp
).hashBhp256();
const plaintextString = `{
  arg: ${timestampHash},
  op_type: 0u8,
  request_id: ${requestId}u64
}`;
const hashedField = Aleo.Plaintext.fromString(
  NETWORK!,
  plaintextString
).hashBhp256();

// Sign the hash with the oracle private keys
const signature0 = Aleo.Signature.sign_plaintext(
  NETWORK!,
  privateKey,
  hashedField
).to_string();

console.log(signature0);
