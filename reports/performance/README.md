# Performance audit — 9 October 2026

This audit measures the portfolio and seven demo entry pages. [The comparison](comparison.md) contains the median of three cold mobile lab navigations per page for the original build and the final build. [summary.json](summary.json) also preserves the minimum and maximum for each metric; [before.json](before.json) and [after.json](after.json) contain the 48 final-comparison run records, settings, warnings and relevant network diagnostics.

An additional 24 intermediate runs are retained in [after-first-pass.json](after-first-pass.json), with [their comparison](comparison-first-pass.md) and [summary](summary-first-pass.json). That first pass identified production whitespace overhead after source formatting. The final pass adds build-time minification of the four static entry documents, then repeats all eight pages. There are 72 recorded navigations across the three builds; the primary table compares the original and final builds.

## Results

The portfolio's measured navigation transfer fell from **2,647,129 to 415,623 bytes (84.3%)**, with a median performance score of **88 → 96** and LCP of **3.76 → 2.70 seconds**. ATLAS reduced transfer by **41.5%** and median LCP from **5.41 to 3.45 seconds**. RASA reduced transfer by **69.0%**, median LCP from **4.73 to 2.64 seconds**, and median Total Blocking Time from **149 to 0 ms**.

NOVA, RELAY, NILA and VANTA had essentially unchanged final medians. AURA's final score is **92 → 91**, with LCP **3.28 → 3.31 seconds**; this small difference sits within its run-to-run variation. NOVA's headline visibility improvement is verified by its hydration regression test; the lab score remains 79. The local uncompressed Next.js and dashboard bundles remain material parts of those pages' loading cost. All 24 final runs completed without Lighthouse runtime errors or warnings.

## Intermediate findings and final delivery

The first pass recorded slower AURA and VANTA medians: AURA **92 → 84**, LCP **3.28 → 4.28 seconds**; VANTA **96 → 94**, LCP **2.62 → 2.83 seconds**. Source formatting added approximately 15 KiB to each uncompressed entry document, while total navigation transfer grew 2.5–2.7%. Those 24 run records and their ranges remain available in the intermediate reports.

The final build minifies the four static entry documents while retaining readable sources. The navigation diagnostics record the following uncompressed HTML resource sizes:

| Entry document | Before, bytes | First pass, bytes | Final, bytes |
| --- | ---: | ---: | ---: |
| Portfolio | 17,435 | 27,052 | 19,612 |
| AURA | 28,808 | 43,946 | 28,929 |
| VANTA | 30,921 | 46,837 | 30,977 |
| RASA | 35,982 | 55,969 | 36,757 |

AURA and VANTA's final transfer and median LCP are close to baseline again. External font, image and animation loading varied between runs; the repeated measurements do not isolate how much of each score change came from minification versus those other factors. AURA's final scores span 86–91 and LCP spans 3.30–4.12 seconds. The report retains both the slower intermediate measurements and the final comparison. GitHub Pages compression and real visitor behaviour require separate measurement.

## Changes measured

