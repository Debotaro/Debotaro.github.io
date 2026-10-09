# Browser verification — 9 October 2026

The complete suite passed in **all five configured browser contexts in Linux CI: 497 passed, 8 intentionally skipped, 0 failed and 0 flaky**. This is verified from the downloaded browser-report artifact of the successful [GitHub Actions run 37911045013](https://github.com/Debotaro/Debotaro.github.io/actions/runs/37911045013), which built and deployed source commit `99699ca8b9e127e2abd0130f858c0ebb3c6a8595`.

Earlier local verification ran the complete suite in four contexts, followed by scoped checks of the final minified build. [browser-ci.json](browser-ci.json) and [browser-local.json](browser-local.json) preserve the exact report statistics, UTC timestamps, relative test files, test titles, execution outcomes and durations. They exclude absolute filesystem paths, traces, console logs and private application materials.

| Run                                 | Started (UTC)            | Duration (ms) | Passed | Skipped | Failed | Flaky |
| ----------------------------------- | ------------------------ | ------------: | -----: | ------: | -----: | ----: |
| Complete suite, first build         | 2026-10-09T08:50:34.642Z |     280236.38 |    398 |       6 |      0 |     0 |
| Scoped checks, final minified build | 2026-10-09T09:09:59.822Z |    113299.934 |    122 |       2 |      0 |     0 |
| Complete suite, Linux CI            | 2026-10-09T09:26:47.964Z |    573813.254 |    497 |       8 |      0 |     0 |

Both local runs used `desktop` and `mobile` Chromium, plus `webkit` and `mobile-webkit`. Linux CI added `firefox` and ran the complete suite in all five contexts with Playwright 1.63.0. Desktop viewports were 1440 × 1000; mobile contexts emulated iPhone 13. The final local scoped run covered `accessibility.spec.ts`, `performance-delivery.spec.ts`, `personal-portfolio.spec.ts` and `static.spec.ts`. It did not repeat every product workflow in the complete suite; CI subsequently did.

| Context       | Local complete: passed / skipped | Local final scoped: passed / skipped | Linux CI complete: passed / skipped |
| ------------- | -------------------------------: | -----------------------------------: | ----------------------------------: |
| desktop       |                          100 / 1 |                               31 / 0 |                             100 / 1 |
| mobile        |                          100 / 1 |                               31 / 0 |                             100 / 1 |
| firefox       |                     Not executed |                         Not executed |                              99 / 2 |
| webkit        |                           99 / 2 |                               30 / 1 |                              99 / 2 |
| mobile-webkit |                           99 / 2 |                               30 / 1 |                              99 / 2 |

The six local complete-suite skips comprise four opt-in live GitHub smoke checks, one per context, and two real clipboard-write checks in WebKit. The eight CI skips comprise **five live GitHub smoke checks** and **three real clipboard-write checks** in Firefox and the two WebKit contexts. External GitHub availability is excluded from deterministic assertions; mocked GitHub API and persistence workflows ran in the full suites. Clipboard permission grants are Chromium-specific, while separate clipboard interaction checks run in every engine. The local scoped run omitted the live-smoke file, leaving only the two WebKit clipboard-write skips. Skips are not passes.

Firefox passed in Linux CI and was **not executed locally**. Mobile emulation and Playwright WebKit do not establish results on physical phones or Safari installations. Physical-device and manual screen-reader checks remain listed in [REAL_DEVICE_CHECKLIST.md](REAL_DEVICE_CHECKLIST.md).

Both local builds used base commit `df12cbe254cbdfb40b35adffd9c8822d76d468bb` with working-tree changes, subsequently published as `99699ca8b9e127e2abd0130f858c0ebb3c6a8595`. These runs were performed before publication, rather than on clean checkouts of that commit. The matching served-artifact fingerprints are retained with the performance reports:

| Local browser run            | SHA-256 served-artifact fingerprint                                |  Files / bytes | Fingerprint evidence                                       |
| ---------------------------- | ------------------------------------------------------------------ | -------------: | ---------------------------------------------------------- |
| Complete suite, first build  | `fc7212d1a6212ce07d0eab0db0e9c75e66638b5500e39441ab3f841bf6e17ff6` | 164 / 19918567 | [after-first-pass.json](performance/after-first-pass.json) |
| Final minified scoped checks | `d2a4c4ed902f9753ff01ab35f1e4ee1d99871e025eae66a58553cf52cdd2fdb9` | 164 / 19861038 | [after.json](performance/after.json)                       |

Each local fingerprint is SHA-256 over sorted served-file relative paths and file SHA-256 values, separated by NUL bytes. CI artifacts do not include a served-build fingerprint; the local hashes are not asserted for the Linux build. Both browser summaries list test cases once and use an explicitly named execution-table column schema to retain individual results without repeating long titles.
