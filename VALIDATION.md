# Validation — 9 October 2026

This record describes the personal portfolio and seven interactive concepts. The
quality pass started from source revision `df12cbe254cbdfb40b35adffd9c8822d76d468bb`.
Project behaviour and test evidence do not imply independent manual authorship by
Deboraj, commercial users or production backend availability.

## Build and source checks

- Node.js 24; locked application dependencies; all four TypeScript checks and
  production builds pass. NOVA exports 20 routes, including its 404 page.
- The combined static build assembles all seven projects with their intended
  subdirectory paths. Rebuilds clear only the checked workspace `dist` directory,
  preventing stale hashed chunks from accumulating.
- ESLint checks maintained JavaScript/TypeScript modules; Prettier checks source
  formatting. Embedded scripts in single-file HTML demos are formatted and
  browser-tested rather than processed by ESLint's module rules.
- Static production minification keeps the four editable entry documents readable
  in source while compacting their delivery. Three contract checks cover inline
  text spacing, accessibility attributes, dynamic CSS and script execution.
- On 9 October, the root dependency audit and production audits for RELAY, NOVA,
  ATLAS and NILA reported zero known vulnerabilities. This is a dated dependency
  result, not a security certification. Root Lighthouse 13.5.0 is used for future
  audits; the matched historical performance comparison used isolated 12.8.2.

## Browser results

The complete local browser run passed **398 checks**, with **six intentional
skips**, zero failures and zero flaky results in 4.7 minutes on 9 October. It
covered desktop/mobile Chromium and desktop/mobile WebKit. After static output
minification, the affected portfolio, brand experiences, accessibility and
delivery tests passed **122 checks** with two intentional clipboard skips in
1.9 minutes across the same four contexts. The release workflow additionally
runs Firefox on Linux and retests the complete final build. The configured matrix
uses reduced motion and fresh per-test browser storage:

| Project         | Engine   | Viewport            |
| --------------- | -------- | ------------------- |
| `desktop`       | Chromium | 1440 × 1000         |
| `mobile`        | Chromium | iPhone 13 emulation |
| `firefox`       | Firefox  | 1440 × 1000         |
| `webkit`        | WebKit   | 1440 × 1000         |
| `mobile-webkit` | WebKit   | iPhone 13 emulation |

The Windows Firefox installation cannot launch because its runtime reports a
missing `mozglue` assembly. Firefox verification belongs to the Linux
GitHub runner rather than a claimed local Windows pass. WebKit emulation is
separate from Safari on a physical iPhone.

Two intentional test categories are documented: ATLAS's unmocked live API smoke
is opt-in, and real clipboard permission grants run only in Chromium. Clipboard
interaction and denied-permission recovery are tested in every engine. API
regressions otherwise use controlled responses to avoid relying on shared GitHub
rate limits or availability.

WebKit on this Windows setup skips anchors during ordinary Tab traversal. Its
skip-link test explicitly focuses the link before keyboard activation; Chromium
and Firefox retain the first-Tab assertion. Subsequent dialog checks exercise
Enter, Tab, Escape and focus return. This distinction is recorded in the test and
the [accessibility review](reports/ACCESSIBILITY.md).

## Behaviour covered

| Area        | Regression scope                                                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portfolio   | Confirmed identity/background, seven demo links, eight case studies, filters, menu, keyboard dialogs, clipboard success/failure, PDF download and responsive layout                                                    |
| NOVA        | Shared tasks/projects, focus completion, deterministic assistant timing/cancellation, automations, themes, validated storage, empty states and normal-motion hero visibility                                           |
| NOVA GitHub | Public repositories/milestones, loading/search/error/retry, timeout/rate limits, cancellation, duplicate-safe imports, canonical renames, provenance and reload                                                        |
| ATLAS       | Task CRUD/status/search, charts/targets/CSV, coverage, GitHub issue recovery/imports, deferred chart loading, malformed storage, editor bounds and reload                                                              |
| RELAY       | Linked project/task editing, archival/cascade guards, versioned assets, pinned feedback, duplicate-safe conversion, review-first approvals, demo roles, stale/cross-tab edits, persistence failures and keyboard focus |
| NILA        | Penny-based transaction amounts, editing/deletion, filters, budgets, CSV downloads, print layout and focusable transaction table                                                                                       |
| AURA        | Dates, capacity, sample quote, enquiry validation and keyboard gallery                                                                                                                                                 |
| VANTA       | Filters, sizes, validated cart persistence, quantities/totals, keyboard focus and demo checkout                                                                                                                        |
| RASA        | Destination selection, quiz, itinerary/download, deferred optional globe and usable controls during CDN failure                                                                                                        |

