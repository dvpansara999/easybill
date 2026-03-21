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

type MinimalTheme = {
  accent: string
  page: string
  soft: string
  line: string
  mode?: string
  summary?: string
  logo?: boolean
  shell: "plain" | "paper" | "boxed"
  info: "split" | "stack"
  termsPage2?: boolean
}

export const templateMeta = {
  id: "minimal-v01",
  name: "Minimal Pure A",
  category: "minimal",
  popular: true,
}

export const minimalThemes: Record<string, MinimalTheme> = {
  "minimal-mist": { accent: "#334155", page: "#ffffff", soft: "#ffffff", line: "#e2e8f0", shell: "plain", mode: "plain", summary: "clean", info: "split", logo: false },
  "minimal-inkgrid": { accent: "#0f172a", page: "#ffffff", soft: "#ffffff", line: "#dbe2eb", shell: "boxed", mode: "boxed", summary: "rule", info: "split", logo: false },
  "minimal-lattice": { accent: "#4338ca", page: "#f8faff", soft: "#eef2ff", line: "#d7dcff", shell: "paper", mode: "paper", summary: "panel", info: "stack", logo: true },
  "minimal-slateform": { accent: "#111827", page: "#fcfcfd", soft: "#f5f5f5", line: "#e5e7eb", shell: "boxed", mode: "boxed", summary: "rule", info: "split", logo: false },
  "minimal-legal": { accent: "#52525b", page: "#ffffff", soft: "#ffffff", line: "#e7e5e4", shell: "paper", mode: "paper", summary: "panel", info: "stack", logo: false },
  "minimal-airmail": { accent: "#0369a1", page: "#f8fcff", soft: "#f0f9ff", line: "#d5ebf8", shell: "plain", mode: "plain", summary: "clean", info: "split", logo: true },
}

const MINIMAL_SHELLS: MinimalTheme["shell"][] = ["plain", "boxed", "paper"]
const MINIMAL_INFO: MinimalTheme["info"][] = ["split", "stack"]
const MINIMAL_PALETTES = [
  { accent: "#334155", page: "#ffffff", soft: "#ffffff", line: "#e2e8f0" },
  { accent: "#0f172a", page: "#ffffff", soft: "#ffffff", line: "#dbe2eb" },
  { accent: "#4338ca", page: "#f8faff", soft: "#eef2ff", line: "#d7dcff" },
  { accent: "#111827", page: "#fcfcfd", soft: "#f5f5f5", line: "#e5e7eb" },
  { accent: "#52525b", page: "#ffffff", soft: "#ffffff", line: "#e7e5e4" },
  { accent: "#0369a1", page: "#f8fcff", soft: "#f0f9ff", line: "#d5ebf8" },
  { accent: "#047857", page: "#f7fffb", soft: "#e8fff7", line: "#d4f4e6" },
  { accent: "#7c2d12", page: "#fffaf7", soft: "#fff0e8", line: "#f5dbc9" },
] as const

function parseVariant(templateId: string | undefined) {
  const match = String(templateId || "minimal-v01").match(/(\d+)/)
  const n = match ? Number(match[1]) : 1
  return Number.isFinite(n) && n > 0 ? n : 1
}

function resolveMinimalTheme(templateId: string | undefined): MinimalTheme {
  const raw = String(templateId || "")
  const mapped = minimalThemes[raw]
  if (mapped) return { ...mapped, termsPage2: TERMS_PAGE2_TEMPLATE_IDS.has(raw) }
  const variant = parseVariant(raw)
  const layoutIndex = Math.floor((variant - 1) / 4)
  const paletteIndex = (variant - 1) % 4
  const palette = MINIMAL_PALETTES[(layoutIndex * 2 + paletteIndex) % MINIMAL_PALETTES.length]
  return {
    ...palette,
    shell: MINIMAL_SHELLS[layoutIndex % MINIMAL_SHELLS.length],
    info: MINIMAL_INFO[layoutIndex % MINIMAL_INFO.length],
    mode: layoutIndex % 2 === 0 ? "boxed" : "plain",
    summary: layoutIndex % 3 === 0 ? "panel" : layoutIndex % 3 === 1 ? "rule" : "clean",
    logo: layoutIndex % 4 !== 0,
    termsPage2: TERMS_PAGE2_TEMPLATE_IDS.has(raw),
  }
}

