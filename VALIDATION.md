# Validation

Verified on 8 October 2026, using Node.js 24 and Chromium through Playwright.

## Build and dependencies

- Root `npm run build` completes successfully and assembles all seven projects in `dist/`.
- RELAY OS: strict TypeScript check and Vite production build pass.
- NOVA OS: TypeScript check and Next.js static export pass; 20 generated routes including the new GitHub workspace and the 404 page.
- ATLAS Ops: TypeScript check and Vite production build pass.
- NILA Ledger: TypeScript check and Vite production build pass.
- The 7 October production dependency audits for all four compiled apps reported zero vulnerabilities. Dependencies and lockfiles are unchanged in the 8 October redesign. Dependency status can change later.
- Every app works from its own subdirectory in the combined static bundle. Hash routes preserve navigation in RELAY, ATLAS and NILA; NOVA has an explicit `/nova-os` build prefix.

## Automated browser checks

The browser suite verifies **158 checks**: 79 deterministic scenarios each in desktop and mobile Chromium contexts. Two optional ATLAS live API checks are skipped in this suite; a separate unmocked ATLAS desktop check previously passed against GitHub. NOVA's live repository/milestone import, completion and reload journey passed again on 8 October at 1440, 390 and 320px widths. The browser contexts use reduced motion and clean per-test storage.

| Area | Verified behaviour |
|---|---|
| Portfolio | Supplied identity/contact URLs, own portfolio featured first, seven local demo links, all preview images, category filters and announced count |
| Personal interactions | Eight case-study dialogs with demo scope and public source links, Escape/close focus restoration, 320px menu keyboard behavior, resize reset, clipboard copy, reduced motion, real PDF download and printable résumé contacts/layout |
| RELAY | Project/task CRUD and cascade deletion, archive/restore guards, cross-tab changes and stale-form errors, normalized keyboard/pointer feedback pins, duplicate-safe comment-to-task conversion, revision history, review-first approval transitions and demo role restrictions |
| RELAY recovery and navigation | Upload type/size guards, command-search results and rapid reopen focus, studio navigation keyboard focus, themes, activity export, malformed/blocked storage, empty workspaces and 320px layout |
| NOVA | Task creation, command search, assistant task creation, automation execution and persisted task data; current-state delayed commands, summary immutability, cancellation on departure/clear chat and recovery |
| NOVA live API and imports | Parallel credential-free reads, runtime response validation, canonical links, loading/empty/search/error/retry, rate limits, shared timeout, obsolete request cancellation, duplicate-safe imports, source attribution, reload, independent local completion, verified repository renames and atomic rejected-import recovery |
| NOVA storage and empty state | Legacy data compatibility, strict type/relationship/size limits, malformed-data recovery, session-only storage warnings, capped immutable activity, and empty-workspace metrics/task/automation guards |
| ATLAS | Task creation, status changes, editing, search and persistence after reload |
| Redesigned product workflows | NOVA focus selection/completion across agenda and project views, saved theme and long-profile layout; ATLAS scoped chart filters, target persistence, seven-point CSV export, intervention editing and coverage navigation; RELAY project-cover selection, image upload and revision approval after reload |
| ATLAS live API | Validated repository/issues, pull-request exclusion, search, refresh, loading/empty/error/retry, network failure, malformed responses, primary/secondary rate limits, timeout, obsolete response cancellation and duplicate-safe persisted imports with source attribution |
| NILA | Transaction creation, penny-based amounts, filters, CSV download, persistence and budget editing |
| AURA | Stay dates, capacity-aware residence selection, quote total, form completion and keyboard gallery navigation |
| VANTA | Product filters, size selection, cart persistence, quantities, totals, demo checkout and keyboard focus preservation |
| RASA | Destination selection, itinerary details, quiz recommendation, sample plan creation and itinerary download |
| Fallbacks | Resort and travel core controls work when the optional animation/Three.js CDN is blocked |
| Rendering | Main screens have no JavaScript page errors or document overflow at tested sizes |

Additional project-level Chromium checks cover NOVA task completion, flow edits, themes, simulated integrations and analytics exports; ATLAS drag/drop, chart targets/ranges, coverage, notification actions, settings and reset; and NILA transaction edit/delete, mobile export and printable report layout.

The API checks use controlled responses so CI does not depend on GitHub availability or shared runner rate limits. The optional ATLAS live smoke can be run with `ATLAS_LIVE_SMOKE=1` (set it as a PowerShell environment variable on Windows). ATLAS revalidates each fetch rather than maintaining an application cache, reads one page of up to 30 raw issue entries and excludes pull requests. NOVA reads one page of up to 30 open milestones; search is page-local, with no application cache or polling. A milestone becomes one local task, without importing its associated issues or pull requests. Both features read public data without writing GitHub. GitHub rate limits still apply.

The NOVA regression helper is the production pure updater exercised with intervening task/message changes and frozen inputs. Browser clock checks additionally verify real UI cancellation and a fresh command after clearing chat. A delayed command now consumes React's current state instead of replacing tasks from the send-time snapshot.

