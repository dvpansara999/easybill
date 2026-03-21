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

export const templateMeta = {
id:"modern-default",
name:"Modern Default",
category:"modern",
popular:true
}

export const modernThemes: Record<string, TemplateTheme> = {
"modern-default": { accent:"#0f172a", soft:"#e2e8f0", tint:"#f8fafc", mode:"banner", table:"lines", summary:"card", info:"split", logo:true },
"modern-pro": { accent:"#1d4ed8", soft:"#dbeafe", tint:"#f8fbff", mode:"split", table:"zebra", summary:"card", info:"stack", logo:false },
"modern-slate": { accent:"#334155", soft:"#cbd5e1", tint:"#f8fafc", mode:"banner", table:"grid", summary:"card", info:"cards", logo:true },
"modern-edge": { accent:"#111827", soft:"#e5e7eb", tint:"#ffffff", mode:"stripe", table:"lines", summary:"inline", info:"stack", logo:false },
"modern-clean": { accent:"#0f766e", soft:"#ccfbf1", tint:"#f0fdfa", mode:"split", table:"airy", summary:"card", info:"split", logo:false },
"modern-grid": { accent:"#7c3aed", soft:"#ede9fe", tint:"#faf5ff", mode:"gridHero", table:"grid", summary:"card", info:"cards", logo:false },
"modern-folio": { accent:"#1f2937", soft:"#e5e7eb", tint:"#fcfcfd", mode:"folio", table:"airy", summary:"boxed", info:"sidebar", logo:true },
"modern-frame": { accent:"#b45309", soft:"#fde68a", tint:"#fffbeb", mode:"frame", table:"lines", summary:"boxed", info:"split", logo:true },
"modern-glass": { accent:"#2563eb", soft:"#bfdbfe", tint:"#eff6ff", mode:"glass", table:"zebra", summary:"glass", info:"cards", logo:true },
"modern-neon": { accent:"#be185d", soft:"#fbcfe8", tint:"#fff1f8", mode:"stripe", table:"grid", summary:"card", info:"sidebar", logo:false },
"modern-stripe": { accent:"#ea580c", soft:"#fed7aa", tint:"#fff7ed", mode:"stripe", table:"lines", summary:"inline", info:"split", logo:true },
"modern-cobalt": { accent:"#1e40af", soft:"#bfdbfe", tint:"#eff6ff", mode:"side", table:"grid", summary:"card", info:"sidebar", logo:false },
"modern-zenith": { accent:"#4338ca", soft:"#c7d2fe", tint:"#eef2ff", mode:"banner", table:"airy", summary:"boxed", info:"cards", logo:true },
"modern-studio": { accent:"#059669", soft:"#a7f3d0", tint:"#ecfdf5", mode:"folio", table:"zebra", summary:"glass", info:"stack", logo:false },
"modern-fusion": { accent:"#dc2626", soft:"#fecaca", tint:"#fef2f2", mode:"split", table:"grid", summary:"card", info:"sidebar", logo:true },
"modern-orbit": { accent:"#0f766e", soft:"#ccfbf1", tint:"#f0fdfa", mode:"gridHero", table:"zebra", summary:"glass", info:"split", logo:true },
"modern-crest": { accent:"#7c2d12", soft:"#fed7aa", tint:"#fff7ed", mode:"frame", table:"grid", summary:"boxed", info:"cards", logo:true },
"modern-ribbon": { accent:"#be123c", soft:"#fecdd3", tint:"#fff1f2", mode:"stripe", table:"airy", summary:"inline", info:"stack", logo:false },
"modern-dock": { accent:"#1f2937", soft:"#d1d5db", tint:"#f9fafb", mode:"side", table:"lines", summary:"boxed", info:"sidebar", logo:true },
"modern-prime": { accent:"#1d4ed8", soft:"#bfdbfe", tint:"#eff6ff", mode:"banner", table:"grid", summary:"card", info:"split", logo:false },
"modern-aurora": { accent:"#0f172a", soft:"#dbeafe", tint:"#f8fafc", mode:"gridHero", table:"airy", summary:"glass", info:"cards", logo:true },
"modern-luxe": { accent:"#111827", soft:"#fde68a", tint:"#fffdf7", mode:"frame", table:"lines", summary:"boxed", info:"sidebar", logo:true }
,
// More unique modern layouts (not just color swaps)
"modern-bento": { accent:"#0f172a", soft:"#e0e7ff", tint:"#f8fafc", mode:"gridHero", table:"zebra", summary:"glass", info:"cards", logo:true },
"modern-eclipse": { accent:"#111827", soft:"#e5e7eb", tint:"#ffffff", mode:"side", table:"lines", summary:"boxed", info:"stack", logo:false },
"modern-mosaic": { accent:"#7c3aed", soft:"#ede9fe", tint:"#faf5ff", mode:"glass", table:"grid", summary:"glass", info:"sidebar", logo:true },
"modern-horizon": { accent:"#0f766e", soft:"#ccfbf1", tint:"#f0fdfa", mode:"split", table:"airy", summary:"inline", info:"split", logo:false },
"modern-vertex": { accent:"#1d4ed8", soft:"#bfdbfe", tint:"#eff6ff", mode:"banner", table:"lines", summary:"inline", info:"cards", logo:false },
"modern-capsule": { accent:"#be123c", soft:"#fecdd3", tint:"#fff1f2", mode:"stripe", table:"zebra", summary:"card", info:"stack", logo:false },
"modern-lens": { accent:"#2563eb", soft:"#bfdbfe", tint:"#eff6ff", mode:"folio", table:"airy", summary:"glass", info:"sidebar", logo:true },
"modern-flare": { accent:"#ea580c", soft:"#fed7aa", tint:"#fff7ed", mode:"frame", table:"grid", summary:"boxed", info:"cards", logo:true },
"modern-pulse": { accent:"#059669", soft:"#a7f3d0", tint:"#ecfdf5", mode:"glass", table:"zebra", summary:"glass", info:"split", logo:false },
"modern-ember": { accent:"#b45309", soft:"#fde68a", tint:"#fffbeb", mode:"stripe", table:"lines", summary:"inline", info:"sidebar", logo:true },
"modern-orchid": { accent:"#6d28d9", soft:"#ddd6fe", tint:"#faf5ff", mode:"split", table:"grid", summary:"card", info:"stack", logo:true },
"modern-coast": { accent:"#0f172a", soft:"#bae6fd", tint:"#f0f9ff", mode:"banner", table:"airy", summary:"boxed", info:"split", logo:true },
"modern-onyx": { accent:"#0b1220", soft:"#cbd5e1", tint:"#f8fafc", mode:"side", table:"grid", summary:"boxed", info:"cards", logo:false },
"modern-atelier": { accent:"#1f2937", soft:"#e5e7eb", tint:"#fcfcfd", mode:"folio", table:"lines", summary:"card", info:"split", logo:true }
}

