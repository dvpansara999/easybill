"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { IndianRupee, Search, TrendingUp, Users } from "lucide-react"
import { getActiveOrGlobalItem } from "@/lib/userStore"

export default function CustomersPage() {

  const router = useRouter()
  const [customers,setCustomers] = useState<any[]>([])
  const [search,setSearch] = useState("")
  const [currentPage,setCurrentPage] = useState(1)

  const rowsPerPage = 10

  useEffect(()=>{

    const invoices = JSON.parse(getActiveOrGlobalItem("invoices") || "[]")
    const map:any = {}

    invoices.forEach((inv:any)=>{

      const name = inv.clientName || "Unknown"
      const phone = inv.clientPhone || "no-phone"
      const revenue =
        Number(inv.total) ||
        Number(inv.grandTotal) ||
        Number(inv.amount) ||
        0

      if(!map[phone]){
        map[phone] = {
          name:name,
          phone:phone,
          invoices:0,
          revenue:0,
          latestDate: "",
          latestInvoiceNumber: ""
        }
      }

      map[phone].invoices += 1
      map[phone].revenue += revenue

      const currentLatestTime = map[phone].latestDate ? new Date(map[phone].latestDate).getTime() : 0
      const incomingTime = inv.date ? new Date(inv.date).getTime() : 0
      const currentLatestNumber = Number(String(map[phone].latestInvoiceNumber || "").replace(/\D/g,""))
      const incomingNumber = Number(String(inv.invoiceNumber || "").replace(/\D/g,""))

      if(
        incomingTime > currentLatestTime ||
        (incomingTime === currentLatestTime && incomingNumber > currentLatestNumber)
      ){
        map[phone].latestDate = inv.date || ""
        map[phone].latestInvoiceNumber = inv.invoiceNumber || ""
      }

    })

    const result = Object.values(map)
    result.sort((a:any,b:any)=>{
      const dateDiff = new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()

      if(dateDiff !== 0) return dateDiff

      const aNum = Number(String(a.latestInvoiceNumber || "").replace(/\D/g,""))
      const bNum = Number(String(b.latestInvoiceNumber || "").replace(/\D/g,""))

      return bNum - aNum
    })
    setCustomers(result)

  },[])

  const filteredCustomers = customers.filter((c)=>{

    const query = search.toLowerCase()

    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query)
    )

  })

  useEffect(()=>{
    setCurrentPage(1)
  },[search])

  const totalRevenue = filteredCustomers.reduce((sum,c)=>sum + Number(c.revenue || 0),0)
  const topRevenueCustomer = filteredCustomers.length > 0
    ? filteredCustomers.reduce((top,current)=> Number(current.revenue || 0) > Number(top.revenue || 0) ? current : top, filteredCustomers[0])
    : null
  const averageRevenue = filteredCustomers.length > 0 ? totalRevenue / filteredCustomers.length : 0
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / rowsPerPage))
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  useEffect(()=>{
    if(currentPage > totalPages){
      setCurrentPage(totalPages)
      return
    }

    if(currentPage < 1){
      setCurrentPage(1)
    }
  },[currentPage,totalPages])

  return(

    <div className="space-y-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Customers</p>
          <h1 className="font-display mt-3 text-4xl text-slate-950">Your client list, organized by revenue.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            easyBILL groups customers from your invoices so you can spot repeat buyers and revenue quickly.
          </p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone"
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="soft-card rounded-[24px] p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">Visible Customers</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{filteredCustomers.length}</p>
        </div>

        <div className="soft-card rounded-[24px] p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <IndianRupee className="h-4 w-4" />
          </div>
          <p className="text-sm text-slate-500">Visible Revenue</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">Rs {totalRevenue.toLocaleString("en-IN")}</p>
        </div>

        <div className="soft-card rounded-[24px] p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-sm text-slate-500">Top Revenue Generator</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{topRevenueCustomer?.name || "-"}</p>
          <p className="mt-2 text-sm text-slate-500">
            {topRevenueCustomer ? `Rs ${Number(topRevenueCustomer.revenue || 0).toLocaleString("en-IN")}` : "No revenue yet"}
          </p>
        </div>

        <div className="soft-card rounded-[24px] p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Users className="h-4 w-4" />
          </div>
          <p className="text-sm text-slate-500">Average Revenue</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">Rs {averageRevenue.toLocaleString("en-IN")}</p>
        </div>
      </section>

      <section className="soft-card rounded-[28px] p-6">
        <div className="overflow-hidden rounded-[24px] border border-slate-200/70">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Invoices</th>
                <th className="px-4 py-3">Revenue</th>
              </tr>
            </thead>

            <tbody>
              {paginatedCustomers.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={4}>
                    No customers found
                  </td>
                </tr>
              )}

              {paginatedCustomers.map((c,index)=>(
                <tr
                  key={index}
                  onClick={()=>router.push(`/dashboard/customers/${encodeURIComponent(c.phone)}`)}
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-4">{c.phone}</td>
                  <td className="px-4 py-4">{c.invoices}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    Rs {c.revenue.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {Array.from({length:totalPages},(_,i)=>i+1).map((page)=>(
              <button
                key={page}
                onClick={()=>setCurrentPage(page)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  page === currentPage
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>

  )

}
