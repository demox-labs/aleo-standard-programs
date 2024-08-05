import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ledgerPath = process.env.SNARKOS_PATH!;
const destinationPath = process.env.LEDGER_BACKUPS_PATH!;

if (!ledgerPath || !destinationPath) {
    console.error('Please set SNARKOS_PATH and LEDGER_BACKUPS_PATH in your .env file.');
    process.exit(1);
}

const subfolderName = process.argv[2];
if (!subfolderName) {
    console.error('Please provide a subfolder name as an argument.');
    process.exit(1);
}

const destinationSubfolder = path.join(destinationPath, subfolderName);

if (!fs.existsSync(destinationSubfolder)) {
    fs.mkdirSync(destinationSubfolder, { recursive: true });
}

const ledgerFilePattern = /^\.ledger/;

const readdir = promisify(fs.readdir);
const execPromise = promisify(exec);

async function copyLedgerFiles() {
    try {
        const files = await readdir(ledgerPath);
        for (const file of files) {
            if (ledgerFilePattern.test(file)) {
                const sourceFile = path.join(ledgerPath, file);
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
