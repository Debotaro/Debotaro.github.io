import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');

// Use the actual TS boundary without requiring a browser or a bundler build.
function moduleFromSource(name, dependencies = {}, localStorage) {
  const source = readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  const dependency = (id) => {
    if (!Object.hasOwn(dependencies, id)) throw new Error(`Unexpected dependency ${id}`);
    return dependencies[id];
  };
  new Function('exports', 'require', 'localStorage', compiled)(exports, dependency, localStorage);
  return exports;
}

const storage = moduleFromSource('storage');
const data = moduleFromSource('data', { './storage': storage });
const fixture = () => structuredClone(data.seed);
const parse = (value) => storage.parseStoredState(JSON.stringify(value));
const imported = () => ({
  ...fixture().tasks[0],
  id: 'GH-100042',
  title: 'A customised imported issue',
  source: {
    kind: 'github',
    issueId: 100042,
    issueNumber: 42,
    repository: 'facebook/react',
    url: 'https://github.com/facebook/react/issues/42',
    importedAt: '2026-10-09T10:30:00.000Z',
  },
});

test('version-1 seed and valid customised/imported records survive a round trip', () => {
  assert.deepEqual(parse(fixture()), fixture());
  const state = fixture();
  state.settings = {
    ...state.settings,
    name: 'Deboraj Sarkar',
    workspace: 'Custom studio',
    timezone: 'Asia/Kolkata',
    compact: true,
    target: 9_000,
    costBudget: 4_000,
  };
  state.tasks.unshift(imported());
  state.tasks[1].title = 'Keep my supplier changes';
  state.coverage[0].shifts[2] = 'On call';
  state.notices[0].read = true;
  assert.deepEqual(parse(state), state);
});

test('supported state is reconstructed without unknown fields or mutating input', () => {
  const state = fixture();
  state.secret = 'drop me';
  state.settings.password = 'drop me too';
  state.tasks[0].unexpected = { nested: true };
  state.tasks.unshift(imported());
  state.tasks[0].source.token = 'not retained';
  state.notices[0].extra = true;
  state.coverage[0].extra = true;
  const before = structuredClone(state);
  const result = parse(state);
  assert.deepEqual(state, before);
  assert.equal(Object.hasOwn(result, 'secret'), false);
  assert.equal(Object.hasOwn(result.settings, 'password'), false);
  assert.equal(Object.hasOwn(result.tasks[1], 'unexpected'), false);
  assert.equal(Object.hasOwn(result.tasks[0].source, 'token'), false);
  assert.equal(Object.hasOwn(result.notices[0], 'extra'), false);
  assert.equal(Object.hasOwn(result.coverage[0], 'extra'), false);
});

test('malformed nested records are rejected atomically instead of reaching the UI', () => {
  const cases = [
    [
      'task record',
      (state) => {
        state.tasks[0] = null;
      },
    ],
    [
      'title',
      (state) => {
        state.tasks[0].title = {};
      },
    ],
    [
      'empty title',
      (state) => {
        state.tasks[0].title = '  ';
      },
    ],
    [
      'description',
      (state) => {
        state.tasks[0].description = [];
      },
    ],
    [
      'owner',
      (state) => {
        state.tasks[0].owner = null;
      },
    ],
    [
      'department',
      (state) => {
        state.tasks[0].department = 'Unknown';
      },
    ],
    [
      'priority',
      (state) => {
        state.tasks[0].priority = 'Urgent';
      },
    ],
    [
      'status',
      (state) => {
        state.tasks[0].status = 'Closed';
      },
    ],
    [
      'task location',
      (state) => {
        state.tasks[0].location = false;
      },
    ],
    [
      'notice title',
      (state) => {
        state.notices[0].title = {};
      },
    ],
    [
      'notice read',
      (state) => {
        state.notices[0].read = 'false';
      },
    ],
    [
      'notice category',
      (state) => {
        state.notices[0].kind = 'billing';
      },
    ],
    [
      'settings record',
      (state) => {
        state.settings = [];
      },
    ],
    [
      'workspace name',
      (state) => {
        state.settings.workspace = '';
      },
    ],
    [
      'profile name',
      (state) => {
        state.settings.name = {};
      },
    ],
    [
      'email',
      (state) => {
        state.settings.email = false;
      },
    ],
    [
      'compact preference',
      (state) => {
        state.settings.compact = 1;
      },
    ],
    [
      'digest preference',
      (state) => {
        state.settings.emailDigest = null;
      },
    ],
    [
      'coverage preference',
      (state) => {
        state.settings.coverageAlerts = 'true';
      },
    ],
    [
      'negative target',
      (state) => {
        state.settings.target = -1;
      },
    ],
    [
      'unbounded budget',
      (state) => {
        state.settings.costBudget = 1_000_001;
      },
    ],
    [
      'coverage name',
      (state) => {
        state.coverage[0].name = null;
      },
    ],
    [
      'coverage role',
      (state) => {
        state.coverage[0].role = [];
      },
    ],
    [
      'coverage location',
      (state) => {
        state.coverage[0].location = 'Unknown';
      },
    ],
    [
      'coverage week',
      (state) => {
        state.coverage[0].shifts = ['Off'];
      },
    ],
    [
      'unknown shift',
      (state) => {
        state.coverage[0].shifts[0] = 'Tomorrow';
      },
    ],
  ];
  for (const [name, mutate] of cases) {
    const state = fixture();
    mutate(state);
    assert.equal(parse(state), null, name);
  }
});