function logo(business: TemplateBusinessRecord, visibility: InvoiceVisibilitySettings) {
  if (!visibility.businessLogo || !business?.logo) return null
  const frameClass =
    business.logoShape === "round"
      ? "relative h-12 w-12 overflow-hidden rounded-full border border-slate-200"
      : "relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200"
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
  theme: MinimalTheme
  formatDate?: TemplateComponentProps["formatDate"]
  dateFormat: string
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b pb-4" style={{ borderColor: theme.line }}>
      <div>
        {logo(business, visibility)}
        {visibility.businessName ? <h1 className="mt-2 text-2xl font-semibold" style={{ color: theme.accent }}>{business.businessName || "BUSINESS"}</h1> : null}
        <div className="mt-2 space-y-1 text-sm text-slate-600">
          {visibility.businessAddress && business?.address && <p>{business.address}</p>}
          {visibility.businessPhone && business?.phone && <p>{business.phone}</p>}
          {business?.email && <p>{business.email}</p>}
          {visibility.businessGstin && business?.gst && <p>GSTIN: {business.gst}</p>}
        </div>
      </div>
      <div className="text-right text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Invoice #{invoice?.invoiceNumber || "-"}</p>
        <p>{formatDate?.(invoice?.date || "", dateFormat) || "-"}</p>
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
  theme: MinimalTheme
}) {
  const bill = (
    <div>
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
  const extra = (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Additional Details</p>
      <div className="mt-2 space-y-1 text-sm text-slate-600">
        {details.length ? details.map((detail, idx) => (
          <p key={idx}><span className="font-medium text-slate-900">{detail.label}:</span> {detail.value}</p>
        )) : <p>No additional details</p>}
      </div>
    </div>
  )
  if (theme.info === "stack") return <div className="mt-5 space-y-4">{bill}{extra}</div>
  return <div className="mt-5 grid grid-cols-2 gap-5">{bill}{extra}</div>
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
  theme: MinimalTheme
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-slate-500" style={{ borderColor: theme.line }}>
          <th className="py-2 text-left">Item</th><th className="py-2 text-left">HSN</th><th className="py-2 text-right">Qty</th>
          <th className="py-2 text-right">Price</th><th className="py-2 text-right">CGST</th><th className="py-2 text-right">SGST</th>
          <th className="py-2 text-right">IGST</th><th className="py-2 text-right">Amount</th>
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
              <td className="py-2">{item.product || "-"}</td><td className="py-2">{item.hsn || "-"}</td><td className="py-2 text-right">{item.qty || 0}</td>
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
  theme: MinimalTheme
}) {
  return (
    <div className="eb-summary-box rounded-lg border p-3" style={{ borderColor: theme.line }}>
      <div className="space-y-2 text-sm text-slate-700">
        <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="flex justify-between"><span>CGST</span><span>{totalCGST ? money(totalCGST) : "-"}</span></div>
        <div className="flex justify-between"><span>SGST</span><span>{totalSGST ? money(totalSGST) : "-"}</span></div>
        <div className="flex justify-between"><span>IGST</span><span>{totalIGST ? money(totalIGST) : "-"}</span></div>
        <div className="flex justify-between border-t pt-2 text-lg font-semibold text-slate-900" style={{ borderColor: theme.line }}>
          <span>Total</span><span>{money(invoice?.grandTotal || 0)}</span>
        </div>
      </div>
    </div>
  )
}

function footer({ business, visibility, theme }: { business: TemplateBusinessRecord; visibility: InvoiceVisibilitySettings; theme: MinimalTheme }) {
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

function termsPage({ business, visibility, theme }: { business: TemplateBusinessRecord; visibility: InvoiceVisibilitySettings; theme: MinimalTheme }) {
  if (!theme.termsPage2 || !visibility.businessTerms || !business?.terms) return null
  return (
    <div className="eb-content-block eb-terms-fullpage rounded-lg border p-6" style={{ borderColor: theme.line, backgroundColor: theme.soft, minHeight: 980 }}>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Terms & Conditions</p>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{business.terms}</p>
    </div>
  )
}

export default function MinimalTemplate({
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
  const theme = resolveMinimalTheme(templateId)
  const visibility: InvoiceVisibilitySettings = invoiceVisibility || DEFAULT_INVOICE_VISIBILITY
  const businessInfo = business || {}
  const details = invoice?.customDetails || []
  const shellClass = theme.shell === "paper" ? "rounded-lg border p-7" : theme.shell === "boxed" ? "rounded-2xl border p-6" : "p-6"

  return (
    <div className="w-full" style={{ backgroundColor: theme.page, ...invoiceTemplateRootTypographyStyle(fontFamily, fontSize, renderContext) }}>
      <div className={shellClass} style={{ borderColor: theme.line }}>
        <div className="eb-content-block">{header({ invoice: invoice || undefined, business: businessInfo, visibility, theme, formatDate, dateFormat })}</div>
        <div className="eb-content-block">{info({ invoice: invoice || undefined, details, visibility, theme })}</div>
        <div className="eb-content-block eb-section eb-section-items mt-5">{items({ invoice: invoice || undefined, money, gstDisplay, theme })}</div>
        <div className="eb-content-block eb-section eb-section-summary mt-5 flex justify-end">
          <div className="w-[320px]">{summary({ invoice: invoice || undefined, subtotal: subtotal || 0, totalCGST: totalCGST || 0, totalSGST: totalSGST || 0, totalIGST: totalIGST || 0, money, theme })}</div>
        </div>
        <div className="eb-content-block eb-section eb-section-footer mt-5">{footer({ business: businessInfo, visibility, theme })}</div>
        {termsPage({ business: businessInfo, visibility, theme })}
      </div>
    </div>
  )
}

