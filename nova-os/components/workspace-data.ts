import type { ActivityEntry, Project, State, Task } from './store';

export type WorkspaceParseResult = { ok: true; state: State } | { ok: false; error: string };
export type ActivityMeta = { id: string; at: string };

const limits = {
  tasks: 2000,
  projects: 500,
  messages: 200,
  nodes: 100,
  integrations: 6,
  notifications: 100,
  activity: 100,
};
const integrationIds = ['slack', 'figma', 'github', 'notion', 'calendar', 'linear'];

function object(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${path} must be an object.`);
  return value as Record<string, unknown>;
}
// eslint-disable-next-line no-control-regex -- Reject nonprinting control characters in stored text.
const controls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
function string(value: unknown, path: string, max: number, allowEmpty = false): string {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    (!allowEmpty && !value.trim()) ||
    controls.test(value)
  )
    throw new Error(`${path} must be valid text (up to ${max} characters).`);
  return value;
}
function id(value: unknown, path: string): string {
  return string(value, path, 150);
}
function enumeration<T extends string>(value: unknown, values: readonly T[], path: string): T {
  if (typeof value !== 'string' || !values.includes(value as T))
    throw new Error(`${path} has an unsupported value.`);
  return value as T;
}
function boolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${path} must be a boolean.`);
  return value;
}
function positiveInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0)
    throw new Error(`${path} must be a positive integer.`);
  return value;
}
function dateOnly(value: unknown, path: string): string {
  const result = string(value, path, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(result) ||
    !Number.isFinite(Date.parse(`${result}T00:00:00.000Z`)) ||
    new Date(`${result}T00:00:00.000Z`).toISOString().slice(0, 10) !== result
  )
    throw new Error(`${path} must be a valid YYYY-MM-DD date.`);
  return result;
}
function timestamp(value: unknown, path: string): string {
  const result = string(value, path, 30);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(result) ||
    !Number.isFinite(Date.parse(result))
  )
    throw new Error(`${path} must be an ISO UTC timestamp.`);
  dateOnly(result.slice(0, 10), path);
  return result;
}
function repositoryName(value: unknown, path: string): string {
  const result = string(value, path, 141);
  const parts = result.split('/');
  if (
    parts.length !== 2 ||
    !/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(parts[0]) ||
    !/^[a-z0-9_.-]{1,100}$/i.test(parts[1]) ||
    ['.', '..'].includes(parts[1])
  )
    throw new Error(`${path} must be owner/repository.`);
  return result;
}
function githubUrl(value: unknown, expected: string, path: string): string {
  const result = string(value, path, 250);
  if (result !== expected) throw new Error(`${path} must match the canonical GitHub URL.`);
  return result;
}
function optionalText(
  data: Record<string, unknown>,
  key: string,
  path: string,
  max: number,
): string | undefined {
  return data[key] === undefined ? undefined : string(data[key], `${path}.${key}`, max, true);
}
function optionalTimestamp(
  data: Record<string, unknown>,
  key: string,
  path: string,
): string | undefined {
  return data[key] === undefined ? undefined : timestamp(data[key], `${path}.${key}`);
}
function project(value: unknown, path: string): Project {
  const data = object(value, path);
  const color = string(data.color, `${path}.color`, 9);
  if (!/^#(?:[a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})$/i.test(color))
    throw new Error(`${path}.color must be a hex colour.`);
  const result: Project = {
    id: id(data.id, `${path}.id`),
    name: string(data.name, `${path}.name`, 200),
    description: string(data.description, `${path}.description`, 2000, true),
    color,
  };
  const createdAt = optionalTimestamp(data, 'createdAt', path),
    updatedAt = optionalTimestamp(data, 'updatedAt', path);
  if (createdAt !== undefined) result.createdAt = createdAt;
  if (updatedAt !== undefined) result.updatedAt = updatedAt;
  if (data.source !== undefined) {
    const source = object(data.source, `${path}.source`);
    const fullName = repositoryName(source.fullName, `${path}.source.fullName`);
    result.source = {
      kind: enumeration(source.kind, ['github-repository'], `${path}.source.kind`),
      id: positiveInteger(source.id, `${path}.source.id`),
      fullName,
      url: githubUrl(source.url, `https://github.com/${fullName}`, `${path}.source.url`),
      importedAt: timestamp(source.importedAt, `${path}.source.importedAt`),
    };
  }
  return result;
}
function task(value: unknown, path: string): Task {
  const data = object(value, path);
  const result: Task = {
    id: id(data.id, `${path}.id`),
    title: string(data.title, `${path}.title`, 200),
    project: id(data.project, `${path}.project`),
    status: enumeration(data.status, ['Todo', 'In progress', 'Done'], `${path}.status`),
    priority: enumeration(data.priority, ['High', 'Medium', 'Low'], `${path}.priority`),
    assignee: string(data.assignee, `${path}.assignee`, 80, true),
    due: string(data.due, `${path}.due`, 80, true),
  };
  const description = optionalText(data, 'description', path, 2000);
  if (description !== undefined) result.description = description;
  if (data.dueDate !== undefined) result.dueDate = dateOnly(data.dueDate, `${path}.dueDate`);
  for (const key of ['createdAt', 'updatedAt', 'completedAt'] as const) {
    const value = optionalTimestamp(data, key, path);
    if (value !== undefined) result[key] = value;
  }
  if (data.source !== undefined) {
    const source = object(data.source, `${path}.source`);
    const repository = repositoryName(source.repository, `${path}.source.repository`),
      number = positiveInteger(source.number, `${path}.source.number`);
    result.source = {
      kind: enumeration(source.kind, ['github-milestone'], `${path}.source.kind`),
      id: positiveInteger(source.id, `${path}.source.id`),
      number,
      repository,
      url: githubUrl(
        source.url,
        `https://github.com/${repository}/milestone/${number}`,
        `${path}.source.url`,
      ),
      importedAt: timestamp(source.importedAt, `${path}.source.importedAt`),
    };
  }
  return result;
}
function activityEntry(value: unknown, path: string): ActivityEntry {
  const data = object(value, path);
  const result: ActivityEntry = {
    id: id(data.id, `${path}.id`),
    at: timestamp(data.at, `${path}.at`),
    message: string(data.message, `${path}.message`, 500),
  };
  if (data.taskId !== undefined) result.taskId = id(data.taskId, `${path}.taskId`);
  if (data.projectId !== undefined) result.projectId = id(data.projectId, `${path}.projectId`);
  return result;
}
function list<T>(
  value: unknown,
  max: number,
  path: string,
  parse: (item: unknown, path: string) => T,
): T[] {
  if (!Array.isArray(value) || value.length > max)
    throw new Error(`${path} must be an array with at most ${max} records.`);
  return value.map((item, index) => parse(item, `${path}[${index}]`));
}
function uniqueIds(records: { id: string }[], path: string): void {
  if (new Set(records.map((item) => item.id)).size !== records.length)
    throw new Error(`${path} contains duplicate IDs.`);
}
function validateRelations(tasks: Task[], projects: Project[]): void {
  const projectIds = new Map(projects.map((item) => [item.id, item]));
  const repositories = new Set<number>(),
    repositoryNames = new Set<string>(),
    milestones = new Set<number>(),
    milestoneNumbers = new Set<string>();
  for (const item of projects) {
    if (item.source) {
      const key = item.source.fullName.toLowerCase();
      if (repositories.has(item.source.id) || repositoryNames.has(key))
        throw new Error('projects contains duplicate GitHub repository imports.');
      repositories.add(item.source.id);
      repositoryNames.add(key);
    }
  }
  for (const item of tasks) {
    const linked = projectIds.get(item.project);
    if (!linked) throw new Error('tasks references a missing project.');
    if (item.source) {
      if (
        !linked.source ||
        linked.source.fullName.toLowerCase() !== item.source.repository.toLowerCase()
      )
        throw new Error('A GitHub milestone must belong to its imported repository project.');
      const key = `${item.source.repository.toLowerCase()}#${item.source.number}`;
      if (milestones.has(item.source.id) || milestoneNumbers.has(key))
        throw new Error('tasks contains duplicate GitHub milestone imports.');
      milestones.add(item.source.id);
      milestoneNumbers.add(key);
    }
  }
}

/** Read existing nova-os-v1 records, preserving supported metadata and stripping unrecognised fields. */
export function parseStoredWorkspace(input: unknown): WorkspaceParseResult {
  try {
    if (typeof input === 'string') {
      if (input.length > 2_000_000)
        throw new Error('Saved workspace exceeds the storage size limit.');
      input = JSON.parse(input);
    }
    const data = object(input, 'workspace');
    const tasks = list(data.tasks, limits.tasks, 'tasks', task);
    const projects = list(data.projects, limits.projects, 'projects', project);
    uniqueIds(tasks, 'tasks');
    uniqueIds(projects, 'projects');
    validateRelations(tasks, projects);
    const messages = list(data.messages, limits.messages, 'messages', (value, path) => {
      const message = object(value, path);
      const result: State['messages'][number] = {
        role: enumeration(message.role, ['assistant', 'user'], `${path}.role`),
        text: string(message.text, `${path}.text`, 20_000, true),
      };
      if (message.requestId !== undefined)
        result.requestId = id(message.requestId, `${path}.requestId`);
      if (message.action !== undefined)
        result.action = string(message.action, `${path}.action`, 200, true);
      return result;
    });
    const nodes = list(data.nodes, limits.nodes, 'nodes', (value, path) => {
      const node = object(value, path);
      return {
        id: id(node.id, `${path}.id`),
        kind: enumeration(node.kind, ['trigger', 'condition', 'action'], `${path}.kind`),
        label: string(node.label, `${path}.label`, 200),
      };
    });
    uniqueIds(nodes, 'nodes');
    const integrations = list(
      data.integrations,
      limits.integrations,
      'integrations',
      (value, path) => enumeration(value, integrationIds, path),
    );
    if (new Set(integrations).size !== integrations.length)
      throw new Error('integrations contains duplicate connections.');
    const activity =
      data.activity === undefined
        ? []
        : list(data.activity, limits.activity, 'activity', activityEntry);
    uniqueIds(activity, 'activity');
    const state: State = {
      name: string(data.name, 'name', 80, true),
      team: string(data.team, 'team', 120, true),
      theme: enumeration(data.theme, ['dark', 'light'], 'theme'),
      tasks,
      projects,
      messages,
      nodes,
      integrations,
      notifications: list(
        data.notifications,
        limits.notifications,
        'notifications',
        (value, path) => string(value, path, 1000),
      ),
      automationActive: boolean(data.automationActive, 'automationActive'),
      activity,
    };
    return { ok: true, state };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Saved workspace is invalid.',
    };
  }
}