test('impossible dates and unsupported timezones cannot break display formatting', () => {
  for (const due of ['0000-01-01', '2026-02-30', '2026-13-01', '09/10/2026', 'not-a-date']) {
    const state = fixture();
    state.tasks[0].due = due;
    assert.equal(parse(state), null, due);
  }
  for (const due of ['0001-01-01', '9999-12-31']) {
    const state = fixture();
    state.tasks[0].due = due;
    assert.notEqual(parse(state), null, due);
  }
  for (const time of ['tomorrow', '2026-02-30T10:00:00Z', '2026-10-09T99:99:00Z']) {
    const state = fixture();
    state.notices[0].time = time;
    assert.equal(parse(state), null, time);
  }
  const state = fixture();
  state.settings.timezone = 'Planet/Nowhere';
  assert.equal(parse(state), null);
  state.settings.timezone = 'UTC';
  assert.notEqual(parse(state), null);
});

test('imported task provenance requires positive IDs and the canonical GitHub URL', () => {
  const changes = [
    (source) => {
      source.kind = 'other';
    },
    (source) => {
      source.issueId = 0;
    },
    (source) => {
      source.issueId = Number.MAX_SAFE_INTEGER + 1;
    },
    (source) => {
      source.issueNumber = 1.5;
    },
    (source) => {
      source.repository = 'facebook/..';
    },
    (source) => {
      source.repository = 'facebook/react/extra';
    },
    (source) => {
      source.url = 'javascript:alert(1)';
    },
    (source) => {
      source.url = 'https://github.com.attacker.invalid/facebook/react/issues/42';
    },
    (source) => {
      source.url = 'https://github.com/facebook/react/issues/43';
    },
    (source) => {
      source.importedAt = 'yesterday';
    },
  ];
  for (const change of changes) {
    const state = fixture();
    const task = imported();
    change(task.source);
    state.tasks.unshift(task);
    assert.equal(parse(state), null);
  }
  const state = fixture();
  state.tasks[0].source = null;
  assert.equal(parse(state), null);
});

test('duplicate record IDs and duplicate imported issues are rejected', () => {
  for (const name of ['tasks', 'notices', 'coverage']) {
    const state = fixture();
    state[name].push(structuredClone(state[name][0]));
    assert.equal(parse(state), null, name);
  }
  const state = fixture();
  state.tasks.unshift(imported(), { ...imported(), id: 'another-task-id' });
  assert.equal(parse(state), null);
});

test('text, collection and serialized limits bound persistent input', () => {
  for (const [name, limit] of [
    ['tasks', storage.storageLimits.tasks],
    ['notices', storage.storageLimits.notices],
    ['coverage', storage.storageLimits.coverage],
  ]) {
    const state = fixture();
    state[name] = Array.from({ length: limit + 1 }, (_, index) => ({
      ...state[name][0],
      id: `item-${index}`,
    }));
    assert.equal(parse(state), null, name);
  }
  for (const change of [
    (state) => {
      state.tasks[0].title = 'x'.repeat(101);
    },
    (state) => {
      state.tasks[0].description = 'x'.repeat(501);
    },
    (state) => {
      state.settings.name = 'x'.repeat(61);
    },
    (state) => {
      state.notices[0].detail = 'x'.repeat(1_001);
    },
  ]) {
    const state = fixture();
    change(state);
    assert.equal(parse(state), null);
  }
  assert.equal(storage.parseStoredState('x'.repeat(storage.storageLimits.serialized + 1)), null);
});

