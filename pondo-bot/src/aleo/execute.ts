import * as Aleo from '@demox-labs/aleo-sdk';

import { spawn, Pool, Worker, FunctionThread, ModuleThread } from 'threads';
import path from 'path';

import { AuthorizeTransaction } from '../workers/authorizeTransaction';
import { delegateTransaction, pollDelegatedTransaction } from './client';

type AuthorizePool = Pool<
  FunctionThread<[network: string, privateKey: string, program: string, functionName: string, inputs: string[], feeCredits: number, feeRecord?: string, imports?: {
    [key: string]: string;
  }]>>;

const poolSize = Math.max(1, Math.floor(require('os').cpus().length / 2));
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

export const submitTransaction = async (
  network: string,
  privateKey: string,
  program: string,
  functionName: string,
  inputs: string[],
  feeCredits: number,
  feeRecord?: string,
  imports?: { [key: string]: string }
): Promise<any> => {
  // Authorize the transaction
  const authorization = await authorizeTransaction(network, privateKey, program, functionName, inputs, feeCredits, feeRecord, imports);
  const aleoProgram = Aleo.Program.fromString(network, program);
  console.log(`Authorized transaction ${aleoProgram.id()}.${functionName}`);
  const requestId = await delegateTransaction(authorization.authorization, program, functionName, authorization.fee_authorization, true, imports);
  console.log('Request ID:', requestId);

  return await pollDelegatedTransaction(requestId);
};