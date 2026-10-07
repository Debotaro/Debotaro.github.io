import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

const appUrl = process.env.NOVA_TEST_URL || '/nova-os/';
const repository = (fullName = 'microsoft/TypeScript', id = 20929025) => ({
  id, full_name: fullName, name: fullName.split('/')[1], description: 'A public language project', language: 'TypeScript',
  stargazers_count: 100000, forks_count: 12000, open_issues_count: 4500, archived: false,
  html_url: 'https://example.com/untrusted-repository',
});
const milestone = (overrides: Record<string, unknown> = {}) => ({
  id: 90042, number: 42, title: 'Plan accessible release', description: 'Prepare the keyboard and screen reader review.',
  due_on: '2026-10-30T23:59:00Z', open_issues: 4, closed_issues: 8, state: 'open',
  html_url: 'javascript:alert(1)', ...overrides,
});
type Response = { status?: number; body: unknown; headers?: Record<string, string> };
async function json(route: Route, response: Response) {
  await route.fulfill({
    status: response.status || 200, contentType: 'application/json', body: JSON.stringify(response.body),
    headers: { 'access-control-expose-headers': 'x-ratelimit-remaining,x-ratelimit-reset,retry-after', ...response.headers },
  });
}
async function mockApi(page: Page, responder: (url: URL) => Response | Promise<Response>) {
  await page.route('https://api.github.com/repos/**', async route => {
    expect(route.request().method()).toBe('GET');
    expect(route.request().headers()['x-github-api-version']).toBe('2026-03-10');
    expect(route.request().headers().authorization).toBeUndefined();
    await json(route, await responder(new URL(route.request().url()))).catch(() => { /* Obsolete requests may be cancelled. */ });
  });
}
const isMilestones = (url: URL) => url.pathname.endsWith('/milestones');
const openWorkspace = (page: Page) => page.goto(`${appUrl}app/github/`);
const savedWorkspace = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('nova-os-v1') || '{}'));
const noOverflow = (page: Page) => expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
function gate() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}
async function navigateToGitHub(page: Page) {
  const mobileMenu = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await mobileMenu.isVisible()) await mobileMenu.click();
  await page.getByRole('navigation', { name: 'Workspace navigation' }).getByRole('link', { name: 'GitHub workspace', exact: true }).click();
  await expect(page).toHaveURL(/app\/github\//);
}

async function navigateWorkspace(page: Page, name: string) {
  const mobileMenu = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await mobileMenu.isVisible()) await mobileMenu.click();
  await page.getByRole('navigation', { name: 'Workspace navigation' }).getByRole('link', { name, exact: true }).click();
}

