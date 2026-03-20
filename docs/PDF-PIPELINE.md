# PDF pipeline (invoice download)

## Endpoint

- **`POST /api/invoice-pdf`**
- **Body:** `{ "invoiceId": "<invoiceNumber>", "mode": "download" | "print" }`
- **Auth:** Supabase session cookie.
- **Success:** `application/pdf` bytes + headers `X-EasyBill-Pdf-Engine: playwright-setcontent`, `X-EasyBill-Pdf-Ms`.

## Flow

1. **`app/api/invoice-pdf/route.ts`** — server-authoritative fetch from `user_kv` (invoice, business, settings, template).
2. **`normalizeInvoiceForPdf`** — recompute line totals from qty/price/tax.
3. **`buildInvoicePdfHtml`** — build standalone HTML (all styles inline, no app navigation).
4. **`generateInvoicePdfBuffer`** — launch Playwright Chromium, `page.setContent(html, { waitUntil: "load" })`, short wait, then `page.pdf(...)`.

## Why this pipeline

- No `/invoice-print` route hop.
- Deterministic static render: no readiness protocol, no DOM event signaling.
- Lower runtime overhead than hydrating the full app route before print.

## Ops (Vercel)

- `vercel.json` sets function resources for `app/api/invoice-pdf/route.ts`.
- `next.config.ts` includes `@sparticuz/chromium` and `playwright-core` tracing for serverless packaging.

## Client

- `app/(app)/dashboard/invoices/view/[id]/page.tsx` downloads the API response.
- Fallback remains available (`html2canvas + jsPDF`) only when server PDF fails.
