# Reviewed ATS resume source

This self-contained package reproduces the content and layout logic behind the two current one-page ATS resumes. The reviewed PDF/TXT bytes live in `downloads/`; this package never writes there. It needs no sibling project checkout or delivery workspace.

## Validate the reviewed files

From the portfolio repository root, with Python 3.12 or newer:

```powershell
python -m venv output/ats/.venv
.\output\ats\.venv\Scripts\Activate.ps1
python -m pip install -r career/ats/requirements.txt
python career/ats/build-resumes.py --check
```

On Linux/macOS, activate with `source output/ats/.venv/bin/activate`. The same install and check commands apply. `--check` is read-only: it validates the bundled numerical evidence, reviewed PDF/TXT/PNG hashes, one-page counts, complete source text through pypdf and pdfplumber, section order, six hyperlink targets per PDF and the default PDF/TXT aliases. It does not rerun the engineering experiments or conduct a new visual review.

`resume-source.json` is the exact reviewed source. `verification.json` retains its measured artifact QA and hashes, with paths normalized to this repository. `evidence/rendered/` retains every reviewed page image. The two PDF/TXT pairs in `downloads/` were copied without regeneration; the default resume aliases equal the AI software variant.

## Preview or rebuild safely

```powershell
python career/ats/build-resumes.py --draft
python career/ats/build-resumes.py
```

The preview writes `output/ats/resume-content-preview.md`. Rebuilding writes both PDF/TXT pairs, extraction previews and a fresh QA record under ignored `output/ats/`. It cannot overwrite `downloads/` or the reviewed `career/ats/verification.json`. The PDF builder enforces one page and checks text and links; its generated QA record requires a fresh visual review.

The reviewed PDFs embed Windows Arial. Rebuilds use Arial when available, otherwise the Vera TTFs bundled with ReportLab. For an explicit installed font set, pass `--font-dir <directory>` containing `arial.ttf`, `arialbd.ttf`, `ariali.ttf`, or `Vera.ttf`, `VeraBd.ttf`, `VeraIt.ttf`. Fonts are not redistributed here. Changing fonts, package versions or content can change layout; a rebuild is not promised to be byte-identical to the reviewed PDFs.

Render and inspect every regenerated page before replacing any download:

```powershell
pdftoppm -png -r 144 output/ats/Deboraj-Sarkar-AI-Software-Resume.pdf output/ats/ai-software
pdftoppm -png -r 144 output/ats/Deboraj-Sarkar-Python-Automation-Resume.pdf output/ats/python-automation
```

Poppler is required for rendering, not for `--check` or PDF generation. Review all resulting page images for spacing, legibility, complete text, glyphs, overlap and clipping. Recheck source fidelity and links, then record the new artifact hashes and visual QA before promoting reviewed files. Public publishing remains a separate user approval step.

## Evidence and claim boundaries

- `evidence/verified-facts.json` is the background audit with public sources and evidence classifications. Education and employment remain public self-reports; two course records were checked against issuer pages.
- `evidence/evidence-desk-evaluation.json` is the exact local evaluation report behind the synthetic holdout figures: hybrid expected-source retrieval on 14/18 answerable queries versus 11/18 for BM25, plus 8/8 refusals on unsupported/adversarial holdout queries.
- `evidence/flow-ledger-verification.json` is the exact local SQLite report behind 9/9 experiments, duplicate-intake and worker claims, independent polling, and actual worker exits after local case commit. Retry/lease boundary scenarios explicitly use an injected clock.

The source's original provenance fields retain their delivery-workspace path labels. Their corresponding snapshots are bundled above; the builder reads these local snapshots exclusively. These are historical measured results, not customer impact, production deployment, independently assessed proficiency, general exactly-once delivery or a vendor certification exam. Both resumes disclose: **Personal projects developed with Codex assistance.**

ATS compatibility here means a simple single-column layout with verified selectable text and reading order. No external ATS ranking or screening outcome is claimed. Background, contact details, links and current availability should be reviewed before an application.
