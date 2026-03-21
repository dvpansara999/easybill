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
}

export const templateMeta = {
  id: "modern-atlas",
  name: "Modern Atlas",
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
  return (
    <div className="mt-5 grid grid-cols-2 gap-5">
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
      <div className="rounded-xl border bg-white p-4" style={{ borderColor: theme.line }}>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Additional Details</p>
        <div className="mt-2 space-y-1 text-sm text-slate-600">
          {details.length ? details.map((detail, idx) => (
            <p key={idx}><span className="font-semibold text-slate-800">{detail.label}:</span> {detail.value}</p>
          )) : <p>No additional details</p>}
        </div>
      </div>
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
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-slate-600" style={{ borderColor: theme.line }}>
          <th className="py-3 text-left">Item</th><th className="py-3 text-left">HSN</th><th className="py-3 text-right">Qty</th>
          <th className="py-3 text-right">Price</th><th className="py-3 text-right">CGST</th><th className="py-3 text-right">SGST</th>
          <th className="py-3 text-right">IGST</th><th className="py-3 text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {(invoice?.items || []).map((item, idx) => {
          const base = Number(item.qty || 0) * Number(item.price || 0)
          const cgstAmount = item.cgst ? (base * Number(item.cgst)) / 100 : 0
          const sgstAmount = item.sgst ? (base * Number(item.sgst)) / 100 : 0
          const igstAmount = item.igst ? (base * Number(item.igst)) / 100 : 0
          return (
            <tr key={idx} className="border-b" style={{ borderColor: theme.line }}>
              <td className="py-2">{item.product || "-"}</td>
              <td className="py-2">{item.hsn || "-"}</td>
              <td className="py-2 text-right">{item.qty || 0}</td>
              <td className="py-2 text-right">{money(item.price || 0)}</td>
              <td className="py-2 text-right">{gstDisplay(item.cgst, cgstAmount)}</td>
              <td className="py-2 text-right">{gstDisplay(item.sgst, sgstAmount)}</td>
              <td className="py-2 text-right">{gstDisplay(item.igst, igstAmount)}</td>
              <td className="py-2 text-right font-semibold">{money(item.total || 0)}</td>
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
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: theme.line, backgroundColor: theme.soft }}>
      <div className="space-y-2 text-sm text-slate-700">
        <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="flex justify-between"><span>CGST</span><span>{totalCGST ? money(totalCGST) : "-"}</span></div>
        <div className="flex justify-between"><span>SGST</span><span>{totalSGST ? money(totalSGST) : "-"}</span></div>
        <div className="flex justify-between"><span>IGST</span><span>{totalIGST ? money(totalIGST) : "-"}</span></div>
        <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold text-slate-900" style={{ borderColor: theme.line }}>
          <span>Total</span><span>{money(invoice?.grandTotal || 0)}</span>
        </div>
      </div>
    </div>
  )
}

function Footer({ business, visibility, theme }: { business: TemplateBusinessRecord; visibility: InvoiceVisibilitySettings; theme: ModernTheme }) {
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
        {visibility.businessTerms && business?.terms ? (
          <>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Terms</p>
            <p className="mt-2 whitespace-pre-line">{business.terms}</p>
          </>
        ) : null}
      </div>
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
  const theme = (modernThemes[templateId || "modern-atlas"] || modernThemes["modern-atlas"]) as TemplateTheme as ModernTheme
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
      <div className="eb-content-block eb-section eb-section-summary mt-5 flex justify-end">
        <div className="w-[330px]">
          <Summary invoice={invoice || undefined} subtotal={subtotal || 0} totalCGST={totalCGST || 0} totalSGST={totalSGST || 0} totalIGST={totalIGST || 0} money={money} theme={theme} />
        </div>
      </div>
      <div className="eb-content-block eb-section eb-section-footer mt-5 rounded-xl border bg-white p-4" style={{ borderColor: theme.line }}>
        <Footer business={businessInfo} visibility={visibility} theme={theme} />
      </div>
    </div>
  )
}

