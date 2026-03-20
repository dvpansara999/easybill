# Invoice PDF pipeline (SaaS-style)

easyBILL follows the same pattern as typical B2B SaaS: **the authoritative invoice lives in your account (database)**; the **device only requests a PDF** built on the server.

## Contract

- **Endpoint:** `POST /api/invoice-pdf`
- **Body:** `{ "invoiceId": "<invoice number>", "mode": "download" | "print" }`
- **Auth:** Supabase session cookie (same as the rest of the app).
- **Success:** `application/pdf` bytes + headers `X-EasyBill-Pdf-Engine`, `X-EasyBill-Pdf-Ms`.
- **Failure:** `application/json` `{ "error": "…", "code": "…" }` — see `lib/pdfApiContract.ts`.

Legacy **POST with full `invoice` JSON in the body** is **no longer supported** (real SaaS loads from `user_kv` only).

## Server flow

1. **`app/api/invoice-pdf/route.ts`** — `dynamic = "force-dynamic"`, `maxDuration` for Vercel.
2. **Load** invoice + business + template + settings from **`user_kv`** (decrypt invoices/business as today).
3. **`normalizeInvoiceForPdf`** (`lib/server/normalizeInvoiceForPdf.ts`) — recomputes each line `total` from qty, price, and tax % so PDF math matches the app formulas.
4. **`buildInvoicePrintLocalStorageSeed`** — builds the exact `localStorage` map `/invoice-print` expects.
5. **`generateInvoicePdfBuffer`** (`lib/server/generateInvoicePdfBuffer.ts`) — single owned pipeline:
   - Launch Chromium (local: `playwright`; Vercel: `@sparticuz/chromium` + `playwright-core`).
   - `addInitScript` → seed `localStorage` **before** first navigation (one `goto`, no reload).
   - Open `/invoice-print`, wait for `__EASYBILL_PDF_READY` + minimum text length.
   - `document.fonts.ready` + short paint delay.
   - `page.pdf()` — A4, `printBackground: true`, `deviceScaleFactor: 2`.

## Print document

- **`/invoice-print`** — `renderContext: "pdf"` + `html` root `rem` scaling (`lib/htmlRemForInvoicePdf.ts`) so typography matches template font size across devices in the **vector** output.

## Client (invoice view)

- Parses **`error` / `code`** from JSON on 4xx/5xx or malformed PDF responses (no silent failure).
- **High-quality backup** — html2canvas + PNG slices **only** on network / unexpected errors, not when the server returns a clear business error (auth, not found, PDF timeout, etc.).

## Legacy browser route

- **`/invoice-pdf`** redirects to `/dashboard/invoices` (PDFs are not authored on that page).

## Operations

- **Vercel:** Function duration and memory must allow Chromium cold start (`vercel.json` sets **3008 MB** and **60s** for `app/api/invoice-pdf/route.ts`). `@sparticuz/chromium` needs its **`bin/`** Brotli files in the deployment — `next.config.ts` uses **`outputFileTracingIncludes`** for `/api/invoice-pdf` so they are not omitted from the serverless bundle.
- **Playwright + headless shell:** We use **`headless: false`** when launching with `@sparticuz/chromium` because its `args` already include **chrome-headless-shell**; Playwright’s default `headless: true` can conflict and prevent launch.
- **Logs:** `[invoice-pdf]` lines for success timing and failures; full launch errors are logged server-side.

### If you still see “PDF engine failed to start”

1. Redeploy after `npm install` (ensure `@sparticuz/chromium` is in **dependencies**, not devDependencies).
2. Confirm **Node 20+** on the Vercel project (matches `@sparticuz/chromium` engines).
3. Open **Vercel → Deployment → Functions** and check the **invoice-pdf** log line after the error (often “input directory does not exist” = missing `bin` trace, fixed by `outputFileTracingIncludes`).
4. If your plan caps memory below **3008 MB**, lower `vercel.json` `memory` to the max allowed (e.g. **2048** or **1024**); below ~1 GB Chromium may still fail to extract/start.
