/** Supabase Storage bucket for persisted invoice PDFs (create in dashboard + policies). */
export const INVOICE_PDF_BUCKET = "invoice-pdfs"

/** PDFs older than this are removed by the cron job. */
export const INVOICE_PDF_RETENTION_DAYS = 45

export function sanitizeInvoicePdfFileBase(invoiceNumber: string): string {
  return String(invoiceNumber || "invoice").replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 80) || "invoice"
}
