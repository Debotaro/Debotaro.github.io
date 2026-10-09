# Portfolio and profile publication — 8–9 October 2026

This record separates verified publication results from platform actions awaiting confirmation. Sources are the completed GitHub Actions release, HTTP/PDF checks and signed-in saved-state checks on the user's profiles. Browser evidence is stored outside the public repository in `X:/Six Portfolio Projects/profile-updates/2026-10-08/`.

## Quality release — 9 October 2026

- Source release: [`99699ca8`](https://github.com/Debotaro/Debotaro.github.io/commit/99699ca8b9e127e2abd0130f858c0ebb3c6a8595). [Actions run 37911045013](https://github.com/Debotaro/Debotaro.github.io/actions/runs/37911045013) passed both build and deployment; publishing completed at 09:36:45 UTC.
- The complete final build passed **497 browser checks**, with **eight intentional skips**, zero failures and zero flaky results across Chromium desktop/mobile, Firefox desktop and WebKit desktop/mobile. The downloaded artifact is summarized in [BROWSER_COVERAGE.md](../reports/BROWSER_COVERAGE.md) and [browser-ci.json](../reports/browser-ci.json). The workflow also passed lint, formatting, all application builds, 38 domain/database/storage checks and three production-minification contract checks.
- Performance, accessibility and keyboard findings are linked from [VALIDATION.md](../VALIDATION.md). They retain the matched lab conditions, baseline results, uncertain automated findings and physical-device/screen-reader limits. Expanded [NOVA](../reports/case-studies/NOVA.md) and [ATLAS](../reports/case-studies/ATLAS.md) stories include architecture diagrams and implementation tradeoffs.
- Fresh public HTTP checks confirmed the homepage, seven demos, optimized WebP gallery, local font files, compact static HTML and the new About validation link. The reviewed public résumé remains **585,311 bytes**, with the same SHA-256 recorded below. Live-check evidence is kept in ignored `output/live-quality-check.json`.
- [GitHub profile README](https://github.com/Debotaro/Debotaro/blob/main/README.md) updated in commit [`3b2bba43`](https://github.com/Debotaro/Debotaro/commit/3b2bba43b0ba78ceef60e2f389be4dd80fdc3dbb). The published contents API matched all **5,648 bytes** of `GITHUB_PROFILE.md`; the public profile visibly showed the new quality evidence links. Existing public identity, location, education and contribution statements were preserved.
- [LinkedIn About](https://www.linkedin.com/in/deborajsarkar/) saved the reviewed quality paragraph and validation URL. The interface confirmed “Your about section has been updated”; the main profile independently displayed both additions, one-week availability and all five existing top skills. No paid upgrade was accepted. Browser proof for both profiles is saved outside the public repository in `X:/Six Portfolio Projects/profile-updates/2026-10-09/`.
- Three private application drafts target sourced frontend vacancies. Each has a tailored branded one-page A4 résumé and matching cover letter, with a shortlist and tracker bundled in the ignored application pack. Contacts, ongoing education, verified employment and AI-assisted contribution remain factual. **No employer application or message has been submitted.**
- [Quality interview practice](QUALITY_INTERVIEW_PRACTICE.md) adds exercises grounded in the verified changes. A live mock interview and the [human device checklist](../reports/REAL_DEVICE_CHECKLIST.md) still require the user's participation. RELAY's separately configured optional backend is not presented as a hosted production service.

The sections below preserve the earlier 8 October publication record.

## Portfolio and résumé — published

- Portfolio: [debotaro.github.io](https://debotaro.github.io/)
- Source release: [`903c78c`](https://github.com/Debotaro/Debotaro.github.io/commit/903c78c)
- Build and deployment: [GitHub Actions run 37787318267](https://github.com/Debotaro/Debotaro.github.io/actions/runs/37787318267), successful
- Homepage verified with the confirmed Kokrajhar location, ongoing Computer Science degree, paid graphic design background, seven concepts, truthful contribution statement and one-week availability.
- All seven published demo routes returned HTTP 200: [NOVA](https://debotaro.github.io/nova-os/app/), [ATLAS](https://debotaro.github.io/atlas-ops/), [RELAY](https://debotaro.github.io/relay-os/), [NILA](https://debotaro.github.io/nila-ledger/), [AURA](https://debotaro.github.io/aura/), [VANTA](https://debotaro.github.io/vanta/) and [RASA](https://debotaro.github.io/rasa/).
- The saved local Playwright report records 160 passing checks, two intentional live-API skips, no failures and no flaky results. Documentation-only publication notes did not require another local test run.
- Reviewed A4 vector résumé: [public PDF](https://debotaro.github.io/downloads/Deboraj-Sarkar-Resume.pdf), **585,311 bytes**, with embedded fonts, selectable text and clickable links.
- Published PDF SHA-256: `42A2E496D1E2E8A946D27B303543D00B223A4870AA4D496C722F7D91CD8469FA`.
- [Printable HTML](https://debotaro.github.io/downloads/Deboraj-Sarkar-Resume.html) accompanies the PDF. The public files were promoted from the reviewed local output; default résumé generation continues to use `output/pdf/`.

## GitHub — saved and published

- [Public profile](https://github.com/Debotaro): name, biography, Kokrajhar location, website, social links and availability for hire saved through the signed-in editor.
- [Profile README](https://github.com/Debotaro/Debotaro/blob/main/README.md): published from `career/GITHUB_PROFILE.md` in commit `490be3543d1a3239ec2d78074757ff9183fc4559`. Public raw content returned HTTP 200 and matched the reviewed source exactly.
- [Portfolio repository](https://github.com/Debotaro/Debotaro.github.io): description corrected to seven projects, portfolio homepage retained, and frontend/React/TypeScript/Next.js/portfolio/AI-assisted-development topics verified.
- GitHub API permissions were not expanded. Profile fields were saved through the existing signed-in browser.

## LinkedIn — saved

- [Profile](https://www.linkedin.com/in/deborajsarkar/): headline, About and Kokrajhar location saved.
- Education: University of the People, bachelor's degree in Computer Science, June 2025 start; ongoing, with no end year or grade invented. The institution was selected for the education header and the intro saved.
- Existing verified employment preserved: Graphic Designer, Wecanstore.com, June 2022–July 2023, Bongaigaon, full-time.
- Featured portfolio description updated to the seven-project copy in `SOCIAL_PROFILE_COPY.md`.
- Existing Google UX Design, AWS Cloud Solutions Architect, Google Digital Marketing & E-commerce and Google Project Management titles corrected to the verified **Professional Certificate** titles.
- Three missing verified Coursera credentials added, bringing the collection to twelve:

| Credential                                  | Provider and completion                                                        | Verification                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Introduction to Data Science Specialization | IBM / Coursera, June 2025                                                      | [L4HGITCYVHR2](https://www.coursera.org/account/accomplishments/specialization/L4HGITCYVHR2) |
| AWS Fundamentals Specialization             | Amazon Web Services / Coursera, April 2023                                     | [2PW3KRRUX6NB](https://www.coursera.org/account/accomplishments/specialization/2PW3KRRUX6NB) |
| Tally Bookkeeper Professional Certificate   | Tally Education and Distribution Services Private Limited / Coursera, May 2025 | [HWXH30J8GVNY](https://www.coursera.org/account/accomplishments/specialization/HWXH30J8GVNY) |

The refreshed main profile independently showed **Licenses & certifications (12)** and the University of the People bachelor's degree in Computer Science as **June 2025–Present**.

The public résumé is live. LinkedIn's direct PDF-link preview failed, so the reviewed PDF was uploaded as Featured Media titled **“Deboraj Sarkar — Frontend Developer Résumé.”** The saved media was verified. Its description includes the confirmed background, one-week availability and latest public download link. Featured order was saved and verified as **portfolio first, résumé second**.

Open to Work preferences were saved and verified in the profile's job-preference dialog:

- Job titles: Frontend Developer and Javascript Developer.
- Workplace types: On-site, Hybrid and Remote; locations: Kokrajhar and India.
- Employment type: Full-time; visibility: Recruiters only.
- Notice period: 15 days or less, the platform's available range containing the confirmed one-week availability. The résumé and biography retain the exact one-week wording.
- Salary was left blank. The optional job-alert wizard was not completed, so no alert configuration is claimed.

## Dribbble — saved; Designer review pending

- [Profile](https://dribbble.com/Debotaro): the saved 514-character biography names Kokrajhar, the ongoing degree, visual direction/review contribution, AI-assisted implementation, one-week availability and portfolio URL.
- Location form saved Kokrajhar, Assam, India. The public location displays India; the biography explicitly names the city.
- The separate education editor required a graduation year. The unsaved entry was removed and the confirmed degree was included in the biography instead.
- RELAY showcase uploaded: [RELAY OS — Design reviews, in context.](https://dribbble.com/shots/27794867-RELAY-OS-Design-reviews-in-context), shot ID `27794867`.
- Shot description names the artwork/review workflow, the contribution statement and browser-local demo. Saved display tags: `dashboard`, `design feedback`, `portfolio`, `product design`, `react`, `ui design`, `web design`.
- Work preferences saved Web Design, UI / Visual Design and Brand / Graphic Design specialties; messages enabled.
- The free Designer application was submitted. A later profile refresh offered **Reapply**, so the completed profile was submitted again and the interface confirmed **“Your application was submitted successfully!”** The account remains Limited; Designer approval and public-feed visibility are not yet confirmed.
- Full-time matching was left unconfigured where the form required unconfirmed salary and work-authorisation answers. No salary threshold, visa answer, graduation year, paid subscription or upgrade was invented or purchased.

## Consistent public contribution

**Visual direction, interface review and iteration; AI-assisted implementation.**

Deboraj reviews generated interfaces, requests revisions and makes the final decisions. Project features and validation describe the applications, with personal concept/demo limits preserved. Education, work history and credentials are based on the supplied details and verified records.
