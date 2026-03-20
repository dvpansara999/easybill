import { NextResponse } from "next/server"
import { buildInvoicePrintLocalStorageSeed } from "@/lib/invoicePdfLocalStorageSeed"
import { parseJsonLoose, pdfError } from "@/lib/server/invoicePdfRouteHelpers"
import { generateInvoicePdfBuffer } from "@/lib/server/generateInvoicePdfBuffer"
import { normalizeInvoiceForPdf } from "@/lib/server/normalizeInvoiceForPdf"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revealSensitiveDataFromStorage } from "@/lib/sensitiveData"

/** Vercel serverless: allow enough time for Chromium boot + navigation. */
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

function deriveBaseUrl(req: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  if (envUrl) {
    const normalized = envUrl.startsWith("http") ? envUrl : `https://${envUrl}`
    return normalized.replace(/\/$/, "")
  }
  const reqUrl = new URL(req.url)
  return `${reqUrl.protocol}//${reqUrl.host}`
}

type PdfRequestBody = {
  invoiceId?: string
  mode?: "print" | "download"
}

export async function POST(req: Request) {
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
    "invoiceTemplateFontId",
    "invoiceTemplateFontSize",
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

  let invoiceData = normalizeInvoiceForPdf(found as Record<string, unknown>)
  const fileInvoiceNumber = String((invoiceData as { invoiceNumber?: string }).invoiceNumber || "invoice")

  const businessRaw = toRawString(getKvOrBundle("businessProfile"))
  const businessDataRaw = businessRaw ? revealSensitiveDataFromStorage("businessProfile", businessRaw) : null

  const templateId = String(getKvOrBundle("invoiceTemplate") || "classic-default")
  const typographySettings = {
    fontId: String(getKvOrBundle("invoiceTemplateFontId") || "system"),
    fontSize: Number(getKvOrBundle("invoiceTemplateFontSize") || 10),
  }

  const invoiceVisibilityRaw = toRawString(getKvOrBundle("invoiceVisibility"))
  const exportSettings: Record<string, unknown> = {
    dateFormat: String(getKvOrBundle("dateFormat") || "YYYY-MM-DD"),
    amountFormat: String(getKvOrBundle("amountFormat") || "indian"),
    showDecimals: String(getKvOrBundle("showDecimals") || "true") === "true",
    currencySymbol: String(getKvOrBundle("currencySymbol") || "₹"),
    currencyPosition: String(getKvOrBundle("currencyPosition") || "before"),
    invoiceVisibility: parseJsonLoose(invoiceVisibilityRaw) || undefined,
  }

  const lsSeed = buildInvoicePrintLocalStorageSeed({
    invoice: invoiceData,
    templateId,
    businessProfileRaw: businessDataRaw,
    exportSettings,
    typography: typographySettings,
  })
  const lsEntries = Object.entries(lsSeed) as [string, string][]

  const baseUrl = deriveBaseUrl(req)
  const result = await generateInvoicePdfBuffer({
    baseUrl,
    lsEntries,
    fileInvoiceNumber,
  })

  if (!result.ok) {
    return pdfError(result.message, result.code, result.httpStatus)
  }

  return new NextResponse(Buffer.from(result.pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": mode === "print" ? "inline" : `attachment; filename=Invoice-${fileInvoiceNumber}.pdf`,
      "Cache-Control": "no-store, private",
      "X-EasyBill-Pdf-Engine": "playwright-chromium",
      "X-EasyBill-Pdf-Ms": String(result.elapsedMs),
    },
  })
}
