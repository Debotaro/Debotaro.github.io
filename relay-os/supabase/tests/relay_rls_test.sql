-- Supabase CLI test environment only: supabase test db
-- All fixtures roll back; these addresses are reserved sample addresses.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data) values
  ('91000000-0000-4000-8000-000000000001', 'relay-admin@testing.example', now(), '{"name":"Test admin","role":"client"}'),
  ('91000000-0000-4000-8000-000000000002', 'relay-designer@testing.example', now(), '{"name":"Test designer","role":"admin"}'),
  ('91000000-0000-4000-8000-000000000003', 'relay-client@testing.example', now(), '{"name":"Test client"}');
insert into relay_workspaces(id,name) values('92000000-0000-4000-8000-000000000001','RLS test workspace');
insert into relay_members(workspace_id,user_id,role,name) values
  ('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','admin','Test admin'),
  ('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000002','designer','Test designer'),
  ('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000003','client','Test client');
insert into relay_projects(id,workspace_id,title) values('93000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001','Test launch');
insert into relay_assets(id,workspace_id,project_id,name,storage_path,mime,size,version) values
  ('94000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','Test.png','92000000-0000-4000-8000-000000000001/93000000-0000-4000-8000-000000000001/94000000-0000-4000-8000-000000000001.png','image/png',100,1);

select is((select role::text from relay_members where user_id='91000000-0000-4000-8000-000000000001' and workspace_id <> '92000000-0000-4000-8000-000000000001'), 'admin', 'Signup metadata cannot choose a personal workspace role');
select ok((select not public from storage.buckets where id='relay-files'), 'Files are in a private bucket');

set local role anon;
select set_config('request.jwt.claims', '{}', true);
select throws_ok('select * from public.relay_projects', '42501', null, 'Anonymous users cannot read project tables');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select throws_ok($$update relay_members set role='admin' where workspace_id='92000000-0000-4000-8000-000000000001'$$, '42501', null, 'Designer cannot escalate a membership role');
select throws_ok($$insert into relay_projects(workspace_id,title) values('92000000-0000-4000-8000-000000000001','Denied')$$, '42501', null, 'Designer cannot create projects');
select lives_ok($$insert into relay_tasks(id,workspace_id,project_id,title) values('95000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','Allowed task')$$, 'Designer can create tasks');

select set_config('request.jwt.claims', '{"sub":"91000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select throws_ok($$update relay_assets set status='approved' where id='94000000-0000-4000-8000-000000000001'$$, '23514', null, 'Client cannot approve an unsubmitted draft');
select set_config('request.jwt.claims', '{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select lives_ok($$update relay_assets set status='review' where id='94000000-0000-4000-8000-000000000001'$$, 'Designer can submit a draft for review');
select throws_ok($$update relay_assets set status='approved' where id='94000000-0000-4000-8000-000000000001'$$, '42501', null, 'Designer cannot approve assets');

select set_config('request.jwt.claims', '{"sub":"91000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select throws_ok($$insert into relay_tasks(workspace_id,project_id,title) values('92000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','Denied task')$$, '42501', null, 'Client cannot create tasks');
select lives_ok($$insert into relay_comments(id,workspace_id,project_id,asset_id,body,x,y) values('96000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','94000000-0000-4000-8000-000000000001','Helpful feedback',.25,.75)$$, 'Client can annotate a design');
select is((select author_id::text from relay_comments where id='96000000-0000-4000-8000-000000000001'),'91000000-0000-4000-8000-000000000003','Comment author is taken from the authenticated user');
select lives_ok($$update relay_assets set status='approved' where id='94000000-0000-4000-8000-000000000001'$$, 'Client can approve the current design');
select throws_ok($$update relay_assets set status='changes' where id='94000000-0000-4000-8000-000000000001'$$, '23514', null, 'Approved versions cannot silently regress');

reset role;
select * from finish();
rollback;
