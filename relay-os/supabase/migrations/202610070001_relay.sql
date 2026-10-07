-- RELAY OS: authenticated workspaces, server-owned roles and private file review.
-- Apply through Supabase migrations or the SQL Editor as the database owner.
create schema if not exists relay_private;
revoke all on schema relay_private from public;
grant usage on schema relay_private to authenticated;

create type public.relay_role as enum ('admin', 'pm', 'designer', 'client');
create type public.relay_task_status as enum ('todo', 'in_progress', 'review', 'done');
create type public.relay_approval as enum ('draft', 'review', 'changes', 'approved');

create table public.relay_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 100),
  created_at timestamptz not null default now()
);
create table public.relay_members (
  workspace_id uuid not null references public.relay_workspaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role public.relay_role not null,
  name text not null check (length(btrim(name)) between 1 and 100),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index relay_members_user on public.relay_members(user_id, created_at desc);

create table public.relay_projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.relay_workspaces on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 100),
  client text not null default '' check (length(client) <= 100),
  description text not null default '' check (length(description) <= 1200),
  color text not null default '#c7f970' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  unique (id, workspace_id)
);
create index relay_projects_workspace on public.relay_projects(workspace_id);

create table public.relay_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.relay_workspaces on delete cascade,
  project_id uuid not null,
  title text not null check (length(btrim(title)) between 1 and 160),
  status public.relay_task_status not null default 'todo',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assignee text not null default '' check (length(assignee) <= 100),
  due_date date check (due_date is null or extract(year from due_date) between 1000 and 9999),
  created_at timestamptz not null default now(),
  foreign key (project_id, workspace_id) references public.relay_projects(id, workspace_id) on delete cascade
);
create index relay_tasks_project on public.relay_tasks(workspace_id, project_id);

create table public.relay_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.relay_workspaces on delete cascade,
  project_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 160),
  storage_path text not null unique,
  mime text not null check (mime in ('image/png', 'image/jpeg', 'image/webp')),
  size integer not null check (size between 1 and 3145728),
  version integer not null check (version between 1 and 1000),
  status public.relay_approval not null default 'draft',
  previous_id uuid,
  created_at timestamptz not null default now(),
  unique (id, project_id, workspace_id),
  unique (previous_id),
  foreign key (project_id, workspace_id) references public.relay_projects(id, workspace_id) on delete cascade,
  foreign key (previous_id, project_id, workspace_id) references public.relay_assets(id, project_id, workspace_id) on delete cascade
);
create index relay_assets_project on public.relay_assets(workspace_id, project_id);

create table public.relay_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.relay_workspaces on delete cascade,
  project_id uuid not null,
  asset_id uuid not null,
  author_id uuid not null references auth.users,
  author text not null check (length(btrim(author)) between 1 and 100),
  body text not null check (length(btrim(body)) between 1 and 1600),
  x double precision,
  y double precision,
  resolved boolean not null default false,
  task_id uuid unique references public.relay_tasks on delete set null,
  created_at timestamptz not null default now(),
  foreign key (asset_id, project_id, workspace_id) references public.relay_assets(id, project_id, workspace_id) on delete cascade,
  check ((x is null and y is null) or (x is not null and y is not null and x between 0 and 1 and y between 0 and 1))
);
create index relay_comments_asset on public.relay_comments(workspace_id, asset_id);

create table public.relay_activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.relay_workspaces on delete cascade,
  project_id uuid references public.relay_projects on delete set null,
  body text not null check (length(btrim(body)) between 1 and 300),
  created_at timestamptz not null default now()
);
create index relay_activity_workspace on public.relay_activity(workspace_id, created_at desc);

-- Reject text that the browser validator would refuse; multiline descriptions/comments are allowed.
create function relay_private.valid_text(value text, minimum integer, maximum integer) returns boolean
language sql immutable set search_path = '' as $$
  select length(btrim(value)) between minimum and maximum
    and translate(value, chr(9) || chr(10) || chr(13), '') !~ '[[:cntrl:]]';
