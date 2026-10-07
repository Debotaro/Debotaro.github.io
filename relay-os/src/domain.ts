export type Role = 'admin' | 'pm' | 'designer' | 'client';
export type Actor = { id: string; name: string; role: Role };
export type Project = { id: string; title: string; client: string; description: string; color: string; status: 'active' | 'archived'; createdAt: string };
export type Task = { id: string; projectId: string; title: string; status: 'todo' | 'in_progress' | 'review' | 'done'; priority: 'low' | 'medium' | 'high'; assignee: string; dueDate: string | null; createdAt: string };
export type Asset = { id: string; projectId: string; name: string; url: string; mime: string; size: number; version: number; status: 'draft' | 'review' | 'changes' | 'approved'; createdAt: string; previousId: string | null };
export type Comment = { id: string; assetId: string; projectId: string; author: string; body: string; x: number | null; y: number | null; resolved: boolean; taskId: string | null; createdAt: string };
export type Activity = { id: string; projectId: string | null; body: string; at: string };
export type Workspace = { projects: Project[]; tasks: Task[]; assets: Asset[]; comments: Comment[]; activity: Activity[] };

type Event = { id: string; at: string };
export type RelayAction = (
  | { type: 'create_project'; project: Project }
  | { type: 'update_project'; id: string; patch: Partial<Pick<Project, 'title' | 'client' | 'description' | 'color' | 'status'>> }
  | { type: 'delete_project'; id: string }
  | { type: 'create_task'; task: Task }
  | { type: 'update_task'; id: string; patch: Partial<Pick<Task, 'title' | 'status' | 'priority' | 'assignee' | 'dueDate'>> }
  | { type: 'delete_task'; id: string }
  | { type: 'add_asset'; asset: Asset }
  | { type: 'delete_asset'; id: string }
  | { type: 'add_comment'; comment: Comment }
  | { type: 'resolve_comment'; id: string; resolved: boolean }
  | { type: 'convert_comment'; id: string; task: Task }
  | { type: 'set_approval'; id: string; status: Asset['status'] }
) & { event?: Event };
export type Action = RelayAction;

