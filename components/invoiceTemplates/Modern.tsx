import Image from "next/image"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/context/SettingsContext"
import { invoiceTemplateRootTypographyStyle } from "@/lib/invoiceTemplateRootStyle"
import type {
  TemplateBusinessRecord,
  TemplateComponentProps,
  TemplateCustomDetail,
  TemplateInvoiceRecord,
  TemplateTheme,
} from "@/components/invoiceTemplates/templateTypes"
import { TERMS_PAGE2_TEMPLATE_IDS } from "@/lib/templateCatalog"

type ModernTheme = {
  accent: string
  soft: string
  page: string
  tint?: string
  line: string
  mode?: string
  table?: string
  summary?: string
  info?: string
  logo?: boolean
  header: "split" | "stripe" | "banner" | "panel" | "editorial" | "compact"
  termsPage2?: boolean
}

export const templateMeta = {
  id: "modern-v01",
  name: "Modern Atlas A",
  category: "modern",
  popular: true,
}

export const modernThemes: Record<string, ModernTheme> = {
  "modern-atlas": { accent: "#1d4ed8", soft: "#dbeafe", page: "#f8fbff", tint: "#f8fbff", line: "#dbe6f7", header: "split", mode: "split", table: "zebra", summary: "card", info: "split", logo: true },
  "modern-orbital": { accent: "#0f766e", soft: "#ccfbf1", page: "#f0fdfa", tint: "#f0fdfa", line: "#bfeee6", header: "stripe", mode: "stripe", table: "airy", summary: "glass", info: "cards", logo: true },
  "modern-prism": { accent: "#7c3aed", soft: "#ede9fe", page: "#faf5ff", tint: "#faf5ff", line: "#e7ddff", header: "banner", mode: "banner", table: "grid", summary: "glass", info: "sidebar", logo: true },
  "modern-ledgerflow": { accent: "#1f2937", soft: "#e5e7eb", page: "#f9fafb", tint: "#f9fafb", line: "#dde1e6", header: "panel", mode: "side", table: "lines", summary: "boxed", info: "stack", logo: false },
  "modern-zenboard": { accent: "#ea580c", soft: "#fed7aa", page: "#fff7ed", tint: "#fff7ed", line: "#ffe2c2", header: "editorial", mode: "frame", table: "grid", summary: "boxed", info: "split", logo: true },
  "modern-studiox": { accent: "#be123c", soft: "#fecdd3", page: "#fff1f2", tint: "#fff1f2", line: "#ffd7df", header: "compact", mode: "compact", table: "lines", summary: "inline", info: "sidebar", logo: true },
}

const MODERN_HEADERS: ModernTheme["header"][] = ["split", "stripe", "banner", "panel", "editorial", "compact"]
const MODERN_PALETTES = [
  { accent: "#1d4ed8", soft: "#dbeafe", page: "#f8fbff", tint: "#f8fbff", line: "#dbe6f7" },
  { accent: "#0f766e", soft: "#ccfbf1", page: "#f0fdfa", tint: "#f0fdfa", line: "#bfeee6" },
  { accent: "#7c3aed", soft: "#ede9fe", page: "#faf5ff", tint: "#faf5ff", line: "#e7ddff" },
  { accent: "#1f2937", soft: "#e5e7eb", page: "#f9fafb", tint: "#f9fafb", line: "#dde1e6" },
  { accent: "#ea580c", soft: "#fed7aa", page: "#fff7ed", tint: "#fff7ed", line: "#ffe2c2" },
  { accent: "#be123c", soft: "#fecdd3", page: "#fff1f2", tint: "#fff1f2", line: "#ffd7df" },
  { accent: "#0369a1", soft: "#dbeafe", page: "#f0f9ff", tint: "#f0f9ff", line: "#d7e8f6" },
  { accent: "#4338ca", soft: "#e0e7ff", page: "#eef2ff", tint: "#eef2ff", line: "#d4dcff" },
] as const

function parseVariant(templateId: string | undefined) {
  const match = String(templateId || "modern-v01").match(/(\d+)/)
  const n = match ? Number(match[1]) : 1
  return Number.isFinite(n) && n > 0 ? n : 1
}