function renderLogo(business: TemplateBusinessRecord, enabled:boolean, size:string){
if(!enabled || !business?.logo) return null

const frameClass = business?.logoShape === "round"
? "rounded-full border border-white/50 bg-white/90 p-1 object-cover"
: "rounded-2xl border border-white/50 bg-white/90 p-1 object-cover"

return (
<div className={`relative w-16 overflow-hidden ${size} ${frameClass}`}>
<Image src={business.logo} alt="" fill unoptimized className="object-cover" />
</div>
)
}

function renderBusinessContact(business: TemplateBusinessRecord, dark:boolean, visibility: InvoiceVisibilitySettings){
const textClass = dark ? "text-white/85" : "text-gray-600"
return(
<div className={`space-y-1 text-sm ${textClass}`}>
{visibility.businessAddress && business?.address && <p>{business.address}</p>}
{visibility.businessPhone && business?.phone && <p>{business.phone}</p>}
{business?.email && <p>{business.email}</p>}
{visibility.businessGstin && business?.gst && <p>GSTIN: {business.gst}</p>}
</div>
)
}

function renderBillTo(invoice: TemplateInvoiceRecord | undefined, visibility: InvoiceVisibilitySettings){
return(
<div>
<p className="text-xs uppercase tracking-[0.25em] text-gray-500">Bill To</p>
<p className="mt-2 text-xl font-semibold text-gray-900">{visibility.clientName ? invoice?.clientName || "-" : "-"}</p>
<div className="mt-2 space-y-1 text-sm text-gray-600">
{visibility.clientPhone && invoice?.clientPhone && <p>{invoice.clientPhone}</p>}
{invoice?.clientEmail && <p>{invoice.clientEmail}</p>}
{visibility.clientGstin && invoice?.clientGST && <p>GSTIN: {invoice.clientGST}</p>}
{visibility.clientAddress && invoice?.clientAddress && <p>{invoice.clientAddress}</p>}
</div>
</div>
)
}

