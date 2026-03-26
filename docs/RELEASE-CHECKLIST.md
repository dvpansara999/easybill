# Release Checklist

Before merging to `main`, verify the preview deployment and walk through each of these checks:

- Create invoice
- Edit invoice
- View invoice
- PDF download
- Logo upload / replace / remove
- Invoice numbering preview
- Mobile landing / share branding
- Safari / iPhone icon check
- Business Profile page applied everywhere necessary
- Settings page applied everywhere necessary
- Templates page working correctly
- Selected typography (font size and style) applied everywhere necessary
- Setup pages save data and apply it to the correct fields every time

## Production Safety Rules

- Merge to `main` only after a Vercel preview deployment has been reviewed.
- Require CI to pass before merge: lint, typecheck, and regression tests.
- Treat `invoice.id` as the only internal invoice identity.
- Review storage, migration, PDF export, and responsive UI impact before merge.
