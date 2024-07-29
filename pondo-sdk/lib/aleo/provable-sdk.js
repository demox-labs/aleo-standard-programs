import {
  initThreadPool, ProvingKey, VerifyingKey, ProgramManager, Account
} from '@provablehq/sdk';

import { hashString } from "../utils/string"
import { programsCacheDir, createDir } from "../utils/path"
import fs from 'fs.promises';

await initThreadPool();
const programManager = new ProgramManager();

export const executeProgramOffchain = async (
  programSource,
  functionName,
  inputs,
) => {
  const [provingKey, verifyingKey] = await loadProgramKeys(
    programSource,
    functionName,
    inputs,
  );
  const response = await programManager.run(
    programSource,
    functionName,
    inputs,
    false,
    [],
    undefined,
    provingKey.copy(),
    verifyingKey.copy(),
    (new Account())._privateKey,
    null
  );
  const outputs = response.getOutputs();

  return outputs
}


export const loadProgramKeys = async (
  programSource,
  functionName,
  inputs,
) => {
  const programIdentifier = hashString(programSource);
  let provingKey, verifyingKey;
  try {
    [provingKey, verifyingKey] = await loadCachedProgramKeys(
      programIdentifier,
      functionName
    );
  } catch { }
  if (provingKey == null || verifyingKey == null) {
    [provingKey, verifyingKey] = await synthesizeKeys(
      programSource,
      functionName,
      inputs,
    );
  }
  return [provingKey, verifyingKey];
}

export async function synthesizeKeys(
  programSource,
  functionName,
  inputs,
) {
  const [provingKey, verifyingKey] = await programManager.synthesizeKeys(
    programSource,
    functionName,
    inputs,
  );
  const programIdentifier = hashString(programSource);
  await saveCachedProgramKeys(
    programIdentifier,
    functionName,
    provingKey,
    verifyingKey
  );
  return [provingKey, verifyingKey];
}


export const loadCachedProgramKeys = async (programIdentifier, functionName) => {
  const [provingKeyPath, verifyingKeyPath] = getKeyPaths(
    programIdentifier, functionName
  );
  const provingKey = ProvingKey.fromBytes(
    new Uint8Array(await fs.readFile(provingKeyPath))
  );
  const verifyingKey = VerifyingKey.fromBytes(
    new Uint8Array(await fs.readFile(verifyingKeyPath))
  );
  return [provingKey, verifyingKey];
}


export const saveCachedProgramKeys = async (
  programIdentifier, functionName, provingKey, verifyingKey
) => {
  const [provingKeyPath, verifyingKeyPath] = getKeyPaths(
    programIdentifier, functionName
  );
  await createDir(programsCacheDir);
  await fs.writeFile(provingKeyPath, provingKey.toBytes());
  await fs.writeFile(verifyingKeyPath, verifyingKey.toBytes());
  return [provingKey, verifyingKey];
}


const getKeyPaths = (programIdentifier, functionName) => {
  const provingKeyPath =
    `${programsCacheDir}/${programIdentifier}_${functionName}.prover`;
  const verifyingKeyPath =
    `${programsCacheDir}/${programIdentifier}_${functionName}.verifier`;
  return [provingKeyPath, verifyingKeyPath]
}