function renderDetails(details: TemplateCustomDetail[]){
if(!details?.length){
return <p className="text-sm text-gray-400">No additional details</p>
}

return(
<div>
<p className="text-xs uppercase tracking-[0.25em] text-gray-500">Additional Details</p>
<div className="mt-2 space-y-1 text-sm text-gray-600">
{details.map((detail, index:number)=>(
<p key={index}>
<span className="font-semibold text-gray-800">{detail.label}:</span> {detail.value}
</p>
))}
</div>
</div>
)
}

function renderInfoBlocks(invoice: TemplateInvoiceRecord | undefined, details: TemplateCustomDetail[], theme: TemplateTheme, visibility: InvoiceVisibilitySettings){
if(theme.info === "stack"){
return(
<div className="mt-8 space-y-6">
<div className="rounded-2xl bg-white p-6 shadow-sm">{renderBillTo(invoice, visibility)}</div>
<div className="rounded-2xl bg-white p-6 shadow-sm">{renderDetails(details)}</div>
</div>
)}

if(theme.info === "cards"){
return(
<div className="mt-8 grid grid-cols-3 gap-6">
<div className="col-span-2 rounded-2xl bg-white p-6 shadow-sm">{renderBillTo(invoice, visibility)}</div>
<div className="rounded-2xl bg-white p-6 shadow-sm">{renderDetails(details)}</div>
</div>
)}

if(theme.info === "sidebar"){
return(
<div className="mt-8 grid grid-cols-[0.85fr_1.15fr] gap-8">
<div className="rounded-2xl bg-white p-6 shadow-sm">{renderDetails(details)}</div>
<div className="rounded-2xl bg-white p-6 shadow-sm">{renderBillTo(invoice, visibility)}</div>
</div>
)}

return(
<div className="mt-8 grid grid-cols-[1.1fr_0.9fr] gap-8">
<div className="rounded-2xl bg-white p-6 shadow-sm">{renderBillTo(invoice, visibility)}</div>
<div className="rounded-2xl bg-white p-6 shadow-sm">{renderDetails(details)}</div>
</div>
)}

function renderItemsTable(
  invoice: TemplateInvoiceRecord | undefined,
  money: TemplateComponentProps["money"],
  gstDisplay: TemplateComponentProps["gstDisplay"],
  theme: TemplateTheme
){
const rows = invoice?.items || []
const tableClass = theme.table === "grid" ? "w-full text-sm border border-gray-200" : "w-full text-sm"
const headerClass = theme.table === "airy"
? "text-left text-xs uppercase tracking-[0.22em] text-gray-500 border-b"
: "text-left text-sm text-gray-700 border-b bg-gray-50"

return(
<div className={`overflow-hidden rounded-xl ${theme.table === "grid" ? "shadow-sm" : ""}`}>
<table className={tableClass}>
<thead>
<tr className={headerClass}>
<th className="px-4 py-3">Item</th>
<th className="px-4 py-3">HSN</th>
<th className="px-4 py-3 text-right">Qty</th>
<th className="px-4 py-3 text-right">Price</th>
<th className="px-4 py-3 text-right">CGST</th>
<th className="px-4 py-3 text-right">SGST</th>
<th className="px-4 py-3 text-right">IGST</th>
<th className="px-4 py-3 text-right">Amount</th>
</tr>
</thead>
<tbody>
{rows.map((item, index:number)=>{
const rowTone = theme.table === "zebra" && index % 2 === 1 ? "bg-gray-50" : ""
const base = Number(item.qty ?? 0) * Number(item.price ?? 0)
const cgstAmount = item.cgst ? (base * Number(item.cgst)) / 100 : 0
const sgstAmount = item.sgst ? (base * Number(item.sgst)) / 100 : 0
const igstAmount = item.igst ? (base * Number(item.igst)) / 100 : 0
const borderClass = theme.table === "grid" ? "border-t border-gray-200" : "border-b border-gray-200"

return(
<tr key={index} className={`${borderClass} ${rowTone}`}>
<td className="px-4 py-3">{item.product || "-"}</td>
<td className="px-4 py-3">{item.hsn || "-"}</td>
<td className="px-4 py-3 text-right">{item.qty ?? 0}</td>
<td className="px-4 py-3 text-right">{money(item.price ?? 0)}</td>
<td className="px-4 py-3 text-right">{gstDisplay(item.cgst, cgstAmount)}</td>
<td className="px-4 py-3 text-right">{gstDisplay(item.sgst, sgstAmount)}</td>
<td className="px-4 py-3 text-right">{gstDisplay(item.igst, igstAmount)}</td>
<td className="px-4 py-3 text-right font-semibold">{money(item.total ?? 0)}</td>
</tr>
)})}
</tbody>
</table>
</div>
)
}

