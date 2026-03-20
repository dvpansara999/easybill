import { redirect } from "next/navigation"

/** Legacy route — PDFs are generated via POST `/api/invoice-pdf` + `/invoice-print`. */
export default function LegacyInvoicePdfRedirect() {
  redirect("/dashboard/invoices")
}
