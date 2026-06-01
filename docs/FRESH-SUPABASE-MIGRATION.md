# Fresh Supabase Migration Checklist

Use this checklist when moving easyBILL to a brand-new Supabase project. The canonical database bootstrap file is `supabase/schema.sql`.

Do not run `supabase/invoice_pdf_exports.sql` for a fresh project. It is legacy support material and is not required after `schema.sql` has been applied.

## Preflight

- [ ] Confirm the current branch has passed `npm run verify`.
- [ ] Confirm `supabase/schema.sql` is the only schema file required for a fresh project.
- [ ] Confirm `schema.sql` includes the Fresh Project Setup comments, all tables, all RLS policies, all RPCs, and storage object policies.
- [ ] Confirm `schema.sql` has `invoice_pdf_exports_update_own`.
- [ ] Confirm `user_settings.currency_symbol` defaults to `₹`.
- [ ] Generate stable production secrets for:
  - `SERVER_DATA_ENCRYPTION_KEY`
  - `SERVER_DATA_HASH_KEY`
  - `CRON_SECRET`
- [ ] Decide whether this is a clean launch with no old data or a data migration from an existing Supabase project.
- [ ] If migrating existing data, export data before changing production env vars.

## Fresh Supabase Project Setup

- [ ] Create a new Supabase project.
- [ ] Enable the required auth providers and redirect URLs for the deployed app domain.
- [ ] Run the full contents of `supabase/schema.sql` in the Supabase SQL editor.
- [ ] Create a private Storage bucket named `logos`.
- [ ] Create a private Storage bucket named `invoice-pdfs`.
- [ ] Confirm Storage policies from `schema.sql` are present on `storage.objects`.
- [ ] Confirm these tables exist:
  - `profiles`
  - `user_settings`
  - `customers`
  - `products`
  - `invoice_sequences`
  - `invoices`
  - `invoice_items`
  - `invoice_history`
  - `invoice_pdf_exports`
- [ ] Confirm these RPCs/functions exist:
  - `touch_updated_at`
  - `normalize_reset_month_day`
  - `compute_invoice_scope`
  - `upsert_customer_from_invoice`
  - `create_invoice_record`
  - `update_invoice_record`
  - `delete_invoice_record`
  - `soft_delete_invoice_record`

## Runtime Environment

Configure these variables in the deployment environment:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SERVER_DATA_ENCRYPTION_KEY`
- [ ] `SERVER_DATA_HASH_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `CRON_SECRET`

Optional but expected in normal deployments:

- [ ] `NEXT_PUBLIC_AUTH_MODE=supabase`
- [ ] `NEXT_PUBLIC_SITE_URL`

Do not rotate `SERVER_DATA_ENCRYPTION_KEY` or `SERVER_DATA_HASH_KEY` after real sealed data is written unless a key-rotation migration exists.

## Cutover

- [ ] Deploy with the new Supabase URL and anon key.
- [ ] Deploy with the new server encryption/hash keys.
- [ ] Deploy with the new service role key and cron secret.
- [ ] Confirm `/api/cron/purge-invoice-pdfs` rejects requests without the expected secret.
- [ ] Confirm `/api/cron/purge-logo-orphans` rejects requests without the expected secret.
- [ ] Confirm app startup does not report missing Supabase env vars.

## Fresh Project Dry Run

Record `PASS` or `FAIL` for each step. A `FAIL` must include the blocker and fix.

| Step | Result | Notes |
|---|---|---|
| 1. New Supabase project |  |  |
| 2. Run `schema.sql` |  |  |
| 3. Create `logos` bucket |  |  |
| 4. Create `invoice-pdfs` bucket |  |  |
| 5. Add env variables |  |  |
| 6. Start app |  | Confirm unauthenticated users reach login/signup without `No active workspace user.` |
| 7. Create account |  |  |
| 8. Complete onboarding |  |  |
| 9. Create product |  |  |
| 10. Create customer |  |  |
| 11. Create invoice |  |  |
| 12. Download PDF |  |  |
| 13. Verify sync |  |  |

## Verification

- [ ] Run `npm run verify`.
- [ ] Run `npm run test:e2e` if Playwright is operational.
- [ ] If Playwright is blocked, document the exact blocker and whether it occurs before app scenarios execute.
- [ ] Verify business profile create/edit/reload.
- [ ] Verify product create/edit/delete/reload.
- [ ] Verify customer search by name, phone, and GSTIN.
- [ ] Verify invoice create/edit/delete/reload.
- [ ] Verify PDF download and PDF export cache behavior.
- [ ] Verify sync after reload and browser refocus.
- [ ] Verify no app copy instructs users to run `supabase/invoice_pdf_exports.sql`.

Known local blocker to watch for:

- `npm run test:e2e` may fail before app scenarios run with `EPERM: operation not permitted, open 'D:\Projects\invoice-app\next-env.d.ts'`. If this occurs, document it as an environment blocker and do not claim e2e app coverage.

## Rollback

- [ ] Keep old Supabase project credentials available until the fresh project passes the dry run.
- [ ] If cutover fails before real writes, restore old deployment env vars.
- [ ] If cutover fails after real writes, stop writes first, export affected rows from the new project, then decide whether to replay or discard them before rolling back.
- [ ] Do not reuse sealed production data with different `SERVER_DATA_ENCRYPTION_KEY` or `SERVER_DATA_HASH_KEY`.

## Go/No-Go

Go only when:

- [ ] `npm run verify` passes.
- [ ] E2E passes, or the Playwright blocker is explicitly documented and accepted.
- [ ] Fresh Project Dry Run has no unresolved `FAIL`.
- [ ] Required buckets exist and are private.
- [ ] Required env vars are configured in the deployment environment.
- [ ] Account creation, onboarding, invoice creation, PDF download, and sync are verified against the fresh project.

No-Go if any required schema object, bucket, environment variable, onboarding flow, invoice flow, PDF flow, or sync flow is unverified or failing.
