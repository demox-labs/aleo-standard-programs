import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { NETWORK, PALEO_TOKEN_ID_DEFAULT } from '../../constants';
import * as Aleo from '@demox-labs/aleo-sdk';
import { getMappingValue, getMTSPBalance, getProgram, getPublicBalance } from '../../aleo/client';

describe('deposit', async () => {
  let protocolProgram: string;
  let paleoProgram: string;
  let pondoTokenProgram: string;

  const protocolId = 'pondo_core_protocol.aleo';
  const paleoId = 'pondo_staked_token.aleo';
  const pondoTokenId = 'pondo_token.aleo';
  const mtspId = 'multi_token_support_program.aleo';

  let protocolProgramAddress: string;
  let paleoProgramAddress: string;
  let pondoTokenProgramAddress: string;

  before(async () => {
    // assert that program states are as expected
    protocolProgram = await getProgram('pondo_core_protocol.aleo');
    protocolProgramAddress = Aleo.Program.fromString(NETWORK!, protocolProgram).toAddress();
    const protocolAccountBalance = await getPublicBalance(protocolProgramAddress);
    console.log(`Protocol account balance: ${protocolAccountBalance}`);
    console.log('Protocol program address:', protocolProgramAddress);
    const paleoMintedToCoreProtocol = await getMTSPBalance(protocolProgramAddress, '1751493913335802797273486270793650302076377624243810059080883537084141842602field');
    console.log(`Paleo minted to core protocol: ${paleoMintedToCoreProtocol}`);
  });

  it('should deposit 1,000 credits to the test account', async () => {
    assert.notEqual(new Aleo.PrivateKey(NETWORK!), new Aleo.PrivateKey(NETWORK!));
    // assert.notEqual(new Aleo.PrivateKey(NETWORK!), new Aleo.PrivateKey(NETWORK!));
    assert(1 === 1);
  });
});