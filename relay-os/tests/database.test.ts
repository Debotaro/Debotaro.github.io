import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// This is real embedded PostgreSQL executing the migration. Auth and Storage table
// scaffolding below models the Supabase SQL interfaces; it does not run its services.
let db: PGlite;
const ids = { admin: '10000000-0000-4000-8000-000000000001', pm: '10000000-0000-4000-8000-000000000002', designer: '10000000-0000-4000-8000-000000000003', client: '10000000-0000-4000-8000-000000000004', outsider: '10000000-0000-4000-8000-000000000005' };
const projectId = '20000000-0000-4000-8000-000000000001', otherProject = '20000000-0000-4000-8000-000000000009';
const assetId = '40000000-0000-4000-8000-000000000001', commentId = '50000000-0000-4000-8000-000000000001';
let workspace: string, otherWorkspace: string;
const uuid = (n: number) => `80000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
async function as(role: keyof typeof ids | 'anon', operation: () => Promise<void>) {
  await db.exec(`set role ${role === 'anon' ? 'anon' : 'authenticated'}`);
  await db.query("select set_config('request.jwt.claims', $1, false)", [role === 'anon' ? '{}' : JSON.stringify({ sub: ids[role], role: 'authenticated' })]);
  try { await operation(); } finally { await db.exec('reset role'); await db.query("select set_config('request.jwt.claims', '{}', false)"); }
}
const denied = (operation: Promise<unknown>, code = '42501') => assert.rejects(operation, (error: unknown) => !!error && typeof error === 'object' && 'code' in error && error.code === code);
const assetPath = (id: string, project = projectId, space = workspace) => `${space}/${project}/${id}.png`;

before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')::uuid $$;
    grant usage on schema auth, storage to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text unique);
    alter table storage.objects enable row level security;
    grant select, insert, update, delete on storage.objects to anon, authenticated;
    create publication supabase_realtime;
  `);
  try { await db.exec(await readFile(new URL('../supabase/migrations/202610070001_relay.sql', import.meta.url), 'utf8')); }
  catch (error) { throw new Error(`Migration setup failed: ${error instanceof Error ? error.message : String(error)}`); }
  for (const [role, id] of Object.entries(ids)) await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)', [id, `${role}@relay.example`, JSON.stringify({ name: `Test ${role}`, role: 'admin', workspace_id: 'forged' })]);
  workspace = (await db.query<{ workspace_id: string }>('select workspace_id from relay_members where user_id=$1', [ids.admin])).rows[0].workspace_id;
  otherWorkspace = (await db.query<{ workspace_id: string }>('select workspace_id from relay_members where user_id=$1', [ids.outsider])).rows[0].workspace_id;
  for (const role of ['pm', 'designer', 'client'] as const) await db.query('insert into relay_members(workspace_id,user_id,role,name) values($1,$2,$3,$4)', [workspace, ids[role], role, `Test ${role}`]);
  await db.query("insert into relay_projects(id,workspace_id,title) values($1,$2,'Shared brand launch'),($3,$4,'Private other workspace')", [projectId, workspace, otherProject, otherWorkspace]);
  await db.query("insert into relay_assets(id,workspace_id,project_id,name,storage_path,mime,size,version) values($1,$2,$3,'Brand.png',$4,'image/png',100,1)", [assetId, workspace, projectId, assetPath(assetId)]);
  await db.query("insert into relay_comments(id,workspace_id,project_id,asset_id,author_id,author,body,x,y) values($1,$2,$3,$4,$5,'Test client','Make this caption clearer',.25,.75)", [commentId, workspace, projectId, assetId, ids.client]);
});
after(async () => { if (db) await db.close(); });

test('migration enables every RLS table and privately restricts files', async () => {
  const tables = await db.query<{ relname: string; relrowsecurity: boolean }>("select relname,relrowsecurity from pg_class where relname in ('relay_workspaces','relay_members','relay_projects','relay_tasks','relay_assets','relay_comments','relay_activity')");
  assert.equal(tables.rows.length, 7); assert.ok(tables.rows.every(row => row.relrowsecurity));
  const bucket = (await db.query<{ public: boolean; file_size_limit: number; allowed_mime_types: string[] }>("select public,file_size_limit,allowed_mime_types from storage.buckets where id='relay-files'")).rows[0];
  assert.equal(bucket.public, false); assert.equal(Number(bucket.file_size_limit), 3145728); assert.deepEqual(bucket.allowed_mime_types, ['image/png', 'image/jpeg', 'image/webp']);
  const publication = await db.query("select tablename from pg_publication_tables where pubname='supabase_realtime' and schemaname='public'"); assert.equal(publication.rows.length, 6);
});

