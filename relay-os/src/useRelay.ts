import { useCallback, useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEMO_ACTOR, EMPTY_WORKSPACE, MAX_DEMO_UPLOAD_BYTES, MAX_STORED_CHARS, MAX_UPLOAD_BYTES, RelayError, UPLOAD_TYPES, applyAction, canUpload, createId, parseWorkspace, prepareAction, seedWorkspace, type Actor, type Asset, type RelayAction, type Role, type Workspace } from './domain';
import { STORAGE_BUCKET, createRelayClient, fetchCloudWorkspace, mutateCloud, storagePath, type CloudContext } from './repository';

export const DEMO_STORAGE_KEY = 'relay-os-workspace-v1';
type StorageStatus = 'saved' | 'session';
type DemoRead = { state: Workspace; storageStatus: StorageStatus; error: string | null };
const readableError = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Try refreshing the workspace.';
function readDemo(): DemoRead {
  const sample = () => seedWorkspace(import.meta.env.BASE_URL);
  try {
    const value = localStorage.getItem(DEMO_STORAGE_KEY);
    if (value === null) return { state: sample(), storageStatus: 'saved', error: null };
    const parsed = parseWorkspace(value);
    return parsed.ok ? { state: parsed.state, storageStatus: 'saved', error: null } : { state: sample(), storageStatus: 'saved', error: 'Saved demo data was invalid. The sample workspace has been restored.' };
  } catch { return { state: sample(), storageStatus: 'session', error: 'Browser storage is unavailable. Changes will last only for this session.' }; }
}
function persistDemo(state: Workspace): { status: StorageStatus; notice: string | null } {
  try {
    const serialized = JSON.stringify(state);
    if (serialized.length > MAX_STORED_CHARS) throw new RelayError('This workspace exceeds the demo storage limit. Remove some uploads to save it locally.');
    localStorage.setItem(DEMO_STORAGE_KEY, serialized);
    return { status: 'saved', notice: null };
  } catch (error) { return { status: 'session', notice: error instanceof RelayError ? `${error.message} Your current changes remain in this session.` : 'Browser storage is full or unavailable. Your current changes remain in this session.' }; }
}
async function imageType(file: File): Promise<void> {
  if (!UPLOAD_TYPES.includes(file.type as typeof UPLOAD_TYPES[number])) throw new RelayError('Upload a PNG, JPEG or WebP image. SVG and executable files are not supported.');
  if (!file.size) throw new RelayError('This file is empty. Choose an image with content.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const match = file.type === 'image/png' ? [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
    : file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!match) throw new RelayError('The image content does not match its file type. Choose a valid PNG, JPEG or WebP image.');
}
function dataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new RelayError('The image could not be read.'));
    reader.onerror = () => reject(new RelayError('The image could not be read.'));
    reader.onabort = () => reject(new RelayError('The image upload was cancelled.'));
    reader.readAsDataURL(file);
  });
}

