import { createHash } from "node:crypto"
import { normalizeBusinessProfile } from "@/lib/businessProfile"
import { generateInvoicePdfBuffer } from "@/lib/server/generateInvoicePdfBuffer"
import { parseJsonLoose } from "@/lib/server/invoicePdfRouteHelpers"
import { findInvoiceById, normalizeInvoiceStorePayload } from "@/lib/invoice"
import { normalizeInvoiceForPdf } from "@/lib/server/normalizeInvoiceForPdf"
import { revealSensitiveDataFromStorage } from "@/lib/sensitiveData"
import type { InvoiceVisibilitySettings } from "@/lib/invoiceVisibilityShared"
import { defaultTemplateTypography, getTemplateFontCss } from "@/lib/templateTypography"
import { normalizeTemplateTypography } from "@/lib/globalTemplateTypography"
import { DEFAULT_TEMPLATE_ID, resolveTemplateId } from "@/lib/templateIds"
import type { PdfApiErrorBody } from "@/lib/pdfApiContract"
import type { SupabaseClient } from "@supabase/supabase-js"

export type InvoicePdfRequestBody = {
  invoiceId?: string
  templateId?: string
  fontId?: string
  fontSize?: number | string
  fontFamily?: string
}

type PdfRenderPayload = {
  invoice: Record<string, unknown>
  business: Record<string, unknown> | null
  visibility: Partial<InvoiceVisibilitySettings> | null
  templateId: string
  dateFormat: string
  amountFormat: string
  showDecimals: boolean
  currencySymbol: string
  currencyPosition: "before" | "after"
  fontFamily: string
  fontSize: number
  totals: {
    subtotal: number
    totalCGST: number
    totalSGST: number
    totalIGST: number
  }
}

function toRawString(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
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

export type InvoicePdfGenFailure = {
  ok: false
  message: string
  code: PdfApiErrorBody["code"]
  httpStatus: number
}

export type InvoicePdfGenSuccess = {
  ok: true
  pdfBytes: Uint8Array
  fileInvoiceNumber: string
  sourceFingerprint: string
}

export type InvoicePdfGenResult = InvoicePdfGenSuccess | InvoicePdfGenFailure

export type ResolvedInvoicePdfSource = {
  invoiceRecordId: string
  fileInvoiceNumber: string
  renderUrl: string
  sourceFingerprint: string
  templateId: string
}

export type InvoicePdfResolveSuccess = {
  ok: true
  source: ResolvedInvoicePdfSource
}

export type InvoicePdfResolveResult = InvoicePdfResolveSuccess | InvoicePdfGenFailure

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`)
    .join(",")}}`
}

function createPdfSourceFingerprint(payload: PdfRenderPayload): string {
  return createHash("sha256").update(stableSerialize(payload)).digest("hex").slice(0, 24)
}

export async function generateInvoicePdfFromResolvedSource(
  source: ResolvedInvoicePdfSource,
  invoiceId: string,
  log?: (event: string, meta: Record<string, unknown>) => void
): Promise<InvoicePdfGenResult> {
  const result = await generateInvoicePdfBuffer({ url: source.renderUrl })

  if (!result.ok) {
    log?.("engine-error", {
      invoiceId,
      templateId: source.templateId,
      code: result.code,
      httpStatus: result.httpStatus,
      message: result.message,
    })
    const codeMap: Record<string, PdfApiErrorBody["code"]> = {
      PDF_NAV_TIMEOUT: "PDF_NAV_TIMEOUT",
      PDF_ENGINE: "PDF_ENGINE",
      PDF_RENDER: "PDF_RENDER",
    }
    return {
      ok: false,
      message: result.message,
      code: codeMap[result.code] ?? "PDF_BUILD",
      httpStatus: result.httpStatus,
    }
  }

  if (result.pdfBytes.byteLength < 8) {
    log?.("invalid-pdf-empty", {
      invoiceId,
      templateId: source.templateId,
      byteLength: result.pdfBytes.byteLength,
    })
    return { ok: false, message: "PDF engine returned an empty document.", code: "PDF_BUILD", httpStatus: 500 }
  }

  const [b0, b1, b2, b3] = result.pdfBytes
  const looksLikePdf = b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46
  if (!looksLikePdf) {
    log?.("invalid-pdf-magic", {
      invoiceId,
      templateId: source.templateId,
      byteLength: result.pdfBytes.byteLength,
    })
    return { ok: false, message: "PDF engine returned non-PDF bytes.", code: "PDF_BUILD", httpStatus: 500 }
  }

  log?.("pdf-success", {
    invoiceId,
    templateId: source.templateId,
    byteLength: result.pdfBytes.byteLength,
  })

  return {
    ok: true,
    pdfBytes: result.pdfBytes,
    fileInvoiceNumber: source.fileInvoiceNumber,
    sourceFingerprint: source.sourceFingerprint,
  }
}

