# Deboraj Sarkar (Debotaro) — practical frontend interview preparation

Prepared from the source in this repository on 7 October 2026. This is a study and practice guide, not a claim that Deboraj has already mastered each topic or personally written every line.

The seven projects were developed with AI assistance. The repository describes Deboraj's role as **project direction and AI-assisted frontend development**; Codex assisted with implementation and iteration. The sample answers below are explanations to learn, then adapt to what you can actually explain and demonstrate. Do not memorise an answer and present it as experience you have not had.

## Start here

For a typical junior frontend interview, prepare **NILA, NOVA and the portfolio first**. NOVA now supports both shared React state and a live repository/milestone API discussion; add ATLAS for a task-board or issue-import example. Use VANTA, AURA and RASA as supporting examples of JavaScript, forms, accessibility and progressive enhancement. You do not need to present all seven in one interview.

For every feature you practise, follow this cycle:

1. Use it in the browser.
2. Find the state, event handler and rendered output in the source.
3. Explain the path without reading a script.
4. Make one small change yourself in a practice copy.
5. Check one normal case and one failure or edge case.

Keep an honest learning log: date, task, files changed, what you understood, what AI helped with, and how you checked the result. That log can support future interview examples; this guide cannot create past experience.

### A 30–45 second introduction to adapt

> I'm Deboraj Sarkar, also known as Debotaro. I'm a Frontend Developer focused on responsive interfaces using HTML, CSS, JavaScript, React, Next.js and TypeScript. My portfolio contains a personal website and six working concept projects. They were developed with AI assistance, including Codex. I'm preparing to explain the code clearly and improve features myself. The examples I'm focusing on are NILA's transaction and budget model, NOVA's shared workspace state, and ATLAS's operations interface. I'm looking for a frontend role where I can contribute and keep developing within a professional team.

Replace “preparing to” with a completed capability only after you can demonstrate it. Do not add years of experience, clients, team leadership, production users, business metrics, a qualification, or deployment history that has not been supplied or verified.

### Honest answers about AI assistance

**“Did you build these yourself?”**

> These are my personal concept projects, developed with substantial AI assistance. I provided the direction, requirements and personalisation; Codex helped implement and iterate the code. I can distinguish the working frontend behaviour from the simulated parts. For this feature, I can show you the relevant handler and explain its data flow.

Use the final sentence only for a feature you have studied. If you cannot explain it yet, say so and move to one you can.

**“What did AI do, and what did you do?”**

> The documented role is project direction and AI-assisted frontend development. I won't claim that I manually authored all the components or personally diagnosed every QA issue. My next step has been to understand the generated implementation and practise changing it independently. A change I personally completed is [a real entry from my learning log], checked by [the actual check].

**“Can you work without AI?”**

> I can demonstrate that through a small exercise. I would start with the requirements, define the state or input types, implement the simplest correct version, and check the edge cases. For anything I don't know, I'd explain the gap rather than guess.

Prepare evidence through the exercises below. Do not promise a level of independence you have not yet tested.

**“Tell me about a difficult bug you fixed.”**

The repository documents QA corrections, but that does not establish that Deboraj personally diagnosed them. Use: “A documented issue in the project was… The current fix works by… I reproduced it by…” after you actually reproduce the behaviour. For a personal debugging story, use a new change or bug that you personally investigate and record.

## Two-minute project pitches

These are talk tracks. Aim for roughly 90–120 seconds while showing the demo: problem → working feature → implementation → tradeoff → verified scope. Avoid reciting every library.

### 1. Debotaro Portfolio

> This is the entry point to my frontend work. The goal is to let a recruiter understand my focus, open a working project, read a case study and find my contact details quickly. The portfolio itself is featured first, with six demos organised into product systems and brand experiences.
>
> It uses HTML, CSS and JavaScript. Category buttons update each project's `hidden` state and `aria-pressed`, and update a result count. Case-study content is fetched once from a JSON file, then displayed in a native dialog. The close handler returns focus to the button that opened it. Dynamic text is escaped before the dialog HTML is built.
>
> For motion, reveal effects are optional and respect reduced-motion preferences. The email-copy action has a fallback message if the Clipboard API fails. The portfolio has documented desktop and mobile Chromium checks for navigation, filters, dialogs, image loading and overflow.
>
> It was developed with AI assistance. It is a frontend showcase with an email link, a real résumé PDF download in the header/contact area, and case-study links to public source code at `Debotaro/Debotaro.github.io`. There is no contact backend. My technical discussion would focus on the JavaScript interactions, responsive CSS and keyboard behaviour.

**Show:** filter to “Brand experiences”; open a case study and its source link; press Escape; show where focus returns; copy email; open `downloads/Deboraj-Sarkar-Resume.pdf`.

**Read:** `index.html`, `assets/portfolio.css`, `assets/portfolio.js`, `data/case-studies.json`, `tests/personal-portfolio.spec.ts`.

### 2. NOVA OS

> NOVA connects projects, tasks, a local assistant and automation in one workspace. It also reads live public GitHub repository metadata and open milestones. A repository becomes a local project, and each selected milestone becomes one local planning task. Task changes feed the task table, project progress and workspace metrics.
>
> It uses Next.js's Pages Router, React and TypeScript. `_app.tsx` wraps the pages in a shared `StoreProvider`. Functional updates preserve current state, and local project progress is derived from tasks. The API boundary validates unknown responses before rendering and constructs canonical source links. Loading, empty, errors, retry, rate limits and a 12-second timeout are handled; cleanup cancels obsolete requests and prevents stale results replacing the current repository.
>
> Command search combines pages, projects and tasks, filters them by a query and navigates to the selected result. The assistant understands a few deterministic commands such as “Create task: Plan the launch”; it changes local task data and appends conversation messages. It does not call an AI service. Automation tests evaluate a sample task, conditions and actions locally.
>
> Imports have persisted source metadata and duplicate guards. Verified repository renames update canonical source links by stable repository ID while preserving local edits. Storage restoration validates records and relationships, with invalid-data recovery and session-only warnings when saving fails. The static app has no real authentication or shared backend. GitHub reads one page of up to 30 milestones; search is page-local, with no app cache or polling. One milestone task does not import its issues, and local completion never changes GitHub. Other integrations and team accounts remain simulations. This was an AI-assisted project.

**Show:** open `/nova-os/app/github/`; load a public repository; import a milestone; open its local project and source link; complete the local task; reload and show duplicate prevention. Explain that the milestone's GitHub progress is separate. Use command search, the deterministic assistant or automation as a second example.

**Read:** `nova-os/pages/_app.tsx`, `nova-os/pages/app/github.tsx`, `nova-os/components/store.tsx`, `nova-os/components/workspace-data.ts`, `nova-os/components/github-api.ts`, `nova-os/components/github-workspace.tsx`, `nova-os/components/workspace.tsx`, `nova-os/components/assistant.ts`, `nova-os/components/ui.tsx`, `nova-os/next.config.js`.

### 3. ATLAS Ops

