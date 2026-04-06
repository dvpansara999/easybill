import Image from "next/image"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/context/SettingsContext"
import { invoiceTemplateRootTypographyStyle } from "@/lib/invoiceTemplateRootStyle"
import type {
  TemplateBusinessRecord,
  TemplateComponentProps,
  TemplateCustomDetail,
  TemplateInvoiceRecord,
} from "@/components/invoiceTemplates/templateTypes"
import { TERMS_PAGE2_TEMPLATE_IDS } from "@/lib/templateCatalog"

type ClassicTheme = {
  accent: string
  page: string
  paper?: string
  line: string
  info?: string
  serif?: boolean
  header: "formal" | "office" | "seal"
  table: "plain" | "boxed"
  termsPage2?: boolean
}

export const templateMeta = {
  id: "classic-v01",
  name: "Classic Ledger A",
  category: "classic",
  popular: true,
}

export const classicThemes: Record<string, ClassicTheme> = {
  "classic-registry": { accent: "#1f2937", page: "#ffffff", paper: "#ffffff", line: "#cbd5e1", header: "formal", table: "boxed", info: "detailsFirst", serif: false },
  "classic-merchantile": { accent: "#92400e", page: "#fffbeb", paper: "#fffbeb", line: "#e5d6b6", header: "office", table: "plain", info: "split", serif: false },
  "classic-notaryx": { accent: "#0f172a", page: "#ffffff", paper: "#ffffff", line: "#d1d5db", header: "seal", table: "boxed", info: "stack", serif: false },
  "classic-courthouse": { accent: "#172554", page: "#eff6ff", paper: "#eff6ff", line: "#bfdbfe", header: "formal", table: "boxed", info: "split", serif: true },
  "classic-heritagex": { accent: "#7c2d12", page: "#fff7ed", paper: "#fff7ed", line: "#f2d6bf", header: "seal", table: "plain", info: "stack", serif: true },
  "classic-carboncopy": { accent: "#111827", page: "#ffffff", paper: "#ffffff", line: "#d1d5db", header: "office", table: "boxed", info: "split", serif: false },
}

const CLASSIC_HEADERS: ClassicTheme["header"][] = ["formal", "office", "seal"]
const CLASSIC_TABLES: ClassicTheme["table"][] = ["boxed", "plain"]
const CLASSIC_PALETTES = [
  { accent: "#1f2937", page: "#ffffff", paper: "#ffffff", line: "#cbd5e1" },
  { accent: "#92400e", page: "#fffbeb", paper: "#fffbeb", line: "#e5d6b6" },
  { accent: "#0f172a", page: "#ffffff", paper: "#ffffff", line: "#d1d5db" },
  { accent: "#172554", page: "#eff6ff", paper: "#eff6ff", line: "#bfdbfe" },
  { accent: "#7c2d12", page: "#fff7ed", paper: "#fff7ed", line: "#f2d6bf" },
  { accent: "#111827", page: "#ffffff", paper: "#ffffff", line: "#d1d5db" },
  { accent: "#4c1d95", page: "#faf5ff", paper: "#faf5ff", line: "#e9d5ff" },
  { accent: "#14532d", page: "#f7fee7", paper: "#f7fee7", line: "#d9f99d" },
] as const

function parseVariant(templateId: string | undefined) {
  const match = String(templateId || "classic-v01").match(/(\d+)/)
  const n = match ? Number(match[1]) : 1
  return Number.isFinite(n) && n > 0 ? n : 1
}

function resolveClassicTheme(templateId: string | undefined): ClassicTheme {
  const raw = String(templateId || "")
  const mapped = classicThemes[raw]
  if (mapped) return { ...mapped, termsPage2: TERMS_PAGE2_TEMPLATE_IDS.has(raw) }
  const variant = parseVariant(raw)
  const layoutIndex = Math.floor((variant - 1) / 4)
  const paletteIndex = (variant - 1) % 4
  const palette = CLASSIC_PALETTES[(layoutIndex * 2 + paletteIndex) % CLASSIC_PALETTES.length]
  return {
    ...palette,
    header: CLASSIC_HEADERS[layoutIndex % CLASSIC_HEADERS.length],
    table: CLASSIC_TABLES[layoutIndex % CLASSIC_TABLES.length],
    info: layoutIndex % 2 === 0 ? "stack" : "split",
    serif: layoutIndex % 3 === 0,
    termsPage2: TERMS_PAGE2_TEMPLATE_IDS.has(raw),
  }
}

