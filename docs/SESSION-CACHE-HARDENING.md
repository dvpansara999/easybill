# Session And Cache Isolation

EasyBill supports one signed-in Supabase account per browser profile. Supabase auth cookies are shared by tabs in the same profile, so a second account should use a separate browser profile, private window, or different browser.

## Browser Storage Allowlist

- Supabase auth cookies: intentionally shared per browser profile and managed by `@supabase/ssr`.
- `authActiveUserId`: tab-scoped session marker in `sessionStorage`.
- `authLastUserId` and `authLastEmail`: auth restore/display markers in `localStorage`.
- `warm-cache:<workspaceKey>::<userId>`: user-scoped workspace warm cache.
- `<workspaceKey>::<userId>`: user-scoped local-mode or setup workspace values.
- `sync-watermark::<userId>`: user-scoped incremental sync watermark.
- `easybill:sync-retry-queue:v1`: global queue container; each queue item must include its own `userId`.
- `easybill:preauth:setupProfileDraft` and `easybill:preauth:setupResumePath`: temporary pre-auth setup state in `sessionStorage`; promoted to user-scoped keys once an authenticated user id exists.

Authenticated business data must not be read from accidental unscoped `localStorage` keys in Supabase mode.