> ATLAS explores a practical operations workspace: tasks, staffing coverage, notifications and performance charts. A user can create or edit a task, move it between statuses, filter the board and switch to a list. The same task data feeds the overview and notifications.
>
> It is a React and TypeScript app built with Vite. `App` owns persisted operational state and passes callbacks to feature components. Task updates create new arrays. Status changes work through both drag-and-drop and a select control. The local overview derives task and coverage metrics; revenue and costs are generated sample data.
>
> A separate GitHub queue now reads real public repository metadata and open issues. An API module validates unknown responses before the component renders them. The interface handles loading, errors, empty results and retry. Requests are cancelled on cleanup, and a stale-response guard prevents an older repository result replacing the current one. Importing an issue creates a local task with a source link and duplicate prevention.
>
> The hash routes support static hosting. The interface is AI-assisted. Imported tasks remain in browser storage: editing or completing one does not change GitHub. The API reads one page of up to 30 raw entries, excludes pull requests and uses no credentials. Coverage is a fixed sample week, and the financial charts remain fictional. This distinction between live source data and local planning is central to the explanation.

**Show:** load the GitHub queue; search an issue; import it; follow its source link; change its local status; reload and show the disabled duplicate-import button. Use the local task/coverage journey as a second example.

**Read:** `atlas-ops/src/github.ts`, `atlas-ops/src/GitHubQueue.tsx`, `atlas-ops/src/App.tsx` (`importIssue`, `Tasks`, `TaskEditor`, `Overview`, `CoveragePage`), `atlas-ops/src/data.ts`, `tests/atlas-api.spec.ts`.

### 4. NILA Ledger

> NILA is a personal-finance concept where the ledger, budgets, charts and reports share one consistent transaction model. The goal is to make income and spending clear while still supporting useful actions: create, edit, delete, filter, export and print.
>
> It uses React, TypeScript, Vite and Recharts. The root `App` owns transactions, budgets and the demo display name. Amounts are stored as integer pennies: a £12.50 transaction becomes `1250`. Formatting divides by 100 only at the display boundary. Functions in `data.ts` derive income, expense, net savings and category totals from transactions.
>
> The transaction form has controlled fields and validates amount and date before calling the save callback. The transaction view combines month, text, type, category and date filters. Its CSV export receives that same filtered array, so the export corresponds to the visible view. The report uses browser printing with print-specific styles and a text table for savings data.
>
> Persistence validates stored transaction and budget values before restoring them. This is still fictional data stored in the current browser, with no bank connection or authentication. Budgets apply across reporting months, and the PDF action opens the browser print dialog. The project was developed with AI assistance; I would focus my explanation on the model and how a transaction changes the totals.

**Show:** add a £12.50 expense; filter to its merchant; export; reload; edit a category budget; open the monthly report.

**Read:** `nila-ledger/src/data.ts`, `nila-ledger/src/App.tsx`, `nila-ledger/src/components/ui.tsx`, `nila-ledger/src/styles.css`.

### 5. AURA Reserve

> AURA is a hospitality concept combining an editorial visual design with a usable stay enquiry. A user can choose dates and guests, view a residence and see an illustrative total before completing the demo form.
>
> It is a single HTML file with CSS and JavaScript. The core functions are `stayError`, `updateQuote` and `openBooking`. Validation rejects a past arrival, a departure before arrival, stays over 30 nights, sample blocked nights and a guest count that exceeds the Ocean Pavilion's capacity. The larger Garden Residence is selected for a four-person group. Quote calculation uses the number of nights multiplied by the selected nightly rate.
>
> The availability calendar and gallery are ordinary DOM controls. The gallery supports arrow keys inside a native dialog. Optional animation improves the presentation, while the stay enquiry remains usable when the animation CDN is blocked.
>
> This was AI-assisted development. Rates and availability are sample rules: the form creates an on-screen confirmation and does not reserve a room or send an enquiry. I would discuss the validation path, date handling and accessible controls, and propose a real availability API only as a future extension.

**Show:** select four guests and a valid three-night stay; show the Garden quote; navigate the gallery by keyboard.

**Read:** `aura/index.html`, especially `renderCalendar`, `stayError`, `updateQuote`, `openBooking` and `moveImage`; `tests/static.spec.ts`.

### 6. VANTA Atelier

> VANTA is a fashion concept with an editorial catalogue and a complete demo shopping flow. The technical focus is keeping product size, cart quantity and totals consistent as the user filters products, chooses a size and adjusts the bag.
>
> It uses a single HTML file with JavaScript-owned state. The catalogue is a fixed array, and cart items contain product ID, size and quantity. Adding the same product and size increases that row; another size creates another row. On load, saved entries are checked against the catalogue and accepted only with a valid size and an integer quantity from one to ten.
>
> The cart total is derived from catalogue prices and quantities. Re-rendering size and quantity controls replaces DOM nodes, so the code explicitly restores keyboard focus to an equivalent control. A Playwright scenario checks focus after keyboard activation of size and quantity buttons.
>
> The project is AI-assisted, with illustrative products and prices. Demo checkout validates fields and clears the cart but takes no card details, processes no payment and creates no real order. A production version would need server-side pricing, stock and payment handling; those are future requirements, not existing features.

**Show:** select size S; add it; add size M separately; increase quantity by keyboard; reload; complete demo checkout.

**Read:** `vanta/index.html`, especially stored-cart loading, `renderSizes`, `renderCart`, `restoreCartFocus`, `save` and `total`; `tests/static.spec.ts`.

### 7. RASA Experience

> RASA is a travel concept that connects destination discovery to a sample itinerary. Users can choose a destination, explore its day-by-day plan, take a three-question quiz and download a text journey summary.
>
> The core is ordinary HTML, CSS and JavaScript. A destination array supplies descriptions, coordinates, schedules and sample prices. `selectDestination` updates the details, selected buttons and planning form. The quiz stores the current step and answers, then maps the selected pace to a fixed destination; it is deterministic, not AI personalisation.
>
> Three.js is an optional enhancement. It creates a globe with coordinate-based pins, pointer rotation and raycasting. Destination buttons provide a keyboard and WebGL fallback. The resize callback updates both the camera aspect ratio and renderer size to match the container. Globe selection and button selection share the same destination-update function.
>
> The sample-plan form calculates an illustrative price from the destination and traveller count, then creates a real text download with a Blob. It sends nothing to a travel operator. This was AI-assisted development, with documented QA corrections to canvas sizing and pin orientation. I would explain those mechanisms without claiming to have personally discovered those bugs.

**Show:** choose Kyoto by button; open its itinerary; take the quiz; use a recommendation; download the sample plan.

**Read:** `rasa/index.html`, especially `selectDestination`, `renderQuiz`, the plan-form handler, `toVector` and the optional module; `tests/static.spec.ts`.

## Trace the architecture before the interview

### NOVA: live source data and shared local state across Next.js pages

```text
pages/_app.tsx
  └─ StoreProvider (components/store.tsx)
      ├─ state: tasks, projects, messages, nodes, theme, notifications, activity
      ├─ useStore() → Workspace and its views
      ├─ event → functional setState → new state → component render
      ├─ GitHubWorkspace → github-api.ts → public repository/milestones
      │    └─ workspace-data.ts → validated local imports and source reconciliation
      └─ browser effect → validated localStorage and document theme
```