$$;
alter table public.relay_members add constraint relay_member_safe_name check (relay_private.valid_text(name, 1, 100));
alter table public.relay_projects add constraint relay_project_safe_text check (relay_private.valid_text(title, 1, 100) and relay_private.valid_text(client, 0, 100) and relay_private.valid_text(description, 0, 1200));
alter table public.relay_tasks add constraint relay_task_safe_text check (relay_private.valid_text(title, 1, 160) and relay_private.valid_text(assignee, 0, 100));
alter table public.relay_assets add constraint relay_asset_safe_name check (relay_private.valid_text(name, 1, 160));
alter table public.relay_comments add constraint relay_comment_safe_text check (relay_private.valid_text(author, 1, 100) and relay_private.valid_text(body, 1, 1600));
alter table public.relay_activity add constraint relay_activity_safe_text check (relay_private.valid_text(body, 1, 300));

-- Read membership through a private definer helper to avoid recursive member policies.
create function relay_private.role_in(workspace uuid) returns public.relay_role
language sql stable security definer set search_path = '' as $$
  select role from public.relay_members where workspace_id = workspace and user_id = (select auth.uid());
$$;
create function relay_private.active_project(project uuid, workspace uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.relay_projects where id = project and workspace_id = workspace and status = 'active');
$$;
revoke all on function relay_private.role_in(uuid), relay_private.active_project(uuid, uuid) from public;
grant execute on function relay_private.role_in(uuid), relay_private.active_project(uuid, uuid) to authenticated;

alter table public.relay_workspaces enable row level security;
alter table public.relay_members enable row level security;
alter table public.relay_projects enable row level security;
alter table public.relay_tasks enable row level security;
alter table public.relay_assets enable row level security;
alter table public.relay_comments enable row level security;
alter table public.relay_activity enable row level security;
revoke all on public.relay_workspaces, public.relay_members, public.relay_projects, public.relay_tasks, public.relay_assets, public.relay_comments, public.relay_activity from anon, authenticated;
grant select on public.relay_workspaces, public.relay_members, public.relay_projects, public.relay_tasks, public.relay_assets, public.relay_comments, public.relay_activity to authenticated;
grant insert, delete on public.relay_projects, public.relay_tasks, public.relay_assets to authenticated;
grant update (title, client, description, color, status) on public.relay_projects to authenticated;
grant update (title, status, priority, assignee, due_date) on public.relay_tasks to authenticated;
grant update (status) on public.relay_assets to authenticated;
grant insert (id, workspace_id, project_id, asset_id, body, x, y) on public.relay_comments to authenticated;
grant update (resolved) on public.relay_comments to authenticated;

create policy workspace_read on public.relay_workspaces for select to authenticated using (relay_private.role_in(id) is not null);
create policy member_read on public.relay_members for select to authenticated using (relay_private.role_in(workspace_id) is not null);
create policy project_read on public.relay_projects for select to authenticated using (relay_private.role_in(workspace_id) is not null);
create policy project_insert on public.relay_projects for insert to authenticated with check (relay_private.role_in(workspace_id) in ('admin', 'pm'));
create policy project_update on public.relay_projects for update to authenticated using (relay_private.role_in(workspace_id) in ('admin', 'pm')) with check (relay_private.role_in(workspace_id) in ('admin', 'pm'));
create policy project_delete on public.relay_projects for delete to authenticated using (relay_private.role_in(workspace_id) in ('admin', 'pm'));
create policy task_read on public.relay_tasks for select to authenticated using (relay_private.role_in(workspace_id) is not null);
create policy task_insert on public.relay_tasks for insert to authenticated with check (relay_private.role_in(workspace_id) in ('admin', 'pm', 'designer') and relay_private.active_project(project_id, workspace_id));
create policy task_update on public.relay_tasks for update to authenticated using (relay_private.role_in(workspace_id) in ('admin', 'pm', 'designer') and relay_private.active_project(project_id, workspace_id)) with check (relay_private.role_in(workspace_id) in ('admin', 'pm', 'designer') and relay_private.active_project(project_id, workspace_id));
create policy task_delete on public.relay_tasks for delete to authenticated using (relay_private.role_in(workspace_id) in ('admin', 'pm', 'designer') and relay_private.active_project(project_id, workspace_id));
create policy asset_read on public.relay_assets for select to authenticated using (relay_private.role_in(workspace_id) is not null);
create policy asset_insert on public.relay_assets for insert to authenticated with check (relay_private.role_in(workspace_id) in ('admin', 'pm', 'designer') and relay_private.active_project(project_id, workspace_id));
create policy asset_update on public.relay_assets for update to authenticated using (relay_private.role_in(workspace_id) is not null and relay_private.active_project(project_id, workspace_id)) with check (relay_private.role_in(workspace_id) is not null and relay_private.active_project(project_id, workspace_id));
create policy asset_delete on public.relay_assets for delete to authenticated using (relay_private.role_in(workspace_id) in ('admin', 'pm', 'designer') and relay_private.active_project(project_id, workspace_id));
create policy comment_read on public.relay_comments for select to authenticated using (relay_private.role_in(workspace_id) is not null);
create policy comment_insert on public.relay_comments for insert to authenticated with check (relay_private.role_in(workspace_id) is not null and author_id = (select auth.uid()) and relay_private.active_project(project_id, workspace_id));
create policy comment_update on public.relay_comments for update to authenticated using ((relay_private.role_in(workspace_id) in ('admin', 'pm', 'designer') or (author_id = (select auth.uid()) and relay_private.role_in(workspace_id) is not null)) and relay_private.active_project(project_id, workspace_id)) with check ((relay_private.role_in(workspace_id) in ('admin', 'pm', 'designer') or (author_id = (select auth.uid()) and relay_private.role_in(workspace_id) is not null)) and relay_private.active_project(project_id, workspace_id));
create policy activity_read on public.relay_activity for select to authenticated using (relay_private.role_in(workspace_id) is not null);