test('anonymous requests and other workspaces cannot read or create private work', async () => {
  await as('anon', async () => { await denied(db.query('select * from relay_projects')); });
  await as('outsider', async () => {
    assert.equal((await db.query('select * from relay_projects where workspace_id=$1', [workspace])).rows.length, 0);
    assert.equal((await db.query('select * from relay_members where workspace_id=$1', [workspace])).rows.length, 0);
    await denied(db.query("insert into relay_projects(workspace_id,title) values($1,'Intrusion')", [workspace]));
    await denied(db.query("insert into relay_activity(workspace_id,body) values($1,'Forged activity')", [workspace]));
  });
});

test('signup metadata cannot choose an existing workspace role or gain another member’s data', async () => {
  const members = await db.query<{ workspace_id: string; role: string }>('select workspace_id,role from relay_members where user_id=$1', [ids.outsider]);
  assert.equal(members.rows.length, 1); assert.equal(members.rows[0].role, 'admin'); assert.notEqual(members.rows[0].workspace_id, workspace);
  await as('designer', async () => {
    await denied(db.query("update relay_members set role='admin' where workspace_id=$1 and user_id=$2", [workspace, ids.designer]));
    await denied(db.query("select relay_invite_member($1,'designer@relay.example','admin')", [workspace]));
    assert.equal((await db.query<{ role: string }>('select role from relay_members where workspace_id=$1 and user_id=$2', [workspace, ids.designer])).rows[0].role, 'designer');
  });
});

test('PM can create/edit projects; designer/client direct requests cannot bypass role policies', async () => {
  await as('pm', async () => {
    await db.query("insert into relay_projects(id,workspace_id,title) values($1,$2,'PM created project')", [uuid(1), workspace]);
    assert.equal((await db.query("update relay_projects set title='Edited project' where id=$1 returning id", [uuid(1)])).rows.length, 1);
  });
  for (const role of ['designer', 'client'] as const) await as(role, async () => {
    await denied(db.query("insert into relay_projects(workspace_id,title) values($1,'Forbidden')", [workspace]));
    assert.equal((await db.query("update relay_projects set title='Hijacked' where id=$1 returning id", [projectId])).rows.length, 0);
    assert.equal((await db.query('delete from relay_projects where id=$1 returning id', [projectId])).rows.length, 0);
  });
});

test('designer task CRUD works and cannot attach tasks to another workspace; client mutations deny', async () => {
  await as('designer', async () => {
    await db.query("insert into relay_tasks(id,workspace_id,project_id,title) values($1,$2,$3,'Designer task')", [uuid(2), workspace, projectId]);
    assert.equal((await db.query("update relay_tasks set status='done' where id=$1 returning id", [uuid(2)])).rows.length, 1);
    await denied(db.query("insert into relay_tasks(workspace_id,project_id,title) values($1,$2,'Cross workspace')", [workspace, otherProject]));
  });
  await as('client', async () => {
    await denied(db.query("insert into relay_tasks(workspace_id,project_id,title) values($1,$2,'Client task')", [workspace, projectId]));
    assert.equal((await db.query("update relay_tasks set status='todo' where id=$1 returning id", [uuid(2)])).rows.length, 0);
    assert.equal((await db.query('delete from relay_tasks where id=$1 returning id', [uuid(2)])).rows.length, 0);
  });
});

