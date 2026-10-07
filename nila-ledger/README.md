# NILA Ledger

A considered personal finance experience built with React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide, and GSAP. Fictional GBP data makes every interaction usable immediately.

```powershell
npm install
npm run dev
```

```powershell
npm run typecheck
npm run build
npm run preview
```

The production output is `dist/`. Vite uses relative asset URLs, so the output can be served beneath the portfolio hub or independently. All navigation uses hash routes.

## Explore

- `#/`: landing page with a direct **Open the demo** action.
- `#/login`: explicit demo entry, without a password or fake authentication.
- `#/dashboard`: income, spending, running available balance, savings rate, six-month cash flow, category spending, and budget progress.
- `#/transactions`: search, type/category/date filters, date ordering, add/edit/delete, and CSV export of the visible results.
- `#/budget`: seven adjustable category budgets, precise pound inputs, remaining amounts, and overspending indicators.
- `#/reports`: a monthly report with computed totals, budget comparisons, savings history, full transaction record, CSV download, and browser PDF printing.
- `#/settings`: edit the demo display name, storage status, and reset the original fictional data.

Transactions and budgets are stored as integer pennies. All screen summaries and exports derive from the same ledger. Reporting months cover May–October 2026. A £2,840 opening balance precedes the six-month ledger; the available balance is the opening balance plus all recorded income less expenses through the selected month. Budgets are monthly plans shared across reporting months. Changes persist in `localStorage` under `nila-ledger-v1`. If browser storage is unavailable, the app still works for the session and reports that status.

For a PDF, open Reports, choose **Print / save PDF**, and select **Save as PDF** in the browser print dialog. Print styles remove the app navigation and preserve a readable transaction report. The CSV download is an actual file and neutralises spreadsheet formula-leading characters in user-entered text.

No external financial service, account system, or bank connection is used. All data is fictional. Fonts are optional Google Fonts with local fallbacks; no images or external media are required. Keyboard focus, semantic tables, chart descriptions, modal focus containment, reduced-motion behaviour, and small-screen navigation are included.

## Verification

The portfolio root owns the shared Playwright dependency and Chromium installation. With its preview running at `http://localhost:4173`, `node qa/finance-check.mjs` verifies transaction creation, edits, deletion, exact penny-based totals, reload persistence, CSV content, absence of runtime errors, and viewport containment on desktop and iPhone 13 Chromium. Reference screenshots are saved in `qa/`.
