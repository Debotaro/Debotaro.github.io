import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { RelayError, parseWorkspace, type Actor, type Asset, type RelayAction, type Role, type Workspace } from './domain';

export const STORAGE_BUCKET = 'relay-files';
export const SIGNED_URL_SECONDS = 1800;
export type CloudContext = { workspaceId: string; actor: Actor; state: Workspace; paths: Map<string, string> };

export function createRelayClient(): { client: SupabaseClient | null; configurationError: string | null } {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url && !key) return { client: null, configurationError: null };
  try {
    if (!url || !key) throw new RelayError('Set both Supabase environment values to enable cloud accounts. Running the local demo for now.');
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) throw new RelayError('The Supabase URL must use HTTPS, except for a local development server.');
    if (parsed.username || parsed.password || !key.startsWith('sb_publishable_')) throw new RelayError('Use a Supabase publishable key in the browser. Secret and service-role keys are not accepted.');
    return { client: createClient(parsed.href.replace(/\/$/, ''), key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }, global: { fetch: timeoutFetch } }), configurationError: null };
  } catch (error) { return { client: null, configurationError: error instanceof Error ? error.message : 'Supabase configuration is invalid. Running the local demo for now.' }; }
}

/** Every HTTP request has a deadline; SDK refresh and UI retries remain available. */
async function timeoutFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const parent = init?.signal;
  const abort = () => controller.abort(parent?.reason);
  if (parent?.aborted) abort(); else parent?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new DOMException('The cloud request timed out. Try refreshing.', 'TimeoutError')), 15_000);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const body = response.body ? await response.arrayBuffer() : null;
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  finally { clearTimeout(timer); parent?.removeEventListener('abort', abort); }
}

const asRow = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RelayError('The cloud returned an invalid record.');
  return value as Record<string, unknown>;
};
const message = (error: { message: string } | null, fallback: string) => { if (error) throw new RelayError(error.message || fallback); };
function actorFromMember(value: unknown, userId: string): { actor: Actor; workspaceId: string } {
  const row = asRow(value);
  if (typeof row.workspace_id !== 'string' || typeof row.name !== 'string' || !row.name.trim() || row.name.length > 100 || !['admin', 'pm', 'designer', 'client'].includes(String(row.role))) throw new RelayError('The cloud membership is invalid. Ask the workspace administrator to check it.');
  return { actor: { id: userId, name: row.name, role: row.role as Role }, workspaceId: row.workspace_id };
}
async function rows(client: SupabaseClient, table: string, workspaceId: string, limit: number): Promise<Record<string, unknown>[]> {
  const values: Record<string, unknown>[] = [];
  for (let offset = 0; offset <= limit; offset += 1000) {
    const pageEnd = Math.min(offset + 999, limit);
    const { data, error } = await client.from(table).select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: true }).range(offset, pageEnd);
    message(error, `Could not load ${table}.`);
    if (!Array.isArray(data)) throw new RelayError('The cloud response is incomplete.');
    values.push(...data.map(asRow));
    if (values.length > limit) throw new RelayError(`This workspace exceeds the supported ${table.replace('relay_', '')} limit. Archive or remove older work before loading it.`);
    if (data.length < pageEnd - offset + 1) break;
  }
  return values;
}

export async function fetchCloudWorkspace(client: SupabaseClient, userId: string): Promise<CloudContext> {
  // Recent invitations take precedence over a new account's personal workspace.
  const { data: membership, error: membershipError } = await client.from('relay_members').select('workspace_id,role,name').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  message(membershipError, 'Could not load your workspace membership.');
  if (!membership) throw new RelayError('Your account has no RELAY workspace. Apply the supplied migration and membership bootstrap, then refresh.');
  const { actor, workspaceId } = actorFromMember(membership, userId);
  const [projects, tasks, assets, comments, activity] = await Promise.all([
    rows(client, 'relay_projects', workspaceId, 100), rows(client, 'relay_tasks', workspaceId, 1000), rows(client, 'relay_assets', workspaceId, 300), rows(client, 'relay_comments', workspaceId, 2000),
    client.from('relay_activity').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(200).then(({ data, error }) => { message(error, 'Could not load workspace activity.'); if (!Array.isArray(data)) throw new RelayError('The activity response is incomplete.'); return data.map(asRow); }),
  ]);
  const paths = new Map<string, string>();
  const signedAssets: unknown[] = [];
  const storagePaths = assets.map(row => {
    if (typeof row.id !== 'string' || typeof row.storage_path !== 'string' || !row.storage_path.startsWith(`${workspaceId}/${row.project_id}/`)) throw new RelayError('A cloud asset has an invalid storage path.');
    paths.set(row.id, row.storage_path); return row.storage_path;
  });
  let signed: { path?: string; signedUrl: string; error: string | null }[] = [];
  if (storagePaths.length) {
    const { data, error } = await client.storage.from(STORAGE_BUCKET).createSignedUrls(storagePaths, SIGNED_URL_SECONDS);
    message(error, 'Could not load private asset previews.');
    if (!data || data.some(row => row.error || !row.signedUrl)) throw new RelayError('A private asset preview is unavailable. Refresh or ask an administrator to check the file.');
    signed = data.map(row => ({ path: row.path ?? undefined, signedUrl: row.signedUrl!, error: row.error }));
  }
  const signedByPath = new Map(signed.map(row => [row.path, row.signedUrl]));
  for (const row of assets) signedAssets.push({ id: row.id, projectId: row.project_id, name: row.name, url: signedByPath.get(String(row.storage_path)), mime: row.mime, size: row.size, version: row.version, status: row.status, createdAt: row.created_at, previousId: row.previous_id });
  const parsed = parseWorkspace({
    projects: projects.map(row => ({ id: row.id, title: row.title, client: row.client, description: row.description, color: row.color, status: row.status, createdAt: row.created_at })),
    tasks: tasks.map(row => ({ id: row.id, projectId: row.project_id, title: row.title, status: row.status, priority: row.priority, assignee: row.assignee, dueDate: row.due_date, createdAt: row.created_at })),
    assets: signedAssets,
    comments: comments.map(row => ({ id: row.id, assetId: row.asset_id, projectId: row.project_id, author: row.author, body: row.body, x: row.x, y: row.y, resolved: row.resolved, taskId: row.task_id, createdAt: row.created_at })),
    activity: activity.map(row => ({ id: row.id, projectId: row.project_id, body: row.body, at: row.created_at })),
  });
  if (!parsed.ok) throw new RelayError(`Cloud data failed validation: ${parsed.error}`);
  return { workspaceId, actor, state: parsed.state, paths };
}