## RELAY domain and database checks

`npm run test:unit` passes **25 checks**: 13 domain tests and 12 embedded PostgreSQL tests using PGlite 0.5.8. These execute the actual migration with explicit test-only authentication and storage schema stubs. They exercise workspace isolation, role and column permissions, archived-project guards, server-owned timestamps, approval transitions, atomic comment conversion, revision relationships and storage cleanup permissions after cascade deletion.

The configured Supabase adapter implements authentication, database writes, private uploads, signed previews and realtime subscriptions. No hosted Supabase project was configured for this release. Auth/JWT verification, email delivery, private file transfer, signed-URL HTTP requests and WebSocket delivery have not been tested against that service. The supplied pgTAP checks are separate from the executed embedded tests. See [the setup guide](relay-os/supabase/README.md) before enabling shared cloud use.

## Résumé and publishing

The one-page résumé PDF was rendered and visually inspected. Text extraction confirmed the supplied identity, contact details and project content; its eight URI annotations use the intended profile, portfolio, email and demo destinations. The editable HTML version passed desktop/mobile contact and overflow checks. Education, employment and certifications remain omitted until confirmed by Deboraj.

The résumé, printable HTML, editable sources, case study and interview guide now describe NOVA's live GitHub feature and retain the distinction between public reads, browser-local planning and simulated authentication.

The public repository is [Debotaro/Debotaro.github.io](https://github.com/Debotaro/Debotaro.github.io), with [debotaro.github.io](https://debotaro.github.io/) as the domain-root Pages destination. The committed workflow installs locked dependencies, builds all seven demos, runs RELAY's 25 domain/database checks and the browser suite, and deploys `dist/` only after validation succeeds. Live deployment status is available in the repository's Actions tab.

## Visual review and corrections

Actual screenshots of all seven projects were captured at 1440×1000 and 390×844. The gallery thumbnails use those screenshots. NOVA, ATLAS, RELAY and the portfolio previews were refreshed on 8 October after the three product redesigns. Desktop and mobile layouts were inspected, including hero imagery and application charts.

The three interfaces now use different hierarchies: NOVA's daily agenda, selected focus task and project notebooks; ATLAS's telemetry, signals, intervention queue and coverage matrix; and RELAY's artwork, feedback brief, project covers and review canvas. Existing shared task state, source attribution, local persistence and review rules remain covered by the regression suite. QA darkened low-contrast metadata and primary controls, checked both NOVA and RELAY themes, and corrected supported long NOVA profile/workspace names at 320px and 390px. The new NOVA regression includes those saved-name bounds.

A separate route audit passed **87 layout checks**: NOVA's 15 marketing/auth/workspace routes, ATLAS's eight routes and RELAY's six routes at 320, 768 and 1440px. Each fresh document returned HTTP 200 with no page errors or document overflow; workspace routes exposed their main content. Public GitHub responses were controlled for this layout audit. It is separate from the unmocked NOVA API journey and does not establish live backend availability.

RELAY's overview and design review were captured at both sizes (`previews/relay.png`, `previews/relay-mobile.png`, `previews/relay-review.png` and `previews/relay-review-mobile.png`). Review images preserve their original aspect ratio and pins use normalized coordinates. QA corrected rapid command-palette and cross-dialog focus restoration, stale-form error announcements inside modal dialogs, closed mobile navigation visibility and review-first approval rules. The final focus regression passed 80 immediate task-save-to-search transitions and 80 rapid palette navigation cycles across desktop and mobile contexts.

NOVA's updated navigation and live GitHub screen were captured and inspected at both sizes (`previews/nova-github.png` and `previews/nova-github-mobile.png`). The unmocked journey reported no page errors or document overflow at 1440, 390 or 320px. The production bundle passed after the final copy and scope changes.

Corrections made during QA include editorial-section gutters, the RASA canvas resizing on narrow viewports, globe pin orientation, cart keyboard focus after re-render, the NILA mobile export overlap, screen-reader budget value text and trailing-slash redirects preserving query strings.

The personal portfolio was redesigned with the supplied professional content and generated D/T monogram. Its final desktop/mobile screenshots are `previews/portfolio.png` and `previews/portfolio-mobile.png`; the featured preview uses `previews/portfolio-cover.png`. Additional checks found no document overflow at 320, 390, 640, 768, 1024 and 1440px, verified the actual clipboard value, and confirmed contact reveal with normal motion. QA corrected image height distortion and reduced the decorative orbits on the narrowest layout. The logo was inspected on the real dark interface at hero and navigation sizes.

## Practical limits

This is frontend validation of demonstration projects. It is not a formal accessibility conformance audit, browser compatibility certification, Lighthouse benchmark, backend security audit or test of live payments/authentication/bookings. Firefox, Safari and real devices were not tested. External fonts, photographs and CDNs may vary in availability. The essential static controls have fallback behaviour, and no success state claims to complete a real-world service action.

Reproduce the checks with the commands in [README.md](README.md). Playwright's latest detailed report is generated in `playwright-report/` and failure traces, if any, in `test-results/`.
