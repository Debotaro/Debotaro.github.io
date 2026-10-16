# AI software and automation hiring materials

Approved publication edition prepared 16 October 2026. Historical verification and publication records retain their original scope; the Python backend services are not publicly hosted.

## Current deliveries

- `downloads/Deboraj-Sarkar-Resume.pdf`: default AI software / applied AI ATS résumé; identical to the reviewed `Deboraj-Sarkar-AI-Software-Resume.pdf`.
- `downloads/Deboraj-Sarkar-AI-Software-Resume.pdf` and `.txt`: AI software / applied AI variant.
- `downloads/Deboraj-Sarkar-Python-Automation-Resume.pdf` and `.txt`: Python automation variant.
- `downloads/Deboraj-Sarkar-Resume.html`: responsive companion with current project evidence and metadata.
- `resume.json` and `RESUME.md`: current website companion content; `resume-evidence-source.json` records both variants and evidence provenance.
- `GITHUB_PROFILE.md` and `SOCIAL_PROFILE_COPY.md`: approved profile copy, with actual platform saves verified separately.

The two ATS PDFs were generated and reviewed in the delivery workspace's `career/resumes/` package, then copied without regeneration. Each is one A4 page with selectable text, six verified links and complete linear extraction checked by pypdf and pdfplumber. Every page was rendered and visually inspected. The portable source, pinned dependencies, evidence snapshots, reviewed page images and QA record are included in `career/ats/`, with no dependency on the outer delivery workspace.

These are personal projects developed with Codex assistance. The repositories document implementation, executable checks and limits. Project technologies do not establish independently assessed proficiency. Education remains in progress; paid employment remains Graphic Designer at Wecanstore.com. There are no invented AI engineering jobs, graduation dates or customer results. Immediate availability and phone are omitted from this current edition.

## Reproduce the current artifacts

From this repository root, set up Python 3.12+ and install the ATS dependencies:

```powershell
python -m pip install -r career/ats/requirements.txt
python career/ats/build-resumes.py --check
python career/ats/build-resumes.py --draft
python career/resume_html.py
```

`--check` is a read-only audit against the bundled evidence and reviewed downloads. `--draft` writes only an internal content preview to ignored `output/ats/`. A full ATS rebuild also writes only to `output/ats/`; it cannot overwrite reviewed downloads or their QA. See `ats/README.md` for font portability and render/review commands. Every regenerated PDF needs fresh rendering and visual review before promotion.

`python career/resume_html.py` regenerates the current HTML companion from `career/resume.json` into ignored `output/html/Deboraj-Sarkar-Resume.html`. Title, description, role and masthead are driven by that JSON. This command does not create a PDF or change published downloads. After local review, copying that HTML into `downloads/` is an explicit promotion step.

## Preservation and regeneration

The previous frontend PDF/HTML are retained as `downloads/Deboraj-Sarkar-Frontend-Resume-2026-10-13.*`. Its source, Markdown and profile copy are preserved in `archive/`. Existing frontend interview guides, all twelve course records and historical publication notes remain available; only the two freshly checked course credentials are selected in the current concise résumé.

`build_resume.py` and `resume_layout.py` preserve the established branded PDF layout for historical/local review work and write to `output/pdf/` by default. They are not the source generator for the approved ATS PDFs. `resume_html.py` now accepts data-driven metadata and supplies the current safe HTML-only command above; it remains compatible with the legacy builder. Neither default command overwrites reviewed ATS downloads. Historical frontend JSON is preserved explicitly in `archive/`; the current default JSON is the AI software/automation edition.

Public source repositories are available. Verify PDF routes, source links, the GitHub Pages release and actual LinkedIn saved state before recording each platform update as complete. Backend hosting remains a separate authorized deployment step.