| Source | What to understand |
|---|---|
| `nova-os/pages/_app.tsx:6` | One provider wraps every Pages Router page. A page such as `pages/app/projects.tsx` renders `Workspace` with a view prop. |
| `nova-os/components/store.tsx`, type declarations | `Task`, `Project`, `FlowNode`, `ActivityEntry` and `State` model local data. Optional source records retain stable GitHub IDs, canonical URLs and import timestamps; status/priority unions constrain typed code. |
| Same file, `StoreProvider` | Starts with seed state, restores validated browser data on mount and sets `ready`. Persistence waits for readiness and validates before writing. Invalid data restores the sample; access, write or size failures announce session-only saving. |
| `nova-os/components/workspace-data.ts`, `parseStoredWorkspace` | Validates unknown JSON, text lengths, enums, dates, IDs, canonical source URLs and task/project relationships. Strips unknown fields, enforces supported limits and accepts supported legacy records without activity. It does not turn local storage into authentication. |
| Same file, `importGitHubProject` / `importGitHubMilestone` / `recordActivity` | Pure helpers validate drafts and guard duplicates inside functional updates. Repository import adds a project; milestone import adds one linked task. Caller-supplied IDs/timestamps keep updater replay deterministic. Activity is capped at 100 entries. |
| Same file, `reconcileGitHubRepository` | Matches a verified renamed repository by stable ID, updates linked source names/URLs and preserves local task/project edits. Conflicting canonical identities are not silently reassigned. |
| `nova-os/components/github-api.ts`, `fetchGitHubWorkspace` | Parallel credential-free repository and open-milestone GETs, runtime response validation, constructed URLs, rate-limit errors and a shared 12-second abort timeout. |
| `nova-os/components/github-workspace.tsx`, effects and import handlers | Loading/success/error union, derived empty/search-empty views, refresh revision, cleanup abort plus stale-result guard, page-local search and committed-import announcements. A milestone import creates the repository project if absent. |
| `nova-os/pages/app/github.tsx`; `components/workspace.tsx` | The page selects `Workspace`'s GitHub view; navigation and the GitHub integration card open it. Other integration cards toggle local preview states. |
| `nova-os/components/workspace.tsx`, `NewTask` | The controlled title and `FormData` fields become a typed task, prepended through `setState(s => ...)`. |
| Same file, `TaskTable` and `ProjectCard` | Status changes map by ID. Progress is derived by filtering tasks for a project and counting `Done`. |
| Same file, `Workspace` | Command results combine navigation, projects and tasks. Query-string links select a project and highlight a task. The keyboard listener has effect cleanup. |
| Same file, `Assistant`; `components/assistant.ts`, `applyAssistantRequest` | A 650ms timeout simulates thinking, then a functional updater applies prefix/substring rules to current state. IDs are allocated before the updater so replaying it stays deterministic. Per-request reply metadata drives confirmation after the response commits. No network request occurs. |
| Same file, `Automations` | A sample task is selected; all configured conditions must pass; actions notify, add a follow-up or mark the task done. Reordering changes presentation, but `run` groups nodes by kind rather than executing an arbitrary graph in node order. |
| Same file, `Analytics` / `ActivityChart` | Task/project metrics and export derive from state; historical chart arrays are illustrative. |
| `nova-os/components/ui.tsx`, `Modal` | Shared Radix dialog with title, description, overlay and close control. |
| `nova-os/next.config.js:2` | Static export, trailing slash and environment-controlled base path. This repository uses the Pages Router, not the App Router. |

**Tell the story:** “Load public repository → validate repository/milestone responses → import milestone through a functional updater → guard duplicate source IDs → create or reuse the repository project → add one local task and activity entry → validated persistence → restore after reload.” Completing that task changes local project progress, while the milestone's GitHub issue counters remain remote data. The original local path still applies: submit `NewTask` → prepend to tasks → derive progress → persist. A new Todo task can lower the local completion percentage.

**Tradeoffs you can defend:** Context is easy to understand for a small demo; a single context value also means consumers can re-render for unrelated state changes. Split state/actions or use selectors only if scale and measurement justify it. GitHub provides real public reads; local imports are snapshots rather than two-way synchronisation. The local assistant is predictable and works without an AI API, but recognises a limited command set. Authentication, team collaboration and integrations for other services remain UI simulations.

### NOVA GitHub workspace: precise API and import scope

```text
repository input → fetchGitHubWorkspace(repository, signal)
  ├─ GET /repos/{owner}/{repo}
  └─ GET /repos/{owner}/{repo}/milestones?state=open&sort=due_on&direction=asc&per_page=30
       → validate unknown responses → loading/success/error UI
       → repository import → one local Project
       → milestone import → one local Task in that Project
       → source links + activity → validated browser persistence
```

**Explain these boundaries:** Requests omit credentials and use `cache: 'no-cache'` to revalidate browser HTTP data. There is no application-level cache or automatic polling. At most 30 open milestones are fetched, sorted by due date; search sees only that page. An empty page is not proof about all repository activity. GitHub rate limits and network availability still apply. Milestone cards show GitHub's issue counts, but importing a milestone does not fetch or import those issues. One milestone becomes one local task, with an optional due date and persisted source record. Local completion neither closes the milestone nor changes GitHub issues. Refresh reads source data again; it does not overwrite local planning titles or completion status. Private repositories, account authentication, GitHub writes and shared/cloud persistence are outside scope.

**Trace cancellation and identity:** A route/repository change clears the component's current-result guard and aborts the request; navigation cancellation is ignored, whereas the API timeout becomes a visible error. Successful canonical names come from validated repository metadata. A stable repository ID lets the import helper reconcile a verified rename without duplicating the local project or losing local edits. Disabled import controls help the UI, but the state-level guard is what protects against duplicate updates.

**Read/check:** `tests/nova-github-api.spec.ts` covers the API boundary; `tests/nova-github-workspace.spec.ts` covers the UI/import journey; `tests/nova-data.spec.ts` exercises data/import/storage helpers. Check the latest `VALIDATION.md` before stating which checks passed. The import history retains up to 100 local entries and displays the latest five; it is not a server audit log or team activity feed.

**Completed review correction:** The earlier assistant calculated a task array before the timeout and later assigned that snapshot, so an intervening update could be replaced—even for a summary prompt. Review corrected this by calling the pure `applyAssistantRequest(current, request)` inside the store updater. It reads the current task/name/project/message data, preserves the task-array reference for nonmutating prompts, and does not mutate its input. The timer is cancelled on unmount and when chat is cleared. `tests/nova-assistant-state.spec.ts` checks concurrent additions/status changes, current summaries, a removed completion target, departure cancellation and clearing a pending chat. This correction was performed with AI assistance during review; it does not establish that Deboraj personally diagnosed or implemented it.

### ATLAS: lifted state and callbacks

