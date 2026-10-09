# Accessibility review — 9 October 2026

This review covers Deboraj Sarkar’s portfolio and seven interactive personal projects. It combines repeatable axe scans with keyboard-driven browser checks. It is evidence about the sampled interfaces, rather than a WCAG conformance certificate.

## Method and coverage

- **Automated engine:** axe-core / `@axe-core/playwright` 4.13.0, Playwright 1.63.0, Chromium 153.0.8010.12.
- **Rule tags:** WCAG 2 A/AA, WCAG 2.1 A/AA and axe best practices. This is not a complete WCAG 2.2 evaluation.
- **Views:** 23 states at 1440 × 1000 and 390 × 844 CSS pixels: **46 scans**. These include the portfolio and case study; NOVA landing, workspace, task editor, assistant and dark workspace; ATLAS overview, tasks and editor; RELAY overview, projects, tasks, editor and dark overview; NILA dashboard and transaction editor; AURA landing/enquiry; VANTA collection/size editor; RASA landing/travel quiz.
- **Before:** the immutable production build at `tmp/performance-baseline-site`, served locally on port 4176. Its source revision was `df12cbe254cbdfb40b35adffd9c8822d76d468bb` before this quality pass.
- **After:** the rebuilt production site, served locally on port 4173.
- **Keyboard checks:** eight experiences at both viewport sizes, using actual Tab, Enter and Escape events. These test the initial skip link, focused target, dialog entry, background controls, Escape dismissal and return to the opener.
- The ordinary product tests separately exercise form submission, persistence, errors, mobile navigation, reduced motion and workflow behaviour. Cross-browser results are recorded in [VALIDATION.md](../VALIDATION.md).

## Measured results

An occurrence means one axe rule reported in one scanned state. A node occurrence is one affected element in that state; the same component may appear in several scans. These totals are not counts of distinct bugs or people affected.

| Rule | Before node occurrences | After node occurrences |
| --- | ---: | ---: |
| Text contrast | 109 | 0 |
| Invalid ARIA label on priority dots | 12 | 0 |
| Heading order | 5 | 0 |
| Keyboard focus for a scrollable table | 1 | 0 |
| **Total** | **127** | **0** |

The baseline contains **31 rule occurrences across 46 scans**. The final report contains **zero reported violations and zero scan errors across the same 46 scans**. Raw results, including the items axe could not decide, are retained in [accessibility-baseline.json](accessibility-baseline.json) and [accessibility-after.json](accessibility-after.json).

## Implemented fixes

| Experience | Change and reason |
| --- | --- |
| Portfolio | The projects skip-link target now accepts focus, so keyboard users arrive at the intended section. |
| NOVA | Marketing preview and assistant headings follow their surrounding hierarchy. Closing task dialogs restores the opening control, including when a form field used React `autoFocus`. Reduced-motion mode disables CSS transitions completely, fixing WebKit dark-theme text that otherwise retained the light-theme foreground. |
| ATLAS | Sidebar index labels have stronger contrast against the dark console. Dialog dismissal restores focus to its opening control. |
| RELAY | Status labels, avatars, artwork captions and project-cover labels have stronger light-theme contrast. Priority dots expose a named image role. Task titles now follow the page heading without skipping a level. Editor launch controls explicitly capture focus before opening, so Safari pointer clicks also have a useful return-focus target. |
| NILA | Small status text, transaction type labels and budget amounts have stronger contrast. The transaction table is a named focusable region, allowing keyboard access to horizontal scrolling on narrow screens. |
| AURA | Residence descriptions and rate captions have stronger contrast on the tinted background. The main skip target accepts focus. |
| VANTA | The main skip target accepts focus. The sampled collection and size editor had no automated baseline violations. |
| RASA | Accent captions, globe-area text and quiz-banner copy have stronger contrast. The main skip target accepts focus. |

## Keyboard findings

The final **16 of 16 experience/viewport reviews** pass the scripted checks. Every sampled dialog receives focus, prevents Tab from reaching background page controls, closes with Escape and returns focus to its opening control. Initial skip links become visible and transfer focus into their targets.

The baseline exposed missing focus restoration in NOVA and ATLAS, and non-focusable anchor targets on the four static pages. Native HTML dialogs can let Tab reach browser chrome; headless Chromium represents that by `document.body` becoming active. The review treats browser chrome separately from an interactive control behind the modal. This is documented in the script rather than incorrectly claiming that the browser’s address bar must be trapped.

The raw keyboard evidence is in [accessibility-keyboard-baseline.json](accessibility-keyboard-baseline.json) and [accessibility-keyboard-after.json](accessibility-keyboard-after.json).

The browser regression tests also run through WebKit. Its Windows build skips links when Tab or Alt+Tab is pressed from a fresh page. For that engine the test explicitly focuses the skip link, then verifies its visible focus indicator, Enter behaviour and target, followed by the same dialog keyboard checks. Chromium and Firefox retain the first-Tab assertion. This distinction is a documented test precondition, rather than a claim that the operating system’s keyboard preference was changed. WebKit testing exposed an additional NOVA reduced-motion rendering problem: a 0.01 ms transition could retain the old inherited foreground after switching to dark mode. Disabling transitions under the reduced-motion preference fixes the actual display; the test also waits for the rendered theme before scanning.

## Limits and remaining human checks

Zero reported axe violations does **not** mean that every accessibility requirement is satisfied. W3C states that tools alone cannot determine accessibility and that knowledgeable human evaluation is required. [W3C evaluation guidance](https://www.w3.org/WAI/test-evaluate/).

The reports preserve axe’s `incomplete` results. In particular, contrast over photography, gradients and transparent surfaces needs judgement; generic elements carrying labels need a semantic review; Radix focus guards and hidden background containers need keyboard review. The latter background-focus behaviour was checked with actual keyboard events. Other uncertain results are retained rather than silently counted as passes.

The corrected plain-text contrast findings were checked against axe’s 4.5:1 threshold for normal-sized text. Image overlays and all possible uploaded artwork have not been exhaustively certified. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

No actual NVDA, JAWS, VoiceOver or TalkBack session was performed, and no physical phone was tested. The next human checks are screen-reader reading order, live announcements and error recovery, 200%/400% zoom, forced-colour modes, mobile touch targets and participant testing. Browser emulation and automated accessibility-tree rules cannot substitute for those checks. Keyboard operability remains an explicit requirement of the review. [W3C keyboard guidance](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html).

## Reproduce

Build and serve the site before running the after checks:

```powershell
npm run build
npm run preview
# In another terminal:
node scripts/accessibility-audit.mjs after
node scripts/accessibility-keyboard.mjs after
npx playwright test tests/accessibility.spec.ts
```

The audit and keyboard scripts return a nonzero exit code for after-check failures. `AUDIT_BASE_URL` can point either script at another controlled local build. The before report should be regenerated only against an unchanged before snapshot, rather than scanning new code and labelling it a baseline.