function renderSummary(
  invoice: TemplateInvoiceRecord | undefined,
  subtotal:number,
  totalCGST:number,
  totalSGST:number,
  totalIGST:number,
  money: TemplateComponentProps["money"],
  theme: TemplateTheme
){
const wrapperClass =
theme.summary === "glass"
? "rounded-2xl border border-white/60 bg-white/70 backdrop-blur p-5"
: theme.summary === "boxed"
? "rounded-xl border border-gray-300 bg-white p-5"
: theme.summary === "inline"
? "rounded-xl border-t-4 bg-gray-50 p-5"
: "rounded-2xl bg-gray-900 text-white p-5"

return(
<div className={wrapperClass} style={theme.summary === "inline" ? { borderTopColor: theme.accent } : undefined}>
<div className={`space-y-2 text-sm ${theme.summary === "card" ? "text-white" : "text-gray-700"}`}>
<div className="flex justify-between gap-8"><span>Subtotal</span><span>{money(subtotal)}</span></div>
<div className="flex justify-between gap-8"><span>CGST</span><span>{totalCGST ? money(totalCGST) : "-"}</span></div>
<div className="flex justify-between gap-8"><span>SGST</span><span>{totalSGST ? money(totalSGST) : "-"}</span></div>
<div className="flex justify-between gap-8"><span>IGST</span><span>{totalIGST ? money(totalIGST) : "-"}</span></div>
<div className={`mt-3 flex justify-between border-t pt-3 text-lg font-bold ${theme.summary === "card" ? "border-white/20 text-white" : "border-gray-300 text-gray-900"}`}>
<span>Total</span>
<span>{money(invoice?.grandTotal ?? 0)}</span>
</div>
</div>
</div>
)
}

