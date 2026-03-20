/**
 * Stable JSON shape for `/api/invoice-pdf` error responses (SaaS-style client handling).
 */
export type PdfApiErrorBody = {
  error: string
  code:
    | "UNAUTHORIZED"
    | "NOT_FOUND"
    | "INVOICE_ID_REQUIRED"
    | "MISSING_INVOICE"
    | "KV_ERROR"
    | "PDF_ENGINE"
    | "PDF_NAV_TIMEOUT"
    | "PDF_READY_TIMEOUT"
    | "PDF_RENDER"
    | "INTERNAL"
}

export async function parsePdfApiErrorMessage(response: Response): Promise<string> {
  try {
    const j = (await response.json()) as Partial<PdfApiErrorBody>
    if (typeof j.error === "string" && j.error.trim()) return j.error.trim()
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`
}
