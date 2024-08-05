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
const backupPath = process.env.LEDGER_BACKUPS_PATH!;
const subfolderName = process.argv[2];

if (!ledgerPath || !backupPath) {
    console.error('Please set SNARKOS_PATH and LEDGER_BACKUPS_PATH in your .env file.');
    process.exit(1);
}

if (!subfolderName) {
    console.error('Please provide a subfolder name as an argument.');
    process.exit(1);
}

const backupSubfolder = path.join(backupPath, subfolderName);

const readdir = promisify(fs.readdir);
const rm = promisify(fs.rm);
const execPromise = promisify(exec);

async function clearAndLoadLedgers() {
    try {
        // Clear existing ledger files in the destination directory
        const files = await readdir(ledgerPath);
        for (const file of files) {
            if (file.startsWith('.ledger') || file.startsWith('.logs') || file.startsWith('.current')) {
                const filePath = path.join(ledgerPath, file);
                await rm(filePath, { recursive: true, force: true });
                console.log(`Deleted ${filePath}`);
            }
        }

        // Copy the ledger files from the backup directory to the destination directory
        const backupFiles = await readdir(backupSubfolder);
        for (const file of backupFiles) {
            const sourceFile = path.join(backupSubfolder, file);
            const destFile = path.join(ledgerPath, file);
            try {
                await execPromise(`cp -r ${sourceFile} ${destFile}`);
                console.log(`Copied ${file} to ${ledgerPath}`);
            } catch (copyErr) {
                console.error(`Error copying file ${file}:`, copyErr);
            }
        }
    } catch (err) {
        console.error('Error during clear and load process:', err);
        process.exit(1);
    }
}

clearAndLoadLedgers();
