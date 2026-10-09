import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const windows = process.platform === 'win32';
const result = spawnSync(
  windows ? 'cmd.exe' : 'npm',
  windows ? ['/d', '/s', '/c', 'npm test'] : ['test'],
  { cwd: path.join(root, 'relay-os'), stdio: 'inherit', windowsHide: true },
);
if (result.error) {
  console.error(
    `Unable to run RELAY's domain and backend contract checks: ${result.error.message}`,
  );
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);
const storage = spawnSync(process.execPath, ['--test', 'atlas-ops/qa/storage.test.mjs'], {
  cwd: root,
  stdio: 'inherit',
  windowsHide: true,
});
if (storage.error) console.error(`Unable to run ATLAS storage checks: ${storage.error.message}`);
process.exit(storage.status ?? 1);
