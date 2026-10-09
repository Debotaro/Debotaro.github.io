import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';

const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(
    results.violations.map((item) => ({
      id: item.id,
      impact: item.impact,
      targets: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

const experiences: { name: string; route: string; trigger: (page: Page) => Locator }[] = [
  { name: 'Portfolio', route: '/', trigger: (page) => page.locator('[data-case="nova"]') },
  {
    name: 'NOVA',
    route: '/nova-os/app/',
    trigger: (page) => page.getByRole('button', { name: 'New task', exact: true }),
  },
  {
    name: 'ATLAS',
    route: '/atlas-ops/#/tasks',
    trigger: (page) => page.getByRole('button', { name: 'Create task', exact: true }),
  },
  {
    name: 'RELAY',
    route: '/relay-os/#/tasks',
    trigger: (page) => page.getByRole('button', { name: 'New task', exact: true }),
  },
  {
    name: 'NILA',
    route: '/nila-ledger/#/transactions',
    trigger: (page) => page.getByRole('button', { name: 'Add transaction', exact: true }),
  },
  {
    name: 'AURA',
    route: '/aura/',
    trigger: (page) => page.getByRole('button', { name: 'Reserve your stay', exact: true }),
  },
  {
    name: 'VANTA',
    route: '/vanta/',
    trigger: (page) =>
      page.getByRole('button', { name: 'Choose size for The Volume Jacket', exact: true }),
  },
  {
    name: 'RASA',
    route: '/rasa/',
    trigger: (page) => page.getByRole('button', { name: 'Find my travel style', exact: true }),
  },
];

for (const experience of experiences) {
  test(`${experience.name}: accessible initial view, skip target and keyboard dialog lifecycle`, async ({
    page,
    browserName,
  }) => {
    await page.goto(experience.route, { waitUntil: 'networkidle' });
    await expectNoViolations(page);
    const skip = page
      .locator('a')
      .filter({ hasText: /^Skip to/ })
      .first();
    // Windows WebKit's default keyboard mode excludes links from Tab navigation.
    // Verify the skip link's focus/Enter behaviour without pretending to change
    // the OS preference. Chromium and Firefox verify first-Tab entry as well.
    if (browserName === 'webkit') await skip.focus();
    else await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    const focusStyle = await skip.evaluate((element) => {
      const style = getComputedStyle(element);
      return { width: parseFloat(style.outlineWidth), visible: style.outlineStyle !== 'none' };
    });
    expect(focusStyle.width).toBeGreaterThan(0);
    expect(focusStyle.visible).toBe(true);
    await page.keyboard.press('Enter');
    await expect
      .poll(() => page.evaluate(() => document.activeElement !== document.body))
      .toBe(true);

    const opener = experience.trigger(page);
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect
      .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
      .toBe(true);
    await expectNoViolations(page);
    // Native dialog may allow focus to browser chrome. Background page controls
    // must remain inert; browser chrome is represented by BODY in headless runs.
    for (let step = 0; step < 15; step++) {
      await page.keyboard.press('Tab');
      expect(
        await dialog.evaluate(
          (element) =>
            element.contains(document.activeElement) || document.activeElement === document.body,
        ),
      ).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(opener).toBeFocused();
  });
}

test('NOVA marketing preview and assistant use consecutive heading levels', async ({ page }) => {
  await page.goto('/nova-os/', { waitUntil: 'networkidle' });
  await expectNoViolations(page);
  await page.goto('/nova-os/app/assistant/', { waitUntil: 'networkidle' });
  await expectNoViolations(page);
});

test('NILA recent transaction table can receive keyboard focus for horizontal scrolling', async ({
  page,
}) => {
  await page.goto('/nila-ledger/#/dashboard', { waitUntil: 'networkidle' });
  await expectNoViolations(page);
  const tableRegion = page.getByRole('region', { name: 'Recent transactions table', exact: true });
  await tableRegion.focus();
  await expect(tableRegion).toBeFocused();
});

test('NOVA dark workspace retains readable contrast and named controls', async ({ page }) => {
  await page.goto('/nova-os/app/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  // WebKit can publish the theme attribute before inherited colours settle.
  // Assert the rendered theme rather than auditing an intermediate transition.
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(241, 236, 248)');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(24, 22, 31)');
  await expectNoViolations(page);
});

test('RELAY dark overview retains readable contrast and named priorities', async ({ page }) => {
  await page.goto('/relay-os/#/settings', { waitUntil: 'networkidle' });
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await page.goto('/relay-os/#/overview', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectNoViolations(page);
});
