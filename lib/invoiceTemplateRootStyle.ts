import type { CSSProperties } from "react"

export type InvoiceTemplateRenderContext = "screen" | "pdf"

/**
 * Cross-browser typography scaling for invoice templates.
 * - `screen`: transform + width compensation (matches preview / mobile; rem from global html).
 * - `pdf`: reserved for future print paths; screen preview uses `screen`.
 */
export function invoiceTemplateRootTypographyStyle(
  fontFamily: string,
  fontSize: number | undefined,
  context: InvoiceTemplateRenderContext = "screen"
): CSSProperties {
  const base = 14
  const fs = fontSize && Number.isFinite(fontSize) ? Math.max(7, Math.min(17, fontSize)) : base

  if (context === "pdf") {
    return {
      fontFamily,
      fontSize: `${fs}px`,
      width: "100%",
      maxWidth: "100%",
      transform: "none",
    }
  }

  const s = fs / base
  return {
    fontFamily,
    fontSize: `${fs}px`,
    transform: `scale(${s})`,
    transformOrigin: "top left",
    width: `${100 / s}%`,
  }
}
