import { getProgram } from '../../aleo/client';
import fs from 'fs';
import { createTwoFilesPatch } from 'diff';
import path from 'path';

const pondoPrograms = [
  "token_registry.aleo",
  "wrapped_credits.aleo",
  "validator_oracle.aleo",
  "paleo_token.aleo",
  "pondo_protocol_token.aleo",
  "delegator1.aleo",
  "delegator2.aleo",
  "delegator3.aleo",
  "delegator4.aleo",
  "delegator5.aleo",
  "pondo_protocol.aleo",
  "reference_delegator.aleo",
];

const oldPondoPrograms = [
  "multi_token_support_program.aleo",
  "mtsp_credits.aleo",
  "pondo_oracle.aleo",
  "pondo_staked_aleo_token.aleo",
  "pondo_token.aleo",
  "pondo_delegator1.aleo",
  "pondo_delegator2.aleo",
  "pondo_delegator3.aleo",
  "pondo_delegator4.aleo",
  "pondo_delegator5.aleo",
  "pondo_core_protocol.aleo",
  "reference_delegatornkpuru.aleo"
];

const newProgramToOldProgramMap = {
  "token_registry.aleo": "multi_token_support_program.aleo",
  "wrapped_credits.aleo": "mtsp_credits.aleo",
  "validator_oracle.aleo": "pondo_oracle.aleo",
  "paleo_token.aleo": "pondo_staked_aleo_token.aleo",
  "pondo_protocol_token.aleo": "pondo_token.aleo",
  "delegator1.aleo": "pondo_delegator1.aleo",
  "delegator2.aleo": "pondo_delegator2.aleo",
  "delegator3.aleo": "pondo_delegator3.aleo",
  "delegator4.aleo": "pondo_delegator4.aleo",
  "delegator5.aleo": "pondo_delegator5.aleo",
  "pondo_protocol.aleo": "pondo_core_protocol.aleo",
  "reference_delegator.aleo": "reference_delegatornkpuru.aleo",
};

const oldProgramAddresses = [
  'aleo10s82sqc2yp67kq4w56k4h5rna55vqsmd9xq4dz6fsgf69w7r7yys60rpz5', // multi_token_support_program.aleo
  'aleo1qj5kef9c72e7szmcjyg730a99gkm90yp2pzht4zfp43c7p45dqqsh60nt7', // mtsp_credits.aleo
  'aleo1uz3hqa3yj6d09dapg2kqlu56jvnc86sxdx7vc9nljcng7a0k4srqa4lxq5', // pondo_oracle.aleo
  'aleo19pk6q22kk5vdwpkuh3ag8lmrvallu5kqpsm0t4f3ul6je3ec0gyqkvnycl', // pondo_staked_aleo_token.aleo
  'aleo1z7m9qvmpkdwpwe465j5hae7mgcfcp36mnguf7qe2r8qnjnch6crqt34tsk', // pondo_token.aleo
  'aleo15hmen38v5tlcw7qm6xklzsgegfsfnhrxumje5nr78jv478eyeyqsvj0w2x', // pondo_delegator1.aleo
  'aleo19tmr4mhyvlrhjet0nrtfnnf2y9tmm0k86y7n392zzhufcykafqyqmvyjmn', // pondo_delegator2.aleo
  'aleo1fpa8ylpdu79qfl4gd3x00mh9savw7f0c208gvktccwc0nawm558ql29ckc', // pondo_delegator3.aleo
  'aleo1pjam0gr659pyhqtf0eas2zsz04k3rfxagk2e7lyjua5n6y795uzs7fcksk', // pondo_delegator4.aleo
  'aleo1mpfm6vlxr0cl2l0q9lkuuu66dpszdyur9ywphpnm0g3zaq6wscysnwg5ct', // pondo_delegator5.aleo
  'aleo1a6rhakcgjqcfr869z9pznktnghpd7swc47pz884c3zup2xa8guzsmfhxeq', // pondo_core_protocol.aleo
]

const programDir = './programs';

// Ensure the old_programs directory exists
const outputDir = './old_programs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Ensure the diff directory exists
const diffDir = './program_diffs'
if (!fs.existsSync(diffDir)) {
  fs.mkdirSync(diffDir, { recursive: true });
}

// For each of the old programs, download the program and save it to ./old_programs
oldPondoPrograms.forEach(async (programName: string) => {
  const program = await getProgram(programName);
  fs.writeFileSync(`./old_programs/${programName}`, program);
});

// Helper function to generate and save diffs using createTwoFilesPatch
const generateAndSaveDiff = (oldFileName: string, newFileName: string, oldProgramContent: string, newProgramContent: string) => {
  const diff = createTwoFilesPatch(
    oldFileName,        // Old file name
    newFileName,        // New file name
    oldProgramContent,  // Old file content
    newProgramContent,  // New file content
    '',                 // Optional old header (not used)
    '',                 // Optional new header (not used)
    { context: 3 }      // Optional options for context lines
  );

  // Write the diff output to a file
  const diffFileName = `${newFileName}_vs_${oldFileName}.diff`;
  fs.writeFileSync(path.join(diffDir, diffFileName), diff);
};

const validateProgramContent = (programName: string, programContent: string) => {
  if (!programContent) {
    throw new Error('Program content is empty');
  }

  // Ensure that none of the programs contain the old program names
  oldPondoPrograms.forEach((oldProgramName) => {
    if (programContent.includes(oldProgramName)) {
      throw new Error(`Program: ${programName} content contains old program name: ${oldProgramName}`);
    }
  });

  // Ensure that none of the programs contain the old program addresses
  oldProgramAddresses.forEach((oldProgramAddress) => {
    if (programContent.includes(oldProgramAddress)) {
      throw new Error(`Program: ${programName} content contains old program address: ${oldProgramAddress}`);
    }
  });

  console.log(`Program: ${programName} content is valid`);
}

// Main diffing logic
pondoPrograms.forEach((newProgramName: string) => {
  const oldProgramName = newProgramToOldProgramMap[newProgramName];
  if (!oldProgramName) return;

  // Define paths to the program files
  const newProgramPath = path.join(programDir, newProgramName);
  const oldProgramPath = path.join(outputDir, oldProgramName);

  // Read the new and old program content from the file system
  const newProgramContent = fs.readFileSync(newProgramPath, 'utf8');
  const oldProgramContent = fs.readFileSync(oldProgramPath, 'utf8');

  // Generate the diff and save it
  generateAndSaveDiff(oldProgramName, newProgramName, oldProgramContent, newProgramContent);

  // Validate the program content
  validateProgramContent(newProgramName, newProgramContent);
});