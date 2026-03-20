import { NextResponse } from "next/server"
import { buildInvoicePdfHtml } from "@/lib/server/buildInvoicePdfHtml"
import { generateInvoicePdfBuffer } from "@/lib/server/generateInvoicePdfBuffer"
import { parseJsonLoose, pdfError } from "@/lib/server/invoicePdfRouteHelpers"
import { normalizeInvoiceForPdf } from "@/lib/server/normalizeInvoiceForPdf"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revealSensitiveDataFromStorage } from "@/lib/sensitiveData"
import type { InvoiceVisibilitySettings } from "@/lib/invoiceVisibilityShared"

export const maxDuration = 60

export const dynamic = "force-dynamic"

function toRawString(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

type PdfRequestBody = {
  invoiceId?: string
  mode?: "print" | "download"
}

export async function POST(req: Request) {
  const started = Date.now()
  const body = (await req.json().catch(() => ({}))) as PdfRequestBody
  const mode = body.mode === "print" ? "print" : "download"

  if (!body.invoiceId || String(body.invoiceId).trim() === "") {
    return pdfError(
      "Invoice id is required. PDFs are generated only from your saved account data.",
      "INVOICE_ID_REQUIRED",
      400
    )
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return pdfError("Sign in to download invoices.", "UNAUTHORIZED", 401)
  }

  const wantedKeys = [
    "invoices",
    "businessProfile",
    "accountSetupBundle",
    "invoiceTemplate",
    "dateFormat",
    "amountFormat",
    "showDecimals",
    "currencySymbol",
    "currencyPosition",
    "invoiceVisibility",
  ]

  const { data: rows, error } = await supabase
    .from("user_kv")
    .select("key,value")
    .eq("user_id", user.id)
    .in("key", wantedKeys)

  if (error) {
    return pdfError("Unable to load your account data.", "KV_ERROR", 500)
  }

  const kv = new Map<string, unknown>()
  for (const row of rows || []) {
    kv.set(String((row as { key: string }).key), (row as { value: unknown }).value)
  }
  const bundle = parseJsonLoose(kv.get("accountSetupBundle")) || {}
  const getKvOrBundle = (key: string) => {
    const direct = kv.get(key)
    if (direct != null) return direct
    if (bundle && typeof bundle === "object" && key in bundle) return (bundle as Record<string, unknown>)[key]
    return null
  }

  const invoicesRaw = toRawString(getKvOrBundle("invoices"))
  const invoicesDecrypted = invoicesRaw ? revealSensitiveDataFromStorage("invoices", invoicesRaw) : null
  const invoicesParsed = parseJsonLoose(invoicesDecrypted) || []
  const found = Array.isArray(invoicesParsed)
    ? invoicesParsed.find((inv: { invoiceNumber?: string }) => String(inv?.invoiceNumber || "") === String(body.invoiceId))
    : null

  if (!found) {
    return pdfError("Invoice not found.", "NOT_FOUND", 404)
  }

  const invoiceData = normalizeInvoiceForPdf(found as Record<string, unknown>)
  const fileInvoiceNumber = String((invoiceData as { invoiceNumber?: string }).invoiceNumber || "invoice")

  const businessRaw = toRawString(getKvOrBundle("businessProfile"))
  const businessDataRaw = businessRaw ? revealSensitiveDataFromStorage("businessProfile", businessRaw) : null
  const businessObj = businessDataRaw ? (parseJsonLoose(businessDataRaw) as Record<string, unknown> | null) : null

  const invoiceVisibilityRaw = toRawString(getKvOrBundle("invoiceVisibility"))
  const visibility = (parseJsonLoose(invoiceVisibilityRaw) || null) as Partial<InvoiceVisibilitySettings> | null
  const templateId = String(getKvOrBundle("invoiceTemplate") || "classic-default")

  const html = buildInvoicePdfHtml({
    invoice: invoiceData as Record<string, unknown>,
    business: businessObj,
    visibility,
    templateId,
    dateFormat: String(getKvOrBundle("dateFormat") || "YYYY-MM-DD"),
    amountFormat: String(getKvOrBundle("amountFormat") || "indian"),
    showDecimals: String(getKvOrBundle("showDecimals") || "true") === "true",
    currencySymbol: String(getKvOrBundle("currencySymbol") || "₹"),
    currencyPosition: (String(getKvOrBundle("currencyPosition") || "before") === "after" ? "after" : "before") as
      | "before"
      | "after",
  })
  const result = await generateInvoicePdfBuffer({ html })

  if (!result.ok) {
    return pdfError(result.message, result.code, result.httpStatus)
  }

  const elapsedMs = Date.now() - started

  return new NextResponse(Buffer.from(result.pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": mode === "print" ? "inline" : `attachment; filename=Invoice-${fileInvoiceNumber}.pdf`,
      "Cache-Control": "no-store, private",
      "X-EasyBill-Pdf-Engine": "playwright-setcontent",
      "X-EasyBill-Pdf-Ms": String(elapsedMs),
    },
  })
}
