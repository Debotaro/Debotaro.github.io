# RELAY OS cloud backend

The public portfolio runs the complete browser-local demo without credentials. This directory provides the optional Supabase backend: real email/password accounts, Postgres project/task/review data, server-assigned workspace roles, private image storage and scoped Realtime updates. A Supabase account/project has not been deployed or verified by this repository's demo release.

## Enable cloud mode

1. Create a dedicated Supabase project. Apply [`migrations/202610070001_relay.sql`](migrations/202610070001_relay.sql) in its SQL Editor as the database owner, or use the Supabase CLI migration workflow. The migration creates seven RLS tables, membership/bootstrap functions, review constraints, a private `relay-files` bucket, Storage policies and the Realtime publication entries.
2. In Authentication → URL Configuration, set the Site URL to your frontend URL and allow its exact redirect URL. For this portfolio, use `https://debotaro.github.io/relay-os/`; local development can use `http://127.0.0.1:5176/`. Leave email confirmation enabled and configure your project's email delivery for real users.
3. Copy `relay-os/.env.example` to `relay-os/.env.local`. Set `VITE_SUPABASE_URL` to the project URL and `VITE_SUPABASE_PUBLISHABLE_KEY` to the browser-safe `sb_publishable_…` key from the project Connect dialog. Never use a secret key, service-role key, password or database connection string in a Vite variable.
4. Run `npm run dev` inside `relay-os`, or rebuild the portfolio. Vite substitutes these values at build time. Both values are required; absent configuration keeps the local demo available. A configured build shows the real account screen and stores its work in Supabase instead of importing demo browser data.
5. Create and confirm your account, then sign in. A database trigger creates your personal workspace and its Admin membership. Signup metadata can set a display name; it cannot assign a role in someone else's workspace. Accounts created before the migration need the trusted membership bootstrap below.
6. Optionally run [`seed.sql`](seed.sql) after the first account exists. It adds labelled sample projects/tasks to the earliest administrator's workspace only when that workspace has no projects. The cloud sample has no fake uploaded images: upload a PNG, JPEG or WebP through RELAY to start a private review.

For GitHub Actions, set the two browser-safe values as repository variables and pass them to the frontend build environment. The existing public release intentionally does not assume these variables exist. Changing environment configuration requires a new build; the browser cannot provision a database.

## Four roles and membership

| Capability                                               | Admin | Project manager | Designer | Client       |
| -------------------------------------------------------- | ----- | --------------- | -------- | ------------ |
| Read work in their workspace                             | Yes   | Yes             | Yes      | Yes          |
| Create/edit/archive/delete projects                      | Yes   | Yes             | No       | No           |
| Create/edit/delete tasks and convert feedback into tasks | Yes   | Yes             | Yes      | No           |
| Upload/delete designs and create revisions               | Yes   | Yes             | Yes      | No           |
| Add image pins and comments                              | Yes   | Yes             | Yes      | Yes          |
| Resolve feedback                                         | Any   | Any             | Any      | Own comments |
| Request review from draft/changes                        | Yes   | Yes             | Yes      | No           |
| Approve or request changes                               | Yes   | Yes             | No       | Yes          |
| Assign membership roles                                  | Yes   | No              | No       | No           |

Drafts and requested changes move into review before a reviewer can approve or request changes. Clients cannot submit drafts for review; designers cannot issue approval decisions. Approval stages cannot be reset to draft. An approved asset version is final; propose further changes with a new revision. A previous version cannot receive an approval after a successor exists. Repeating the same approval state is a no-op and adds no activity. Archived projects remain readable and must be restored before changing child work. Project deletion cascades tasks, asset versions and comments. Deleting a linked task clears its comment's link. A comment-to-task conversion locks the comment and creates/links the task in one database transaction, so concurrent or repeated requests cannot create two tasks.

Role switching on the public demo is explicitly a local simulation. Cloud roles come only from `relay_members`, and the RLS policies, column grants and database triggers enforce them even when someone bypasses the interface. Browser requests cannot insert/update their membership, forge authors, rewrite a published asset, choose another workspace's project or write fake activity. Activity records are generated by database triggers and retain the latest 200 events.

### Invite real collaborators

Each collaborator first creates and confirms a real Auth account. As a signed-in Admin, the Supabase JavaScript client can call:

```ts
await supabase.rpc('relay_invite_member', {
  workspace: 'YOUR_WORKSPACE_UUID',
  member_email: 'confirmed-collaborator@example.com',
  member_role: 'designer', // admin | pm | designer | client
});
```

