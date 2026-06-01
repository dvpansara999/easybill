# Permanent Development Workspace

The permanent development workspace is the canonical Supabase-backed validation dataset for easyBILL. It lives in the current Supabase project and uses two dedicated fake accounts:

- Primary account: normal browser, Playwright, sync, PDF, desktop, and mobile validation.
- Secondary account: read-only-for-normal-testing isolation account for RLS and cross-user visibility checks.

Neither account may be used for real business operations.

## Environment

Configure these values locally or in a trusted CI/dev environment. Do not commit real passwords or service-role keys.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SERVER_DATA_ENCRYPTION_KEY=
SERVER_DATA_HASH_KEY=

DEV_WORKSPACE_EMAIL=
DEV_WORKSPACE_PASSWORD=
DEV_WORKSPACE_USER_ID=
DEV_WORKSPACE_SECONDARY_EMAIL=
DEV_WORKSPACE_SECONDARY_PASSWORD=
DEV_WORKSPACE_SECONDARY_USER_ID=
DEV_WORKSPACE_CONFIRM=EASYBILL_DEV_WORKSPACE
```

The scripts refuse to run unless the configured Supabase auth users exist and their emails match the configured user ids.

## Commands

Create the auth users if they do not exist:

```bash
npm run dev-workspace:create-accounts
```

Seed or reset the primary development workspace:

```bash
npm run seed-dev-workspace
npm run reset-dev-workspace
```

Seed or reset the secondary isolation workspace only when explicitly intended:

```bash
npm run seed-dev-workspace -- --include-secondary
npm run reset-dev-workspace -- --secondary
```

Run a fast health check before browser-level verification:

```bash
npm run validate-dev-workspace
```

## Safety Rules

- No global deletes are allowed.
- Seed and reset always verify the configured auth user id and email before mutation.
- Normal reset targets only the primary account.
- The secondary account is not a Playwright baseline and should not be mutated during normal test runs.
- Storage paths must remain scoped under `{userId}/` in `logos` and `invoice-pdfs`.
- Seeded values are realistic but fake.

## Seeded Data

The primary workspace contains a completed business profile, invoice settings, template/font settings, 25-50 products, 100+ invoices across multiple months and statuses, invoice-derived customers, invoice history, sync states, logo storage, and cached PDF exports.

The secondary workspace contains a smaller stable dataset for RLS and isolation validation only.

## Browser Validation Checklist

Future AI agents and developers should use the primary account to validate:

- login, logout, and session persistence,
- dashboard statistics and charts,
- product create/edit/delete/search,
- invoice-derived customer search and detail pages,
- invoice create/edit/view/delete,
- PDF download by unique invoice id,
- template and font persistence,
- profile, logo, and settings updates,
- cross-device refresh with two browser contexts,
- desktop and mobile layouts.

Use the secondary account only to prove it cannot see primary rows or storage.