test('server authorship and normalized annotation checks prevent spoofed/malformed feedback', async () => {
  await as('client', async () => {
    await db.query("insert into relay_comments(id,workspace_id,project_id,asset_id,body,x,y) values($1,$2,$3,$4,'Client feedback',.5,.5)", [uuid(3), workspace, projectId, assetId]);
    const row = (await db.query<{ author_id: string; author: string }>('select author_id,author from relay_comments where id=$1', [uuid(3)])).rows[0];
    assert.equal(row.author_id, ids.client); assert.equal(row.author, 'Test client');
    await denied(db.query("insert into relay_comments(workspace_id,project_id,asset_id,body,author_id) values($1,$2,$3,'Forged',$4)", [workspace, projectId, assetId, ids.admin]));
    await denied(db.query("insert into relay_comments(workspace_id,project_id,asset_id,body,x,y) values($1,$2,$3,'Outside image',70,.5)", [workspace, projectId, assetId]), '23514');
    assert.equal((await db.query('update relay_comments set resolved=true where id=$1 returning id', [uuid(3)])).rows.length, 1);
    await denied(db.query("update relay_comments set body='Changed someone’s words' where id=$1", [uuid(3)]));
  });
});

test('atomic comment conversion creates one task and guards duplicate/client attempts', async () => {
  await as('client', async () => { await denied(db.query("select relay_convert_comment($1,$2,'Forbidden conversion')", [commentId, uuid(4)])); });
  await as('pm', async () => {
    await db.query("select relay_convert_comment($1,$2,'Follow up this feedback','Test designer','high',null)", [commentId, uuid(4)]);
    assert.equal((await db.query<{ task_id: string }>('select task_id from relay_comments where id=$1', [commentId])).rows[0].task_id, uuid(4));
    await denied(db.query("select relay_convert_comment($1,$2,'Duplicate')", [commentId, uuid(5)]), '23505');
    assert.equal((await db.query('select id from relay_tasks where id=$1', [uuid(5)])).rows.length, 0);
    await denied(db.query("select relay_convert_comment($1,$2,'')", [uuid(3), uuid(6)]), '23514');
    assert.equal((await db.query<{ task_id: string | null }>('select task_id from relay_comments where id=$1', [uuid(3)])).rows[0].task_id, null);
    await denied(db.query('update relay_comments set task_id=$1 where id=$2', [uuid(2), uuid(3)]));
  });
});

test('revision chains remain immutable and prevent branching or cross-project ancestry', async () => {
  await as('designer', async () => {
    await db.query("insert into relay_assets(id,workspace_id,project_id,name,storage_path,mime,size,version,previous_id) values($1,$2,$3,'Brand v2.png',$4,'image/png',120,2,$5)", [uuid(7), workspace, projectId, assetPath(uuid(7)), assetId]);
    await denied(db.query("insert into relay_assets(id,workspace_id,project_id,name,storage_path,mime,size,version,previous_id) values($1,$2,$3,'Branch.png',$4,'image/png',120,2,$5)", [uuid(8), workspace, projectId, assetPath(uuid(8)), assetId]), '23505');
    await denied(db.query("insert into relay_assets(id,workspace_id,project_id,name,storage_path,mime,size,version,previous_id) values($1,$2,$3,'Wrong project.png',$4,'image/png',120,2,$5)", [uuid(8), workspace, uuid(1), assetPath(uuid(8), uuid(1)), assetId]), '23514');
    await denied(db.query("update relay_assets set name='Silently replaced' where id=$1", [uuid(7)]));
  });
});

test('designer requests review; client approves; approved/previous versions cannot regress', async () => {
  await as('client', async () => {
    await denied(db.query("update relay_assets set status='approved' where id=$1", [uuid(7)]), '23514');
    await denied(db.query("update relay_assets set status='review' where id=$1", [uuid(7)]));
  });
  await as('pm', async () => { await denied(db.query("update relay_assets set status='approved' where id=$1", [uuid(7)]), '23514'); });
  await as('designer', async () => {
    await db.query("update relay_assets set status='review' where id=$1", [uuid(7)]);
    await denied(db.query("update relay_assets set status='approved' where id=$1", [uuid(7)]));
  });
  await as('client', async () => {
    await denied(db.query("update relay_assets set status='draft' where id=$1", [uuid(7)]), '23514');
    await db.query("update relay_assets set status='changes' where id=$1", [uuid(7)]);
  });
  await as('designer', async () => { await db.query("update relay_assets set status='review' where id=$1", [uuid(7)]); });
  await as('client', async () => {
    await db.query("update relay_assets set status='approved' where id=$1", [uuid(7)]);
    await denied(db.query("update relay_assets set status='changes' where id=$1", [uuid(7)]), '23514');
    await denied(db.query("update relay_assets set status='approved' where id=$1", [assetId]), '23514');
  });
  await as('designer', async () => { await db.query("insert into relay_assets(id,workspace_id,project_id,name,storage_path,mime,size,version,previous_id) values($1,$2,$3,'Brand v3.png',$4,'image/png',150,3,$5)", [uuid(9), workspace, projectId, assetPath(uuid(9)), uuid(7)]); });
});

