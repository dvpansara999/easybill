"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatCurrency } from "@/lib/formatCurrency"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import { useAppAlert } from "@/components/providers/AppAlertProvider"
import {
createEmptyInvoiceItem,
getStoredBusinessRecord,
normalizeInvoiceRecord,
validateBusinessRecord,
validateInvoiceRecord,
} from "@/lib/invoice"
import { ArrowLeft, CirclePlus, Package2, Plus, Save, Trash2, UserRound } from "lucide-react"
import { canEditInvoices } from "@/lib/plans"

export default function EditInvoice(){

const {
amountFormat,
showDecimals,
currencySymbol,
currencyPosition
} = useSettings()

const router = useRouter()
const params = useParams()
const searchParams = useSearchParams()
const id = params?.id
const returnTo = searchParams.get("returnTo") || "/dashboard/invoices"
const { showAlert } = useAppAlert()

useEffect(()=>{
  if(!canEditInvoices()){
    showAlert({
      tone: "warning",
      title: "Editing is locked on the Free plan",
      message: "Upgrade to Plus to edit invoices.",
      primaryLabel: "Upgrade to Plus",
      secondaryLabel: "Back",
      onPrimary: () => router.push("/dashboard/upgrade"),
      onSecondary: () => router.push(returnTo),
    })
  }
},[router, returnTo, showAlert])

const [products,setProducts] = useState<any[]>([])
const [items,setItems] = useState<any[]>([])
const [invoiceNumber,setInvoiceNumber] = useState("")

const [clientName,setClientName] = useState("")
const [clientPhone,setClientPhone] = useState("")
const [clientEmail,setClientEmail] = useState("")
const [clientGST,setClientGST] = useState("")
const [clientAddress,setClientAddress] = useState("")
const [date,setDate] = useState("")

const [customDetails,setCustomDetails] = useState<any[]>([])

const [suggestions,setSuggestions] = useState<any[]>([])
const [activeRow,setActiveRow] = useState<number | null>(null)

const dropdownRef = useRef<HTMLDivElement>(null)

function money(value:number){

return formatCurrency(
value,
currencySymbol,
currencyPosition,
showDecimals,
amountFormat
)

}

useEffect(()=>{

const savedProducts = getActiveOrGlobalItem("products")
if(savedProducts) setProducts(JSON.parse(savedProducts))

const savedInvoices = getActiveOrGlobalItem("invoices")
if(!savedInvoices) return

const invoices = JSON.parse(savedInvoices)
const found = invoices.find((inv:any)=>inv.invoiceNumber === id)

if(found){
setInvoiceNumber(found.invoiceNumber)
setClientName(found.clientName)
setClientPhone(found.clientPhone)
setClientEmail(found.clientEmail)
setClientGST(found.clientGST)
setClientAddress(found.clientAddress)
setDate(found.date)
setCustomDetails(found.customDetails || [])
setItems(found.items || [])
}

},[id])

useEffect(()=>{

function handleClickOutside(e:any){
if(dropdownRef.current && !dropdownRef.current.contains(e.target)){
setSuggestions([])
}
}

document.addEventListener("mousedown",handleClickOutside)
return ()=>document.removeEventListener("mousedown",handleClickOutside)

},[])

function updateTotals(updated:any[],index:number){

const qty = Number(updated[index].qty)
const price = Number(updated[index].price)
const base = qty * price
const cgst = base * (updated[index].cgst / 100)
const sgst = base * (updated[index].sgst / 100)
const igst = base * (updated[index].igst / 100)

updated[index].total = base + cgst + sgst + igst

return updated

}

function handleItemChange(index:number,field:string,value:any){

const updated=[...items]
updated[index][field]=value

updateTotals(updated,index)
setItems(updated)

}

function searchProduct(index:number,value:string){

setActiveRow(index)

const matches = products.filter((p:any)=>
p.name.toLowerCase().includes(value.toLowerCase())
)

setSuggestions(matches)
handleItemChange(index,"product",value)

}

function searchHSN(index:number,value:string){

setActiveRow(index)

const matches = products.filter((p:any)=>
String(p.hsn).includes(value)
)

setSuggestions(matches)
handleItemChange(index,"hsn",value)

}

function selectSuggestion(product:any){

if(activeRow===null) return

const updated=[...items]

updated[activeRow].product = product.name
updated[activeRow].hsn = product.hsn
updated[activeRow].unit = product.unit
updated[activeRow].price = product.price
updated[activeRow].cgst = product.cgst
updated[activeRow].sgst = product.sgst
updated[activeRow].igst = product.igst

updateTotals(updated,activeRow)

setItems(updated)
setSuggestions([])

}

function addProduct(){
setItems([
...items,
createEmptyInvoiceItem()
])
}

function removeProduct(index:number){

const updated=[...items]
updated.splice(index,1)
setItems(updated)

}

function addCustomDetail(){
setCustomDetails([...customDetails,{label:"",value:""}])
}

function removeCustomDetail(index:number){

const updated=[...customDetails]
updated.splice(index,1)
setCustomDetails(updated)

}

const subtotal = items.reduce((sum,i)=>sum+(i.qty*i.price),0)
const cgstTotal = items.reduce((sum,i)=>sum+(i.qty*i.price*(i.cgst/100)),0)
const sgstTotal = items.reduce((sum,i)=>sum+(i.qty*i.price*(i.sgst/100)),0)
const igstTotal = items.reduce((sum,i)=>sum+(i.qty*i.price*(i.igst/100)),0)
const grandTotal = subtotal + cgstTotal + sgstTotal + igstTotal

function goBackToInvoices(){
router.push(returnTo)
}

function updateInvoice(){

const businessError = validateBusinessRecord(getStoredBusinessRecord())

if(businessError){
showAlert({
  tone: "danger",
  title: "Business profile needs attention",
  message: businessError,
  primaryLabel: "OK",
})
return
}

const saved = getActiveOrGlobalItem("invoices")
if(!saved) return

const invoices = JSON.parse(saved)
const index = invoices.findIndex((inv:any)=>inv.invoiceNumber === invoiceNumber)

if(index === -1) return

const invoiceRecord = normalizeInvoiceRecord({
invoiceNumber,
clientName,
clientPhone,
clientEmail,
clientGST,
clientAddress,
date,
customDetails,
items,
grandTotal
})

const invoiceError = validateInvoiceRecord(invoiceRecord)

if(invoiceError){
showAlert({
  tone: "danger",
  title: "Missing or invalid invoice details",
  message: invoiceError,
  primaryLabel: "OK",
})
return
}

invoices[index] = invoiceRecord

setActiveOrGlobalItem("invoices",JSON.stringify(invoices))

showAlert({
  tone: "success",
  title: "Invoice updated",
  message: "Your changes have been saved.",
  primaryLabel: "Back to invoices",
  onPrimary: () => router.push(returnTo),
})

}

return(

<div className="space-y-8">
<section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
<div>
<button onClick={goBackToInvoices} className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">
<ArrowLeft className="h-4 w-4" />
Back
</button>
<p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Edit Invoice</p>
</div>
</section>

<section className="grid gap-4 xl:grid-cols-4">
<div className="soft-card rounded-[24px] px-5 py-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Invoice Number</p>
<p className="mt-2 text-2xl font-semibold text-slate-950">{invoiceNumber}</p>
</div>

<div className="soft-card rounded-[24px] px-5 py-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Subtotal</p>
<p className="mt-2 text-2xl font-semibold text-slate-950">{money(subtotal)}</p>
</div>

<div className="soft-card rounded-[24px] px-5 py-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Taxes</p>
<p className="mt-2 text-2xl font-semibold text-slate-950">{money(cgstTotal + sgstTotal + igstTotal)}</p>
</div>

<div className="rounded-[24px] bg-slate-950 px-5 py-4 text-white">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Grand Total</p>
<p className="mt-2 text-2xl font-semibold">{money(grandTotal)}</p>
</div>
</section>

<section className="soft-card rounded-[28px] p-6">
<div className="mb-6 flex items-center gap-3">
<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
<UserRound className="h-5 w-5" />
</div>
<div>
<h2 className="section-title text-2xl">Client Details</h2>
<p className="text-sm text-slate-500">Edit the billing information tied to this invoice.</p>
</div>
</div>

<div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.15fr_0.8fr_1.25fr_1fr_220px]">
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Name *</label>
<input placeholder="Client Name" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={clientName} onChange={e=>setClientName(e.target.value)} />
</div>
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Phone</label>
<input placeholder="Client Phone" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} />
</div>
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Email</label>
<input placeholder="Client Email" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={clientEmail} onChange={e=>setClientEmail(e.target.value)} />
</div>
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client GSTIN</label>
<input placeholder="Client GSTIN" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={clientGST} onChange={e=>setClientGST(e.target.value)} />
</div>
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Invoice Date *</label>
<input type="date" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none" value={date} readOnly />
</div>
</div>

