import { ProgramManager } from '@demox-labs/aleo-sdk';


export async function authorizeTransaction(
  aleoPrivateKey, programCode, functionName, inputs, feeCredits, feeRecord, imports
) {
  const authJson = await ProgramManager.authorize_transaction(
    aleoPrivateKey,
    programCode,
    functionName,
    inputs,
    feeCredits,
    feeRecord,
    imports
  );
  const auth = JSON.parse(authJson);
  return {
    authorization: auth.authorization,
    feeAuthorization: auth.fee_authorization
  }
}

/*
export const executeProgramOffchain = async (
  program_source,
  function_name,
  inputs,
) => {
  const programManager = new ProgramManager();
  const keypair = programManager.synthesizeKeys(
    "TestnetV0",
    program_source,
    function_name
  );

  const pv = new PrivateKey("TestnetV0");

  const executionResponse = await ProgramManager.build_execution(
    pv,
    program_source,
    function_name,
    inputs,
    "https://api.explorer.aleo.org/v1",
    [],
    null,
    null,
    null
  );
  const result = executionResponse.getOutputs();
  return result;
}
*/