```text
main.tsx → App
  ├─ data.ts: types, seed, loadState, chartData
  ├─ Tasks → editTask / moveTask callbacks
  ├─ TaskEditor → draft → saveTask
  ├─ CoveragePage → shift callback
  ├─ Notifications → read state and navigation
  ├─ GitHubQueue → github.ts → live public API → importIssue → local task
  └─ Overview → derives charts and exports from selected inputs
```

| Source | What to understand |
|---|---|
| `atlas-ops/src/data.ts`, `State` / `Task` / `Settings` | One state object connects local tasks, notices, settings and coverage. `loadState` checks basic shape/version, then falls back to a clone of seed state. Its checks are less detailed than NILA's record validation. |
| `atlas-ops/src/App.tsx`, `App` | Lazy state initialisation reads storage once; an effect writes after changes. Storage failures produce a session-only status. `hashchange` updates the route. |
| Same file, `saveTask` / `moveTask` | Create prepends; edit maps by ID; status changes map by ID and prepend a notice. A no-op move returns early. |
| Same file, `Tasks` | Combines text, priority and department filters, then sorts. `.filter()` returns a fresh array before `.sort()`, so this sort does not mutate the original tasks array. |
| Same file, `TaskEditor` | A local draft is initialised when the dialog opens. Saving calls the parent callback; editing a draft is separate from committing state. |
| Same file, `CoveragePage` | A shift change maps people, then maps the selected person's shifts. “Leave” and “Off” count as uncovered; “On call” counts as covered in this sample rule. |
| Same file, `Overview` | `useMemo` generates chart rows from days/location. Revenue/cost totals reduce those rows; task and coverage metrics derive from local state. Fixed `+12.8%` and `−4.2%` labels describe the sample presentation, not a calculated live comparison. |
| `atlas-ops/src/components/ui.tsx` | Shared Radix dialog and switch; typed wrapper props for native inputs/selects/buttons. |
| `atlas-ops/vite.config.ts` | Relative asset base and a manual Recharts chunk. Splitting a dependency changes bundling; it does not prove an improvement without measuring actual loading. |

**Tell the story:** “Select Complete on a task card → `moveTask(id, status)` → task array and notices update in one state setter → board column and overview count derive from the new data → storage effect persists it.” Explain why the select is useful for keyboard users and devices where dragging is inconvenient.

**Tradeoffs:** Lifted state is direct for a small app; a long `App.tsx` becomes harder to review as features grow. Hash routing works with a static host because the fragment stays in the browser, but has different URLs from server-aware routing. Coverage is one fixed week, not a scheduling service. IDs based on the last digits of `Date.now()` are convenient but can collide; use an appropriate unique identifier if strengthening the model.

### ATLAS live GitHub queue: async data with a local import boundary

```text
GitHubQueue input → validate owner/repository → request + revision
  → effect creates AbortController and current-request flag
  → fetchGitHubQueue runs two GETs in parallel
      ├─ /repos/{owner}/{repo}
      └─ /repos/{owner}/{repo}/issues?state=open&sort=updated&direction=desc&per_page=30
  → unknown JSON → parseRepository + parseIssues → validated queue
  → loading / success / error render (empty is derived from success)
  → Add to local tasks → App.importIssue → tasks + source metadata + notice
  → localStorage; no write is sent to GitHub
```

| Source | Verified behaviour |
|---|---|
| `atlas-ops/src/github.ts`, `validRepository` | Checks an `owner/repository` string before building API paths; a pasted full GitHub URL is rejected by this input contract. |
| Same file, `readJson` | Sends read-only fetches without credentials and with `cache: 'no-cache'`, checks HTTP success and maps errors to useful messages. It recognises rate-limit status/headers and the secondary-limit response message, and can show a retry time. Do not memorise an external quota as a fixed fact. |
| Same file, `parseRepository` / `parseIssues` | Converts `unknown` into checked domain types. Issues must be open with valid IDs, dates, counts and labels. Entries with a `pull_request` property are excluded. GitHub links are constructed from the validated canonical repository name and issue number rather than trusting arbitrary remote URL fields. |
| Same file, `fetchGitHubQueue` | Runs metadata and issue requests with `Promise.all`, shares a 12-second timeout and cancels the inner controller on cleanup. Distinguishes caller cancellation from timeout, network, schema and HTTP errors. |
| `atlas-ops/src/GitHubQueue.tsx`, `RequestState` / effect / `issuePreview` | A discriminated union has `loading`, `success` and `error`; empty/no-search-match displays are successful results with different content. Cleanup sets `current = false` and aborts, preventing obsolete completion from setting state. Preview text removes comments, code fences and common Markdown markers rather than rendering remote HTML. |
| Same file, `load` | Changes repository and increments a revision so refresh re-requests the same repository. Search filters only the fetched page; it is not a server-wide GitHub search. |
| `atlas-ops/src/App.tsx`, `importIssue` | Creates ID `GH-{global issue ID}`, truncates title/body for the local editor, sets a due date seven days ahead using UTC, and retains canonical source metadata. Both an early check and a functional updater guard prevent importing the same issue twice. |
| `atlas-ops/src/data.ts`, `TaskSource`; `App.tsx`, `TaskEditor` | Source includes issue ID/number, repository, URL and import time. It survives normal local edits and persistence; source links appear on the task and in its editor. Local status is independent of GitHub issue status. |
| `tests/atlas-api.spec.ts` | Mocked GETs check no auth header, rendering, PR exclusion, source URLs, import persistence/duplicates, refresh/search, invalid input, empty results, retry, rate-limit/malformed responses, network failure, timeout and stale requests. An opt-in live smoke check covers actual connectivity/canonical repository names. |

**Important limits to explain:** One raw page has up to 30 entries; after excluding pull requests there may be fewer issues. “No open issues on this page” does not prove the entire repository has no issues. There is no pagination, polling, private-repository authentication, GitHub write, or application-level issue cache. Result state resets on route remount; explicit refresh fetches again with browser HTTP cache revalidation through `cache: 'no-cache'`. Import stores a snapshot, so its title/body do not automatically synchronise when GitHub changes.

**A useful follow-up answer:** “Cancellation saves obsolete work where supported. The current-request flag independently prevents the old promise from changing visible state. A timeout is a failure worth showing; navigation/repository-change cancellation should not become a user-facing error. I would test those separately with controlled responses.”

### NILA: one money model, many views

```text
TransactionForm (temporary string fields)
  → validation → pounds converted to integer pennies
  → App.saveTransaction (append or replace by ID)
  → LedgerState.transactions
      ├─ Dashboard: monthly sums and cumulative balance
      ├─ Transactions: combined filters → table and CSV
      ├─ Budget: expense category totals against budgets
      └─ Reports: monthly totals, history and print table
  → persistence effect → validated loadState after reload
```

