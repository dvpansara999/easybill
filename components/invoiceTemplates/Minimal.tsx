export const templateMeta = {
id:"minimal-light",
name:"Minimal Light",
category:"minimal",
popular:true
}

import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/context/SettingsContext"

const minimalThemes: Record<string, any> = {
"minimal-light": { accent:"#111827", soft:"#f3f4f6", line:"#e5e7eb", mode:"plain", header:"stack", summary:"clean", info:"split", logo:false },
"minimal-dark": { accent:"#111827", soft:"#f5f5f5", line:"#d4d4d8", mode:"plain", header:"split", summary:"rule", info:"stack", logo:false },
"minimal-white": { accent:"#374151", soft:"#ffffff", line:"#e5e7eb", mode:"open", header:"stack", summary:"clean", info:"detailsTop", logo:false },
"minimal-soft": { accent:"#4b5563", soft:"#f9fafb", line:"#e5e7eb", mode:"soft", header:"stack", summary:"rule", info:"split", logo:true },
"minimal-pro": { accent:"#0f172a", soft:"#f8fafc", line:"#cbd5e1", mode:"boxed", header:"split", summary:"panel", info:"sidebar", logo:false },
"minimal-mono": { accent:"#000000", soft:"#ffffff", line:"#d4d4d8", mode:"open", header:"inline", summary:"rule", info:"stack", logo:false },
"minimal-calm": { accent:"#0f766e", soft:"#f0fdfa", line:"#ccfbf1", mode:"soft", header:"split", summary:"clean", info:"sidebar", logo:false },
"minimal-linen": { accent:"#92400e", soft:"#fffbeb", line:"#fde68a", mode:"boxed", header:"stack", summary:"panel", info:"detailsTop", logo:true },
"minimal-air": { accent:"#1d4ed8", soft:"#eff6ff", line:"#dbeafe", mode:"open", header:"inline", summary:"clean", info:"split", logo:false },
"minimal-paper": { accent:"#52525b", soft:"#fafaf9", line:"#e7e5e4", mode:"paper", header:"stack", summary:"rule", info:"sidebar", logo:false },
"minimal-stone": { accent:"#57534e", soft:"#fafaf9", line:"#d6d3d1", mode:"paper", header:"split", summary:"panel", info:"stack", logo:false },
"minimal-bare": { accent:"#18181b", soft:"#ffffff", line:"#e4e4e7", mode:"plain", header:"inline", summary:"clean", info:"split", logo:false },
"minimal-muse": { accent:"#7c3aed", soft:"#faf5ff", line:"#e9d5ff", mode:"soft", header:"stack", summary:"panel", info:"detailsTop", logo:true },
"minimal-slate": { accent:"#334155", soft:"#f8fafc", line:"#cbd5e1", mode:"boxed", header:"inline", summary:"rule", info:"sidebar", logo:false },
"minimal-civic": { accent:"#2563eb", soft:"#ffffff", line:"#bfdbfe", mode:"open", header:"split", summary:"panel", info:"stack", logo:true },
"minimal-outline": { accent:"#111827", soft:"#ffffff", line:"#9ca3af", mode:"boxed", header:"inline", summary:"rule", info:"detailsTop", logo:false },
"minimal-hush": { accent:"#52525b", soft:"#fafafa", line:"#e5e7eb", mode:"soft", header:"stack", summary:"clean", info:"sidebar", logo:false },
"minimal-ink": { accent:"#0f172a", soft:"#ffffff", line:"#cbd5e1", mode:"paper", header:"split", summary:"panel", info:"split", logo:true },
"minimal-fold": { accent:"#7c3aed", soft:"#ffffff", line:"#ddd6fe", mode:"open", header:"inline", summary:"clean", info:"stack", logo:false },
"minimal-nord": { accent:"#0f766e", soft:"#f0fdfa", line:"#99f6e4", mode:"boxed", header:"split", summary:"panel", info:"sidebar", logo:true }
,
// More unique minimal layouts (structure changes, not only colors)
"minimal-gridline": { accent:"#111827", soft:"#ffffff", line:"#e5e7eb", mode:"boxed", header:"inline", summary:"rule", info:"detailsTop", logo:false },
"minimal-borderless": { accent:"#111827", soft:"#ffffff", line:"#f1f5f9", mode:"open", header:"stack", summary:"clean", info:"split", logo:false },
"minimal-compact": { accent:"#0f172a", soft:"#f8fafc", line:"#cbd5e1", mode:"boxed", header:"split", summary:"rule", info:"stack", logo:false },
"minimal-matrix": { accent:"#111827", soft:"#ffffff", line:"#d1d5db", mode:"paper", header:"inline", summary:"panel", info:"sidebar", logo:true },
"minimal-arc": { accent:"#1d4ed8", soft:"#eff6ff", line:"#bfdbfe", mode:"soft", header:"split", summary:"panel", info:"detailsTop", logo:true },
"minimal-signal": { accent:"#0f766e", soft:"#f0fdfa", line:"#ccfbf1", mode:"open", header:"inline", summary:"rule", info:"split", logo:false },
"minimal-zen": { accent:"#334155", soft:"#f8fafc", line:"#e2e8f0", mode:"plain", header:"stack", summary:"clean", info:"sidebar", logo:false },
"minimal-inkline": { accent:"#0f172a", soft:"#ffffff", line:"#94a3b8", mode:"boxed", header:"inline", summary:"rule", info:"detailsTop", logo:false },
"minimal-studio": { accent:"#7c2d12", soft:"#fff7ed", line:"#fed7aa", mode:"boxed", header:"split", summary:"panel", info:"split", logo:true },
"minimal-lattice": { accent:"#4338ca", soft:"#eef2ff", line:"#c7d2fe", mode:"paper", header:"stack", summary:"rule", info:"detailsTop", logo:true },
"minimal-copper": { accent:"#b45309", soft:"#fffbeb", line:"#fde68a", mode:"soft", header:"inline", summary:"panel", info:"sidebar", logo:true },
"minimal-wave": { accent:"#0369a1", soft:"#f0f9ff", line:"#bae6fd", mode:"open", header:"split", summary:"clean", info:"split", logo:false },
"minimal-summit": { accent:"#064e3b", soft:"#ecfdf5", line:"#a7f3d0", mode:"boxed", header:"stack", summary:"panel", info:"stack", logo:true }
}

