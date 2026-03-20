/**
 * Key/value pairs written to `localStorage` before `/invoice-print` loads (Playwright `addInitScript`).
 * Keeps one source of truth for PDF seeding — no double navigation.
 */
export type InvoicePdfLocalStorageSeed = Record<string, string>

export function buildInvoicePrintLocalStorageSeed(params: {
  invoice: unknown
  templateId: string
  businessProfileRaw: string | null
  exportSettings: Record<string, unknown>
  typography: { fontId?: string; fontSize?: number }
}): InvoicePdfLocalStorageSeed {
  const out: InvoicePdfLocalStorageSeed = {
    pdfInvoice: JSON.stringify(params.invoice),
    invoiceTemplate: params.templateId,
  }

  if (params.businessProfileRaw) {
    out.businessProfile = params.businessProfileRaw
  }

  const s = params.exportSettings
  if (typeof s.dateFormat === "string") out.dateFormat = s.dateFormat
  if (typeof s.amountFormat === "string") out.amountFormat = s.amountFormat
  if (typeof s.showDecimals === "boolean") out.showDecimals = String(s.showDecimals)
  if (typeof s.currencySymbol === "string") out.currencySymbol = s.currencySymbol
  if (typeof s.currencyPosition === "string") out.currencyPosition = s.currencyPosition
  if (s.invoiceVisibility != null) {
    try {
      out.invoiceVisibility = JSON.stringify(s.invoiceVisibility)
    } catch {
      // ignore
    }
  }

  const t = params.typography
  if (t.fontId) out.invoiceTemplateFontId = t.fontId
  if (t.fontSize != null && Number.isFinite(t.fontSize)) {
    out.invoiceTemplateFontSize = String(t.fontSize)
  }

  return out
}
