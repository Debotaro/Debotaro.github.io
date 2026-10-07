import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const appUrl = '/relay-os/';
const storageKey = 'relay-os-workspace-v1';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGu0AAAAASUVORK5CYII=', 'base64');
const image = (name = 'feedback-board.png') => ({ name, mimeType: 'image/png', buffer: png });
async function open(page: Page, route = 'overview') {
  await page.goto(`${appUrl}#/${route}`);
  await expect(page.locator('main')).toBeVisible();
}
async function navigate(page: Page, name: string) {
  const menu = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await menu.isVisible()) await menu.click();
  const label = name === 'Design review' ? /^Design review(?: \d+)?$/ : name;
  await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
}
async function noOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
async function saved(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), storageKey);
}
async function setRole(page: Page, role: string, returnTo?: string) {
  await navigate(page, 'Settings');
  await page.getByLabel('Demo role', { exact: true }).selectOption(role);
  if (returnTo) await navigate(page, returnTo);
}
async function createProject(page: Page, title: string) {
  await navigate(page, 'Projects');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Project name', { exact: true }).fill(title);
  await modal.getByLabel('Client', { exact: true }).fill('Portfolio QA');
  await modal.getByLabel('Description', { exact: true }).fill('A small local design review project.');
  await modal.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(modal).not.toBeVisible();
}
async function createTask(page: Page, title: string, project?: string) {
  await navigate(page, 'Tasks');
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Task name', { exact: true }).fill(title);
  if (project) await modal.getByRole('combobox', { name: 'Project', exact: true }).selectOption({ label: project });
  await modal.getByRole('combobox', { name: 'Priority', exact: true }).selectOption({ label: 'High' });
  await modal.getByLabel('Due date', { exact: true }).fill('2026-11-20');
  await modal.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(modal).not.toBeVisible();
}
async function postFeedback(page: Page, content: string, keyboard = false) {
  await page.getByRole('button', { name: 'Add a pin', exact: true }).click();
  const canvas = page.getByLabel('Design canvas', { exact: true });
  if (keyboard) {
    await canvas.focus();
    await page.keyboard.press('Enter');
  } else await canvas.click({ position: { x: 90, y: 80 } });
  await page.getByLabel('Feedback', { exact: true }).fill(content);
  await page.getByRole('button', { name: 'Post feedback', exact: true }).click();
}

