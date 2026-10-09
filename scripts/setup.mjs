import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
for (const name of ['relay-os', 'nova-os', 'atlas-ops', 'nila-ledger']) {
  console.log(`Installing ${name}…`);
  const cwd = path.join(root, name);
  const action = existsSync(path.join(cwd, 'package-lock.json')) ? 'ci' : 'install';
  const windows = process.platform === 'win32';
  const result = spawnSync(
    windows ? 'cmd.exe' : 'npm',
    windows ? ['/d', '/s', '/c', `npm ${action}`] : [action],
    { cwd, stdio: 'inherit', windowsHide: true },
  );
  if (result.status !== 0) process.exit(result.status || 1);
}