test('NOVA imports canonical GitHub sources once, survives reload and keeps local completion independent', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const canonical = 'microsoft/TypeScript.next';
  await mockApi(page, url => ({ body: isMilestones(url) ? [milestone()] : repository(canonical) }));
  await openWorkspace(page);
  const details = page.getByRole('region', { name: 'Repository details', exact: true });
  await expect(details.getByRole('link', { name: canonical, exact: true })).toHaveAttribute('href', `https://github.com/${canonical}`);
  const card = page.getByRole('article', { name: 'Milestone 42', exact: true });
  await expect(card.getByRole('link', { name: 'Plan accessible release', exact: true })).toHaveAttribute('href', `https://github.com/${canonical}/milestone/42`);
  await expect(card.getByRole('progressbar', { name: 'GitHub progress for Plan accessible release', exact: true })).toHaveAttribute('aria-valuenow', '67');
  await expect(page.getByRole('button', { name: 'Import repository', exact: true })).toBeEnabled();
  const before = await savedWorkspace(page);
  await page.getByRole('button', { name: 'Import repository', exact: true }).click();
  await expect(details.getByText('Local project ready', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Import milestone 42', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Milestone 42 imported', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Milestone 42 imported', exact: true })).toBeDisabled();
  const imported = await savedWorkspace(page);
  const project = imported.projects.find((item: any) => item.source?.id === 20929025);
  expect(imported.projects).toHaveLength(before.projects.length + 1);
  expect(imported.tasks).toHaveLength(before.tasks.length + 1);
  expect(imported.tasks.filter((item: any) => item.source?.id === 90042)).toHaveLength(1);
  expect(imported.tasks[0]).toMatchObject({ project: project.id, status: 'Todo', priority: 'Medium', dueDate: '2026-10-30', source: { kind: 'github-milestone', repository: canonical, number: 42, url: `https://github.com/${canonical}/milestone/42` } });
  expect(imported.activity).toHaveLength(2);
  await page.getByRole('link', { name: 'Open local project', exact: true }).click();
  await expect(page.getByRole('heading', { name: canonical, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View source repository', exact: true })).toHaveAttribute('href', `https://github.com/${canonical}`);
  await expect(page.getByRole('link', { name: `Source: ${canonical} milestone 42`, exact: true })).toHaveAttribute('href', `https://github.com/${canonical}/milestone/42`);
  await page.getByRole('button', { name: 'Complete Plan accessible release', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reopen Plan accessible release', exact: true })).toBeVisible();
  await navigateToGitHub(page);
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');
  await expect(card.getByRole('button', { name: 'Milestone 42 imported', exact: true })).toBeDisabled();
  await expect(page.getByText('Local completion is independent of GitHub.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(card).toBeVisible();
  expect((await savedWorkspace(page)).tasks.find((item: any) => item.source?.id === 90042).status).toBe('Done');
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('NOVA importing a milestone first creates one linked project and one planning task atomically', async ({ page }) => {
  await mockApi(page, url => ({ body: isMilestones(url) ? [milestone({ due_on: null, open_issues: 0, closed_issues: 0, description: '<script>window.novaUntrustedExecuted=true</script>' })] : repository() }));
  await openWorkspace(page);
  const card = page.getByRole('article', { name: 'Milestone 42', exact: true });
  await expect(card.getByRole('button', { name: 'Import milestone 42', exact: true })).toBeEnabled();
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(card.getByText('MILESTONE #42 · No due date', { exact: true })).toBeVisible();
  const before = await savedWorkspace(page);
  // Exercise keyboard activation; the repository button has never been pressed.
  await card.getByRole('button', { name: 'Import milestone 42', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Local project ready', { exact: true })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Milestone 42 imported', exact: true })).toBeDisabled();
  const after = await savedWorkspace(page);
  const importedProject = after.projects.find((item: any) => item.source?.id === 20929025);
  expect(after.projects).toHaveLength(before.projects.length + 1);
  expect(after.tasks).toHaveLength(before.tasks.length + 1);
  expect(after.tasks[0]).toMatchObject({ title: 'Plan accessible release', project: importedProject.id, due: 'No due date', source: { id: 90042 } });
  expect(after.tasks[0].dueDate).toBeUndefined();
  expect(after.activity.map((item: any) => item.projectId)).toEqual([importedProject.id, importedProject.id]);
  expect(await page.evaluate(() => (globalThis as any).novaUntrustedExecuted)).toBeUndefined();
  await page.reload();
  await expect(card.getByRole('button', { name: 'Milestone 42 imported', exact: true })).toBeDisabled();
  expect((await savedWorkspace(page)).projects.filter((item: any) => item.source?.id === 20929025)).toHaveLength(1);
  await noOverflow(page);
});

test('NOVA announces loading, refreshes remote progress and searches only the fetched milestones', async ({ page }) => {
  const pending = gate();
  let refreshed = false;
  await mockApi(page, async url => {
    await pending.promise;
    return { body: isMilestones(url) ? [milestone({ title: refreshed ? 'Updated release plan' : 'Plan accessible release', closed_issues: refreshed ? 12 : 8 })] : repository() };
  });
  await openWorkspace(page);
  await expect(page.getByRole('status').filter({ hasText: 'Loading microsoft/TypeScript from GitHub' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh GitHub workspace', exact: true })).toBeDisabled();
  pending.release();
  await expect(page.getByRole('article', { name: 'Milestone 42', exact: true })).toBeVisible();
  await page.getByLabel('Search milestones', { exact: true }).fill('not on this page');
  await expect(page.getByRole('heading', { name: 'No milestones match your search.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear milestone search', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByLabel('Search milestones', { exact: true }).fill('42');
  await expect(page.getByRole('article', { name: 'Milestone 42', exact: true })).toBeVisible();
  const before = await savedWorkspace(page);
  refreshed = true;
  await page.getByRole('button', { name: 'Refresh GitHub workspace', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Updated release plan', exact: true })).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  expect(await savedWorkspace(page)).toEqual(before);
  await noOverflow(page);
});

test('NOVA explains an empty milestone page, still imports the repository and validates input', async ({ page }) => {
  let requests = 0;
  await mockApi(page, url => { requests += 1; return { body: isMilestones(url) ? [] : repository() }; });
  await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'No open milestones on this page.', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View milestones on GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/microsoft/TypeScript/milestones');
  await page.getByRole('button', { name: 'Import repository', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open local project', exact: true })).toBeVisible();
  const before = requests;
  await page.getByLabel('Public repository', { exact: true }).fill('https://github.com/microsoft/TypeScript');
  await page.getByRole('button', { name: 'Load repository', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Use owner/repository');
  await expect(page.getByLabel('Public repository', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  expect(requests).toBe(before);
  await page.getByRole('link', { name: 'Open local project', exact: true }).click();
  await expect(page.getByText('No tasks match your filters.', { exact: true })).toBeVisible();
});

test('NOVA retries a failed repository request without changing local projects or tasks', async ({ page }) => {
  let fails = true;
  await mockApi(page, url => fails ? { status: 404, body: { message: 'Not Found' } } : { body: isMilestones(url) ? [milestone()] : repository() });
  await openWorkspace(page);
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Repository not found');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('public repositories only');
  await expect.poll(async () => (await savedWorkspace(page)).tasks?.length || 0).toBeGreaterThan(0);
  const before = await savedWorkspace(page);
  fails = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Milestone 42', exact: true })).toBeVisible();
  expect(await savedWorkspace(page)).toEqual(before);
});

test('NOVA shows network and secondary rate-limit guidance while the local workspace remains usable', async ({ page }) => {
  let networkFails = true;
  await page.route('https://api.github.com/repos/**', async route => {
    if (networkFails) await route.abort('failed');
    else await json(route, { status: 403, body: { message: 'You have exceeded a secondary rate limit.' } }).catch(() => {});
  });
  await openWorkspace(page);
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Could not connect to GitHub');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Your local workspace is still available');
  networkFails = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('GitHub rate limit reached');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Wait a few minutes before retrying');
  await page.getByRole('link', { name: 'Your projects', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Good work starts here.', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New project', exact: true })).toBeEnabled();
});

test('NOVA switching repositories discards the obsolete response and imports the current source', async ({ page }) => {
  const pending = gate();
  let oldCalls = 0;
  await mockApi(page, async url => {
    const old = url.pathname.includes('/microsoft/TypeScript');
    if (old) { oldCalls += 1; await pending.promise; }
    return { body: isMilestones(url) ? [milestone({ id: old ? 90100 : 90042, number: old ? 100 : 42, title: old ? 'Obsolete milestone' : 'Current Vite release' })] : repository(old ? 'microsoft/TypeScript' : 'vitejs/vite', old ? 20929025 : 257485422) };
  });
  await openWorkspace(page);
  await expect.poll(() => oldCalls).toBe(2);
  await page.getByLabel('Public repository', { exact: true }).fill('vitejs/vite');
  await page.getByRole('button', { name: 'Load repository', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Current Vite release', exact: true })).toBeVisible();
  pending.release();
  await expect(page.getByRole('link', { name: 'Obsolete milestone', exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Repository details', exact: true }).getByRole('link', { name: 'vitejs/vite', exact: true })).toHaveAttribute('href', 'https://github.com/vitejs/vite');
  await page.getByRole('button', { name: 'Import milestone 42', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Milestone 42 imported', exact: true })).toBeDisabled();
  expect((await savedWorkspace(page)).tasks[0].source).toMatchObject({ id: 90042, repository: 'vitejs/vite', url: 'https://github.com/vitejs/vite/milestone/42' });
});

test('NOVA follows a canonical repository rename and imports new milestones into the existing local project', async ({ page }) => {
  let renamed = false;
  const canonical = 'microsoft/TypeScript.next';
  await mockApi(page, url => ({ body: isMilestones(url)
    ? [milestone(), ...(renamed ? [milestone({ id: 90043, number: 43, title: 'Plan the next release', due_on: null })] : [])]
    : repository(renamed ? canonical : 'microsoft/TypeScript') }));
  await openWorkspace(page);
  await page.getByRole('button', { name: 'Import milestone 42', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Milestone 42 imported', exact: true })).toBeDisabled();
  const before = await savedWorkspace(page);
  const project = before.projects.find((item: any) => item.source?.id === 20929025);
  await page.getByRole('link', { name: 'Open local project', exact: true }).click();
  await page.getByRole('button', { name: 'Complete Plan accessible release', exact: true }).click();
  renamed = true;
  await navigateToGitHub(page);
  await expect(page.getByRole('region', { name: 'Repository details', exact: true }).getByRole('link', { name: canonical, exact: true })).toBeVisible();
  await expect(page.getByText('Local project ready', { exact: true })).toBeVisible();
  await expect.poll(async () => (await savedWorkspace(page)).projects.find((item: any) => item.id === project.id)?.source?.fullName).toBe(canonical);
  await page.getByRole('button', { name: 'Import milestone 43', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Milestone 43 imported', exact: true })).toBeDisabled();
  const after = await savedWorkspace(page);
  expect(after.projects).toHaveLength(before.projects.length);
  expect(after.projects.find((item: any) => item.id === project.id)).toMatchObject({ name: 'microsoft/TypeScript', source: { id: 20929025, fullName: canonical, url: `https://github.com/${canonical}` } });
  expect(after.tasks.find((item: any) => item.source?.id === 90042)).toMatchObject({ project: project.id, status: 'Done', source: { repository: canonical, url: `https://github.com/${canonical}/milestone/42` } });
  expect(after.tasks.find((item: any) => item.source?.id === 90043)).toMatchObject({ project: project.id, status: 'Todo', source: { repository: canonical, url: `https://github.com/${canonical}/milestone/43` } });
  expect(after.activity).toHaveLength(3);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Milestone 42 imported', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Milestone 43 imported', exact: true })).toBeDisabled();
});

test('NOVA reports a rejected milestone import without leaving an orphaned local project', async ({ page }) => {
  await mockApi(page, url => ({ body: isMilestones(url) ? [milestone({ description: 'Invalid control character: \u0001' })] : repository() }));
  await openWorkspace(page);
  await expect(page.getByRole('button', { name: 'Import milestone 42', exact: true })).toBeEnabled();
  const before = await savedWorkspace(page);
  await page.getByRole('button', { name: 'Import milestone 42', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'This item could not be added.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import repository', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Import milestone 42', exact: true })).toBeEnabled();
  expect(await savedWorkspace(page)).toEqual(before);
});

test('NOVA shows the timeout recovery UI when GitHub stalls past the shared deadline', async ({ page }) => {
  const pending = gate();
  await page.clock.install();
  await mockApi(page, async url => { await pending.promise; return { body: isMilestones(url) ? [milestone()] : repository() }; });
  await openWorkspace(page);
  await expect(page.getByRole('status').filter({ hasText: 'Loading microsoft/TypeScript from GitHub' })).toBeVisible();
  await page.clock.fastForward(12_001);
  await expect(page.getByRole('main').getByRole('alert')).toContainText('The request took too long');
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeEnabled();
  pending.release();
});

test('NOVA safely recovers malformed saved data and can import into the restored workspace', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nova-os-v1', '{"tasks":"broken"}'));
  await mockApi(page, url => ({ body: isMilestones(url) ? [milestone()] : repository() }));
  await openWorkspace(page);
  await expect(page.getByRole('status').filter({ hasText: 'Saved workspace data was invalid.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import milestone 42', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Import milestone 42', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Milestone 42 imported', exact: true })).toBeDisabled();
  const saved = await savedWorkspace(page);
  expect(saved.name).toBe('Alex');
  expect(saved.tasks.find((item: any) => item.id === 't1').title).toBe('Explore visual direction');
  expect(saved.tasks[0].source.id).toBe(90042);
});

test('NOVA explains unavailable browser storage and supports imports during the current session', async ({ page }) => {
  await page.addInitScript(() => {
    const unavailable = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
    Storage.prototype.getItem = unavailable;
    Storage.prototype.setItem = unavailable;
  });
  await mockApi(page, url => ({ body: isMilestones(url) ? [milestone()] : repository() }));
  await openWorkspace(page);
  await expect(page.getByRole('status').filter({ hasText: 'Your imports work for this session but may be lost after reloading.' })).toBeVisible();
  await page.getByRole('button', { name: 'Import milestone 42', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Milestone 42 imported', exact: true })).toBeDisabled();
  await expect(page.getByText('Session only · Browser storage unavailable', { exact: true })).toHaveCount(1);
  await page.getByRole('link', { name: 'Open local project', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Complete Plan accessible release', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Good work starts here.', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete Plan accessible release', exact: true })).toHaveCount(0);
});

test('NOVA supports a valid empty workspace without invalid metrics, dangling tasks or automation crashes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const empty = {
      name: 'Alex', team: 'Studio North', theme: 'dark', tasks: [], projects: [],
      messages: [{ role: 'assistant', text: 'Welcome to your workspace.' }],
      nodes: [{ id: 'n1', kind: 'trigger', label: 'Task marked complete' }, { id: 'n2', kind: 'condition', label: 'Priority is High' }, { id: 'n3', kind: 'action', label: 'Notify the team' }],
      integrations: [], notifications: [], automationActive: false, activity: [],
    };
    localStorage.setItem('nova-os-v1', JSON.stringify(empty));
  });
  await page.goto(`${appUrl}app/`);
  await expect(page.getByRole('heading', { name: 'A good day to make progress, Alex.', exact: true })).toBeVisible();
  await expect(page.locator('.metric').filter({ hasText: 'Active projects' }).locator('b')).toHaveText('00');
  await expect(page.locator('.metric').filter({ hasText: 'Tasks in progress' }).locator('b')).toHaveText('00');
  await expect(page.locator('.metric').filter({ hasText: 'Workspace focus' }).locator('b')).toHaveText('0%');
  await expect(page.locator('.focus-ring b')).toHaveText('0%');
  await expect(page.getByRole('main')).not.toContainText('NaN');
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Make your next move', exact: true });
  await dialog.getByLabel('Task name', { exact: true }).fill('A task with no project');
  await dialog.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Create a project before adding a task.' })).toBeVisible();
  expect((await savedWorkspace(page)).tasks).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await navigateWorkspace(page, 'Analytics');
  await expect(page.getByRole('heading', { name: 'Progress you can feel. And see.', exact: true })).toBeVisible();
  await expect(page.locator('.metric').filter({ hasText: 'Total tasks' }).locator('b')).toHaveText('0');
  await expect(page.locator('.metric').filter({ hasText: 'Completion rate' }).locator('b')).toHaveText('0%');
  await expect(page.getByRole('main')).not.toContainText('NaN');
  await navigateWorkspace(page, 'Automations');
  await page.getByRole('button', { name: 'Test flow', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Create a task before testing this flow.' })).toBeVisible();
  await expect(page.getByText('No tasks available. Create a task before testing this flow.', { exact: true })).toBeVisible();
  expect((await savedWorkspace(page)).tasks).toEqual([]);
  expect((await savedWorkspace(page)).projects).toEqual([]);
  expect(errors).toEqual([]);
});
