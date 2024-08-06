import { exec } from "child_process";
import { promisify } from "util";

const RPC_PATH = process.env.RPC_PATH;

if (!RPC_PATH) {
  console.error("Please set RPC_PATH in your .env file.");
  process.exit(1);
}

const RPC_BACKUPS_PATH =
  process.env.RPC_BACKUPS_PATH ?? __dirname + "/rpc-backups";

const backupName = process.argv[2];
if (!backupName) {
  console.error("Please provide a backup name as an argument.");
  process.exit(1);
}

async function swapRpcDb(backupFileName: string) {
  try {
    const execPromise = promisify(exec);
    await execPromise(
      `cd ${RPC_PATH} && BACKUP_DIR=${RPC_BACKUPS_PATH} BACKUP_FILE=${backupFileName}.sql yarn local-db-backup`
    );
    console.log("RPC DB restored successfully.");
  } catch (err) {
    console.error(`Error restoring rpc: ${err}`);
    process.exit(1);
  }
}

swapRpcDb(backupName);