- **Portfolio:** replaced full-size PNG thumbnail downloads with 640/1280-pixel WebP deliveries and `srcset`/`sizes`, retaining lazy loading and intrinsic dimensions. The original PNG screenshots remain available for documentation and social media. The generated logos have lossless WebP deliveries. The existing DM Sans, Space Grotesk and Instrument Serif fonts are served locally with OFL notices; the headline fonts are preloaded. The visual identity has not been redesigned.
- **ATLAS:** loads `OperationsConsole` and its chart dependencies when the overview is opened. The landing page no longer downloads chart code. A status message covers the brief loading state. Chart interactions are tested after navigation.
- **NOVA:** keeps the server-rendered hero text visible while the existing GSAP entrance animation moves it. Hydration no longer resets the headline to zero opacity. Reduced-motion behaviour remains intact.
- **RASA:** supplies responsive hero photograph sizes and delays the optional Three.js globe and earth texture until its section approaches the viewport. Destination selection and itinerary controls work while the optional download is pending or unavailable.
- Accessibility fixes and source formatting were included in the after build. The comparison measures the resulting build as a whole, rather than attributing every timing change to one isolated modification.
- **Static production delivery:** the build uses [HTML Minifier Next](https://github.com/j9t/html-minifier-next), pinned to 8.10.7, to minify portfolio, AURA, VANTA and RASA entry documents and embedded CSS/JavaScript. Readable source files remain in the repository. Conservative whitespace collapse preserves word separation; JavaScript compression and mangling are disabled; script boundaries, accessibility attributes, dynamic CSS rules and licensed comments are preserved. The Next.js and Vite applications retain their existing compiler pipelines.

## Measurement conditions

- Windows on the same machine for both phases; exact CPU, OS, Node version and Chrome user agent are recorded in each JSON file.
- Lighthouse **12.8.2** and Playwright Chromium headless shell **153.0.8010.12** for this matched historical comparison. The project now installs Lighthouse **13.5.0** for future audits; score comparisons across tool versions require a new baseline.
- Mobile form factor, simulated throttling, Lighthouse defaults: 412×823 CSS-pixel viewport, device scale factor 1.75, 4× CPU slowdown, simulated 150 ms round-trip time and 1,638.4 Kbit/s throughput. Full effective settings are recorded with every run.
- Sequential measurements on a local production build, with a fresh navigation and Lighthouse storage/cache reset each run. Each metric is aggregated independently; the median score and median LCP need not come from the same run.
- The local static server uses `Cache-Control: no-cache` and **no HTTP compression** in both phases. GitHub Pages delivery, its compression/cache behaviour and actual visitor network conditions differ. Text-compression recommendations in the raw audits describe this lab server; they are not evidence that GitHub Pages lacks compression.
- Unsplash, Google Fonts used by the other demos, and CDN resources use the real network. Those services and browser connection caches can vary. The first run can differ from subsequent runs; all runs and ranges are retained. Smaller changes on unchanged pages should be treated as noise, not a claimed optimisation.
- The before build was copied to an immutable local snapshot before runtime edits. The base Git commit identifies the source baseline; the SHA-256 build fingerprint identifies the exact served files. The initial runner did not capture source working-tree status for the before build, which is explicitly recorded as unknown. The after build records its dirty working tree and fingerprint; changes were tested before commit.

## What this does and does not establish

LCP, CLS, Total Blocking Time, Speed Index and the Lighthouse performance score are **lab measurements** here. Total Blocking Time is not Interaction to Next Paint. No field INP or field Core Web Vitals pass is claimed. Real-user Core Web Vitals require field observations at the 75th percentile, separately for mobile and desktop. [Google's Web Vitals guidance](https://web.dev/articles/vitals) explains these distinctions.

Performance scores are affected by test conditions and use weighted metric scoring. A score increase is useful evidence for this controlled comparison, not a guarantee for every visitor or device. [Lighthouse scoring guidance](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) explains variability and weighting.

The uncompressed local React/Next.js applications still expose opportunities around bundle/CSS size. This pass addresses measured initial-delivery bottlenecks. Real-phone testing and field measurement remain separate follow-up activities.

## Re-run with the current project tool

Use the bundled or a compatible Node runtime. Install the project dependencies and Chromium using the project setup instructions, then build the production site. Supply the actual headless-shell executable on Windows:

```powershell
npm run build
$perfChrome = 'C:\Users\Deboraj\AppData\Local\ms-playwright\chromium_headless_shell-1243\chrome-headless-shell-win64\chrome-headless-shell.exe'
node scripts/performance-audit.mjs --phase verification --site dist --runs 3 --chrome $perfChrome
```

`--pages portfolio,atlas,rasa` limits a diagnostic run. `--port 4175` chooses the isolated local server port. Avoid concurrent builds, browser suites and other heavy work during the audit. Full Lighthouse JSON reports are written to ignored `output/performance/<phase>/`; the portable evidence is saved to `reports/performance/<phase>.json`.

The historical comparison used the same command with `--phase before --site tmp/performance-baseline-site`, then `--phase after --site dist`, and **`--lighthouse-root tmp/performance-tools`** to select the isolated 12.8.2 tool installation. That ignored installation and snapshot are local audit inputs, not application dependencies. To create a fresh comparison, freeze both builds and use the same current Lighthouse and Chromium versions for both phases. `node scripts/performance-summary.mjs` regenerates the comparison only when both files contain three successful runs per page with matching Lighthouse versions.

## Assets and provenance

- [image-delivery.json](image-delivery.json): input/output dimensions and bytes for every generated delivery.
- `scripts/performance-images.py`: Pillow 12.3.0, WebP quality 90 for screenshots; lossless logos. Originals are retained.
- `assets/fonts/manifest.json`: exact font source URLs, bytes and SHA-256 hashes; corresponding OFL files are in the same directory.
- `scripts/performance-site-fingerprint.mjs`: fingerprints every served file using its relative path and SHA-256 content hash.

Optimised screenshot deliveries were visually inspected for legibility, photography and layout. Automated regression tests cover deferred chart loading, continued chart operation, progressive globe loading and failure, and headline visibility during normal-motion hydration.
