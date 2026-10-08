import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function saved(page: Page, key: string) {
  return page.evaluate(name => JSON.parse(localStorage.getItem(name) || '{}'), key);
}
async function noOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
async function navigate(page: Page, name: string) {
  const menu = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('link', { name, exact: true }).click();
}

test('NOVA focus planning persists across views and keeps long saved profiles usable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/nova-os/app/');
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  const editor = page.getByRole('dialog');
  await editor.getByLabel('Task name', { exact: true }).fill('Focused release preparation');
  await editor.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(editor).not.toBeVisible();
  const task = (await saved(page, 'nova-os-v1')).tasks.find((item: any) => item.title === 'Focused release preparation');
  expect(task).toBeTruthy();
  await page.getByLabel('Focus task', { exact: true }).selectOption(task.id);
  await page.getByRole('button', { name: 'Complete focus task', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Daily agenda', exact: true })
    .getByRole('button', { name: 'Reopen Focused release preparation', exact: true })).toBeVisible();
  await expect(page.getByLabel('Focus task', { exact: true })).not.toHaveValue(task.id);
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const menu = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(page.getByRole('navigation', { name: 'Workspace navigation', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await expect(page.getByRole('navigation', { name: 'Workspace navigation', exact: true })).toBeHidden();
  }
  await navigate(page, 'Projects');
  await page.getByRole('textbox', { name: 'Search tasks', exact: true }).fill('Focused release preparation');
  await expect(page.getByRole('button', { name: 'Reopen Focused release preparation', exact: true })).toHaveCount(1);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect((await saved(page, 'nova-os-v1')).tasks.find((item: any) => item.id === task.id).status).toBe('Done');
  await noOverflow(page);
  const longName = 'W'.repeat(30);
  await page.evaluate(name => {
    const state = JSON.parse(localStorage.getItem('nova-os-v1')!);
    state.name = name;
    state.team = 'W'.repeat(40);
    localStorage.setItem('nova-os-v1', JSON.stringify(state));
  }, longName);
  await page.goto('/nova-os/app/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(longName);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await noOverflow(page);
    await expect(page.getByRole('button', { name: 'Complete focus task', exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('ATLAS console filters, exports, saves chart targets and edits an intervention', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/atlas-ops/#/overview');
  await page.getByLabel('Filter dashboard location', { exact: true }).selectOption('London');
  await page.getByLabel('Chart date range', { exact: true }).selectOption('7');
  await page.getByRole('button', { name: 'Operating costs', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Operating costs chart over 7 days. Data table follows.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit chart targets', exact: true }).click();
  const editor = page.getByRole('dialog');
  await editor.getByLabel('Revenue target (£ per point)', { exact: true }).fill('8500');
  await editor.getByLabel('Operating cost budget (£ per point)', { exact: true }).fill('4100');
  await editor.getByRole('button', { name: 'Save targets', exact: true }).click();
  await expect(editor).not.toBeVisible();
  expect((await saved(page, 'atlas-ops-v1')).settings).toMatchObject({ target: 8500, costBudget: 4100 });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('atlas-performance.csv');
  const filename = await download.path();
  expect(filename).toBeTruthy();
  const csv = await readFile(filename!, 'utf8');
  expect(csv).toContain('Revenue GBP');
  expect(csv.trim().split(/\r?\n/)).toHaveLength(8);
  await page.getByRole('button', { name: 'Edit Review supplier contracts', exact: true }).click();
  await editor.getByLabel('Task name', { exact: true }).fill('Review supplier handoff');
  await editor.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit Review supplier handoff', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open team coverage', exact: true }).click();
  await expect(page).toHaveURL(/#\/coverage$/);
  await navigate(page, 'Overview');
  await page.reload();
  expect((await saved(page, 'atlas-ops-v1')).settings).toMatchObject({ target: 8500, costBudget: 4100 });
  expect((await saved(page, 'atlas-ops-v1')).tasks.find((item: any) => item.id === 'OPS-101').title).toBe('Review supplier handoff');
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('RELAY visual project covers open the correct uploaded artwork and approval revision', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/relay-os/#/projects');
  const state = await saved(page, 'relay-os-workspace-v1');
  const project = state.projects.find((item: any) => item.title.startsWith('Luma'));
  await page.getByRole('button', { name: `Open ${project.title} designs`, exact: true }).click();
  await expect(page.getByLabel('Review project', { exact: true })).toHaveValue(project.id);
  await expect(page.getByLabel('Design canvas', { exact: true })).toHaveCount(0);
  await page.getByLabel('Upload design', { exact: true }).setInputFiles({
    name: 'studio-handoff.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGu0AAAAASUVORK5CYII=', 'base64'),
  });
  await expect(page.getByLabel('Design canvas', { exact: true })).toBeVisible();
  const asset = (await saved(page, 'relay-os-workspace-v1')).assets.find((item: any) => item.projectId === project.id);
  expect(asset).toBeTruthy();
  await navigate(page, 'Projects');
  await page.getByRole('button', { name: `Open ${project.title} designs`, exact: true }).click();
  await expect(page.getByLabel('Review project', { exact: true })).toHaveValue(project.id);
  await page.getByRole('button', { name: 'Request review', exact: true }).click();
  await page.getByRole('button', { name: 'Approve version', exact: true }).click();
  await expect.poll(async () => (await saved(page, 'relay-os-workspace-v1')).assets.find((item: any) => item.id === asset.id).status).toBe('approved');
  await page.reload();
  expect((await saved(page, 'relay-os-workspace-v1')).assets.find((item: any) => item.id === asset.id)).toMatchObject({ projectId: project.id, version: 1, status: 'approved' });
  await noOverflow(page);
  expect(errors).toEqual([]);
});
