"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import { CalendarRange, FilePlus2, PencilLine, Search, Trash2 } from "lucide-react"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import { canEditInvoices } from "@/lib/plans"
import SelectMenu from "@/components/ui/SelectMenu"
import { useAppAlert } from "@/components/providers/AppAlertProvider"

type InvoiceRecord = {
  invoiceNumber: string
  clientName: string
  date: string
  grandTotal: number
}

function parseInvoiceNumber(invoiceNumber: string) {
  const match = invoiceNumber.match(/^(.*?)(\d+)$/)

  if (!match) {
    return {
      prefix: invoiceNumber,
      numericValue: null,
      numericText: "",
    }
  }

  return {
    prefix: match[1],
    numericValue: Number(match[2]),
    numericText: match[2],
  }
}

function buildRangeSummary(invoices: InvoiceRecord[]) {
  if (invoices.length === 0) return []

  const chronological = [...invoices].reverse()
  const groups: Array<{
    prefix: string
    firstLabel: string
    lastLabel: string
    firstValue: number | null
    lastValue: number | null
    width: number
  }> = []

  chronological.forEach((invoice) => {
    const parsed = parseInvoiceNumber(invoice.invoiceNumber || "")
    const lastGroup = groups[groups.length - 1]

    if (!lastGroup || lastGroup.prefix !== parsed.prefix) {
      groups.push({
        prefix: parsed.prefix,
        firstLabel: invoice.invoiceNumber || "",
        lastLabel: invoice.invoiceNumber || "",
        firstValue: parsed.numericValue,
        lastValue: parsed.numericValue,
        width: parsed.numericText.length,
      })
      return
    }

    lastGroup.lastLabel = invoice.invoiceNumber || ""
    lastGroup.lastValue = parsed.numericValue
    lastGroup.width = Math.max(lastGroup.width, parsed.numericText.length)
  })

  return groups.map((group) => {
    if (group.firstValue === null || group.lastValue === null) {
      return group.firstLabel === group.lastLabel ? group.firstLabel : `${group.firstLabel} to ${group.lastLabel}`
    }

    const start = String(group.firstValue).padStart(group.width, "0")
    const end = String(group.lastValue).padStart(group.width, "0")
    return start === end ? `${group.prefix}${start}` : `${group.prefix}${start} to ${group.prefix}${end}`
  })
}

function sortInvoicesNewestFirst(invoices: InvoiceRecord[]) {
  return [...invoices].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (dateDiff !== 0) return dateDiff

    const aNum = Number(String(a.invoiceNumber || "").replace(/\D/g, ""))
    const bNum = Number(String(b.invoiceNumber || "").replace(/\D/g, ""))
    return bNum - aNum
  })
}

function readInvoices(): InvoiceRecord[] {
  if (typeof window === "undefined") return []

  const saved = getActiveOrGlobalItem("invoices")
  if (!saved) return []

  try {
    const parsed = JSON.parse(saved) as unknown
    return Array.isArray(parsed) ? sortInvoicesNewestFirst(parsed as InvoiceRecord[]) : []
  } catch {
    return []
  }
}

