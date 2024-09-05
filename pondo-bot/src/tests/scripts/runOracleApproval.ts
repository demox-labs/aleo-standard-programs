import * as Aleo from '@demox-labs/aleo-sdk';
import { NETWORK } from '../../constants';

const [privateKey, requestId, programAddress] = process.argv.slice(2);

const addressHash = Aleo.Plaintext.fromString(NETWORK!, programAddress).hashBhp256();
const plaintextString = `{
  arg: ${addressHash},
  op_type: 4u8,
  request_id: ${requestId}u64
}`;
const hashedField = Aleo.Plaintext.fromString(NETWORK!, plaintextString).hashBhp256();

// Sign the hash with the oracle private keys
const signature0 = Aleo.Signature.sign_plaintext(NETWORK!, privateKey, hashedField).to_string();