| Source | What to understand |
|---|---|
| `nila-ledger/src/data.ts:2`, `Transaction` | Amount is a number in pennies; type identifies income/expense rather than using signed stored amounts. |
| `nila-ledger/src/data.ts`, `sums` / `categoryTotals` / `money` | Derived totals use stored integers; `money` divides by 100 for GBP display. A zero-income savings rate is handled explicitly. |
| Same file, `loadState` | JSON is parsed as unknown, checked for object shape, then validated for safe integer amounts, categories, date shape and positive budgets. Invalid data restores the demo seed. |
| `nila-ledger/src/App.tsx`, `TransactionForm` | Controlled inputs; amount/date/name validation; `Math.round(value * 100)`; existing ID retained on edit, UUID generated on create. |
| Same file, `App` / `saveTransaction` | Persists domain state, owns the month and modal state, chooses append/replace by ID, and selects the transaction's month after save. |
| Same file, `Transactions` | Month → text/type/category/date filter → sort → table, footer totals and `downloadCsv(filtered, ...)`. Dates use zero-padded ISO strings for comparison. |
| Same file, `Dashboard` | Monthly totals differ from available balance: balance uses the opening balance plus net transactions up to the selected month. Cash-flow history uses all six seeded months. |
| Same file, `Budget` | Budgets are category values shared across months. Visual widths cap at 100%, while text can show overspending above 100%. Range input `aria-valuetext` speaks pounds rather than raw pennies. |
| Same file, `Reports`; `src/styles.css`, `@media print` | `window.print()` opens browser printing. The app chrome is hidden, a savings table is shown and the report layout is adapted for paper. |
| `nila-ledger/src/data.ts`, `downloadCsv` | Quotes cells, doubles internal quotes, prefixes certain spreadsheet-formula-leading characters, includes a UTF-8 BOM, creates a Blob URL and later revokes it. |
| `nila-ledger/src/components/ui.tsx`, `Dialog` | Native `showModal`, labelled heading, Escape/cancel handling, backdrop bounds check, and focus restoration on cleanup. |

**Tell the story:** “£12.50 → `1250` → transaction array → expense total increases by 1250 → category budget remaining decreases by 1250 → filtered CSV formats the amount as 12.50.” Existing totals vary with the seed; explain the change rather than memorising one screen value.

**Tradeoffs:** Integer pennies avoid repeated floating-point addition in totals, but parsing still uses `Number` and `Math.round`; that is not a universal decimal-money parser. A stronger version could parse a two-decimal string directly. `new Date(...)` plus a finite timestamp does not reject every rolled-over calendar date; a strict validator should compare the parsed year/month/day with the input. These are future improvements, not claims of already completed fixes. The month list is fixed May–October 2026, and storage is local rather than a secure financial account.

### Portfolio: DOM state, progressive enhancement and static assembly

The gallery filter updates existing DOM nodes rather than rebuilding the gallery. The case-study code stores the opener, awaits one shared fetch promise, escapes values, calls `showModal`, then restores focus on close. `aria-pressed` describes toggle state; the count is an announced status in `index.html`. Focus remains visible through CSS.

`scripts/build.mjs` builds each app, copies its static output into the root `dist/`, copies the HTML experiences/assets/data, and writes `.nojekyll`. NOVA receives a build-time base path; ATLAS and NILA have relative Vite assets. `scripts/serve.mjs` serves that combined output and preserves query strings on trailing-slash redirects. Root `npm run dev` is this static preview, not an app hot-reload server.

**Tradeoffs:** A static portfolio is lightweight and easy to host. JSON content needs a server context for fetch; opening the HTML directly from disk is not the intended complete preview. Optional motion must not hide essential content if scripts or external resources fail. Escaping known text helps the current template, but future arbitrary HTML would require a different safe content strategy.

## Documented QA examples you can learn and reproduce

The source of the correction history is `VALIDATION.md`. Current code and automated scenarios explain the present behaviour. They do not independently reconstruct an old broken implementation or prove who diagnosed it.

| Example | Documented problem and current mechanism | Reproduction to practise |
|---|---|---|
| RASA canvas | QA corrected sizing on narrow viewports. In `rasa/index.html`'s optional module, `ResizeObserver` updates camera aspect/projection and calls `renderer.setSize(container width, container height, false)`. The third argument leaves CSS sizing alone. | Resize between desktop and mobile; compare container/canvas CSS size and drawing-buffer size. Check for overflow. Block the CDN and show the button fallback. |
| RASA pin orientation | QA corrected globe orientation. `toVector` uses a **negative z** term for longitude; the selected target rotation is `-longitude - π/2` in radians. Both conventions must agree with the texture/coordinate system. | Select the three destinations and follow the highlighted pin. Use the actual equations to trace latitude 0/longitude 0 before explaining the full rotation. |
| VANTA keyboard focus | Replacing controls with `innerHTML` removes the focused node. `renderSizes` refocuses the selected size; `restoreCartFocus` finds the corresponding quantity/remove control with fallbacks for a deleted row or disabled button. | Use Tab and Enter to change size and quantity twice. Remove the last item. `tests/static.spec.ts` contains the size/quantity focus regression scenario. |
| NILA mobile export | QA documents export overlap. At narrow widths, `src/styles.css` adjusts table/footer and report action layouts; report actions use full-width flex buttons. | Test transactions and reports at 390px and 320px. Ensure both actions remain visible, tappable and separate from text. Do not infer an old CSS diff that is not recorded. |
| NILA budget value | QA corrected screen-reader value text. `Budget` adds `aria-valuetext={money(budget, true)}` to the range input. | Change a slider with arrow keys; inspect its accessible name and value text. Explain why `75000` pennies should be presented as £750.00. |
| NILA penny model | The stored integer model is a verified engineering choice. `tests/projects.spec.ts` adds a £12.50 transaction and checks its display, export event, persistence and a budget value of 75000. It is not documented as a past floating-point bug fix. | Inspect saved JSON for `1250`; edit to £12.51; verify an increase of exactly one penny in derived totals. |
| Portfolio modal/menu | Close events restore case-study opener focus; Escape closes mobile navigation and focuses the menu button. Resizing to desktop resets the menu. | Run the 320px keyboard journey in `tests/personal-portfolio.spec.ts`; confirm actual clipboard content, not just a success toast. |
| NOVA delayed assistant | Review found that a captured task snapshot could replace intervening updates. The current `applyAssistantRequest` runs inside a functional updater against current state; the assistant cancels its pending timer on departure or chat clear. | `tests/nova-assistant-state.spec.ts` exercises the pure helper in Chromium and uses the virtual browser clock for cancellation. Explain the old snapshot issue and the present fix without inventing personal authorship. |

A truthful debugging explanation after practice can be: “The validation notes identify a focus issue in VANTA. I studied the current implementation and reproduced keyboard updates. The cause is DOM replacement removing the active element. The current code explicitly focuses the equivalent control after rendering. I checked that a second Enter still changes quantity.” Add personal implementation claims only if you personally made and checked a change.

## Likely interview questions and concise answer guides

Each answer is a starting point. Explain it in your own words, point to the source and accept follow-up questions. If you cannot do that, mark the topic for study.

### React, state and TypeScript

**1. What is the difference between props and state in your apps?**

Props pass data/callbacks from a parent. State is owned by a component or provider and changes over time. ATLAS `App` owns operational state and passes `tasks` plus `moveTask` to `Tasks`. `Tasks` owns its board/list choice and filter state. Moving a task updates parent state; switching the view changes only local UI state.