export default function InvoicesClient() {
  const { dateFormat, amountFormat, showDecimals, currencySymbol, currencyPosition } = useSettings()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showAlert } = useAppAlert()

  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => readInvoices())
  const [selectedYear, setSelectedYear] = useState(() => {
    const queryYear = searchParams.get("year")
    if (queryYear) return Number(queryYear)

    const years = invoices.map((invoice) => Number(invoice.date.split("-")[0]))
    return years.length > 0 ? Math.max(...years) : new Date().getFullYear()
  })
  const [selectedMonth, setSelectedMonth] = useState<number | "all">(() => {
    const queryMonth = searchParams.get("month")
    return queryMonth ? (queryMonth === "all" ? "all" : Number(queryMonth)) : "all"
  })
  const [currentPage, setCurrentPage] = useState(() => Number(searchParams.get("page") || 1))
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "")

  const rowsPerPage = 15
  const latestInvoiceNumber = invoices[0]?.invoiceNumber || null

  const years = Array.from(new Set(invoices.map((invoice) => Number(invoice.date.split("-")[0]))))
  const months = [
    { label: "January", value: 0 },
    { label: "February", value: 1 },
    { label: "March", value: 2 },
    { label: "April", value: 3 },
    { label: "May", value: 4 },
    { label: "June", value: 5 },
    { label: "July", value: 6 },
    { label: "August", value: 7 },
    { label: "September", value: 8 },
    { label: "October", value: 9 },
    { label: "November", value: 10 },
    { label: "December", value: 11 },
  ]

  const filtered = useMemo(
    () =>
      invoices.filter((invoice) => {
        const [yearRaw, monthRaw] = invoice.date.split("-")
        const year = Number(yearRaw)
        const month = Number(monthRaw) - 1
        return selectedMonth === "all" ? year === selectedYear : year === selectedYear && month === selectedMonth
      }),
    [invoices, selectedMonth, selectedYear]
  )

  const activeSearch = searchQuery.trim().toLowerCase()
  const searched = useMemo(
    () =>
      (activeSearch ? invoices : filtered).filter((invoice) =>
        activeSearch ? String(invoice.invoiceNumber || "").toLowerCase().includes(activeSearch) : true
      ),
    [activeSearch, filtered, invoices]
  )

  const totalShown = searched.length
  const totalPages = Math.max(1, Math.ceil(searched.length / rowsPerPage))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const paginatedInvoices = searched.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)
  const rangeSummary = buildRangeSummary(paginatedInvoices)

  function deleteLast() {
    const saved = getActiveOrGlobalItem("invoices")
    if (!saved) return

    const parsed = sortInvoicesNewestFirst(JSON.parse(saved) as InvoiceRecord[])
    parsed.shift()
    setActiveOrGlobalItem("invoices", JSON.stringify(parsed))
    setInvoices(parsed)
  }

  function money(value: number) {
    return formatCurrency(value, currencySymbol, currencyPosition, showDecimals, amountFormat)
  }

  const returnTo = `/dashboard/invoices?year=${selectedYear}&month=${selectedMonth}&page=${safePage}&search=${encodeURIComponent(searchQuery)}`

  return (
    <div className="space-y-6 xl:space-y-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Invoices</p>
          <h1 className="font-display mt-2 text-2xl leading-tight text-slate-950 sm:text-3xl xl:mt-3 xl:text-4xl">
            Invoices, organized and easy to manage.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Filter by year/month, search by invoice number, and keep records tidy in your easyBILL workspace.
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/invoices/create")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
        >
          <FilePlus2 className="h-4 w-4" />
          Create Invoice
        </button>
      </section>

      <section className="soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]">
        <div className="grid gap-4 lg:grid-cols-[0.65fr_0.35fr] lg:items-end">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
            <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Year</span>
              <div className="mt-1">
                <SelectMenu
                  value={String(selectedYear)}
                  onChange={(value) => {
                    setSelectedYear(Number(value))
                    setCurrentPage(1)
                  }}
                  options={years.map((year) => ({ value: String(year), label: String(year) }))}
                />
              </div>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Month</span>
              <div className="mt-1">
                <SelectMenu
                  value={String(selectedMonth)}
                  onChange={(value) => {
                    setSelectedMonth(value === "all" ? "all" : Number(value))
                    setCurrentPage(1)
                  }}
                  className="[&>button]:py-2.5 [&>button]:text-[13px] [&>button>span]:truncate [&>button>span]:whitespace-nowrap [&_[role='option']>span]:whitespace-nowrap"
                  options={[{ value: "all", label: "All Months" }, ...months.map((month) => ({ value: String(month.value), label: month.label }))]}
                />
              </div>
            </label>

            <label className="col-span-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:col-span-1">
              <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Invoice No</span>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search invoice number"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>
          </div>

          <div className="rounded-3xl bg-slate-950 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <CalendarRange className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/55">Range Summary</p>
                {totalShown > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rangeSummary.map((range) => (
                      <span key={range} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                        {range}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm">No invoices in this range</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 text-sm text-slate-500 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Total invoices shown: <span className="font-semibold text-slate-900">{totalShown}</span>
          </p>
          <p>
            Page <span className="font-semibold text-slate-900">{safePage}</span> of{" "}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </p>
        </div>

        <div className="mt-6 space-y-3 lg:hidden">
          {paginatedInvoices.length === 0 ? (
            <div className="rounded-[24px] border border-slate-200/70 bg-white p-6 text-center text-sm text-slate-500">No invoices in this range</div>
          ) : (
            paginatedInvoices.map((invoice) => {
              const isLatestInvoice = invoice.invoiceNumber === latestInvoiceNumber

              return (
                <div
                  key={invoice.invoiceNumber}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/dashboard/invoices/view/${invoice.invoiceNumber}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/dashboard/invoices/view/${invoice.invoiceNumber}`)
                    }
                  }}
                  className="cursor-pointer rounded-[24px] border border-slate-200/70 bg-white p-4 transition hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                      <p className="mt-1 truncate text-sm text-slate-600">{invoice.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="truncate text-sm font-semibold text-slate-950">{money(invoice.grandTotal || 0)}</p>
                      <p className="mt-1 text-xs text-slate-500">{String(invoice.date || "").slice(2)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!canEditInvoices()) {
                          showAlert({
                            tone: "warning",
                            title: "Editing is locked on the Free plan",
                            actionHint: "Upgrade to Plus to unlock editing, or stay on the list.",
                            message: "Upgrade to Plus to edit invoices.",
                            primaryLabel: "Upgrade to Plus",
                            secondaryLabel: "Not now",
                            onPrimary: () => router.push("/dashboard/upgrade"),
                          })
                          return
                        }
                        router.push(`/dashboard/invoices/edit/${invoice.invoiceNumber}?returnTo=${encodeURIComponent(returnTo)}`)
                      }}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                        canEditInvoices()
                          ? "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                          : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                      disabled={!canEditInvoices()}
                      aria-label="Edit invoice"
                      title="Edit invoice"
                    >
                      <PencilLine className="h-3.5 w-3.5" />
                    </button>

                    {isLatestInvoice ? (
                      <button
                        type="button"
                        onClick={deleteLast}
                        className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100"
                        aria-label="Delete latest invoice"
                        title="Delete latest invoice"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-[24px] border border-slate-200/70 lg:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3">Invoice No</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((invoice) => {
                const isLatestInvoice = invoice.invoiceNumber === latestInvoiceNumber

                return (
                  <tr
                    key={invoice.invoiceNumber}
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/70"
                    onClick={() => router.push(`/dashboard/invoices/view/${invoice.invoiceNumber}`)}
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-4">{invoice.clientName}</td>
                    <td className="px-4 py-4">{formatDate(invoice.date, dateFormat)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{money(invoice.grandTotal || 0)}</td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            if (!canEditInvoices()) {
                              showAlert({
                                tone: "warning",
                                title: "Editing is locked on the Free plan",
                                actionHint: "Upgrade to Plus to unlock editing, or stay on the list.",
                                message: "Upgrade to Plus to edit invoices.",
                                primaryLabel: "Upgrade to Plus",
                                secondaryLabel: "Not now",
                                onPrimary: () => router.push("/dashboard/upgrade"),
                              })
                              return
                            }
                            router.push(`/dashboard/invoices/edit/${invoice.invoiceNumber}?returnTo=${encodeURIComponent(returnTo)}`)
                          }}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                            canEditInvoices()
                              ? "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                              : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                          }`}
                          disabled={!canEditInvoices()}
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        {isLatestInvoice ? (
                          <button
                            onClick={deleteLast}
                            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100"
                            aria-label="Delete latest invoice"
                            title="Delete latest invoice"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  pageNumber === safePage ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
