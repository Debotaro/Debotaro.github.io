import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireFromNova = createRequire(new URL('../nova-os/package.json', import.meta.url));
const ts = requireFromNova('typescript');
const source = readFileSync(new URL('../nova-os/components/github-api.ts', import.meta.url), 'utf8');
const browserHelper = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;

async function installHelper(page: Page) {
  await page.goto('about:blank');
  // Test the production boundary, including native browser AbortSignal and Response.
  await page.addScriptTag({ content: `(() => { const exports = {}; ${browserHelper}\n globalThis.novaGitHub = exports; })();` });
  await page.evaluate(() => {
    (globalThis as any).repositoryFixture = {
      id: 20929025, full_name: 'microsoft/TypeScript', name: 'TypeScript', description: 'A language for application-scale JavaScript.',
      language: 'TypeScript', stargazers_count: 100000, forks_count: 12000, open_issues_count: 4500, archived: false,
      html_url: 'javascript:alert(1)',
    };
    (globalThis as any).milestoneFixture = {
      id: 90042, number: 42, title: 'Release candidate', description: '<script>not executable HTML</script>',
      due_on: '2026-10-30T23:59:00Z', open_issues: 4, closed_issues: 8, state: 'open', html_url: 'https://example.com/untrusted',
    };
  });
}

