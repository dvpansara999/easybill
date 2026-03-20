/**
 * Cross-device template parity (mobile vs desktop)
 *
 * When `true`:
 * - **Large preview (A4LargePreview)** uses the same horizontal scale as the desktop sidebar
 *   (~420px logical width → identical typography/layout to desktop preview). Narrow screens
 *   scroll horizontally instead of shrinking the page further.
 * - **Invoice view** keeps a fixed **900px** layout width below `lg` (same as desktop
 *   `max-w-[900px]`), with horizontal scroll — so line breaks match the desktop invoice page
 *   and html2canvas fallback PDF matches.
 *
 * **Server PDF** uses Playwright + server HTML rendering; on-screen parity is for preview +
 * html2canvas fallback.
 *
 * ### Revert
 * Set to `false` and save — mobile preview again scales to container width; invoice view
 * is fully responsive on small screens.
 */
export const TEMPLATE_CROSS_DEVICE_PARITY = true

/** Matches dashboard templates sticky preview column `max-w-[420px]` (approx. scale reference). */
export const DESKTOP_A4_PREVIEW_REFERENCE_WIDTH_PX = 420
