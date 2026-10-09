import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { siteFingerprint } from './performance-site-fingerprint.mjs';

// Lighthouse is a lab measurement, not field Core Web Vitals certification.
// Run sequentially against one frozen production build, without concurrent tests.
const root = fileURLToPath(new URL('../', import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, value, i, all) => {
    if (value.startsWith('--')) pairs.push([value.slice(2), all[i + 1]]);
    return pairs;
  }, []),
);
const phase = args.phase || 'after';
if (!/^[a-z0-9-]+$/i.test(phase)) throw new Error('Use a simple phase name.');
const runs = Number(args.runs || 3);
if (!Number.isInteger(runs) || runs < 1 || runs > 10) throw new Error('Runs must be 1–10.');
const port = Number(args.port || 4175);
const base = args.base || `http://127.0.0.1:${port}`;
const site = path.resolve(root, args.site || 'dist');
const toolRequire = createRequire(
  args['lighthouse-root']
    ? path.resolve(root, args['lighthouse-root'], 'package.json')
    : import.meta.url,
);
const { default: lighthouse } = await import(pathToFileURL(toolRequire.resolve('lighthouse')).href);
const { launch } = await import(pathToFileURL(toolRequire.resolve('chrome-launcher')).href);
const pages = [
  ['portfolio', '/'],
  ['nova', '/nova-os/'],
  ['atlas', '/atlas-ops/'],
  ['relay', '/relay-os/'],
  ['nila', '/nila-ledger/'],
  ['aura', '/aura/'],
  ['vanta', '/vanta/'],
  ['rasa', '/rasa/'],
].filter(([name]) => !args.pages || args.pages.split(',').includes(name));
const reportDir = path.join(root, 'reports/performance');
const rawDir = path.join(root, 'output/performance', phase);
await fs.mkdir(reportDir, { recursive: true });
await fs.mkdir(rawDir, { recursive: true });
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
let server;
if (!args.base) {
  server = http.createServer(async (req, res) => {
    try {
      const requestPath = decodeURIComponent(new URL(req.url, base).pathname);
      let filename = path.resolve(site, `.${requestPath}`);
      if (path.relative(site, filename).startsWith('..')) throw new Error('Outside site');
      if ((await fs.stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
      const bytes = await fs.readFile(filename);
      res.writeHead(200, {
        'Content-Type': types[path.extname(filename)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(bytes);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
}
const chrome = await launch({
  chromePath: args.chrome,
  chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-extensions'],
});
const result = {
  phase,
  measuredAt: new Date().toISOString(),
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  sourceDirty:
    execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim().length >
    0,
  buildFingerprint: await siteFingerprint(site),
  environment: {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpu: os.cpus()[0].model,
    logicalCpus: os.cpus().length,
    node: process.version,
    server:
      'Local production build; no compression; Cache-Control: no-cache; cold navigation per run',
    site: path.relative(root, site),
    base,
    sequentialRuns: true,
  },
  methodology:
    'Lighthouse mobile simulated throttling; three cold navigations per page; median per metric. Third-party image/font responses use the real network. No field INP or 75th-percentile field CWV claim.',
  runs: [],
};
try {
  for (const [page, pathname] of pages) {
    for (let run = 1; run <= runs; run += 1) {
      const { lhr, report } = await lighthouse(`${base}${pathname}`, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance'],
        formFactor: 'mobile',
      });
      await fs.writeFile(path.join(rawDir, `${page}-${run}.json`), report);
      const auditValue = (id) => lhr.audits[id]?.numericValue ?? null;
      const record = {
        page,
        pathname,
        run,
        fetchTime: lhr.fetchTime,
        lighthouseVersion: lhr.lighthouseVersion,
        chromeVersion: lhr.environment.hostUserAgent,
        settings: lhr.configSettings,
        performance: Math.round((lhr.categories.performance.score || 0) * 100),
        fcpMs: auditValue('first-contentful-paint'),
        lcpMs: auditValue('largest-contentful-paint'),
        tbtMs: auditValue('total-blocking-time'),
        cls: auditValue('cumulative-layout-shift'),
        speedIndexMs: auditValue('speed-index'),
        transferBytes: auditValue('total-byte-weight'),
        runtimeError: lhr.runtimeError || null,
        warnings: lhr.runWarnings,
        opportunities: Object.entries(lhr.audits)
          .filter(([, a]) => a.details?.type === 'opportunity' && a.score !== 1)
          .map(([id, a]) => ({
            id,
            title: a.title,
            displayValue: a.displayValue,
            savingsMs: a.details.overallSavingsMs,
            savingsBytes: a.details.overallSavingsBytes,
            items: a.details.items,
          })),
        diagnostics: Object.fromEntries(
          [
            'largest-contentful-paint-element',
            'lcp-discovery-insight',
            'lcp-phases-insight',
            'network-requests',
            'image-delivery-insight',
            'font-display-insight',
            'layout-shifts',
            'unsized-images',
          ]
            .filter((id) => lhr.audits[id])
            .map((id) => [id, lhr.audits[id]]),
        ),
      };
      result.runs.push(record);
      await fs.writeFile(
        path.join(reportDir, `${phase}.json`),
        JSON.stringify(result, null, 2) + '\n',
      );
      console.log(
        `${phase} ${page} ${run}/${runs}: performance=${record.performance}, LCP=${Math.round(record.lcpMs)}ms, TBT=${Math.round(record.tbtMs)}ms, CLS=${record.cls}, bytes=${record.transferBytes}`,
      );
    }
  }
} finally {
  await chrome.kill();
  if (server) await new Promise((resolve) => server.close(resolve));
}