function resolveModernTheme(templateId: string | undefined): ModernTheme {
  const raw = String(templateId || "")
  const mapped = modernThemes[raw]
  if (mapped) {
    return {
      ...mapped,
      termsPage2: TERMS_PAGE2_TEMPLATE_IDS.has(raw),
    }
  }
  const variant = parseVariant(raw)
  const layoutIndex = Math.floor((variant - 1) / 4)
  const paletteIndex = (variant - 1) % 4
  const palette = MODERN_PALETTES[(layoutIndex * 2 + paletteIndex) % MODERN_PALETTES.length]
  const header = MODERN_HEADERS[layoutIndex % MODERN_HEADERS.length]
  return {
    ...palette,
    header,
    mode: header === "panel" ? "side" : header === "editorial" ? "frame" : "split",
    table: layoutIndex % 3 === 0 ? "grid" : layoutIndex % 3 === 1 ? "lines" : "zebra",
    summary: layoutIndex % 4 === 0 ? "boxed" : layoutIndex % 4 === 1 ? "inline" : layoutIndex % 4 === 2 ? "glass" : "card",
    info: layoutIndex % 4 === 0 ? "split" : layoutIndex % 4 === 1 ? "sidebar" : layoutIndex % 4 === 2 ? "stack" : "cards",
    logo: layoutIndex % 5 !== 0,
    termsPage2: TERMS_PAGE2_TEMPLATE_IDS.has(raw),
  }
}

function renderLogo(business: TemplateBusinessRecord, visibility: InvoiceVisibilitySettings) {
  if (!visibility.businessLogo || !business?.logo) return null
  const frameClass =
    business?.logoShape === "round"
      ? "relative h-14 w-14 overflow-hidden rounded-full border border-white/70 bg-white"
      : "relative h-14 w-14 overflow-hidden rounded-xl border border-white/70 bg-white"
  return (
    <div className={frameClass}>
      <Image src={business.logo} alt="" fill unoptimized className="object-cover" />
    </div>
  )
}

function Header({
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
  theme: ModernTheme
  formatDate?: TemplateComponentProps["formatDate"]
  dateFormat: string
}) {
  const businessName = visibility.businessName ? business?.businessName || "BUSINESS" : ""
  const dateText = formatDate?.(invoice?.date || "", dateFormat) || "-"
  const logo = renderLogo(business, visibility)
  const contact = (
    <div className="mt-3 space-y-1 text-sm text-slate-600">
      {visibility.businessAddress && business?.address && <p>{business.address}</p>}
      {visibility.businessPhone && business?.phone && <p>{business.phone}</p>}
      {business?.email && <p>{business.email}</p>}
      {visibility.businessGstin && business?.gst && <p>GSTIN: {business.gst}</p>}
    </div>
  )

  if (theme.header === "banner") {
    return (
      <div className="rounded-2xl p-7 text-white" style={{ backgroundColor: theme.accent }}>
        <div className="flex items-start justify-between gap-8">
          <div>{logo}{visibility.businessName ? <h1 className="mt-3 text-3xl font-bold">{businessName}</h1> : null}{contact}</div>
          <div className="rounded-xl bg-white/15 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.2em]">Invoice</p>
            <p className="mt-1 text-lg font-semibold">{invoice?.invoiceNumber || "-"}</p>
            <p className="mt-2 text-sm">{dateText}</p>
          </div>
        </div>
      </div>
    )
  }

  if (theme.header === "stripe") {
    return (
      <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: theme.line }}>
        <div className="h-2" style={{ backgroundColor: theme.accent }} />
        <div className="flex items-start justify-between gap-8 p-6">
          <div>{logo}{visibility.businessName ? <h1 className="mt-3 text-3xl font-bold text-slate-900">{businessName}</h1> : null}{contact}</div>
          <div className="text-right text-sm text-slate-600">
            <p className="font-semibold text-slate-900">#{invoice?.invoiceNumber || "-"}</p>
            <p>{dateText}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[1.1fr_0.9fr] gap-5 rounded-2xl border bg-white p-6" style={{ borderColor: theme.line }}>
      <div>
        {logo}
        {visibility.businessName ? <h1 className="mt-3 text-3xl font-bold text-slate-900">{businessName}</h1> : null}
        {contact}
      </div>
      <div className="rounded-xl p-4 text-right" style={{ backgroundColor: theme.soft }}>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Invoice</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">{invoice?.invoiceNumber || "-"}</p>
        <p className="mt-2 text-sm text-slate-600">{dateText}</p>
      </div>
    </div>
  )
}

