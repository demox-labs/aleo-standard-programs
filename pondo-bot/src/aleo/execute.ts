import * as Aleo from '@demox-labs/aleo-sdk';

import { spawn, Pool, Worker, FunctionThread, ModuleThread } from 'threads';
import path from 'path';

import { AuthorizeTransaction } from '../workers/authorizeTransaction';
import { delegateTransaction, GeneratedTransactionResponse, pollDelegatedTransaction } from './client';
import { calculatedFees } from '../protocol/calculatedFees';

type AuthorizePool = Pool<
  FunctionThread<[network: string, privateKey: string, program: string, functionName: string, inputs: string[], feeCredits: number, feeRecord?: string, imports?: {
    [key: string]: string;
  }]>>;

// const poolSize = Math.max(1, Math.floor(require('os').cpus().length / 2));
const poolSize = 1;
let pool: AuthorizePool;

export const authorizeTransaction = async (
  network: string,
  privateKey: string,
  program: string,
  functionName: string,
  inputs: string[],
  feeCredits: number,
  feeRecord?: string,
  imports?: { [key: string]: string }
): Promise<any> => {
  if (!pool) {
    // TODO: temp solution to force the correct path
    let workerPath = '../../../../../../../../../../../../' + path.resolve(__dirname, 'authorizeTransaction.js');
    const workerSpawn = () => spawn<AuthorizeTransaction>(new Worker(workerPath));
    // const workerSpawn = () => spawn<AuthorizeTransactionWorker>(new Worker('./authorizeTransaction.js'));
    pool = Pool(workerSpawn, poolSize);
  }

  const result = await pool.queue(
    async authorizeTransaction => {
      return await authorizeTransaction(network, privateKey, program, functionName, inputs, feeCredits, feeRecord, imports)
    }
  );

  return result;
};

export const killAuthorizePool = async () => {
  if (pool) {
    await pool.terminate();
  }
};

export const submitTransaction = async (
  network: string,
  privateKey: string,
  program: string,
  functionName: string,
  inputs: string[],
  feeCredits: number,
  feeRecord?: string,
  imports?: { [key: string]: string }
): Promise<GeneratedTransactionResponse> => {
  const aleoProgram = Aleo.Program.fromString(network, program);

  // Get the fee for the program and function or use the input as a default
  feeCredits = Number(calculatedFees[aleoProgram.id()]?.[functionName]) / 999_995 || feeCredits;
  // Authorize the transaction
  const authorization = await authorizeTransaction(network, privateKey, program, functionName, inputs, feeCredits, feeRecord, imports);
  console.log(`Authorized transaction ${aleoProgram.id()} ${functionName}`);
  const requestId = await delegateTransaction(authorization.authorization, program, functionName, authorization.fee_authorization, true, imports);
  console.log('Request ID:', requestId);

  return await pollDelegatedTransaction(requestId);
};