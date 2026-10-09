import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Page } from '@playwright/test';

const requireFromNova = createRequire(new URL('../nova-os/package.json', import.meta.url));
const ts = requireFromNova('typescript');
const helperSource = readFileSync(
  new URL('../nova-os/components/assistant.ts', import.meta.url),
  'utf8',
);
const browserHelper = ts.transpileModule(helperSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;

async function installHelper(page: Page) {
  await page.goto('about:blank');
  // Exercise the production pure helper in Chromium, with its type-only import erased.
  await page.addScriptTag({
    content: `(() => { const exports = {}; ${browserHelper}\n globalThis.novaAssistant = exports; })();`,
  });
}

test('delayed assistant creation preserves intervening tasks, status changes and messages', async ({
  page,
}) => {
  await installHelper(page);
  const result = await page.evaluate(() => {
    const apply = (globalThis as any).novaAssistant.applyAssistantRequest;
    const first = {
      id: 't1',
      title: 'Existing task',
      project: 'p1',
      status: 'Todo',
      priority: 'High',
      assignee: 'Alex',
      due: 'Today',
    };
    const snapshot = {
      name: 'Alex',
      team: 'Team',
      theme: 'dark',
      tasks: [first],
      projects: [{ id: 'p1', name: 'Launch', description: '', color: '#fff' }],
      messages: [],
      nodes: [],
      integrations: [],
      notifications: [],
      automationActive: false,
    };
    const request = {
      id: 'reply-1',
      taskId: 'assistant-task',
      text: 'Create task: Assistant addition',
    };
    // These edits happen while the assistant's simulated delay is pending.
    const current = {
      ...snapshot,
      name: 'Maya',
      tasks: [
        { ...first, id: 'intervening-task', title: 'Manual addition' },
        { ...first, status: 'Done' },
      ],
      messages: [{ role: 'assistant', text: 'Intervening message' }],
      notifications: ['Intervening notice'],
    };
    Object.freeze(current.tasks);
    current.tasks.forEach(Object.freeze);
    const next = apply(current, request);
    const repeated = apply(current, request);
    return { next, original: current, repeated, snapshot };
  });
  expect(result.next.tasks.map((task: { id: string }) => task.id)).toEqual([
    'assistant-task',
    'intervening-task',
    't1',
  ]);
  expect(result.next.tasks[0]).toMatchObject({ assignee: 'Maya', title: 'Assistant addition' });
  expect(result.next.tasks[2].status).toBe('Done');
  expect(result.next.messages[0].text).toBe('Intervening message');
  expect(result.next.notifications).toEqual(['Intervening notice']);
  expect(result.original.tasks).toHaveLength(2);
  expect(result.snapshot.tasks[0].status).toBe('Todo');
  expect(result.repeated).toEqual(result.next); // React may replay a pure updater.
});

test('summary prompts keep the current task array and report current state without mutation', async ({
  page,
}) => {
  await installHelper(page);
  const result = await page.evaluate(() => {
    const apply = (globalThis as any).novaAssistant.applyAssistantRequest;
    const state = {
      name: 'Alex',
      team: 'Team',
      theme: 'dark',
      tasks: [
        {
          id: 'later',
          title: 'Added during delay',
          project: 'p1',
          status: 'Done',
          priority: 'High',
          assignee: 'Alex',
          due: 'Today',
        },
      ],
      projects: [{ id: 'p1', name: 'Launch', description: '', color: '#fff' }],
      messages: [],
      nodes: [],
      integrations: [],
      notifications: [],
      automationActive: false,
    };
    Object.freeze(state.tasks);
    state.tasks.forEach(Object.freeze);
    const next = apply(state, { id: 'summary', taskId: 'unused', text: 'Summarise Launch' });
    return {
      sameTaskArray: next.tasks === state.tasks,
      sameTask: next.tasks[0] === state.tasks[0],
      reply: next.messages[1].text,
      beforeMessages: state.messages.length,
      afterMessages: next.messages.length,
    };
  });
  expect(result).toMatchObject({
    sameTaskArray: true,
    sameTask: true,
    beforeMessages: 0,
    afterMessages: 2,
  });
  expect(result.reply).toContain('1 tasks: 1 completed');
});

test('completion resolves the current task and does not revive a removed task', async ({
  page,
}) => {
  await installHelper(page);
  const result = await page.evaluate(() => {
    const apply = (globalThis as any).novaAssistant.applyAssistantRequest;
    const state = {
      name: 'Alex',
      team: 'Team',
      theme: 'dark',
      tasks: [
        {
          id: 'new',
          title: 'Review release',
          project: 'p1',
          status: 'In progress',
          priority: 'High',
          assignee: 'Maya',
          due: 'Tomorrow',
        },
      ],
      projects: [{ id: 'p1', name: 'Launch', description: '', color: '#fff' }],
      messages: [],
      nodes: [],
      integrations: [],
      notifications: [],
      automationActive: false,
    };
    const request = { id: 'complete', taskId: 'unused', text: 'Complete Review release' };
    const next = apply(state, request);
    const deleted = apply({ ...state, tasks: [] }, request);
    return { next, deleted, state };
  });
  expect(result.next.tasks[0]).toMatchObject({ id: 'new', status: 'Done', assignee: 'Maya' });
  expect(result.state.tasks[0].status).toBe('In progress');
  expect(result.deleted.tasks).toEqual([]);
  expect(result.deleted.messages[1].text).toContain('couldn’t find that task');
  expect(result.deleted.messages[1].action).toBe('');
});

test('leaving the assistant cancels its pending command', async ({ page }) => {
  const appUrl = process.env.NOVA_TEST_URL || '/nova-os/';
  await page.clock.install({ time: new Date('2026-10-07T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-07T12:00:01Z'));
  await page.goto(`${appUrl}app/assistant/`);
  await expect(page.getByLabel('Message NOVA')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('nova-os-v1') || '{}').tasks?.length || 0,
      ),
    )
    .toBeGreaterThan(0);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('nova-os-v1') || '{}'));
  await page.getByLabel('Message NOVA').fill('Create task: Cancelled on departure');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByText('Finding your next best move')).toBeVisible();
  // Use Next's client-side navigation so the StoreProvider stays mounted.
  const mobileMenu = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await mobileMenu.isVisible()) {
    await mobileMenu.click();
    await page.clock.runFor(100);
  }
  await page
    .getByRole('navigation', { name: 'Workspace navigation' })
    .getByRole('link', { name: 'Projects', exact: true })
    .click();
  await expect(page).toHaveURL(/app\/projects\//);
  await page.clock.runFor(1000);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('nova-os-v1') || '{}'));
  expect(after.tasks).toEqual(before.tasks);
  expect(after.messages).toEqual(before.messages);
  expect(
    after.tasks.some((task: { title: string }) => task.title === 'Cancelled on departure'),
  ).toBe(false);
});

