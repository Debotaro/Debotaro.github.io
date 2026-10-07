import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const windows = process.platform === 'win32';
const result = spawnSync(
  windows ? 'cmd.exe' : 'npm',
  windows ? ['/d', '/s', '/c', 'npm test'] : ['test'],
  { cwd: path.join(root, 'relay-os'), stdio: 'inherit', windowsHide: true }
);
if (result.error) {
  console.error(`Unable to run RELAY's domain and backend contract checks: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
