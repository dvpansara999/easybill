"use client"

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronRight, IndianRupee, Search, TrendingUp, Users } from "lucide-react"
import { buildCustomerRows, type CustomerRow } from "@/lib/invoiceCollections"
import { readStoredInvoices } from "@/lib/invoice"
import { formatCurrency } from "@/lib/formatCurrency"
import { useWorkspaceValue } from "@/lib/useWorkspaceValue"

export default function CustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [currentPage, setCurrentPage] = useState(() => {
    const value = Number(searchParams.get("page") || "1")
    return Number.isFinite(value) && value > 0 ? value : 1
  })
  const invoices = useWorkspaceValue(["invoices"], readStoredInvoices)

  const rowsPerPage = 10
  const deferredSearch = useDeferredValue(search)
  const normalizedSearch = deferredSearch.trim().toLowerCase()
  const customers = useMemo<CustomerRow[]>(() => buildCustomerRows(invoices), [invoices])

  useEffect(() => {
    router.prefetch("/dashboard/invoices/create")
    customers.slice(0, 8).forEach((customer) => {
      router.prefetch(`/dashboard/customers/${encodeURIComponent(customer.identity)}`)
    })
  }, [customers, router])

  function money(value: number) {
    return formatCurrency(value, "\u20B9", "before", true, "indian")
  }

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        if (!normalizedSearch) return true
        return (
          customer.name.toLowerCase().includes(normalizedSearch) ||
          customer.phone.toLowerCase().includes(normalizedSearch) ||
          customer.gstin.toLowerCase().includes(normalizedSearch)
        )
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
  const returnTo = `/dashboard/customers?search=${encodeURIComponent(search)}&page=${safePage}`

  return (
    <div className="space-y-6 xl:space-y-8">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
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
              const nextValue = e.target.value
              startTransition(() => {
                setSearch(nextValue)
                setCurrentPage(1)
              })
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
          <p className="mt-1.5 text-base font-semibold text-slate-950 sm:mt-2 sm:text-3xl">{money(totalRevenue)}</p>
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
            {topRevenueCustomer ? money(Number(topRevenueCustomer.revenue || 0)) : "No revenue yet"}
          </p>
        </div>

        <div className="soft-card rounded-[22px] p-3.5 sm:rounded-[24px] sm:p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Users className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500 sm:text-sm">Average Revenue</p>
          <p className="mt-1.5 text-base font-semibold text-slate-950 sm:mt-2 sm:text-3xl">{money(averageRevenue)}</p>
        </div>
      </section>

      <section className="soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]">
        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            Visible customers: <span className="font-semibold text-slate-900">{filteredCustomers.length}</span>
          </p>
        </div>

        <div className="space-y-3 lg:hidden">
          {paginatedCustomers.length === 0 ? (
            <div className="rounded-[24px] border border-slate-200/70 bg-white p-6 text-center text-sm text-slate-500">
              <p>No matching customers yet.</p>
              <p className="mt-2">Create an invoice and easyBILL will build this customer list automatically.</p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/invoices/create")}
                className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Create invoice
              </button>
            </div>
          ) : (
            paginatedCustomers.map((customer, index) => (
              <button
                key={customer.identity || index}
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/customers/${encodeURIComponent(customer.identity)}?returnTo=${encodeURIComponent(returnTo)}`
                  )
                }
                className="w-full rounded-[22px] border border-slate-200/70 bg-white p-3.5 text-left transition hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 sm:rounded-[24px] sm:p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{customer.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-600 sm:text-sm">
                      {customer.phone || (customer.gstin ? `GSTIN: ${customer.gstin}` : "Add phone or GSTIN")}
                    </p>
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
                    <p className="mt-1 text-base font-semibold text-slate-950 sm:text-lg">{money(Number(customer.revenue || 0))}</p>
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
                      <div className="mx-auto max-w-md">
                        <p className="font-medium text-slate-700">No matching customers yet.</p>
                        <p className="mt-2 text-sm">Create an invoice and easyBILL will build this customer list automatically.</p>
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/invoices/create")}
                          className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Create invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {paginatedCustomers.map((customer, index) => (
                  <tr
                    key={`${customer.identity}-${index}`}
                    onClick={() =>
                      router.push(
                        `/dashboard/customers/${encodeURIComponent(customer.identity)}?returnTo=${encodeURIComponent(returnTo)}`
                      )
                    }
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">{customer.name}</td>
                    <td className="px-4 py-4">{customer.phone || (customer.gstin ? `GSTIN: ${customer.gstin}` : "Not added yet")}</td>
                    <td className="px-4 py-4">{customer.invoices}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{money(customer.revenue)}</td>
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