test('clearing chat cancels a pending reply and allows the next command', async ({ page }) => {
  const appUrl = process.env.NOVA_TEST_URL || '/nova-os/';
  await page.clock.install({ time: new Date('2026-10-07T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-07T12:00:01Z'));
  await page.goto(`${appUrl}app/assistant/`);
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('nova-os-v1') || '{}').tasks?.length || 0,
      ),
    )
    .toBeGreaterThan(0);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('nova-os-v1') || '{}'));
  await page.getByLabel('Message NOVA').fill('Create task: Cancelled by clearing chat');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByText('Finding your next best move')).toBeVisible();
  await page.getByRole('button', { name: 'Clear chat', exact: true }).click();
  await expect(page.getByText('Finding your next best move')).toHaveCount(0);
  await page.clock.runFor(1000);
  const cleared = await page.evaluate(() => JSON.parse(localStorage.getItem('nova-os-v1') || '{}'));
  expect(cleared.tasks).toEqual(before.tasks);
  expect(cleared.messages).toEqual(before.messages);
  await page.getByLabel('Message NOVA').fill('Create task: Fresh command after clearing');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await page.clock.runFor(650);
  await expect(page.getByText('Task created in your workspace', { exact: true })).toBeVisible();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('nova-os-v1') || '{}'));
  expect(after.tasks[0].title).toBe('Fresh command after clearing');
  expect(after.tasks).toHaveLength(before.tasks.length + 1);
  expect(
    after.tasks.some((task: { title: string }) => task.title === 'Cancelled by clearing chat'),
  ).toBe(false);
});
