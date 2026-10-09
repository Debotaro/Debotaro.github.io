// Run after starting the portfolio preview. Uses the root Playwright dev dependency.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, devices } from '@playwright/test';

const browser = await chromium.launch();
try {
  for (const profile of [{ viewport: { width: 1440, height: 1000 } }, devices['iPhone 13']]) {
    const page = await browser.newPage({ ...profile, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://localhost:4173/nila-ledger/#/transactions');
    await page.getByRole('button', { name: 'Add transaction', exact: true }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel('Merchant', { exact: true }).fill('Verification café');
    await dialog.getByLabel('Amount (£)', { exact: true }).fill('12.50');
    await dialog.getByRole('button', { name: 'Add transaction', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search transactions' }).fill('Verification café');
    await page.getByRole('button', { name: 'Edit Verification café', exact: true }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByLabel('Amount (£)', { exact: true }).fill('20.75');
    await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export this view', exact: true }).click();
    const download = await downloaded;
    const csv = await readFile(await download.path(), 'utf8');
    assert(csv.includes('Verification café') && csv.includes('20.75'));
    assert.equal(csv.trim().split('\r\n').length, 2);
    await page.goto('http://localhost:4173/nila-ledger/#/dashboard');
    assert((await page.locator('.metric-card').nth(2).textContent()).includes('£2,184.68'));
    await page.reload();
    assert((await page.locator('.metric-card').nth(2).textContent()).includes('£2,184.68'));
    await page.goto('http://localhost:4173/nila-ledger/#/transactions');
    await page.getByRole('textbox', { name: 'Search transactions' }).fill('Verification café');
    await page.getByRole('button', { name: 'Delete Verification café', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete transaction', exact: true })
      .click();
    assert.equal(await page.getByText('Verification café', { exact: true }).count(), 0);
    await page.goto('http://localhost:4173/nila-ledger/#/dashboard');
    assert((await page.locator('.metric-card').nth(2).textContent()).includes('£2,163.93'));
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      'Passed: ' +
        (profile.viewport?.width === 1440 ? 'desktop' : 'mobile') +
        ' transaction add/edit/delete, exact totals, reload persistence, and CSV content.',
    );
    await page.close();
  }
} finally {
  await browser.close();
}
