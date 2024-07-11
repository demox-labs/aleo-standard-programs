import { convertLeoToTs } from '../src/utils/leoToTSConverter';

const prefix = '../pondo';
const programPaths = [
  // '/pondo_staked_aleo_token',
  // '/pondo_token',
  //'/pondo_core_protocol',
  //'/pondo_oracle',
  '/reference_delegator',
  // '/delegators/pondo_delegator1',
  // '/delegators/pondo_delegator2',
  // '/delegators/pondo_delegator3',
  // '/delegators/pondo_delegator4',
  // '/delegators/pondo_delegator5'
];
const suffix = '/src/main.leo';

for (const programPath of programPaths) {
  await convertLeoToTs(prefix + programPath + suffix);
}