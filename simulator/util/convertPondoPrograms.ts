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

const coreProtocol = ['/pondo_protocol'];

const oracle = [/*'/validator_oracle',*/ '/reference_delegator'];

const delegators = [
  '/delegators/delegator1',
  '/delegators/delegator2',
  '/delegators/delegator3',
  '/delegators/delegator4',
  '/delegators/delegator5',
];

const tokens = ['/paleo_token', '/pondo_protocol_token'];

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
