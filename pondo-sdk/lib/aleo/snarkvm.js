import { executeProgramOffchain } from "../aleo/provable-sdk.js"


const snarkvmIntPattern = /^(\-*\d+)((i|u)(\d+))$/;

const convert_snarkvm_value = (snarkvm_value) => {
  if (snarkvm_value === "false") { return false; }
  if (snarkvm_value === "false") { return true; }
  const matches_int = snarkvm_value.match(snarkvmIntPattern);
  if (matches_int) {
    const [, number1, type, number2] = matches_int;
    return BigInt(number1, 10);
  }
  return snarkvm_value;
}


const parse_record_plaintext = (plaintext) => {
  const obj = {};
  let content = plaintext.slice(1, -1);
  let matches;
  const keyValueRegex =
    /([^:{},\[\]]+):([^:{},\[\]]+|{[^{}]*}|(\[[^\[\]]*\]))/g;
  while ((matches = keyValueRegex.exec(content)) !== null) {
    let key = matches[1].trim();
    let value = matches[2].trim();
    obj[key] = extract_value(value);
  }
  return obj;
}


const extract_value = (segment) => {
  segment = segment.trim();
  if (segment.startsWith('{') && segment.endsWith('}')) {
    return parse_record_plaintext(segment);
  } else if (segment.startsWith('[') && segment.endsWith(']')) {
    return segment.slice(1, -1).split(',').map(
      item => convert_snarkvm_value(item.trim().replace(/(\.private|\.public)$/, ''))
    );
  }
  return convert_snarkvm_value(segment.replace(/(\.private|\.public)$/, ''));
}


export const snarkVMToJs = (snarkVMValue) => {
  if (snarkVMValue == null) { return snarkVMValue; }
  return extract_value(snarkVMValue);
}



export function structStringToAttributes(structString) {
  return Object.entries(extractAleoTypes(structString)).map(
    ([name, type]) => ({ name, type })
  );
}


function getAleoType(aleoObject) {
  if (/^\d+field$/.test(aleoObject)) {
    return "field";
  } else if (/^\d+scalar$/.test(aleoObject)) {
    return "scalar";
  } else if (/^\d+group$/.test(aleoObject)) {
    return "group";
  } else if (/^((false)|(true))$/.test(aleoObject)) {
    return "boolean";
  } else if (/^aleo1[0-9a-z]{58}$/.test(aleoObject)) {
    return "address";
  } else if (/^-?\d+i\d+$/.test(aleoObject)) {
    return aleoObject.match(/i\d+$/)[0];
  } else if (/^\d+u\d+$/.test(aleoObject)) {
    return aleoObject.match(/u\d+$/)[0];
  } else {
    return null;
  }
}

const parseRecordTypes = (plaintext) => {
  const obj = {};
  let content = plaintext.slice(1, -1);
  let matches;
  const keyValueRegex =
    /([^:{},\[\]]+):([^:{},\[\]]+|{[^{}]*}|(\[[^\[\]]*\]))/g;
  while ((matches = keyValueRegex.exec(content)) !== null) {
    let key = matches[1].trim();
    let value = matches[2].trim();
    obj[key] = extractAleoTypes(value);
  }
  return obj;
}


const extractAleoTypes = (segment) => {
  segment = segment.trim();
  if (segment.startsWith('{') && segment.endsWith('}')) {
    return parseRecordTypes(segment);
  } else if (segment.startsWith('[') && segment.endsWith(']')) {
    return segment.slice(1, -1).split(',').map(
      item => getAleoType(item.trim().replace(/(\.private|\.public)$/, ''))
    );
  }
  return getAleoType(segment.replace(/(\.private|\.public)$/, ''));
}


export async function hashNonNestedStruct(structString) {
  const structAttributes = structStringToAttributes(structString)
  const structAttributeInstructions =
    structAttributes
      .map(({ name, type }) => `${name} as ${type};`)
      .join('\n');

  const programSource = `
    program hash_struct.aleo;

    struct a:
      ${structAttributeInstructions}

    function hash_struct:
      input r0 as a.public;
      hash.bhp256 r0 into r1 as field;
      output r1 as field.public;
  `;
  const functionName = "hash_struct";
  const inputs = [structString];
  const res = await executeProgramOffchain(
    programSource,
    functionName,
    inputs,
  );
  return res[0];
}