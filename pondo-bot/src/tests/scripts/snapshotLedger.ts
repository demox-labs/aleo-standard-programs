import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const subfolderName = process.argv[2];
if (!subfolderName) {
  console.error("Please provide a name for the ledger backup as an argument.");
  process.exit(1);
}

const destinationSubfolder = path.join(__dirname + '/../saved-states', `${subfolderName}/ledger`);

if (!fs.existsSync(destinationSubfolder)) {
  fs.mkdirSync(destinationSubfolder, { recursive: true });
}

const ledgerFilePattern = /^\.ledger/;

const readdir = promisify(fs.readdir);
const execPromise = promisify(exec);

async function copyLedgerFiles() {
    try {
        const files = await readdir(__dirname + '/..');
        for (const file of files) {
            if (file.startsWith('.ledger') || file.startsWith('.history')) {
                const sourceFile = path.join(__dirname + '/..', file);
                const destFile = path.join(destinationSubfolder, file);

                try {
                    await execPromise(`cp -r ${sourceFile} ${destFile}`);
                    console.log(`Copied ${file} to ${destinationSubfolder}`);
                } catch (copyErr) {
                    console.error(`Error copying file ${file}:`, copyErr);
                }
            }
        }
    } catch (err) {
        console.error('Error reading the ledger directory:', err);
        process.exit(1);
    }
}

copyLedgerFiles();