test('empty collections remain valid and broken envelopes return no state', () => {
  const state = fixture();
  state.tasks = [];
  state.notices = [];
  state.coverage = [];
  assert.deepEqual(parse(state), state);
  for (const raw of [
    null,
    '',
    '{broken JSON',
    'null',
    '[]',
    '{}',
    JSON.stringify({ ...fixture(), version: 2 }),
  ]) {
    assert.equal(storage.parseStoredState(raw), null);
  }
});

function storedBoundary(initial, behavior = {}) {
  const values = new Map(initial === null ? [] : [[storage.ATLAS_STORAGE_KEY, initial]]);
  const writes = [];
  const localStorage = {
    getItem(key) {
      if (behavior.readError) throw new Error('Storage disabled');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (behavior.writeError) throw new Error('Storage full');
      values.set(key, value);
      writes.push(value);
    },
  };
  return { ...moduleFromSource('data', { './storage': storage }, localStorage), values, writes };
}

test('fallback states never overwrite malformed raw data during repeated initial saves', () => {
  const raw = '{recoverable original but invalid JSON';
  const boundary = storedBoundary(raw);
  const first = boundary.loadState();
  const repeated = boundary.loadState();
  assert.deepEqual(first, fixture());
  assert.notEqual(first, boundary.seed);
  boundary.persistState(first);
  boundary.persistState(first);
  boundary.persistState(repeated);
  assert.equal(boundary.values.get(storage.ATLAS_STORAGE_KEY), raw);
  assert.equal(boundary.writes.length, 0);
});

test('an intentional edit or explicit reset saves a new state after recovery', () => {
  const boundary = storedBoundary('{invalid');
  const fallback = boundary.loadState();
  const edited = {
    ...fallback,
    settings: { ...fallback.settings, workspace: 'Recovered workspace' },
  };
  boundary.persistState(edited);
  assert.equal(
    JSON.parse(boundary.values.get(storage.ATLAS_STORAGE_KEY)).settings.workspace,
    'Recovered workspace',
  );
  const resetBoundary = storedBoundary('{invalid');
  resetBoundary.loadState();
  resetBoundary.persistState(structuredClone(resetBoundary.seed));
  assert.deepEqual(JSON.parse(resetBoundary.values.get(storage.ATLAS_STORAGE_KEY)), fixture());
});

test('valid existing data remains persistent and absent storage starts a fresh demo', () => {
  const state = fixture();
  state.tasks.unshift(imported());
  const boundary = storedBoundary(JSON.stringify(state));
  const loaded = boundary.loadState();
  boundary.persistState(loaded);
  assert.deepEqual(loaded, state);
  assert.deepEqual(JSON.parse(boundary.values.get(storage.ATLAS_STORAGE_KEY)), state);
  const empty = storedBoundary(null);
  const fallback = empty.loadState();
  empty.persistState(fallback);
  assert.deepEqual(JSON.parse(empty.values.get(storage.ATLAS_STORAGE_KEY)), fixture());
});

test('invalid or over-limit edits cannot replace the last valid saved snapshot', () => {
  const original = JSON.stringify(fixture());
  const boundary = storedBoundary(original);
  const loaded = boundary.loadState();
  const overLimit = {
    ...loaded,
    tasks: Array.from({ length: storage.storageLimits.tasks + 1 }, (_, index) => ({
      ...loaded.tasks[0],
      id: `task-${index}`,
    })),
  };
  const malformed = structuredClone(loaded);
  malformed.tasks[0].status = 'Unsupported status';
  for (const edited of [overLimit, malformed]) {
    assert.throws(
      () => boundary.persistState(edited),
      /invalid data or supported storage limits exceeded/,
    );
    assert.equal(boundary.values.get(storage.ATLAS_STORAGE_KEY), original);
    assert.equal(boundary.writes.length, 0);
  }
  const validEdit = { ...loaded, settings: { ...loaded.settings, workspace: 'Safe saved edit' } };
  boundary.persistState(validEdit);
  assert.equal(boundary.writes.length, 1);
  assert.deepEqual(JSON.parse(boundary.values.get(storage.ATLAS_STORAGE_KEY)), validEdit);
  assert.deepEqual(boundary.loadState(), validEdit);
});

test('unavailable reads still produce independent seed data and write errors propagate to the UI boundary', () => {
  const boundary = storedBoundary(null, { readError: true, writeError: true });
  const fallback = boundary.loadState();
  assert.deepEqual(fallback, fixture());
  fallback.tasks[0].title = 'Only this clone changes';
  assert.notEqual(fallback.tasks[0].title, boundary.seed.tasks[0].title);
  assert.throws(() => boundary.persistState(fallback), /Storage full/);
});