function Info({
  invoice,
  details,
  visibility,
  theme,
}: {
  invoice: TemplateInvoiceRecord | undefined
  details: TemplateCustomDetail[]
  visibility: InvoiceVisibilitySettings
  theme: ModernTheme
}) {
  const billBlock = (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: theme.line }}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Bill To</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{visibility.clientName ? invoice?.clientName || "-" : "-"}</p>
      <div className="mt-2 space-y-1 text-sm text-slate-600">
        {visibility.clientPhone && invoice?.clientPhone && <p>{invoice.clientPhone}</p>}
        {invoice?.clientEmail && <p>{invoice.clientEmail}</p>}
        {visibility.clientGstin && invoice?.clientGST && <p>GSTIN: {invoice.clientGST}</p>}
        {visibility.clientAddress && invoice?.clientAddress && <p>{invoice.clientAddress}</p>}
      </div>
    </div>
  )
  const detailsBlock = (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: theme.line }}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Additional Details</p>
      <div className="mt-2 space-y-1 text-sm text-slate-600">
        {details.length ? details.map((detail, idx) => (
          <p key={idx}><span className="font-semibold text-slate-800">{detail.label}:</span> {detail.value}</p>
        )) : <p>No additional details</p>}
      </div>
    </div>
  )

  if (theme.info === "stack") {
    return <div className="mt-5 space-y-4">{billBlock}{detailsBlock}</div>
  }
  if (theme.info === "sidebar") {
    return <div className="mt-5 grid grid-cols-[0.9fr_1.1fr] gap-5">{detailsBlock}{billBlock}</div>
  }
  if (theme.info === "cards") {
    return <div className="mt-5 grid grid-cols-3 gap-5"><div className="col-span-2">{billBlock}</div>{detailsBlock}</div>
  }

  return (
    <div className="mt-5 grid grid-cols-2 gap-5">
      {billBlock}
      {detailsBlock}
    </div>
  )
}

