import type { CSSProperties } from "react"

/**
 * Cross-browser typography scaling for invoice templates.
 * Tailwind text utilities are rem-based (html root), so we scale the whole subtree.
 * iOS Safari does not reliably support CSS `zoom`, so we use transform + width compensation.
 */
export function invoiceTemplateRootTypographyStyle(
  fontFamily: string,
  fontSize: number | undefined
): CSSProperties {
  const base = 14
  const fs = fontSize && Number.isFinite(fontSize) ? fontSize : base
  const s = fs / base
  return {
    fontFamily,
    fontSize: `${fs}px`,
    transform: `scale(${s})`,
    transformOrigin: "top left",
    width: `${100 / s}%`,
  }
}
