import Image from "next/image"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/context/SettingsContext"
import { invoiceTemplateRootTypographyStyle } from "@/lib/invoiceTemplateRootStyle"
import type {
  TemplateBusinessRecord,
  TemplateComponentProps,
  TemplateCustomDetail,
  TemplateInvoiceRecord,
} from "@/components/invoiceTemplates/templateTypes"

type ClassicTheme = {
  accent: string
  page: string
  paper?: string
  line: string
  info?: string
  serif?: boolean
  header: "formal" | "office" | "seal"
  table: "plain" | "boxed"
}

export const templateMeta = {
  id: "classic-registry",
  name: "Classic Registry",
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
  const borderWidth = theme.table === "boxed" ? "2px" : "1px"
  return (
    <table className="w-full text-sm" style={{ borderCollapse: "collapse", border: `${borderWidth} solid ${theme.line}` }}>
      <thead>
        <tr style={{ backgroundColor: "#f8fafc" }}>
          <th className="p-2 text-left" style={{ border: `${borderWidth} solid ${theme.line}` }}>Product</th>
          <th className="p-2 text-left" style={{ border: `${borderWidth} solid ${theme.line}` }}>HSN</th>
          <th className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>Qty</th>
          <th className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>Price</th>
          <th className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>CGST</th>
          <th className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>SGST</th>
          <th className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>IGST</th>
          <th className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {(invoice?.items || []).map((item, idx) => {
          const base = Number(item.qty || 0) * Number(item.price || 0)
          const cgstAmount = item.cgst ? (base * Number(item.cgst)) / 100 : 0
          const sgstAmount = item.sgst ? (base * Number(item.sgst)) / 100 : 0
          const igstAmount = item.igst ? (base * Number(item.igst)) / 100 : 0
          return (
            <tr key={idx}>
              <td className="p-2" style={{ border: `${borderWidth} solid ${theme.line}` }}>{item.product || "-"}</td>
              <td className="p-2" style={{ border: `${borderWidth} solid ${theme.line}` }}>{item.hsn || "-"}</td>
              <td className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>{item.qty || 0}</td>
              <td className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>{money(item.price || 0)}</td>
              <td className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>{gstDisplay(item.cgst, cgstAmount)}</td>
              <td className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>{gstDisplay(item.sgst, sgstAmount)}</td>
              <td className="p-2 text-right" style={{ border: `${borderWidth} solid ${theme.line}` }}>{gstDisplay(item.igst, igstAmount)}</td>
              <td className="p-2 text-right font-semibold" style={{ border: `${borderWidth} solid ${theme.line}` }}>{money(item.total || 0)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function summary({
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
  theme: ClassicTheme
}) {
  return (
    <div className="w-[320px] border p-4" style={{ borderColor: theme.line }}>
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

function footer({
  business,
  visibility,
  theme,
}: {
  business: TemplateBusinessRecord
  visibility: InvoiceVisibilitySettings
  theme: ClassicTheme
}) {
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
        {visibility.businessTerms && business?.terms ? (
          <>
            <p className="font-semibold">Terms</p>
            <p className="mt-2 whitespace-pre-line">{business.terms}</p>
          </>
        ) : null}
      </div>
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
  const theme = classicThemes[templateId || "classic-registry"] || classicThemes["classic-registry"]
  const businessInfo = business || {}
  const details = invoice?.customDetails || []
  const visibility: InvoiceVisibilitySettings = invoiceVisibility || DEFAULT_INVOICE_VISIBILITY

  return (
    <div className="w-full p-6 text-slate-800" style={{ backgroundColor: theme.page, ...invoiceTemplateRootTypographyStyle(fontFamily, fontSize, renderContext) }}>
      <div className="eb-content-block">{header({ invoice: invoice || undefined, business: businessInfo, visibility, theme, formatDate, dateFormat })}</div>
      <div className="eb-content-block">{info({ invoice: invoice || undefined, details, visibility, theme })}</div>
      <div className="eb-content-block eb-section eb-section-items mt-5">{items({ invoice: invoice || undefined, money, gstDisplay, theme })}</div>
      <div className="eb-content-block eb-section eb-section-summary mt-5 flex justify-end">{summary({ invoice: invoice || undefined, subtotal: subtotal || 0, totalCGST: totalCGST || 0, totalSGST: totalSGST || 0, totalIGST: totalIGST || 0, money, theme })}</div>
      <div className="eb-content-block eb-section eb-section-footer mt-5">{footer({ business: businessInfo, visibility, theme })}</div>
    </div>
  )
}