export function useRelay(): {
  state: Workspace; actor: Actor | null; mode: 'demo' | 'cloud'; configured: boolean; ready: boolean; busy: boolean; error: string | null; notice: string | null;
  storageStatus: StorageStatus; setDemoRole(role: Role): void; dispatch(action: RelayAction): Promise<void>; refresh(): Promise<void>;
  signIn(email: string, password: string): Promise<void>; signUp(email: string, password: string, name: string): Promise<void>; signOut(): Promise<void>;
  uploadFile(file: File, projectId: string, previousId?: string): Promise<void>;
} {
  const [configuration] = useState(createRelayClient);
  const client: SupabaseClient | null = configuration.client;
  const [initial] = useState<DemoRead>(() => client ? { state: EMPTY_WORKSPACE, storageStatus: 'saved', error: null } : readDemo());
  const [state, setState] = useState(initial.state);
  const [actor, setActor] = useState<Actor | null>(client ? null : DEMO_ACTOR);
  const [ready, setReady] = useState(!client);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(configuration.configurationError ?? initial.error);
  const [notice, setNotice] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>(initial.storageStatus);
  const stateRef = useRef(state), actorRef = useRef(actor), contextRef = useRef<CloudContext | null>(null);
  const mounted = useRef(true), generation = useRef(0), loading = useRef(0), writing = useRef(false), sessionUser = useRef<string | null>(null);
  const commit = useCallback((value: Workspace) => { stateRef.current = value; setState(value); }, []);
  const commitActor = useCallback((value: Actor | null) => { actorRef.current = value; setActor(value); }, []);
  const report = useCallback((problem: unknown): never => { const value = readableError(problem); if (mounted.current) setError(value); throw new RelayError(value); }, []);

  const loadCloud = useCallback(async (clearError = true) => {
    if (!client) return;
    const request = ++loading.current, epoch = generation.current;
    try {
      const { data, error: authError } = await client.auth.getUser();
      // No stored session is an ordinary signed-out state, not a broken workspace.
      if (authError && authError.name !== 'AuthSessionMissingError') throw authError;
      if (!mounted.current || epoch !== generation.current || request !== loading.current) return;
      if (!data.user) { contextRef.current = null; sessionUser.current = null; commit(EMPTY_WORKSPACE); commitActor(null); if (clearError) setError(null); return; }
      const context = await fetchCloudWorkspace(client, data.user.id);
      if (!mounted.current || epoch !== generation.current || request !== loading.current) return;
      sessionUser.current = data.user.id; contextRef.current = context; commit(context.state); commitActor(context.actor); if (clearError) setError(null);
    } catch (problem) { if (mounted.current && epoch === generation.current && request === loading.current) setError(readableError(problem)); throw problem; }
    finally { if (mounted.current && epoch === generation.current && request === loading.current) setReady(true); }
  }, [client, commit, commitActor]);

  useEffect(() => {
    mounted.current = true;
    if (!client) {
      const saved = persistDemo(stateRef.current); setStorageStatus(saved.status); if (saved.notice) setNotice(saved.notice);
      const storage = (event: StorageEvent) => {
        if (event.key !== DEMO_STORAGE_KEY) return;
        if (event.newValue === null) { setNotice('The demo data was cleared in another tab. Your current session is still available.'); return; }
        const parsed = parseWorkspace(event.newValue);
        if (parsed.ok) { commit(parsed.state); setStorageStatus('saved'); setNotice('The demo was updated in another tab.'); }
        else setError('Another tab saved invalid demo data. Your current workspace has been kept.');
      };
      window.addEventListener('storage', storage);
      return () => { mounted.current = false; window.removeEventListener('storage', storage); };
    }
    let authTimer: ReturnType<typeof setTimeout> | undefined;
    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      const incoming = session?.user.id ?? null;
      if (incoming !== sessionUser.current) {
        generation.current++; loading.current++; contextRef.current = null; sessionUser.current = incoming; commit(EMPTY_WORKSPACE); commitActor(null); setReady(!incoming);
      }
      // Supabase auth callbacks are synchronous. Defer API calls to avoid the auth lock.
      if (authTimer) clearTimeout(authTimer);
      authTimer = setTimeout(() => { void loadCloud().catch(() => {}); }, 0);
    });
    void loadCloud().catch(() => {});
    const online = () => { setNotice('Connection restored. Refreshing your workspace…'); void loadCloud().then(() => { if (mounted.current) setNotice(null); }).catch(() => {}); };
    window.addEventListener('online', online);
    return () => { mounted.current = false; generation.current++; loading.current++; if (authTimer) clearTimeout(authTimer); authListener.subscription.unsubscribe(); window.removeEventListener('online', online); };
  }, [client, commit, commitActor, loadCloud]);

  const workspaceId = contextRef.current?.workspaceId;
  useEffect(() => {
    if (!client || !actor || !workspaceId) return;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    const queue = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => { if (!writing.current) void loadCloud().catch(() => {}); }, 250);
    };
    let channel = client.channel(`relay:${workspaceId}:${actor.id}`);
    for (const table of ['relay_projects', 'relay_tasks', 'relay_assets', 'relay_comments', 'relay_activity', 'relay_members']) channel = channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `workspace_id=eq.${workspaceId}` }, queue);
    channel.subscribe(status => {
      if (!active || !mounted.current) return;
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setNotice('Live updates are disconnected. Your saved work is safe; use Refresh to load the latest changes.');
      if (status === 'SUBSCRIBED') { setNotice(current => current?.startsWith('Live updates') ? null : current); queue(); }
    });
    // Renew private previews before their 30-minute signed URLs expire.
    const renew = setInterval(() => { if (!writing.current) void loadCloud().catch(() => {}); }, 15 * 60 * 1000);
    return () => { active = false; if (refreshTimer) clearTimeout(refreshTimer); clearInterval(renew); void client.removeChannel(channel); };
  }, [client, actor?.id, workspaceId, loadCloud]);

  const refresh = useCallback(async () => {
    if (writing.current) return report(new RelayError('An update is in progress. Refresh again when it finishes.'));
    setError(null);
    if (!client) {
      const saved = persistDemo(stateRef.current); setStorageStatus(saved.status); setNotice(saved.notice ?? 'Demo data is saved in this browser.'); return;
    }
    setBusy(true); try { await loadCloud(); } catch (problem) { report(problem); } finally { if (mounted.current) setBusy(false); }
  }, [client, loadCloud, report]);

  const dispatch = useCallback(async (input: RelayAction) => {
    if (writing.current) return report(new RelayError('An update is already in progress. Try again in a moment.'));
    const currentActor = actorRef.current; if (!currentActor) return report(new RelayError('Sign in to edit your cloud workspace.'));
    const action = prepareAction(input); const before = stateRef.current; const epoch = generation.current;
    setError(null); setNotice(null);
    try {
      const after = applyAction(before, action, currentActor);
      if (!client) { commit(after); const saved = persistDemo(after); setStorageStatus(saved.status); setNotice(saved.notice); return; }
      const context = contextRef.current; if (!context) throw new RelayError('The cloud workspace is still loading. Try refreshing.');
      if (action.type === 'add_asset') throw new RelayError('Use Upload file to add images to private cloud storage.');
      writing.current = true; setBusy(true); commit(after);
      const warning = await mutateCloud(client, context, action);
      if (epoch !== generation.current || !mounted.current) return;
      await loadCloud(); if (warning && mounted.current) setNotice(warning);
    } catch (problem) {
      if (epoch === generation.current && mounted.current) {
        if (client) { commit(before); try { await loadCloud(false); } catch { /* Preserve the useful mutation error; Refresh remains available. */ } }
        report(problem);
      }
    } finally { writing.current = false; if (mounted.current) setBusy(false); }
  }, [client, commit, loadCloud, report]);

  const auth = useCallback(async (operation: () => Promise<void>) => {
    if (!client) return report(new RelayError('Cloud authentication is not configured. This portfolio version runs in demo mode.'));
    if (writing.current) return report(new RelayError('Wait for the current update to finish.'));
    writing.current = true; setBusy(true); setError(null); setNotice(null);
    try { await operation(); }
    catch (problem) { report(problem); }
    finally { writing.current = false; if (mounted.current) setBusy(false); }
  }, [client, report]);
  const signIn = useCallback(async (email: string, password: string) => auth(async () => {
    const { error: authError } = await client!.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) throw authError; await loadCloud();
  }), [auth, client, loadCloud]);
  const signUp = useCallback(async (email: string, password: string, name: string) => auth(async () => {
    if (!name.trim() || name.trim().length > 100) throw new RelayError('Enter your name using 1–100 characters.');
    if (password.length < 8) throw new RelayError('Use a password with at least 8 characters.');
    const { data, error: authError } = await client!.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() }, emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.href).href } });
    if (authError) throw authError;
    if (data.session) await loadCloud();
    else if (mounted.current) setNotice('Check your email to confirm your account, then sign in. A private workspace is created by the database; your role is never taken from signup metadata.');
  }), [auth, client, loadCloud]);
  const signOut = useCallback(async () => auth(async () => {
    const { error: authError } = await client!.auth.signOut({ scope: 'local' }); if (authError) throw authError;
    generation.current++; loading.current++; contextRef.current = null; sessionUser.current = null; commit(EMPTY_WORKSPACE); commitActor(null); setReady(true);
  }), [auth, client, commit, commitActor]);
  const setDemoRole = useCallback((role: Role) => {
    if (client) { setError('Cloud roles are assigned by a workspace administrator and cannot be switched locally.'); return; }
    if (!['admin', 'pm', 'designer', 'client'].includes(role)) { setError('Invalid demo role.'); return; }
    commitActor({ ...DEMO_ACTOR, role }); setError(null); setNotice(`Demo role switched to ${role}. This is a local simulation.`);
  }, [client, commitActor]);

  const uploadFile = useCallback(async (file: File, projectId: string, previousId?: string) => {
    if (writing.current) return report(new RelayError('An update is already in progress. Try again in a moment.'));
    const currentActor = actorRef.current;
    if (!currentActor || !canUpload(currentActor.role)) return report(new RelayError('Your role cannot upload design files.'));
    const before = stateRef.current, epoch = generation.current;
    writing.current = true; setBusy(true); setError(null); setNotice(null);
    let path: string | undefined;
    let metadataSaved = false;
    try {
      await imageType(file);
      if (file.size > (client ? MAX_UPLOAD_BYTES : MAX_DEMO_UPLOAD_BYTES)) throw new RelayError(client ? 'Choose an image smaller than 3 MB.' : 'For the browser demo, choose an image smaller than 1 MB. Cloud storage supports up to 3 MB.');
      const previous = previousId ? before.assets.find(value => value.id === previousId) : null;
      if (previousId && !previous) throw new RelayError('The previous version no longer exists. Refresh and try again.');
      const value: Asset = { id: createId(), projectId, name: file.name.trim().slice(0, 160), url: client ? 'https://relay.invalid/pending-preview' : await dataUrl(file), mime: file.type, size: file.size, version: previous ? previous.version + 1 : 1, status: 'draft', createdAt: new Date().toISOString(), previousId: previous?.id ?? null };
      const action = prepareAction({ type: 'add_asset', asset: value });
      const after = applyAction(before, action, currentActor);
      if (!client) { commit(after); const saved = persistDemo(after); setStorageStatus(saved.status); setNotice(saved.notice); return; }
      const context = contextRef.current; if (!context) throw new RelayError('The cloud workspace is still loading. Try refreshing.');
      path = storagePath(context.workspaceId, value);
      const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false, cacheControl: '3600' });
      if (uploadError) throw new RelayError(uploadError.message);
      await mutateCloud(client, context, action, path); metadataSaved = true;
      if (epoch === generation.current && mounted.current) await loadCloud();
    } catch (problem) {
      if (client && path && !metadataSaved) {
        try { await client.storage.from(STORAGE_BUCKET).remove([path]); } catch { /* The backend guide includes an orphan cleanup procedure. */ }
      }
      if (epoch === generation.current && mounted.current) report(problem);
    } finally { writing.current = false; if (mounted.current) setBusy(false); }
  }, [client, commit, loadCloud, report]);

  return { state, actor, mode: client ? 'cloud' : 'demo', configured: !!client, ready, busy, error, notice, storageStatus, setDemoRole, dispatch, refresh, signIn, signUp, signOut, uploadFile };
}
