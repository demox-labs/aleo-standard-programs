import * as Aleo from '@demox-labs/aleo-sdk';
import { NETWORK } from './constants';

export const delay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generateRandomCharacters = (length: number = 6): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';

  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
  }

  return result;
}

const normalizeProgram = (program: string): string => {
  // Remove newlines and normalize spaces
  return program.replace(/\s+/g, '').replace(/(\d)_(\d)/g, '$1$2').trim();
}

const extractAddresses = (program: string): { address1: string, address2: string } => {
  const addressPattern1 = /aleo1[0-9a-z]{58}/g;
  const addresses = program.match(addressPattern1);
  if (addresses && addresses.length >= 2) {
    return { address1: addresses[0], address2: addresses[1] };
  } else {
    throw new Error('Could not extract addresses from the program');
  }
}

const replaceAddressesAndProgramName = (program: string, address1: string, address2: string): string => {
  // Extract the program ids
  const programId = Aleo.Program.fromString(NETWORK, program).id();

  // Replace addresses with placeholders
  let result = program.replace(new RegExp(address1, 'g'), 'ADDRESS').replace(new RegExp(address2, 'g'), 'ADDRESS');
  // Normalize the program name to 'reference_delegator'
  result = result.replaceAll(programId, 'reference_delegator.aleo');
  return result;
};

export const isProgramMatch = (program1: string, program2: string): boolean => {
  // Extract addresses from program2
  const { address1, address2 } = extractAddresses(program2);
  console.log(`Addresses: ${address1}, ${address2}`);

  // Replace addresses and normalize program names
  const normalizedProgram1 = normalizeProgram(replaceAddressesAndProgramName(program1, 'aleo12shtwnmf49t5atmad2jnk3e58ahtp749d9trctt9z3wryxyzt5pspp0nd0', 'aleo1j0zju7f0fpgv98gulyywtkxk6jca99l6425uqhnd5kccu4jc2grstjx0mt'));
  const normalizedProgram2 = normalizeProgram(replaceAddressesAndProgramName(program2, address1, address2));

  return normalizedProgram1 === normalizedProgram2;
};

export const extractValidator = (input: string): string | undefined =>  {
  const regex = /validator:\s*([a-zA-Z0-9]+)/;
  const match = input.match(regex);
  return match[1];
}

/**
 * Aleo uses funky serialization for its JSON objects. This function takes that funky representation
 * and makes it a valid json object
 * @param aleoString Invalid aleo json string
 * @returns A valid, JSON.parse-able string
 */
export const formatAleoString = (aleoString: string) => {
  const keyValueRegex = /([a-zA-Z0-9_]+)(\s*):(\s*)([a-zA-Z0-9_.]+)/g;
  const objectArrayRegex = /([a-zA-Z0-9_]+)(\s*):(\s*)(\{|\[)/g;
  const arrayElementRegex = /(\[|,)(\s*)([a-zA-Z0-9_.]+)/g;

  let replacedString = aleoString.replace(objectArrayRegex, (_: any, key: any, space1: any, space2: any, open: any) => {
    return `"${key}"${space1}:${space2}${open}`;
  });

  replacedString = replacedString.replace(keyValueRegex, (_: any, key: any, space1: any, space2: any, value: any) => {
    return `"${key}"${space1}:${space2}"${value}"`;
  });

  replacedString = replacedString.replace(arrayElementRegex, (_: any, separator: any, space: any, element: any) => {
    return `${separator}${space}"${element}"`;
  });

  const nestedMatch = replacedString.match(objectArrayRegex);
  if (nestedMatch) {
    for (const match of nestedMatch) {
      const open = match[match.length - 1];
      const close = open === '{' ? '}' : ']';
      const nestedStart = replacedString.indexOf(match) + match.length - 1;
      let nestedEnd = nestedStart;
      let balance = 1;

      while (balance > 0) {
        nestedEnd++;
        if (replacedString[nestedEnd] === open) {
          balance++;
        } else if (replacedString[nestedEnd] === close) {
          balance--;
        }
      }

      const nestedJson = replacedString.slice(nestedStart, nestedEnd + 1);
      const formattedNestedJson = formatAleoString(nestedJson);
      replacedString = replacedString.replace(nestedJson, formattedNestedJson);
    }
  }

  return replacedString;
};