This RPC assigns an existing account to a workspace; it does not send an email. The admin must share the app URL with the collaborator. The current frontend selects the most recently created membership, so a new invitation opens the collaborative workspace after Refresh/sign-in. There is no multi-workspace selector or membership-management screen in this release. Existing membership role changes retain their original membership date. Admins cannot change their own role through this RPC; another administrator can do so.

For initial setup or an account created before the migration, a trusted database owner can use the SQL Editor:

```sql
-- Inspect actual accounts and workspaces; do not paste passwords into SQL files.
select id, email from auth.users order by created_at;
select id, name from public.relay_workspaces order by created_at;

-- Create a workspace only if this account does not already have one.
insert into public.relay_workspaces(name) values ('Your team') returning id;
insert into public.relay_members(workspace_id, user_id, role, name)
values ('WORKSPACE_UUID', 'CONFIRMED_AUTH_USER_UUID', 'admin', 'Your name');
```

Use the real UUIDs returned by your project. No default account passwords or publicly shared cloud credentials are shipped.

## Files, network state and persistence

Uploads support PNG/JPEG/WebP, with a 3 MiB cloud bucket limit. The browser checks the declared MIME type and raster file signatures; the bucket separately enforces allowed MIME types and size. The application does not perform server-side image decoding or malware scanning. Version objects have unique paths `workspace/project/asset.ext`; overwriting objects is denied. Workspace members can obtain temporary private previews. Signed URLs expire after 30 minutes and are renewed by refresh/15-minute refetch; signed URLs never go into the demo's local storage.

Metadata deletion and Storage object removal are separate operations. The adapter first deletes authorized database records, then requests removal of corresponding Storage objects. If file cleanup fails, RELAY reports the incomplete cleanup without pretending the database deletion failed. An Admin can inspect the private bucket and remove objects that no longer have a `relay_assets.storage_path` row through the Storage dashboard/API. Do not delete `storage.objects` rows directly: that only changes metadata and can leave underlying bytes behind.

Cloud mutations update the interface optimistically, use server authorization, then refetch authoritative data. Failures restore/refetch state and display a useful error. Data is not queued for background upload; an interrupted request requires refresh before retrying. Realtime notifications trigger a debounced complete refetch and are removed on sign-out/unmount; connection errors offer manual Refresh. Browser reconnection also refetches. Requests have a 15-second deadline. The client supports at most 100 projects, 1,000 tasks, 300 assets and 2,000 comments per workspace; larger datasets fail with guidance instead of silently truncating.

The public demo stores `relay-os-workspace-v1` in browser local storage, validates it on read, rejects malformed/unsafe/dangling records, and recovers with labelled sample data. Demo images are limited to 1 MiB each and the total serialized workspace to 3.5 million characters. If storage is blocked/full or the limit is reached, changes continue in memory and RELAY displays **session only** status. There is no background server sync in demo mode.

## Validation

From `relay-os`, run:

```sh
npm test
npm run typecheck
```

`tests/domain.test.ts` checks runtime validation, role denials, immutable revision/approval rules, atomic local conversion, cascades and storage input boundaries. `tests/database.test.ts` executes this actual migration in **PGlite 0.5.8 embedded PostgreSQL**, with explicit Auth/Storage schema stubs, then exercises authenticated/anonymous requests under real PostgreSQL grants and RLS. It covers isolation, self-escalation denial, column restrictions, server authorship/timestamps, conversion transaction/duplicates, revision constraints, strict approval transitions/no-op activity, private Storage policies, archives and cascades. PGlite is a development dependency and is not shipped in the browser application.

These checks do not exercise Supabase's hosted Auth email delivery, JWT verification service, Storage bytes, signed URL endpoint or WebSocket server. Those need a configured project and real accounts. The additional [`tests/relay_rls_test.sql`](tests/relay_rls_test.sql) pgTAP script is supplied for the Supabase CLI test environment; it has not been run against a hosted account as part of the portfolio demo.

For a local Supabase stack with Docker, initialize the CLI configuration if needed and apply/reset migrations before running:

```sh
supabase start
supabase db reset
supabase test db
```

Run these from `relay-os` after `supabase init` supplies a local `config.toml`. The migration, seed and SQL tests already live in the expected directories. A reset recreates the local database: do not use a remote reset to prepare a live account. In a configured test project, verify sign-in/email confirmation, invitations, one account per role, two isolated workspaces, upload/private previews, reconnect, realtime and sign-out before describing the backend as deployed.

Implementation references: [Supabase publishable keys](https://supabase.com/docs/guides/getting-started/api-keys), [RLS and least-privilege grants](https://supabase.com/docs/guides/database/postgres/row-level-security), [private Storage policies](https://supabase.com/docs/guides/storage/security/access-control), [database testing](https://supabase.com/docs/guides/database/testing), [PGlite execution](https://pglite.dev/docs/).
