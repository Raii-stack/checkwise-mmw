# Checkwise

A browser-based forensic check-digit lab for Mathematics in the Modern World. Built with React, TypeScript and Vite. CSV parsing and validation happen in a Web Worker; optional saved history uses IndexedDB in the same browser. No accounts, backend, database service, or environment variables are required.

## Run

Requires Node.js 22.12+ or 24 and npm.

```sh
npm ci
npm run dev
```

Open the address Vite prints. `npm test` runs the arithmetic, CSV and browser-storage unit tests. `npm run build` checks TypeScript and builds `dist/`; `npm run preview` serves that build locally.

## Sample CSV

Download [checkwise-sample-1200.csv](sample-data/checkwise-sample-1200.csv). It contains the same 1,200 deterministic synthetic records as the app’s **Try sample batch** button. Regenerate it with `npm run sample:generate` after changing the sample-data logic.

## Use

1. Choose a CSV or select **Try sample batch**. The deterministic sample contains 1,200 synthetic records: 900 pass, 300 are flagged, and 224 of those have a possible adjacent swap.
2. Review the totals, search or filter flagged records, and export the errors as CSV.
3. Select **Save run** to keep its summary and flagged rows in this browser. **Saved history** reopens, exports, or deletes saved runs.
4. **How it works** explains both algorithms and their limitations.

Input columns must be in this order:

```csv
invoice_id,identifier_type,identifier_value
DEMO-001,luhn,79927398713
DEMO-002,mod11,1236
DEMO-003,mod11,6X
```

Identifiers are strings, including their final check digit. Preserve leading zeros when preparing files in a spreadsheet. Allowed types are `luhn` and `mod11`, case sensitive. Outer field whitespace is trimmed; values are otherwise not corrected. Luhn accepts 2–32 digits. Mod-11 accepts 1–31 payload digits plus a final digit or uppercase `X`. CSVs may contain a BOM, quoted commas, and quoted newlines. Empty lines are ignored. Record numbers count parsed CSV entries including the header, rather than physical lines.

Batches are capped at 2 MB and 5,000 records. Fields are limited to 80 characters for invoice IDs, 32 for identifier types, and 128 for submitted values. Structural CSV errors reject the whole batch. Row-level format or checksum errors appear in the report. Exports escape spreadsheet formulas. Use **Export errors** for all flagged rows, regardless of the current display filter.

## Mathematics

- **Luhn:** Starting at the right of the payload, double every other digit; subtract 9 when a product exceeds 9. Check digit = `(10 - sum % 10) % 10`.
- **Instructional mod-11:** Apply weights 2 through 7 cyclically from the right of the payload. Check digit = `(11 - sum % 11) % 11`, with 10 represented by `X`. This is a defined demo scheme, not an official TIN or SSS rule.
- **Possible transpositions:** Only after a well-formed value fails its checksum, try each adjacent pair of different digits, including the final digit when numeric. A successful swap is reported as a possibility, never a confirmed correction. `X` is not transposed. Some substitutions can also produce possible swaps; multiple candidates are retained. Luhn cannot detect every swap, including 09 ↔ 90.

Passing a checksum does not establish a valid identity, issued card, legitimate supplier, authentic invoice, or absence of fraud. Duplicate invoice/payment detection is outside this application.

## Local history and privacy

The original file and passing rows are not stored. Each saved run retains its timestamp, filename, algorithm version, totals and flagged rows, including submitted values. Input data is never sent to an application server. Use synthetic data only.

History belongs to the browser profile and site origin. Other users of the same profile can access it. It does not sync across devices or domains; localhost, previews, and the production site each have separate histories. Browser data cleanup, private browsing, or storage eviction can remove it. Export important reports. Storage failures leave the in-memory result available for export. Saved reports are editable browser data, not tamper-proof audit evidence.

## Deploy on Vercel

Production: [checkwise-mmw.vercel.app](https://checkwise-mmw.vercel.app). Project: `checkwise-mmw`, in `Ryan Gopio's projects`.

Import this directory as a Vercel project with the Vite preset, build command `npm run build`, and output directory `dist`. No secrets or service configuration are needed. `vercel.json` includes the static build settings and basic response headers. Deployments may also be created from the local source using the Vercel CLI.

The production site is fully static. Google Fonts serves the optional display fonts; system fonts provide a fallback. All invoice processing and local history remain in the browser.