export class RelayError extends Error { constructor(message: string) { super(message); this.name = 'RelayError'; } }
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
export const MAX_DEMO_UPLOAD_BYTES = 1024 * 1024;
export const MAX_STORED_CHARS = 3_500_000;
export const MAX_ACTIVITY = 200;
export const UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const DEMO_ACTOR: Actor = { id: '10000000-0000-4000-8000-000000000001', name: 'Deboraj Sarkar (Debotaro)', role: 'pm' };
export const EMPTY_WORKSPACE: Workspace = { projects: [], tasks: [], assets: [], comments: [], activity: [] };
export const canManageProjects = (role: Role) => role === 'admin' || role === 'pm';
export const canManageTasks = (role: Role) => canManageProjects(role) || role === 'designer';
export const canUpload = canManageTasks;
export const canReview = (role: Role) => canManageProjects(role) || role === 'client';
export const canRequestReview = (role: Role) => canManageTasks(role);
export const createId = () => crypto.randomUUID();
export const prepareAction = (action: RelayAction): RelayAction => ({ ...action, event: { id: createId(), at: new Date().toISOString() } });

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const roles = ['admin', 'pm', 'designer', 'client'];
const taskStatuses = ['todo', 'in_progress', 'review', 'done'];
const approvalStatuses = ['draft', 'review', 'changes', 'approved'];
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
function fail(message: string): never { throw new RelayError(message); }
const requirePermission = (allowed: boolean) => { if (!allowed) fail('Your role does not have permission to perform this action.'); };
function text(v: unknown, max: number, label: string, optional = false): string {
  if (typeof v !== 'string' || v.length > max || (!optional && !v.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)) fail(`Invalid ${label}.`);
  return v.trim();
}
function id(v: unknown): string { if (typeof v !== 'string' || !uuid.test(v)) fail('Invalid record ID.'); return v; }
function iso(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(v) || !Number.isFinite(Date.parse(v))) fail('Invalid timestamp.');
  date(v.slice(0, 10)); return v;
}
function date(v: unknown): string | null {
  if (v === null) return null;
  if (typeof v !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v) fail('Invalid due date.');
  return v;
}
function member<T extends string>(v: unknown, choices: readonly string[], label: string): T { if (typeof v !== 'string' || !choices.includes(v)) fail(`Invalid ${label}.`); return v as T; }
function safeUrl(v: unknown): string {
  if (typeof v !== 'string' || v.length > 2_000_000) fail('Invalid asset URL.');
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v)) return v;
  if (/^(?:\/(?!\/)|\.\/)[A-Za-z0-9_./-]+$/.test(v) && !v.includes('..')) return v;
  try { const url = new URL(v); if (url.protocol === 'https:' && !url.username && !url.password) return url.href; } catch { /* Reject unsafe and malformed URLs. */ }
  return fail('Use an HTTPS image URL or a supported uploaded image.');
}
function project(v: unknown): Project {
  if (!record(v)) fail('Invalid project.');
  if (typeof v.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(v.color)) fail('Invalid project colour.');
  return { id: id(v.id), title: text(v.title, 100, 'project title'), client: text(v.client, 100, 'client', true), description: text(v.description, 1200, 'description', true), color: v.color, status: member(v.status, ['active', 'archived'], 'project status'), createdAt: iso(v.createdAt) };
}
function task(v: unknown): Task {
  if (!record(v)) fail('Invalid task.');
  return { id: id(v.id), projectId: id(v.projectId), title: text(v.title, 160, 'task title'), status: member(v.status, taskStatuses, 'task status'), priority: member(v.priority, ['low', 'medium', 'high'], 'priority'), assignee: text(v.assignee, 100, 'assignee', true), dueDate: date(v.dueDate), createdAt: iso(v.createdAt) };
}
function asset(v: unknown): Asset {
  if (!record(v)) fail('Invalid asset.');
  if (!Number.isSafeInteger(v.size) || Number(v.size) < 0 || Number(v.size) > MAX_UPLOAD_BYTES) fail('Invalid asset size.');
  if (!Number.isSafeInteger(v.version) || Number(v.version) < 1 || Number(v.version) > 1000) fail('Invalid asset version.');
  return { id: id(v.id), projectId: id(v.projectId), name: text(v.name, 160, 'asset name'), url: safeUrl(v.url), mime: member(v.mime, [...UPLOAD_TYPES, 'image/svg+xml'], 'file type'), size: Number(v.size), version: Number(v.version), status: member(v.status, approvalStatuses, 'approval status'), createdAt: iso(v.createdAt), previousId: v.previousId === null ? null : id(v.previousId) };
}
function comment(v: unknown): Comment {
  if (!record(v) || typeof v.resolved !== 'boolean') fail('Invalid comment.');
  const point = (n: unknown): number | null => n === null ? null : typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1 ? n : fail('Annotation coordinates must be normalized between 0 and 1.');
  const x = point(v.x), y = point(v.y);
  if ((x === null) !== (y === null)) fail('An annotation needs both coordinates.');
  return { id: id(v.id), assetId: id(v.assetId), projectId: id(v.projectId), author: text(v.author, 100, 'author'), body: text(v.body, 1600, 'comment'), x, y, resolved: v.resolved, taskId: v.taskId === null ? null : id(v.taskId), createdAt: iso(v.createdAt) };
}
function activity(v: unknown): Activity { if (!record(v)) fail('Invalid activity.'); return { id: id(v.id), projectId: v.projectId === null ? null : id(v.projectId), body: text(v.body, 300, 'activity'), at: iso(v.at) }; }

/** Treat browser persistence and network responses as untrusted. Extras are stripped. */
export function parseWorkspace(input: unknown): { ok: true; state: Workspace } | { ok: false; error: string } {
  try {
    if (typeof input === 'string') { if (input.length > MAX_STORED_CHARS) fail('The saved workspace exceeds the local storage limit.'); input = JSON.parse(input); }
    if (!record(input)) fail('The saved workspace is not an object.');
    const source = input;
    const list = <T>(name: string, limit: number, parse: (v: unknown) => T): T[] => {
      const values = source[name];
      if (!Array.isArray(values) || values.length > limit) fail(`Invalid ${name} list.`);
      return values.map(parse);
    };
    const state: Workspace = { projects: list('projects', 100, project), tasks: list('tasks', 1000, task), assets: list('assets', 300, asset), comments: list('comments', 2000, comment), activity: list('activity', MAX_ACTIVITY, activity) };
    for (const values of [state.projects, state.tasks, state.assets, state.comments, state.activity]) if (new Set(values.map(v => v.id)).size !== values.length) fail('Duplicate record IDs.');
    const projects = new Set(state.projects.map(v => v.id));
    const tasks = new Map(state.tasks.map(v => [v.id, v]));
    const assets = new Map(state.assets.map(v => [v.id, v]));
    for (const value of [...state.tasks, ...state.assets]) if (!projects.has(value.projectId)) fail('A record references a missing project.');
    const revisions = new Set<string>();
    for (const value of state.assets) {
      if (value.previousId === null && value.version !== 1) fail('An initial asset must be version 1.');
      if (value.previousId !== null) { const prior = assets.get(value.previousId); if (!prior || prior.projectId !== value.projectId || prior.version + 1 !== value.version || revisions.has(value.previousId)) fail('Invalid asset revision history.'); revisions.add(value.previousId); }
    }
    const linkedTasks = new Set<string>();
    for (const value of state.comments) {
      if (assets.get(value.assetId)?.projectId !== value.projectId) fail('A comment references a missing or unrelated asset.');
      if (value.taskId !== null) {
        if (tasks.get(value.taskId)?.projectId !== value.projectId || linkedTasks.has(value.taskId)) fail('Invalid linked comment task.');
        linkedTasks.add(value.taskId);
      }
    }
    for (const value of state.activity) if (value.projectId !== null && !projects.has(value.projectId)) fail('Activity references a missing project.');
    return { ok: true, state };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'The saved workspace could not be read.' }; }
}