function Items({
  invoice,
  money,
  gstDisplay,
  theme,
}: {
  invoice: TemplateInvoiceRecord | undefined
  money: TemplateComponentProps["money"]
  gstDisplay: TemplateComponentProps["gstDisplay"]
  theme: ModernTheme
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
  const headerRowClass = theme.table === "grid" ? "border-b bg-slate-50 text-slate-700" : "border-b text-slate-600"
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className={headerRowClass} style={{ borderColor: theme.line }}>
          <th className="py-3 text-left">Item</th>
          {hasHsn ? <th className="py-3 text-center">HSN</th> : null}
          <th className="py-3 text-center">Qty</th>
          <th className="py-3 text-right">Price</th>
          {hasCgst ? <th className="py-3 text-right">CGST</th> : null}
          {hasSgst ? <th className="py-3 text-right">SGST</th> : null}
          {hasIgst ? <th className="py-3 text-right">IGST</th> : null}
          <th className="py-3 text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, idx) => {
          const base = Number(item.qty || 0) * Number(item.price || 0)
          const cgstAmount = item.cgst ? (base * Number(item.cgst)) / 100 : 0
          const sgstAmount = item.sgst ? (base * Number(item.sgst)) / 100 : 0
          const igstAmount = item.igst ? (base * Number(item.igst)) / 100 : 0
          return (
            <tr
              key={idx}
              className="border-b"
              style={{
                borderColor: theme.line,
                backgroundColor: theme.table === "zebra" && idx % 2 === 1 ? `${theme.soft}` : "transparent",
                height: 56,
              }}
            >
              <td className="py-2 align-middle">
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
                <td className="py-2 text-center align-middle">
                  <div className="leading-tight">
                    {splitHsn(item.hsn).map((line, i) => (
                      <div key={i}>{line || "\u00A0"}</div>
                    ))}
                  </div>
                </td>
              ) : null}
              <td className="py-2 text-center align-middle">{item.qty || 0}</td>
              <td className="py-2 text-right align-middle">{money(item.price || 0)}</td>
              {hasCgst ? <td className="py-2 text-right align-middle">{gstCell(item.cgst, cgstAmount)}</td> : null}
              {hasSgst ? <td className="py-2 text-right align-middle">{gstCell(item.sgst, sgstAmount)}</td> : null}
              {hasIgst ? <td className="py-2 text-right align-middle">{gstCell(item.igst, igstAmount)}</td> : null}
              <td className="py-2 text-right align-middle font-bold text-slate-900">{money(item.total || 0)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Summary({
  invoice,
  subtotal,
  totalCGST,
  totalSGST,
  totalIGST,
  money,
  theme,
}: {
  invoice: TemplateInvoiceRecord | undefined
  subtotal: number
  totalCGST: number
  totalSGST: number
  totalIGST: number
  money: TemplateComponentProps["money"]
  theme: ModernTheme
}) {
  void theme

  return (
    <div className="eb-summary-box rounded-xl border p-4" style={{ borderColor: theme.line, backgroundColor: theme.soft }}>
      <div className="space-y-2 text-sm text-slate-700">
        <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        {totalCGST ? <div className="flex justify-between"><span>CGST</span><span>{money(totalCGST)}</span></div> : null}
        {totalSGST ? <div className="flex justify-between"><span>SGST</span><span>{money(totalSGST)}</span></div> : null}
        {totalIGST ? <div className="flex justify-between"><span>IGST</span><span>{money(totalIGST)}</span></div> : null}
        <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold text-slate-900" style={{ borderColor: theme.line }}>
          <span>Total</span><span>{money(invoice?.grandTotal || 0)}</span>
        </div>
      </div>
    </div>
  )
}

function Footer({
  business,
  visibility,
  theme,
}: {
  business: TemplateBusinessRecord
  visibility: InvoiceVisibilitySettings
  theme: ModernTheme
}) {
  const showTermsInline = !theme.termsPage2
  return (
    <div className="eb-footer-grid grid grid-cols-2 gap-6 border-t pt-4" style={{ borderColor: theme.line }}>
      <div className="text-sm text-slate-700">
        {visibility.businessBankDetails && (business?.bankName || business?.accountNumber || business?.ifsc || business?.upi) ? (
          <>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Bank Details</p>
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
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Terms</p>
            <p className="mt-2 whitespace-pre-line">{business.terms}</p>
          </>
        ) : null}
      </div>
    </div>
  )
}

function TermsPage({
  business,
  visibility,
  theme,
}: {
  business: TemplateBusinessRecord
  visibility: InvoiceVisibilitySettings
  theme: ModernTheme
}) {
  if (!theme.termsPage2 || !visibility.businessTerms || !business?.terms) return null
  return (
    <div className="eb-content-block eb-terms-fullpage rounded-xl border bg-white p-6" style={{ borderColor: theme.line, minHeight: 980 }}>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Terms & Conditions</p>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{business.terms}</p>
    </div>
  )
}

export default function ModernTemplate({
  invoice,
  business,
  templateId,
  fontFamily = "system",
  fontSize,
  renderContext = "screen",
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
  const theme = resolveModernTheme(templateId) as TemplateTheme as ModernTheme
  const businessInfo = business || {}
  const details = invoice?.customDetails || []
  const visibility: InvoiceVisibilitySettings = invoiceVisibility || DEFAULT_INVOICE_VISIBILITY

  return (
    <div className="w-full p-6 text-slate-800" style={{ backgroundColor: theme.page, ...invoiceTemplateRootTypographyStyle(fontFamily, fontSize, renderContext) }}>
      <div className="eb-content-block">
        <Header invoice={invoice || undefined} business={businessInfo} visibility={visibility} theme={theme} formatDate={formatDate} dateFormat={dateFormat} />
      </div>
      <div className="eb-content-block">
        <Info invoice={invoice || undefined} details={details} visibility={visibility} theme={theme} />
      </div>
      <div className="eb-content-block eb-section eb-section-items mt-5 rounded-xl border bg-white p-4" style={{ borderColor: theme.line }}>
        <Items invoice={invoice || undefined} money={money} gstDisplay={gstDisplay} theme={theme} />
      </div>
      <div className="eb-content-block eb-section eb-section-summary mt-7 flex justify-end">
        <div className="w-[330px]">
          <Summary invoice={invoice || undefined} subtotal={subtotal || 0} totalCGST={totalCGST || 0} totalSGST={totalSGST || 0} totalIGST={totalIGST || 0} money={money} theme={theme} />
        </div>
      </div>
      <div className="eb-content-block eb-section eb-section-footer mt-5 rounded-xl border bg-white p-4" style={{ borderColor: theme.line }}>
        <Footer business={businessInfo} visibility={visibility} theme={theme} />
      </div>
      <TermsPage business={businessInfo} visibility={visibility} theme={theme} />
    </div>
  )
}

