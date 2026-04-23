import { createHash } from "node:crypto"
import { normalizeBusinessProfile } from "@/lib/businessProfile"
import { mapStoredDateToLocalDate } from "@/lib/dateFormat"
import { LOGO_BUCKET } from "@/lib/logoStorage"
import { generateInvoicePdfBuffer } from "@/lib/server/generateInvoicePdfBuffer"
import { parseJsonLoose } from "@/lib/server/invoicePdfRouteHelpers"
import { normalizeInvoiceRecord } from "@/lib/invoice"
import { normalizeInvoiceForPdf } from "@/lib/server/normalizeInvoiceForPdf"
import type { InvoiceVisibilitySettings } from "@/lib/invoiceVisibilityShared"
import { defaultTemplateTypography, getTemplateFontCss } from "@/lib/templateTypography"
import { normalizeTemplateTypography } from "@/lib/globalTemplateTypography"
import { DEFAULT_TEMPLATE_ID, resolveTemplateId } from "@/lib/templateIds"
import type { PdfApiErrorBody } from "@/lib/pdfApiContract"
import { revealSensitiveFields } from "@/lib/sensitiveData"
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

  const [profileRes, settingsRes, invoiceRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("invoices")
      .select(
        "id,invoice_number,created_at,invoice_date,numbering_mode_at_creation,reset_month_day_at_creation,sequence_window_start,sequence_window_end,client_name,client_phone,client_email,client_gst,client_address,custom_details,notes,status,grand_total,invoice_items(position,product,hsn,qty,unit,price,cgst,sgst,igst,total),invoice_history(id,event_type,label,happened_at)"
      )
      .eq("user_id", user.id)
      .eq("id", String(body.invoiceId))
      .maybeSingle(),
  ])

  if (profileRes.error || settingsRes.error || invoiceRes.error) {
    return { ok: false, message: "Unable to load your account data.", code: "KV_ERROR", httpStatus: 500 }
  }

  if (!invoiceRes.data) {
    return { ok: false, message: "Invoice not found.", code: "NOT_FOUND", httpStatus: 404 }
  }

  const invoiceRow = invoiceRes.data as Record<string, unknown>
  const safeInvoiceRow = revealSensitiveFields(invoiceRow, ["client_phone", "client_gst"])
  const found = normalizeInvoiceRecord({
    id: String(safeInvoiceRow.id || ""),
    invoiceNumber: String(safeInvoiceRow.invoice_number || ""),
    createdAt: typeof safeInvoiceRow.created_at === "string" ? safeInvoiceRow.created_at : undefined,
    numberingModeAtCreation:
      safeInvoiceRow.numbering_mode_at_creation === "financial-year-reset" ? "financial-year-reset" : "continuous",
    resetMonthDayAtCreation:
      typeof safeInvoiceRow.reset_month_day_at_creation === "string"
        ? safeInvoiceRow.reset_month_day_at_creation
        : null,
    sequenceWindowStart:
      typeof safeInvoiceRow.sequence_window_start === "string" ? safeInvoiceRow.sequence_window_start : null,
    sequenceWindowEnd:
      typeof safeInvoiceRow.sequence_window_end === "string" ? safeInvoiceRow.sequence_window_end : null,
    clientName: String(safeInvoiceRow.client_name || ""),
    clientPhone: String(safeInvoiceRow.client_phone || ""),
    clientEmail: String(safeInvoiceRow.client_email || ""),
    clientGST: String(safeInvoiceRow.client_gst || ""),
    clientAddress: String(safeInvoiceRow.client_address || ""),
    date:
      typeof safeInvoiceRow.invoice_date === "string"
        ? safeInvoiceRow.invoice_date
        : mapStoredDateToLocalDate(new Date(String(safeInvoiceRow.invoice_date || ""))) || "",
    customDetails: Array.isArray(safeInvoiceRow.custom_details) ? safeInvoiceRow.custom_details : [],
    items: Array.isArray(safeInvoiceRow.invoice_items) ? safeInvoiceRow.invoice_items : [],
    notes: typeof safeInvoiceRow.notes === "string" ? safeInvoiceRow.notes : "",
    status:
      safeInvoiceRow.status === "paid" || safeInvoiceRow.status === "issued" || safeInvoiceRow.status === "draft"
        ? safeInvoiceRow.status
        : "draft",
    history:
      Array.isArray(safeInvoiceRow.invoice_history)
        ? safeInvoiceRow.invoice_history.map((entry) => ({
            id: String((entry as Record<string, unknown>).id || ""),
            type: ((entry as Record<string, unknown>).event_type || "created") as
              | "created"
              | "edited"
              | "exported"
              | "status"
              | "duplicated",
            label: String((entry as Record<string, unknown>).label || ""),
            at: String((entry as Record<string, unknown>).happened_at || new Date().toISOString()),
          }))
        : [],
    grandTotal: Number(safeInvoiceRow.grand_total || 0),
  })

  const invoiceData = normalizeInvoiceForPdf(found as Record<string, unknown>)
  const fileInvoiceNumber = String((invoiceData as { invoiceNumber?: string }).invoiceNumber || "invoice")

  const profile = revealSensitiveFields((profileRes.data || {}) as Record<string, unknown>, [
    "business_name",
    "phone",
    "gst",
    "bank_name",
    "account_number",
    "ifsc",
    "upi",
  ])
  const settings = (settingsRes.data || {}) as Record<string, unknown>
  const logoStoragePath = typeof profile.logo_storage_path === "string" ? profile.logo_storage_path : ""
  let logoSignedUrl: string | null = null
  if (logoStoragePath) {
    const { data } = await supabase.storage.from(LOGO_BUCKET).createSignedUrl(logoStoragePath, 60 * 60)
    logoSignedUrl = data?.signedUrl || null
  }

  const businessObj = normalizeBusinessProfile({
    businessName: String(profile.business_name || ""),
    phone: String(profile.phone || ""),
    email: String(profile.email || ""),
    gst: String(profile.gst || ""),
    address: String(profile.address || ""),
    bankName: String(profile.bank_name || ""),
    accountNumber: String(profile.account_number || ""),
    ifsc: String(profile.ifsc || ""),
    upi: String(profile.upi || ""),
    terms: String(profile.terms || ""),
    logo: logoSignedUrl || "",
    logoStoragePath,
    logoShape: profile.logo_shape,
  })

  const visibility = ((settings.invoice_visibility as Partial<InvoiceVisibilitySettings> | null) || null) as
    | Partial<InvoiceVisibilitySettings>
    | null
  const storedTemplateId = resolveTemplateId(settings.invoice_template || DEFAULT_TEMPLATE_ID)
  const templateId = resolveTemplateId(sanitizeTemplateId(body.templateId) || storedTemplateId)
  const templateTypography = parseJsonLoose(
    typeof settings.template_typography === "string" ? settings.template_typography : null
  ) as
    | { fontId?: string; fontSize?: number | string; fontFamily?: string }
    | null
  const kvFontId = String(
    settings.template_font_id || templateTypography?.fontId || defaultTemplateTypography.fontId
  )
  const storedFontSizeRaw = Number(
    settings.template_font_size ?? templateTypography?.fontSize ?? defaultTemplateTypography.fontSize
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

  const dateFormat = String(settings.date_format || "YYYY-MM-DD")
  const amountFormat = String(settings.amount_format || "indian")
  const showDecimals = Boolean(settings.show_decimals ?? true)
  const currencySymbol = String(settings.currency_symbol || "₹")
  const currencyPosition = (String(settings.currency_position || "before") === "after" ? "after" : "before") as
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
