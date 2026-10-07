# Debotaro — Selected frontend work

Seven projects exploring responsive interfaces, useful interactions and distinct visual identities. Each is a **personal concept project with AI-assisted development**. Deboraj Sarkar (Debotaro) provided project direction, requirements and personalisation; Codex assisted with implementation and iteration. Operational and business demonstrations use sample data; ATLAS additionally reads live public GitHub issues. Project results describe working frontend behaviour and documented validation.

**Role across the collection:** Project direction and AI-assisted frontend development.

## 01 / Debotaro Portfolio

**Personal portfolio · HTML, CSS, JavaScript**

**Challenge.** Give recruiters a quick way to understand Deboraj’s frontend focus, explore working examples and start a conversation.

**Approach.** Lead with a clear professional introduction, place the portfolio itself first, and connect six distinct demos through a consistent project gallery. Concise case studies explain the implementation choices behind the visuals.

**Implementation highlights.** Responsive layouts; category filtering with an announced result count; working demos and public source links; email, professional profiles and a downloadable résumé.

**Evidence.** Desktop/mobile Chromium checks cover identity, filters, local demo/source links, keyboard dialogs, mobile menu behavior, actual clipboard contents, résumé download and overflow.

**Scope.** A frontend showcase with a project-based résumé. Contact uses an email link; there is no contact backend.

## 02 / NOVA OS

**Product system · Next.js, React, TypeScript, Tailwind CSS**

**Challenge.** Keep projects, tasks, automation and assistant interactions connected so the workspace feels like one product.

**Approach.** Use a shared, typed data model across the dashboard and project views. Pair a restrained dark interface with command search, local automation and a separate marketing and onboarding journey.

**Implementation highlights.** Task changes update project progress; command search finds destinations and tasks; a rule-based assistant creates tasks; an editable automation flow updates local workspace state.

**Evidence.** Next.js static export and TypeScript checks pass. Desktop and mobile Chromium scenarios cover task creation, command search, assistant task creation and automation execution. Delayed-command regressions verify preservation of intervening state changes, summary immutability and cancellation on departure or clearing chat.

**Scope.** Tasks persist in the browser. The assistant is deterministic; authentication, team collaboration and external integrations are simulated.

## 03 / ATLAS Ops

**Product system · React, TypeScript, Vite, Recharts**

**Challenge.** Connect a practical operations dashboard to real external data while keeping remote issues and local planning clearly separate.

**Approach.** Keep operations charts and staffing local, then add a public GitHub queue through a typed API boundary. Validate responses, cancel obsolete requests, handle timeout/rate limits and import selected issues into local planning. Board actions support drag-and-drop and explicit status controls.

**Implementation highlights.** Editable task board; live GitHub repository/issue reads; clear loading, error and empty states; runtime validation, cancellation and retry; duplicate-safe local imports with source traceability.

**Evidence.** TypeScript/Vite builds and desktop/mobile tests pass. Mocked API checks verify success/import persistence, search, loading/empty/retry, malformed data, network failure, primary/secondary rate limits, timeout and obsolete responses. A separate unmocked browser smoke check verified real GitHub data.

**Scope.** GitHub reads live public data; the latest page contains up to 30 raw entries with pull requests excluded. Rate limits apply. Imported tasks and operational data remain local; no GitHub writes, ERP connection, live staffing system or shared backend is provided.

## 04 / NILA Ledger

**Product system · React, TypeScript, Vite, Recharts**

**Challenge.** Make income, spending and budgets understandable without overwhelming the transaction view.

**Approach.** Use one financial model for the ledger, charts, budgets and reports. Store amounts as integer pennies, then format them for display; pair a quiet visual hierarchy with practical filters and exports.

**Implementation highlights.** Transaction creation, editing and deletion; monthly and category filters; editable budgets; CSV exports and a printable monthly report.

**Evidence.** TypeScript checks and the Vite production build pass. Desktop and mobile Chromium scenarios cover a £12.50 transaction, filtered CSV download, persisted data and budget editing.

**Scope.** Personal finance demonstration with fictional data. There is no bank connection or account authentication.

## 05 / AURA Reserve

**Brand experience · HTML, CSS, JavaScript, optional GSAP**

**Challenge.** Preserve the atmosphere of a hospitality brand while making stay planning clear and usable.

**Approach.** Pair generous editorial spacing and cinematic imagery with a visible booking entry point. Validate the stay before displaying a residence and illustrative quote, and keep the essential journey independent of optional animation.

**Implementation highlights.** Date and availability validation; capacity-aware residence selection; calculated nightly quotes; native enquiry and gallery dialogs with keyboard navigation.

**Evidence.** Desktop and mobile Chromium scenarios cover a stay enquiry, quote calculation and keyboard gallery navigation. Core enquiry controls also work when the animation CDN is blocked.

**Scope.** Availability and rates are illustrative. Completing the form creates an on-screen demo state; it does not send an email or reserve accommodation.

## 06 / VANTA Atelier

**Brand experience · HTML, CSS, JavaScript**

**Challenge.** Combine a confident editorial identity with a shopping flow that remains easy to follow.

**Approach.** Use oversized typography and a restrained palette around a compact product catalogue. Keep product size, quantities and totals consistent through selection, a persistent shopping bag and a clearly labelled demo checkout.

**Implementation highlights.** Category filters; product and size selection; cart entries keyed by product and size; validated stored cart data and keyboard focus preserved during updates.

**Evidence.** Desktop and mobile Chromium scenarios cover filtering, size selection, persistence, quantity totals and demo checkout. Keyboard checks verify focus after size and quantity changes.

**Scope.** Fictional products and illustrative photography. Checkout collects no card details, processes no payment and fulfils no order.

## 07 / RASA Experience

**Brand experience · HTML, CSS, JavaScript, Three.js**

**Challenge.** Give an inspirational travel page a clear path from destination discovery to a sample itinerary.

**Approach.** Connect destination buttons, an optional interactive globe and itinerary details. A three-step quiz offers a sample recommendation; the journey form turns selected preferences into an on-screen summary and downloadable plan.

**Implementation highlights.** Globe rotation and destination pins; ordinary destination buttons as a keyboard and WebGL fallback; quiz recommendations; itinerary selection and text downloads.

**Evidence.** Desktop and mobile Chromium scenarios cover destination selection, itinerary details, quiz output and a sample plan download. Essential controls also work when the Three.js CDN is blocked.

**Scope.** Recommendations, prices and itineraries are illustrative. No travel operator is contacted and no transport or accommodation is booked.

## Validation context

The collection and personalised portfolio passed 68 automated Chromium checks across desktop and mobile viewports on 7 October 2026, with further project-level and unmocked API checks documented in [VALIDATION.md](VALIDATION.md). These checks verify specific frontend behaviours. Business impact, formal accessibility conformance and complete browser coverage are outside that validation scope. See the validation file for the current checks and limits.
