import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

// ATLAS_TEST_URL allows the same suite to exercise an isolated Vite server.
const appUrl = process.env.ATLAS_TEST_URL || '/atlas-ops/';
const repository = (fullName = 'facebook/react') => ({
  full_name: fullName,
  description: 'A public UI library',
  language: 'TypeScript',
  stargazers_count: 240000,
  forks_count: 48000,
  archived: false,
});
const issue = (overrides: Record<string, unknown> = {}) => ({
  id: 100042,
  number: 42,
  title: 'Improve keyboard navigation',
  body: 'Preserve focus when the menu closes.',
  state: 'open',
  updated_at: '2026-10-07T08:30:00Z',
  comments: 3,
  user: { login: 'contributor' },
  labels: [{ name: 'accessibility', color: '006b75' }],
  // Remote URL fields are deliberately untrusted; the app constructs GitHub links.
  html_url: 'https://example.com/untrusted-link',
  ...overrides,
});
type Response = { status?: number; body: unknown; headers?: Record<string, string> };
async function json(route: Route, response: Response) {
  await route.fulfill({
    status: response.status || 200,
    contentType: 'application/json',
    body: JSON.stringify(response.body),
    headers: {
      'access-control-expose-headers': 'x-ratelimit-remaining,x-ratelimit-reset,retry-after',
      ...response.headers,
    },
  });
}
async function mockApi(page: Page, responder: (url: URL) => Response | Promise<Response>) {
  await page.route('https://api.github.com/repos/**', async (route) => {
    expect(route.request().method()).toBe('GET');
    expect(route.request().headers()['x-github-api-version']).toBe('2026-03-10');
    expect(route.request().headers().authorization).toBeUndefined();
    await json(route, await responder(new URL(route.request().url()))).catch(() => {
      /* The app may abort an obsolete request. */
    });
  });
}
const isIssues = (url: URL) => url.pathname.endsWith('/issues');
const openQueue = (page: Page) => page.goto(`${appUrl}#/github`);
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

