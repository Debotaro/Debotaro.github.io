import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_ACTOR,
  MAX_ACTIVITY,
  MAX_STORED_CHARS,
  RelayError,
  applyAction,
  parseWorkspace,
  prepareAction,
  seedWorkspace,
  type Actor,
  type Asset,
  type Comment,
  type Project,
  type Task,
} from '../src/domain.ts';

const timestamp = '2026-10-07T12:00:00.000Z';
const uid = (n: number) => `70000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const sample = () => seedWorkspace('/relay-os/');
const role = (name: Actor['role']): Actor => ({ ...DEMO_ACTOR, role: name });
const newProject = (): Project => ({
  id: uid(1),
  title: 'New client launch',
  client: 'Sample client',
  description: 'A test project',
  color: '#c7f970',
  status: 'active',
  createdAt: timestamp,
});
const newTask = (): Task => ({
  id: uid(2),
  projectId: sample().projects[0].id,
  title: 'Adjust the headline',
  status: 'todo',
  priority: 'high',
  assignee: 'Deboraj Sarkar',
  dueDate: '2026-10-15',
  createdAt: timestamp,
});
const newAsset = (): Asset => ({
  id: uid(3),
  projectId: sample().projects[0].id,
  name: 'Revision.png',
  url: 'data:image/png;base64,iVBORw0KGgo=',
  mime: 'image/png',
  size: 100,
  version: 1,
  status: 'draft',
  createdAt: timestamp,
  previousId: null,
});
const newComment = (): Comment => ({
  id: uid(4),
  assetId: sample().assets[0].id,
  projectId: sample().projects[0].id,
  author: 'An untrusted author',
  body: 'Make the caption easier to read.',
  x: 0.25,
  y: 0.75,
  resolved: false,
  taskId: null,
  createdAt: timestamp,
});

test('seed contains coherent projects, tasks, image annotations and trusted local sample art', () => {
  const result = parseWorkspace(sample());
  assert.equal(result.ok, true);
  assert.equal(sample().projects.length, 3);
  assert.equal(sample().tasks.length, 8);
  assert.equal(sample().assets[0].url, '/relay-os/sample-design.svg');
  assert.equal(parseWorkspace(JSON.stringify(sample())).ok, true);
  assert.equal(parseWorkspace(seedWorkspace('./')).ok, true);
  assert.equal(
    applyAction(seedWorkspace('./'), { type: 'create_task', task: newTask() }, role('pm')).tasks
      .length,
    9,
  );
});

test('persistence strips untrusted extra fields and rejects oversized, corrupt or dangling data', () => {
  const initial = sample();
  const parsed = parseWorkspace({
    ...initial,
    serviceRole: 'ignored',
    projects: initial.projects.map((value) => ({ ...value, admin: true })),
  });
  assert.ok(parsed.ok);
  assert.equal('serviceRole' in parsed.state, false);
  assert.equal('admin' in parsed.state.projects[0], false);
  assert.equal(parseWorkspace('{broken').ok, false);
  assert.equal(parseWorkspace(' '.repeat(MAX_STORED_CHARS + 1)).ok, false);
  assert.equal(
    parseWorkspace({ ...initial, tasks: [{ ...initial.tasks[0], projectId: uid(9) }] }).ok,
    false,
  );
  assert.equal(
    parseWorkspace({ ...initial, tasks: [initial.tasks[0], initial.tasks[0]] }).ok,
    false,
  );
});

test('calendar dates, statuses, unsafe colours/URLs and out-of-bounds annotations are rejected', () => {
  const initial = sample();
  for (const dueDate of ['2026-02-30', '2026-13-01', '0000-01-01', 'tomorrow'])
    assert.equal(
      parseWorkspace({ ...initial, tasks: [{ ...initial.tasks[0], dueDate }] }).ok,
      false,
    );
  assert.equal(
    parseWorkspace({
      ...initial,
      projects: [{ ...initial.projects[0], createdAt: '2026-02-30T10:00:00Z' }],
    }).ok,
    false,
  );
  assert.equal(
    parseWorkspace({
      ...initial,
      projects: [{ ...initial.projects[0], color: 'url(javascript:alert(1))' }],
    }).ok,
    false,
  );
  for (const url of [
    'javascript:alert(1)',
    'http://example.com/test.png',
    '//example.com/image.png',
    '/relay-os/../secret',
    'data:image/svg+xml;base64,PHN2Zz4=',
  ])
    assert.equal(parseWorkspace({ ...initial, assets: [{ ...initial.assets[0], url }] }).ok, false);
  assert.equal(
    parseWorkspace({ ...initial, comments: [{ ...initial.comments[0], x: NaN }] }).ok,
    false,
  );
  assert.equal(
    parseWorkspace({ ...initial, comments: [{ ...initial.comments[0], x: null, y: 50 }] }).ok,
    false,
  );
});

test('admin/PM can manage projects; designers and clients cannot bypass project controls', () => {
  const project = newProject();
  for (const actor of [role('admin'), role('pm')])
    assert.equal(
      applyAction(sample(), { type: 'create_project', project }, actor).projects.length,
      4,
    );
  for (const actor of [role('designer'), role('client')])
    for (const action of [
      { type: 'create_project', project },
      { type: 'update_project', id: sample().projects[0].id, patch: { title: 'Hijacked' } },
      { type: 'delete_project', id: sample().projects[0].id },
    ] as const)
      assert.throws(() => applyAction(sample(), action, actor), /permission/);
});

test('designers can own task workflow while clients remain read-only on task mutations', () => {
  const task = newTask();
  let state = applyAction(sample(), { type: 'create_task', task }, role('designer'));
  state = applyAction(
    state,
    { type: 'update_task', id: task.id, patch: { status: 'in_progress', dueDate: null } },
    role('designer'),
  );
  assert.equal(state.tasks.find((value) => value.id === task.id)?.status, 'in_progress');
  assert.equal(state.tasks.find((value) => value.id === task.id)?.dueDate, null);
  for (const action of [
    { type: 'create_task', task },
    { type: 'update_task', id: task.id, patch: { status: 'done' } },
    { type: 'delete_task', id: task.id },
  ] as const)
    assert.throws(() => applyAction(state, action, role('client')), /permission/);
  state = applyAction(state, { type: 'delete_task', id: task.id }, role('designer'));
  assert.equal(
    state.tasks.some((value) => value.id === task.id),
    false,
  );
});

test('comment attribution comes from the actor and only its author/managers can resolve it', () => {
  let state = applyAction(sample(), { type: 'add_comment', comment: newComment() }, role('client'));
  const added = state.comments.find((value) => value.id === uid(4));
  assert.equal(added?.author, DEMO_ACTOR.name);
  state = applyAction(
    state,
    { type: 'resolve_comment', id: uid(4), resolved: true },
    role('client'),
  );
  assert.equal(state.comments.find((value) => value.id === uid(4))?.resolved, true);
  assert.throws(
    () =>
      applyAction(
        state,
        { type: 'resolve_comment', id: sample().comments[0].id, resolved: true },
        role('client'),
      ),
    /permission/,
  );
  assert.throws(
    () =>
      applyAction(
        state,
        {
          type: 'add_comment',
          comment: { ...newComment(), id: uid(5), projectId: sample().projects[1].id },
        },
        role('pm'),
      ),
    /reference/,
  );
});

test('feedback conversion is atomic, duplicate-safe and constrained to the same project', () => {
  const initial = sample(),
    task = newTask(),
    commentId = initial.comments[0].id;
  const converted = applyAction(
    initial,
    { type: 'convert_comment', id: commentId, task },
    role('pm'),
  );
  assert.equal(converted.tasks.length, initial.tasks.length + 1);
  assert.equal(converted.comments[0].taskId, task.id);
  assert.equal(initial.comments[0].taskId, null);
  assert.equal(initial.tasks.length, 8);
  assert.throws(
    () =>
      applyAction(
        converted,
        { type: 'convert_comment', id: commentId, task: { ...task, id: uid(6) } },
        role('pm'),
      ),
    /already/,
  );
  assert.throws(
    () =>
      applyAction(
        initial,
        {
          type: 'convert_comment',
          id: commentId,
          task: { ...task, projectId: initial.projects[1].id },
        },
        role('designer'),
      ),
    /project/,
  );
  assert.throws(
    () => applyAction(initial, { type: 'convert_comment', id: commentId, task }, role('client')),
    /permission/,
  );
  const deleted = applyAction(converted, { type: 'delete_task', id: task.id }, role('pm'));
  assert.equal(deleted.comments[0].taskId, null);
});

test('version chains forbid branching/cross-project revisions and old-version approvals', () => {
  const initial = sample();
  const revision = { ...newAsset(), previousId: initial.assets[0].id, version: 2 };
  const state = applyAction(initial, { type: 'add_asset', asset: revision }, role('designer'));
  assert.equal(state.assets[1].version, 2);
  assert.throws(
    () =>
      applyAction(
        state,
        { type: 'add_asset', asset: { ...revision, id: uid(8) } },
        role('designer'),
      ),
    /latest/,
  );
  assert.throws(
    () =>
      applyAction(
        initial,
        { type: 'add_asset', asset: { ...revision, projectId: initial.projects[1].id } },
        role('pm'),
      ),
    /same project/,
  );
  assert.throws(
    () =>
      applyAction(
        state,
        { type: 'set_approval', id: initial.assets[0].id, status: 'approved' },
        role('client'),
      ),
    /latest/,
  );
  assert.equal(
    parseWorkspace({ ...state, assets: [...state.assets, { ...revision, id: uid(8) }] }).ok,
    false,
  );
});

test('designers request review, clients approve/request changes, approved versions stay final', () => {
  let state = applyAction(sample(), { type: 'add_asset', asset: newAsset() }, role('designer'));
  assert.throws(
    () =>
      applyAction(state, { type: 'set_approval', id: uid(3), status: 'approved' }, role('client')),
    /before a decision/,
  );
  assert.throws(
    () => applyAction(state, { type: 'set_approval', id: uid(3), status: 'approved' }, role('pm')),
    /before a decision/,
  );
  assert.throws(
    () =>
      applyAction(state, { type: 'set_approval', id: uid(3), status: 'review' }, role('client')),
    /permission/,
  );
  state = applyAction(
    state,
    { type: 'set_approval', id: uid(3), status: 'review' },
    role('designer'),
  );
  assert.throws(
    () => applyAction(state, { type: 'set_approval', id: uid(3), status: 'draft' }, role('client')),
    /cannot be reset/,
  );
  assert.throws(
    () =>
      applyAction(
        state,
        { type: 'set_approval', id: uid(3), status: 'approved' },
        role('designer'),
      ),
    /permission/,
  );
  state = applyAction(
    state,
    { type: 'set_approval', id: uid(3), status: 'changes' },
    role('client'),
  );
  state = applyAction(
    state,
    { type: 'set_approval', id: uid(3), status: 'review' },
    role('designer'),
  );
  state = applyAction(
    state,
    { type: 'set_approval', id: uid(3), status: 'approved' },
    role('client'),
  );
  assert.equal(
    applyAction(state, { type: 'set_approval', id: uid(3), status: 'approved' }, role('client')),
    state,
  );
  assert.throws(
    () =>
      applyAction(state, { type: 'set_approval', id: uid(3), status: 'changes' }, role('admin')),
    /final/,
  );
});

test('project deletion cascades children; asset deletion cascades revisions and feedback', () => {
  const initial = sample();
  const revision = { ...newAsset(), previousId: initial.assets[0].id, version: 2 };
  const versioned = applyAction(initial, { type: 'add_asset', asset: revision }, role('pm'));
  const removedAsset = applyAction(
    versioned,
    { type: 'delete_asset', id: initial.assets[0].id },
    role('pm'),
  );
  assert.equal(removedAsset.assets.length, 0);
  assert.equal(removedAsset.comments.length, 0);
  const removedProject = applyAction(
    versioned,
    { type: 'delete_project', id: initial.projects[0].id },
    role('admin'),
  );
  for (const values of [removedProject.tasks, removedProject.assets, removedProject.comments])
    assert.equal(
      values.some((value) => value.projectId === initial.projects[0].id),
      false,
    );
  assert.equal(parseWorkspace(removedProject).ok, true);
});

test('archived projects block edits until restored and patch input cannot change immutable identifiers', () => {
  const initial = sample();
  let state = applyAction(
    initial,
    { type: 'update_project', id: initial.projects[0].id, patch: { status: 'archived' } },
    role('pm'),
  );
  assert.throws(
    () => applyAction(state, { type: 'create_task', task: newTask() }, role('designer')),
    /Restore/,
  );
  assert.throws(
    () => applyAction(state, { type: 'add_comment', comment: newComment() }, role('client')),
    /Restore/,
  );
  state = applyAction(
    state,
    { type: 'update_project', id: initial.projects[0].id, patch: { status: 'active' } },
    role('pm'),
  );
  const changed = applyAction(
    state,
    {
      type: 'update_task',
      id: initial.tasks[0].id,
      patch: { title: 'Safe edit', id: uid(99), projectId: uid(99) } as never,
    },
    role('pm'),
  );
  assert.equal(changed.tasks[0].id, initial.tasks[0].id);
  assert.equal(changed.tasks[0].projectId, initial.tasks[0].projectId);
  assert.equal(changed.tasks[0].title, 'Safe edit');
});

test('activity IDs/timestamps are allocated before updates and history remains bounded', () => {
  const initial = sample();
  const action = prepareAction({
    type: 'update_task',
    id: initial.tasks[0].id,
    patch: { status: 'done' },
  });
  const first = applyAction(initial, action, role('pm')),
    replay = applyAction(initial, action, role('pm'));
  assert.deepEqual(first, replay);
  assert.equal(first.activity[0].id, action.event?.id);
  assert.equal(first.activity[0].at, action.event?.at);
  const prior = {
    ...initial,
    activity: Array.from({ length: MAX_ACTIVITY }, (_, index) => ({
      id: uid(100 + index),
      projectId: null,
      body: 'Sample event',
      at: timestamp,
    })),
  };
  assert.equal(applyAction(prior, action, role('pm')).activity.length, MAX_ACTIVITY);
});

test('invalid actions do not mutate state or leave half-created records', () => {
  const initial = sample(),
    snapshot = JSON.stringify(initial);
  assert.throws(
    () =>
      applyAction(initial, { type: 'create_task', task: { ...newTask(), title: '' } }, role('pm')),
    RelayError,
  );
  assert.throws(
    () =>
      applyAction(
        initial,
        { type: 'create_task', task: { ...newTask(), id: initial.tasks[0].id } },
        role('pm'),
      ),
    /exists/,
  );
  assert.throws(
    () =>
      applyAction(
        initial,
        { type: 'add_asset', asset: { ...newAsset(), status: 'approved' } },
        role('pm'),
      ),
    /start/,
  );
  assert.equal(JSON.stringify(initial), snapshot);
});
