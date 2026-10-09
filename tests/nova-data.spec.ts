import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireFromNova = createRequire(new URL('../nova-os/package.json', import.meta.url));
const ts = requireFromNova('typescript');
const source = readFileSync(
  new URL('../nova-os/components/workspace-data.ts', import.meta.url),
  'utf8',
);
const helper = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;

async function installHelper(page: Page) {
  await page.goto('about:blank');
  await page.addScriptTag({
    content: `(() => { const exports = {}; ${helper}\n globalThis.novaData = exports; })();`,
  });
  await page.addScriptTag({
    content: `globalThis.novaFixture = () => ({ name:'Alex',team:'Studio North',theme:'dark',tasks:[{id:'t1',title:'Review release',project:'p1',status:'Todo',priority:'High',assignee:'Alex',due:'Today'}],projects:[{id:'p1',name:'Launch',description:'Sample project',color:'#ab9cff'}],messages:[{role:'assistant',text:'Welcome',requestId:'reply-1',action:''}],nodes:[{id:'n1',kind:'trigger',label:'Task marked complete'}],integrations:['slack'],notifications:['Sample notice'],automationActive:false });`,
  });
}

test('legacy workspace validation preserves supported data and strips unknown fields', async ({
  page,
}) => {
  await installHelper(page);
  const result = await page.evaluate(() => {
    const input = (globalThis as any).novaFixture();
    input.secret = 'not retained';
    input.tasks[0].untrusted = 'not retained';
    const parsed = (globalThis as any).novaData.parseStoredWorkspace(JSON.stringify(input));
    return { parsed, unchanged: input.tasks[0].untrusted === 'not retained' };
  });
  expect(result.parsed.ok).toBe(true);
  expect(result.parsed.state.activity).toEqual([]);
  expect(result.parsed.state.messages[0]).toEqual({
    role: 'assistant',
    text: 'Welcome',
    requestId: 'reply-1',
    action: '',
  });
  expect(result.parsed.state.tasks[0]).toMatchObject({ due: 'Today', project: 'p1' });
  expect(result.parsed.state).not.toHaveProperty('secret');
  expect(result.parsed.state.tasks[0]).not.toHaveProperty('untrusted');
  expect(result.unchanged).toBe(true);
});

test('malformed stored records and dangling project references are rejected', async ({ page }) => {
  await installHelper(page);
  const invalidCases = await page.evaluate(() => {
    const edits: ((state: any) => void)[] = [
      (state) => {
        state.name = {};
      },
      (state) => {
        state.team = [];
      },
      (state) => {
        state.theme = 'sepia';
      },
      (state) => {
        state.tasks[0].id = 1;
      },
      (state) => {
        state.tasks[0].title = null;
      },
      (state) => {
        state.tasks[0].project = 'missing';
      },
      (state) => {
        state.tasks[0].status = 'Closed';
      },
      (state) => {
        state.tasks[0].priority = false;
      },
      (state) => {
        state.tasks[0].assignee = {};
      },
      (state) => {
        state.tasks[0].due = [];
      },
      (state) => {
        state.tasks[0].description = 1;
      },
      (state) => {
        state.tasks[0].dueDate = '2026-02-30';
      },
      (state) => {
        state.projects[0].color = 'url(https://example.com)';
      },
      (state) => {
        state.projects[0].description = {};
      },
      (state) => {
        state.messages[0].role = 'system';
      },
      (state) => {
        state.messages[0].text = {};
      },
      (state) => {
        state.messages[0].requestId = [];
      },
      (state) => {
        state.nodes[0].kind = 'unknown';
      },
      (state) => {
        state.nodes[0].label = false;
      },
      (state) => {
        state.integrations = ['external-unknown'];
      },
      (state) => {
        state.integrations = ['slack', 'slack'];
      },
      (state) => {
        state.notifications = [null];
      },
      (state) => {
        state.automationActive = 'false';
      },
      (state) => {
        state.tasks.push({ ...state.tasks[0] });
      },
      (state) => {
        state.projects.push({ ...state.projects[0] });
      },
      (state) => {
        state.nodes.push({ ...state.nodes[0] });
      },
      (state) => {
        state.activity = [{ id: 'bad', at: 'yesterday', message: 'Invalid' }];
      },
    ];
    return edits.map((edit) => {
      const state = (globalThis as any).novaFixture();
      edit(state);
      return (globalThis as any).novaData.parseStoredWorkspace(state);
    });
  });
  expect(invalidCases).toHaveLength(27);
  expect(invalidCases.every((item) => item.ok === false && typeof item.error === 'string')).toBe(
    true,
  );
});