test('GitHub queue reads issues, excludes pull requests, imports once and retains its source', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockApi(page, (url) => ({
    body: isIssues(url)
      ? [issue(), issue({ id: 100043, number: 43, title: 'A pull request', pull_request: {} })]
      : repository(),
  }));
  await openQueue(page);
  await expect(page.getByRole('heading', { name: 'facebook/react', exact: true })).toBeVisible();
  await expect(page.getByText('A pull request', { exact: true })).toHaveCount(0);
  const card = page.getByRole('article', { name: 'Issue 42', exact: true });
  await expect(card.getByRole('link', { name: 'Improve keyboard navigation' })).toHaveAttribute(
    'href',
    'https://github.com/facebook/react/issues/42',
  );
  await expect(card.getByText('accessibility', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Import issue 42', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Issue 42 imported', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Issue 42 imported', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'View local tasks', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Search tasks', exact: true })
    .fill('Improve keyboard navigation');
  await expect(
    page.getByRole('button', { name: 'Improve keyboard navigation', exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'GitHub #42', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/facebook/react/issues/42',
  );
  await page.getByRole('button', { name: 'Edit Improve keyboard navigation', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('link', { name: 'Source: facebook/react #42', exact: true }),
  ).toBeVisible();
  await dialog.getByLabel('Task name', { exact: true }).fill('Plan the keyboard fix');
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('atlas-ops-v1') || '{}'),
  );
  expect(
    stored.tasks.filter(
      (task: { source?: { issueId: number } }) => task.source?.issueId === 100042,
    ),
  ).toHaveLength(1);
  expect(stored.tasks[0]).toMatchObject({
    title: 'Plan the keyboard fix',
    status: 'Backlog',
    source: { kind: 'github', issueId: 100042, repository: 'facebook/react' },
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test('GitHub queue announces loading, refreshes and searches the fetched page', async ({
  page,
}) => {
  const pending = gate();
  let updated = false;
  await mockApi(page, async (url) => {
    await pending.promise;
    return {
      body: isIssues(url)
        ? [issue({ title: updated ? 'Updated issue title' : 'Improve keyboard navigation' })]
        : repository(),
    };
  });
  await openQueue(page);
  await expect(
    page.getByRole('status').filter({ hasText: 'Loading facebook/react' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh GitHub queue' })).toBeDisabled();
  pending.release();
  await expect(page.getByRole('article', { name: 'Issue 42', exact: true })).toBeVisible();
  await page.getByLabel('Search GitHub issues').fill('missing label');
  await expect(page.getByRole('heading', { name: 'No issues match your search.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear issue search' }).click();
  updated = true;
  await page.getByRole('button', { name: 'Refresh GitHub queue' }).click();
  await expect(page.getByRole('link', { name: 'Updated issue title' })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  ).toBeTruthy();
});

test('GitHub queue shows an honest empty page and validates repository input', async ({ page }) => {
  let requests = 0;
  await mockApi(page, (url) => {
    requests += 1;
    return { body: isIssues(url) ? [] : repository() };
  });
  await openQueue(page);
  await expect(page.getByRole('heading', { name: 'No open issues on this page.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View all issues on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/facebook/react/issues',
  );
  const before = requests;
  await page
    .getByLabel('Public repository', { exact: true })
    .fill('https://github.com/facebook/react');
  await page.getByRole('button', { name: 'Load repository' }).click();
  await expect(page.getByRole('alert')).toContainText('Use owner/repository');
  await expect(page.getByLabel('Public repository', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(requests).toBe(before);
});

test('GitHub queue retries a failed request without changing the local workspace', async ({
  page,
}) => {
  let fails = true;
  await mockApi(page, (url) =>
    fails
      ? { status: 404, body: { message: 'Not Found' } }
      : { body: isIssues(url) ? [issue()] : repository() },
  );
  await openQueue(page);
  await expect(page.getByRole('alert')).toContainText('Repository not found');
  await expect(page.getByRole('alert')).toContainText('public repositories only');
  const before = await page.evaluate(() => localStorage.getItem('atlas-ops-v1'));
  fails = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Issue 42', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('atlas-ops-v1'))).toBe(before);
});

test('GitHub queue explains rate limits and rejects malformed API data', async ({ page }) => {
  let rateLimited = true;
  await mockApi(page, (url) =>
    rateLimited
      ? {
          status: 403,
          body: { message: 'API rate limit exceeded' },
          headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '2000000000' },
        }
      : { body: isIssues(url) ? [issue({ number: 'not a number' })] : repository() },
  );
  await openQueue(page);
  await expect(page.getByRole('alert')).toContainText('GitHub rate limit reached');
  await expect(page.getByRole('alert')).toContainText('Try again after');
  rateLimited = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Unexpected response');
  await expect(page.getByRole('article')).toHaveCount(0);
});

test('GitHub queue handles network failures', async ({ page }) => {
  await page.route('https://api.github.com/repos/**', (route) => route.abort('failed'));
  await openQueue(page);
  await expect(page.getByRole('alert')).toContainText('Could not connect to GitHub');
  await expect(page.getByRole('alert')).toContainText('Your local workspace is still available');
});

test('GitHub queue recognizes a secondary rate limit without a reset header', async ({ page }) => {
  await mockApi(page, () => ({
    status: 403,
    body: { message: 'You have exceeded a secondary rate limit.' },
  }));
  await openQueue(page);
  await expect(page.getByRole('alert')).toContainText('GitHub rate limit reached');
  await expect(page.getByRole('alert')).toContainText('Wait a few minutes before retrying');
  await expect(page.getByRole('link', { name: 'View repository', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/facebook/react',
  );
});

test('GitHub queue times out a stalled request', async ({ page }) => {
  const pending = gate();
  await page.clock.install();
  await mockApi(page, async (url) => {
    await pending.promise;
    return { body: isIssues(url) ? [issue()] : repository() };
  });
  await openQueue(page);
  await expect(
    page.getByRole('status').filter({ hasText: 'Loading facebook/react' }),
  ).toBeVisible();
  await page.clock.fastForward(12_001);
  await expect(page.getByRole('alert')).toContainText('The request took too long');
  pending.release();
});

test('switching repositories ignores stale responses and keeps the current source', async ({
  page,
}) => {
  const pending = gate();
  await mockApi(page, async (url) => {
    const old = url.pathname.includes('/facebook/react');
    if (old) await pending.promise;
    return {
      body: isIssues(url)
        ? [
            issue({
              id: old ? 100901 : 100042,
              number: old ? 901 : 42,
              title: old ? 'Obsolete response' : 'Current TypeScript issue',
            }),
          ]
        : repository(old ? 'facebook/react' : 'microsoft/TypeScript'),
    };
  });
  await openQueue(page);
  await expect(
    page.getByRole('status').filter({ hasText: 'Loading facebook/react' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'microsoft/TypeScript', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'microsoft/TypeScript', exact: true }),
  ).toBeVisible();
  pending.release();
  await expect(page.getByRole('link', { name: 'Current TypeScript issue' })).toHaveAttribute(
    'href',
    'https://github.com/microsoft/TypeScript/issues/42',
  );
  await expect(page.getByText('Obsolete response', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Public repository', { exact: true })).toHaveValue(
    'microsoft/TypeScript',
  );
});

test('live GitHub smoke: public repository and issue response render', async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.ATLAS_LIVE_SMOKE !== '1' || testInfo.project.name !== 'desktop',
    'Opt-in live check: ATLAS_LIVE_SMOKE=1; external API availability is not a deterministic CI assertion.',
  );
  await openQueue(page);
  // GitHub can redirect moved repositories; use the returned canonical name.
  await expect(page.getByLabel('Repository details').getByRole('heading')).toHaveText(
    /^(facebook|react)\/react$/,
    { timeout: 20_000 },
  );
  await expect(page.getByLabel('Repository details')).toContainText('stars');
  await expect(page.getByRole('article').first()).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  ).toBeTruthy();
});
