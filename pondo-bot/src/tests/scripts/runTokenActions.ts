import {
  transferPaleo,
  transferPondo,
  burnPondo,
  mintPondo,
} from '../../protocol/tokenActions';

const [action, signer, address, amount] = process.argv.slice(2);

enum TOKEN_ACTION_TYPES {
  transfer_paleo = 'transfer_paleo',
  transfer_pondo = 'transfer_pondo',
  burn_pondo = 'burn_pondo',
  mint_pondo = 'mint_pondo',
}

async function main(
  action: TOKEN_ACTION_TYPES,
  signer: string,
  address: string,
  amount: string
) {
  switch (action) {
    case TOKEN_ACTION_TYPES.transfer_paleo:
      await transferPaleo(signer, address, BigInt(amount));
      break;
    case TOKEN_ACTION_TYPES.transfer_pondo:
      await transferPondo(signer, address, BigInt(amount));
      break;
    case TOKEN_ACTION_TYPES.mint_pondo:
      await mintPondo(signer);
      break;
    case TOKEN_ACTION_TYPES.burn_pondo:
      await burnPondo(signer, address, BigInt(amount));
      break;
  }
}

main(TOKEN_ACTION_TYPES[action], signer, address, amount);
