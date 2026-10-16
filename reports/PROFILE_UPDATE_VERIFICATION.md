# Profile and portfolio review verification — 16 October 2026

This report preserves the **prepublication local verification**. Public publishing was approved afterward; the publication handoff records the actual GitHub pushes, Pages runs and public checks. Backend service hosting is a separate deployment step.

## Executed checks

- Production build: all ten established demos built successfully, with both engineering case pages, executed report copies, application captures and current résumé downloads included.
- ESLint: passed across the portfolio repository. All three existing production-minification regression tests also passed.
- Full CI formatting command (`prettier --check "**/*.{js,ts,tsx,mjs,css,html,json,md,yml}"`) and `git diff --check`: passed. Five immutable ATS source/evidence JSON snapshots are explicitly excluded in `.prettierignore`; their original bytes and reviewed hashes remain intact and are audited by the portable ATS `--check` command.
- Focused browser suite: **34 passed, 2 skipped**, 27.0 seconds. Chromium desktop/mobile and WebKit desktop/mobile covered the personal portfolio, eleven existing case dialogs, current PDF/HTML download, narrow navigation, email-copy success/denial, engineering routes and accessible skip links. The two skips are the existing real clipboard check on WebKit; those platforms still execute the simulated clipboard interaction and denial behavior.
- Both engineering pages: Axe checks passed with WCAG 2 A/AA, WCAG 2.1 A/AA and best-practice tags in all four tested browser/device profiles. Scrollable command regions are keyboard-focusable and named. This covers inspected pages and interactions, not full accessibility certification.
- Separate responsive checks: **16/16 passed** (home, EvidenceDesk case, FlowLedger case and current HTML résumé at 320/390/768/1440 pixels). No horizontal page overflow. All four role-specific PDF/TXT download routes served successfully.
- Final credential refinement: the homepage now selects only the two freshly issuer-checked Google/IBM course credentials. The third historical AWS Coursera record remains unselected in source/archive. A fresh all-ten-project production build passed, and the affected background/credential test passed in all four working browser/device profiles (4/4, 5.2 seconds). The exact full CI formatting command passed again after this change.
- Six actual browser captures were generated under ignored `output/profile-review/`. Engineering cards at desktop/mobile sizes, FlowLedger case layout/results and the mobile HTML résumé were visually inspected without clipped text, overlap or broken images.
- Reviewed ATS PDF/TXT pairs copied byte-identically from the verified source package. The default PDF/TXT aliases equal the AI software variant. The portable source audit also passed from an isolated copy containing only `career/ats/` and the reviewed downloads.
- FlowLedger report and queue/job/mobile screenshots copied byte-identically from the actual locally verified application. No generated mockup is used for these captures.

## Reproduce the focused browser suite

```powershell
npm run build
node node_modules/@playwright/test/cli.js test tests/personal-portfolio.spec.ts tests/accessibility.spec.ts --grep 'Personal portfolio|Background,|Engineering case|Eleven case|Résumé download|Narrow-screen|Copy email|Contact remains' --project desktop --project mobile --project webkit --project mobile-webkit
```

For the observed Windows workspace path containing an ampersand, npm child build scripts were executed with this process-local setting:

```powershell
$env:npm_config_script_shell = (Get-Process -Id $PID).Path
```

No persistent npm or operating-system setting was changed. A separate port was used for these checks to avoid existing local services.

## Environment limit

The configured Firefox runtime is present, but it cannot launch on this Windows host. Playwright reports `browserType.launch: spawn UNKNOWN`; a direct `firefox.exe --headless --version` invocation reports an incorrect Windows side-by-side configuration. Firefox failed before any page execution. The install check did not identify a missing browser download. No Firefox functionality result is claimed, and no system runtime/security setting was changed.

## Claim boundaries and publication

EvidenceDesk remains an extractive retrieval workbench, with synthetic author-created holdout measurements. FlowLedger remains a deterministic single-workspace workflow service with fictional local case effects, injected-clock boundary experiments and explicitly accelerated real crash tests. Its browser suite includes simulated boundary checks. Neither service has a publicly hosted backend at this checkpoint.

The new projects were developed with Codex assistance under the portfolio mission. The artifacts demonstrate software behavior and executable evidence; they do not establish independent personal proficiency, new employment, customer adoption or commercial impact. Education remains in progress and paid employment remains Graphic Designer.

Current LinkedIn headline/About/project/post copy is prepared separately from internal execution notes. Proposed new repository and case-study destinations are clearly marked as unpublished. A final public update requires user approval, followed by actual repository/CI/Pages/profile verification.

## Approved public-source publication check

The two public source repositories were read through GitHub, and successful hosted verification plus Docker image-build jobs were confirmed. The website/profile copy now links those actual repositories while retaining the unhosted-backend boundary. A fresh all-ten-project production build, full ESLint and full formatting check passed. Sixteen affected portfolio/case/accessibility/PDF-HTML browser checks passed across Chromium and WebKit desktop/mobile profiles. Every tracked PDF/TXT download remains byte-identical to the reviewed release. Public Pages status is recorded separately after its hosted run finishes.
