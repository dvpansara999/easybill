# Project Safe Points

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
