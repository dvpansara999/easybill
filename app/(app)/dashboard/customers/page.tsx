"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, IndianRupee, Search, TrendingUp, Users } from "lucide-react"
import { readStoredInvoices, type InvoiceRecord } from "@/lib/invoice"

type CustomerRow = {
  name: string
  phone: string
  invoices: number
  revenue: number
  latestDate: string
  latestInvoiceNumber: string
}

function readCustomerRows(): CustomerRow[] {
  if (typeof window === "undefined") return []

  const invoices = readStoredInvoices() as Array<InvoiceRecord & { total?: number; amount?: number }>
  const map: Record<string, CustomerRow> = {}

  invoices.forEach((invoice) => {
    const name = invoice.clientName || "Unknown"
    const phone = invoice.clientPhone || "no-phone"
    const revenue = Number(invoice.total) || Number(invoice.grandTotal) || Number(invoice.amount) || 0

    if (!map[phone]) {
      map[phone] = {
        name,
        phone,
        invoices: 0,
        revenue: 0,
        latestDate: "",
        latestInvoiceNumber: "",
      }
    }

    map[phone].invoices += 1
    map[phone].revenue += revenue

    const currentLatestTime = map[phone].latestDate ? new Date(map[phone].latestDate).getTime() : 0
    const incomingTime = invoice.date ? new Date(invoice.date).getTime() : 0
    const currentLatestNumber = Number(String(map[phone].latestInvoiceNumber || "").replace(/\D/g, ""))
    const incomingNumber = Number(String(invoice.invoiceNumber || "").replace(/\D/g, ""))

    if (incomingTime > currentLatestTime || (incomingTime === currentLatestTime && incomingNumber > currentLatestNumber)) {
      map[phone].latestDate = invoice.date || ""
      map[phone].latestInvoiceNumber = invoice.invoiceNumber || ""
    }
  })

  return Object.values(map).sort((a, b) => {
    const dateDiff = new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    if (dateDiff !== 0) return dateDiff

    const aNum = Number(String(a.latestInvoiceNumber || "").replace(/\D/g, ""))
    const bNum = Number(String(b.latestInvoiceNumber || "").replace(/\D/g, ""))
    return bNum - aNum
  })
}

export default function CustomersPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [customers] = useState<CustomerRow[]>(() => readCustomerRows())

  const rowsPerPage = 10
  const normalizedSearch = search.trim().toLowerCase()

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        if (!normalizedSearch) return true
        return customer.name.toLowerCase().includes(normalizedSearch) || customer.phone.includes(normalizedSearch)
      }),
    [customers, normalizedSearch]
  )

  const totalRevenue = filteredCustomers.reduce((sum, customer) => sum + Number(customer.revenue || 0), 0)
  const topRevenueCustomer =
    filteredCustomers.length > 0
      ? filteredCustomers.reduce((top, current) =>
          Number(current.revenue || 0) > Number(top.revenue || 0) ? current : top
        )
      : null
  const averageRevenue = filteredCustomers.length > 0 ? totalRevenue / filteredCustomers.length : 0
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedCustomers = filteredCustomers.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  return (
    <div className="space-y-6 xl:space-y-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Customers</p>
          <h1 className="font-display mt-2 text-2xl leading-tight text-slate-950 sm:text-3xl xl:mt-3 xl:text-4xl">
            Your client list, organized by revenue.
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500 sm:mt-3 sm:text-sm sm:leading-7">
            easyBILL groups customers from your invoices so you can spot repeat buyers and revenue quickly.
          </p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        <div className="soft-card rounded-[22px] p-3.5 sm:rounded-[24px] sm:p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-xs text-slate-500 sm:text-sm">Visible Customers</p>
          <p className="mt-1.5 text-xl font-semibold text-slate-950 sm:mt-2 sm:text-3xl">{filteredCustomers.length}</p>
        </div>

        <div className="soft-card rounded-[22px] p-3.5 sm:rounded-[24px] sm:p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <IndianRupee className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500 sm:text-sm">Visible Revenue</p>
          <p className="mt-1.5 text-base font-semibold text-slate-950 sm:mt-2 sm:text-3xl">
            ₹ {totalRevenue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="soft-card rounded-[22px] p-3.5 sm:rounded-[24px] sm:p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500 sm:text-sm">Top Revenue Generator</p>
          <p className="mt-1.5 truncate text-base font-semibold text-slate-950 sm:mt-2 sm:text-2xl">
            {topRevenueCustomer?.name || "-"}
          </p>
          <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
            {topRevenueCustomer ? `₹ ${Number(topRevenueCustomer.revenue || 0).toLocaleString("en-IN")}` : "No revenue yet"}
          </p>
        </div>

        <div className="soft-card rounded-[22px] p-3.5 sm:rounded-[24px] sm:p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Users className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500 sm:text-sm">Average Revenue</p>
          <p className="mt-1.5 text-base font-semibold text-slate-950 sm:mt-2 sm:text-3xl">
            ₹ {averageRevenue.toLocaleString("en-IN")}
          </p>
        </div>
      </section>

      <section className="soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]">
        <div className="space-y-3 lg:hidden">
          {paginatedCustomers.length === 0 ? (
            <div className="rounded-[24px] border border-slate-200/70 bg-white p-6 text-center text-sm text-slate-500">
              No customers found
            </div>
          ) : (
            paginatedCustomers.map((customer, index) => (
              <button
                key={customer.phone || index}
                type="button"
                onClick={() => router.push(`/dashboard/customers/${encodeURIComponent(customer.phone)}`)}
                className="w-full rounded-[22px] border border-slate-200/70 bg-white p-3.5 text-left transition hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 sm:rounded-[24px] sm:p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{customer.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-600 sm:text-sm">{customer.phone}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 text-slate-400" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3">
                  <div className="rounded-[16px] bg-slate-50 p-2.5 sm:rounded-[18px] sm:p-3">
                    <p className="text-xs text-slate-500">Invoices</p>
                    <p className="mt-1 text-base font-semibold text-slate-950 sm:text-lg">{customer.invoices}</p>
                  </div>
                  <div className="rounded-[16px] bg-slate-50 p-2.5 sm:rounded-[18px] sm:p-3">
                    <p className="text-xs text-slate-500">Revenue</p>
                    <p className="mt-1 text-base font-semibold text-slate-950 sm:text-lg">
                      ₹ {Number(customer.revenue || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="hidden lg:block">
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
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={4}>
                      No customers found
                    </td>
                  </tr>
                ) : null}

                {paginatedCustomers.map((customer, index) => (
                  <tr
                    key={`${customer.phone}-${index}`}
                    onClick={() => router.push(`/dashboard/customers/${encodeURIComponent(customer.phone)}`)}
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">{customer.name}</td>
                    <td className="px-4 py-4">{customer.phone}</td>
                    <td className="px-4 py-4">{customer.invoices}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">₹ {customer.revenue.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  pageNumber === safePage
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {pageNumber}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