function logo(business: TemplateBusinessRecord, visibility: InvoiceVisibilitySettings) {
  if (!visibility.businessLogo || !business?.logo) return null
  const frameClass =
    business.logoShape === "round"
      ? "relative h-12 w-12 overflow-hidden rounded-full border border-slate-300"
      : "relative h-12 w-12 overflow-hidden rounded-md border border-slate-300"
  return (
    <div className={frameClass}>
      <Image src={business.logo} alt="" fill unoptimized className="object-cover" />
    </div>
  )
}

function header({
  invoice,
  business,
  visibility,
  theme,
  formatDate,
  dateFormat,
}: {
  invoice: TemplateInvoiceRecord | undefined
  business: TemplateBusinessRecord
  visibility: InvoiceVisibilitySettings
  theme: ClassicTheme
  formatDate?: TemplateComponentProps["formatDate"]
  dateFormat: string
}) {
  const dateText = formatDate?.(invoice?.date || "", dateFormat) || "-"
  const logoNode = logo(business, visibility)
  if (theme.header === "seal") {
    return (
      <div className="border-2 p-5" style={{ borderColor: theme.accent }}>
        <div className="flex items-start justify-between gap-8">
          <div>
            {logoNode}
            {visibility.businessName ? <h1 className="mt-2 text-3xl font-bold" style={{ color: theme.accent }}>{business.businessName || "BUSINESS NAME"}</h1> : null}
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              {visibility.businessAddress && business?.address && <p>{business.address}</p>}
              {visibility.businessPhone && business?.phone && <p>{business.phone}</p>}
              {business?.email && <p>{business.email}</p>}
              {visibility.businessGstin && business?.gst && <p>GSTIN: {business.gst}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block border px-3 py-1 text-xs uppercase tracking-[0.2em]" style={{ borderColor: theme.accent, color: theme.accent }}>
              Tax Invoice
            </div>
            <p className="mt-4 text-sm"><b>Invoice:</b> {invoice?.invoiceNumber || "-"}</p>
            <p className="text-sm"><b>Date:</b> {dateText}</p>
          </div>
        </div>
      </div>
    )
  }

  if (theme.header === "office") {
    return (
      <div className="border-b pb-4" style={{ borderColor: theme.line }}>
        <div className="flex items-end justify-between gap-8">
          <div>
            {logoNode}
            {visibility.businessName ? <h1 className="mt-2 text-3xl font-bold" style={{ color: theme.accent }}>{business.businessName || "BUSINESS NAME"}</h1> : null}
          </div>
          <div className="text-right text-sm text-slate-700">
            <p><b>Invoice:</b> {invoice?.invoiceNumber || "-"}</p>
            <p><b>Date:</b> {dateText}</p>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-sm text-slate-700">
          {visibility.businessAddress && business?.address && <p>{business.address}</p>}
          {visibility.businessPhone && business?.phone && <p>{business.phone}</p>}
          {business?.email && <p>{business.email}</p>}
          {visibility.businessGstin && business?.gst && <p>GSTIN: {business.gst}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="border-b-2 pb-4 text-center" style={{ borderColor: theme.line }}>
      {logoNode ? <div className="mx-auto w-fit">{logoNode}</div> : null}
      {visibility.businessName ? <h1 className="mt-2 text-3xl font-bold" style={{ color: theme.accent }}>{business.businessName || "BUSINESS NAME"}</h1> : null}
      <div className="mt-2 space-y-1 text-sm text-slate-700">
        {visibility.businessAddress && business?.address && <p>{business.address}</p>}
        {visibility.businessPhone && business?.phone && <p>{business.phone}</p>}
        {business?.email && <p>{business.email}</p>}
        {visibility.businessGstin && business?.gst && <p>GSTIN: {business.gst}</p>}
      </div>
      <div className="mt-3 flex justify-center gap-8 text-sm">
        <p><b>Invoice:</b> {invoice?.invoiceNumber || "-"}</p>
        <p><b>Date:</b> {dateText}</p>
      </div>
    </div>
  )
}

function info({
  invoice,
  details,
  visibility,
  theme,
}: {
  invoice: TemplateInvoiceRecord | undefined
  details: TemplateCustomDetail[]
  visibility: InvoiceVisibilitySettings
  theme: ClassicTheme
}) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-5">
      <div className="border p-4" style={{ borderColor: theme.line }}>
        <p className="font-semibold">Bill To</p>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          <p className="font-semibold">{visibility.clientName ? invoice?.clientName || "-" : "-"}</p>
          {visibility.clientPhone && invoice?.clientPhone && <p>{invoice.clientPhone}</p>}
          {invoice?.clientEmail && <p>{invoice.clientEmail}</p>}
          {visibility.clientGstin && invoice?.clientGST && <p>GSTIN: {invoice.clientGST}</p>}
          {visibility.clientAddress && invoice?.clientAddress && <p>{invoice.clientAddress}</p>}
        </div>
      </div>
      <div className="border p-4" style={{ borderColor: theme.line }}>
        <p className="font-semibold">Additional Details</p>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          {details.length ? details.map((detail, idx) => (
            <p key={idx}><b>{detail.label}:</b> {detail.value}</p>
          )) : <p>No additional details supplied.</p>}
        </div>
      </div>
    </div>
  )
}

function items({
  invoice,
  money,
  gstDisplay,
  theme,
}: {
  invoice: TemplateInvoiceRecord | undefined
  money: TemplateComponentProps["money"]
  gstDisplay: TemplateComponentProps["gstDisplay"]
  theme: ClassicTheme
}) {
  void gstDisplay
  const rows = invoice?.items || []
  const hasHsn = rows.some((item) => String(item.hsn || "").trim() !== "")
  const hasCgst = rows.some((item) => Number(item.cgst || 0) > 0)
  const hasSgst = rows.some((item) => Number(item.sgst || 0) > 0)
  const hasIgst = rows.some((item) => Number(item.igst || 0) > 0)
  const splitHsn = (hsn: string | undefined) => {
    const text = String(hsn || "-")
    if (text.length <= 4) return [text, ""]
    return [text.slice(0, 4), text.slice(4)]
  }
  const gstCell = (rate: number | string | null | undefined, amount: number) => {
    const rateText = rate === null || rate === undefined || rate === "" || String(rate) === "0" ? "" : `${rate}%`
    return (
      <div className="leading-tight">
        <div>{rateText ? money(amount) : "-"}</div>
        <div className="text-[11px] text-slate-400">{rateText || "\u00A0"}</div>
      </div>
    )
  }
  const borderWidth = theme.table === "boxed" ? "2px" : "1px"
  return (
    <table className="w-full text-sm" style={{ borderCollapse: "collapse", border: `${borderWidth} solid ${theme.line}` }}>
      <thead>
        <tr style={{ backgroundColor: "#f8fafc" }}>
          <th className="p-2 text-left" style={{ border: `${borderWidth} solid ${theme.line}` }}>Product</th>
          {hasHsn ? <th className="p-2 text-center" style={{ border: `${borderWidth} solid ${theme.line}` }}>HSN</th> : null}
          <th className="p-2 text-center" style={{ border: `${borderWidth} solid ${theme.line}` }}>Qty</th>
          <th className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>Price</th>
          {hasCgst ? <th className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>CGST</th> : null}
          {hasSgst ? <th className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>SGST</th> : null}
          {hasIgst ? <th className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>IGST</th> : null}
          <th className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, idx) => {
          const base = Number(item.qty || 0) * Number(item.price || 0)
          const cgstAmount = item.cgst ? (base * Number(item.cgst)) / 100 : 0
          const sgstAmount = item.sgst ? (base * Number(item.sgst)) / 100 : 0
          const igstAmount = item.igst ? (base * Number(item.igst)) / 100 : 0
          return (
            <tr key={idx} style={{ height: 56 }}>
              <td className="p-2 align-middle" style={{ border: `${borderWidth} solid ${theme.line}` }}>
                <div
                  className="leading-tight"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.product || "-"}
                </div>
              </td>
              {hasHsn ? (
                <td className="p-2 text-center align-middle" style={{ border: `${borderWidth} solid ${theme.line}` }}>
                  <div className="leading-tight">
                    {splitHsn(item.hsn).map((line, i) => (
                      <div key={i}>{line || "\u00A0"}</div>
                    ))}
                  </div>
                </td>
              ) : null}
              <td className="p-2 text-center align-middle" style={{ border: `${borderWidth} solid ${theme.line}` }}>{item.qty || 0}</td>
              <td className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>{money(item.price || 0)}</td>
              {hasCgst ? <td className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>{gstCell(item.cgst, cgstAmount)}</td> : null}
              {hasSgst ? <td className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>{gstCell(item.sgst, sgstAmount)}</td> : null}
              {hasIgst ? <td className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>{gstCell(item.igst, igstAmount)}</td> : null}
              <td className="p-2 text-right font-bold text-slate-900" style={{ border: `${borderWidth} solid ${theme.line}` }}>{money(item.total || 0)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function summary({
  invoice,
  amountInWords,
  subtotal,
  totalCGST,
  totalSGST,
  totalIGST,
  money,
  theme,
}: {
  invoice: TemplateInvoiceRecord | undefined
  amountInWords?: string
  subtotal: number
  totalCGST: number
  totalSGST: number
  totalIGST: number
  money: TemplateComponentProps["money"]
  theme: ClassicTheme
}) {
  return (
    <div className="eb-summary-box w-[320px] border p-4" style={{ borderColor: theme.line }}>
      <div className="space-y-2 text-sm text-slate-700">
        <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        {totalCGST ? <div className="flex justify-between"><span>CGST</span><span>{money(totalCGST)}</span></div> : null}
        {totalSGST ? <div className="flex justify-between"><span>SGST</span><span>{money(totalSGST)}</span></div> : null}
        {totalIGST ? <div className="flex justify-between"><span>IGST</span><span>{money(totalIGST)}</span></div> : null}
        <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold text-slate-900" style={{ borderColor: theme.line }}>
          <span>Total</span><span>{money(invoice?.grandTotal || 0)}</span>
        </div>
        {amountInWords ? (
          <div className="border-t pt-2 text-xs leading-5 text-slate-600" style={{ borderColor: theme.line }}>
            Amount in words: {amountInWords}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function footer({
  business,
  visibility,
  theme,
}: {
  business: TemplateBusinessRecord
  visibility: InvoiceVisibilitySettings
  theme: ClassicTheme
}) {
  const showTermsInline = !theme.termsPage2
  return (
    <div className="eb-footer-grid grid grid-cols-2 gap-6 border-t pt-4" style={{ borderColor: theme.line }}>
      <div className="text-sm text-slate-700">
        {visibility.businessBankDetails && (business?.bankName || business?.accountNumber || business?.ifsc || business?.upi) ? (
          <>
            <p className="font-semibold">Bank Details</p>
            <div className="mt-2 space-y-1">
              {business?.bankName && <p>Bank: {business.bankName}</p>}
              {business?.accountNumber && <p>Account: {business.accountNumber}</p>}
              {business?.ifsc && <p>IFSC: {business.ifsc}</p>}
              {business?.upi && <p>UPI: {business.upi}</p>}
            </div>
          </>
        ) : null}
      </div>
      <div className="text-sm text-slate-700">
        {showTermsInline && visibility.businessTerms && business?.terms ? (
          <>
            <p className="font-semibold">Terms</p>
            <p className="mt-2 whitespace-pre-line">{business.terms}</p>
          </>
        ) : null}
      </div>
    </div>
  )
}

function termsPage({
  business,
  visibility,
  theme,
}: {
  business: TemplateBusinessRecord
  visibility: InvoiceVisibilitySettings
  theme: ClassicTheme
}) {
  if (!theme.termsPage2 || !visibility.businessTerms || !business?.terms) return null
  return (
    <div className="eb-content-block eb-terms-fullpage border p-6" style={{ borderColor: theme.line, minHeight: 980 }}>
      <p className="font-semibold uppercase tracking-[0.2em]" style={{ color: theme.accent }}>Terms & Conditions</p>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{business.terms}</p>
    </div>
  )
}

export default function ClassicTemplate({
  invoice,
  business,
  templateId,
  fontFamily = "system",
  fontSize,
  renderContext = "screen",
  amountInWords,
  subtotal,
  totalCGST,
  totalSGST,
  totalIGST,
  money,
  gstDisplay,
  formatDate,
  dateFormat,
  invoiceVisibility,
}: TemplateComponentProps) {
  const theme = resolveClassicTheme(templateId)
  const businessInfo = business || {}
  const details = invoice?.customDetails || []
  const visibility: InvoiceVisibilitySettings = invoiceVisibility || DEFAULT_INVOICE_VISIBILITY

  return (
    <div className="w-full p-6 text-slate-800" style={{ backgroundColor: theme.page, ...invoiceTemplateRootTypographyStyle(fontFamily, fontSize, renderContext) }}>
      <div className="eb-content-block">{header({ invoice: invoice || undefined, business: businessInfo, visibility, theme, formatDate, dateFormat })}</div>
      <div className="eb-content-block">{info({ invoice: invoice || undefined, details, visibility, theme })}</div>
      <div className="eb-content-block eb-section eb-section-items mt-5">{items({ invoice: invoice || undefined, money, gstDisplay, theme })}</div>
      <div className="eb-content-block eb-section eb-section-summary mt-7 flex justify-end">{summary({ invoice: invoice || undefined, amountInWords, subtotal: subtotal || 0, totalCGST: totalCGST || 0, totalSGST: totalSGST || 0, totalIGST: totalIGST || 0, money, theme })}</div>
      <div className="eb-content-block eb-section eb-section-footer mt-5">{footer({ business: businessInfo, visibility, theme })}</div>
      {termsPage({ business: businessInfo, visibility, theme })}
    </div>
  )
}