-- Untrusted clients cannot insert infinity/forged dates that poison a workspace load.
create function relay_private.stamp_record() returns trigger
language plpgsql set search_path = '' as $$
begin new.created_at := now(); return new; end;
$$;
create trigger relay_project_timestamp before insert on public.relay_projects for each row execute function relay_private.stamp_record();
create trigger relay_task_timestamp before insert on public.relay_tasks for each row execute function relay_private.stamp_record();

create function relay_private.validate_asset() returns trigger
language plpgsql security definer set search_path = '' as $$
declare previous public.relay_assets; assigned_role public.relay_role;
begin
  assigned_role := relay_private.role_in(new.workspace_id);
  if tg_op = 'INSERT' then
    new.created_at := now();
    if new.status not in ('draft', 'review') then raise exception 'New uploads start as a draft or in review.' using errcode = '23514'; end if;
    if new.storage_path not like new.workspace_id::text || '/' || new.project_id::text || '/' || new.id::text || '.%' then raise exception 'Invalid asset storage path.' using errcode = '23514'; end if;
    if new.previous_id is null then
      if new.version <> 1 then raise exception 'An initial asset must be version 1.' using errcode = '23514'; end if;
    else
      select * into previous from public.relay_assets where id = new.previous_id for update;
      if not found or previous.project_id <> new.project_id or previous.workspace_id <> new.workspace_id or previous.version + 1 <> new.version then raise exception 'Invalid asset revision history.' using errcode = '23514'; end if;
    end if;
  else
    if row(new.id, new.workspace_id, new.project_id, new.name, new.storage_path, new.mime, new.size, new.version, new.previous_id, new.created_at) is distinct from row(old.id, old.workspace_id, old.project_id, old.name, old.storage_path, old.mime, old.size, old.version, old.previous_id, old.created_at) then raise exception 'Published asset metadata is immutable. Upload a new revision.' using errcode = '42501'; end if;
    if old.status = 'approved' and new.status <> old.status then raise exception 'An approved version is final. Upload a new revision.' using errcode = '23514'; end if;
    if exists(select 1 from public.relay_assets where previous_id = old.id) then raise exception 'Review the latest revision of this asset.' using errcode = '23514'; end if;
    if old.status = new.status then return new; end if;
    if not ((old.status in ('draft', 'changes') and new.status = 'review') or (old.status = 'review' and new.status in ('approved', 'changes'))) then raise exception 'Move drafts or requested changes into review before a decision. Approval stages cannot be reset.' using errcode = '23514'; end if;
    if auth.uid() is not null and not ((new.status = 'review' and assigned_role in ('admin', 'pm', 'designer')) or (new.status in ('approved', 'changes') and assigned_role in ('admin', 'pm', 'client'))) then raise exception 'Your role cannot set this approval state.' using errcode = '42501'; end if;
  end if;
  return new;
end;
$$;
create trigger relay_asset_validation before insert or update on public.relay_assets for each row execute function relay_private.validate_asset();

