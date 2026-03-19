"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import { ArrowLeft, FilePlus2, Mail, MapPin, Phone, ReceiptIndianRupee } from "lucide-react"
import { getActiveOrGlobalItem } from "@/lib/userStore"
import SelectMenu from "@/components/ui/SelectMenu"

function sortInvoicesNewestFirst(invoices: any[]) {
  return [...invoices].sort((a: any, b: any) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()

    if (dateDiff !== 0) {
      return dateDiff
    }

    const aNum = Number(String(a.invoiceNumber || "").replace(/\D/g, ""))
    const bNum = Number(String(b.invoiceNumber || "").replace(/\D/g, ""))

    return bNum - aNum
  })
}

export default function CustomerDetails(){

const {
  dateFormat,
  amountFormat,
  showDecimals,
  currencySymbol,
  currencyPosition
} = useSettings()

const params = useParams()
const router = useRouter()

const phone = decodeURIComponent(params.phone as string)

const [invoices,setInvoices] = useState<any[]>([])
const [filteredInvoices,setFilteredInvoices] = useState<any[]>([])

const [month,setMonth] = useState("all")
const [year,setYear] = useState("all")

const [customer,setCustomer] = useState<any>(null)

useEffect(()=>{

const saved = getActiveOrGlobalItem("invoices")

if(!saved) return

const allInvoices = JSON.parse(saved)

const customerInvoices = sortInvoicesNewestFirst(allInvoices.filter((inv:any)=>
inv.clientPhone === phone
))

setInvoices(customerInvoices)
setFilteredInvoices(customerInvoices)

if(customerInvoices.length){

const latest = customerInvoices[0]

setCustomer({
name: latest.clientName,
phone: latest.clientPhone,
email: latest.clientEmail,
gstin: latest.clientGST,
address: latest.clientAddress
})

}

},[phone])



useEffect(()=>{

let result = [...invoices]

if(month !== "all"){

result = result.filter((inv:any)=>{

const d = new Date(inv.date)
return d.getMonth()+1 === Number(month)

})

}

if(year !== "all"){

result = result.filter((inv:any)=>{

const d = new Date(inv.date)
return d.getFullYear() === Number(year)

})

}

result = sortInvoicesNewestFirst(result)

setFilteredInvoices(result)

},[month,year,invoices])


const months = [
"Jan","Feb","Mar","Apr","May","Jun",
"Jul","Aug","Sep","Oct","Nov","Dec"
]

const years = Array.from(
new Set(
invoices.map((inv:any)=> new Date(inv.date).getFullYear())
)
)

const yearOptions = [{ value: "all", label: "All Years" }, ...years.map((y:any)=>({ value: String(y), label: String(y) }))]
const monthOptions = [{ value: "all", label: "All Months" }, ...months.map((m:string, idx:number)=>({ value: String(idx + 1), label: m }))]



/* -------- GST CALCULATION -------- */

function getGST(inv:any){

let totalGST = 0

inv.items?.forEach((item:any)=>{

const base = item.qty * item.price

const cgstAmount = item.cgst ? (base * Number(item.cgst))/100 : 0
const sgstAmount = item.sgst ? (base * Number(item.sgst))/100 : 0
const igstAmount = item.igst ? (base * Number(item.igst))/100 : 0

totalGST += cgstAmount + sgstAmount + igstAmount

})

return totalGST

}



/* currency helper */

function money(value:number){

return formatCurrency(
value,
currencySymbol,
currencyPosition,
showDecimals,
amountFormat
)

}

const totalRevenue = invoices.reduce((sum,inv)=>sum + Number(inv.grandTotal || 0),0)



function createInvoice(){

if(!customer){

router.push("/dashboard/invoices/create")
return

}

router.push(
`/dashboard/invoices/create?name=${encodeURIComponent(customer.name || "")}
&phone=${encodeURIComponent(customer.phone || "")}
&email=${encodeURIComponent(customer.email || "")}
&gstin=${encodeURIComponent(customer.gstin || "")}
&address=${encodeURIComponent(customer.address || "")}`
)

}



return(

<div className="space-y-8">
<section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
<div className="rounded-[30px] bg-slate-950 p-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
<button
onClick={()=>router.push("/dashboard/customers")}
className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
>
<ArrowLeft className="h-4 w-4" />
Back to Customers
</button>

<p className="mt-6 text-xs uppercase tracking-[0.34em] text-emerald-300/80">Customer Profile</p>
<h1 className="font-display mt-4 text-4xl leading-tight text-white">
{customer?.name || "Customer"}
</h1>

<div className="mt-8 grid gap-3 md:grid-cols-2">
<div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Phone</p>
<div className="mt-2 flex items-center gap-3 text-slate-100">
<Phone className="h-4 w-4 text-emerald-300" />
<span>{customer?.phone || phone}</span>
</div>
</div>

<div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Email</p>
<div className="mt-2 flex items-center gap-3 text-slate-100">
<Mail className="h-4 w-4 text-emerald-300" />
<span>{customer?.email || "Not added yet"}</span>
</div>
</div>

<div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">GSTIN</p>
<div className="mt-2 flex items-center gap-3 text-slate-100">
<ReceiptIndianRupee className="h-4 w-4 text-emerald-300" />
<span>{customer?.gstin || "Not added yet"}</span>
</div>
</div>

<div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Address</p>
<div className="mt-2 flex items-start gap-3 text-slate-100">
<MapPin className="mt-0.5 h-4 w-4 text-emerald-300" />
<span>{customer?.address || "Not added yet"}</span>
</div>
</div>
</div>
 </div>

<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
<div className="soft-card rounded-[28px] p-6">
<p className="text-xs uppercase tracking-[0.3em] text-slate-400">Invoices On Record</p>
<p className="mt-3 text-3xl font-semibold text-slate-950">{invoices.length}</p>
<p className="mt-2 text-sm text-slate-500">Complete invoice history stored for this customer.</p>
</div>

<div className="soft-card rounded-[28px] p-6">
<p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Revenue</p>
<p className="mt-3 text-3xl font-semibold text-slate-950">{money(totalRevenue)}</p>
<p className="mt-2 text-sm text-slate-500">Total billed value generated from this customer.</p>
</div>

<button
onClick={createInvoice}
className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
>
<FilePlus2 className="h-4 w-4" />
Create Invoice
</button>
</div>
</section>

<section className="soft-card rounded-[28px] p-6">
<div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr] lg:items-end">
<div>
<p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Invoice History</p>
<p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
Use the month and year filters to narrow down this customer’s invoice timeline.
</p>
</div>

<div className="grid gap-3 sm:grid-cols-2">
<label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
<span className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Month</span>
<div className="mt-1">
  <SelectMenu value={month} onChange={setMonth} options={monthOptions} />
</div>
</label>

<label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
<span className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Year</span>
<div className="mt-1">
  <SelectMenu value={year} onChange={setYear} options={yearOptions} />
</div>
</label>
</div>
</div>

<div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200/70">
<table className="w-full text-sm">
<thead className="bg-slate-50/80">
<tr className="border-b border-slate-200 text-left text-slate-500">
<th className="px-4 py-3">Invoice</th>
<th className="px-4 py-3">Date</th>
<th className="px-4 py-3">GST</th>
<th className="px-4 py-3">Amount</th>
</tr>
</thead>
<tbody>
{filteredInvoices.length === 0 && (
<tr>
<td colSpan={4} className="px-4 py-10 text-center text-slate-500">
No invoices found for this customer.
</td>
</tr>
)}

{filteredInvoices.map((inv,index)=>(
<tr
key={`${inv.invoiceNumber}-${index}`}
onClick={()=>router.push(`/dashboard/invoices/view/${inv.invoiceNumber}`)}
className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/70"
>
<td className="px-4 py-4 font-medium text-slate-900">{inv.invoiceNumber}</td>
<td className="px-4 py-4 text-slate-600">{formatDate(inv.date, dateFormat)}</td>
<td className="px-4 py-4 text-slate-600">{money(getGST(inv))}</td>
<td className="px-4 py-4 font-semibold text-slate-900">{money(inv.grandTotal || 0)}</td>
</tr>
))}
</tbody>
</table>
</div>
</section>
</div>

)
}
