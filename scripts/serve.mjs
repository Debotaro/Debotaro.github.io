import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const production = existsSync(path.join(root,'dist/index.html'));
const base = production ? path.join(root,'dist') : root;
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon','.pdf':'application/pdf'};
http.createServer((req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    const requestPath = decodeURIComponent(url.pathname);
    let file = path.resolve(base,'.' + requestPath);
    const relative = path.relative(base,file);
    if(relative.startsWith('..') || path.isAbsolute(relative)) {res.writeHead(403);res.end();return;}
    if(!production) {
      for(const [name,out] of [['relay-os','dist'],['nova-os','out'],['atlas-ops','dist'],['nila-ledger','dist']]) {
        if(requestPath.startsWith(`/${name}/`)) file=path.join(root,name,out,requestPath.slice(name.length+2));
      }
    }
    if(existsSync(file) && statSync(file).isDirectory()) {
      if(!requestPath.endsWith('/')) {res.writeHead(302,{Location:url.pathname+'/'+url.search});res.end();return;}
      file=path.join(file,'index.html');
    }
    if(!existsSync(file) || !statSync(file).isFile()) {res.writeHead(404,{'Content-Type':'text/plain'});res.end('Page not found. Build the apps with npm run build before opening them.');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
    createReadStream(file).pipe(res);
  } catch {res.writeHead(400);res.end('Invalid request');}
}).listen(port,'127.0.0.1',()=>console.log(`Portfolio ${production?'build':'source'} preview: http://localhost:${port}`));
