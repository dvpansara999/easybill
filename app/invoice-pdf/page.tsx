import { redirect } from "next/navigation"

/** Legacy route — PDFs are generated via POST `/api/invoice-pdf` (Playwright setContent). */
export default function LegacyInvoicePdfRedirect() {
  redirect("/dashboard/invoices")
}