export async function resolveInvoicePdfSourceForUser(
  supabase: SupabaseClient,
  body: InvoicePdfRequestBody,
  requestOrigin: string,
  log?: (event: string, meta: Record<string, unknown>) => void
): Promise<InvoicePdfResolveResult> {
  const sanitizeTemplateId = (v: unknown): string | null => {
    if (typeof v !== "string") return null
    const s = v.trim()
    return s ? s : null
  }

  if (!body.invoiceId || String(body.invoiceId).trim() === "") {
    return {
      ok: false,
      message: "Invoice id is required. PDFs are generated only from your saved account data.",
      code: "INVOICE_ID_REQUIRED",
      httpStatus: 400,
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: "Sign in to download invoices.", code: "UNAUTHORIZED", httpStatus: 401 }
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
    return { ok: false, message: "Unable to load your account data.", code: "KV_ERROR", httpStatus: 500 }
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
  const { store } = normalizeInvoiceStorePayload(invoicesParsed)
  const invoices = store.invoices
  const found = findInvoiceById(invoices, String(body.invoiceId))

  if (!found) {
    return { ok: false, message: "Invoice not found.", code: "NOT_FOUND", httpStatus: 404 }
  }

  const invoiceData = normalizeInvoiceForPdf(found as Record<string, unknown>)
  const fileInvoiceNumber = String((invoiceData as { invoiceNumber?: string }).invoiceNumber || "invoice")

  const businessRaw = toRawString(getKvOrBundle("businessProfile"))
  const businessDataRaw = businessRaw ? revealSensitiveDataFromStorage("businessProfile", businessRaw) : null
  const businessObj = businessDataRaw ? normalizeBusinessProfile(parseJsonLoose(businessDataRaw)) : null

  const invoiceVisibilityRaw = toRawString(getKvOrBundle("invoiceVisibility"))
  const visibility = (parseJsonLoose(invoiceVisibilityRaw) || null) as Partial<InvoiceVisibilitySettings> | null
  const storedTemplateId = resolveTemplateId(getKvOrBundle("invoiceTemplate") || DEFAULT_TEMPLATE_ID)
  const templateId = resolveTemplateId(sanitizeTemplateId(body.templateId) || storedTemplateId)
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

  const typography = normalizeTemplateTypography({
    fontId: bodyFontId || kvFontId,
    fontFamily: bodyFontFamily || (bodyFontId ? getTemplateFontCss(bodyFontId) : null) || kvFontFamily,
    fontSize: bodyFontSize ?? kvFontSize,
  })

  log?.("request", {
    invoiceId: body.invoiceId,
    templateId,
    fontId: typography.fontId,
    fontSize: typography.fontSize,
    typographySource: bodyFontSize != null || bodyFontId || bodyFontFamily ? "body" : "kv",
    userIdSuffix: user.id.slice(-6),
  })

  const dateFormat = String(getKvOrBundle("dateFormat") || "YYYY-MM-DD")
  const amountFormat = String(getKvOrBundle("amountFormat") || "indian")
  const showDecimals = String(getKvOrBundle("showDecimals") || "true") === "true"
  const currencySymbol = String(getKvOrBundle("currencySymbol") || "₹")
  const currencyPosition = (String(getKvOrBundle("currencyPosition") || "before") === "after" ? "after" : "before") as
    | "before"
    | "after"
  const totals = (() => {
    const items = Array.isArray((invoiceData as { items?: unknown[] }).items)
      ? ((invoiceData as { items?: Array<Record<string, unknown>> }).items || [])
      : []
    let subtotal = 0
    let totalCGST = 0
    let totalSGST = 0
    let totalIGST = 0
    for (const item of items) {
      const qty = Number(item?.qty) || 0
      const price = Number(item?.price) || 0
      const base = qty * price
      subtotal += base
      totalCGST += item?.cgst ? (base * Number(item.cgst)) / 100 : 0
      totalSGST += item?.sgst ? (base * Number(item.sgst)) / 100 : 0
      totalIGST += item?.igst ? (base * Number(item.igst)) / 100 : 0
    }
    return { subtotal, totalCGST, totalSGST, totalIGST }
  })()

  const payload: PdfRenderPayload = {
    invoice: invoiceData as Record<string, unknown>,
    business: businessObj,
    visibility,
    templateId,
    dateFormat,
    amountFormat,
    showDecimals,
    currencySymbol,
    currencyPosition,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize,
    totals,
  }
  const sourceFingerprint = createPdfSourceFingerprint(payload)
  const payloadEncoded = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url")
  const renderUrl = `${requestOrigin}/invoice-pdf?payload=${encodeURIComponent(payloadEncoded)}`

  return {
    ok: true,
    source: {
      invoiceRecordId: found.id,
      fileInvoiceNumber,
      renderUrl,
      sourceFingerprint,
      templateId,
    },
  }
}

export async function generateInvoicePdfForUser(
  supabase: SupabaseClient,
  body: InvoicePdfRequestBody,
  requestOrigin: string,
  log?: (event: string, meta: Record<string, unknown>) => void
): Promise<InvoicePdfGenResult> {
  const resolved = await resolveInvoicePdfSourceForUser(supabase, body, requestOrigin, log)
  if (!resolved.ok) {
    return resolved
  }

  return generateInvoicePdfFromResolvedSource(
    resolved.source,
    String(body.invoiceId || ""),
    log
  )
}
