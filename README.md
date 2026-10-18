# Deboraj Sarkar (Debotaro) — Portfolio

[![Build and deployment](https://github.com/Debotaro/Debotaro.github.io/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/Debotaro/Debotaro.github.io/actions/workflows/pages.yml)

**[View live portfolio](https://debotaro.github.io/)** · **[Download résumé](https://debotaro.github.io/downloads/Deboraj-Sarkar-Resume.pdf)** · **[Read case studies](CASE_STUDIES.md)** · **[Review validation](VALIDATION.md)**

[![Deboraj Sarkar's portfolio: Ideas into interfaces, with the Debotaro D/T identity](previews/portfolio-cover.png)](https://debotaro.github.io/)

A personal portfolio for **Deboraj Sarkar**, also known as **Debotaro**, targeting **AI Software & Automation Developer** opportunities: Python APIs, retrieval and reliable workflows, with a design foundation. He is a Computer Science student based in **Kokrajhar, Assam, India**, pursuing a bachelor's degree at the **University of the People** (June 2025–present). His owner-reported paid experience is **Graphic Designer at Wecanstore.com** (June 2022–July 2023), creating digital banners, social media graphics and marketing materials.

Engineering case studies lead the portfolio, followed by Studio, the portfolio design and **ten independent, working interface concepts**. The established D/T identity, demo routes and eleven legacy case dialogs remain intact. For the earlier interface collection, Deboraj's owner-reported contribution is **visual direction, review and iteration; AI-assisted implementation**. The new EvidenceDesk and FlowLedger projects were developed with Codex assistance under the portfolio mission; their repositories document implementation, executable checks and limits. Debotaro CHSL, Debotaro Rail and Debotaro Assam also include AI-assisted content preparation. Technical descriptions and validation describe project behaviour rather than independent coding, test authorship or prior AI engineering employment.

Seeking **junior and associate software, applied AI and automation roles**, including remote opportunities. Contact: [mail.deborajsarkar@gmail.com](mailto:mail.deborajsarkar@gmail.com). Profiles: [GitHub](https://github.com/Debotaro), [LinkedIn](https://www.linkedin.com/in/deborajsarkar/) and [Dribbble](https://dribbble.com/Debotaro).

## Engineering work — public source and local setup

- [EvidenceDesk case study](engineering/evidence-desk.html): Python/FastAPI, SQLite, real local MiniLM inference, a BM25 baseline, versioned knowledge, source citations, abstention and reproducible synthetic retrieval evaluation. On 16 October, hybrid holdout Recall@3 was 14/18 (77.78%) vs BM25 11/18 (61.11%); 8/8 unsupported/adversarial cases were refused, with 100% citation snapshot traceability. Forty-six backend tests and Ruff passed locally. See the [executed report](engineering/reports/evidence-desk-evaluation.json). The small author-created set is not an independent benchmark, and extractive responses are not evaluated LLM generation. Public source and local setup are available; the backend service is not publicly hosted.
- [FlowLedger case study](engineering/flow-ledger.html): a complete bounded Python/FastAPI workflow service with typed events, approval decisions, a transactional outbox, fenced worker leases, retries and dead-letter replay. Twenty backend tests and Ruff passed; [9/9 executed local SQLite experiments](engineering/reports/flow-ledger-verification.json) include 12 duplicate submissions creating one job, eight workers processing 16 jobs with zero duplicate local cases, and real subprocess exits after effect commit before acknowledgement on first/final attempts. Those crash checks use an explicit one-second lease override; retry/lease boundary checks use injected UTC. No external effects, production scale or general exactly-once guarantee is claimed. Public source and local setup are available; the backend service is not publicly hosted.

Complete source and reproducible setup: [EvidenceDesk](https://github.com/Debotaro/evidence-desk) · [FlowLedger](https://github.com/Debotaro/flow-ledger). Hosted verification and Docker image builds have passed for both projects. These static case studies are separate from the existing eleven frontend case dialogs and do not host the Python services. The [current profile/portfolio verification](reports/PROFILE_UPDATE_VERIFICATION.md) records the focused browser results, responsive checks, actual captures and Firefox host limitation.

## Flagship product — Debotaro Studio

[Open live Studio](https://debotaro-studio.debotaro-studio.workers.dev) · [Read the Studio case study](https://github.com/Debotaro/debotaro-studio/blob/main/docs/CASE_STUDY.md) · [View Studio source and local setup](https://github.com/Debotaro/debotaro-studio)

The portfolio's [Studio spotlight](https://debotaro.github.io/#studio) has a direct entry link that keeps its heading below the sticky navigation.

The portfolio now includes an additional Studio spotlight, while retaining the portfolio feature, all ten existing demos and their case studies. Debotaro Studio is an original visual application builder for fictional customer-support workspaces, with a documented supported React/TypeScript subset, collaboration, reviewed changes and independent React export. Deboraj's contribution is product direction, visual direction and review; implementation is AI-assisted.

The spotlight uses an actual running-product capture in `previews/studio-editor.png`. Its links open the publicly verified full Studio application, source and documented case study. The backend uses Cloudflare Workers Free, native WebSockets and a persistent SQLite Durable Object; GitHub Pages hosts this portfolio entry. Public core acceptance passed 23 actual browser cases, eight HTTP/WSS groups and a clean independent build/browser run of the public export. Bounded free Workers AI proposals require explicit review; current source, model and deployment evidence are recorded in the Studio repository. No card, paid provider or billing setup is required.

## Explore the ten demos

Project names open their source folders. Demo links open the published applications.

| Project source              | Live demo                                                          | Stack                                                 | Main interactions                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [RELAY OS](relay-os/)       | [Open creative workspace](https://debotaro.github.io/relay-os/)    | React, TypeScript, Vite; optional Supabase adapter    | Project/task planning, versioned design assets, image-pin feedback, comment-to-task conversion, approvals, activity, analytics, role previews, command search       |
| [NOVA OS](nova-os/)         | [Open workspace](https://debotaro.github.io/nova-os/app/)          | Next.js, TypeScript, Tailwind, Radix, GSAP            | Editable projects/tasks, live GitHub repository/milestone reads and local imports, assistant actions, command search, automation flows, analytics, persistent theme |
| [ATLAS Ops](atlas-ops/)     | [Open operations](https://debotaro.github.io/atlas-ops/#/overview) | React, TypeScript, Vite, Tailwind, Radix, Recharts    | Task CRUD and Kanban, live GitHub issue queue, safe local issue imports, chart filters/targets, coverage scheduling, notifications, CSV export                      |
| [NILA Ledger](nila-ledger/) | [Open ledger](https://debotaro.github.io/nila-ledger/#/dashboard)  | React, TypeScript, Vite, Tailwind, Recharts, GSAP     | Transaction CRUD and filters, accurate penny-based totals, adjustable budgets, CSV exports, printable reports                                                       |
| [AURA Reserve](aura/)       | [Explore AURA](https://debotaro.github.io/aura/)                   | One HTML file with embedded CSS/JS, optional GSAP     | Property gallery, availability calendar, stay dates, validated enquiry, sample price calculation                                                                    |
| [VANTA Atelier](vanta/)     | [Explore VANTA](https://debotaro.github.io/vanta/)                 | One HTML file with embedded CSS/JS                    | Collection filters, lookbook, product sizes, persistent cart, quantities, demo checkout                                                                             |
| [RASA Experience](rasa/)    | [Explore RASA](https://debotaro.github.io/rasa/)                   | One HTML file with embedded CSS/JS, optional Three.js | Destination globe, itineraries, travel quiz, journey enquiry, downloadable sample plan                                                                              |
| [Debotaro CHSL](ssc-chsl/)  | [Open study app](https://debotaro.github.io/ssc-chsl/)             | Self-contained HTML, CSS, JavaScript                  | Topic/stage practice, explanations, diagrams, bookmarks, local progress, timed Tier I/Tier II practice, English typing and data-entry drills                        |
| [Debotaro Rail](rrb-ntpc/)  | [Open railway practice app](https://debotaro.github.io/rrb-ntpc/)  | Self-contained HTML, CSS, JavaScript                  | 4,000 original practice MCQs, six learning stages, CBT 1/CBT 2 practice, answer review, typing skill practice and browser-local progress                            |
| [Debotaro Assam](adre-hs/)  | [Open ADRE practice app](https://debotaro.github.io/adre-hs/)      | Self-contained HTML, CSS, JavaScript                  | 4,000 original practice MCQs, six learning stages, timed papers, answer review, Office concept practice and browser-local progress                                  |

**Debotaro CHSL:** [Open the learning app](https://debotaro.github.io/ssc-chsl/) or [download its complete offline HTML](https://debotaro.github.io/ssc-chsl/Debotaro-CHSL-Offline.html). It contains 4,000 original practice MCQs across five subjects and 111 topics, organised into six pedagogical stages. Open the downloaded file in a browser; fonts, diagrams and the question bank are embedded. Progress is saved locally when browser storage is available. The material is AI-assisted practice content, not official SSC questions or an SSC-endorsed product.

**Debotaro Rail:** [Open the RRB NTPC Undergraduate practice app](https://debotaro.github.io/rrb-ntpc/) or [download its complete offline HTML](https://debotaro.github.io/rrb-ntpc/Debotaro-Rail-Offline.html). The provided tool combines 4,000 original practice MCQs, six learning stages, CBT 1/CBT 2 exercises and typing skill practice. Its existing Debotaro logo, name and creator credit are retained. Open the downloaded file in a browser for offline use. The material is AI-assisted practice content, not official RRB questions or an RRB-endorsed product.

**New project — Debotaro Assam:** [Open the ADRE Grade III HS practice app](https://debotaro.github.io/adre-hs/) or [download its complete offline HTML](https://debotaro.github.io/adre-hs/Debotaro-Assam-Offline.html). The supplied tool combines 4,000 original practice MCQs, six learning stages, timed papers and Office concept practice. Its existing Debotaro logo, name and creator credit are retained. Open the downloaded file in a browser for offline use. The material is AI-assisted practice content, not official ADRE questions or an ADRE-endorsed product.

**Creative capstone:** [Explore RELAY OS](https://debotaro.github.io/relay-os/) for a complete design-feedback-to-delivery journey. The public demo runs locally in your browser; optional Supabase setup is documented separately.

**New in NOVA:** [Explore the live GitHub workspace](https://debotaro.github.io/nova-os/app/github/) and turn public repository milestones into local planning tasks.

NOVA, ATLAS and RELAY use different information hierarchies as well as different visual identities. NOVA is a paper-and-lavender daily planning canvas with an agenda and task focus. ATLAS is a technical operations console with a monitoring rail, financial signals and priority interventions. RELAY is a warm creative review studio led by artwork, project covers, revisions and feedback. Their existing state, imports and review workflows remain connected to the redesigned views.

<details>
<summary>View screenshots of all ten demos</summary>

### RELAY OS — creative project handoffs

[![RELAY OS creative workspace with delivery overview and design review](previews/relay.png)](https://debotaro.github.io/relay-os/)

[![RELAY design review with image feedback pins and revision decisions](previews/relay-review.png)](https://debotaro.github.io/relay-os/#/review)

### NOVA OS — connected project workspace

[![NOVA OS workspace with projects, tasks and navigation](previews/nova.png)](https://debotaro.github.io/nova-os/app/)

[![NOVA's live GitHub workspace with repository metadata and milestone imports](previews/nova-github.png)](https://debotaro.github.io/nova-os/app/github/)

### ATLAS Ops — operational planning

[![ATLAS Ops overview with financial charts, task progress and priorities](previews/atlas.png)](https://debotaro.github.io/atlas-ops/#/overview)

### NILA Ledger — personal finance

[![NILA Ledger dashboard with balances, spending and recent transactions](previews/nila.png)](https://debotaro.github.io/nila-ledger/#/dashboard)

### AURA Reserve — hospitality experience

[![AURA Reserve resort landing page with stay enquiry controls](previews/aura.png)](https://debotaro.github.io/aura/)

### VANTA Atelier — editorial storefront

[![VANTA Atelier fashion storefront and collection presentation](previews/vanta.png)](https://debotaro.github.io/vanta/)

### RASA Experience — travel discovery

[![RASA Experience travel landing page with destination discovery](previews/rasa.png)](https://debotaro.github.io/rasa/)

### Debotaro CHSL — offline learning & exam practice

[![Debotaro CHSL learning dashboard with subject practice and exam preparation](previews/ssc-chsl.png)](https://debotaro.github.io/ssc-chsl/)

### Debotaro Rail — RRB NTPC Undergraduate offline practice

[![Debotaro Rail offline learning dashboard for railway exam practice](previews/rrb-ntpc.png)](https://debotaro.github.io/rrb-ntpc/)

### Debotaro Assam — ADRE Grade III HS offline practice

[![Debotaro Assam offline learning dashboard for ADRE practice](previews/adre-hs.png)](https://debotaro.github.io/adre-hs/)

</details>

## Open the complete portfolio

Requirements: Node.js 24 and npm, matching the verified local and CI environment.

In PowerShell:

```powershell
Set-Location 'X:\Six Portfolio Projects\portfolio-website'
npm ci
npm run setup
npm run build
npm run preview
```

Open **http://localhost:4173**. The dependencies and builds are already present in this workspace, so you can simply run `npm run preview` here. The preview binds to the local computer only.

`npm run build` builds all four compiled apps and assembles a complete static bundle in `dist/`. It gives NOVA the `/nova-os` base path and retains relative assets in RELAY, ATLAS and NILA. `npm run dev` serves the same combined preview; it does not run app hot reload. Use the individual commands below while developing an app.

## Develop individual projects

The four compiled apps are independently installable and have their own package manifests and lockfiles.

```powershell
# RELAY OS — Vite prints its selected port
Set-Location 'X:\Six Portfolio Projects\portfolio-website\relay-os'
npm ci
npm run dev

# NOVA OS — http://localhost:3101
Set-Location 'X:\Six Portfolio Projects\portfolio-website\nova-os'
npm ci
npm run dev

# ATLAS Ops — http://localhost:5174
Set-Location 'X:\Six Portfolio Projects\portfolio-website\atlas-ops'
npm ci
npm run dev

# NILA Ledger — Vite prints its selected port
Set-Location 'X:\Six Portfolio Projects\portfolio-website\nila-ledger'
npm ci
npm run dev
```

For standalone NOVA builds, remove `PORTFOLIO_BASE_PATH` from the environment before running `npm run build`. Its default output is `nova-os/out/`, suitable for a domain root. The combined build sets the path only for its child process, so it does not alter your terminal environment.

The five HTML apps can also be opened independently through a local static server. The complete HTML/CSS/JavaScript for each lives in its respective `index.html`. Debotaro CHSL, Debotaro Rail and Debotaro Assam additionally support opening their complete downloaded HTML directly in a browser, without a server or network connection.

## Tests and screenshots

```powershell
# From portfolio-website, with the production build present:
npm run test:unit
npm run test:production
npm run test:install
npm run lint
npm run format:check
npm test
```

`npm run test:unit` runs RELAY's domain/backend contracts and ATLAS's storage-boundary checks. Embedded Postgres checks use test-only authentication/storage stubs; they do not connect to a live Supabase service. Playwright covers desktop/mobile Chromium, desktop Firefox and desktop/mobile WebKit. It checks user journeys, persistence, downloads, keyboard dialogs, automated accessibility, deferred delivery, fallbacks and layout. It starts a preview server if needed; reports appear in `playwright-report/` and ignored `output/quality-playwright.json`. WebKit emulation is separate from testing Safari on a physical iPhone.

`npm run lint` checks maintained JavaScript/TypeScript modules; `npm run format:check` checks source formatting. Use `npm run format` after editing. Embedded scripts in the single-file HTML demos are formatted and browser-tested; they are outside ESLint's module checks. The targeted cleanup extracts ATLAS's untrusted-storage parsing into a pure module rather than scattering type assertions through its UI.

The production build compacts only the portfolio and AURA/VANTA/RASA entry HTML, including embedded CSS and script whitespace. Editable source remains formatted. Debotaro CHSL, Debotaro Rail and Debotaro Assam self-contained HTML files and companion downloads are copied unchanged. `npm run test:production` checks text separation, accessibility attributes, dynamic CSS and script execution. React and Next.js output keeps its existing compiler pipeline.

The [performance report](reports/performance/README.md) records matched mobile lab measurements, while the [accessibility review](reports/ACCESSIBILITY.md) retains both violations and uncertain checks. These 9 October reports cover the earlier seven demos, not the Debotaro CHSL, Debotaro Rail and Debotaro Assam apps. Their addition checks are recorded separately in [VALIDATION.md](VALIDATION.md). With a preview running, `npm run audit:accessibility` regenerates after results. The performance guide provides the browser executable and version requirements for `npm run audit:performance`. The [physical-device checklist](reports/REAL_DEVICE_CHECKLIST.md) records checks still requiring real phones and screen readers.

`node scripts/capture.mjs` refreshes the real project screenshots in `previews/`. These images also serve as the portfolio gallery thumbnails. After refreshing them, build again to update `dist/`.

See [VALIDATION.md](VALIDATION.md) for the verified checks and [CASE_STUDIES.md](CASE_STUDIES.md) for the design and engineering rationale.

## Demo behaviour

- RELAY is the seventh independent demo and the first app in the gallery. It connects local projects/tasks, design revisions, image-pin feedback, review decisions and an activity trail. Demo role switching previews Admin, Project Manager, Designer and Client permissions; it is not authentication. Its optional Supabase adapter and SQL/storage policies require a separately configured backend. The public browser demo does not provide live teamwork or cloud accounts. See [RELAY setup and scope](relay-os/README.md).
- Debotaro CHSL is the eighth standalone app. It uses original practice material, six learning stages, local progress/bookmarks, timed Tier I/Tier II practice and English typing/data-entry drills. It has no accounts, backend or cloud sync. The stages are pedagogical rather than official exam levels; the app does not award a certification or guarantee exam results. Personal branding and visual direction are by Deboraj; content preparation and implementation are AI-assisted.
- Debotaro Rail is the ninth standalone app. The supplied single-file tool contains 4,000 original practice MCQs, six learning stages, CBT 1/CBT 2 practice, answer review, typing skill practice and browser-local progress. It retains the provided Debotaro branding and creator credit. Its practice material is AI-assisted and not official RRB content; it does not award a certification or guarantee exam results.
- Local business demonstrations use sample data. NOVA and ATLAS additionally read live public GitHub data. No backend or server account is required.
- NOVA's GitHub workspace reads public repositories and one page of up to 30 open milestones without credentials. Loading, empty, errors, retry, rate limits, a 12-second timeout and obsolete-request cancellation are handled. Importing a repository creates a local project; a milestone becomes one local planning task, not its individual issues. Duplicate guards, source links and import history persist when browser storage is available. Verified repository renames update source identities by stable ID. There is no application cache, automatic polling or GitHub write; local completion is independent of GitHub.
- ATLAS's GitHub queue additionally reads real public repository and issue data using credential-free GitHub REST requests. Loading, empty, errors, timeout, rate limits and stale requests are handled. Imports become browser-local tasks; they do not change GitHub. The queue shows one page of up to 30 raw entries with pull requests excluded.
- NOVA's assistant uses deterministic local rules. It creates and updates real local demo tasks, but does not call an AI API.
- Login, signup, onboarding and booking actions are clearly identified simulations. NOVA's GitHub workspace reads real public data; its other integration cards remain local previews. The public demos do not authenticate users, connect private accounts, send email, reserve rooms, purchase products or charge money. RELAY includes optional backend code for separately configured Supabase authentication and persistence; this is not enabled by the static demo.
- RELAY, NOVA, ATLAS, NILA and VANTA store demo state in browser local storage. NOVA validates supported records, relationships and storage size before restoration/saving, reports invalid saved data, and warns when saving is session-only. Its import activity is capped at 100 entries. ATLAS and NILA include confirmed reset controls. Local state belongs to the current browser and origin. Changing the host/port starts a separate storage context.
- Resort and travel enquiry details are used for the on-screen confirmation and are not saved. VANTA does not retain checkout identity or address.
- CSV files and the RASA text itinerary are real downloads. NILA's PDF action opens browser printing; choose **Save as PDF** to create a file. It is not a server PDF generator.
- The earlier brand experiences use internet-delivered photographs or optional visual libraries. Native system fonts and accessible controls remain usable if external resources fail. RASA's destination buttons work without WebGL. Photography has replacement comments in the source. Debotaro CHSL, Debotaro Rail and Debotaro Assam embed their fonts, diagrams and study material for offline use.

## Source and publishing

Public source: [Debotaro/Debotaro.github.io](https://github.com/Debotaro/Debotaro.github.io). The domain-root GitHub Pages target is [debotaro.github.io](https://debotaro.github.io/). `.github/workflows/pages.yml` installs the locked dependencies, builds the ten-project collection, runs RELAY's domain/backend contracts and browser checks, and deploys the verified `dist/` artifact on `main`. Pull requests run the same checks without deploying. The Pages source is configured as GitHub Actions.

**Three single-file experiences:** publish the contents of `aura/`, `vanta/` or `rasa/` as a GitHub Pages source, with `index.html` at its root. Their footer portfolio link is relative to their parent; update it to your portfolio URL if you host them separately. GitHub's [Pages setup documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) explains publishing sources and disabling Jekyll.

**Offline study apps:** publish `ssc-chsl/`, `rrb-ntpc/` or `adre-hs/` with `index.html` at the root. Retain `Debotaro-CHSL-Offline.html`, `Debotaro-Rail-Offline.html` or `Debotaro-Assam-Offline.html` for the corresponding downloadable companion. The combined build copies all six self-contained files unchanged.

**Individual apps on Vercel:** import your repository and set the project root directory to `relay-os`, `nova-os`, `atlas-ops` or `nila-ledger`. Use the matching Next.js or Vite framework preset. Leave `PORTFOLIO_BASE_PATH` unset for standalone NOVA. RELAY/ATLAS/NILA use hash routes, so they do not require a route rewrite. Their project READMEs contain further details. See [Vercel Git deployment](https://vercel.com/docs/git) and [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

**One combined static deployment:** publish the contents of the built `dist/` directory. It includes all ten projects, the gallery and `.nojekyll`. For a domain root, use the default build. For a GitHub project URL such as `https://yourname.github.io/my-portfolio/`, set the base before building:

```powershell
$env:PORTFOLIO_SITE_BASE = '/my-portfolio'
npm run build
Remove-Item Env:PORTFOLIO_SITE_BASE
```

NOVA requires that prefix at build time; RELAY, ATLAS, NILA and the static pages retain relative links. A bundle built with a repository prefix must be served at that prefix. This local preview server expects the default domain-root build, so rebuild without the variable before local QA.

When hosting apps separately, change the matching gallery links in the root `index.html` and the `routes` map in `assets/portfolio.js` to their final public URLs. The source-link mapping lives beside those routes. Case-study content lives in `data/case-studies.json`; keep future process notes and claims tied to work you can explain. Generated logo files and prompts are documented in `assets/LOGO.md`.

## Job application materials

The public résumé is linked in the navigation and contact section: [`downloads/Deboraj-Sarkar-Resume.pdf`](downloads/Deboraj-Sarkar-Resume.pdf) and its [printable HTML companion](downloads/Deboraj-Sarkar-Resume.html). The one-page A4 design uses forest green, warm ivory, lime and the Debotaro D/T identity, with embedded fonts, vector text and clickable links. It includes the ongoing degree, paid graphic design role, selected Coursera certificates, phone number and one-week availability. These Coursera course credentials are not presented as passed vendor certification exams.

Editable facts live in [`career/resume.json`](career/resume.json) and readable copy in [`career/RESUME.md`](career/RESUME.md). Install `career/requirements.txt`, then run `python career/build_resume.py --output-dir output/pdf`. The default output is the **local review folder**, `output/pdf/`; generation does not replace the public files. Review the rendered page and links, then promote the approved PDF and HTML into `downloads/` as part of the portfolio release. [`career/README.md`](career/README.md) documents the layout and print workflow. A PDF can request actual-size printing in compatible readers but cannot force a printer driver to override Draft mode.

[`career/GITHUB_PROFILE.md`](career/GITHUB_PROFILE.md) maintains the GitHub profile README copy; [`career/SOCIAL_PROFILE_COPY.md`](career/SOCIAL_PROFILE_COPY.md) maintains the matching GitHub, LinkedIn and Dribbble field copy. Keep factual updates aligned across those files and the résumé source.

`career/INTERVIEW_PREPARATION.md` contains project pitches, actual source/data flows, frontend Q&As, code exercises, a five-day practice schedule and honest AI-assistance talking points. Use the exercises to build your own understanding and learning log before presenting sample answers as demonstrated skills.

## Structure

```text
portfolio-website/
  index.html           Personal portfolio page
  assets/              Portfolio CSS/JS and generated Debotaro identity
  data/                Eleven editable case studies
  career/              Résumé content and interview preparation
  downloads/           Public résumé PDF and printable HTML
  .github/workflows/   Validated GitHub Pages deployment
  relay-os/            Creative handoff app and optional Supabase backend
  nova-os/             Independent Next.js project
  atlas-ops/           Independent Vite project
  nila-ledger/         Independent Vite project
  aura/index.html      Single-file resort
  vanta/index.html     Single-file shop
  rasa/index.html      Single-file travel experience
  ssc-chsl/            Offline CHSL app and complete HTML download
  rrb-ntpc/            Offline railway practice app and complete HTML download
  adre-hs/             Offline ADRE practice app and complete HTML download
  previews/            Real desktop/mobile project screenshots
  scripts/             Install, build, serve and capture helpers
  tests/               Playwright user-journey checks
  dist/                Complete built static portfolio (generated)
```