function pushActivity(state: Workspace, action: RelayAction, actor: Actor, projectId: string | null, body: string): Workspace {
  // The caller allocates the event before a React state update; pure reducers do not create IDs or read the clock.
  if (!action.event) return state;
  const entry = activity({ id: action.event.id, at: action.event.at, projectId, body: `${actor.name}: ${body}`.slice(0, 300) });
  return { ...state, activity: [entry, ...state.activity.filter(v => v.id !== entry.id)].slice(0, MAX_ACTIVITY) };
}

/** Demo permissions mirror the server role model, but are deliberately not a security boundary. */
export function applyAction(state: Workspace, action: RelayAction, actor: Actor): Workspace {
  if (!roles.includes(actor.role)) fail('Invalid workspace role.');
  id(actor.id); text(actor.name, 100, 'member name');
  let next = state, targetProject: string | null = null, message = '';
  const getProject = (projectId: string) => state.projects.find(v => v.id === projectId) ?? fail('The project no longer exists. Refresh and try again.');
  const getTask = (taskId: string) => state.tasks.find(v => v.id === taskId) ?? fail('The task no longer exists. Refresh and try again.');
  const getAsset = (assetId: string) => state.assets.find(v => v.id === assetId) ?? fail('The asset no longer exists. Refresh and try again.');
  const getComment = (commentId: string) => state.comments.find(v => v.id === commentId) ?? fail('The comment no longer exists. Refresh and try again.');
  const unique = (values: { id: string }[], valueId: string) => { if (values.some(v => v.id === valueId)) fail('This item already exists.'); };
  const activeProject = (projectId: string) => { const value = getProject(projectId); if (value.status === 'archived') fail('Restore the archived project before editing its work.'); return value; };
  switch (action.type) {
    case 'create_project': {
      requirePermission(canManageProjects(actor.role)); const value = project(action.project); unique(state.projects, value.id);
      next = { ...state, projects: [...state.projects, value] }; targetProject = value.id; message = `created ${value.title}`; break;
    }
    case 'update_project': {
      requirePermission(canManageProjects(actor.role)); const prior = getProject(action.id); const patch = action.patch;
      const value = project({ ...prior, title: patch.title ?? prior.title, client: patch.client ?? prior.client, description: patch.description ?? prior.description, color: patch.color ?? prior.color, status: patch.status ?? prior.status });
      next = { ...state, projects: state.projects.map(v => v.id === value.id ? value : v) }; targetProject = value.id; message = `updated ${value.title}`; break;
    }
    case 'delete_project': {
      requirePermission(canManageProjects(actor.role)); const value = getProject(action.id);
      next = { projects: state.projects.filter(v => v.id !== value.id), tasks: state.tasks.filter(v => v.projectId !== value.id), assets: state.assets.filter(v => v.projectId !== value.id), comments: state.comments.filter(v => v.projectId !== value.id), activity: state.activity.filter(v => v.projectId !== value.id) };
      message = `deleted ${value.title}`; break;
    }
    case 'create_task': {
      requirePermission(canManageTasks(actor.role)); const value = task(action.task); activeProject(value.projectId); unique(state.tasks, value.id);
      next = { ...state, tasks: [...state.tasks, value] }; targetProject = value.projectId; message = `created task “${value.title}”`; break;
    }
    case 'update_task': {
      requirePermission(canManageTasks(actor.role)); const prior = getTask(action.id); activeProject(prior.projectId); const patch = action.patch;
      const value = task({ ...prior, title: patch.title ?? prior.title, status: patch.status ?? prior.status, priority: patch.priority ?? prior.priority, assignee: patch.assignee ?? prior.assignee, dueDate: patch.dueDate === undefined ? prior.dueDate : patch.dueDate });
      next = { ...state, tasks: state.tasks.map(v => v.id === value.id ? value : v) }; targetProject = value.projectId; message = `updated task “${value.title}”`; break;
    }
    case 'delete_task': {
      requirePermission(canManageTasks(actor.role)); const value = getTask(action.id); activeProject(value.projectId);
      next = { ...state, tasks: state.tasks.filter(v => v.id !== value.id), comments: state.comments.map(v => v.taskId === value.id ? { ...v, taskId: null } : v) }; targetProject = value.projectId; message = `deleted task “${value.title}”`; break;
    }
    case 'add_asset': {
      requirePermission(canUpload(actor.role)); const value = asset(action.asset); activeProject(value.projectId); unique(state.assets, value.id);
      if (value.status !== 'draft' && value.status !== 'review') fail('New uploads start as a draft or in review.');
      if (value.previousId === null && value.version !== 1) fail('An initial asset must be version 1.');
      if (value.previousId !== null) {
        const previous = getAsset(value.previousId);
        if (previous.projectId !== value.projectId || value.version !== previous.version + 1 || state.assets.some(v => v.previousId === previous.id)) fail('Upload a revision of the latest version in the same project.');
      }
      next = { ...state, assets: [...state.assets, value] }; targetProject = value.projectId; message = `uploaded ${value.name} · v${value.version}`; break;
    }
    case 'delete_asset': {
      requirePermission(canUpload(actor.role)); const value = getAsset(action.id); activeProject(value.projectId); const removed = new Set([value.id]);
      for (let i = 0; i < state.assets.length; i++) for (const child of state.assets) if (child.previousId && removed.has(child.previousId)) removed.add(child.id);
      next = { ...state, assets: state.assets.filter(v => !removed.has(v.id)), comments: state.comments.filter(v => !removed.has(v.assetId)) }; targetProject = value.projectId; message = `removed ${value.name} and its revisions`; break;
    }
    case 'add_comment': {
      const value = comment({ ...action.comment, author: actor.name }); activeProject(value.projectId); unique(state.comments, value.id);
      if (getAsset(value.assetId).projectId !== value.projectId || value.taskId !== null || value.resolved) fail('A new comment must reference this project’s asset and start unresolved.');
      next = { ...state, comments: [...state.comments, value] }; targetProject = value.projectId; message = 'added review feedback'; break;
    }
    case 'resolve_comment': {
      const value = getComment(action.id); activeProject(value.projectId); requirePermission(canManageTasks(actor.role) || value.author === actor.name);
      if (typeof action.resolved !== 'boolean') fail('Invalid resolution state.');
      next = { ...state, comments: state.comments.map(v => v.id === value.id ? { ...v, resolved: action.resolved } : v) }; targetProject = value.projectId; message = action.resolved ? 'resolved review feedback' : 'reopened review feedback'; break;
    }
    case 'convert_comment': {
      requirePermission(canManageTasks(actor.role)); const value = getComment(action.id); activeProject(value.projectId);
      if (value.taskId) fail('This comment already has a linked task.');
      const created = task(action.task); unique(state.tasks, created.id); if (created.projectId !== value.projectId) fail('The linked task must belong to the comment’s project.');
      next = { ...state, tasks: [...state.tasks, created], comments: state.comments.map(v => v.id === value.id ? { ...v, taskId: created.id } : v) }; targetProject = value.projectId; message = 'turned feedback into a task'; break;
    }
    case 'set_approval': {
      const value = getAsset(action.id); activeProject(value.projectId);
      const status = member<Asset['status']>(action.status, approvalStatuses, 'approval status');
      if (value.status === 'approved' && status !== 'approved') fail('An approved version is final. Upload a new revision to propose changes.');
      if (state.assets.some(v => v.previousId === value.id)) fail('Review the latest revision of this asset.');
      if (value.status === status) return state;
      const requesting = (value.status === 'draft' || value.status === 'changes') && status === 'review';
      const deciding = value.status === 'review' && (status === 'approved' || status === 'changes');
      if (!requesting && !deciding) fail('Move drafts or requested changes into review before a decision. Approval stages cannot be reset.');
      requirePermission(requesting ? canRequestReview(actor.role) : canReview(actor.role));
      next = { ...state, assets: state.assets.map(v => v.id === value.id ? { ...v, status } : v) }; targetProject = value.projectId; message = `marked ${value.name} ${status}`; break;
    }
    default: fail('Unknown workspace action.');
  }
  next = pushActivity(next, action, actor, targetProject, message);
  const parsed = parseWorkspace(next); if (!parsed.ok) fail(parsed.error);
  return parsed.state;
}