**2. Why use functional state updates?**

When the next state depends on the previous state, `setState(current => ...)` uses the value React provides for that update. NILA maps or appends transactions inside that callback. NOVA's reviewed assistant now applies its operation to the updater's current state after the delay. Its former captured array shows why putting a stale result inside a functional wrapper would not, by itself, prevent replacement.

**3. Why avoid mutating state?**

Create new objects/arrays so updates can be compared and reasoned about. ATLAS changes one task using `map` and copies its object. For nested coverage, copy the outer state, selected person and shifts array. `sort` mutates an array, so use a copied or already filtered array; ATLAS sorts the result of `filter`.

**4. What is derived state, and why not store totals separately?**

Derived values can be calculated from authoritative data. NILA's income/expense/net are computed from transactions; NOVA's project progress is computed from tasks. Storing both a transaction list and editable totals risks inconsistency. Memoise only if computation cost or identity needs justify it.

**5. What does `useEffect` do here?**

It synchronises React with external systems: local storage, document title/theme, browser events and GSAP. ATLAS cleans up its `hashchange` listener; NILA reverts its GSAP context when the page effect cleans up. Computing a simple total for render belongs in render or a pure helper, not an effect that stores another total.

**6. Why does NOVA wait for `ready` before writing storage?**

Its first render uses seed state, including during static rendering. Browser storage is read after mount. Without the readiness guard, the initial persistence effect could write seed data before the stored state is restored. This is also why browser-only APIs should not run unguarded during Next.js server/static rendering.

**7. What is `useMemo`, and is it a correctness guarantee?**

It caches a calculated value for unchanged dependencies. ATLAS uses it for generated chart data based on days/location; NOVA uses it for command-search results. The app must remain correct without it. Do not add it everywhere or claim a measured performance improvement without profiling. NOVA's broad `state` dependency also invalidates search results for unrelated state changes.

**8. Why do list items need stable keys?**

Keys identify siblings across renders. Tasks use task IDs, so a task keeps its identity when reordered or filtered. Index keys can associate state with the wrong item when rows are inserted or deleted. Some append-only messages use indices here; that is less risky than a reorderable editable list but still a design decision to inspect.

**9. What does TypeScript catch, and what does it miss?**

The `Status` union catches unsupported statuses in typed code. A generic field helper such as ATLAS `TaskEditor`'s `<K extends keyof Task>(key: K, value: Task[K])` connects a key to its correct value type. Types disappear at runtime: stored JSON, form strings and API responses still need validation. A type assertion does not validate data. NILA checks stored JSON; NOVA separately validates GitHub responses and saved records, including canonical source identities and task/project relationships.

**10. Controlled or uncontrolled forms?**

NILA's transaction fields are controlled through `value` and `onChange`, so the component draft is explicit. NOVA combines a controlled title with named select fields read through `FormData`. Either can work; explain the actual source rather than saying every form is fully controlled. Draft state prevents incomplete input from immediately becoming a saved transaction.

### JavaScript, browser behaviour and data

**11. Why store pennies?**

Binary floating-point numbers cannot represent every decimal fraction exactly. Integer pennies keep additions/subtractions exact within the safe-integer range, with formatting at the display boundary. NILA bounds input and validates safe integer stored amounts. Its `Number`/`Math.round` conversion is a practical demo implementation; a strict decimal parser is a worthwhile improvement.

**12. How does filtering stay consistent with exports?**

NILA calculates one `filtered` transaction array and uses it for the table, footer totals and CSV. That avoids exporting records hidden by the active filters. Its report export intentionally uses all transactions in the selected month, a different scope from the transaction-view export.

**13. How do you create a download in the browser?**

Create a Blob with the correct content type, call `URL.createObjectURL`, set an anchor's `href` and `download`, activate it and revoke the URL after use. NILA and RASA do this. CSV needs quoting and escaping; NILA also defends against certain formula-leading characters. A downloaded CSV is real; a success notification alone would not prove its content is correct.

**14. What are local storage's limits?**

It stores strings for the current origin and is synchronous. JSON must be parsed and validated; access/writes can fail. NOVA, NILA and ATLAS report session-only saving on failure. NOVA validates supported records, source relationships and size limits, restores the sample after invalid saved data and caps import activity at 100 entries. This is convenient demo persistence, not authentication, a shared database or appropriate storage for secrets. The current apps do not synchronise multiple browser tabs with a storage-event listener.

**15. How do promises and errors appear in this repository?**

Portfolio case-study data is one fetch promise. The code checks `response.ok`, parses JSON and catches failures; a click awaits it and shows a retry message if the item is unavailable. Fetch rejecting and an HTTP error response are different cases. A resolved fetch does not automatically mean a successful HTTP status.

**16. Where could race conditions occur?**

NOVA's reviewed assistant applies commands to current state and cancels a pending timer on departure or chat reset. Both NOVA's repository/milestone workspace and ATLAS's issue queue use an AbortController plus a current-result guard cleared during cleanup, so an old request cannot replace new visible data. Refresh increments a revision even for the same repository. Navigation/repository-change cancellation is ignored by the obsolete component request, while the 12-second API timeout produces a visible error. Import guards also live inside functional updates, rather than relying only on a disabled button.

**17. Are all date strings interchangeable?**

No. A zero-padded `YYYY-MM-DD` date can be compared lexicographically for order, which NILA uses. Display parsing still needs timezone and calendar decisions. ATLAS adds noon UTC and formats in UTC for seeded date labels. AURA calculates nights from local date objects; daylight-saving changes need scrutiny before using that approach for a production booking service. Keep plain calendar dates distinct from timestamps.

### HTML, CSS, accessibility and frontend quality

**18. What makes a dialog accessible?**

A meaningful label/title, keyboard access, sensible initial focus, contained modal interaction, Escape/close handling, visible focus and returning focus to the opener. NOVA/ATLAS use Radix dialogs; NILA and the static experiences use native `dialog`. The portfolio explicitly remembers the case-study opener. Using a library or element is a starting point, not proof of full accessibility conformance.

**19. `aria-pressed` or `aria-expanded`?**

`aria-pressed` represents a toggle button's selected state, as in category filters. `aria-expanded` represents whether a controlled section is open, as in the portfolio menu. Native controls should be preferred when possible. `aria-valuetext` presents NILA's slider value as pounds. Adding ARIA without corresponding behaviour does not fix a broken interaction.

**20. How did you make these responsive?**

Describe the actual layout: CSS grid/flex, changing columns/gutters, wrapping action controls, scroll containers for wide tables, and smaller typography where needed. Test 320px as well as common mobile widths. The portfolio notes checks from 320 to 1440px, while automated projects use desktop and mobile configurations. `overflow-x: hidden` alone can conceal a layout defect; inspect the offending element and whether content remains usable.

**21. How are animations handled for reduced motion?**

Portfolio reveal/tilt code checks the media preference. NILA skips the GSAP page animation when reduced motion is requested. RASA disables eased/scroll-driven globe rotation but still renders selected destinations. Show a real preference check; do not claim that every motion path has been formally audited.