<div className="mt-4 grid gap-4 xl:grid-cols-2">
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Address</label>
<div className="rounded-[24px] border border-slate-200 bg-white p-4">
<textarea placeholder="Client Address" className="min-h-[148px] w-full resize-none bg-transparent px-0 py-0 text-sm outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-0" value={clientAddress} onChange={e=>setClientAddress(e.target.value)} />
</div>
</div>

<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Custom Details</label>
<div className="rounded-[24px] border border-slate-200 bg-white p-4">
<div className="mb-3 flex items-center justify-between">
<p className="text-sm text-slate-500">Keep optional notes aligned with the original invoice.</p>
<button onClick={addCustomDetail} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">
<CirclePlus className="h-4 w-4" />
Add Detail
</button>
</div>

<div className="space-y-3">
{customDetails.map((d,i)=>(
<div key={i} className="grid gap-3 md:grid-cols-[0.35fr_1fr_auto]">
<input placeholder="Label" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={d.label} onChange={e=>{
const updated=[...customDetails]
updated[i].label=e.target.value
setCustomDetails(updated)
}} />

<input placeholder="Value" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={d.value} onChange={e=>{
const updated=[...customDetails]
updated[i].value=e.target.value
setCustomDetails(updated)
}} />

<button onClick={()=>removeCustomDetail(i)} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-600 transition hover:bg-rose-100">
<Trash2 className="h-4 w-4" />
</button>
</div>
))}
</div>
</div>
</div>
</div>
</section>

