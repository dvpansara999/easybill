"use client"

import { useEffect, useState } from "react"
import { invoiceTemplateRootTypographyStyle } from "@/lib/invoiceTemplateRootStyle"
import { previewBusiness } from "@/lib/templatePreviewData"
import { getActiveOrGlobalItem } from "@/lib/userStore"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/context/SettingsContext"

/* ---------- TEMPLATE META ---------- */

export const templateMeta = {
id:"default",
name:"Default",
category:"default"
}

function logoFrameClass(shape:"square" | "round" = "square"){
return shape === "round" ? "h-16 w-16 rounded-full object-cover border border-gray-200 bg-white p-1" : "h-16 w-16 rounded-2xl object-cover border border-gray-200 bg-white p-1"
}

/* ---------- TEMPLATE ---------- */

export default function DefaultTemplate({
invoice,
business: businessProp,
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

const [business,setBusiness] = useState<any>(null)
const visibility: InvoiceVisibilitySettings = invoiceVisibility || DEFAULT_INVOICE_VISIBILITY

useEffect(()=>{

if(businessProp){
setBusiness(businessProp)
return
}

if(invoice?.isPreview){
setBusiness(previewBusiness)
return
}

const saved = getActiveOrGlobalItem("businessProfile")

if(saved){
setBusiness(JSON.parse(saved))
}

},[businessProp, invoice])

if(!business) return null


return(

<div
className="w-full bg-white p-6 leading-relaxed text-gray-800"
style={invoiceTemplateRootTypographyStyle(fontFamily, fontSize)}
>

{/* ================= HEADER ================= */}

<div className="flex justify-between border-b pb-6 mb-8">

{/* BUSINESS */}

<div className="flex gap-4">

{visibility.businessLogo && business.logo && (
<img
src={business.logo}
className={logoFrameClass(business.logoShape)}
/>
)}

<div>

{visibility.businessName ? (
  <h1 className="text-2xl font-semibold tracking-wide pb-[2px]">{business.businessName}</h1>
) : null}

{visibility.businessAddress ? (
  <p className="text-gray-600 whitespace-pre-line mt-1">{business.address}</p>
) : null}

<div className="mt-2 text-gray-700 space-y-1 text-sm">
{visibility.businessPhone && business.phone && <p>Phone: {business.phone}</p>}
{business.email && <p>Email: {business.email}</p>}
{visibility.businessGstin && business.gst && <p>GSTIN: {business.gst}</p>}
</div>

</div>

</div>

{/* INVOICE INFO */}

<div className="text-right flex flex-col items-end gap-1 text-sm min-w-[160px]">

<p className="whitespace-nowrap">
<span className="text-gray-500">Invoice No:</span>{" "}
<b className="whitespace-nowrap">{invoice?.invoiceNumber}</b>
</p>

<p className="whitespace-nowrap">
<span className="text-gray-500">Date:</span>{" "}
{formatDate?.(invoice?.date,dateFormat)}
</p>

</div>

</div>

{/* ================= BILLING SECTION ================= */}

<div className="grid grid-cols-2 gap-10 mb-10">

{/* BILL TO */}

<div>

<h3 className="text-gray-500 uppercase text-xs tracking-wider mb-2">
Bill To
</h3>

<p className="font-semibold text-base">
{visibility.clientName ? invoice?.clientName : "-"}
</p>

<div className="text-sm mt-1 space-y-1">

{visibility.clientPhone && invoice?.clientPhone && <p>{invoice.clientPhone}</p>}
{invoice?.clientEmail && <p>{invoice.clientEmail}</p>}
{visibility.clientGstin && invoice?.clientGST && <p>GSTIN: {invoice.clientGST}</p>}

{visibility.clientAddress && invoice?.clientAddress && (
<p className="text-sm mt-1">
Address: {invoice.clientAddress}
</p>
)}

</div>

</div>

{/* CUSTOM DETAILS */}

<div>

{invoice?.customDetails && invoice.customDetails.length > 0 && (
<>
<h3 className="text-gray-500 uppercase text-xs tracking-wider mb-2">
Additional Details
</h3>

<div className="text-sm space-y-1">

{invoice.customDetails.map((detail:any,index:number)=>(
<p key={index}>
<b>{detail.label}:</b> {detail.value}
</p>
))}

</div>
</>
)}

</div>

</div>


{/* ================= ITEMS TABLE ================= */}

<div className="border border-gray-300 rounded-sm overflow-hidden">

<div className="px-4 py-3 border-b bg-gray-50">
<p className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase">
Invoice Items
</p>
</div>

<table className="w-full border-collapse">

<thead>

<tr className="border-b bg-gray-50 text-gray-600 text-sm">

<th className="text-left py-3 px-2">Item</th>
<th className="text-left py-3 px-2">HSN</th>
<th className="text-left py-3 px-2">Qty</th>
<th className="text-left py-3 px-2">Price</th>
<th className="text-left py-3 px-2">CGST</th>
<th className="text-left py-3 px-2">SGST</th>
<th className="text-left py-3 px-2">IGST</th>
<th className="text-right py-3 px-2">Amount</th>

</tr>

</thead>

<tbody>

{invoice?.items?.map((item:any,index:number)=>{

const base = item.qty * item.price

const cgstAmount = item.cgst ? (base * Number(item.cgst))/100 : 0
const sgstAmount = item.sgst ? (base * Number(item.sgst))/100 : 0
const igstAmount = item.igst ? (base * Number(item.igst))/100 : 0

const total = base + cgstAmount + sgstAmount + igstAmount

return(

<tr key={index} className="border-b">

<td className="py-3 px-2">{item.product || "-"}</td>
<td className="py-3 px-2">{item.hsn || "-"}</td>
<td className="py-3 px-2">{item.qty}</td>
<td className="py-3 px-2">{money(item.price)}</td>

<td className="py-3 px-2">
{gstDisplay(item.cgst,cgstAmount)}
</td>

<td className="py-3 px-2">
{gstDisplay(item.sgst,sgstAmount)}
</td>

<td className="py-3 px-2">
{gstDisplay(item.igst,igstAmount)}
</td>

<td className="py-3 px-2 text-right font-medium">
{money(total)}
</td>

</tr>

)

})}

</tbody>

</table>

</div>


{/* ================= TOTAL SECTION ================= */}

<div className="flex justify-end mt-10">

<div className="w-80 border border-gray-300 rounded-sm overflow-hidden">

<div className="px-4 py-3 border-b bg-gray-50">
<p className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase">
Invoice Summary
</p>
</div>

<div className="p-4 text-sm">

<div className="flex justify-between py-1">
<span>Subtotal</span>
<span>{money(subtotal)}</span>
</div>

<div className="flex justify-between py-1">
<span>CGST</span>
<span>{totalCGST ? money(totalCGST) : "-"}</span>
</div>

<div className="flex justify-between py-1">
<span>SGST</span>
<span>{totalSGST ? money(totalSGST) : "-"}</span>
</div>

<div className="flex justify-between py-1">
<span>IGST</span>
<span>{totalIGST ? money(totalIGST) : "-"}</span>
</div>

<div className="border-t mt-2 pt-2 flex justify-between text-lg font-semibold">

<span>Total</span>
<span>{money(invoice?.grandTotal)}</span>

</div>

</div>

</div>

</div>


{/* ================= FOOTER ================= */}

<div className="grid grid-cols-2 gap-10 mt-14 pt-6 border-t">

{/* BANK */}

<div>

{visibility.businessBankDetails && (business.bankName || business.accountNumber || business.upi) && (

<>

<h3 className="text-gray-500 uppercase text-xs tracking-wider mb-2">
Bank Details
</h3>

<div className="text-sm space-y-1">

{business.bankName && <p>Bank: {business.bankName}</p>}
{business.accountNumber && <p>Account: {business.accountNumber}</p>}
{business.ifsc && <p>IFSC: {business.ifsc}</p>}
{business.upi && <p>UPI: {business.upi}</p>}

</div>

</>

)}

</div>

{/* TERMS */}

<div>

{visibility.businessTerms && business.terms && (

<>

<h3 className="text-gray-500 uppercase text-xs tracking-wider mb-2">
Terms
</h3>

<p className="text-sm text-gray-600 whitespace-pre-line">
{business.terms}
</p>

</>

)}

</div>

</div>

</div>

)

}
