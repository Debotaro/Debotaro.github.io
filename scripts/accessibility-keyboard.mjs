import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const phase = process.argv[2] || 'baseline';
if (!['baseline', 'after'].includes(phase)) throw new Error('Use baseline or after.');
const baseURL = process.env.AUDIT_BASE_URL || 'http://localhost:4173';
const scenarios = [
  { name: 'Portfolio', route: '/', trigger: '[data-case="nova"]' },
  { name: 'NOVA', route: '/nova-os/app/', trigger: 'role=button[name="New task"]' },
  { name: 'ATLAS', route: '/atlas-ops/#/tasks', trigger: 'role=button[name="Create task"]' },
  { name: 'RELAY', route: '/relay-os/#/tasks', trigger: 'role=button[name="New task"]' },
  {
    name: 'NILA',
    route: '/nila-ledger/#/transactions',
    trigger: 'role=button[name="Add transaction"]',
  },
  { name: 'AURA', route: '/aura/', trigger: 'role=button[name="Reserve your stay"]' },
  {
    name: 'VANTA',
    route: '/vanta/',
    trigger: 'role=button[name="Choose size for The Volume Jacket"]',
  },
  { name: 'RASA', route: '/rasa/', trigger: 'role=button[name="Find my travel style"]' },
];
const browser = await chromium.launch();
const results = [];
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
        await page.keyboard.press('Tab');
        await page
          .waitForFunction(
            () => {
              const box = document.activeElement.getBoundingClientRect();
              return (
                box.top >= 0 &&
                box.left >= 0 &&
                box.bottom <= innerHeight &&
                box.right <= innerWidth
              );
            },
            null,
            { timeout: 1500 },
          )
          .catch(() => {});
        const firstFocus = await page.evaluate(() => {
          const element = document.activeElement;
          const style = getComputedStyle(element);
          const box = element.getBoundingClientRect();
          return {
            text: element.textContent?.trim(),
            href: element.getAttribute('href'),
            outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
            visible:
              box.top >= 0 && box.left >= 0 && box.bottom <= innerHeight && box.right <= innerWidth,
          };
        });
        await page.keyboard.press('Enter');
        const skipTarget = await page.evaluate(() => ({
          tag: document.activeElement.tagName,
          id: document.activeElement.id,
          hash: location.hash,
        }));
        const trigger = page.locator(scenario.trigger);
        await trigger.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog');
        await dialog.waitFor({ state: 'visible' });
        const focusInsideOnOpen = await dialog.evaluate((element) =>
          element.contains(document.activeElement),
        );
        const tabStops = await dialog
          .locator(
            'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
          )
          .count();
        let backgroundControlsStayedInert = true;
        let browserChromeStops = 0;
        for (let index = 0; index < tabStops + 3; index++) {
          await page.keyboard.press('Tab');
          const focus = await dialog.evaluate((element) => ({
            inside: element.contains(document.activeElement),
            browserChrome: document.activeElement === document.body,
          }));
          backgroundControlsStayedInert &&= focus.inside || focus.browserChrome;
          if (focus.browserChrome) browserChromeStops++;
        }
        await page.keyboard.press('Escape');
        const closedByEscape = await dialog.isHidden();
        await page
          .waitForFunction(
            (element) => element === document.activeElement,
            await trigger.elementHandle(),
            { timeout: 1500 },
          )
          .catch(() => {});
        const focusRestored = await trigger.evaluate(
          (element) => element === document.activeElement,
        );
        results.push({
          scenario: scenario.name,
          route: scenario.route,
          viewport: viewport.name,
          firstFocus,
          skipTarget,
          focusInsideOnOpen,
          backgroundControlsStayedInert,
          browserChromeStops,
          closedByEscape,
          focusRestored,
        });
        console.log(
          `${viewport.name} ${scenario.name}: skip ${skipTarget.tag}#${skipTarget.id}, dialog focus ${focusInsideOnOpen}, background inert ${backgroundControlsStayedInert}, Escape ${closedByEscape}, restore ${focusRestored}`,
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
    }
    await context.close();
  }
} finally {
  await browser.close();
}
await mkdir(path.resolve('reports'), { recursive: true });
await writeFile(
  path.resolve('reports', `accessibility-keyboard-${phase}.json`),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseURL,
      engine: 'Chromium',
      scope: 'Keyboard-driven local browser review; no physical device or screen reader used.',
      results,
    },
    null,
    2,
  ),
);
const failures = results.filter(
  (result) =>
    result.error ||
    !result.firstFocus?.visible ||
    !result.focusInsideOnOpen ||
    !result.backgroundControlsStayedInert ||
    !result.closedByEscape ||
    !result.focusRestored ||
    result.skipTarget?.tag === 'BODY',
);
if (results.some((result) => result.error) || (phase === 'after' && failures.length))
  process.exitCode = 1;
