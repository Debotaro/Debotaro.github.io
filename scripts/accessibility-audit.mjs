import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const phase = process.argv[2] || 'baseline';
if (!['baseline', 'after'].includes(phase)) throw new Error('Use baseline or after.');
const baseURL = process.env.AUDIT_BASE_URL || 'http://localhost:4173';
const reportDirectory = path.resolve('reports');
await mkdir(reportDirectory, { recursive: true });
const scenarios = [
  { name: 'Portfolio', route: '/' },
  {
    name: 'Portfolio case study',
    route: '/',
    prepare: (page) => page.locator('[data-case="nova"]').click(),
  },
  { name: 'NOVA landing', route: '/nova-os/' },
  { name: 'NOVA workspace', route: '/nova-os/app/' },
  {
    name: 'NOVA task editor',
    route: '/nova-os/app/',
    prepare: (page) => page.getByRole('button', { name: 'New task', exact: true }).click(),
  },
  { name: 'NOVA assistant', route: '/nova-os/app/assistant/' },
  { name: 'ATLAS overview', route: '/atlas-ops/#/overview' },
  { name: 'ATLAS tasks', route: '/atlas-ops/#/tasks' },
  {
    name: 'ATLAS task editor',
    route: '/atlas-ops/#/tasks',
    prepare: (page) => page.getByRole('button', { name: 'Create task', exact: true }).click(),
  },
  { name: 'RELAY overview', route: '/relay-os/#/overview' },
  { name: 'RELAY projects', route: '/relay-os/#/projects' },
  { name: 'RELAY tasks', route: '/relay-os/#/tasks' },
  {
    name: 'RELAY task editor',
    route: '/relay-os/#/tasks',
    prepare: (page) => page.getByRole('button', { name: 'New task', exact: true }).click(),
  },
  { name: 'NILA dashboard', route: '/nila-ledger/#/dashboard' },
  {
    name: 'NILA transaction editor',
    route: '/nila-ledger/#/transactions',
    prepare: (page) => page.getByRole('button', { name: 'Add transaction', exact: true }).click(),
  },
  { name: 'AURA landing', route: '/aura/' },
  {
    name: 'AURA enquiry',
    route: '/aura/',
    prepare: (page) => page.getByRole('button', { name: 'Reserve your stay', exact: true }).click(),
  },
  { name: 'VANTA landing', route: '/vanta/' },
  {
    name: 'VANTA size editor',
    route: '/vanta/',
    prepare: (page) =>
      page.getByRole('button', { name: 'Choose size for The Volume Jacket', exact: true }).click(),
  },
  { name: 'RASA landing', route: '/rasa/' },
  {
    name: 'RASA travel quiz',
    route: '/rasa/',
    prepare: (page) =>
      page.getByRole('button', { name: 'Find my travel style', exact: true }).click(),
  },
  {
    name: 'NOVA dark workspace',
    route: '/nova-os/app/',
    prepare: (page) =>
      page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click(),
  },
  {
    name: 'RELAY dark overview',
    route: '/relay-os/#/settings',
    prepare: async (page) => {
      await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
      await page.goto(`${baseURL}/relay-os/#/overview`, { waitUntil: 'networkidle' });
    },
  },
];
const results = [];
const browser = await chromium.launch();
const browserVersion = browser.version();
try {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    for (const scenario of scenarios) {
      const page = await context.newPage();
      try {
        await page.goto(`${baseURL}${scenario.route}`, { waitUntil: 'networkidle' });
        await page.locator('main').waitFor({ state: 'visible' });
        if (scenario.prepare) await scenario.prepare(page);
        const audit = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
          .analyze();
        const compact = (result) => ({
          id: result.id,
          impact: result.impact,
          description: result.description,
          help: result.help,
          helpUrl: result.helpUrl,
          tags: result.tags,
          nodes: result.nodes.map((node) => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
            any: node.any,
            all: node.all,
            none: node.none,
          })),
        });
        const result = {
          scenario: scenario.name,
          route: scenario.route,
          viewport: viewport.name,
          violations: audit.violations.map(compact),
          incomplete: audit.incomplete.map(compact),
          passes: audit.passes.map((item) => item.id),
        };
        results.push(result);
        console.log(
          `${viewport.name} ${scenario.name}: ${result.violations.length} rules / ${result.violations.reduce((count, item) => count + item.nodes.length, 0)} nodes`,
        );
      } catch (error) {
        results.push({
          scenario: scenario.name,
          route: scenario.route,
          viewport: viewport.name,
          error: String(error),
        });
        console.error(`${viewport.name} ${scenario.name}: ${error.message}`);
      } finally {
        await page.close();
      }
      await writeFile(
        path.join(reportDirectory, `accessibility-${phase}.json`),
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            baseURL,
            engine: 'Chromium',
            browserVersion,
            tool: '@axe-core/playwright',
            tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
            results,
          },
          null,
          2,
        ),
      );
    }
    await context.close();
  }
} finally {
  await browser.close();
}
const errors = results.filter((result) => result.error);
const totalViolations = results.reduce(
  (count, result) => count + (result.violations?.length || 0),
  0,
);
console.log(
  `${results.length} scans, ${totalViolations} rule occurrences, ${errors.length} scan errors. Saved reports/accessibility-${phase}.json.`,
);
if (errors.length || (phase === 'after' && totalViolations > 0)) process.exitCode = 1;
