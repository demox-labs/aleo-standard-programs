import { getTokenOwnerHash } from '../../util';

const [address, tokenId] = process.argv.slice(2);

console.log(getTokenOwnerHash(address, tokenId));
