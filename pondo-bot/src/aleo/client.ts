import { JSONRPCClient } from 'json-rpc-2.0';
import { delay } from '../util';

import { MemberData } from './types';
import { CLIENT_URL, RPC_URL } from '../constants';


export const getClient = () => {
  const client = new JSONRPCClient((jsonRPCRequest: any) =>
    fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ ...jsonRPCRequest })
    }).then((response: any) => {
      if (response.status === 200) {
        // Use client.receive when you received a JSON-RPC response.
        return response.json().then((jsonRPCResponse: any) => client.receive(jsonRPCResponse));
      } else if (jsonRPCRequest.id !== undefined) {
        return Promise.reject(new Error(response.statusText));
      }
    })
  );
  return client;
};

let programCache: { [key: string]: string } = {};
/**
 * @param programId program id to fetch. e.g. program.aleo
 * @param chainId
 * @returns aleo instructions for program as a single string
 */
export async function getProgram(programId: string): Promise<string> {
  if (programCache[programId]) {
    return programCache[programId];
  }

  const client = getClient();
  const program = await client.request('program', {
    id: programId
  });

  programCache[programId] = program;

  return program;
}

export async function getMappingValue(
  mappingKey: string,
  programId: string = 'credits.aleo',
  mappingName: string = 'account',
  maxRetries: number = 5,
  baseDelay: number = 200
): Promise<string> {
  const client = getClient();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await delay(baseDelay * Math.pow(2, attempt - 1)); // Exponential backoff
      const response = (await client.request('getMappingValue', {
        program_id: programId,
        mapping_name: mappingName,
        key: mappingKey
      })) as string;

      return response; // Return response if successful
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Failed to get mapping value after ${maxRetries} attempts: ${error}`);
      }
    }
  }

  // This line should not be reached as the function will either return or throw an error
  throw new Error('Unexpected error in getMappingValue function');
}

export async function getPublicBalance(
  publicKey: string,
  programId: string = 'credits.aleo'
): Promise<bigint> {
  // Attempt to get the balance using the mapping value first
  try {
    const balanceString = await getMappingValue(publicKey, programId, 'account');
    return parseBalanceString(balanceString);
  } catch (error) {
    console.error('Error getting balance from getMappingValue, trying direct API call', error);
  }

  throw new Error('Failed to obtain balance from both getMappingValue and direct API call');
}

function parseBalanceString(balanceString: string): bigint {
  try {
    // Assuming the balance string format needs parsing similar to the original approach
    return BigInt(balanceString.slice(0, -3));
  } catch (e: any) {
    return BigInt(0);
  }
}

const MAX_TRANSACTION_PER_REQUEST = 1000;
export const getPublicTransactionsForAddress = async (
  programId: string,
  functionName: string,
  page: number = 0,
  maxTransactions: number = MAX_TRANSACTION_PER_REQUEST
): Promise<any[]> => {
  const client = getClient();
  try {
    const transactions = await client.request('aleoTransactionsForProgram', {
      programId,
      functionName,
      page,
      maxTransactions
    });
    return transactions;
  } catch (e: any) {
    console.log(`Error fetching transactions for program ${programId}: ${e}, ${functionName}, ${page}, ${maxTransactions}`);
    return [];
  }
};

export const getLatestCommittee = async (): Promise<MemberData> => {
  const client = getClient();
  const height = await client.request('getLatestCommittee', {});
  return height;
};

export const getHeight = async () => {
  const client = getClient();
  const height = await client.request('getHeight', {});
  return height;
};

export const getLatestBlock = async () => {
  const height = await getHeight();
  const client = getClient();
  const blocks = await client.request('getAleoBlocks', {
    start: height,
    end: height + 1
  });
  return blocks[0];
}

export const delegateTransaction = async (
  authorization: string,
  program: string,
  functionName: string,
  feeAuthorization?: string,
  broadcast: boolean = false,
  imports = {}
): Promise<string> => {
  const client = getClient();
  try {
    const requestId: string = await client.request('generateTransaction', {
      authorization,
      program,
      fee_authorization: feeAuthorization,
      function: functionName,
      broadcast,
      imports,
      url: CLIENT_URL
    });

    return requestId;
  } catch (e: any) {
    console.log(`Error delegating transaction: ${e}`);
    throw new Error('Error delegating transaction');
  }
};

export const delegateDeployTransaction = async (
  deployment: string,
  owner: string,
  feeAuthorization?: string,
  broadcast: boolean = false
): Promise<string> => {
  const client = getClient();
  try {
    const requestId: string = await client.request('generateTransaction', {
      // Transaction specific, left empty for deployment
      authorization: '',
      program: '',
      function: '',
      broadcast,
      imports: {},
      // Deployment specific
      deployment,
      fee_authorization: feeAuthorization,
      owner,
      url: CLIENT_URL
    });

    return requestId;
  } catch (e: any) {
    console.log(`Error delegating transaction: ${e}`);
    throw new Error('Error delegating transaction');
  }
};

export const delegateDeployment = async (program: string, imports = {}): Promise<string> => {
  const client = getClient();
  try {
    const requestId: string = await client.request('generateDeployment', {
      program,
      imports
    });

    return requestId;
  } catch (e: any) {
    console.log(`Error delegating deployment: ${e}`);
    throw new Error('Error delegating deployment');
  }
};

type GeneratedTransactionResponse = {
  transaction: string;
  status: string;
  error: string;
  updated_at: string;
};

export const getDelegatedTransaction = async (
  requestId: string
): Promise<GeneratedTransactionResponse> => {
  const client = getClient();
  try {
    const transaction = (await client.request('getGeneratedTransaction', {
      request_id: requestId
    })) as GeneratedTransactionResponse;
    return transaction;
  } catch {
    throw new Error('Transaction not found');
  }
};

type GeneratedDeploymentResponse = {
  deployment: string;
  status: string;
  error: string;
  updated_at: string;
};

export const getDelegatedDeployment = async (
  requestId: string
): Promise<GeneratedDeploymentResponse> => {
  const client = getClient();
  try {
    const deployment = (await client.request('getGeneratedDeployment', {
      request_id: requestId
    })) as GeneratedDeploymentResponse;
    return deployment;
  } catch {
    throw new Error('Transaction not found');
  }
};

export const pollDelegatedTransaction = async (
  requestId: string,
  retryTime: number = 5000
): Promise<GeneratedTransactionResponse> => {
  const transaction = await getDelegatedTransaction(requestId);
  if (transaction.status === 'Failed' || transaction.status === 'Completed' || transaction.status === 'Broadcasted') {
    console.log(transaction);
    return transaction;
  } else {
    console.log('Transaction status:', transaction.status);
  }
  await delay(retryTime);
  return await pollDelegatedTransaction(requestId);
};

export const pollDelegatedDeployment = async (
  requestId: string,
  pollingCallback?: () => Promise<void>,
  retryTime: number = 5000
): Promise<GeneratedDeploymentResponse> => {
  const deployment = await getDelegatedDeployment(requestId);
  if (deployment.status === 'Failed' || deployment.status === 'Completed') {
    return deployment;
  }
  await delay(retryTime);
  pollingCallback && (await pollingCallback());
  return await pollDelegatedDeployment(requestId);
};