Earlier unmocked GitHub checks are separate from deterministic regression tests.
NOVA's import/completion/reload journey was verified on 8 October at 1440, 390 and
320px widths. ATLAS's public-read smoke was also previously verified. Public API
conditions can change; neither app writes GitHub. Both read one page of up to 30
raw records in their respective queues, with page-local search; ATLAS excludes
pull requests. There is no shared cloud planning state.

## Domain, database and storage boundaries

`npm run test:unit` passes **38 checks**: RELAY's 13 domain checks and 12 embedded
PostgreSQL checks, plus ATLAS's 13 storage checks.

RELAY executes the actual migration in PGlite with explicit test-only Auth and
Storage schema stubs. It checks workspace isolation, role/column permissions,
archival, timestamps, approval transitions, atomic feedback conversion, revision
relationships and cleanup permissions. No hosted Supabase project is configured.
JWT verification, email delivery, private file transfer, signed-URL requests and
WebSocket delivery have not been verified against a hosted service. See the
[backend setup guide](relay-os/supabase/README.md).

ATLAS validates nested records, dates, enums, settings, unique IDs and canonical
GitHub provenance before restoration. It rejects an invalid snapshot atomically
and preserves its raw value until an intentional edit/reset. Before saving, it
validates the new snapshot; invalid or oversized edits leave the last stored
snapshot intact and reach the existing save-error boundary. Limits are 2,000
tasks, 5,000 notices, 100 coverage people and 2,000,000 serialized characters. These
are explicit bounds for a browser-local demonstration, not backend-scale claims.
The task editor uses the same date parser for years 0001–9999 and clears its
custom validity when the value is corrected. This covers WebKit accepting an
out-of-range year despite the native `max` attribute, with a regression checking
that an invalid date cannot replace the saved task.

## Accessibility and performance evidence

The [accessibility review](reports/ACCESSIBILITY.md) records **46 before and 46
after axe scans** of 23 desktop/mobile states. Reported node occurrences declined
from **127 to zero**, with zero after scan errors. The baseline had 31 rule
occurrences; those totals include repeated components across states. All **16
keyboard reviews** pass. Uncertain axe results remain in the raw reports.

Corrections include contrast, heading order, semantic priority labels, table
scroll focus, skip targets and dialog focus return. The expanded WebKit review
also exposed a reduced-motion theme-rendering issue in NOVA and pointer-opener
focus restoration in RELAY; both have regression coverage.

The [performance comparison](reports/performance/README.md) measures eight entry
pages with three cold mobile lab navigations per phase. It records medians,
ranges, exact versions, network diagnostics and build fingerprints. The local
server is uncompressed; third-party responses use the real network. Lighthouse
scores and Total Blocking Time are not field INP or field Core Web Vitals.

## Résumé, publishing and practical limits

The reviewed one-page A4 résumé remains available as a vector PDF with embedded
fonts, selectable text and clickable contacts. It includes confirmed education,
paid graphic design employment, selected Coursera credentials, the supplied phone
and one-week availability. The current quality pass adds no invented job history,
independent coding proficiency or personal test authorship.

The [GitHub workflow](.github/workflows/pages.yml) installs locked dependencies,
checks source quality, builds the site, executes boundary and browser tests, and
deploys only after validation succeeds. [Actions](https://github.com/Debotaro/Debotaro.github.io/actions/workflows/pages.yml)
is the authoritative release status. The published destination is
[debotaro.github.io](https://debotaro.github.io/).

These are frontend concept demonstrations using sample business data. Public
GitHub reads are real; accounts, payments, bookings and most integrations remain
explicit simulations. RELAY's optional backend requires separate configuration.
No full WCAG conformance, backend security certification, real payments/bookings,
physical-phone compatibility or real screen-reader session is claimed. The
[human review checklist](reports/REAL_DEVICE_CHECKLIST.md) remains unchecked for
those unperformed activities.

Reproduce checks using [README.md](README.md). Browser reports are generated in
`playwright-report/`; failure traces and private application drafts are ignored by
Git. [Quality interview practice](career/QUALITY_INTERVIEW_PRACTICE.md) connects the
verified changes with explanations and exercises rather than invented experience.
