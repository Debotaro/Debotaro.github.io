import { test, expect } from '@playwright/test';
test('NOVA creates tasks, searches, updates tasks with the assistant and tests automation', async ({
  page,
}) => {
  await page.goto('/nova-os/app/');
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await page.getByLabel('Task name', { exact: true }).fill('Portfolio smoke task');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(page.getByText('Portfolio smoke task', { exact: true })).toBeVisible();
  await page.keyboard.press('Control+k');
  await page.getByRole('textbox', { name: 'Search workspace' }).fill('Brand');
  await expect(page.getByRole('dialog')).toContainText('Brand refresh');
  await page.keyboard.press('Escape');
  await page.goto('/nova-os/app/assistant/');
  await page.getByLabel('Message NOVA').fill('Create task: Assistant smoke task');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText(/Task created in your workspace/)).toBeVisible();
  await page.goto('/nova-os/app/automations/');
  await page.getByRole('button', { name: 'Test flow', exact: true }).click();
  await expect(page.getByText('Notify the team → completed locally')).toBeVisible();
  await page.goto('/nova-os/app/projects/');
  await expect(page.getByText('Assistant smoke task', { exact: true })).toBeVisible();
});
test('ATLAS creates, moves, edits and filters a persisted task', async ({ page }) => {
  await page.goto('/atlas-ops/#/tasks');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Task name', { exact: true }).fill('Portfolio ops smoke task');
  await dialog.getByRole('button', { name: 'Create task', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search tasks' }).fill('Portfolio ops smoke task');
  await expect(page.getByText('Portfolio ops smoke task', { exact: true })).toBeVisible();
  const status = page.getByLabel('Status for Portfolio ops smoke task');
  await status.selectOption('Complete');
  await expect(status).toHaveValue('Complete');
  await page.reload();
  await page.getByRole('textbox', { name: 'Search tasks' }).fill('Portfolio ops smoke task');
  await expect(page.getByLabel('Status for Portfolio ops smoke task')).toHaveValue('Complete');
  await page.getByRole('button', { name: 'Edit Portfolio ops smoke task', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Task name', { exact: true })
    .fill('Edited ops smoke task');
  await page.getByRole('dialog').getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search tasks' }).fill('Edited ops smoke task');
  await expect(page.getByText('Edited ops smoke task', { exact: true })).toBeVisible();
});
test('NILA adds a transaction, exports the filtered data and edits a budget', async ({ page }) => {
  await page.goto('/nila-ledger/#/transactions');
  await page.getByRole('button', { name: 'Add transaction', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Merchant', { exact: true }).fill('Portfolio coffee');
  await dialog.getByLabel('Amount (£)', { exact: true }).fill('12.50');
  await dialog.getByLabel('Date', { exact: true }).fill('2026-10-07');
  await dialog.getByLabel('Category', { exact: true }).selectOption('Food & dining');
  await dialog.getByRole('button', { name: 'Add transaction', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search transactions' }).fill('Portfolio coffee');
  await expect(page.getByText('Portfolio coffee', { exact: true })).toBeVisible();
  await expect(page.locator('tbody')).toContainText('12.50');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export this view', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  await page.reload();
  await page.getByRole('textbox', { name: 'Search transactions' }).fill('Portfolio coffee');
  await expect(page.getByText('Portfolio coffee', { exact: true })).toBeVisible();
  await page.goto('/nila-ledger/#/budget');
  await page.getByRole('button', { name: 'Edit Food & dining budget', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Monthly budget (£)', { exact: true }).fill('750');
  await page.getByRole('dialog').getByRole('button', { name: 'Save budget', exact: true }).click();
  await expect(
    page.getByRole('slider', { name: 'Food & dining monthly budget', exact: true }),
  ).toHaveValue('75000');
});
test('Portfolio links all seven projects and category filters work', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.card:visible')).toHaveCount(7);
  await page.getByRole('button', { name: 'Brand experiences', exact: true }).click();
  await expect(page.locator('.card:visible')).toHaveCount(3);
  await expect(page.locator('#project-count')).toContainText('3 brand experiences');
  await page.getByRole('button', { name: 'Product systems', exact: true }).click();
  await expect(page.locator('.card:visible')).toHaveCount(4);
  await expect(page.locator('#project-count')).toContainText('4 product systems');
  await page.getByRole('button', { name: 'All projects', exact: true }).click();
  for (const href of [
    'relay-os/',
    'nova-os/',
    'atlas-ops/',
    'nila-ledger/',
    'aura/',
    'vanta/',
    'rasa/',
  ])
    await expect(page.locator(`a.card[href="${href}"]`)).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  ).toBeTruthy();
});
for (const route of [
  'relay-os/',
  'nova-os/app/',
  'atlas-ops/#/overview',
  'nila-ledger/#/dashboard',
])
  test(`${route} has no runtime errors or document overflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/' + route, { waitUntil: 'networkidle' });
    await expect(page.locator('main')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBeTruthy();
    expect(errors).toEqual([]);
  });
