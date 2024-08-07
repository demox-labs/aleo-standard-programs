import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

export const clearLedger = async () => {
  const readdir = promisify(fs.readdir);
  const rm = promisify(fs.rm);
  try {
    // Clear existing ledger files in the destination directory
    const files = await readdir('.');
    for (const file of files) {
      if (file.startsWith('.ledger') || file.startsWith('.logs') || file.startsWith('.current') || file.startsWith('.history')) {
          const filePath = path.join('.', file);
          await rm(filePath, { recursive: true, force: true });
      }
    }
  } catch (err) {
    console.error('Error during ledger clear process:', err);
    process.exit(1);
  }
}

export const loadLedger = async (ledgerFolderName: string) => {
  const readdir = promisify(fs.readdir);
  const execPromise = promisify(exec);
  const subfolderName = ledgerFolderName + '/ledger';

  const ledgerPath = '.';
  const backupPath = './saved-states';
  const backupSubfolder = path.join(backupPath, subfolderName);

  if (!subfolderName) {
      console.error('Please provide a subfolder name as an argument.');
      process.exit(1);
  }
    try {
      // Copy the ledger files from the backup directory to the destination directory
      const backupFiles = await readdir(backupSubfolder);
      for (const file of backupFiles) {
          const sourceFile = path.join(backupSubfolder, file);
          const destFile = path.join(ledgerPath, file);
          try {
              await execPromise(`cp -r ${sourceFile} ${destFile}`);
          } catch (copyErr) {
              console.error(`Error copying file ${file}:`, copyErr);
          }
      }
  } catch (err) {
      console.error('Error during clear and load process:', err);
      process.exit(1);
  }
}