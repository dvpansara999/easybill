import Image from "next/image"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/context/SettingsContext"
import { invoiceTemplateRootTypographyStyle } from "@/lib/invoiceTemplateRootStyle"
import type {
  TemplateBusinessRecord,
  TemplateComponentProps,
  TemplateFooterProps,
  TemplateHeaderProps,
  TemplateInfoProps,
  TemplateItemsProps,
  TemplateSummaryProps,
  TemplateTheme,
} from "@/components/invoiceTemplates/templateTypes"

export const templateMeta = {
id:"classic-ledger",
name:"Classic Ledger",
category:"classic",
popular:true
}

export const classicThemes: Record<string, TemplateTheme> = {
"classic-ledger": { accent:"#111827", paper:"#fffdf8", border:"#6b7280", header:"ledger", table:"ledger", serif:false, info:"split", logo:false },
"classic-bold": { accent:"#111827", paper:"#ffffff", border:"#374151", header:"double", table:"heavy", serif:false, info:"stack", logo:false },
"classic-office": { accent:"#1f2937", paper:"#ffffff", border:"#9ca3af", header:"office", table:"plain", serif:false, info:"detailsFirst", logo:true },
"classic-india": { accent:"#7c2d12", paper:"#fffaf0", border:"#b45309", header:"seal", table:"tax", serif:true, info:"split", logo:true },
"classic-gst": { accent:"#0f172a", paper:"#ffffff", border:"#475569", header:"tax", table:"tax", serif:false, info:"stack", logo:false },
"classic-serif": { accent:"#1f2937", paper:"#fffdf8", border:"#78716c", header:"serif", table:"plain", serif:true, info:"detailsFirst", logo:false },
"classic-heritage": { accent:"#78350f", paper:"#fffbeb", border:"#b45309", header:"heritage", table:"ledger", serif:true, info:"stack", logo:true },
"classic-ivory": { accent:"#44403c", paper:"#fffdf5", border:"#a8a29e", header:"serif", table:"plain", serif:true, info:"stack", logo:false },
"classic-border": { accent:"#111827", paper:"#ffffff", border:"#111827", header:"border", table:"heavy", serif:false, info:"split", logo:true },
"classic-registrar": { accent:"#1e293b", paper:"#ffffff", border:"#64748b", header:"registry", table:"ledger", serif:false, info:"detailsFirst", logo:false },
"classic-formal": { accent:"#172554", paper:"#ffffff", border:"#94a3b8", header:"formal", table:"plain", serif:true, info:"split", logo:false },
"classic-trader": { accent:"#7c2d12", paper:"#fff7ed", border:"#c2410c", header:"office", table:"tax", serif:false, info:"stack", logo:true },
"classic-stamp": { accent:"#991b1b", paper:"#fffdfc", border:"#b91c1c", header:"stamp", table:"ledger", serif:true, info:"split", logo:true },
"classic-colonial": { accent:"#4c1d95", paper:"#faf5ff", border:"#7c3aed", header:"heritage", table:"plain", serif:true, info:"split", logo:false },
"classic-notary": { accent:"#1f2937", paper:"#fffdf8", border:"#52525b", header:"registry", table:"heavy", serif:false, info:"stack", logo:false },
"classic-merchant": { accent:"#92400e", paper:"#fffbeb", border:"#b45309", header:"office", table:"ledger", serif:false, info:"detailsFirst", logo:true },
"classic-charter": { accent:"#172554", paper:"#eff6ff", border:"#60a5fa", header:"formal", table:"plain", serif:true, info:"split", logo:false },
"classic-vintage": { accent:"#7c2d12", paper:"#fef2f2", border:"#d97706", header:"seal", table:"plain", serif:true, info:"stack", logo:true },
"classic-royal": { accent:"#581c87", paper:"#faf5ff", border:"#9333ea", header:"stamp", table:"tax", serif:true, info:"detailsFirst", logo:true }
,
// More unique classic layouts (different header/table/info combinations)
"classic-parchment": { accent:"#78350f", paper:"#fffbeb", border:"#b45309", header:"seal", table:"ledger", serif:true, info:"split", logo:true },
"classic-courier": { accent:"#111827", paper:"#ffffff", border:"#111827", header:"registry", table:"plain", serif:false, info:"detailsFirst", logo:false },
"classic-deed": { accent:"#374151", paper:"#fffdf8", border:"#78716c", header:"formal", table:"ledger", serif:true, info:"split", logo:false },
"classic-stationery": { accent:"#1e3a8a", paper:"#eff6ff", border:"#60a5fa", header:"double", table:"plain", serif:true, info:"stack", logo:false },
"classic-copperplate": { accent:"#92400e", paper:"#fffbeb", border:"#b45309", header:"stamp", table:"heavy", serif:true, info:"detailsFirst", logo:true },
"classic-saffron": { accent:"#9a3412", paper:"#fff7ed", border:"#ea580c", header:"tax", table:"tax", serif:false, info:"stack", logo:true },
"classic-carbon": { accent:"#111827", paper:"#ffffff", border:"#374151", header:"office", table:"heavy", serif:false, info:"split", logo:false },
"classic-archive": { accent:"#334155", paper:"#f8fafc", border:"#94a3b8", header:"registry", table:"ledger", serif:false, info:"split", logo:false },
"classic-marble": { accent:"#57534e", paper:"#fffdf5", border:"#a8a29e", header:"serif", table:"plain", serif:true, info:"stack", logo:false },
"classic-sealblue": { accent:"#1d4ed8", paper:"#eff6ff", border:"#93c5fd", header:"seal", table:"plain", serif:true, info:"split", logo:true },
"classic-press": { accent:"#111827", paper:"#ffffff", border:"#6b7280", header:"ledger", table:"ledger", serif:false, info:"stack", logo:false },
"classic-crown": { accent:"#6d28d9", paper:"#faf5ff", border:"#a78bfa", header:"stamp", table:"plain", serif:true, info:"detailsFirst", logo:true },
"classic-vellum": { accent:"#0f172a", paper:"#fffdf8", border:"#64748b", header:"formal", table:"plain", serif:true, info:"split", logo:false }
}

