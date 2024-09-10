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