test('storage parser bounds records and text before accepting untrusted data', async ({ page }) => {
  await installHelper(page);
  const result = await page.evaluate(() => {
    const parse = (globalThis as any).novaData.parseStoredWorkspace;
    const many = (globalThis as any).novaFixture();
    many.tasks = Array.from({ length: 2001 }, (_, i) => ({ ...many.tasks[0], id: `t-${i}` }));
    const oversized = (globalThis as any).novaFixture();
    oversized.tasks[0].title = 'x'.repeat(201);
    return [
      parse('{broken JSON'),
      parse(null),
      parse('x'.repeat(2_000_001)),
      parse(many),
      parse(oversized),
    ];
  });
  expect(result.every((item) => item.ok === false)).toBe(true);
});

test('repository and milestone imports preserve provenance and guard functional duplicates', async ({
  page,
}) => {
  await installHelper(page);
  const result = await page.evaluate(() => {
    const { importGitHubProject, importGitHubMilestone, parseStoredWorkspace } = (globalThis as any)
      .novaData;
    const state = (globalThis as any).novaFixture();
    Object.freeze(state.projects);
    Object.freeze(state.tasks);
    const at = '2026-10-07T12:00:00.000Z';
    const project = {
      id: 'repo-1',
      name: 'facebook/react',
      description: 'React project',
      color: '#ab9cff',
      source: {
        kind: 'github-repository',
        id: 10270250,
        fullName: 'facebook/react',
        url: 'https://github.com/facebook/react',
        importedAt: at,
      },
    };
    const imported = importGitHubProject(state, project, { id: 'activity-repo', at });
    const repeated = importGitHubProject(state, project, { id: 'activity-repo', at });
    const duplicate = importGitHubProject(
      imported,
      { ...project, id: 'another-local-id' },
      { id: 'activity-duplicate', at },
    );
    const task = {
      id: 'milestone-1',
      title: 'Next release',
      project: project.id,
      status: 'Todo',
      priority: 'Medium',
      assignee: 'Alex',
      due: 'Fri, 9 Oct',
      dueDate: '2026-10-09',
      description: 'Prepare a release',
      source: {
        kind: 'github-milestone',
        id: 300,
        number: 12,
        repository: 'facebook/react',
        url: 'https://github.com/facebook/react/milestone/12',
        importedAt: at,
      },
    };
    const next = importGitHubMilestone(imported, task, { id: 'activity-milestone', at });
    const again = importGitHubMilestone(
      next,
      { ...task, id: 'other-task-id' },
      { id: 'activity-extra', at },
    );
    const reloaded = parseStoredWorkspace(JSON.stringify(next));
    return {
      imported,
      repeated,
      duplicateSame: duplicate === imported,
      next,
      againSame: again === next,
      reloaded,
      original: state,
    };
  });
  expect(result.imported).toEqual(result.repeated);
  expect(result.duplicateSame).toBe(true);
  expect(result.againSame).toBe(true);
  expect(result.original.projects).toHaveLength(1);
  expect(result.original.tasks).toHaveLength(1);
  expect(result.next.tasks[0]).toMatchObject({
    source: { id: 300, repository: 'facebook/react', number: 12 },
    dueDate: '2026-10-09',
    createdAt: '2026-10-07T12:00:00.000Z',
  });
  expect(result.next.activity.map((entry: { id: string }) => entry.id)).toEqual([
    'activity-milestone',
    'activity-repo',
  ]);
  expect(result.reloaded.ok).toBe(true);
  expect(result.reloaded.state).toEqual({ ...result.next, activity: result.next.activity });
});

