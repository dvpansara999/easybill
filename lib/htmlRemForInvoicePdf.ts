const TYPO_BASE = 14

/**
 * Tailwind text utilities use `rem` relative to `<html>`. On screen we fake sizing with
 * `transform: scale(fontSize/14)`. For `/invoice-print` (vector PDF) we avoid transforms and
 * instead scale the root `rem` so PDF output matches the same effective typography.
 */
export function htmlFontSizePxForInvoicePdf(fontSize: number) {
  const fs = Number.isFinite(fontSize) ? Math.max(7, Math.min(17, fontSize)) : TYPO_BASE
  return `${(16 * fs) / TYPO_BASE}px`
}