/** Caller supplies event IDs and timestamps so repeated React updaters produce identical records. */
export function recordActivity(state: State, entry: ActivityEntry): State {
  try {
    const safe = activityEntry(entry, 'activity');
    if (state.activity?.some((item) => item.id === safe.id)) return state;
    return { ...state, activity: [safe, ...(state.activity || [])].slice(0, limits.activity) };
  } catch {
    return state;
  }
}

/** Follow a verified GitHub rename by stable repository ID without replacing local planning data. */
export function reconcileGitHubRepository(
  state: State,
  repositoryId: number,
  fullName: string,
): State {
  try {
    positiveInteger(repositoryId, 'repositoryId');
    const canonical = repositoryName(fullName, 'fullName');
    const existing = state.projects.find((item) => item.source?.id === repositoryId);
    if (!existing?.source || existing.source.fullName === canonical) return state;
    // A name now belonging to a different already-imported repository cannot be reassigned safely.
    if (
      state.projects.some(
        (item) =>
          item.id !== existing.id &&
          item.source?.fullName.toLowerCase() === canonical.toLowerCase(),
      )
    )
      return state;
    const oldName = existing.source.fullName.toLowerCase();
    return {
      ...state,
      projects: state.projects.map((item) =>
        item.id === existing.id
          ? {
              ...item,
              source: {
                ...existing.source!,
                fullName: canonical,
                url: `https://github.com/${canonical}`,
              },
            }
          : item,
      ),
      tasks: state.tasks.map((item) =>
        item.project === existing.id && item.source?.repository.toLowerCase() === oldName
          ? {
              ...item,
              source: {
                ...item.source,
                repository: canonical,
                url: `https://github.com/${canonical}/milestone/${item.source.number}`,
              },
            }
          : item,
      ),
    };
  } catch {
    return state;
  }
}

