import { pondoProgramToCode } from '../../../pondo-bot/src/compiledPrograms';


const RPC_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};


export class LiveRpcProvider {
  constructor(url) {
    this.url = url;
  }

  async callRPC(method, params) {
    const rawResponse = await fetch(
      this.url,
      {
        method: 'POST',
        headers: RPC_HEADERS,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method,
          params: params ? params : null
        })
      }
    );
    const response = await rawResponse.json();
    if (response.error) {
      throw new Error(`RPC API:\n${response.error.message || response.error}`);
    }
    return response?.result;
  }

  // Endpoints
  async aleoTransactionsForProgram({
    programId,
    functionName,
    page,
    maxTransactions
  }) {
    return await this.callRPC(
      "aleoTransactionsForProgram",
      { programId, functionName, page, maxTransactions }
    );
  }

  async getProgramCode(programId) {
    return (await this.callRPC('program', { id: programId }));
  }

  async generateTransaction(
    authorization,
    program,
    feeAuthorization,
    functionName,
    broadcast,
    imports
  ) {
    return await this.callRPC('generateTransaction', {
      authorization,
      program,
      fee_authorization: feeAuthorization,
      function: functionName,
      broadcast,
      imports
    });
  }

  async getGeneratedTransaction(transactionUUID) {
    return await this.callRPC('getGeneratedTransaction', {
      request_id: transactionUUID
    });
  }

  async getMappingValue(programId, mappingName, key) {
    return await this.callRPC('generateTransaction', {
      program_id: programId,
      mapping_name: mappingName,
      key,
    });
  }

  async latest_height() {
    return await this.callRPC('latest/height');
  }

  async chainStatus() {
    return await this.callRPC("chainStatus");
  }
}

LiveRpcProvider.from_url = async (url) => {
  const instance = new LiveRpcProvider(url);
  const status_res = await instance.chainStatus();
  if (!status_res?.online) {
    throw new Error(
      `RPC unavailable at '${url}'.`,
      status_res?.statusTitle,
      status_res?.statusMessage
    );
  }
  return instance;
}


export class TestRpcProvider {
  constructor(mappingValues, height = 0) {
    mappingValues = mappingValues || [];
    this.mappings = {};
    for (const [programId, mappingName, key, value] of mappingValues) {
      const localKey = `${programId};${mappingName};${key}`
      this.mappings[localKey] = value;
    }
    this.height = height;
  }

  async getProgramCode(programId) {
    return pondoProgramToCode[programId];
  }

  async getMappingValue(programId, mappingName, key) {
    const localKey = `${programId};${mappingName};${key}`
    return this.mappings?.[localKey];
  }

  async latest_height() {
    return this.height;
  }

  async generateTransaction(
    authorization,
    program,
    feeAuthorization,
    functionName,
    broadcast,
    imports
  ) {
    console.log('Generated Transaction:', {
      authorization,
      feeAuthorization,
    });
    return "0000-0000-0000-0000"
  }

  async chainStatus() {
    return {
      online: true,
      statusTitle: 'Everything is working as expected',
      statusMessage: 'There may be some temporary issues with the blockchain, but everything should be working as expected.',
      time: 1683831724746
    };
  }
}