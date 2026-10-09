import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../reports/performance/', import.meta.url));
const before = JSON.parse(await fs.readFile(path.join(directory, 'before.json'), 'utf8'));
const after = JSON.parse(await fs.readFile(path.join(directory, 'after.json'), 'utf8'));
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const metrics = ['performance', 'fcpMs', 'lcpMs', 'tbtMs', 'cls', 'speedIndexMs', 'transferBytes'];
const pages = [...new Set(before.runs.map((run) => run.page))];
const versions = [...new Set([...before.runs, ...after.runs].map((run) => run.lighthouseVersion))];
if (versions.length !== 1)
  throw new Error('Before/after comparisons require one Lighthouse version.');
const results = pages.map((page) => {
  const phases = {};
  for (const [phase, report] of [
    ['before', before],
    ['after', after],
  ]) {
    const runs = report.runs.filter((run) => run.page === page);
    if (runs.length !== 3 || runs.some((run) => run.runtimeError))
      throw new Error(`Need three successful ${phase} runs for ${page}.`);
    phases[phase] = Object.fromEntries(
      metrics.map((metric) => [
        metric,
        {
          median: median(runs.map((run) => run[metric])),
          min: Math.min(...runs.map((run) => run[metric])),
          max: Math.max(...runs.map((run) => run[metric])),
        },
      ]),
    );
  }
  return {
    page,
    ...phases,
    transferReductionPercent:
      100 * (1 - phases.after.transferBytes.median / phases.before.transferBytes.median),
  };
});
const summary = {
  lighthouseVersion: versions[0],
  aggregation:
    'Median of three cold mobile lab navigations per page; each metric aggregated independently.',
  beforeFingerprint: before.buildFingerprint,
  afterFingerprint: after.buildFingerprint,
  results,
};
await fs.writeFile(path.join(directory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
const number = (value, digits = 0) =>
  value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const pair = (result, metric, format) =>
  `${format(result.before[metric].median)} → ${format(result.after[metric].median)}`;
const transferChange = (value) =>
  Math.abs(value) < 0.05 ? '≈0.0%' : `${value >= 0 ? '−' : '+'}${number(Math.abs(value), 1)}%`;
const lines = [
  '# Measured mobile lab comparison',
  '',
  `Lighthouse ${versions[0]}. Medians of three cold navigations per page, on the same machine and settings. These are local laboratory results, not field Core Web Vitals or measured INP.`,
  '',
  '| Page | Performance /100 | LCP, seconds | TBT, ms | CLS | Transfer, KiB | Transfer change |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...results.map(
    (result) =>
      `| ${result.page} | ${pair(result, 'performance', (value) => number(value))} | ${pair(result, 'lcpMs', (value) => number(value / 1000, 2))} | ${pair(result, 'tbtMs', (value) => number(value))} | ${pair(result, 'cls', (value) => number(value, 4))} | ${pair(result, 'transferBytes', (value) => number(value / 1024))} | ${transferChange(result.transferReductionPercent)} |`,
  ),
  '',
  'Before → after. Transfer counts resources requested during the lab navigation, including browser-selected lazy-image prefetches. It is not the entire page or repository size. See README.md for changes, environment, ranges, reproducibility and limits.',
  '',
];
await fs.writeFile(path.join(directory, 'comparison.md'), lines.join('\n'));
console.log(lines.join('\n'));