function renderLogo(business:any, enabled:boolean){
if(!enabled || !business?.logo) return null
const frameClass = business?.logoShape === "round"
? "mb-4 h-14 w-14 rounded-full border border-gray-200 bg-white p-1 object-cover"
: "mb-4 h-14 w-14 rounded-2xl border border-gray-200 bg-white p-1 object-cover"
return <img src={business.logo} alt="" className={frameClass} />
}

function MinimalHeader({invoice,businessInfo,formatDate,dateFormat,theme,visibility}:any){
const businessName = visibility.businessName ? businessInfo?.businessName || "BUSINESS" : ""
if(theme.header === "split"){
return(
<div className="grid grid-cols-[1fr_auto] gap-8 border-b pb-6" style={{ borderColor: theme.line }}>
<div>
{renderLogo(businessInfo, theme.logo && visibility.businessLogo)}
{visibility.businessName ? <h1 className="text-3xl font-semibold" style={{ color: theme.accent }}>{businessName}</h1> : null}
<div className="mt-3 space-y-1 text-sm text-gray-600">
{visibility.businessAddress && businessInfo?.address && <p>{businessInfo.address}</p>}
{visibility.businessPhone && businessInfo?.phone && <p>{businessInfo.phone}</p>}
{businessInfo?.email && <p>{businessInfo.email}</p>}
{visibility.businessGstin && businessInfo?.gst && <p>GSTIN: {businessInfo.gst}</p>}
</div>
</div>
<div className="text-right text-sm text-gray-600">
<p>Invoice #{invoice?.invoiceNumber}</p>
<p className="mt-2 font-semibold text-gray-900">{formatDate?.(invoice?.date,dateFormat)}</p>
</div>
</div>
)}

if(theme.header === "inline"){
return(
<div className="flex items-end justify-between gap-8 border-b pb-5" style={{ borderColor: theme.line }}>
<div>
{renderLogo(businessInfo, theme.logo && visibility.businessLogo)}
<p className="text-xs uppercase tracking-[0.28em] text-gray-500">Invoice</p>
{visibility.businessName ? <h1 className="mt-2 text-3xl font-semibold" style={{ color: theme.accent }}>{businessName}</h1> : null}
</div>
<div className="text-right text-sm text-gray-600">
<p>{invoice?.invoiceNumber}</p>
<p>{formatDate?.(invoice?.date,dateFormat)}</p>
</div>
</div>
)}

return(
<div className="border-b pb-6" style={{ borderColor: theme.line }}>
{renderLogo(businessInfo, theme.logo && visibility.businessLogo)}
<p className="text-xs uppercase tracking-[0.28em] text-gray-500">Invoice</p>
{visibility.businessName ? <h1 className="mt-3 text-3xl font-semibold" style={{ color: theme.accent }}>{businessName}</h1> : null}
<div className="mt-4 grid grid-cols-[1fr_auto] gap-8">
<div className="space-y-1 text-sm text-gray-600">
{visibility.businessAddress && businessInfo?.address && <p>{businessInfo.address}</p>}
{visibility.businessPhone && businessInfo?.phone && <p>{businessInfo.phone}</p>}
{businessInfo?.email && <p>{businessInfo.email}</p>}
{visibility.businessGstin && businessInfo?.gst && <p>GSTIN: {businessInfo.gst}</p>}
</div>
<div className="text-right text-sm text-gray-600">
<p>Invoice #{invoice?.invoiceNumber}</p>
<p className="mt-2 font-semibold text-gray-900">{formatDate?.(invoice?.date,dateFormat)}</p>
</div>
</div>
</div>
)}

