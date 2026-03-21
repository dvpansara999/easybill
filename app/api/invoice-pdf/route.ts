import { NextResponse } from "next/server"
import { buildInvoicePdfHtml } from "@/lib/server/buildInvoicePdfHtml"
import { generateInvoicePdfBuffer } from "@/lib/server/generateInvoicePdfBuffer"
import { parseJsonLoose, pdfError } from "@/lib/server/invoicePdfRouteHelpers"
import { normalizeInvoiceForPdf } from "@/lib/server/normalizeInvoiceForPdf"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revealSensitiveDataFromStorage } from "@/lib/sensitiveData"
import type { InvoiceVisibilitySettings } from "@/lib/invoiceVisibilityShared"
import { defaultTemplateTypography, getTemplateFontCss } from "@/lib/templateTypography"

export const maxDuration = 60

export const dynamic = "force-dynamic"

/** Playwright + Buffer responses need the Node runtime (not Edge). */
export const runtime = "nodejs"

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
  templateId?: string
  /** Same source as invoice view / Templates page — preferred over Supabase KV (avoids debounce lag). */
  fontId?: string
  fontSize?: number | string
  fontFamily?: string
}

function sanitizePdfFontSize(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.max(7, Math.min(17, Math.round(v)))
  }
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.trim())
    if (Number.isFinite(n)) return Math.max(7, Math.min(17, Math.round(n)))
  }
  return null
}

function sanitizePdfFontId(v: unknown): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s || null
}

function logPdfDebug(event: string, meta: Record<string, unknown>) {
  console.info("[invoice-pdf]", event, meta)
}

export async function POST(req: Request) {
  const started = Date.now()
  const body = (await req.json().catch(() => ({}))) as PdfRequestBody
  const mode = body.mode === "print" ? "print" : "download"
  const sanitizeTemplateId = (v: unknown): string | null => {
    if (typeof v !== "string") return null
    const s = v.trim()
    return s ? s : null
  }

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
    "templateTypography",
    "invoiceTemplateFontId",
    "invoiceTemplateFontSize",
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
  const storedTemplateId = String(getKvOrBundle("invoiceTemplate") || "classic-default")
  const templateId = sanitizeTemplateId(body.templateId) || storedTemplateId
  const templateTypography = parseJsonLoose(toRawString(getKvOrBundle("templateTypography"))) as
    | { fontId?: string; fontSize?: number | string; fontFamily?: string }
    | null
  const kvFontId = String(
    getKvOrBundle("invoiceTemplateFontId") || templateTypography?.fontId || defaultTemplateTypography.fontId
  )
  const storedFontSizeRaw = Number(
    getKvOrBundle("invoiceTemplateFontSize") ?? templateTypography?.fontSize ?? defaultTemplateTypography.fontSize
  )
  const kvFontSize = Number.isFinite(storedFontSizeRaw)
    ? Math.max(7, Math.min(17, Math.round(storedFontSizeRaw)))
    : defaultTemplateTypography.fontSize
  const kvFontFamily =
    (templateTypography?.fontFamily && String(templateTypography.fontFamily)) || getTemplateFontCss(kvFontId)

  const bodyFontId = sanitizePdfFontId(body.fontId)
  const bodyFontSize = sanitizePdfFontSize(body.fontSize)
  const bodyFontFamily =
    typeof body.fontFamily === "string" && body.fontFamily.trim() ? body.fontFamily.trim() : null

  const resolvedFontId = bodyFontId || kvFontId
  const resolvedFontSize = bodyFontSize ?? kvFontSize
  const resolvedFontFamily =
    bodyFontFamily || (bodyFontId ? getTemplateFontCss(bodyFontId) : null) || kvFontFamily

  logPdfDebug("request", {
    mode,
    invoiceId: body.invoiceId,
    templateId,
    fontId: resolvedFontId,
    fontSize: resolvedFontSize,
    typographySource: bodyFontSize != null || bodyFontId || bodyFontFamily ? "body" : "kv",
    userIdSuffix: user.id.slice(-6),
  })

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
    fontFamily: resolvedFontFamily,
    fontSize: resolvedFontSize,
  })
  const result = await generateInvoicePdfBuffer({ html })

  if (!result.ok) {
    logPdfDebug("engine-error", {
      invoiceId: body.invoiceId,
      templateId,
      code: result.code,
      httpStatus: result.httpStatus,
      message: result.message,
    })
    return pdfError(result.message, result.code, result.httpStatus)
  }

  // Guard: avoid returning 204/empty bodies if the PDF engine produced no bytes.
  if (result.pdfBytes.byteLength < 8) {
    logPdfDebug("invalid-pdf-empty", {
      invoiceId: body.invoiceId,
      templateId,
      byteLength: result.pdfBytes.byteLength,
    })
    return pdfError("PDF engine returned an empty document.", "PDF_BUILD", 500)
  }
  const [b0, b1, b2, b3] = result.pdfBytes
  const looksLikePdf = b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46 // %PDF
  if (!looksLikePdf) {
    logPdfDebug("invalid-pdf-magic", {
      invoiceId: body.invoiceId,
      templateId,
      byteLength: result.pdfBytes.byteLength,
    })
    return pdfError("PDF engine returned non-PDF bytes.", "PDF_BUILD", 500)
  }

  const elapsedMs = Date.now() - started

  // Use Buffer + explicit 200 — some dev stacks mishandle Uint8Array bodies as empty (HTTP 204).
  const pdfBuffer = Buffer.from(result.pdfBytes)

  logPdfDebug("pdf-success", {
    invoiceId: body.invoiceId,
    templateId,
    byteLength: pdfBuffer.length,
    ms: elapsedMs,
  })

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdfBuffer.length),
      "Content-Disposition": mode === "print" ? "inline" : `attachment; filename=Invoice-${fileInvoiceNumber}.pdf`,
      "Cache-Control": "no-store, private",
      "X-EasyBill-Pdf-Engine": "playwright-setcontent",
      "X-EasyBill-Pdf-Ms": String(elapsedMs),
    },
  })
}
