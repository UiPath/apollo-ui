import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
export const distIndex = join(packageRoot, 'dist/index.js');
export const distTheme = join(packageRoot, 'dist/theme.css');

let building: Promise<void> | undefined;

async function distReady(): Promise<boolean> {
  try {
    await access(distIndex);
    await access(distTheme);
    return true;
  } catch {
    return false;
  }
}

export function ensureDist(): Promise<void> {
  if (!building) {
    building = (async () => {
      if (await distReady()) {
        return;
      }
      await execFileAsync('pnpm', ['build'], { cwd: packageRoot });
    })();
  }
  return building;
}