create function relay_private.validate_comment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare member_name text;
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    if auth.uid() is not null then
      select name into member_name from public.relay_members where workspace_id = new.workspace_id and user_id = auth.uid();
      if not found then raise exception 'Not a workspace member.' using errcode = '42501'; end if;
      new.author_id := auth.uid(); new.author := member_name; new.resolved := false; new.task_id := null;
    end if;
  else
    if row(new.id, new.workspace_id, new.project_id, new.asset_id, new.author_id, new.author, new.body, new.x, new.y, new.created_at) is distinct from row(old.id, old.workspace_id, old.project_id, old.asset_id, old.author_id, old.author, old.body, old.x, old.y, old.created_at) then raise exception 'Review feedback and attribution are immutable.' using errcode = '42501'; end if;
    if old.task_id is not null and new.task_id is not null and old.task_id <> new.task_id then raise exception 'This comment already has a linked task.' using errcode = '23514'; end if;
  end if;
  if new.task_id is not null and not exists(select 1 from public.relay_tasks where id = new.task_id and project_id = new.project_id and workspace_id = new.workspace_id) then raise exception 'The linked task must belong to the same project.' using errcode = '23514'; end if;
  return new;
end;
$$;
create trigger relay_comment_validation before insert or update on public.relay_comments for each row execute function relay_private.validate_comment();

create function public.relay_convert_comment(comment_id uuid, new_task_id uuid, task_title text, task_assignee text default '', task_priority text default 'medium', task_due_date date default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare feedback public.relay_comments;
begin
  select * into feedback from public.relay_comments where id = comment_id for update;
  if not found or relay_private.role_in(feedback.workspace_id) not in ('admin', 'pm', 'designer') or relay_private.role_in(feedback.workspace_id) is null then raise exception 'This comment is unavailable or your role cannot create tasks.' using errcode = '42501'; end if;
  if not relay_private.active_project(feedback.project_id, feedback.workspace_id) then raise exception 'Restore this project before editing its work.' using errcode = '23514'; end if;
  if feedback.task_id is not null then raise exception 'This comment already has a linked task.' using errcode = '23505'; end if;
  insert into public.relay_tasks(id, workspace_id, project_id, title, assignee, priority, due_date) values(new_task_id, feedback.workspace_id, feedback.project_id, task_title, task_assignee, task_priority, task_due_date);
  update public.relay_comments set task_id = new_task_id where id = comment_id;
  return new_task_id;
end;
$$;
revoke all on function public.relay_convert_comment(uuid, uuid, text, text, text, date) from public, anon;
grant execute on function public.relay_convert_comment(uuid, uuid, text, text, text, date) to authenticated;

create function relay_private.record_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare workspace uuid; project uuid; actor_name text; entry text; item jsonb;
begin
  if tg_op = 'UPDATE' and new is not distinct from old then return null; end if;
  if tg_op = 'DELETE' then item := to_jsonb(old); else item := to_jsonb(new); end if;
  workspace := (item->>'workspace_id')::uuid;
  if not exists(select 1 from public.relay_workspaces where id = workspace) then return null; end if;
  if tg_table_name = 'relay_projects' then project := (item->>'id')::uuid; else project := (item->>'project_id')::uuid; end if;
  if not exists(select 1 from public.relay_projects where id = project) then project := null; end if;
  select name into actor_name from public.relay_members where workspace_id = workspace and user_id = auth.uid();
  actor_name := coalesce(actor_name, 'Workspace setup');
  if tg_table_name = 'relay_projects' then entry := lower(tg_op) || ' project “' || (item->>'title') || '”';
  elsif tg_table_name = 'relay_tasks' then entry := lower(tg_op) || ' task “' || (item->>'title') || '” · ' || (item->>'status');
  elsif tg_table_name = 'relay_assets' then entry := lower(tg_op) || ' ' || (item->>'name') || ' · v' || (item->>'version') || ' · ' || (item->>'status');
  else
    if tg_op = 'INSERT' then entry := 'added review feedback';
    elsif tg_op = 'DELETE' then entry := 'removed review feedback';
    elsif new.task_id is distinct from old.task_id then entry := 'linked review feedback to a task';
    else entry := case when new.resolved then 'resolved review feedback' else 'reopened review feedback' end; end if;
  end if;
  insert into public.relay_activity(workspace_id, project_id, body) values(workspace, project, left(actor_name || ': ' || entry, 300));
  delete from public.relay_activity where workspace_id = workspace and id not in (select id from public.relay_activity where workspace_id = workspace order by created_at desc, id desc limit 200);
  return null;
end;
$$;
create trigger relay_project_activity after insert or update or delete on public.relay_projects for each row execute function relay_private.record_activity();
create trigger relay_task_activity after insert or update or delete on public.relay_tasks for each row execute function relay_private.record_activity();
create trigger relay_asset_activity after insert or update or delete on public.relay_assets for each row execute function relay_private.record_activity();
create trigger relay_comment_activity after insert or update or delete on public.relay_comments for each row execute function relay_private.record_activity();

-- Signup can supply a display name, never a role or someone else's workspace.
create function relay_private.bootstrap_account() returns trigger
language plpgsql security definer set search_path = '' as $$
declare workspace uuid; display_name text;
begin
  display_name := left(btrim(regexp_replace(coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1), 'New member'), '[[:cntrl:]]', '', 'g')), 100);
  if display_name = '' then display_name := 'New member'; end if;
  insert into public.relay_workspaces(name) values(left(display_name || '’s workspace', 100)) returning id into workspace;
  insert into public.relay_members(workspace_id, user_id, role, name) values(workspace, new.id, 'admin', display_name);
  return new;
