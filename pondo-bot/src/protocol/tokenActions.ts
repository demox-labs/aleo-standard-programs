import { getMappingValue } from '../aleo/client';
import { submitTransaction } from '../aleo/execute';
import { resolveImports } from '../aleo/deploy';
import { NETWORK, PALEO_TOKEN_ID, PONDO_TOKEN_ID } from '../constants';
import { formatAleoString, getTokenOwnerHash } from '../util';
import {
  pondoDependencyTree,
  pondoPrograms,
  pondoProgramToCode,
} from '../compiledPrograms';

const MTSP_PROGRAM = pondoPrograms.find((program) =>
  program.includes('multi_token_support_program')
);
const MTSP_PROGRAM_CODE = pondoProgramToCode[MTSP_PROGRAM!];
const MTSP_PROGRAM_IMPORTS = pondoDependencyTree[MTSP_PROGRAM!];

export const transferPaleo = async (
  senderPrivateKey: string,
  recipient: string,
  amount: bigint
) => {
  const mtspResolvedImports = await resolveImports(MTSP_PROGRAM_IMPORTS);

  await submitTransaction(
    NETWORK!,
    senderPrivateKey,
    MTSP_PROGRAM_CODE,
    'transfer_public',
    [PALEO_TOKEN_ID, recipient, `${amount}u128`],
    3,
    undefined,
    mtspResolvedImports
  );
};

export const transferPondo = async (
  senderPrivateKey: string,
  recipient: string,
  amount: bigint
) => {
  const mtspResolvedImports = await resolveImports(MTSP_PROGRAM_IMPORTS);

  await submitTransaction(
    NETWORK!,
    senderPrivateKey,
    MTSP_PROGRAM_CODE,
    'transfer_public',
    [PONDO_TOKEN_ID, recipient, `${amount}u128`],
    3,
    undefined,
    mtspResolvedImports
  );
};

export const mintPondo = async (
  accountPrivateKey: string
) => {
  const PONDO_PROGRAM = pondoPrograms.find((program) =>
    program.includes('pondo_token')
  )!;
  const PONDO_PROGRAM_CODE = pondoProgramToCode[PONDO_PROGRAM];
  const resolvedImports = await resolveImports(
    pondoDependencyTree[PONDO_PROGRAM]
  );

  await submitTransaction(
    NETWORK!,
    accountPrivateKey,
    PONDO_PROGRAM_CODE,
    'mint_public',
    [],
    3,
    undefined,
    resolvedImports
  );
};

export const burnPondo = async (
  accountPrivateKey: string,
  address: string,
  burnAmount: bigint
) => {
  const PONDO_PROGRAM = pondoPrograms.find((program) =>
    program.includes('pondo_token')
  )!;
  const pondoBalanceKey = getTokenOwnerHash(PONDO_PROGRAM, PALEO_TOKEN_ID);
  const pondoBalanceMapping = await getMappingValue(
    pondoBalanceKey,
    MTSP_PROGRAM,
    'authorized_balances'
  );
  const pondoBalanceValue = BigInt(
    JSON.parse(formatAleoString(pondoBalanceMapping))['balance'].slice(0, -4)
  ); // the amount of pALEO minted to the Pondo pool
  const pondoMetadata = await getMappingValue(
    PONDO_TOKEN_ID,
    MTSP_PROGRAM,
    'registered_tokens'
  );
  const pondoSupply = BigInt(
    JSON.parse(formatAleoString(pondoMetadata))['supply'].slice(0, -4)
  );

  const paleoForBurn = (burnAmount * pondoBalanceValue) / pondoSupply;

  const PONDO_PROGRAM_CODE = pondoProgramToCode[PONDO_PROGRAM];
  const resolvedImports = await resolveImports(
    pondoDependencyTree[PONDO_PROGRAM]
  );

  await submitTransaction(
    NETWORK!,
    accountPrivateKey,
    PONDO_PROGRAM_CODE,
    'burn_public',
    [address, `${burnAmount}u128`, `${paleoForBurn}u128`],
    3,
    undefined,
    resolvedImports
  );
};
