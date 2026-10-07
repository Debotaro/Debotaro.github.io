import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root,'dist');
const siteBase = (process.env.PORTFOLIO_SITE_BASE || '').replace(/\/$/,'');
if(siteBase && (!siteBase.startsWith('/') || siteBase.includes('..') || !/^\/[a-zA-Z0-9_/-]+$/.test(siteBase))) throw new Error('PORTFOLIO_SITE_BASE must be a URL path, for example /my-portfolio.');
mkdirSync(target, {recursive:true});
for (const name of ['relay-os', 'nova-os', 'atlas-ops', 'nila-ledger']) {
  console.log(`Building ${name}…`);
  const windows = process.platform === 'win32';
  const result = spawnSync(windows ? 'cmd.exe' : 'npm', windows ? ['/d','/s','/c','npm run build'] : ['run','build'], { cwd:path.join(root,name), stdio:'inherit', windowsHide:true, env:{...process.env, ...(name === 'nova-os' ? {PORTFOLIO_BASE_PATH:`${siteBase}/nova-os`} : {})} });
  if (result.status !== 0) process.exit(result.status || 1);
  cpSync(path.join(root,name,name === 'nova-os'?'out':'dist'),path.join(target,name),{recursive:true});
}
for (const name of ['aura','vanta','rasa','previews','assets','data','downloads']) cpSync(path.join(root,name),path.join(target,name),{recursive:true});
cpSync(path.join(root,'index.html'),path.join(target,'index.html'));
writeFileSync(path.join(target,'.nojekyll'),'');
console.log('All seven projects built. Run npm run preview, then open http://localhost:4173.');
