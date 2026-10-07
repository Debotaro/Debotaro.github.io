# Frontend job application materials

This folder contains Deboraj Sarkar's résumé source and interview preparation. The résumé uses the supplied professional details and verified personal projects. Employment, education, certifications and results are added only when confirmed.

- `resume.json`: editable résumé content used by the PDF and HTML builder.
- `RESUME.md`: readable editable résumé.
- `INTERVIEW_PREPARATION.md`: explanations, exercises and a practice schedule grounded in the project source.

The public résumé deliveries live in `downloads/`. Source and QA helpers remain separate from those downloads.

To regenerate the résumé after editing confirmed facts in `resume.json`:

```text
python -m pip install -r career/requirements.txt
python career/build_resume.py
```

The builder produces a text-based PDF, printable HTML and Markdown content. Review the rendered PDF after any content change; it should stay legible and, with the current project-based content, fit one page. A longer education or employment history may need a second page rather than smaller text.

The interview guide includes sample explanations to learn and adapt. Keep a record of changes you personally practise; the kit does not create employment history or substitute for your own code understanding.
