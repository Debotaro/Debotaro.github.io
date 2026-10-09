import { test, expect } from '@playwright/test';

test('ATLAS defers chart code until the operational overview is opened', async ({ page }) => {
  const consoleRequests: string[] = [];
  page.on('request', (request) => {
    if (/OperationsConsole-[^/]+\.js/.test(request.url())) consoleRequests.push(request.url());
  });
  await page.goto('/atlas-ops/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: /Stay ahead of the signal/ })).toBeVisible();
  expect(consoleRequests).toHaveLength(0);
  await page.getByRole('button', { name: 'Explore the demo', exact: true }).click();
  await expect(page.getByRole('img', { name: /Revenue chart over/ })).toBeVisible();
  expect(consoleRequests).toHaveLength(1);
  await page.getByRole('button', { name: 'Operating costs', exact: true }).click();
  await expect(page.getByRole('img', { name: /Operating costs chart over/ })).toBeVisible();
});

test('RASA loads its optional globe near the viewport and preserves destination controls when it fails', async ({
  page,
}) => {
  let globeRequests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/cdn\.jsdelivr\.net\/npm\/three@/, async (route) => {
    globeRequests += 1;
    await gate;
    await route.abort();
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/rasa/', { waitUntil: 'networkidle' });
  expect(globeRequests).toBe(0);
  await page.locator('#globe-area').scrollIntoViewIfNeeded();
  await expect.poll(() => globeRequests).toBe(1);
  const kyoto = page
    .locator('#destination-tabs')
    .getByRole('button', { name: 'Kyoto', exact: true });
  await kyoto.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#destination-detail')).toContainText('The art of paying attention.');
  release();
  await expect(page.locator('#globe-note')).toContainText('Choose a destination below');
  await expect(page.locator('#globe-fallback')).toBeVisible();
  const sriLanka = page
    .locator('#destination-tabs')
    .getByRole('button', { name: 'Sri Lanka', exact: true });
  await sriLanka.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'See this journey', exact: true }).click();
  await expect(page.locator('#itinerary-days .day')).toHaveCount(7);
  expect(errors).toEqual([]);
});

test('NOVA keeps its server-rendered headline visible through normal-motion hydration', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const headline = document.querySelector('h1.hero-reveal');
      if (headline && Number(getComputedStyle(headline).opacity) < 0.99) {
        document.documentElement.dataset.testHeroHidden = 'true';
      }
    }).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style'],
    });
  });
  await page.goto('/nova-os/', { waitUntil: 'networkidle' });
  await expect(
    page.getByRole('heading', { name: /Less busywork. More possibility./ }),
  ).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-test-hero-hidden', 'true');
});