function renderBillTo(invoice:any, visibility: InvoiceVisibilitySettings){
return(
<div className="text-sm">
<p className="font-medium text-gray-500">Bill To</p>
<div className="mt-3 space-y-1 text-gray-700">
<p className="text-lg font-semibold text-gray-900">{visibility.clientName ? invoice?.clientName || "-" : "-"}</p>
{visibility.clientPhone && invoice?.clientPhone && <p>{invoice.clientPhone}</p>}
{invoice?.clientEmail && <p>{invoice.clientEmail}</p>}
{visibility.clientGstin && invoice?.clientGST && <p>GSTIN: {invoice.clientGST}</p>}
{visibility.clientAddress && invoice?.clientAddress && <p>{invoice.clientAddress}</p>}
</div>
</div>
)}

function renderDetails(details:any[]){
if(!details?.length){
return <p className="text-sm text-gray-400">No additional details</p>
}

return(
<div className="text-sm">
<p className="font-medium text-gray-500">Additional Details</p>
<div className="mt-3 space-y-1 text-gray-700">
{details.map((detail:any,index:number)=>(
<p key={index}>
<span className="font-medium text-gray-900">{detail.label}:</span> {detail.value}
</p>
))}
</div>
</div>
)
}

function MinimalInfo({invoice,details,theme,visibility}:any){
if(theme.info === "stack"){
return(
<div className="mt-8 space-y-6">
<div>{renderBillTo(invoice, visibility)}</div>
<div>{renderDetails(details)}</div>
</div>
)}

if(theme.info === "sidebar"){
return(
<div className="mt-8 grid grid-cols-[0.9fr_1.1fr] gap-8">
<div>{renderDetails(details)}</div>
<div>{renderBillTo(invoice, visibility)}</div>
</div>
)}

if(theme.info === "detailsTop"){
return(
<div className="mt-8 grid grid-cols-2 gap-8">
<div>{renderDetails(details)}</div>
<div>{renderBillTo(invoice, visibility)}</div>
</div>
)}

return(
<div className="mt-8 grid grid-cols-2 gap-8">
<div>{renderBillTo(invoice, visibility)}</div>
<div>{renderDetails(details)}</div>
</div>
)}

function MinimalItems({invoice,money,gstDisplay,theme}:any){
return(
<table className="w-full text-sm">
<thead>
<tr className="border-b text-gray-500" style={{ borderColor: theme.line }}>
<th className="py-3 text-left font-medium">Item</th>
<th className="py-3 text-left font-medium">HSN</th>
<th className="py-3 text-right font-medium">Qty</th>
<th className="py-3 text-right font-medium">Price</th>
<th className="py-3 text-right font-medium">CGST</th>
<th className="py-3 text-right font-medium">SGST</th>
<th className="py-3 text-right font-medium">IGST</th>
<th className="py-3 text-right font-medium">Amount</th>
</tr>
</thead>
<tbody>
{invoice?.items?.map((item:any,index:number)=>{
const base = Number(item.qty ?? 0) * Number(item.price ?? 0)
const cgstAmount = item.cgst ? (base * Number(item.cgst)) / 100 : 0
const sgstAmount = item.sgst ? (base * Number(item.sgst)) / 100 : 0
const igstAmount = item.igst ? (base * Number(item.igst)) / 100 : 0
return(
<tr key={index} className="border-b" style={{ borderColor: theme.line }}>
<td className="py-3">{item.product || "-"}</td>
<td className="py-3">{item.hsn || "-"}</td>
<td className="py-3 text-right">{item.qty ?? 0}</td>
<td className="py-3 text-right">{money(item.price ?? 0)}</td>
<td className="py-3 text-right">{gstDisplay(item.cgst,cgstAmount)}</td>
<td className="py-3 text-right">{gstDisplay(item.sgst,sgstAmount)}</td>
<td className="py-3 text-right">{gstDisplay(item.igst,igstAmount)}</td>
<td className="py-3 text-right font-semibold">{money(item.total ?? 0)}</td>
</tr>
)})}
</tbody>
</table>
)}

