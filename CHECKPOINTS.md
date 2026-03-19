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
