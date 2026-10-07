-- Optional trusted setup script after the first real account has signed up.
-- No passwords, fake Auth identities, or published login credentials are created.
do $$
declare workspace uuid; first_project uuid := gen_random_uuid(); second_project uuid := gen_random_uuid();
begin
  select workspace_id into workspace from public.relay_members where role = 'admin' order by created_at limit 1;
  if workspace is null then raise notice 'Create a confirmed RELAY account first, then rerun this seed.'; return; end if;
  if exists(select 1 from public.relay_projects where workspace_id = workspace) then raise notice 'This workspace already contains projects. Seed left it unchanged.'; return; end if;
  insert into public.relay_projects(id, workspace_id, title, client, description, color) values
    (first_project, workspace, 'Forma — Brand launch', 'Forma Studio', 'Sample brand and digital launch. Upload your first raster design to start a private review.', '#c7f970'),
    (second_project, workspace, 'Luma — Commerce experience', 'Luma Objects', 'Sample onboarding and shopping experience.', '#d4c4ff');
  insert into public.relay_tasks(workspace_id, project_id, title, status, priority, assignee, due_date) values
    (workspace, first_project, 'Refine the Forma wordmark', 'review', 'high', '', current_date + 5),
    (workspace, first_project, 'Build the launch landing page', 'in_progress', 'high', '', current_date + 8),
    (workspace, first_project, 'Document colour and typography tokens', 'done', 'medium', '', null),
    (workspace, second_project, 'Map onboarding and empty states', 'todo', 'medium', '', current_date + 10);
end;
$$;
