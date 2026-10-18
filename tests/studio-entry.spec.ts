import { test, expect } from '@playwright/test';

test('Studio spotlight connects to the verified live application, source and evidence', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const spotlight = page.getByRole('article', { name: 'Debotaro Studio.' });
  await expect(spotlight).toBeVisible();
  await expect(spotlight).toContainText('Live application.');
  await expect(spotlight).toContainText('Server-saved workspaces');
  await expect(spotlight).toContainText('daily allowances');
  const live = spotlight.getByRole('link', { name: 'Open Studio' });
  await expect(live).toHaveAttribute('href', 'https://debotaro-studio.debotaro-studio.workers.dev');
  const caseStudy = spotlight.getByRole('link', { name: 'Read Studio case study' });
  const source = spotlight.getByRole('link', { name: 'View Studio source' });
  await expect(caseStudy).toHaveAttribute(
    'href',
    'https://github.com/Debotaro/debotaro-studio/blob/main/docs/CASE_STUDY.md',
  );
  await expect(source).toHaveAttribute('href', 'https://github.com/Debotaro/debotaro-studio');
  for (const link of [live, caseStudy, source]) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await expect(spotlight.getByRole('link')).toHaveCount(3);
  await expect(spotlight.getByRole('link', { name: /Open (Studio|demo|app)/i })).toHaveCount(1);
  const image = spotlight.getByRole('img');
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
    .toBe(1440);
  const imageResponse = await request.get((await image.getAttribute('src'))!);
  expect(imageResponse.ok()).toBeTruthy();
  expect(imageResponse.headers()['content-type']).toBe('image/png');
  expect((await imageResponse.body()).subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  await expect(spotlight.locator('figcaption')).toContainText('Actual product capture');
  await expect(page.locator('.featured-project')).toHaveCount(1);
  await expect(page.locator('[data-case]')).toHaveCount(11);
  await expect(page.locator('.card')).toHaveCount(10);
  await expect(page.locator('.card').first()).toHaveAttribute('href', 'relay-os/');
  await page.getByRole('button', { name: 'Brand experiences', exact: true }).click();
  await expect(spotlight).toBeVisible();
  await expect(page.locator('.card:visible')).toHaveCount(3);
  await page.getByRole('button', { name: 'All projects', exact: true }).click();
  await expect(page.locator('.card:visible')).toHaveCount(10);
  expect(errors).toEqual([]);
});

test('Studio evidence remains readable and keyboard reachable on small and large screens', async ({
  page,
  browserName,
}, testInfo) => {
  const spotlight = page.getByRole('article', { name: 'Debotaro Studio.' });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/#studio');
    await expect(page).toHaveURL(/\/#studio$/);
    // The public entry link must expose the article and heading beneath the sticky header.
    await expect
      .poll(async () => {
        const article = await spotlight.boundingBox();
        const header = await page.locator('.site-header').boundingBox();
        return article && header ? article.y - (header.y + header.height) : -1;
      })
      .toBeGreaterThanOrEqual(12);
    const headingBounds = await spotlight.getByRole('heading').boundingBox();
    expect(headingBounds!.y + headingBounds!.height).toBeLessThan(1000);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    const spotlightBounds = await spotlight.boundingBox();
    const imageBounds = await spotlight.getByRole('img').boundingBox();
    expect(spotlightBounds).not.toBeNull();
    expect(imageBounds).not.toBeNull();
    expect(spotlightBounds!.x).toBeGreaterThanOrEqual(0);
    expect(spotlightBounds!.x + spotlightBounds!.width).toBeLessThanOrEqual(width);
    expect(imageBounds!.width).toBeGreaterThan(150);
    const portfolioBounds = await page.locator('.featured-project').boundingBox();
    const collectionBounds = await page.locator('.workbar').boundingBox();
    expect(portfolioBounds!.y + portfolioBounds!.height).toBeLessThan(spotlightBounds!.y);
    expect(spotlightBounds!.y + spotlightBounds!.height).toBeLessThan(collectionBounds!.y);
    const caseStudy = spotlight.getByRole('link', { name: 'Read Studio case study' });
    await caseStudy.focus();
    await expect(caseStudy).toBeFocused();
    expect(await caseStudy.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe(
      'solid',
    );
    // Safari's default link-navigation shortcut is Option-Tab (Alt in Playwright).
    // https://support.apple.com/en-gb/guide/safari/cpsh003/27.0/mac/27
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    const source = spotlight.getByRole('link', { name: 'View Studio source' });
    await expect(source).toBeFocused();
    expect(await source.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe(
      'solid',
    );
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab');
    await expect(caseStudy).toBeFocused();
    if (width === 390 || width === 1440) {
      await spotlight.screenshot({ path: testInfo.outputPath(`studio-spotlight-${width}.png`) });
    }
  }
});
