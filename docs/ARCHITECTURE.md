# easyBILL Architecture Notes

## Core rules

- `invoice.id` is the only stable invoice identity across routes, edits, exports, and cache records.
- `invoiceNumber` is a display label only. Never use it as the primary lookup key.
- Invoice numbering is generated at save time, not when the editor first opens.
- PDF export cache keys depend on `invoice.id` and the render fingerprint.
- Business profile data must be normalized before UI render or PDF render.

## Workspace storage

- User workspace data is stored through the user KV layer.
- Invoices are versioned through the invoice store envelope.
- Settings, business profile, and template settings are normalized before use.

## Invoice lifecycle

- `draft`: saved invoice, no PDF issued yet
- `issued`: user downloaded or shared the PDF
- `paid`: user manually marked payment received

## Operational notes

- Local development should use webpack by default.
- Runtime monitoring can be enabled with `NEXT_PUBLIC_RUNTIME_MONITORING=1`.
- Backup/export uses JSON so a workspace can be restored without hand-copying KV records.