test('NOVA GitHub boundary starts parallel reads without credentials and constructs canonical links', async ({ page }) => {
  await installHelper(page);
  const result = await page.evaluate(async () => {
    const calls: { url: string; credentials: string; cache: string; headers: unknown; signal: AbortSignal }[] = [];
    const releases: (() => void)[] = [];
    const fixture = (globalThis as any);
    globalThis.fetch = (async (input: string, options: RequestInit) => {
      calls.push({ url: input, credentials: String(options.credentials), cache: String(options.cache), headers: options.headers, signal: options.signal! });
      await new Promise<void>(resolve => releases.push(resolve));
      const repo = { ...fixture.repositoryFixture, full_name: 'canonical-owner/renamed.repo', name: 'renamed.repo' };
      return new Response(JSON.stringify(input.includes('/milestones?') ? [fixture.milestoneFixture] : repo));
    }) as typeof fetch;
    const promise = fixture.novaGitHub.fetchGitHubWorkspace('old-owner/original.repo', new AbortController().signal);
    const startedTogether = calls.length === 2;
    releases.forEach(release => release());
    const data = await promise;
    return { data, startedTogether, sameSignal: calls[0].signal === calls[1].signal, calls: calls.map(({ signal, ...rest }) => rest) };
  });
  expect(result.startedTogether).toBe(true);
  expect(result.sameSignal).toBe(true);
  expect(result.calls.map(call => call.url)).toEqual([
    'https://api.github.com/repos/old-owner/original.repo',
    'https://api.github.com/repos/old-owner/original.repo/milestones?state=open&sort=due_on&direction=asc&per_page=30',
  ]);
  for (const call of result.calls) expect(call).toMatchObject({ credentials: 'omit', cache: 'no-cache', headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' } });
  expect(result.data.repository).toMatchObject({ id: 20929025, name: 'renamed.repo', fullName: 'canonical-owner/renamed.repo', url: 'https://github.com/canonical-owner/renamed.repo', stars: 100000, forks: 12000, archived: false, openIssues: 4500 });
  expect(result.data.milestones[0]).toMatchObject({ id: 90042, number: 42, state: 'open', url: 'https://github.com/canonical-owner/renamed.repo/milestone/42', description: '<script>not executable HTML</script>', openIssues: 4, closedIssues: 8 });
  expect(Number.isFinite(Date.parse(result.data.fetchedAt))).toBe(true);
});

test('NOVA GitHub boundary rejects invalid names and pre-cancelled requests before fetching', async ({ page }) => {
  await installHelper(page);
  const result = await page.evaluate(async () => {
    const api = (globalThis as any).novaGitHub;
    let calls = 0;
    globalThis.fetch = (async () => { calls += 1; return new Response('{}'); }) as typeof fetch;
    const invalid = ['', 'https://github.com/microsoft/TypeScript', 'owner/..', 'owner/.', 'owner/repo?query=yes', 'owner/repo/extra', 'owner_name/repo', 'owner/repo#fragment'];
    const errors = [];
    for (const name of invalid) {
      try { await api.fetchGitHubWorkspace(name, new AbortController().signal); }
      catch (error) { errors.push({ name: (error as Error).name, title: (error as any).title }); }
    }
    const controller = new AbortController(); controller.abort();
    let cancelledName = '';
    try { await api.fetchGitHubWorkspace('owner/project.with.dots', controller.signal); }
    catch (error) { cancelledName = (error as Error).name; }
    return { calls, errors, cancelledName, acceptsDots: api.validRepository('owner/project.with.dots') };
  });
  expect(result.calls).toBe(0);
  expect(result.errors).toHaveLength(8);
  expect(result.errors.every(error => error.name === 'GitHubError' && error.title === 'Check the repository name')).toBe(true);
  expect(result.cancelledName).toBe('AbortError');
  expect(result.acceptsDots).toBe(true);
});

test('NOVA GitHub boundary rejects malformed identity, counts, dates and milestone collections', async ({ page }) => {
  await installHelper(page);
  const result = await page.evaluate(async () => {
    const fixture = (globalThis as any);
    const cases = [
      { repo: { ...fixture.repositoryFixture, id: 0 }, milestones: [fixture.milestoneFixture] },
      { repo: { ...fixture.repositoryFixture, full_name: 'owner/../host' }, milestones: [fixture.milestoneFixture] },
      { repo: { ...fixture.repositoryFixture, name: 'different' }, milestones: [fixture.milestoneFixture] },
      { repo: { ...fixture.repositoryFixture, open_issues_count: '12' }, milestones: [fixture.milestoneFixture] },
      { repo: fixture.repositoryFixture, milestones: { unexpected: true } },
      { repo: fixture.repositoryFixture, milestones: [{ ...fixture.milestoneFixture, number: 0 }] },
      { repo: fixture.repositoryFixture, milestones: [{ ...fixture.milestoneFixture, state: 'closed' }] },
      { repo: fixture.repositoryFixture, milestones: [{ ...fixture.milestoneFixture, open_issues: -1 }] },
      { repo: fixture.repositoryFixture, milestones: [{ ...fixture.milestoneFixture, closed_issues: 0.5 }] },
      { repo: fixture.repositoryFixture, milestones: [{ ...fixture.milestoneFixture, due_on: '2026-02-30T12:00:00Z' }] },
      { repo: fixture.repositoryFixture, milestones: [{ ...fixture.milestoneFixture, due_on: 'tomorrow' }] },
      { repo: fixture.repositoryFixture, milestones: [fixture.milestoneFixture, { ...fixture.milestoneFixture, number: 43 }] },
      { repo: fixture.repositoryFixture, milestones: [fixture.milestoneFixture, { ...fixture.milestoneFixture, id: 90043 }] },
      { repo: fixture.repositoryFixture, milestones: Array.from({ length: 31 }, (_, index) => ({ ...fixture.milestoneFixture, id: 90000 + index, number: index + 1 })) },
    ];
    const errors = [];
    for (const data of cases) {
      globalThis.fetch = (async (input: string) => new Response(JSON.stringify(input.includes('/milestones?') ? data.milestones : data.repo))) as typeof fetch;
      try { await fixture.novaGitHub.fetchGitHubWorkspace('microsoft/TypeScript', new AbortController().signal); errors.push('NO ERROR'); }
      catch (error) { errors.push((error as any).title); }
    }
    return errors;
  });
  expect(result).toHaveLength(14);
  expect(result.every(title => title === 'Unexpected response')).toBe(true);
});

test('NOVA GitHub boundary accepts null dates, leap days and an empty first page', async ({ page }) => {
  await installHelper(page);
  const result = await page.evaluate(async () => {
    const fixture = (globalThis as any);
    const dates = [null, '2028-02-29T23:59:59Z', '2026-10-01T12:00:00.123+05:30'];
    let current: unknown[] = dates.map((due_on, index) => ({ ...fixture.milestoneFixture, id: 90042 + index, number: 42 + index, due_on }));
    let calls = 0;
    globalThis.fetch = (async (input: string) => { calls += 1; return new Response(JSON.stringify(input.includes('/milestones?') ? current : fixture.repositoryFixture)); }) as typeof fetch;
    const data = await fixture.novaGitHub.fetchGitHubWorkspace('microsoft/TypeScript', new AbortController().signal);
    current = [];
    const refreshed = await fixture.novaGitHub.fetchGitHubWorkspace('microsoft/TypeScript', new AbortController().signal);
    return { dates: data.milestones.map((milestone: { dueOn: string | null }) => milestone.dueOn), refreshed, calls };
  });
  expect(result.dates).toEqual([null, '2028-02-29T23:59:59Z', '2026-10-01T12:00:00.123+05:30']);
  expect(result.refreshed.milestones).toEqual([]);
  expect(result.refreshed.repository.fullName).toBe('microsoft/TypeScript');
  expect(result.calls).toBe(4); // A refresh reads GitHub again; no application cache.
});

test('NOVA GitHub boundary explains primary, secondary and HTTP rate-limit errors', async ({ page }) => {
  await installHelper(page);
  const result = await page.evaluate(async () => {
    const fixture = (globalThis as any);
    const cases = [
      { status: 403, body: { message: 'API rate limit exceeded' }, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '2000000000' } },
      { status: 403, body: { message: 'You have exceeded a secondary rate limit.' }, headers: {} },
      { status: 403, body: { message: 'Please slow down' }, headers: { 'retry-after': '90' } },
      { status: 429, body: { message: 'Too many requests' }, headers: { 'retry-after': '60' } },
      { status: 404, body: { message: 'Not Found' }, headers: {} },
      { status: 410, body: { message: 'Gone' }, headers: {} },
      { status: 503, body: { message: 'Service unavailable' }, headers: {} },
    ];
    const errors = [];
    for (const response of cases) {
      globalThis.fetch = (async () => new Response(JSON.stringify(response.body), { status: response.status, headers: response.headers as HeadersInit })) as typeof fetch;
      try { await fixture.novaGitHub.fetchGitHubWorkspace('microsoft/TypeScript', new AbortController().signal); }
      catch (error) { errors.push({ name: (error as Error).name, title: (error as any).title, message: (error as Error).message }); }
    }
    return errors;
  });
  expect(result.map(error => error.title)).toEqual(['GitHub rate limit reached', 'GitHub rate limit reached', 'GitHub rate limit reached', 'GitHub rate limit reached', 'Repository not found', 'Milestones are unavailable', 'GitHub is unavailable']);
  expect(result[0].message).toContain('Try again after');
  expect(result[1].message).toContain('Wait a few minutes before retrying');
  expect(result[2].message).toContain('Try again after');
  expect(result[3].message).toContain('Try again after');
  expect(result[4].message).toContain('public repositories only');
  expect(result[6].message).toContain('HTTP 503');
  expect(result.every(error => error.name === 'GitHubError')).toBe(true);
});

test('NOVA GitHub boundary reports malformed JSON and connection failures', async ({ page }) => {
  await installHelper(page);
  const result = await page.evaluate(async () => {
    const fixture = (globalThis as any);
    const errors = [];
    globalThis.fetch = (async () => new Response('not json')) as typeof fetch;
    try { await fixture.novaGitHub.fetchGitHubWorkspace('microsoft/TypeScript', new AbortController().signal); }
    catch (error) { errors.push({ title: (error as any).title, message: (error as Error).message }); }
    globalThis.fetch = (async () => { throw new TypeError('Failed to fetch'); }) as typeof fetch;
    try { await fixture.novaGitHub.fetchGitHubWorkspace('microsoft/TypeScript', new AbortController().signal); }
    catch (error) { errors.push({ title: (error as any).title, message: (error as Error).message }); }
    return errors;
  });
  expect(result[0].title).toBe('Unexpected response');
  expect(result[1].title).toBe('Could not connect to GitHub');
  expect(result[1].message).toContain('Your local workspace is still available');
});

test('NOVA GitHub boundary discards JSON bodies arriving after cancellation', async ({ page }) => {
  await installHelper(page);
  const result = await page.evaluate(async () => {
    const fixture = (globalThis as any);
    const signals: AbortSignal[] = [];
    const releases: (() => void)[] = [];
    globalThis.fetch = (async (input: string, options: RequestInit) => {
      signals.push(options.signal!);
      // Deliberately ignore abort inside response.json to model a late response.
      return { ok: true, json: async () => {
        await new Promise<void>(resolve => releases.push(resolve));
        return input.includes('/milestones?') ? [fixture.milestoneFixture] : fixture.repositoryFixture;
      } } as Response;
    }) as typeof fetch;
    const controller = new AbortController();
    const pending = fixture.novaGitHub.fetchGitHubWorkspace('microsoft/TypeScript', controller.signal);
    await Promise.resolve();
    controller.abort();
    releases.forEach(release => release());
    let errorName = '';
    try { await pending; } catch (error) { errorName = (error as Error).name; }
    return { errorName, allAborted: signals.length === 2 && signals.every(signal => signal.aborted) };
  });
  expect(result).toEqual({ errorName: 'AbortError', allAborted: true });
});

test('NOVA GitHub boundary times out both parallel requests after the shared deadline', async ({ page }) => {
  await page.clock.install();
  await installHelper(page);
  await page.evaluate(() => {
    const fixture = (globalThis as any);
    const signals: AbortSignal[] = [];
    globalThis.fetch = (async (_input: string, options: RequestInit) => {
      signals.push(options.signal!);
      return await new Promise<Response>((_resolve, reject) => options.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
    }) as typeof fetch;
    fixture.pendingBoundary = fixture.novaGitHub.fetchGitHubWorkspace('microsoft/TypeScript', new AbortController().signal)
      .then(() => ({ title: 'NO ERROR' }), (error: any) => ({ title: error.title, message: error.message, allAborted: signals.length === 2 && signals.every(signal => signal.aborted) }));
  });
  await page.clock.fastForward(12_001);
  const result = await page.evaluate(() => (globalThis as any).pendingBoundary);
  expect(result).toMatchObject({ title: 'The request took too long', allAborted: true });
  expect(result.message).toContain('within 12 seconds');
});

test('NOVA GitHub boundary aborts a remaining request when its companion fails', async ({ page }) => {
  await installHelper(page);
  const result = await page.evaluate(async () => {
    const fixture = (globalThis as any);
    let siblingAborted = false;
    globalThis.fetch = (async (input: string, options: RequestInit) => {
      if (!input.includes('/milestones?')) return new Response('{}', { status: 404 });
      return await new Promise<Response>((_resolve, reject) => options.signal!.addEventListener('abort', () => {
        siblingAborted = true; reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true }));
    }) as typeof fetch;
    let title = '';
    try { await fixture.novaGitHub.fetchGitHubWorkspace('microsoft/TypeScript', new AbortController().signal); }
    catch (error) { title = (error as any).title; }
    return { title, siblingAborted };
  });
  expect(result).toEqual({ title: 'Repository not found', siblingAborted: true });
});