/** Database writes are checked again by RLS and triggers. Conversion is an atomic SQL RPC. */
export async function mutateCloud(client: SupabaseClient, context: CloudContext, action: RelayAction, uploadPath?: string): Promise<string | null> {
  const workspace = { workspace_id: context.workspaceId };
  const update = (table: string, values: Record<string, unknown>, id: string) => client.from(table).update(values).eq('id', id).eq('workspace_id', context.workspaceId).select('id').single();
  const remove = (table: string, id: string) => client.from(table).delete().eq('id', id).eq('workspace_id', context.workspaceId).select('id').single();
  let removedPaths: string[] = [];
  switch (action.type) {
    case 'create_project': {
      const value = action.project; const { error } = await client.from('relay_projects').insert({ ...workspace, id: value.id, title: value.title, client: value.client, description: value.description, color: value.color, status: value.status }); message(error, 'Project creation failed.'); break;
    }
    case 'update_project': { const { error } = await update('relay_projects', action.patch, action.id); message(error, 'Project update failed or your permission changed.'); break; }
    case 'delete_project': { removedPaths = context.state.assets.filter(row => row.projectId === action.id).map(row => context.paths.get(row.id)).filter((value): value is string => !!value); const { error } = await remove('relay_projects', action.id); message(error, 'Project deletion failed.'); break; }
    case 'create_task': {
      const value = action.task; const { error } = await client.from('relay_tasks').insert({ ...workspace, id: value.id, project_id: value.projectId, title: value.title, status: value.status, priority: value.priority, assignee: value.assignee, due_date: value.dueDate }); message(error, 'Task creation failed.'); break;
    }
    case 'update_task': {
      const { dueDate, ...patch } = action.patch; const { error } = await update('relay_tasks', { ...patch, ...(dueDate === undefined ? {} : { due_date: dueDate }) }, action.id); message(error, 'Task update failed or your permission changed.'); break;
    }
    case 'delete_task': { const { error } = await remove('relay_tasks', action.id); message(error, 'Task deletion failed.'); break; }
    case 'add_asset': {
      if (!uploadPath) throw new RelayError('Cloud files must be uploaded through private storage.');
      const value = action.asset; const { error } = await client.from('relay_assets').insert({ ...workspace, id: value.id, project_id: value.projectId, name: value.name, storage_path: uploadPath, mime: value.mime, size: value.size, version: value.version, status: value.status, previous_id: value.previousId }); message(error, 'Asset metadata could not be saved.'); break;
    }
    case 'delete_asset': {
      const removed = new Set([action.id]); for (let i = 0; i < context.state.assets.length; i++) for (const row of context.state.assets) if (row.previousId && removed.has(row.previousId)) removed.add(row.id);
      removedPaths = [...removed].map(assetId => context.paths.get(assetId)).filter((value): value is string => !!value);
      const { error } = await remove('relay_assets', action.id); message(error, 'Asset deletion failed.'); break;
    }
    case 'add_comment': {
      const value = action.comment; const { error } = await client.from('relay_comments').insert({ ...workspace, id: value.id, asset_id: value.assetId, project_id: value.projectId, body: value.body, x: value.x, y: value.y }); message(error, 'Comment creation failed.'); break;
    }
    case 'resolve_comment': { const { error } = await update('relay_comments', { resolved: action.resolved }, action.id); message(error, 'Comment update failed.'); break; }
    case 'convert_comment': {
      const value = action.task; const { error } = await client.rpc('relay_convert_comment', { comment_id: action.id, new_task_id: value.id, task_title: value.title, task_assignee: value.assignee, task_priority: value.priority, task_due_date: value.dueDate }); message(error, 'The comment could not be converted. It may already have a linked task.'); break;
    }
    case 'set_approval': { const { error } = await update('relay_assets', { status: action.status }, action.id); message(error, 'Approval update failed.'); break; }
  }
  if (removedPaths.length) {
    const { error } = await client.storage.from(STORAGE_BUCKET).remove(removedPaths);
    if (error) return 'The workspace was updated, but some stored files could not be removed. An administrator can clean up the orphaned storage objects.';
  }
  return null;
}

export function storagePath(workspaceId: string, asset: Pick<Asset, 'id' | 'projectId' | 'mime'>): string {
  const extension = ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' } as Record<string, string>)[asset.mime];
  if (!extension) throw new RelayError('Upload a PNG, JPEG or WebP image.');
  return `${workspaceId}/${asset.projectId}/${asset.id}.${extension}`;
}
