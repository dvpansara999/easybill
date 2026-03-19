"use client"

import { useEffect,useState } from "react"
import { useRouter } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import {
  ArrowRight,
  BarChart3,
  FileText,
  Package2,
  ReceiptIndianRupee,
  TrendingUp,
  Users,
} from "lucide-react"

import {
AreaChart,
Area,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
ResponsiveContainer
} from "recharts"

export default function Dashboard(){

const {
  dateFormat,
  amountFormat,
  showDecimals,
  currencySymbol,
  currencyPosition
} = useSettings()

const router = useRouter()

const [recentInvoices,setRecentInvoices] = useState<any[]>([])
const [productsCount,setProductsCount] = useState(0)
const [clientsCount,setClientsCount] = useState(0)
const [thisMonthCount,setThisMonthCount] = useState(0)
const [gstMonth,setGstMonth] = useState(0)
const [gstYear,setGstYear] = useState(0)
const [revenueThisMonth,setRevenueThisMonth] = useState<number|null>(null)
const [revenueLastMonth,setRevenueLastMonth] = useState<number|null>(null)
const [revenueYear,setRevenueYear] = useState<number|null>(null)
const [growthPercent,setGrowthPercent] = useState<number|null>(null)
const [growthAmount,setGrowthAmount] = useState<number|null>(null)
const [topCustomers,setTopCustomers] = useState<any[]>([])
const [chartData,setChartData] = useState<any[]>([])

const monthLabels=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

useEffect(()=>{

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
const savedInvoices = getActiveOrGlobalItem("invoices")
const savedProducts = getActiveOrGlobalItem("products")

if(savedInvoices){

const parsed = JSON.parse(savedInvoices)

const sorted=[...parsed].sort((a:any,b:any)=>{
const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()

if(dateDiff !== 0) return dateDiff

const aNum = Number(String(a.invoiceNumber || "").replace(/\D/g,""))
const bNum = Number(String(b.invoiceNumber || "").replace(/\D/g,""))

return bNum - aNum
})

setRecentInvoices(sorted.slice(0,10))

const now=new Date()
const currentMonth=now.getMonth()
const currentYear=now.getFullYear()

const lastMonthDate=new Date()
lastMonthDate.setMonth(currentMonth-1)

const lastMonth=lastMonthDate.getMonth()
const lastMonthYear=lastMonthDate.getFullYear()

let monthRevenue=0
let lastRevenue=0
let yearRevenue=0
let monthCount=0
let gstTotal=0
let gstYearTotal=0

const clients=new Set()
const customerMap:any={}
const revenueMap:any={}

parsed.forEach((inv:any)=>{

const amount = Number(inv.grandTotal || 0)
const date=new Date(inv.date)

const key=`${date.getFullYear()}-${date.getMonth()}`

if(!revenueMap[key]) revenueMap[key]=0
revenueMap[key]+=amount

if(inv.clientName){

clients.add(inv.clientName)

if(!customerMap[inv.clientName]){
customerMap[inv.clientName]={name:inv.clientName,revenue:0,count:0}
}

customerMap[inv.clientName].revenue+=amount
customerMap[inv.clientName].count++

}

let invoiceCGST=0
let invoiceSGST=0
let invoiceIGST=0

if(inv.items){

inv.items.forEach((item:any)=>{

const base=item.qty*item.price

invoiceCGST+= item.cgst ? base*Number(item.cgst)/100 : 0
invoiceSGST+= item.sgst ? base*Number(item.sgst)/100 : 0
invoiceIGST+= item.igst ? base*Number(item.igst)/100 : 0

})

}

if(date.getMonth()===currentMonth && date.getFullYear()===currentYear){

monthRevenue+=amount
monthCount++

gstTotal+=invoiceCGST+invoiceSGST+invoiceIGST

}

if(date.getFullYear()===currentYear){

gstYearTotal+=invoiceCGST+invoiceSGST+invoiceIGST
yearRevenue+=amount

}

if(date.getMonth()===lastMonth && date.getFullYear()===lastMonthYear){

lastRevenue+=amount

}

})

setThisMonthCount(monthCount)
setClientsCount(clients.size)

setGstMonth(gstTotal)
setGstYear(gstYearTotal)

setRevenueThisMonth(monthRevenue||null)
setRevenueLastMonth(lastRevenue||null)
setRevenueYear(yearRevenue||null)

if(lastRevenue>0){

const diff = monthRevenue - lastRevenue
const growth=((diff)/lastRevenue)*100

setGrowthPercent(Number(growth.toFixed(1)))
setGrowthAmount(diff)

}else{

setGrowthPercent(null)
setGrowthAmount(null)

}

const leaderboard=Object.values(customerMap)
.sort((a:any,b:any)=>b.revenue-a.revenue)
.slice(0,5)

setTopCustomers(leaderboard)

let lastInvoiceDate=new Date()

if(sorted.length>0){
lastInvoiceDate=new Date(sorted[0].date)
}

const months:any[]=[]

for(let i=11;i>=0;i--){

const d=new Date(lastInvoiceDate)
d.setMonth(d.getMonth()-i)

months.push({
year:d.getFullYear(),
month:d.getMonth()
})

}

const graph=months.map((m)=>{

const key=`${m.year}-${m.month}`

return{
month:monthLabels[m.month],
revenue:revenueMap[key]||0
}

})

setChartData(graph)

}

if(savedProducts){

const parsedProducts=JSON.parse(savedProducts)
setProductsCount(parsedProducts.length)

}

},[])

function money(value:number){
return formatCurrency(
value,
currencySymbol,
currencyPosition,
showDecimals,
amountFormat
)
}

const bestMonth = chartData.length > 0
? chartData.reduce((best,current)=> current.revenue > best.revenue ? current : best, chartData[0])
: { month: "-", revenue: 0 }

const averageRevenue = chartData.length > 0
? chartData.reduce((sum,entry)=>sum + Number(entry.revenue || 0),0) / chartData.length
: 0

const lowestMonth = chartData.length > 0
? chartData.reduce((lowest,current)=> current.revenue < lowest.revenue ? current : lowest, chartData[0])
: { month: "-", revenue: 0 }

const rollingRevenue = chartData.reduce((sum,entry)=>sum + Number(entry.revenue || 0),0)

return(

<div className="space-y-8">

<section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
<div className="rounded-[30px] bg-slate-950 p-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
<p className="text-xs uppercase tracking-[0.34em] text-emerald-300/80">
Business Overview
</p>
<h1 className="font-display mt-4 max-w-3xl text-4xl leading-tight lg:text-5xl">
Your business pulse, recent work, and growth snapshot in one modern dashboard.
</h1>
<p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
Track invoices, revenue, GST, and customer momentum without changing any of the underlying invoice workflow you already rely on.
</p>
</div>

<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
<div className="soft-card rounded-[28px] p-6">
<p className="text-xs uppercase tracking-[0.3em] text-slate-400">This Year Revenue</p>
<p className="mt-3 text-3xl font-semibold text-slate-950">
{revenueYear ? money(revenueYear) : "-"}
</p>
<p className="mt-2 text-sm text-slate-500">
Current annual revenue generated from stored invoices.
</p>
</div>

<div className="soft-card rounded-[28px] border-emerald-100 bg-emerald-50/70 p-6">
<p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Growth This Month</p>
<p className="mt-3 text-3xl font-semibold text-slate-950">
{growthPercent!==null ? `${growthPercent > 0 ? "+" : ""}${growthPercent}%` : "-"}
</p>
<p className="mt-2 text-sm text-slate-600">
{growthAmount!==null ? `${growthAmount > 0 ? "+" : ""}${money(growthAmount)}` : "Revenue comparison appears after at least one prior month."}
</p>
</div>
</div>
</section>

<section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
<div className="soft-card rounded-[24px] p-6">
<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
<FileText className="h-5 w-5" />
</div>
<p className="text-sm text-slate-500">This Month Invoices</p>
<p className="mt-2 text-3xl font-semibold text-slate-950">{thisMonthCount}</p>
</div>

<div
onClick={()=>router.push("/dashboard/products")}
className="soft-card cursor-pointer rounded-[24px] p-6 transition hover:-translate-y-0.5 hover:shadow-xl"
>
<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
<Package2 className="h-5 w-5" />
</div>
<p className="text-sm text-slate-500">My Products</p>
<p className="mt-2 text-3xl font-semibold text-slate-950">{productsCount}</p>
</div>

<div className="soft-card rounded-[24px] p-6">
<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
<ReceiptIndianRupee className="h-5 w-5" />
</div>
<p className="text-sm text-slate-500">GST This Month</p>
<p className="mt-2 text-3xl font-semibold text-slate-950">{money(gstMonth)}</p>
</div>

<div className="soft-card rounded-[24px] p-6">
<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
<Users className="h-5 w-5" />
</div>
<p className="text-sm text-slate-500">Total Clients</p>
<p className="mt-2 text-3xl font-semibold text-slate-950">{clientsCount}</p>
</div>
</section>

<section className="soft-card rounded-[28px] p-6">
<div className="mb-5 flex items-center justify-between gap-4">
<div>
<h2 className="section-title text-2xl">Recent Invoices</h2>
<p className="mt-1 text-sm text-slate-500">Open the latest entries and continue faster.</p>
</div>
<button
onClick={()=>router.push("/dashboard/invoices")}
className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
>
View all
<ArrowRight className="h-4 w-4" />
</button>
</div>

<div className="overflow-hidden rounded-[22px] border border-slate-200/70">
<table className="w-full text-sm">
<thead className="bg-slate-50/80">
<tr className="border-b border-slate-200 text-left text-slate-500">
<th className="px-4 py-3">Invoice</th>
<th className="px-4 py-3">Client</th>
<th className="px-4 py-3">Date</th>
<th className="px-4 py-3">Amount</th>
</tr>
</thead>
<tbody>
{recentInvoices.map((inv:any,index)=>(
<tr
key={`${inv.invoiceNumber}-${index}`}
className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/70"
onClick={()=>router.push(`/dashboard/invoices/view/${inv.invoiceNumber}`)}
>
<td className="px-4 py-4 font-medium text-slate-900">{inv.invoiceNumber}</td>
<td className="px-4 py-4">{inv.clientName}</td>
<td className="px-4 py-4">{formatDate(inv.date,dateFormat)}</td>
<td className="px-4 py-4 font-semibold text-slate-900">{money(inv.grandTotal)}</td>
</tr>
))}
</tbody>
</table>
</div>
</section>

<section className="grid gap-6 xl:grid-cols-4">
<div className="soft-card rounded-[28px] p-6 xl:col-span-3">
<div className="mb-5 flex items-center gap-3">
<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
<BarChart3 className="h-5 w-5" />
</div>
<div>
<h2 className="section-title text-2xl">Monthly Revenue</h2>
<p className="text-sm text-slate-500">A rolling 12-month view of invoice totals.</p>
</div>
</div>

<ResponsiveContainer width="100%" height={260}>
<AreaChart data={chartData}>
<defs>
<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
<stop offset="5%" stopColor="#0f766e" stopOpacity={0.32}/>
<stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
</linearGradient>
</defs>
<CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee"/>
<XAxis dataKey="month" stroke="#94a3b8"/>
<YAxis
stroke="#94a3b8"
tickFormatter={(value)=>{
if(value>=100000){
return `${(value/100000).toFixed(1)}L`
}
return value
}}
/>
<Tooltip formatter={(value) => money(Number(value ?? 0))} />
<Area
type="monotone"
dataKey="revenue"
stroke="#0f766e"
strokeWidth={3}
fill="url(#colorRevenue)"
dot={{r:4}}
/>
</AreaChart>
</ResponsiveContainer>

<div className="mt-6 grid gap-4 md:grid-cols-3">
<div className="rounded-3xl bg-slate-50 p-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Best Month</p>
<p className="mt-2 text-lg font-semibold text-slate-950">{bestMonth.month}</p>
<p className="mt-1 text-sm text-slate-500">{money(bestMonth.revenue || 0)}</p>
</div>

<div className="rounded-3xl bg-slate-50 p-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">12-Month Average</p>
<p className="mt-2 text-lg font-semibold text-slate-950">{money(averageRevenue)}</p>
<p className="mt-1 text-sm text-slate-500">Average billed revenue per month.</p>
</div>

<div className="rounded-3xl bg-slate-950 p-4 text-white">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current Momentum</p>
<p className="mt-2 text-lg font-semibold">{thisMonthCount} invoices</p>
<p className="mt-1 text-sm text-slate-300">
{revenueThisMonth ? money(revenueThisMonth) : "-"} billed this month.
</p>
</div>
</div>

<div className="mt-4 grid gap-4 md:grid-cols-2">
<div className="rounded-3xl border border-slate-200 bg-white p-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Lowest Month</p>
<div className="mt-2 flex items-end justify-between gap-4">
<p className="text-lg font-semibold text-slate-950">{lowestMonth.month}</p>
<p className="text-sm font-medium text-slate-500">{money(lowestMonth.revenue || 0)}</p>
</div>
</div>

<div className="rounded-3xl border border-slate-200 bg-white p-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Rolling 12-Month Total</p>
<div className="mt-2 flex items-end justify-between gap-4">
<p className="text-lg font-semibold text-slate-950">{money(rollingRevenue)}</p>
<p className="text-sm font-medium text-slate-500">{chartData.length} months tracked</p>
</div>
</div>
</div>
</div>

<div className="soft-card rounded-[28px] p-6">
<div className="mb-6 flex items-center gap-3">
<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
<TrendingUp className="h-5 w-5" />
</div>
<div>
<h2 className="section-title text-2xl">Quick Stats</h2>
<p className="text-sm text-slate-500">Short-term signals worth watching.</p>
</div>
</div>

<div className="grid gap-4">
<div className="rounded-3xl bg-slate-50 p-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Last Month</p>
<p className="mt-2 text-xl font-semibold text-slate-950">
{revenueLastMonth ? money(revenueLastMonth) : "-"}
</p>
</div>

<div className="rounded-3xl bg-slate-50 p-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">This Month</p>
<p className="mt-2 text-xl font-semibold text-slate-950">
{revenueThisMonth ? money(revenueThisMonth) : "-"}
</p>
</div>

{growthPercent!==null &&(
<div className="rounded-3xl bg-emerald-50 p-4">
<p className="text-xs uppercase tracking-[0.28em] text-emerald-700">Growth This Month</p>
<p className="mt-2 text-xl font-semibold text-slate-950">
{growthAmount && growthAmount>0 ? "+" : ""}
{money(growthAmount || 0)}
</p>
<p className={`text-sm ${growthPercent>=0 ? "text-emerald-700" : "text-rose-600"}`}>
{growthPercent>=0 ? "Up" : "Down"} {growthPercent>0?"+":""}{growthPercent}%
</p>
</div>
)}

<div className="rounded-3xl bg-slate-50 p-4">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">GST This Year</p>
<p className="mt-2 text-xl font-semibold text-slate-950">{money(gstYear)}</p>
</div>

<div className="rounded-3xl bg-slate-950 p-4 text-white">
<p className="text-xs uppercase tracking-[0.28em] text-slate-400">This Year Revenue</p>
<p className="mt-2 text-2xl font-semibold">
{revenueYear ? money(revenueYear) : "-"}
</p>
</div>
</div>
</div>
</section>

<section className="soft-card rounded-[28px] p-6">
<h2 className="section-title mb-4 text-2xl">Top Customers</h2>
<div className="overflow-hidden rounded-[22px] border border-slate-200/70">
<table className="w-full text-sm">
<thead className="bg-slate-50/80">
<tr className="border-b border-slate-200 text-left text-slate-500">
<th className="px-4 py-3">Customer</th>
<th className="px-4 py-3">Invoices</th>
<th className="px-4 py-3">Revenue</th>
</tr>
</thead>
<tbody>
{topCustomers.map((cust:any,index)=>(
<tr key={`${cust.name}-${index}`} className="border-b border-slate-100">
<td className="px-4 py-4 font-medium text-slate-900">{cust.name}</td>
<td className="px-4 py-4">{cust.count}</td>
<td className="px-4 py-4 font-semibold text-slate-900">{money(cust.revenue)}</td>
</tr>
))}
</tbody>
</table>
</div>
</section>

</div>

)

}
