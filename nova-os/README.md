# NOVA OS

An interactive workspace portfolio concept built with Next.js Pages Router, React, TypeScript, Tailwind, Radix Dialog, CVA, Lucide and GSAP. Live public GitHub repositories and milestones connect to browser-local projects and planning tasks; the assistant uses deterministic local rules.

## Run

```powershell
npm ci
npm run dev
```

Open http://localhost:3101. `npm run typecheck` checks TypeScript. `npm run build` creates a static export in `out/`.

The root portfolio build sets `PORTFOLIO_BASE_PATH=/nova-os`. Standalone builds default to an empty base path. All Next links honour this setting.

## Explore

- Marketing: landing, product, pricing, story and contact.
- Demo authentication: login, signup and three-step onboarding; no real accounts, password storage, or payments.
- Workspace: overview, projects, task list and draggable boards, local assistant, automation builder, analytics, a live GitHub workspace and simulated integrations for other services.
- GitHub workspace: `/app/github/` reads a public repository and its open milestones without credentials. Repository import creates a local project; milestone import creates one local task with source attribution, not the milestone's individual issues.
- Command palette: Ctrl/Cmd K searches pages, projects and tasks.
- Tasks and projects can be added and completed. Supported data and the dark/light preference persist in this browser's localStorage after runtime validation. Storage failures are reported as session-only saving.
- Automation nodes can be dragged, reordered with arrow buttons, edited and tested against a sample task. Actions update only the local workspace.
- Analytics uses current tasks for summary metrics and project progress, with illustrative historical trend data. CSV export is real.
- The GitHub integration card opens the real public-data workspace. Other cards illustrate connection states; no external accounts connect.

## Assistant examples

- `Summarise Brand refresh`
- `What should I focus on today?`
- `Create task: Plan the launch`
- `Complete Explore visual direction`

The assistant applies deterministic local rules and updates actual demo tasks. No AI API or backend is used. Authentication, team collaboration and enquiries remain local simulations. Reset sample data from onboarding. No deployment or Git operations are required to explore this project.

## Live GitHub workspace

Open `/app/github/` directly or choose **GitHub workspace** in the workspace navigation. The GitHub integration card links to the same feature. The default repository is `microsoft/TypeScript`; any supported public `owner/repository` can be loaded.

`components/github-api.ts` reads repository metadata and one open-milestone page in parallel:

```text
GET https://api.github.com/repos/{owner}/{repo}
GET https://api.github.com/repos/{owner}/{repo}/milestones?state=open&sort=due_on&direction=asc&per_page=30
```

Requests use `credentials: omit`, `cache: no-cache`, `Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2026-03-10`. There is no token, sign-in or GitHub write. Runtime checks validate unknown responses, IDs, counts, canonical repository names and real calendar dates. Links are constructed from validated names and milestone numbers; remote HTML and response URL fields are not trusted.

`components/github-workspace.tsx` presents loading, success, empty/search-empty and error states with refresh and retry. It handles missing/unavailable repositories, network failures, malformed responses and rate limits. A shared 12-second timeout bounds the two reads. Switching repositories or leaving the page aborts requests; a cleanup guard ignores obsolete results. The workspace reads at most 30 open milestones, sorted by due date. Search filters only this fetched page. There is no application cache or automatic polling, and public network rate limits still apply. Refresh reads source data again.

Importing a repository creates one local project. Importing a milestone creates its repository project if needed, then one `Todo` task with `Medium` priority, the local user's name, the milestone description and due date when present. It does **not** fetch or import that milestone's issues. GitHub's milestone progress includes associated issues and pull requests and remains source data; completing the local task does not change GitHub's milestone, issue counts or repository.

`components/workspace-data.ts` performs imports inside functional state updates. Duplicate guards use stable repository/milestone IDs and canonical source identities; buttons remain disabled for saved imports after reload. Source records preserve canonical links and import timestamps. A verified repository rename is reconciled by stable repository ID, updating linked source names/URLs while preserving local planning edits. Imports append local activity records, capped at 100 entries; the workspace displays the latest five.

## Browser storage and scope

`components/store.tsx` restores `nova-os-v1` only after `parseStoredWorkspace` validates records, enums, IDs, dates, source URLs, project/task relationships and size limits. Unknown fields are stripped. Legacy supported records without activity remain usable. Invalid stored data restores the sample workspace and announces the problem. Access, write or supported-size failures show a session-only warning; changes may be lost on reload.

This is a static frontend concept with browser-local planning data. It provides no private-repository access, GitHub writes, cloud database, cross-device/team synchronisation, real authentication or production AI. Other integration states and business history remain illustrative.

## Source and verification

Read `components/github-api.ts` for requests/response validation, `components/github-workspace.tsx` for the lifecycle and UI, `components/workspace-data.ts` for import/rename/storage helpers, and `components/store.tsx` for persistence. `pages/app/github.tsx` selects the GitHub workspace view; navigation and the integration card are wired in `components/workspace.tsx`.

The root browser suite exercises the combined production bundle. See [the latest validation report](../VALIDATION.md) for completed checks and their limits rather than assuming that source inspection proves every failure mode, performance or accessibility conformance.

## Design and accessibility

Responsive layouts, semantic landmarks, a skip link, visible focus, reduced motion support, descriptive control labels, keyboard alternatives for drag interactions, accessible Radix modals and live status announcements. The hero is CSS art and the charts are SVG, so no placeholder photography is needed. All studio names, activity and plan pricing are fictional sample content.
