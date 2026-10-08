# Frontend job application materials

This folder contains Deboraj Sarkar's résumé source and interview preparation. The résumé uses the supplied professional details and verified personal projects. Employment, education, certifications and results are added only when confirmed.

- `resume.json`: editable résumé content used by the PDF and HTML builder.
- `RESUME.md`: readable editable résumé.
- `INTERVIEW_PREPARATION.md`: explanations, exercises and a practice schedule grounded in the project source.

The public résumé deliveries live in `downloads/`. Source and QA helpers remain separate from those downloads.

The 8 October 2026 update was generated and visually reviewed in `output/pdf/`, then promoted into `downloads/` and published through the successful GitHub Pages release of `903c78c`. It includes confirmed education, paid design experience, contact details, one-week availability and selected Coursera credentials. [`PUBLICATION_RECORD.md`](PUBLICATION_RECORD.md) records the verified deployment and profile updates. `RESUME_REVIEW_NOTES.md` records sources and editorial decisions; `resume.json` retains all twelve verified specialization/professional certificates, with a `selected` flag controlling the concise résumé.

To generate the local review copy:

```text
python career/build_resume.py --output-dir output/pdf
```

To regenerate the résumé after editing confirmed facts in `resume.json`:

```text
python -m pip install -r career/requirements.txt
python career/build_resume.py
```

The builder defaults to the local review folder `output/pdf/` and produces a text-based PDF, responsive printable HTML and Markdown content. `resume_layout.py` controls the branded PDF layout; `resume_html.py` controls the self-contained HTML companion. The design uses forest green, warm ivory, lime, the existing D/T monogram and embedded sans/italic serif typography. The PDF checks column bounds and fails if new content exceeds the footer rather than silently clipping it.

Review the rendered PDF after any content change; it should stay legible and fit one page with the current content. A longer education or employment history may need a second page rather than smaller text. Updating the public copy is a separate publication step; the existing `downloads/` files remain unchanged by the default command.

The interview guide includes sample explanations to learn and adapt. Keep a record of changes you personally practise; the kit does not create employment history or substitute for your own code understanding.

The print master preserves vector text/line art, embeds every used font, and embeds the full-resolution 1254px logo with lossless compression. Its A4 CropBox/TrimBox match the page. Compatible readers are asked to print at actual size. `output/pdf/PRINT_SETTINGS.txt` explains the remaining printer settings; driver quality cannot be forced by a PDF. The HTML companion also shows a screen-only print note. No operating-system printer defaults are changed.