/** All names, work and comments below are clearly labelled sample content in the interface. */
export function seedWorkspace(baseUrl = '/relay-os/'): Workspace {
  const p1 = '20000000-0000-4000-8000-000000000001', p2 = '20000000-0000-4000-8000-000000000002', p3 = '20000000-0000-4000-8000-000000000003';
  const a1 = '40000000-0000-4000-8000-000000000001'; const createdAt = '2026-10-07T09:00:00.000Z';
  const rows: [string, string, Task['status'], Task['priority'], string, string | null][] = [
    [p1, 'Refine the Forma wordmark', 'review', 'high', 'Deboraj Sarkar', '2026-10-12'],
    [p1, 'Build the brand launch landing page', 'in_progress', 'high', 'Deboraj Sarkar', '2026-10-15'],
    [p1, 'Review the mobile hero composition', 'todo', 'medium', 'Maya Chen', '2026-10-13'],
    [p1, 'Document colour and typography tokens', 'done', 'medium', 'Maya Chen', '2026-10-10'],
    [p2, 'Map onboarding and empty states', 'in_progress', 'high', 'Deboraj Sarkar', '2026-10-17'],
    [p2, 'Test keyboard navigation in checkout', 'todo', 'medium', 'Maya Chen', '2026-10-18'],
    [p3, 'Prepare the editorial layout', 'done', 'low', 'Deboraj Sarkar', null],
    [p3, 'Hand off responsive image guidelines', 'todo', 'medium', 'Maya Chen', '2026-10-20'],
  ];
  return {
    projects: [
      { id: p1, title: 'Forma — Brand launch', client: 'Forma Studio', description: 'A considered identity and digital launch for an independent design practice. Sample client project.', color: '#c7f970', status: 'active', createdAt },
      { id: p2, title: 'Luma — Commerce experience', client: 'Luma Objects', description: 'A warmer, simpler shopping journey for everyday objects. Sample client project.', color: '#d4c4ff', status: 'active', createdAt },
      { id: p3, title: 'Field Notes — Editorial system', client: 'Field Notes', description: 'An expressive editorial system built for reading, discovery and sharing. Sample client project.', color: '#ffb3a8', status: 'active', createdAt },
    ],
    tasks: rows.map(([projectId, title, status, priority, assignee, dueDate], index) => ({ id: `30000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, projectId, title, status, priority, assignee, dueDate, createdAt })),
    assets: [{ id: a1, projectId: p1, name: 'Forma / Brand direction', url: `${baseUrl}sample-design.svg`, mime: 'image/svg+xml', size: 12000, version: 1, status: 'review', createdAt, previousId: null }],
    comments: [
      { id: '50000000-0000-4000-8000-000000000001', assetId: a1, projectId: p1, author: 'Maya Chen', body: 'The quieter palette feels right. Can we give the headline a little more room to breathe?', x: .38, y: .37, resolved: false, taskId: null, createdAt: '2026-10-07T10:15:00.000Z' },
      { id: '50000000-0000-4000-8000-000000000002', assetId: a1, projectId: p1, author: 'Alex Rivera', body: 'Love this direction. Please check that the small caption remains readable on mobile.', x: .77, y: .75, resolved: false, taskId: null, createdAt: '2026-10-07T10:22:00.000Z' },
      { id: '50000000-0000-4000-8000-000000000003', assetId: a1, projectId: p1, author: 'Deboraj Sarkar (Debotaro)', body: 'Updated the spacing tokens and added the responsive type scale.', x: null, y: null, resolved: true, taskId: null, createdAt: '2026-10-07T10:30:00.000Z' },
    ],
    activity: [
      { id: '60000000-0000-4000-8000-000000000001', projectId: p1, body: 'Maya Chen added feedback to Brand direction · v1', at: '2026-10-07T10:22:00.000Z' },
      { id: '60000000-0000-4000-8000-000000000002', projectId: p1, body: 'Deboraj moved Refine the Forma wordmark to review', at: '2026-10-07T09:50:00.000Z' },
      { id: '60000000-0000-4000-8000-000000000003', projectId: p2, body: 'Deboraj started the Luma onboarding flow', at: '2026-10-07T09:20:00.000Z' },
    ],
  };
}