function classicFontClass(serif:boolean){
return serif ? "font-serif" : ""
}

function renderClassicLogo(business: TemplateBusinessRecord, enabled:boolean){
if(!enabled || !business?.logo) return null
const frameClass = business?.logoShape === "round"
? "mb-4 h-14 w-14 rounded-full border border-gray-300 bg-white p-1 object-cover"
: "mb-4 h-14 w-14 rounded-xl border border-gray-300 bg-white p-1 object-cover"
return (
<div className={`relative overflow-hidden ${frameClass}`}>
<Image src={business.logo} alt="" fill unoptimized className="object-cover" />
</div>
)
}

function ClassicHeader({invoice,businessInfo,formatDate,dateFormat,theme,visibility}: TemplateHeaderProps){
const fontClass = classicFontClass(theme.serif)
const businessName = visibility.businessName ? businessInfo?.businessName || "BUSINESS NAME" : ""

if(theme.header === "double"){
return(
<div className={`border-y-4 py-4 ${fontClass}`} style={{ borderColor: theme.border }}>
<div className="flex justify-between gap-8">
<div>
{renderClassicLogo(businessInfo, theme.logo && visibility.businessLogo)}
{visibility.businessName ? <h1 className="text-3xl font-bold" style={{ color: theme.accent }}>{businessName}</h1> : null}
{visibility.businessAddress ? <p className="mt-2 text-sm text-gray-600">{businessInfo?.address || ""}</p> : null}
<div className="mt-2 space-y-1 text-sm text-gray-700">
{visibility.businessPhone && businessInfo?.phone && <p>{businessInfo.phone}</p>}
{businessInfo?.email && <p>{businessInfo.email}</p>}
{visibility.businessGstin && businessInfo?.gst && <p>GSTIN: {businessInfo.gst}</p>}
</div>
</div>
<div className="text-right text-sm">
<p><b>Invoice:</b> {invoice?.invoiceNumber || "-"}</p>
<p><b>Date:</b> {formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
</div>
</div>
)}

if(theme.header === "tax"){
return(
<div className={`border rounded-md p-5 ${fontClass}`} style={{ borderColor: theme.border }}>
<div className="flex justify-between gap-8">
<div>
{renderClassicLogo(businessInfo, theme.logo && visibility.businessLogo)}
<p className="text-xs uppercase tracking-[0.3em]" style={{ color: theme.accent }}>Tax Invoice</p>
{visibility.businessName ? <h1 className="mt-2 text-3xl font-bold" style={{ color: theme.accent }}>{businessName}</h1> : null}
 <div className="mt-3 space-y-1 text-sm text-gray-700">
 {visibility.businessAddress && businessInfo?.address && <p>{businessInfo.address}</p>}
 {visibility.businessPhone && businessInfo?.phone && <p>{businessInfo.phone}</p>}
 {businessInfo?.email && <p>{businessInfo.email}</p>}
 {visibility.businessGstin && businessInfo?.gst && <p>GSTIN: {businessInfo.gst}</p>}
 </div>
</div>
<div className="min-w-[180px] border-l pl-5 text-sm" style={{ borderColor: theme.border }}>
<p><b>Invoice No:</b> {invoice?.invoiceNumber || "-"}</p>
<p className="mt-2"><b>Date:</b> {formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
</div>
</div>
)}

if(theme.header === "seal" || theme.header === "stamp"){
return(
<div className={`border-2 p-5 ${fontClass}`} style={{ borderColor: theme.border }}>
<div className="flex justify-between gap-8">
<div>
{renderClassicLogo(businessInfo, theme.logo && visibility.businessLogo)}
{visibility.businessName ? <h1 className="text-3xl font-bold" style={{ color: theme.accent }}>{businessName}</h1> : null}
<div className="mt-3 space-y-1 text-sm text-gray-700">
{businessInfo?.address && <p>{businessInfo.address}</p>}
{visibility.businessPhone && businessInfo?.phone && <p>{businessInfo.phone}</p>}
{businessInfo?.email && <p>{businessInfo.email}</p>}
{visibility.businessGstin && businessInfo?.gst && <p>GSTIN: {businessInfo.gst}</p>}
</div>
</div>
<div className="text-right">
<div className="inline-block rounded-full border px-4 py-2 text-xs uppercase tracking-[0.25em]" style={{ borderColor: theme.border, color: theme.accent }}>
{theme.header === "stamp" ? "Approved Copy" : "Registered Invoice"}
</div>
<div className="mt-4 text-sm">
<p><b>Invoice:</b> {invoice?.invoiceNumber || "-"}</p>
<p><b>Date:</b> {formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
</div>
</div>
</div>
)}

if(theme.header === "registry" || theme.header === "formal"){
return(
<div className={`pb-4 border-b-2 ${fontClass}`} style={{ borderColor: theme.border }}>
<div className="text-center">
{renderClassicLogo(businessInfo, theme.logo && visibility.businessLogo)}
{visibility.businessName ? <h1 className="text-3xl font-bold" style={{ color: theme.accent }}>{businessName}</h1> : null}
{visibility.businessAddress ? <p className="mt-2 text-sm text-gray-600">{businessInfo?.address || ""}</p> : null}
<div className="mt-2 flex justify-center gap-4 text-sm text-gray-700">
{visibility.businessPhone && businessInfo?.phone && <span>{businessInfo.phone}</span>}
{businessInfo?.email && <span>{businessInfo.email}</span>}
{visibility.businessGstin && businessInfo?.gst && <span>GSTIN: {businessInfo.gst}</span>}
</div>
</div>
<div className="mt-4 flex justify-between text-sm">
<p><b>Invoice:</b> {invoice?.invoiceNumber || "-"}</p>
<p><b>Date:</b> {formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
</div>
)}

return(
<div className={`border-b pb-4 ${fontClass}`} style={{ borderColor: theme.border }}>
<div className="flex justify-between gap-8">
<div>
{renderClassicLogo(businessInfo, theme.logo && visibility.businessLogo)}
{visibility.businessName ? <h1 className="text-3xl font-bold" style={{ color: theme.accent }}>{businessName}</h1> : null}
{visibility.businessAddress ? <p className="mt-2 text-sm text-gray-600">{businessInfo?.address || ""}</p> : null}
<div className="mt-2 space-y-1 text-sm text-gray-700">
{visibility.businessPhone && businessInfo?.phone && <p>{businessInfo.phone}</p>}
{businessInfo?.email && <p>{businessInfo.email}</p>}
{visibility.businessGstin && businessInfo?.gst && <p>GSTIN: {businessInfo.gst}</p>}
</div>
</div>
<div className="text-right text-sm">
<p><b>Invoice:</b> {invoice?.invoiceNumber || "-"}</p>
<p><b>Date:</b> {formatDate?.(invoice?.date ?? "",dateFormat)}</p>
</div>
</div>
</div>
)}

function ClassicBillTo({invoice,details,theme,visibility}: TemplateInfoProps){
if(theme.info === "stack"){
return(
<div className={`space-y-6 ${classicFontClass(theme.serif)}`}>
<div className="border p-4" style={{ borderColor: theme.border }}>
<p className="font-semibold">Bill To</p>
<div className="mt-2 space-y-1 text-sm">
<p className="font-semibold">{visibility.clientName ? invoice?.clientName || "-" : "-"}</p>
{visibility.clientPhone && invoice?.clientPhone && <p>{invoice.clientPhone}</p>}
{invoice?.clientEmail && <p>{invoice.clientEmail}</p>}
{visibility.clientGstin && invoice?.clientGST && <p>GSTIN: {invoice.clientGST}</p>}
{visibility.clientAddress && invoice?.clientAddress && <p>{invoice.clientAddress}</p>}
</div>
</div>
<div className="border p-4" style={{ borderColor: theme.border }}>
{details?.length > 0 ? (
<>
<p className="font-semibold">Additional Details</p>
<div className="mt-2 space-y-1 text-sm">
{details.map((detail, index:number)=>(<p key={index}><b>{detail.label}:</b> {detail.value}</p>))}
</div>
</>
) : (
<><p className="font-semibold">Reference</p><p className="mt-2 text-sm text-gray-500">No additional details supplied.</p></>
)}
</div>
</div>
)}

return(
<div className={`grid grid-cols-2 gap-8 ${classicFontClass(theme.serif)}`}>
{theme.info === "detailsFirst" ? (
<>
<div className="border p-4" style={{ borderColor: theme.border }}>
{details?.length > 0 ? (
<>
<p className="font-semibold">Additional Details</p>
<div className="mt-2 space-y-1 text-sm">
{details.map((detail, index:number)=>(<p key={index}><b>{detail.label}:</b> {detail.value}</p>))}
</div>
</>
) : (
<><p className="font-semibold">Reference</p><p className="mt-2 text-sm text-gray-500">No additional details supplied.</p></>
)}
</div>
<div className="border p-4" style={{ borderColor: theme.border }}>
<p className="font-semibold">Bill To</p>
<div className="mt-2 space-y-1 text-sm">
<p className="font-semibold">{visibility.clientName ? invoice?.clientName || "-" : "-"}</p>
{visibility.clientPhone && invoice?.clientPhone && <p>{invoice.clientPhone}</p>}
{invoice?.clientEmail && <p>{invoice.clientEmail}</p>}
{visibility.clientGstin && invoice?.clientGST && <p>GSTIN: {invoice.clientGST}</p>}
{visibility.clientAddress && invoice?.clientAddress && <p>{invoice.clientAddress}</p>}
</div>
</div>
</>
) : (
<>
<div className="border p-4" style={{ borderColor: theme.border }}>
<p className="font-semibold">Bill To</p>
<div className="mt-2 space-y-1 text-sm">
<p className="font-semibold">{visibility.clientName ? invoice?.clientName || "-" : "-"}</p>
{visibility.clientPhone && invoice?.clientPhone && <p>{invoice.clientPhone}</p>}
{invoice?.clientEmail && <p>{invoice.clientEmail}</p>}
{visibility.clientGstin && invoice?.clientGST && <p>GSTIN: {invoice.clientGST}</p>}
{visibility.clientAddress && invoice?.clientAddress && <p>{invoice.clientAddress}</p>}
</div>
</div>
<div className="border p-4" style={{ borderColor: theme.border }}>
{details?.length > 0 ? (
<>
<p className="font-semibold">Additional Details</p>
<div className="mt-2 space-y-1 text-sm">
{details.map((detail, index:number)=>(
<p key={index}><b>{detail.label}:</b> {detail.value}</p>
))}
</div>
</>
) : (
<>
<p className="font-semibold">Reference</p>
<p className="mt-2 text-sm text-gray-500">No additional details supplied.</p>
</>
)}
</div>
</>
)}
</div>
)}

function ClassicItems({invoice,money,gstDisplay,theme}: TemplateItemsProps){
const tableBorder = theme.table === "heavy" ? "2px" : "1px"
const tableHeadBg = theme.table === "tax" ? theme.paper : "#f3f4f6"
return(
<table className={`w-full text-sm ${classicFontClass(theme.serif)}`} style={{ borderCollapse:"collapse", border:`${tableBorder} solid ${theme.border}` }}>
<thead>
<tr style={{ backgroundColor: tableHeadBg }}>
<th className="p-2 text-left" style={{ border:`${tableBorder} solid ${theme.border}` }}>Product</th>
<th className="p-2 text-left" style={{ border:`${tableBorder} solid ${theme.border}` }}>HSN</th>
<th className="p-2 text-right" style={{ border:`${tableBorder} solid ${theme.border}` }}>Qty</th>
<th className="p-2 text-right" style={{ border:`${tableBorder} solid ${theme.border}` }}>Price</th>
<th className="p-2 text-right" style={{ border:`${tableBorder} solid ${theme.border}` }}>CGST</th>
<th className="p-2 text-right" style={{ border:`${tableBorder} solid ${theme.border}` }}>SGST</th>
<th className="p-2 text-right" style={{ border:`${tableBorder} solid ${theme.border}` }}>IGST</th>
<th className="p-2 text-right" style={{ border:`${tableBorder} solid ${theme.border}` }}>Amount</th>
</tr>
</thead>
<tbody>
{invoice?.items?.map((item, index:number)=>{
const base = Number(item.qty ?? 0) * Number(item.price ?? 0)
const cgstAmount = item.cgst ? (base * Number(item.cgst)) / 100 : 0
const sgstAmount = item.sgst ? (base * Number(item.sgst)) / 100 : 0
const igstAmount = item.igst ? (base * Number(item.igst)) / 100 : 0
return(
<tr key={index}>
<td className="p-2" style={{ border:`${tableBorder} solid ${theme.border}` }}>{item.product || "-"}</td>
<td className="p-2" style={{ border:`${tableBorder} solid ${theme.border}` }}>{item.hsn || "-"}</td>
<td className="p-2 text-right" style={{ border:`${tableBorder} solid ${theme.border}` }}>{item.qty || 0}</td>
<td className="p-2 text-right" style={{ border:`${tableBorder} solid ${theme.border}` }}>{money(item.price || 0)}</td>
<td className="p-2 text-right" style={{ border:`${tableBorder} solid ${theme.border}` }}>{gstDisplay(item.cgst,cgstAmount)}</td>
<td className="p-2 text-right" style={{ border:`${tableBorder} solid ${theme.border}` }}>{gstDisplay(item.sgst,sgstAmount)}</td>
<td className="p-2 text-right" style={{ border:`${tableBorder} solid ${theme.border}` }}>{gstDisplay(item.igst,igstAmount)}</td>
<td className="p-2 text-right font-semibold" style={{ border:`${tableBorder} solid ${theme.border}` }}>{money(item.total || 0)}</td>
</tr>
)})}
</tbody>
</table>
)}

function ClassicSummary({invoice,subtotal,totalCGST,totalSGST,totalIGST,money,theme}: TemplateSummaryProps){
return(
<div className={`w-[300px] border p-4 ${classicFontClass(theme.serif)}`} style={{ borderColor: theme.border }}>
<div className="space-y-2 text-sm">
<div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal || 0)}</span></div>
<div className="flex justify-between"><span>CGST</span><span>{totalCGST ? money(totalCGST || 0) : "-"}</span></div>
<div className="flex justify-between"><span>SGST</span><span>{totalSGST ? money(totalSGST || 0) : "-"}</span></div>
<div className="flex justify-between"><span>IGST</span><span>{totalIGST ? money(totalIGST || 0) : "-"}</span></div>
<div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold" style={{ borderColor: theme.border }}>
<span>Total</span>
<span>{money(invoice?.grandTotal || 0)}</span>
</div>
</div>
</div>
)}

function ClassicFooter({businessInfo,theme,visibility}: TemplateFooterProps){
return(
<div className={`grid grid-cols-2 gap-8 border-t pt-6 ${classicFontClass(theme.serif)}`} style={{ borderColor: theme.border }}>
<div>
{visibility.businessBankDetails && (businessInfo?.bankName || businessInfo?.accountNumber || businessInfo?.upi) && (
<>
<p className="font-semibold">Bank Details</p>
<div className="mt-2 space-y-1 text-sm text-gray-700">
{businessInfo?.bankName && <p>Bank: {businessInfo.bankName}</p>}
{businessInfo?.accountNumber && <p>Account: {businessInfo.accountNumber}</p>}
{businessInfo?.ifsc && <p>IFSC: {businessInfo.ifsc}</p>}
{businessInfo?.upi && <p>UPI: {businessInfo.upi}</p>}
</div>
</>
)}
</div>
<div>
{visibility.businessTerms && businessInfo?.terms && (
<>
<p className="font-semibold">Terms</p>
<p className="mt-2 whitespace-pre-line text-sm text-gray-700">{businessInfo.terms}</p>
</>
)}
</div>
</div>
)}

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
invoiceVisibility
}: TemplateComponentProps){

const theme = classicThemes[templateId ?? "classic-ledger"] || classicThemes["classic-ledger"]
const details = invoice?.customDetails || []
const businessInfo = business || {}
const visibility: InvoiceVisibilitySettings = invoiceVisibility || DEFAULT_INVOICE_VISIBILITY

return(
<div
className="w-full p-8 text-gray-800"
style={{
    backgroundColor: theme.paper,
    ...invoiceTemplateRootTypographyStyle(fontFamily, fontSize, renderContext),
  }}
>
<ClassicHeader invoice={invoice ?? undefined} businessInfo={businessInfo} formatDate={formatDate} dateFormat={dateFormat} theme={theme} visibility={visibility}/>
<div className="mt-6">
<ClassicBillTo invoice={invoice ?? undefined} details={details} theme={theme} visibility={visibility}/>
</div>
<div className="mt-6">
<ClassicItems invoice={invoice ?? undefined} money={money} gstDisplay={gstDisplay} theme={theme}/>
</div>
<div className="mt-6 flex justify-end">
<ClassicSummary invoice={invoice ?? undefined} subtotal={subtotal} totalCGST={totalCGST} totalSGST={totalSGST} totalIGST={totalIGST} money={money} theme={theme}/>
</div>
<div className="mt-8">
<ClassicFooter businessInfo={businessInfo} theme={theme} visibility={visibility}/>
</div>
</div>
)
}
