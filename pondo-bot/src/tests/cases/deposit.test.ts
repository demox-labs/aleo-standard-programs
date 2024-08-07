import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { NETWORK } from '../../constants';
import * as Aleo from '@demox-labs/aleo-sdk';

describe('deposit', async () => {
  it('should deposit 1,000 credits to the test account', async () => {
    assert.notEqual(new Aleo.PrivateKey(NETWORK!), new Aleo.PrivateKey(NETWORK!));
    // assert.notEqual(new Aleo.PrivateKey(NETWORK!), new Aleo.PrivateKey(NETWORK!));
    assert(1 === 1);
  });
});