**22. How would you discuss performance?**

Show concrete mechanisms: lazy images below the fold, dependency chunks in Vite, skipped offscreen RASA rendering, capped globe pixel ratio and optional motion. Then state what is unmeasured. There is no recorded Lighthouse/Core Web Vitals benchmark or real-user monitoring in this kit. Static export does not guarantee a fast page, and chunk splitting does not make a chart lazily loaded by itself.

**23. Why Tailwind if there is custom CSS?**

The three app manifests/configurations include Tailwind, and NOVA uses utility classes alongside substantial custom styles. The source also has shared typed UI components and CSS rules for its visual identity. Describe that mixed approach accurately; do not call the entire collection “built entirely in Tailwind.” The single-file experiences use embedded CSS.

**24. What would you test?**

Start with meaningful user outcomes: saving a transaction updates totals, export matches the filtered records, a task status persists, and keyboard focus survives a cart update. The root Playwright suite has desktop/mobile Chromium projects, role/label locators, download checks, runtime-error capture and overflow checks. Add a pure-function check for a complex rule and an end-to-end journey for integration behaviour. Do not claim a full browser matrix or accessibility audit from these checks.

### Workflow, design and practical discussion

**25. What do Git and GitHub add to your workflow?**

Be ready to perform a real small workflow: inspect `git status` and the diff, create a branch in a Git repository, commit a focused change with an accurate message, and explain a pull request's change and validation. Git is version control; GitHub hosts repositories and review workflows. Case studies link to the public source repository `Debotaro/Debotaro.github.io`; verify the current hosting/repository state before describing deployment details. Do not invent teamwork or merge-conflict experience.

**26. How do you translate a Figma design?**

Explain the work you can demonstrate: inspect spacing, type scale, colours, constraints and component states; identify reusable patterns; map them to semantic HTML and responsive rules; compare the implementation at relevant widths. The supplied profile lists Figma, but the repository does not establish that these seven projects originated from a specific Figma file. Do not invent a design handoff or Figma prototype.

**27. What would change for a production backend?**

Separate persisted UI preferences from server-owned records. Define endpoints and runtime schemas, handle loading/error/empty states, authorise writes on the server, and decide how to reconcile updates. AURA needs real availability/rate rules; VANTA needs stock, server pricing and payments; NILA needs a secure account/data model. These are proposals, not existing backend features. Avoid claiming local form validation protects a real transaction service.

**28. What would you improve first?**

Pick one small justified improvement, implement it and measure/check it: stricter NILA currency parsing; case-insensitive exact-match-first task selection in NOVA; detailed ATLAS stored-record validation; splitting the long workspace/App files into feature modules; or an export-content test. NOVA's delayed task-update safety has already been corrected during review. Explain the user-visible failure your own new change prevents. Do not list every fashionable technology as a rewrite plan.

## Practice exercises to complete personally

Use a practice copy or a branch in an existing Git repository. Do not overwrite the working portfolio while experimenting. Start without AI for 20–30 minutes. Then use documentation or AI only for the gap, review the answer and record what assistance was used. The goal is explainable work, not a hidden test of typing speed.

### Exercise A — NILA totals without React (20–25 minutes)

Implement a pure TypeScript function with this contract. Do not copy `sums` first.

```ts
type Entry = { type: 'income' | 'expense'; amount: number };
type Totals = { income: number; expense: number; net: number; savingsRate: number };
function getTotals(entries: Entry[]): Totals {
  // Your implementation. Amounts are integer pennies.
}
```

**Check:** an income of `20000` and expenses `1250`/`750` produce income `20000`, expense `2000`, net `18000`, savings rate `90`. Empty input and expense-only input return a savings rate of `0`; a net loss can produce a negative rate. Explain the time complexity and why the returned object is derived rather than separately persisted. Then compare with `nila-ledger/src/data.ts`, `sums`.

### Exercise B — parse pounds exactly (25–30 minutes)

Implement `parsePounds(text: string): number | null` using string digits instead of multiplying a floating-point number. Support `12`, `12.5`, `12.50`, whitespace around the input and `0.01`. Decide and document whether `.50` is valid. Reject blank input, negatives, `12.345`, scientific notation, nonnumeric text and unsafe integer results. Split whole/fractional parts and pad a one-digit fraction.

**Check:** `12.50 → 1250`, `0.29 → 29`, `1.01 → 101`, invalid input → `null`. Decide whether zero is permitted in the parser versus rejected by the transaction-form rule. Explain why parsing and domain validation are separate concerns. Apply it to a practice NILA form and check display, storage and edit behaviour.

### Exercise C — immutable ATLAS task updates (25–30 minutes)

Implement `updateStatus(tasks: Task[], id: string, status: Status): Task[]`. Keep other tasks unchanged and keep the input array/objects unmodified. Discuss whether a no-op should return the original array or a fresh array.

**Check:** one matching task changes; unknown ID is harmless; previous state remains unchanged; board counts are derived from the result. Add a status select to a small React list and practise updating through `setTasks(previous => updateStatus(previous, id, nextStatus))`. Compare with ATLAS `moveTask`.

### Exercise D — filter plus CSV correctness (30–40 minutes)

Write a pure transaction filter for month, case-insensitive text, type, category and optional ISO date bounds. Use one result array for both a table and an export.

**Check:** combined filters, empty search, exact date boundaries, reversed date range and no results. Export a merchant containing a comma and quotes, such as `Cafe, "North"`, and one beginning with `=SUM(1,2)`. Inspect the downloaded file contents and explain quoting versus spreadsheet formula handling. Compare with NILA `Transactions` and `downloadCsv`.

### Exercise E — disambiguate NOVA completion commands (35–45 minutes)

First read the completed current-state correction in `components/assistant.ts` and its regression tests. Then add a new feature in a practice copy: prefer a case-insensitive exact title match; if several titles match a partial name, ask the user to choose rather than completing the first task silently. Keep the delayed updater pure and preserve current-state reads.

**Check:** an exact title completes only its task; one partial match completes that task; two partial matches complete neither and list clear choices; a deleted task is not recreated; a nonmutating prompt preserves the task array; repeat evaluation with the same request returns the same result. Explain this new change separately from the already completed review correction, and log what you personally implemented.

### Exercise F — keyboard-safe cart update (25–35 minutes)

Create a two-row cart with quantity and remove buttons. Re-render the DOM after an action, then restore focus using a stable product/size identifier rather than assuming an unchanged array index.

**Check:** Enter twice increments twice; removing a middle row puts focus on a sensible surviving control; removing the last item focuses an empty-state action; hitting the maximum chooses a usable fallback. Compare with VANTA `restoreCartFocus`. Explain why rendering can remove the old focused element.

### Exercise G — accessible portfolio interaction (25–35 minutes)

Build three category buttons and four project cards, with `hidden`, `aria-pressed`, visible focus and a polite result count. Add a native case-study dialog and restore focus to its opener after Escape and the close button.

**Check:** the complete interaction works by keyboard, counts match visible cards, repeated filtering remains correct, and a 320px layout has no document overflow. Explain the distinction between a button action and a navigation link. Compare with `assets/portfolio.js` and `tests/personal-portfolio.spec.ts`.