<section className="soft-card rounded-[28px] p-6">
<div className="mb-6 flex items-center gap-3">
<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
<Package2 className="h-5 w-5" />
</div>
<div>
<h2 className="section-title text-2xl">Invoice Items</h2>
<p className="text-sm text-slate-500">Update products, taxes, and totals with the same layout as create.</p>
</div>
</div>

<div className="space-y-4">
{items.map((item,index)=>(
<div key={index} className="rounded-[26px] border border-slate-200 bg-white p-4">
<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[1.7fr_0.95fr_0.62fr_0.7fr_0.9fr_0.68fr_0.68fr_0.68fr_1fr_auto]">
<div className="relative">
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Product *</label>
<input value={item.product} onChange={(e)=>searchProduct(index,e.target.value)} placeholder="Product" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />

{activeRow===index && suggestions.length>0 &&(
<div ref={dropdownRef} className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
{suggestions.map((s:any,i:number)=>(
<div key={i} onClick={()=>selectSuggestion(s)} className="cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
{s.name} ({s.hsn})
</div>
))}
</div>
)}
</div>

<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">HSN</label>
<input value={item.hsn} onChange={(e)=>searchHSN(index,e.target.value)} placeholder="HSN" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
</div>
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Qty *</label>
<input type="text" inputMode="numeric" value={item.qty} onChange={e=>handleItemChange(index,"qty",e.target.value === "" ? "" : Number(e.target.value))} placeholder="Qty" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
</div>
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Unit</label>
<input value={item.unit} onChange={e=>handleItemChange(index,"unit",e.target.value)} placeholder="Unit" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
</div>
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Price *</label>
<input type="text" inputMode="decimal" value={item.price} onChange={e=>handleItemChange(index,"price",e.target.value === "" ? "" : Number(e.target.value))} placeholder="Price" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
</div>
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">CGST %</label>
<input type="text" inputMode="decimal" value={item.cgst} onChange={e=>handleItemChange(index,"cgst",e.target.value === "" ? "" : Number(e.target.value))} placeholder="CGST" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
</div>
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">SGST %</label>
<input type="text" inputMode="decimal" value={item.sgst} onChange={e=>handleItemChange(index,"sgst",e.target.value === "" ? "" : Number(e.target.value))} placeholder="SGST" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
</div>
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">IGST %</label>
<input type="text" inputMode="decimal" value={item.igst} onChange={e=>handleItemChange(index,"igst",e.target.value === "" ? "" : Number(e.target.value))} placeholder="IGST" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
</div>
<div>
<label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Total</label>
<div className="flex items-center rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">{money(item.total)}</div>
</div>
<div className="flex items-end">
<button onClick={()=>removeProduct(index)} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-rose-600 transition hover:bg-rose-100">
<Trash2 className="h-4 w-4" />
</button>
</div>
</div>
</div>
))}
</div>

<button onClick={addProduct} className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">
<Plus className="h-4 w-4" />
Add Product
</button>
</section>

<section className="soft-card rounded-[28px] p-6">
<h2 className="section-title text-2xl">Invoice Summary</h2>
<div className="mt-5 grid gap-4 lg:grid-cols-2">
<div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-5 text-sm text-slate-600">
<div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-slate-900">{money(subtotal)}</span></div>
<div className="flex justify-between"><span>CGST Total</span><span className="font-semibold text-slate-900">{money(cgstTotal)}</span></div>
<div className="flex justify-between"><span>SGST Total</span><span className="font-semibold text-slate-900">{money(sgstTotal)}</span></div>
<div className="flex justify-between"><span>IGST Total</span><span className="font-semibold text-slate-900">{money(igstTotal)}</span></div>
</div>

<div className="rounded-[24px] bg-slate-950 p-6 text-white">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Grand Total</p>
<p className="mt-3 text-4xl font-semibold">{money(grandTotal)}</p>
</div>
</div>

<button onClick={updateInvoice} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
<Save className="h-4 w-4" />
Update Invoice
</button>
</section>
</div>

)
}
