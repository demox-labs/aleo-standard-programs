import {
  credits,
  coreProtocol,
  delegator1,
  delegator2,
  delegator3,
  delegator4,
  delegator5,
  MTSP,
  oracle,
  pALEO,
  PNDO,
} from '../../../simulator/src/contracts/pondoProgramsIndex.js';

import { PROGRAMS } from '../config/index.js';
import { snarkVMToJs } from './snarkvm.js';

let creditsInstance;
let coreProtocolInstance;
let delegator1Instance;
let delegator2Instance;
let delegator3Instance;
let delegator4Instance;
let delegator5Instance;
let MTSPInstance;
let oracleInstance;
let pALEOInstance;
let PNDOInstance;

let contracts;


export async function initializeContracts() {
  creditsInstance = new credits();

  oracleInstance = new oracle(creditsInstance);
  MTSPInstance = new MTSP(creditsInstance);

  delegator1Instance = new delegator1(oracleInstance, creditsInstance);
  delegator2Instance = new delegator2(oracleInstance, creditsInstance);
  delegator3Instance = new delegator3(oracleInstance, creditsInstance);
  delegator4Instance = new delegator4(oracleInstance, creditsInstance);
  delegator5Instance = new delegator5(oracleInstance, creditsInstance);
  pALEOInstance = new pALEO(MTSPInstance);
  PNDOInstance = new PNDO(MTSPInstance);
  coreProtocolInstance = new coreProtocol(
    delegator5Instance,
    delegator4Instance,
    delegator3Instance,
    delegator2Instance,
    delegator1Instance,
    PNDOInstance,
    pALEOInstance,
    oracleInstance,
    MTSPInstance,
    creditsInstance
  );

  creditsInstance.programId = PROGRAMS.credits.id;
  coreProtocolInstance.programId = PROGRAMS.coreProtocol.id;
  delegator1Instance.programId = PROGRAMS.delegator1.id;
  delegator2Instance.programId = PROGRAMS.delegator2.id;
  delegator3Instance.programId = PROGRAMS.delegator3.id;
  delegator4Instance.programId = PROGRAMS.delegator4.id;
  delegator5Instance.programId = PROGRAMS.delegator5.id;
  MTSPInstance.programId = PROGRAMS.mtsp.id;
  PNDOInstance.programId = PROGRAMS.pndo.id;
  pALEOInstance.programId = PROGRAMS.paleo.id;
  oracleInstance.programId = PROGRAMS.oracle.id;

  contracts = {
    creditsInstance,
    coreProtocolInstance,
    delegator1Instance,
    delegator2Instance,
    delegator3Instance,
    delegator4Instance,
    delegator5Instance,
    MTSPInstance,
    oracleInstance,
    pALEOInstance,
    PNDOInstance,
  };
  return contracts;
}

export async function initializeMappings(rpcProvider, presetMappingKeys, postFetchReplace) {
  if (postFetchReplace == null) postFetchReplace = {};
  const presetMappingValues = await getPresetMappingValues(
    rpcProvider, presetMappingKeys, postFetchReplace
  );
  for (const contract of Object.values(contracts)) {
    initializeContractMappings(contract, presetMappingValues);
  }
  return presetMappingValues;
}

function initializeContractMappings(contract, presetMappingValues) {
  for (const [mappingName, mapping] of Object.entries(contract)) {
    if (!(mapping instanceof Map)) continue;
    mapping.get = initializeMappingGetter(
      contract, mappingName, mapping, mapping.get.bind(mapping), presetMappingValues
    );
    const former_setter = mapping.set.bind(mapping);

    mapping.set = (key, value) => {
      mapping.set_once = true;
      former_setter(key, value);
    };
  }
}

function initializeMappingGetter(contract, mappingName, mapping, former_get, presetMappingValues) {
  return (key) => {
    if (mapping.set_once) return former_get(key);
    return presetMappingValues?.[contract.programId]?.[mappingName]?.[key];
  }
}


async function getPresetMappingValues(rpcProvider, presetMappingKeys, postFetchReplace) {
  const presetMappingValuesArray = await Promise.all(
    presetMappingKeys.map(
      async ([programId, mappingName, key]) => ([
        programId,
        mappingName,
        snarkVMToMapping(key, postFetchReplace),
        snarkVMToMapping(
          await getMappingValueOrUndefined(
            rpcProvider, { programId, mappingName, key }
          ),
          postFetchReplace
        )
      ])
    )
  );
  return presetMappingValuesArray.reduce(
    (prev, [programId, mappingName, key, value]) => {
      if (prev[programId] == null) prev[programId] = {};
      if (prev[programId][mappingName] == null) prev[programId][mappingName] = {};
      prev[programId][mappingName][key] = value;
      return prev;
    }, {}
  );
}



function snarkVMToMapping(snarkVMValue, postFetchReplace) {
  const jsValue = snarkVMToJs(snarkVMValue);
  return toMappingRec(jsValue, postFetchReplace);
}

function toMappingRec(jsValue, postFetchReplace) {
  const found = postFetchReplace?.[jsValue];
  if (found != null) {
    return found;
  }
  if (typeof jsValue === 'string') {
    for (const program of Object.values(PROGRAMS)) {
      jsValue = jsValue.replaceAll(program.address, program.id)
    }
  } else if (typeof jsValue === 'object') {
    return Object.fromEntries(
      Object.entries(jsValue).map(
        ([key, val]) => ([toMappingRec(key), toMappingRec(val)])
      )
    );
  }
  return jsValue;
}



async function getMappingValueOrUndefined(
  rpcProvider, { programId, mappingName, key }
) {
  try {
    return await rpcProvider.getMappingValue(programId, mappingName, key);
  } catch { }
  return undefined;
}