# Release Checklist

Before merging to `main`, verify the preview deployment and walk through each of these checks:

## Deployment Confidence Gate

For changes touching authentication, invoices, PDF generation, templates, fonts, synchronization, or account lifecycle, the change is not deployment-ready until all matching gates pass:

- `npm run verify`
- `npm run validate-dev-workspace`
- the relevant `npm run test:e2e:supabase:*` suite

Use `npm run confidence:deployment` for a full release-confidence pass. The browser run must remain clean of uncaught page exceptions, React runtime errors, hydration errors, and unexpected same-origin failed app/API requests.

- Create invoice
- Edit invoice
- View invoice
- PDF download
- Customer open via phone
- Customer open via GSTIN fallback
- Customer open via legacy fallback
- Create-invoice customer prefill from customer profile
- Customer search by name, phone, and GSTIN
- Amount in words visible once on every template preview
- Amount in words visible on invoice view
- Amount in words visible on downloaded/exported PDF
- Logo upload / replace / remove
- Invoice numbering preview
- Mobile landing / share branding
- Safari / iPhone icon check
- Business Profile page applied everywhere necessary
- Settings page applied everywhere necessary
- Templates page working correctly
- Selected typography (font size and style) applied everywhere necessary
- Setup pages save data and apply it to the correct fields every time
- Dashboard load, settings load, tab refocus, and PDF download do not show obviously excessive auth/session requests
- Invoice PDF cleanup route works with safe seeded test data
- Logo orphan cleanup route works with safe seeded test data

## Production Safety Rules

- Merge to `main` only after a Vercel preview deployment has been reviewed.
- Require CI to pass before merge: lint, typecheck, and regression tests.
- Treat `invoice.id` as the only internal invoice identity.
- Review storage, migration, PDF export, and responsive UI impact before merge.
- Verify `CRON_SECRET` is configured in production.
- Verify `SUPABASE_SERVICE_ROLE_KEY` is configured in production.
- Verify `/api/cron/purge-invoice-pdfs` and `/api/cron/purge-logo-orphans` require the expected auth.
- Verify the logo orphan cron is registered in production.
- Check Supabase Auth request trends after deploy and confirm the request pattern is calmer than before.
- Do not add more `invoice_pdf_exports` indexes unless real query evidence shows the current indexes are insufficient.