end;
$$;
create trigger relay_auth_account after insert on auth.users for each row execute function relay_private.bootstrap_account();

-- Call only as a signed-in workspace admin, or use the SQL Editor membership setup.
-- The invitee must already have a confirmed Auth account; no email is sent by this RPC.
create function public.relay_invite_member(workspace uuid, member_email text, member_role public.relay_role) returns void
language plpgsql security definer set search_path = '' as $$
declare invitee auth.users; display_name text;
begin
  if relay_private.role_in(workspace) is distinct from 'admin'::public.relay_role then raise exception 'Only an administrator can invite members or assign roles.' using errcode = '42501'; end if;
  select * into invitee from auth.users where lower(email) = lower(btrim(member_email)) and email_confirmed_at is not null;
  if not found then raise exception 'Ask this person to create and confirm their account first.' using errcode = '22023'; end if;
  if invitee.id = auth.uid() then raise exception 'Use another administrator to change your own role.' using errcode = '42501'; end if;
  display_name := left(btrim(regexp_replace(coalesce(nullif(btrim(invitee.raw_user_meta_data->>'name'), ''), split_part(invitee.email, '@', 1), 'New member'), '[[:cntrl:]]', '', 'g')), 100);
  if display_name = '' then display_name := 'New member'; end if;
  insert into public.relay_members(workspace_id, user_id, role, name) values(workspace, invitee.id, member_role, display_name)
  on conflict (workspace_id, user_id) do update set role = excluded.role, name = excluded.name;
end;
$$;
revoke all on function public.relay_invite_member(uuid, text, public.relay_role) from public, anon;
grant execute on function public.relay_invite_member(uuid, text, public.relay_role) to authenticated;

-- Private images: workspace/project/asset.ext. No public URLs or overwriting versions.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('relay-files', 'relay-files', false, 3145728, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create function relay_private.storage_access(path text, writing boolean, deleting boolean default false) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare workspace uuid; project uuid; assigned_role public.relay_role; parts text[];
begin
  parts := string_to_array(path, '/');
  if array_length(parts, 1) <> 3 or parts[1] !~ '^[0-9a-fA-F-]{36}$' or parts[2] !~ '^[0-9a-fA-F-]{36}$' or parts[3] !~ '^[0-9a-fA-F-]{36}\.(png|jpg|webp)$' then return false; end if;
  begin workspace := parts[1]::uuid; project := parts[2]::uuid; exception when invalid_text_representation then return false; end;
  assigned_role := relay_private.role_in(workspace);
  if assigned_role is null then return false; end if;
  if not writing then return true; end if;
  if assigned_role not in ('admin', 'pm', 'designer') then return false; end if;
  return deleting or relay_private.active_project(project, workspace);
end;
$$;
revoke all on function relay_private.storage_access(text, boolean, boolean) from public;
grant execute on function relay_private.storage_access(text, boolean, boolean) to authenticated;
create policy relay_storage_read on storage.objects for select to authenticated using (bucket_id = 'relay-files' and relay_private.storage_access(name, false));
create policy relay_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'relay-files' and relay_private.storage_access(name, true));
create policy relay_storage_delete on storage.objects for delete to authenticated using (bucket_id = 'relay-files' and relay_private.storage_access(name, true, true));

-- Membership changes and collaborative work stream through a single scoped channel.
do $$
declare table_name text;
begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['relay_projects','relay_tasks','relay_assets','relay_comments','relay_activity','relay_members'] loop
      if not exists(select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name) then execute format('alter publication supabase_realtime add table public.%I', table_name); end if;
    end loop;
  end if;
end;
$$;