test('milestone imports need the matching repository and safe canonical GitHub links', async ({
  page,
}) => {
  await installHelper(page);
  const result = await page.evaluate(() => {
    const { importGitHubProject, importGitHubMilestone, parseStoredWorkspace } = (globalThis as any)
      .novaData;
    const state = (globalThis as any).novaFixture();
    const at = '2026-10-07T12:00:00.000Z';
    const project = {
      id: 'repo',
      name: 'React',
      description: '',
      color: '#ab9cff',
      source: {
        kind: 'github-repository',
        id: 10,
        fullName: 'facebook/react',
        url: 'https://github.com/facebook/react',
        importedAt: at,
      },
    };
    const unsafe = importGitHubProject(
      state,
      { ...project, source: { ...project.source, url: 'https://evil.example/redirect' } },
      { id: 'event', at },
    );
    const imported = importGitHubProject(state, project, { id: 'repo-event', at });
    const task = {
      id: 'm1',
      title: 'Release',
      project: 'p1',
      status: 'Todo',
      priority: 'Medium',
      assignee: 'Alex',
      due: 'No due date',
      source: {
        kind: 'github-milestone',
        id: 123,
        number: 1,
        repository: 'facebook/react',
        url: 'https://github.com/facebook/react/milestone/1',
        importedAt: at,
      },
    };
    const wrongProject = importGitHubMilestone(imported, task, { id: 'bad-event', at });
    const differentRepository = importGitHubMilestone(
      imported,
      {
        ...task,
        project: 'repo',
        source: {
          ...task.source,
          repository: 'owner/other',
          url: 'https://github.com/owner/other/milestone/1',
        },
      },
      { id: 'bad-event-2', at },
    );
    const valid = importGitHubMilestone(
      imported,
      { ...task, project: 'repo' },
      { id: 'valid-event', at },
    );
    const tampered = structuredClone(valid);
    tampered.tasks[0].source.url = 'javascript:alert(1)';
    const duplicateNumber = structuredClone(valid);
    duplicateNumber.tasks.unshift({
      ...duplicateNumber.tasks[0],
      id: 'm2',
      source: { ...duplicateNumber.tasks[0].source, id: 124 },
    });
    return {
      unsafeSame: unsafe === state,
      wrongSame: wrongProject === imported,
      differentSame: differentRepository === imported,
      validHasNoDate: valid.tasks[0].dueDate === undefined,
      tampered: parseStoredWorkspace(tampered),
      duplicateNumber: parseStoredWorkspace(duplicateNumber),
    };
  });
  expect(result).toMatchObject({
    unsafeSame: true,
    wrongSame: true,
    differentSame: true,
    validHasNoDate: true,
    tampered: { ok: false },
    duplicateNumber: { ok: false },
  });
});

test('activity is immutable, bounded and idempotent for preallocated event metadata', async ({
  page,
}) => {
  await installHelper(page);
  const result = await page.evaluate(() => {
    const { recordActivity, parseStoredWorkspace } = (globalThis as any).novaData;
    const state = (globalThis as any).novaFixture();
    state.activity = Array.from({ length: 100 }, (_, i) => ({
      id: `event-${i}`,
      at: '2026-10-07T12:00:00.000Z',
      message: `Entry ${i}`,
    }));
    Object.freeze(state.activity);
    const next = recordActivity(state, {
      id: 'new',
      at: '2026-10-07T12:01:00.000Z',
      message: 'Imported a milestone',
      taskId: 't1',
      projectId: 'p1',
    });
    const replay = recordActivity(next, {
      id: 'new',
      at: '2026-10-07T12:01:00.000Z',
      message: 'Imported a milestone',
    });
    return {
      originalLength: state.activity.length,
      next,
      replaySame: replay === next,
      parsed: parseStoredWorkspace(next),
    };
  });
  expect(result.originalLength).toBe(100);
  expect(result.next.activity).toHaveLength(100);
  expect(result.next.activity[0].id).toBe('new');
  expect(result.next.activity[99].id).toBe('event-98');
  expect(result.replaySame).toBe(true);
  expect(result.parsed.ok).toBe(true);
});

