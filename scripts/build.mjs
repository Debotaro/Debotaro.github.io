import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { minifyStaticEntries } from './production-minify.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'dist');
// Clear only this generated output, after checking both the absolute path and
// any existing junction/symlink target. Rebuilds must not retain stale chunks.
const workspace = realpathSync(root);
if (
  path.resolve(target) !== path.resolve(root, 'dist') ||
  (existsSync(target) && path.relative(workspace, realpathSync(target)) !== 'dist')
)
  throw new Error('Refusing to clean an output path outside the workspace dist directory.');
const siteBase = (process.env.PORTFOLIO_SITE_BASE || '').replace(/\/$/, '');
if (
  siteBase &&
  (!siteBase.startsWith('/') || siteBase.includes('..') || !/^\/[a-zA-Z0-9_/-]+$/.test(siteBase))
)
  throw new Error('PORTFOLIO_SITE_BASE must be a URL path, for example /my-portfolio.');
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const name of ['relay-os', 'nova-os', 'atlas-ops', 'nila-ledger']) {
  console.log(`Building ${name}…`);
  const windows = process.platform === 'win32';
  const result = spawnSync(
    windows ? 'cmd.exe' : 'npm',
    windows ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build'],
    {
      cwd: path.join(root, name),
      stdio: 'inherit',
      windowsHide: true,
      env: {
        ...process.env,
        ...(name === 'nova-os' ? { PORTFOLIO_BASE_PATH: `${siteBase}/nova-os` } : {}),
      },
    },
  );
  if (result.status !== 0) process.exit(result.status || 1);
  cpSync(path.join(root, name, name === 'nova-os' ? 'out' : 'dist'), path.join(target, name), {
    recursive: true,
  });
}
for (const name of ['aura', 'vanta', 'rasa', 'previews', 'assets', 'data', 'downloads'])
  cpSync(path.join(root, name), path.join(target, name), { recursive: true });
cpSync(path.join(root, 'index.html'), path.join(target, 'index.html'));
await minifyStaticEntries(target);
writeFileSync(path.join(target, '.nojekyll'), '');
console.log('All seven projects built. Run npm run preview, then open http://localhost:4173.');