function renderFooter(business: TemplateBusinessRecord, visibility: InvoiceVisibilitySettings){
return(
<div className="grid grid-cols-2 gap-8 border-t border-gray-200 pt-6">
<div>
{visibility.businessBankDetails && (business?.bankName || business?.accountNumber || business?.upi) && (
<>
<p className="text-xs uppercase tracking-[0.22em] text-gray-500">Bank Details</p>
<div className="mt-2 space-y-1 text-sm text-gray-600">
{business?.bankName && <p>Bank: {business.bankName}</p>}
{business?.accountNumber && <p>Account: {business.accountNumber}</p>}
{business?.ifsc && <p>IFSC: {business.ifsc}</p>}
{business?.upi && <p>UPI: {business.upi}</p>}
</div>
</>
)}
</div>
<div>
{visibility.businessTerms && business?.terms && (
<>
<p className="text-xs uppercase tracking-[0.22em] text-gray-500">Terms</p>
<p className="mt-2 whitespace-pre-line text-sm text-gray-600">{business.terms}</p>
</>
)}
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
invoiceVisibility
}: TemplateComponentProps){

const details = invoice?.customDetails || []
const businessInfo = business || {}
const theme = modernThemes[templateId ?? "modern-default"] || modernThemes["modern-default"]
const visibility: InvoiceVisibilitySettings = invoiceVisibility || DEFAULT_INVOICE_VISIBILITY
const businessName = visibility.businessName ? businessInfo?.businessName || "BUSINESS" : ""

return(
<div
className="w-full bg-white text-gray-900"
style={{
    backgroundColor: theme.tint,
    ...invoiceTemplateRootTypographyStyle(fontFamily, fontSize, renderContext),
  }}
>

{theme.mode === "banner" && (
<div className="rounded-[28px] p-8 text-white" style={{ backgroundColor: theme.accent }}>
<div className="flex items-start justify-between gap-8">
<div className="max-w-[65%]">
{renderLogo(businessInfo, theme.logo && visibility.businessLogo, "mb-5 h-16 object-contain")}
<p className="text-xs uppercase tracking-[0.35em] text-white/70">Invoice</p>
{visibility.businessName ? <h1 className="mt-3 text-4xl font-bold">{businessName}</h1> : null}
<p className="mt-3 text-lg text-white/80">Invoice #{invoice?.invoiceNumber}</p>
<div className="mt-6">{renderBusinessContact(businessInfo, true, visibility)}</div>
</div>
<div className="rounded-2xl bg-white/10 px-5 py-4 text-right text-sm">
<p className="text-white/70">Issue Date</p>
<p className="mt-2 text-2xl font-semibold">{formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
</div>
</div>
)}

{theme.mode === "split" && (
<div className="grid grid-cols-[1.35fr_0.9fr] overflow-hidden rounded-[26px] border border-gray-200 bg-white">
<div className="p-8">
{renderLogo(businessInfo, theme.logo && visibility.businessLogo, "mb-5 h-14 object-contain")}
<p className="text-xs uppercase tracking-[0.35em]" style={{ color: theme.accent }}>Invoice</p>
{visibility.businessName ? <h1 className="mt-3 text-4xl font-bold text-gray-900">{businessName}</h1> : null}
<p className="mt-3 text-lg text-gray-500">Invoice #{invoice?.invoiceNumber}</p>
<div className="mt-6">{renderBusinessContact(businessInfo, false, visibility)}</div>
</div>
<div className="p-8 text-white" style={{ backgroundColor: theme.accent }}>
<p className="text-sm text-white/70">Date</p>
<p className="mt-2 text-3xl font-bold">{formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
</div>
)}

{theme.mode === "stripe" && (
<div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white">
<div className="h-3" style={{ backgroundColor: theme.accent }} />
<div className="flex items-start justify-between gap-8 p-8">
<div>
{renderLogo(businessInfo, theme.logo && visibility.businessLogo, "mb-5 h-14 object-contain")}
{visibility.businessName ? <h1 className="text-4xl font-bold text-gray-900">{businessName}</h1> : null}
<p className="mt-2 text-lg text-gray-500">Invoice #{invoice?.invoiceNumber}</p>
<div className="mt-5">{renderBusinessContact(businessInfo, false, visibility)}</div>
</div>
<div className="rounded-2xl px-5 py-4 text-right" style={{ backgroundColor: theme.soft }}>
<p className="text-sm text-gray-500">Date</p>
<p className="mt-2 text-2xl font-semibold text-gray-900">{formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
</div>
</div>
)}

{theme.mode === "gridHero" && (
<div className="grid grid-cols-[1fr_1fr] gap-4">
<div className="rounded-[24px] p-8 text-white" style={{ backgroundColor: theme.accent }}>
{renderLogo(businessInfo, theme.logo && visibility.businessLogo, "mb-5 h-16 object-contain")}
<p className="text-xs uppercase tracking-[0.35em] text-white/70">Invoice</p>
{visibility.businessName ? <h1 className="mt-4 text-4xl font-bold">{businessName}</h1> : null}
<p className="mt-3 text-lg text-white/80">Invoice #{invoice?.invoiceNumber}</p>
</div>
<div className="rounded-[24px] p-8" style={{ backgroundColor: theme.soft }}>
<p className="text-sm text-gray-500">Issued On</p>
<p className="mt-2 text-3xl font-bold text-gray-900">{formatDate?.(invoice?.date ?? "",dateFormat)}</p>
<div className="mt-5">{renderBusinessContact(businessInfo, false, visibility)}</div>
</div>
</div>
)}

{theme.mode === "folio" && (
<div className="rounded-[26px] border border-gray-200 bg-white p-8 shadow-sm">
<div className="flex items-end justify-between gap-6">
<div>
{renderLogo(businessInfo, theme.logo && visibility.businessLogo, "mb-5 h-14 object-contain")}
<p className="text-xs uppercase tracking-[0.35em]" style={{ color: theme.accent }}>Business Invoice</p>
{visibility.businessName ? <h1 className="mt-3 text-4xl font-bold text-gray-900">{businessName}</h1> : null}
</div>
<div className="text-right">
<p className="text-sm text-gray-500">Invoice #{invoice?.invoiceNumber}</p>
<p className="mt-2 text-xl font-semibold text-gray-900">{formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
</div>
<div className="mt-6">{renderBusinessContact(businessInfo, false, visibility)}</div>
</div>
)}

{theme.mode === "frame" && (
<div className="rounded-[28px] border-2 bg-white p-3" style={{ borderColor: theme.accent }}>
<div className="rounded-[22px] p-8" style={{ border:`1px solid ${theme.soft}` }}>
<div className="flex items-start justify-between gap-8">
<div>
{renderLogo(businessInfo, theme.logo && visibility.businessLogo, "mb-5 h-16 object-contain")}
{visibility.businessName ? (
  <h1 className="text-4xl font-bold" style={{ color: theme.accent }}>
    {businessName}
  </h1>
) : null}
<p className="mt-3 text-lg text-gray-500">Invoice #{invoice?.invoiceNumber}</p>
<div className="mt-6">{renderBusinessContact(businessInfo, false, visibility)}</div>
</div>
<div className="text-right">
<p className="text-sm text-gray-500">Date</p>
<p className="mt-2 text-2xl font-semibold text-gray-900">{formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
</div>
</div>
</div>
)}

{theme.mode === "glass" && (
<div className="rounded-[28px] border border-white/70 bg-white/60 p-8 shadow-sm backdrop-blur">
<div className="flex items-start justify-between gap-8">
<div>
{renderLogo(businessInfo, theme.logo && visibility.businessLogo, "mb-5 h-14 object-contain")}
{visibility.businessName ? <h1 className="text-4xl font-bold text-gray-900">{businessName}</h1> : null}
<p className="mt-3 text-lg text-gray-500">Invoice #{invoice?.invoiceNumber}</p>
<div className="mt-6">{renderBusinessContact(businessInfo, false, visibility)}</div>
</div>
<div className="rounded-2xl px-5 py-4" style={{ backgroundColor: theme.soft }}>
<p className="text-sm text-gray-500">Date</p>
<p className="mt-2 text-2xl font-semibold text-gray-900">{formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
</div>
</div>
)}

{theme.mode === "side" && (
<div className="grid grid-cols-[260px_1fr] overflow-hidden rounded-[28px] border border-gray-200 bg-white">
<div className="p-8 text-white" style={{ backgroundColor: theme.accent }}>
<p className="text-xs uppercase tracking-[0.35em] text-white/70">Invoice</p>
<p className="mt-6 text-sm text-white/70">No.</p>
<p className="text-2xl font-bold">{invoice?.invoiceNumber}</p>
<p className="mt-6 text-sm text-white/70">Date</p>
<p className="text-xl font-semibold">{formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
<div className="p-8">
{renderLogo(businessInfo, theme.logo && visibility.businessLogo, "mb-5 h-14 object-contain")}
{visibility.businessName ? <h1 className="text-4xl font-bold text-gray-900">{businessName}</h1> : null}
<div className="mt-6">{renderBusinessContact(businessInfo, false, visibility)}</div>
</div>
</div>
)}

{renderInfoBlocks(invoice ?? undefined, details, theme, visibility)}

<div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
{renderItemsTable(invoice ?? undefined,money,gstDisplay,theme)}
</div>

<div className="mt-8 flex justify-end">
<div className="w-[360px]">
{renderSummary(invoice ?? undefined,subtotal ?? 0,totalCGST ?? 0,totalSGST ?? 0,totalIGST ?? 0,money,theme)}
</div>
</div>

<div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
{renderFooter(businessInfo, visibility)}
</div>

</div>
)
}