test('repository reconciliation follows stable IDs and preserves local work across canonical renames', async ({
  page,
}) => {
  await installHelper(page);
  const result = await page.evaluate(() => {
    const {
      importGitHubProject,
      importGitHubMilestone,
      reconcileGitHubRepository,
      parseStoredWorkspace,
    } = (globalThis as any).novaData;
    const original = (globalThis as any).novaFixture();
    const at = '2026-10-07T12:00:00.000Z';
    const source = {
      kind: 'github-repository',
      id: 10,
      fullName: 'old-owner/old-repo',
      url: 'https://github.com/old-owner/old-repo',
      importedAt: at,
    };
    const imported = importGitHubProject(
      original,
      {
        id: 'imported-project',
        name: 'My customised launch',
        description: 'Local project description',
        color: '#7dd3c7',
        source,
      },
      { id: 'project-event', at },
    );
    const state = importGitHubMilestone(
      imported,
      {
        id: 'imported-task',
        title: 'My own next step',
        description: 'Local notes',
        project: 'imported-project',
        status: 'In progress',
        priority: 'High',
        assignee: 'Maya',
        due: 'Today',
        source: {
          kind: 'github-milestone',
          id: 123,
          number: 7,
          repository: source.fullName,
          url: `${source.url}/milestone/7`,
          importedAt: at,
        },
      },
      { id: 'task-event', at },
    );
    Object.freeze(state.tasks);
    Object.freeze(state.projects);
    Object.freeze(state.tasks[0]);
    Object.freeze(state.projects[1]);
    const renamed = reconcileGitHubRepository(state, 10, 'new-owner/new-repo');
    const unchanged = reconcileGitHubRepository(renamed, 10, 'new-owner/new-repo');
    const caseChange = reconcileGitHubRepository(state, 10, 'Old-Owner/Old-Repo');
    const conflicting = importGitHubProject(
      state,
      {
        id: 'other-repo',
        name: 'Another project',
        description: '',
        color: '#ab9cff',
        source: {
          ...source,
          id: 11,
          fullName: 'new-owner/new-repo',
          url: 'https://github.com/new-owner/new-repo',
        },
      },
      { id: 'other-event', at },
    );
    const collision = reconcileGitHubRepository(conflicting, 10, 'NEW-OWNER/NEW-REPO');
    return {
      before: state,
      renamed,
      caseChange,
      parsed: parseStoredWorkspace(renamed),
      unchangedSame: unchanged === renamed,
      collisionSame: collision === conflicting,
      unknownSame: reconcileGitHubRepository(state, 999, 'new-owner/new-repo') === state,
      invalidSame: reconcileGitHubRepository(state, 10, '../unsafe') === state,
      unchangedOtherTask: renamed.tasks[1] === state.tasks[1],
      unchangedOtherProject: renamed.projects[0] === state.projects[0],
      sameActivity: renamed.activity === state.activity,
      sameMessages: renamed.messages === state.messages,
      sameNodes: renamed.nodes === state.nodes,
    };
  });
  expect(result.renamed.projects[1]).toEqual({
    ...result.before.projects[1],
    source: {
      ...result.before.projects[1].source,
      fullName: 'new-owner/new-repo',
      url: 'https://github.com/new-owner/new-repo',
    },
  });
  expect(result.renamed.tasks[0]).toEqual({
    ...result.before.tasks[0],
    source: {
      ...result.before.tasks[0].source,
      repository: 'new-owner/new-repo',
      url: 'https://github.com/new-owner/new-repo/milestone/7',
    },
  });
  expect(result.before.projects[1].source.fullName).toBe('old-owner/old-repo');
  expect(result.caseChange.tasks[0].source.repository).toBe('Old-Owner/Old-Repo');
  expect(result).toMatchObject({
    unchangedSame: true,
    collisionSame: true,
    unknownSame: true,
    invalidSame: true,
    unchangedOtherTask: true,
    unchangedOtherProject: true,
    sameActivity: true,
    sameMessages: true,
    sameNodes: true,
    parsed: { ok: true },
  });
});