function MinimalSummary({invoice,subtotal,totalCGST,totalSGST,totalIGST,money,theme}:any){
return(
<div className={theme.summary === "panel" ? "rounded-xl p-5" : "p-0"} style={theme.summary === "panel" ? { backgroundColor: theme.soft } : undefined}>
<div className="space-y-2 text-sm text-gray-700">
<div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
<div className="flex justify-between"><span>CGST</span><span>{totalCGST ? money(totalCGST) : "-"}</span></div>
<div className="flex justify-between"><span>SGST</span><span>{totalSGST ? money(totalSGST) : "-"}</span></div>
<div className="flex justify-between"><span>IGST</span><span>{totalIGST ? money(totalIGST) : "-"}</span></div>
<div className="flex justify-between border-t pt-3 text-xl font-semibold text-gray-900" style={{ borderColor: theme.line }}>
<span>Total</span>
<span>{money(invoice?.grandTotal ?? 0)}</span>
</div>
</div>
</div>
)}

function MinimalFooter({businessInfo,visibility}:any){
return(
<div className="grid grid-cols-2 gap-8 pt-6">
<div className="text-sm text-gray-600">
{visibility.businessBankDetails && (businessInfo?.bankName || businessInfo?.accountNumber || businessInfo?.upi) && (
<>
<p className="font-medium text-gray-500">Bank Details</p>
<div className="mt-2 space-y-1">
{businessInfo?.bankName && <p>Bank: {businessInfo.bankName}</p>}
{businessInfo?.accountNumber && <p>Account: {businessInfo.accountNumber}</p>}
{businessInfo?.ifsc && <p>IFSC: {businessInfo.ifsc}</p>}
{businessInfo?.upi && <p>UPI: {businessInfo.upi}</p>}
</div>
</>
)}
</div>
<div className="text-sm text-gray-600">
{visibility.businessTerms && businessInfo?.terms && (
<>
<p className="font-medium text-gray-500">Terms</p>
<p className="mt-2 whitespace-pre-line">{businessInfo.terms}</p>
</>
)}
</div>
</div>
)
}

export default function MinimalTemplate({
invoice,
business,
templateId,
fontFamily,
fontSize,
subtotal,
totalCGST,
totalSGST,
totalIGST,
money,
gstDisplay,
formatDate,
dateFormat,
invoiceVisibility
}:any){
const businessInfo = business || {}
const details = invoice?.customDetails || []
const theme = minimalThemes[templateId] || minimalThemes["minimal-light"]
const visibility: InvoiceVisibilitySettings = invoiceVisibility || DEFAULT_INVOICE_VISIBILITY

const shellClass =
theme.mode === "boxed"
? "rounded-[28px] border p-8"
: theme.mode === "soft"
? "rounded-[28px] p-8"
: theme.mode === "paper"
? "rounded-[8px] border p-10"
: "p-8"

return(
<div
className="w-full bg-white text-gray-800"
style={{ fontFamily, fontSize: `${fontSize || 14}px`, zoom: (fontSize || 14) / 14 }}
>
<div className={shellClass} style={{ borderColor: theme.line, backgroundColor: theme.soft }}>
<MinimalHeader invoice={invoice} businessInfo={businessInfo} formatDate={formatDate} dateFormat={dateFormat} theme={theme} visibility={visibility}/>
<MinimalInfo invoice={invoice} details={details} theme={theme} visibility={visibility}/>
<div className="mt-8">
<MinimalItems invoice={invoice} money={money} gstDisplay={gstDisplay} theme={theme}/>
</div>
<div className="mt-8 flex justify-end">
<div className="w-[320px]">
<MinimalSummary invoice={invoice} subtotal={subtotal} totalCGST={totalCGST} totalSGST={totalSGST} totalIGST={totalIGST} money={money} theme={theme}/>
</div>
</div>
<div className="mt-8 border-t" style={{ borderColor: theme.line }}>
<MinimalFooter businessInfo={businessInfo} visibility={visibility}/>
</div>
</div>
</div>
)
}
