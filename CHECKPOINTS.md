# Project Safe Points

## SAFE_POINT: before chaos

Created: 2026-03-20

Meaning of this checkpoint:
- Baseline state immediately after full architecture study and lint health check.
- No code changes have been applied yet in this cleanup/fix phase.
- Use this as the exact restore target before any broad bug-fixing or refactor work begins.

How to use:
- If user says exactly: `before chaos`
- Treat this as a restore target and bring code back to this checkpoint state.

## SAFE_POINT: everything is working with supabase except logo re-upload

Created: 2026-03-19

Meaning of this checkpoint:
- Supabase flows are working across the app.
- Logo re-upload issue is still unresolved (known issue).
- The attempted logo re-upload fix was rolled back.

How to use:
- If user says exactly: `everything is working with supabase except logo re-upload`
- Treat this as a restore target and bring code back to this checkpoint state.

## SAFE_POINT: everything is working with supabase

Created: 2026-03-19

Meaning of this checkpoint:
- Supabase auth + data flows are working.
- Business profile logo flow supports remove + re-upload with crop/shape in business profile.
- Report bug/feedback page flow is available in settings.

How to use:
- If user says exactly: `everything is working with supabase`
- Treat this as a restore target and bring code back to this checkpoint state.

## SAFE_POINT: stable desktop v0.1

Created: 2026-03-19

Meaning of this checkpoint:
- App deployed on Vercel for desktop.
- Core flows (auth/setup/invoice/settings/logo) verified for stability at v0.1.

How to use:
- If user says exactly: `stable desktop v0.1`
- Treat this as a restore target for the latest verified stable desktop build.

## SAFE_POINT: Stable for windows and mobile v0.1

Created: 2026-03-20

Meaning of this checkpoint:
- Verified stable UI and core flows across Windows web (desktop) and mobile breakpoints at v0.1.

How to use:
- If user says exactly: `Stable for windows and mobile v0.1`
- Treat this as a restore target for the latest verified stable cross-device v0.1 build.

## SAFE_POINT: template cross-device parity ON

Created: 2026-03-19

Meaning of this checkpoint:
- `lib/templateDeviceParity.ts` has `TEMPLATE_CROSS_DEVICE_PARITY = true`.
- Large preview uses desktop-equivalent scale on all devices; invoice view uses fixed 900px width below `lg` with horizontal scroll.

How to revert mobile behavior only:
- Set `TEMPLATE_CROSS_DEVICE_PARITY` to `false` in `lib/templateDeviceParity.ts` (see file comment).

How to use:
- If user says exactly: `template cross-device parity ON`
- Treat as restore target for this parity behavior.

## SAFE_POINT: A4 preview/view/download replacement plan start v0.1

Created: 2026-03-20

Meaning of this checkpoint:
- Baseline state before we refactor the Templates long preview, Invoice view, and PDF/download pipeline into one deterministic A4 ecosystem.
- Playwright may fail silently on some real mobile browsers; HTML2Canvas fallback is fragile and still needs replacement.

How to use:
- If user says exactly: `A4 preview/view/download replacement plan start v0.1`
- Treat this as the restore target before starting the full replacement refactor.

## SAFE_POINT: SaaS-style PDF pipeline v1.1

Created: 2026-03-20

Meaning of this checkpoint:
- PDF API is **server-authoritative**: requires `invoiceId`, loads from `user_kv`, `normalizeInvoiceForPdf`, structured JSON errors (`lib/pdfApiContract.ts`).
- Vector PDFs via **Playwright setContent** (`buildInvoicePdfHtml` + `generateInvoicePdfBuffer`); route is thin + `force-dynamic`.
- Client shows API errors clearly; raster backup only for network/unexpected failures.

How to use:
- If user says exactly: `SaaS-style PDF pipeline v1.1`
- Treat as restore target.

## SAFE_POINT: PDF pipeline complete v1.0

Created: 2026-03-20

Meaning of this checkpoint:
- Single-navigation Playwright (`addInitScript` + one `goto`); shared `buildInvoicePrintLocalStorageSeed`; response headers `X-EasyBill-Pdf-*`; 90s client abort + notices for vector vs raster fallback.
- Legacy `/invoice-pdf` redirects to `/dashboard/invoices`; `docs/PDF-PIPELINE.md` documents the flow.

How to use:
- If user says exactly: `PDF pipeline complete v1.0`
- Treat as restore target for the finished PDF system.

## SAFE_POINT: Canonical PDF typography + high-quality fallback v0.3

Created: 2026-03-20

Meaning of this checkpoint:
- `/invoice-print` uses `renderContext: "pdf"`: no transform on template root; `<html>` font-size scaled via `htmlFontSizePxForInvoicePdf` so rem matches screen scale at the same template font size.
- Playwright uses `browser.newContext` with `deviceScaleFactor: 2`, font wait + short paint delay, success logging.
- Client raster fallback: html2canvas scale up to 3× DPR (min 2), PNG slices in PDF (lossless vs JPEG).

How to use:
- If user says exactly: `Canonical PDF typography + high-quality fallback v0.3`
- Treat this as the restore target for this PDF quality pass.

## SAFE_POINT: Playwright + raster PDF fixes v0.2

Created: 2026-03-20

Meaning of this checkpoint:
- Vercel: `@sparticuz/chromium` + `playwright-core` for `/api/invoice-pdf`; `maxDuration` 60; print CSS strips template `transform` for headless PDF.
- Client fallback: html2canvas `onclone` fixes near-invisible capture node; JPEG slices per page (no duplicate full PNG embeds); validates `%PDF` before treating response as PDF.

How to use:
- If user says exactly: `Playwright + raster PDF fixes v0.2`
- Treat this as the restore target for this PDF pipeline state.

## SAFE_POINT: Mobile font scaling + PDF fallback fixes v0.1

Created: 2026-03-20

Meaning of this checkpoint:
- Invoice templates scale typography with `transform` + width compensation (Safari/iOS ignores CSS `zoom`).
- `/api/invoice-pdf` uses Playwright’s bundled Chromium (no Windows-only hardcoded path); optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for a custom binary.
- Client PDF fallback captures a dedicated unpaginated DOM node and tiles pages in jsPDF with correct Y offsets.

How to use:
- If user says exactly: `Mobile font scaling + PDF fallback fixes v0.1`
- Treat this as the restore target for these fixes.

## SAFE_POINT: stable playwright download

Created: 2026-03-21

Meaning of this checkpoint:
- Download flow confirms vector PDF path is active (`Vector PDF (Playwright)` notice shown in invoice view).
- Route is pinned to local Playwright Chromium executable for localhost verification.
- Template selection and Playwright output alignment are stable at this point.

How to use:
- If user says exactly: `stable playwright download`
- Treat this as the restore target for this verified Playwright download state.

## SAFE_POINT: before shared-template-unification

Created: 2026-03-21

Meaning of this checkpoint:
- State right before unifying invoice preview/view/PDF to a single shared template component path.
- Use this to fully roll back if the shared-template refactor is not desired.

How to use:
- If user says exactly: `before shared-template-unification`
- Treat this as the restore target before this refactor started.