test('RELAY creates and edits a dated task, persists it and removes it cleanly', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  const otherTab = await page.context().newPage();
  await open(otherTab, 'tasks');
  await createProject(page, 'QA launch');
  await createTask(page, 'Check launch accessibility', 'QA launch');
  await expect(page.getByLabel('Status for Check launch accessibility', { exact: true })).toBeVisible();
  await expect(otherTab.getByLabel('Status for Check launch accessibility', { exact: true })).toBeVisible();
  await page.getByLabel('Status for Check launch accessibility', { exact: true }).selectOption({ label: 'Done' });
  await expect(otherTab.getByLabel('Status for Check launch accessibility', { exact: true })).toHaveValue('done');
  await page.reload();
  await expect(page.getByLabel('Status for Check launch accessibility', { exact: true })).toHaveValue('done');
  expect((await saved(page)).tasks.find((task: any) => task.title === 'Check launch accessibility')).toMatchObject({ priority: 'high', dueDate: '2026-11-20', status: 'done' });
  await page.getByRole('button', { name: 'Edit Check launch accessibility', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Task name', { exact: true }).fill('Confirm launch accessibility');
  await modal.getByLabel('Due date', { exact: true }).fill('2026-11-21');
  await navigate(otherTab, 'Projects');
  await otherTab.getByRole('button', { name: 'Edit QA launch', exact: true }).click();
  const otherModal = otherTab.getByRole('dialog');
  await otherModal.getByRole('combobox', { name: 'Project status', exact: true }).selectOption('archived');
  await otherModal.getByRole('button', { name: 'Save project', exact: true }).click();
  await expect(page.getByLabel('Status for Check launch accessibility', { exact: true })).toBeDisabled();
  await modal.getByRole('button', { name: 'Save task', exact: true }).click();
  await expect(modal.getByRole('alert')).toContainText('Restore the archived project before editing its work.');
  await expect(modal).toBeVisible();
  expect((await saved(page)).tasks.find((task: any) => task.title === 'Check launch accessibility')).toMatchObject({ dueDate: '2026-11-20', status: 'done' });
  await otherTab.getByRole('button', { name: 'Edit QA launch', exact: true }).click();
  await otherModal.getByRole('combobox', { name: 'Project status', exact: true }).selectOption('active');
  await otherModal.getByRole('button', { name: 'Save project', exact: true }).click();
  await expect(page.getByLabel('Status for Check launch accessibility', { exact: true })).toBeEnabled();
  await modal.getByRole('button', { name: 'Save task', exact: true }).click();
  await otherTab.close();
  await expect(page.getByLabel('Status for Confirm launch accessibility', { exact: true })).toHaveValue('done');
  await expect(page.getByLabel('Status for Check launch accessibility', { exact: true })).toHaveCount(0);
  expect((await saved(page)).tasks.find((task: any) => task.title === 'Confirm launch accessibility')).toMatchObject({ dueDate: '2026-11-21', status: 'done' });
  await page.getByRole('button', { name: 'Delete Confirm launch accessibility', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete task', exact: true }).click();
  await expect(page.getByLabel('Status for Confirm launch accessibility', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Status for Confirm launch accessibility', { exact: true })).toHaveCount(0);
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('RELAY removes a project with its dependent task and leaves the other projects usable', async ({ page }) => {
  await open(page);
  await createProject(page, 'Temporary launch');
  await createTask(page, 'Temporary review task', 'Temporary launch');
  await navigate(page, 'Design review');
  await page.getByLabel('Review project', { exact: true }).selectOption({ label: 'Temporary launch' });
  await page.getByLabel('Upload design', { exact: true }).setInputFiles(image('temporary-review.png'));
  await expect(page.getByLabel('Design canvas', { exact: true })).toBeVisible();
  await postFeedback(page, 'Temporary project feedback', true);
  const beforeDelete = await saved(page);
  const projectId = beforeDelete.projects.find((item: any) => item.title === 'Temporary launch').id;
  expect(beforeDelete.assets.filter((item: any) => item.projectId === projectId)).toHaveLength(1);
  expect(beforeDelete.comments.filter((item: any) => item.projectId === projectId)).toHaveLength(1);
  await navigate(page, 'Projects');
  await page.getByRole('button', { name: 'Edit Temporary launch', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Project name', { exact: true }).fill('Temporary launch revised');
  await modal.getByRole('combobox', { name: 'Project status', exact: true }).selectOption('archived');
  await modal.getByRole('button', { name: 'Save project', exact: true }).click();
  await navigate(page, 'Tasks');
  await expect(page.getByLabel('Status for Temporary review task', { exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Edit Temporary review task', exact: true })).toHaveCount(0);
  await navigate(page, 'Design review');
  await expect(page.getByLabel('Upload design', { exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Add a pin', exact: true })).toBeDisabled();
  await expect(page.getByRole('article').filter({ hasText: 'Temporary project feedback' }).getByRole('button', { name: /^Create task from feedback/ })).toBeDisabled();
  await expect(page.locator('main')).toContainText('This project is archived.');
  await navigate(page, 'Projects');
  await page.getByRole('button', { name: 'Edit Temporary launch revised', exact: true }).click();
  await modal.getByRole('combobox', { name: 'Project status', exact: true }).selectOption('active');
  await modal.getByRole('button', { name: 'Save project', exact: true }).click();
  await navigate(page, 'Tasks');
  await expect(page.getByLabel('Status for Temporary review task', { exact: true })).toBeEnabled();
  await navigate(page, 'Projects');
  await page.getByRole('button', { name: 'Delete Temporary launch revised', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete project', exact: true }).click();
  await navigate(page, 'Tasks');
  await expect(page.getByLabel('Status for Temporary review task', { exact: true })).toHaveCount(0);
  await page.reload();
  await navigate(page, 'Projects');
  await expect(page.getByRole('button', { name: 'Edit Temporary launch revised', exact: true })).toHaveCount(0);
  await expect(page.locator('main').getByRole('heading', { name: 'Forma — Brand launch', exact: true }).first()).toBeVisible();
  const afterDelete = await saved(page);
  for (const list of ['tasks', 'assets', 'comments']) expect(afterDelete[list].filter((item: any) => item.projectId === projectId)).toHaveLength(0);
});

test('RELAY converts a pinned comment to one linked task and preserves the link after reload', async ({ page }) => {
  await open(page, 'review');
  const feedback = 'Raise the contrast of the primary call to action';
  await postFeedback(page, feedback);
  const comment = page.getByRole('article').filter({ hasText: feedback });
  await expect(comment).toBeVisible();
  const storedComment = (await saved(page)).comments.find((item: any) => item.body === feedback);
  expect(storedComment.x).toBeGreaterThanOrEqual(0);
  expect(storedComment.x).toBeLessThanOrEqual(1);
  expect(storedComment.y).toBeGreaterThanOrEqual(0);
  expect(storedComment.y).toBeLessThanOrEqual(1);
  const convert = comment.getByRole('button', { name: /^Create task from feedback/ });
  await convert.click();
  await expect(convert).toBeDisabled();
  await page.reload();
  await expect(comment.getByRole('button', { name: /^Create task from feedback/ })).toBeDisabled();
  await navigate(page, 'Tasks');
  await expect(page.getByLabel(`Status for ${feedback}`, { exact: true })).toHaveCount(1);
  await page.getByLabel(`Status for ${feedback}`, { exact: true }).selectOption({ label: 'Done' });
  await navigate(page, 'Design review');
  await expect(comment).toContainText(feedback);
  await expect(comment.getByRole('button', { name: /^Create task from feedback/ })).toBeDisabled();
  await noOverflow(page);
});

test('RELAY provides a keyboard path to image feedback and restores modal focus', async ({ page }) => {
  await open(page, 'review');
  await postFeedback(page, 'Keyboard feedback on the design', true);
  await expect(page.getByRole('article').filter({ hasText: 'Keyboard feedback on the design' })).toBeVisible();
  await expect(page.getByLabel('Design canvas', { exact: true })).toBeFocused();
  expect((await saved(page)).comments.find((item: any) => item.body === 'Keyboard feedback on the design')).toMatchObject({ x: 0.5, y: 0.5 });
  await navigate(page, 'Tasks');
  const trigger = page.getByRole('button', { name: 'New task', exact: true });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('RELAY command search opens with the keyboard, finds local work and closes accessibly', async ({ page }) => {
  await open(page);
  await createTask(page, 'Investigate command navigation');
  await page.keyboard.press('Control+k');
  const modal = page.getByRole('dialog');
  const search = modal.getByRole('textbox', { name: 'Search RELAY', exact: true });
  await expect(search).toBeFocused();
  await search.fill('Investigate command navigation');
  await expect(modal).toContainText('Investigate command navigation');
  await search.fill('no matching project anywhere');
  await expect(modal.getByRole('heading', { name: 'Nothing here just yet', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  for (let cycle = 0; cycle < 5; cycle++) {
    await page.keyboard.press('Control+k');
    await search.fill('Design review');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(modal.getByRole('button', { name: /^Design review/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/review$/);
    await expect(modal).not.toBeVisible();
  }
});

test('RELAY rejects unsafe and oversized design files without creating a revision', async ({ page }) => {
  await open(page, 'review');
  const before = await saved(page);
  const input = page.getByLabel('Upload design', { exact: true });
  await input.setInputFiles({ name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>') });
  await expect(page.getByRole('status')).toContainText(/PNG|JPEG|WebP|supported/i);
  await input.setInputFiles({ name: 'oversized.png', mimeType: 'image/png', buffer: Buffer.concat([png, Buffer.alloc(2 * 1024 * 1024)]) });
  await expect(page.getByRole('status')).toContainText(/large|MB|size/i);
  expect((await saved(page)).assets).toEqual(before.assets);
  await input.setInputFiles(image());
  await expect(page.getByRole('status')).toHaveText(/Design uploaded and ready for feedback\./);
  await expect.poll(async () => (await saved(page)).assets.length).toBe(before.assets.length + 1);
  await noOverflow(page);
});

test('RELAY keeps image revisions and approval decisions separate through a client handoff', async ({ page }) => {
  await open(page, 'review');
  await page.getByLabel('Upload revision', { exact: true }).setInputFiles(image('brand-direction-v2.png'));
  await expect(page.getByRole('status')).toHaveText(/New revision uploaded\./);
  await page.getByRole('button', { name: 'Request review', exact: true }).click();
  await setRole(page, 'client', 'Design review');
  await page.getByRole('button', { name: 'Request changes', exact: true }).click();
  await setRole(page, 'designer', 'Design review');
  await page.getByLabel('Upload revision', { exact: true }).setInputFiles(image('brand-direction-v3.png'));
  await expect(page.getByRole('status')).toHaveText(/New revision uploaded\./);
  await page.getByRole('button', { name: 'Request review', exact: true }).click();
  await setRole(page, 'client', 'Design review');
  await page.getByRole('button', { name: 'Approve version', exact: true }).click();
  const state = await saved(page);
  const versions = state.assets.filter((asset: any) => asset.name.includes('brand-direction') || asset.name === 'Forma / Brand direction');
  expect(versions).toHaveLength(3);
  expect(versions.map((asset: any) => asset.version)).toEqual([1, 2, 3]);
  expect(versions.map((asset: any) => asset.status)).toEqual(['review', 'changes', 'approved']);
  expect(versions[1].previousId).toBe(versions[0].id);
  expect(versions[2].previousId).toBe(versions[1].id);
  await page.reload();
  await expect(page.getByText('This version is approved. New work starts with a new revision.', { exact: true })).toBeVisible();
  const after = await saved(page);
  expect(after.assets).toEqual(state.assets);
  expect(after.activity.some((entry: any) => entry.body.includes('approved'))).toBe(true);
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Find your next move', exact: true });
  await palette.getByRole('textbox', { name: 'Search RELAY', exact: true }).fill('brand-direction-v2.png');
  await palette.getByRole('button', { name: /^brand-direction-v2\.png/ }).click();
  await expect(page.getByLabel('Design version', { exact: true })).toHaveValue(versions[1].id);
  await expect(page.getByRole('img', { name: 'Design version 2: brand-direction-v2.png', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve version', exact: true })).toHaveCount(0);
});

test('RELAY makes four demo roles explicit and restricts editing while allowing client feedback', async ({ page }) => {
  await open(page);
  await navigate(page, 'Settings');
  const role = page.getByLabel('Demo role', { exact: true });
  await expect(role).toHaveValue('pm');
  await role.selectOption('designer');
  await navigate(page, 'Projects');
  await expect(page.getByRole('button', { name: 'New project', exact: true })).toHaveCount(0);
  await navigate(page, 'Tasks');
  await expect(page.getByRole('button', { name: 'New task', exact: true })).toBeEnabled();
  await setRole(page, 'client', 'Tasks');
  await expect(page.getByRole('button', { name: 'New task', exact: true })).toHaveCount(0);
  await expect(page.getByLabel(/^Status for /).first()).toBeVisible();
  for (const select of await page.getByLabel(/^Status for /).all()) await expect(select).toBeDisabled();
  await navigate(page, 'Design review');
  await expect(page.getByLabel('Upload design', { exact: true })).toHaveCount(0);
  await postFeedback(page, 'Client feedback is still welcome');
  const comment = page.getByRole('article').filter({ hasText: 'Client feedback is still welcome' });
  await expect(comment).toBeVisible();
  await expect(comment.getByRole('button', { name: /^Create task from feedback/ })).toHaveCount(0);
  await setRole(page, 'admin', 'Projects');
  await expect(page.getByRole('button', { name: 'New project', exact: true })).toBeEnabled();
  await expect(page.locator('body')).toContainText(/Demo|simulation/i);
});

test('RELAY recovers invalid saved data with a visible explanation and a usable sample workspace', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken json'), storageKey);
  await open(page);
  await expect(page.locator('body')).toContainText(/Saved demo data was invalid/i);
  await expect(page.locator('main').getByRole('heading', { name: 'Forma — Brand launch', exact: true }).first()).toBeVisible();
  const recovered = await saved(page);
  expect(recovered.projects.length).toBeGreaterThan(0);
  await createTask(page, 'Task after storage recovery');
  expect((await saved(page)).tasks.some((task: any) => task.title === 'Task after storage recovery')).toBe(true);
});

test('RELAY keeps edits usable when persistence is unavailable and clearly labels session-only data', async ({ page }) => {
  await page.addInitScript(key => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Storage is disabled for this browser.', 'QuotaExceededError');
      return write.call(this, name, value);
    };
  }, storageKey);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  await expect(page.locator('body')).toContainText(/session|not.*saved/i);
  await createTask(page, 'Session-only review task');
  await expect(page.getByLabel('Status for Session-only review task', { exact: true })).toBeVisible();
  await page.reload();
  await navigate(page, 'Tasks');
  await expect(page.getByLabel('Status for Session-only review task', { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('RELAY handles a valid empty workspace without invalid metrics or dangling tasks', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ projects: [], tasks: [], assets: [], comments: [], activity: [] })), storageKey);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  await expect(page.locator('main')).not.toContainText('NaN');
  await navigate(page, 'Tasks');
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Create a project before adding a task.');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await saved(page)).tasks).toHaveLength(0);
  await navigate(page, 'Design review');
  await expect(page.getByLabel('Upload design', { exact: true })).toHaveCount(0);
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('RELAY renders every workspace route and modal at 320 pixels without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 844 });
  await open(page);
  const menu = page.getByRole('button', { name: 'Open navigation', exact: true });
  await expect(page.getByRole('navigation', { name: 'Workspace navigation', exact: true })).toBeHidden();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('navigation').getByRole('link', { name: 'Projects', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Workspace navigation', exact: true })).toBeHidden();
  for (const name of ['Projects', 'Tasks', 'Design review', 'Activity', 'Settings', 'Overview']) {
    await navigate(page, name);
    await expect(page.locator('main')).toBeVisible();
    await noOverflow(page);
  }
  await navigate(page, 'Tasks');
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await noOverflow(page);
  expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});
