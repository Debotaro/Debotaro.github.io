import type { Coverage, Notice, Settings, State, Task, TaskSource } from './data';

export const ATLAS_STORAGE_KEY = 'atlas-ops-v1';

// Bound untrusted browser data before the UI sorts, formats or renders it.
// Text limits follow the editor; collection limits leave room for demo use.
export const storageLimits = {
  serialized: 2_000_000,
  tasks: 2_000,
  notices: 5_000,
  coverage: 100,
} as const;

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number, required = false): value is string =>
  typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
const member = <T extends string>(value: unknown, choices: readonly T[]): value is T =>
  typeof value === 'string' && choices.includes(value as T);
const positiveId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const target = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000;

export function isSupportedDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-'))
    return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function timestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 35 &&
    isSupportedDate(value.slice(0, 10)) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function timezone(value: unknown): value is string {
  if (!text(value, 64, true)) return false;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

function source(value: unknown): TaskSource | null {
  if (
    !record(value) ||
    value.kind !== 'github' ||
    !positiveId(value.issueId) ||
    !positiveId(value.issueNumber) ||
    typeof value.repository !== 'string' ||
    !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})\/[a-zA-Z0-9_.-]{1,100}$/.test(value.repository) ||
    ['.', '..'].includes(value.repository.split('/')[1]) ||
    !timestamp(value.importedAt)
  )
    return null;
  const url = `https://github.com/${value.repository}/issues/${value.issueNumber}`;
  // Stored provenance must agree with the canonical repository/issue URL.
  if (value.url !== url) return null;
  return {
    kind: 'github',
    issueId: value.issueId,
    issueNumber: value.issueNumber,
    repository: value.repository,
    url,
    importedAt: value.importedAt,
  };
}

function task(value: unknown): Task | null {
  if (
    !record(value) ||
    !text(value.id, 100, true) ||
    !text(value.title, 100, true) ||
    !text(value.description, 500) ||
    !text(value.owner, 60, true) ||
    !isSupportedDate(value.due) ||
    !member(value.department, ['Operations', 'Finance', 'People', 'Logistics']) ||
    !member(value.priority, ['High', 'Medium', 'Low']) ||
    !member(value.status, ['Backlog', 'In progress', 'In review', 'Complete']) ||
    !member(value.location, ['London', 'Amsterdam', 'Berlin'])
  )
    return null;
  const imported = value.source === undefined ? undefined : source(value.source);
  if (imported === null) return null;
  return {
    id: value.id,
    title: value.title,
    description: value.description,
    department: value.department,
    priority: value.priority,
    status: value.status,
    owner: value.owner,
    due: value.due,
    location: value.location,
    ...(imported ? { source: imported } : {}),
  };
}

function notice(value: unknown): Notice | null {
  if (
    !record(value) ||
    !text(value.id, 100, true) ||
    !text(value.title, 250, true) ||
    !text(value.detail, 1_000) ||
    !member(value.kind, ['task', 'coverage', 'system']) ||
    typeof value.read !== 'boolean' ||
    !timestamp(value.time)
  )
    return null;
  return {
    id: value.id,
    title: value.title,
    detail: value.detail,
    kind: value.kind,
    read: value.read,
    time: value.time,
  };
}

function settings(value: unknown): Settings | null {
  if (
    !record(value) ||
    !text(value.workspace, 40, true) ||
    !text(value.name, 60, true) ||
    !text(value.email, 320) ||
    !timezone(value.timezone) ||
    typeof value.compact !== 'boolean' ||
    typeof value.emailDigest !== 'boolean' ||
    typeof value.coverageAlerts !== 'boolean' ||
    !target(value.target) ||
    !target(value.costBudget)
  )
    return null;
  return {
    workspace: value.workspace,
    name: value.name,
    email: value.email,
    timezone: value.timezone,
    compact: value.compact,
    emailDigest: value.emailDigest,
    coverageAlerts: value.coverageAlerts,
    target: value.target,
    costBudget: value.costBudget,
  };
}

function coverage(value: unknown): Coverage | null {
  if (
    !record(value) ||
    !text(value.id, 100, true) ||
    !text(value.name, 60, true) ||
    !text(value.initials, 4, true) ||
    !text(value.role, 100, true) ||
    !member(value.location, ['London', 'Amsterdam', 'Berlin']) ||
    !Array.isArray(value.shifts) ||
    value.shifts.length !== 5 ||
    !value.shifts.every((shift) =>
      member(shift, ['09:00–17:00', '08:00–16:00', '10:00–18:00', 'On call', 'Leave', 'Off']),
    )
  )
    return null;
  return {
    id: value.id,
    name: value.name,
    initials: value.initials,
    role: value.role,
    location: value.location,
    shifts: [...value.shifts],
  };
}

function collection<T extends { id: string }>(
  value: unknown,
  max: number,
  parse: (item: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(value) || value.length > max) return null;
  const parsed: T[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    const result = parse(item);
    if (!result || ids.has(result.id)) return null;
    ids.add(result.id);
    parsed.push(result);
  }
  return parsed;
}

/** Pure, atomic version-1 validation. No storage access, mutations or partial recovery. */
export function parseStoredState(raw: string | null): State | null {
  if (typeof raw !== 'string' || raw.length > storageLimits.serialized) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.version !== 1) return null;
    const parsedSettings = settings(value.settings);
    const tasks = collection(value.tasks, storageLimits.tasks, task);
    const notices = collection(value.notices, storageLimits.notices, notice);
    const people = collection(value.coverage, storageLimits.coverage, coverage);
    if (!parsedSettings || !tasks || !notices || !people) return null;
    const issueIds = tasks.flatMap((item) => (item.source ? [item.source.issueId] : []));
    if (new Set(issueIds).size !== issueIds.length) return null;
    return { version: 1, settings: parsedSettings, tasks, notices, coverage: people };
  } catch {
    return null;
  }
}