export function importGitHubProject(state: State, incoming: Project, event: ActivityMeta): State {
  try {
    const safe = project(incoming, 'project');
    if (
      !safe.source ||
      state.projects.length >= limits.projects ||
      state.projects.some(
        (item) =>
          item.id === safe.id ||
          item.source?.id === safe.source!.id ||
          item.source?.fullName.toLowerCase() === safe.source!.fullName.toLowerCase(),
      )
    )
      return state;
    const entry = activityEntry(
      { ...event, message: `Imported ${safe.source.fullName} from GitHub.`, projectId: safe.id },
      'activity',
    );
    return recordActivity(
      {
        ...state,
        projects: [...state.projects, { ...safe, createdAt: event.at, updatedAt: event.at }],
      },
      entry,
    );
  } catch {
    return state;
  }
}

export function importGitHubMilestone(state: State, incoming: Task, event: ActivityMeta): State {
  try {
    const safe = task(incoming, 'task'),
      linked = state.projects.find((item) => item.id === safe.project);
    if (
      !safe.source ||
      !linked?.source ||
      linked.source.fullName.toLowerCase() !== safe.source.repository.toLowerCase() ||
      state.tasks.length >= limits.tasks ||
      state.tasks.some(
        (item) =>
          item.id === safe.id ||
          item.source?.id === safe.source!.id ||
          (item.source?.repository.toLowerCase() === safe.source!.repository.toLowerCase() &&
            item.source?.number === safe.source!.number),
      )
    )
      return state;
    const entry = activityEntry(
      {
        ...event,
        message: `Imported milestone “${safe.title}” from ${safe.source.repository}.`,
        projectId: safe.project,
        taskId: safe.id,
      },
      'activity',
    );
    return recordActivity(
      { ...state, tasks: [{ ...safe, createdAt: event.at, updatedAt: event.at }, ...state.tasks] },
      entry,
    );
  } catch {
    return state;
  }
}
