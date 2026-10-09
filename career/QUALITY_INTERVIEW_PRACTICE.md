# Interview practice: explain the quality improvements

Use this alongside the project interview kit. These changes were implemented with
AI assistance. They are project evidence to study, not personal debugging stories
to claim before you have reproduced and understood them yourself.

## 1. ATLAS: what happens when saved data is malformed?

**Question:** Why does a TypeScript `State` assertion not make `JSON.parse` safe?

**Explanation to practise:** A type assertion only changes the compiler's view. It
does not check a stored value at runtime. ATLAS now parses unknown browser data
through a pure validator before rendering it. The validator checks nested records,
dates, enum values, collection limits and canonical GitHub provenance. A malformed
snapshot falls back to sample data. Its raw storage is preserved until an
intentional edit or reset produces a new state object.

**Tradeoff:** Rejecting the whole snapshot preserves a coherent workspace, but a
single malformed record prevents other records in that snapshot from loading.
The collection limits deliberately bound a local demonstration; a production
system would need an explicit migration/recovery design and server validation.

**Find it:** [validator](../atlas-ops/src/storage.ts),
[load/save boundary](../atlas-ops/src/data.ts),
[boundary tests](../atlas-ops/qa/storage.test.mjs).

**Exercise:** In a disposable local browser context, change a task's title to
`null` in saved state. Describe the visible recovery, inspect the preserved raw
value, edit a sample task and explain why saving resumes. Never use this exercise
to modify another person's browser data.

## 2. RASA: why defer an attractive visual?

**Question:** How can the destination globe stay useful without making every
visitor download its 3D library immediately?

**Explanation to practise:** The optional globe initialises when its section
approaches the viewport. Destination buttons remain available independently.
Network or WebGL failure keeps the core destination and itinerary flow usable.
The hero also selects an image appropriate to the display size. The measured
impact belongs to the documented lab setup, not every visitor's connection.

**Tradeoff:** Scrolling toward the globe can incur a short initialisation delay.
Starting slightly before it becomes visible balances that delay against fetching
optional code that a visitor might never use.

**Find it:** [RASA source](../rasa/index.html),
[delivery regressions](../tests/performance-delivery.spec.ts),
[performance results](../reports/performance/README.md).

**Exercise:** Disable the optional 3D CDN in a local test. Select a destination,
open its itinerary and explain how progressive enhancement preserves that path.

## 3. NOVA: how can an entrance animation affect loading?

**Question:** Why keep server-rendered hero content visible during hydration?

**Explanation to practise:** A client animation that changes already-visible
content to zero opacity can make useful content disappear and delay its final
paint. NOVA's entrance retains transform motion without resetting opacity.
Reduced-motion preferences continue to bypass the animation.

**Find it:** [marketing component](../nova-os/components/marketing.tsx),
[normal-motion regression](../tests/performance-delivery.spec.ts).

**Exercise:** Compare the normal-motion page with reduced motion enabled. Explain
which content is available before React runs and which part is decorative.

## 4. Accessibility: what does a passing scan establish?

**Question:** Does zero axe violations prove complete WCAG conformance?

**Explanation to practise:** No. Automated checks cover rules they can evaluate
in the scanned states. The review also exercises skip links, dialog focus entry,
background inertness, Escape and focus return. Physical-phone and real
screen-reader reviews remain separately recorded. Photo/transparency contrast and
other incomplete checks need human judgement.

**Find it:** [accessibility report](../reports/ACCESSIBILITY.md),
[keyboard tests](../tests/accessibility.spec.ts),
[physical-device checklist](../reports/REAL_DEVICE_CHECKLIST.md).

## 5. Delivery: why format source but compact the published pages?

**Question:** How did the quality pass balance editable source with loading cost?

**Explanation to practise:** Formatting made the source readable, but the first
production build added about 15 KB of HTML to both AURA and VANTA. A scoped build
step now compacts the portfolio and three brand experiences, including embedded
CSS and script whitespace. The React and Next.js apps keep their own compiler
pipeline. Contract and browser checks verify text separation, accessibility
attributes, dynamic styling and script behaviour. The performance report retains
the intermediate measurements as well as the final comparison; network variation
means every timing change cannot be attributed to whitespace alone.

**Find it:** [production transform](../scripts/production-minify.mjs),
[contract checks](../scripts/production-minify.test.mjs),
[performance evidence](../reports/performance/README.md).

**Exercise:** Compare an editable entry document with its generated `dist/` copy.
Identify an inline text boundary that needs a space, and explain the regression
check protecting it.

## One-question-at-a-time mock interview

Start with a 45–60 second introduction covering your paid design background,
ongoing degree, target junior frontend role, one project and your actual
AI-assisted contribution. For each answer, assess accuracy, clarity and whether
you can point to the feature or source. Then practise one follow-up question.

Record only real practice: date, question, first answer, correction, source studied
and a small exercise you actually completed. The strongest next improvement is
being able to explain and change a small feature yourself.
