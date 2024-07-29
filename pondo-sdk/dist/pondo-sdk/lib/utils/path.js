import path from 'path';
import { fileURLToPath, } from 'url';
import fsExists from 'fs.promises.exists';
import fs from 'fs.promises';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const programsCacheDir = `${__dirname}/../../../../cache`;
export const createDir = async (dir_path) => {
    const exists = await fsExists(dir_path);
    if (!exists) {
        await fs.mkdir(dir_path, { recursive: true });
    }
};