### Exercise H — live API request lifecycle (35–45 minutes)

Trace either NOVA's repository/milestone request (`components/github-workspace.tsx` and `components/github-api.ts`) or ATLAS's repository/issue request (`src/GitHubQueue.tsx` and `src/github.ts`). In a practice component or mock, implement loading/success/error states and derive empty results from success. Optionally add an explicit idle state if your practice UI loads only on submit; the actual workspaces start loading immediately. Cancel the old request when the repository changes; prevent an older response from overwriting a newer one.

**Check:** success, empty data, slow request followed by a faster one, HTTP failure, network failure, cancellation, timeout and retry. Explain which records are server data and which choices are browser-local state. Add a duplicate-import check and explain why a disabled button alone would not replace the state-level guard. Use mocked responses to check the lifecycle reliably; a successful real request alone cannot verify every state. Compare with the matching NOVA GitHub API/workspace tests or `tests/atlas-api.spec.ts`; describe the one-page/no-application-cache limits and the difference between importing one milestone and importing one issue.

## A manageable five-day preparation schedule

Aim for **75–90 focused minutes a day** with a short break. If you need more time, repeat a day; five days is an initial preparation cycle, not a guarantee of job readiness. Start each session by opening the relevant demo. End by speaking without looking at the guide.

| Day | Practice | End-of-day evidence |
|---|---|---|
| **1 — NILA and JavaScript** | 15 min: trace £12.50 through form/state/totals. 25 min: Exercise A. 25 min: Exercise B. 15 min: record the NILA pitch and answer questions 4, 9 and 11. | Explain pennies, derived totals and runtime validation; show your own pure function and checked examples. |
| **2 — NOVA and React** | 20 min: trace provider, milestone import, source metadata and the reviewed assistant updater. 35 min: Exercise E. 20 min: answer questions 2, 5, 6 and 7. 10 min: record the NOVA pitch. | Draw the local/remote data boundary; show your own ambiguity-handling improvement in a practice copy; explain duplicate guards, storage warnings and assistant limits. |
| **3 — ATLAS and API/UI state** | 20 min: trace task status and nested coverage updates. 25 min: Exercise C. 30 min: trace the GitHub queue and attempt the core lifecycle in Exercise H. 10 min: discuss cancellation, local imports and one-page limits. | Demonstrate an immutable update; explain local state separately from server data; distinguish loading, empty and error. |
| **4 — Portfolio and accessibility** | 20 min: trace filter/dialog/menu code. 30 min: Exercise G or F. 20 min: reproduce VANTA focus and RASA fallback behaviour. 15 min: deliver the portfolio pitch and one documented QA explanation. | Complete a keyboard journey and explain focus restoration; accurately describe what the recorded QA proves. |
| **5 — Mock interview and review** | 10 min: introduction and AI-assistance answer. 20 min: one project demo with follow-ups. 25 min: redo one earlier coding exercise from blank. 15 min: inspect your diff and practise a change/validation summary. 15 min: assess readiness below. | One recorded mock interview, one independent exercise, a learning log, and a specific list of remaining gaps. |

Use 30-minute recovery sessions for weak topics instead of cramming: one source trace, one exercise, one explanation. Before an actual interview, choose two main projects and one supporting example, and check that their local demos open.

## Readiness checks

Score each item: **0 = cannot yet explain; 1 = can explain with notes; 2 = can explain, demonstrate and handle a follow-up without notes**. A total is a study aid, not a hiring prediction.

| Capability | Score |
|---|---|
| Give an accurate introduction and disclose AI assistance clearly. | /2 |
| Deliver a two-minute NILA or NOVA pitch with a working demo. | /2 |
| Trace one user action through handler, state, derived data and rendering. | /2 |
| Implement an immutable array update from blank. | /2 |
| Explain props/state, functional setters and effect cleanup. | /2 |
| Explain what TypeScript cannot validate at runtime. | /2 |
| Handle loading, empty, error, cancellation and retry in a small API exercise. | /2 |
| Demonstrate keyboard navigation, focus and reduced-motion behaviour. | /2 |
| Check a mobile layout and explain a concrete responsive rule. | /2 |
| Inspect an export's contents and distinguish print/PDF from file generation. | /2 |
| Explain one documented QA correction without inventing personal history. | /2 |
| Complete one 25-minute coding exercise without AI and explain the result. | /2 |
| Review your own diff and explain a small change plus its validation. | /2 |
| Distinguish local demo data, illustrative charts, simulations and real API data. | /2 |

If any of the last two honesty/scope items are uncertain, resolve them before presenting that feature. If core React/JavaScript items score 0, prioritise the exercises over adding more portfolio features. Apply for roles while learning, but present your current ability accurately and expect an independent coding discussion.

### Ten-minute pre-interview check

- Choose two projects that you can explain well; open their relevant source files.
- Start the combined preview with `npm run preview` from the repository root, with a production build present. Individual development commands are in `README.md`.
- Remember local storage contains earlier demo edits. Use an existing app reset control if you need clean sample state; do not accidentally remove a record you intend to demonstrate.
- Practise one normal action and one failure/empty case, including keyboard use.
- State what you personally practised, what AI assisted with and what remains outside scope.
- Prepare two sensible questions for the interviewer: how junior developers receive code review, and how frontend work is validated against design/accessibility requirements.

## Evidence and limits

`VALIDATION.md` records the current combined checks and their limits. NOVA's GitHub API/workspace and data-helper suites separate remote request contracts from local imports/storage; the assistant regression suite covers current-state updates and cancellation. ATLAS's API suite separately covers issue reads/imports. Deterministic API scenarios mock responses; an unmocked smoke verifies connectivity and rendering rather than every failure mode. Refer to the latest validation report for completed results and final counts. Source inspection and tests do not establish individual authorship or certify accessibility, measured performance, backend security or other browsers.

Useful reading order:

1. `README.md` — run commands, scope and hosting assumptions.
2. `VALIDATION.md` and `CASE_STUDIES.md` — recorded validation and honest project context.
3. `nila-ledger/src/data.ts` → `src/App.tsx` → `src/components/ui.tsx`.
4. `nova-os/pages/_app.tsx` → `components/store.tsx` → `components/workspace-data.ts` → `components/github-api.ts` → `components/github-workspace.tsx` → `pages/app/github.tsx` → `components/workspace.tsx` → `components/assistant.ts`. Follow with the NOVA GitHub API/workspace, data and assistant regression tests.
5. `atlas-ops/src/data.ts` → `src/App.tsx` → `src/GitHubQueue.tsx` → `src/github.ts` → `tests/atlas-api.spec.ts`.
6. `assets/portfolio.js` → `index.html` → `assets/portfolio.css`.
7. `tests/projects.spec.ts`, `tests/static.spec.ts`, `tests/personal-portfolio.spec.ts` and `playwright.config.ts`.

Do not study generated `dist/`, Next.js `out/` chunks or the screenshots as substitutes for source. Keep future process notes connected to real work you can explain.
