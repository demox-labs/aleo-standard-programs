import { credits } from '../src/contracts/pondoProgramsIndex';
import {
  TokenOwner,
  token_registryProgram,
} from '../src/contracts/token_registry';
import { block } from '../src/pondo/ChainEmulator';

describe('MTSP tests', () => {
  let block: block;
  let creditsContract: credits;
  let mtsp: token_registryProgram;

  const ADDRESS =
    'aleo1ap9w8dkfrahs2msqhr439whxtz8pvnx3c3clln3ps6tklefj6g8shgmtsp';
  const u32Max = BigInt(4294967295);

  // Token data
  const tokenId = 'token_id';
  const tokenName = BigInt(0);
  const symbol = BigInt(0);
  const decimals = BigInt(6);
  const maxSupply = BigInt(1000000);

  beforeEach(() => {
    // Setup
    block = { height: BigInt(0) };
    creditsContract = new credits(block);
    mtsp = new token_registryProgram(creditsContract);
  });

  // This test fails but should pass after audit fix
  it('initialize can only be called once by any address', () => {
    mtsp.caller = ADDRESS;
    mtsp.initialize();

    expect(() => mtsp.initialize()).toThrow();
  });

  it('register_token must use a unique token_id', () => {
    mtsp.caller = ADDRESS;
    mtsp.initialize();

    // Register token
    mtsp.register_token(
      tokenId,
      tokenName,
      symbol,
      decimals,
      maxSupply,
      false,
      ADDRESS
    );

    // Try to register the same token again
    expect(() =>
      mtsp.register_token(
        tokenId,
        tokenName,
        symbol,
        decimals,
        maxSupply,
        false,
        ADDRESS
      )
    ).toThrow();

    // Register a different token
    mtsp.register_token(
      'token_id_2',
      tokenName,
      symbol,
      decimals,
      maxSupply,
      false,
      ADDRESS
    );
  });

  it('mint should increase the balance of the user', () => {
    mtsp.caller = ADDRESS;
    mtsp.initialize();

    // Register token
    mtsp.register_token(
      tokenId,
      tokenName,
      symbol,
      decimals,
      maxSupply,
      false,
      ADDRESS
    );

    // Mint tokens
    mtsp.mint_public(tokenId, ADDRESS, BigInt(1000), u32Max);

    // Check the balance of the user
    const balanceKey: TokenOwner = {
      account: ADDRESS,
      token_id: tokenId,
    };
    const balance = mtsp.authorized_balances.get(JSON.stringify(balanceKey));
    expect(balance?.balance).toBe(BigInt(1000));
  });

  it('burn should decrease the balance of the user', () => {
    mtsp.caller = ADDRESS;
    mtsp.initialize();

    // Register token
    mtsp.register_token(
      tokenId,
      tokenName,
      symbol,
      decimals,
      maxSupply,
      false,
      ADDRESS
    );

    // Mint tokens
    mtsp.mint_public(tokenId, ADDRESS, BigInt(1000), u32Max);

    // Check the balance of the user
    const balanceKey: TokenOwner = {
      account: ADDRESS,
      token_id: tokenId,
    };
    const balance = mtsp.authorized_balances.get(JSON.stringify(balanceKey));
    expect(balance?.balance).toBe(BigInt(1000));

    // Burn tokens
    mtsp.burn_public(tokenId, ADDRESS, BigInt(500));

    // Check the balance of the user
    const updatedBalance = mtsp.authorized_balances.get(JSON.stringify(balanceKey));
    expect(updatedBalance?.balance).toBe(BigInt(500));
  });
});
