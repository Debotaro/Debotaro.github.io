# ATLAS Ops

A complete, responsive operations workspace built with React, TypeScript and Vite. A quiet navy navigation system meets a bright, considered dashboard.

## Run locally

Requires Node.js 20.19+ or 22.12+ (Node 24 supported).

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5174`. The landing page introduces the project. **Explore the demo** opens the overview immediately; **Demo sign in** allows a local name/email preference without creating an account.

```powershell
npm run typecheck
npm run build
npm run preview
```

Preview is on `http://127.0.0.1:4174`. Built files are in `dist/`.

## Interactive workflows

- `#/overview`: seeded revenue/cost charts with 7/30/90-day range and location filters, editable target lines, accessible chart data table, CSV export, live task and coverage metrics.
- `#/tasks`: board/list views, search, priority/department filters, sorting, drag-and-drop plus keyboard-accessible status selectors, task creation/editing/deletion.
- `#/github`: live public repository details and open GitHub issues, repository selection, refresh, local search, source links and one-click import into the local task backlog.
- `#/coverage`: a seeded October 5–9, 2026 team schedule, editable shifts, location filtering, live daily coverage calculations and schedule CSV export.
- `#/notifications`: category and unread filters, individual/bulk mark as read, clear read, workflow links. Task and schedule changes generate local notifications.
- `#/settings`: workspace/profile/timezone preferences, compact layout, stored digest/alert preferences and a confirmed reset to the initial demo.
- `#/login`: local demo entry; no actual authentication.

Changes are saved to `localStorage` under `atlas-ops-v1`. Reset in Settings restores original demo records, including removing imported tasks. The dashboard and coverage data are fictional; the GitHub queue is labelled as live public data. No backend, real account, emails or financial services are connected. The coverage schedule is deliberately one fixed sample week. Dashboard comparisons use fictional prior-period percentages; current totals and chart data respond to filters.

Radix Dialog and Switch primitives provide shadcn-style accessible form controls; native labelled inputs/selects preserve keyboard interaction. Tailwind v4 is integrated through the official Vite plugin. The Recharts graphics include a textual data view. The application uses no photo placeholders and needs no API keys.

## Deployment

The Vite configuration sets `base: './'`; navigation uses URL hashes. Upload the contents of `dist/` to any static hosting subdirectory, or deploy this directory as a Vite project (build command `npm run build`, output `dist`). No server rewrite is required. Keep the bundled `assets/` folder next to `index.html`.

Google Fonts and the public GitHub REST API are remote runtime dependencies; local sans-serif fallbacks and the local task workspace remain usable offline. Dependencies are pinned and `package-lock.json` makes installation reproducible.

## Live GitHub integration

`src/github.ts` is the API boundary. `fetchGitHubQueue` reads repository metadata and the latest issue page in parallel:

```text
GET https://api.github.com/repos/{owner}/{repo}
GET https://api.github.com/repos/{owner}/{repo}/issues?state=open&sort=updated&direction=desc&per_page=30
```

Requests use `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2026-03-10`, `credentials: omit` and `cache: no-cache`. No API key, sign-in, token or GitHub write is involved. Input accepts an owner/repository pair; responses are validated at runtime before rendering. Links are constructed on `github.com` from the validated canonical repository name and issue number, so moved repositories and untrusted response URL fields are handled safely. The default `facebook/react` currently redirects to `react/react`.

The issues endpoint also returns pull requests; ATLAS excludes entries containing `pull_request`. This queue shows only the latest page of up to 30 raw GitHub entries, so its displayed issue count is **not** the repository's total. The full issue list is linked on GitHub. Search filters the fetched page by title, number, author and labels. Issue bodies appear as plain text summaries; ATLAS does not execute or render remote HTML.

`src/GitHubQueue.tsx` uses explicit loading, success and error states. Switching repositories or leaving the route aborts the pending request and ignores obsolete results. A shared 12-second timeout bounds the pair of requests. Empty pages, filtered searches, missing repositories, disabled issues, network failures, malformed responses and rate limits have contextual messages and recovery actions. There is no application-level issue cache or automatic polling; refreshing revalidates browser HTTP data. Public requests are subject to GitHub's unauthenticated network rate limit, currently 60 requests per hour per source IP. Loading the queue makes two API requests; private repositories are unsupported.

Importing an issue creates a local `Backlog` task with `Medium` priority, the existing Operations/Olivia Chen/London defaults, and a due date seven days from the import date. Titles and descriptions use the existing editor limits (100 and 500 characters). A `Task.source` record stores the globally unique issue ID, issue number, canonical repository, source URL and import timestamp. Duplicate prevention checks the issue ID within a functional state update; the import button stays disabled after a reload. Source links remain on the task card and in its editor when task details change. Deleting a task permits a new import. Local task status does not sync to GitHub.

API contracts: [Get a repository](https://docs.github.com/en/rest/repos/repos#get-a-repository), [List repository issues](https://docs.github.com/en/rest/issues/issues#list-repository-issues), [REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).

## Verification

From the parent portfolio directory:

```powershell
npm run typecheck --prefix atlas-ops
npm run build --prefix atlas-ops
npx playwright test tests/atlas-api.spec.ts
```

The root preview must serve a current portfolio build. To test this app's isolated Vite server instead, run `npm run dev --prefix atlas-ops`, then set `$env:ATLAS_TEST_URL='http://127.0.0.1:5174/'` before the Playwright command. The suite uses deterministic mocked API responses on desktop and mobile for loading, success/import/persistence/source retention, refresh/search, empty/input validation, retry, network failure, primary/secondary rate limits, malformed response, timeout and stale-request behavior. These checks passed on 7 October 2026 (18 passed, two opt-in live checks skipped).

The live smoke test is separate because GitHub availability and public rate limits can change:

```powershell
$env:ATLAS_LIVE_SMOKE='1'
npx playwright test tests/atlas-api.spec.ts --grep 'live GitHub smoke' --project=desktop
```

The unmocked browser check passed on 7 October 2026, rendering live canonical repository details and issues. Desktop and mobile visual captures are in `qa/github-desktop.png` and `qa/github-mobile.png`.
