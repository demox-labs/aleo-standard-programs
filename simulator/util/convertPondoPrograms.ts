import { convertLeoToTs } from '../src/utils/leoToTSConverter';

enum ConvertOption {
  CoreProtocol = 'core',
  Oracle = 'oracle',
  Delegators = 'delegators',
  Tokens = 'tokens',
  All = 'all',
}

const prefix = '../pondo';
const args = process.argv.slice(2);

const coreProtocol = ['/pondo_core_protocol'];

const oracle = [/*'/pondo_oracle',*/ '/reference_delegator'];

const delegators = [
  '/delegators/pondo_delegator1',
  '/delegators/pondo_delegator2',
  '/delegators/pondo_delegator3',
  '/delegators/pondo_delegator4',
  '/delegators/pondo_delegator5',
];

const tokens = ['/pondo_staked_aleo_token', '/pondo_token'];

let programPaths: string[];

switch (args[0]) {
  case ConvertOption.CoreProtocol:
    programPaths = coreProtocol;
    break;
  case ConvertOption.Oracle:
    programPaths = oracle;
    break;
  case ConvertOption.Delegators:
    programPaths = delegators;
    break;
  case ConvertOption.Tokens:
    programPaths = tokens;
    break;
  case ConvertOption.All:
    programPaths = coreProtocol
      .concat(oracle)
      .concat(delegators)
      .concat(tokens);
    break;
}
const suffix = '/src/main.leo';

for (const programPath of programPaths!) {
  await convertLeoToTs(prefix + programPath + suffix);
}