test('project/task insert timestamps are server-owned and approval no-ops add no fake activity', async () => {
  await as('pm', async () => {
    await db.query("insert into relay_projects(id,workspace_id,title,created_at) values($1,$2,'Finite date','infinity')", [uuid(12), workspace]);
    await db.query("insert into relay_tasks(id,workspace_id,project_id,title,created_at) values($1,$2,$3,'Finite task date','infinity')", [uuid(13), workspace, uuid(12)]);
    assert.equal((await db.query<{ finite: boolean }>('select isfinite(created_at) as finite from relay_projects where id=$1', [uuid(12)])).rows[0].finite, true);
    assert.equal((await db.query<{ finite: boolean }>('select isfinite(created_at) as finite from relay_tasks where id=$1', [uuid(13)])).rows[0].finite, true);
    const before = (await db.query<{ count: string }>('select count(*) from relay_activity where workspace_id=$1', [workspace])).rows[0].count;
    await db.query("update relay_assets set status='draft' where id=$1", [uuid(9)]);
    assert.equal((await db.query<{ count: string }>('select count(*) from relay_activity where workspace_id=$1', [workspace])).rows[0].count, before);
  });
});

test('private Storage policies isolate workspaces and deny client/anonymous uploads or overwrites', async () => {
  await db.query("insert into storage.objects(bucket_id,name) values('relay-files',$1)", [assetPath(assetId)]);
  await as('anon', async () => { assert.equal((await db.query("select * from storage.objects where bucket_id='relay-files'")).rows.length, 0); await denied(db.query("insert into storage.objects(bucket_id,name) values('relay-files',$1)", [assetPath(uuid(10))])); });
  await as('outsider', async () => { assert.equal((await db.query('select * from storage.objects where name=$1', [assetPath(assetId)])).rows.length, 0); await denied(db.query("insert into storage.objects(bucket_id,name) values('relay-files',$1)", [assetPath(uuid(10))])); });
  await as('client', async () => { assert.equal((await db.query('select * from storage.objects where name=$1', [assetPath(assetId)])).rows.length, 1); await denied(db.query("insert into storage.objects(bucket_id,name) values('relay-files',$1)", [assetPath(uuid(10))])); });
  await as('designer', async () => {
    await db.query("insert into storage.objects(bucket_id,name) values('relay-files',$1)", [assetPath(uuid(10))]);
    await denied(db.query("insert into storage.objects(bucket_id,name) values('relay-files',$1)", [assetPath(uuid(11), otherProject, otherWorkspace)]));
    assert.equal((await db.query('update storage.objects set name=$1 where name=$2 returning id', [assetPath(uuid(11)), assetPath(uuid(10))])).rows.length, 0);
  });
});

test('archived projects deny child edits until restored; deletion cascades data and clears links', async () => {
  await as('pm', async () => { await db.query("update relay_projects set status='archived' where id=$1", [projectId]); });
  await as('designer', async () => { await denied(db.query("insert into relay_tasks(workspace_id,project_id,title) values($1,$2,'Archived task')", [workspace, projectId])); assert.equal((await db.query("update relay_tasks set status='todo' where id=$1 returning id", [uuid(2)])).rows.length, 0); });
  await as('pm', async () => {
    await db.query("update relay_projects set status='active' where id=$1", [projectId]);
    await db.query('delete from relay_tasks where id=$1', [uuid(4)]); assert.equal((await db.query<{ task_id: string | null }>('select task_id from relay_comments where id=$1', [commentId])).rows[0].task_id, null);
    await db.query('delete from relay_projects where id=$1', [projectId]);
    for (const table of ['relay_tasks', 'relay_assets', 'relay_comments']) assert.equal((await db.query(`select id from ${table} where project_id=$1`, [projectId])).rows.length, 0);
    // Storage API removal is deliberately separate from metadata cascade.
    assert.equal((await db.query('delete from storage.objects where name=$1 returning id', [assetPath(assetId)])).rows.length, 1);
  });
});
