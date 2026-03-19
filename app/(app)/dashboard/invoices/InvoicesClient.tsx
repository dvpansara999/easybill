"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import { CalendarRange, FilePlus2, PencilLine, Search, Trash2 } from "lucide-react"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import { canEditInvoices } from "@/lib/plans"
import SelectMenu from "@/components/ui/SelectMenu"
import { useAppAlert } from "@/components/providers/AppAlertProvider"

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

function buildRangeSummary(invoices: any[]) {
  if (invoices.length === 0) {
    return []
  }

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

    if (start === end) {
      return `${group.prefix}${start}`
    }

    return `${group.prefix}${start} to ${group.prefix}${end}`
  })
}

export default function InvoicesClient() {
  const { dateFormat, amountFormat, showDecimals, currencySymbol, currencyPosition } = useSettings()

  const router = useRouter()
  const searchParams = useSearchParams()
  const { showAlert } = useAppAlert()

  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  const rowsPerPage = 15
  const latestInvoiceNumber = invoices[0]?.invoiceNumber || null

  useEffect(() => {
    const queryYear = searchParams.get("year")
    const queryMonth = searchParams.get("month")
    const queryPage = searchParams.get("page")
    const querySearch = searchParams.get("search")

    if (queryYear) {
      setSelectedYear(Number(queryYear))
    }

    if (queryMonth) {
      setSelectedMonth(queryMonth === "all" ? "all" : Number(queryMonth))
    }

    if (queryPage) {
      setCurrentPage(Number(queryPage))
    }

    if (querySearch) {
      setSearchQuery(querySearch)
    }

    const saved = getActiveOrGlobalItem("invoices")

    if (saved) {
      const parsed = JSON.parse(saved)

      const sorted = [...parsed].sort((a: any, b: any) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()

        if (dateDiff !== 0) return dateDiff

        const aNum = Number(a.invoiceNumber.replace(/\D/g, ""))
        const bNum = Number(b.invoiceNumber.replace(/\D/g, ""))

        return bNum - aNum
      })

      setInvoices(sorted)

      if (!queryYear && parsed.length > 0) {
        const years = parsed.map((inv: any) => Number(inv.date.split("-")[0]))
        const latestYear = Math.max(...years)
        setSelectedYear(latestYear)
      } else if (!queryYear) {
        setSelectedYear(new Date().getFullYear())
      }
    }
  }, [searchParams])

  const years = Array.from(new Set(invoices.map((inv: any) => Number(inv.date.split("-")[0]))))

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

  const filtered = invoices.filter((inv: any) => {
    const parts = inv.date.split("-")
    const year = Number(parts[0])
    const month = Number(parts[1]) - 1

    if (selectedMonth === "all") {
      return year === selectedYear
    }

    return year === selectedYear && month === selectedMonth
  })

  const activeSearch = searchQuery.trim().toLowerCase()

  const searched = (activeSearch ? invoices : filtered).filter((inv: any) => {
    if (!activeSearch) return true
    return String(inv.invoiceNumber || "").toLowerCase().includes(activeSearch)
  })

  const totalShown = searched.length

  let newestInvoice = ""
  let oldestInvoice = ""

  if (searched.length > 0) {
    newestInvoice = searched[0].invoiceNumber
    oldestInvoice = searched[searched.length - 1].invoiceNumber
  }

  const totalPages = Math.ceil(searched.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedInvoices = searched.slice(startIndex, endIndex)
  const rangeSummary = buildRangeSummary(paginatedInvoices)

  useEffect(() => {
    const safeTotalPages = Math.max(totalPages, 1)

    if (currentPage > safeTotalPages) {
      setCurrentPage(safeTotalPages)
      return
    }

    if (currentPage < 1) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  function deleteLast() {
    const saved = getActiveOrGlobalItem("invoices")
    if (!saved) return

    const parsed = JSON.parse(saved)
    if (parsed.length === 0) return

    parsed.sort((a: any, b: any) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateDiff !== 0) return dateDiff

      const aNum = Number(a.invoiceNumber.replace(/\D/g, ""))
      const bNum = Number(b.invoiceNumber.replace(/\D/g, ""))
      return bNum - aNum
    })

    parsed.shift()

    setActiveOrGlobalItem("invoices", JSON.stringify(parsed))
    setInvoices(parsed)
  }

  function money(value: number) {
    return formatCurrency(value, currencySymbol, currencyPosition, showDecimals, amountFormat)
  }

  const returnTo = `/dashboard/invoices?year=${selectedYear}&month=${selectedMonth}&page=${currentPage}&search=${encodeURIComponent(searchQuery)}`

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Invoices</p>
          <h1 className="font-display mt-3 text-4xl text-slate-950">Invoices, organized and easy to manage.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Filter by year/month, search by invoice number, and keep records tidy in your easyBILL workspace.
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/invoices/create")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <FilePlus2 className="h-4 w-4" />
          Create Invoice
        </button>
      </section>

      <section className="soft-card rounded-[28px] p-6">
        <div className="grid gap-4 lg:grid-cols-[0.65fr_0.35fr] lg:items-end">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Year</span>
              <div className="mt-1">
                <SelectMenu
                  value={String(selectedYear)}
                  onChange={(v) => {
                    setSelectedYear(Number(v))
                    setCurrentPage(1)
                  }}
                  options={years.map((y) => ({ value: String(y), label: String(y) }))}
                />
              </div>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Month</span>
              <div className="mt-1">
                <SelectMenu
                  value={String(selectedMonth)}
                  onChange={(v) => {
                    setSelectedMonth(v === "all" ? "all" : Number(v))
                    setCurrentPage(1)
                  }}
                  options={[
                    { value: "all", label: "All Months" },
                    ...months.map((m) => ({ value: String(m.value), label: m.label })),
                  ]}
                />
              </div>
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
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
                      <span
                        key={range}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white"
                      >
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

        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
          <p>
            Total invoices shown: <span className="font-semibold text-slate-900">{totalShown}</span>
          </p>
          <p>
            Page <span className="font-semibold text-slate-900">{currentPage}</span> of{" "}
            <span className="font-semibold text-slate-900">{Math.max(totalPages, 1)}</span>
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200/70">
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
              {paginatedInvoices.map((inv: any) => {
                const isLatestInvoice = inv.invoiceNumber === latestInvoiceNumber

                return (
                  <tr
                    key={inv.invoiceNumber}
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/70"
                    onClick={() => router.push(`/dashboard/invoices/view/${inv.invoiceNumber}`)}
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-4 py-4">{inv.clientName}</td>
                    <td className="px-4 py-4">{formatDate(inv.date, dateFormat)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{money(inv.grandTotal || 0)}</td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            if (!canEditInvoices()) {
                              showAlert({
                                tone: "warning",
                                title: "Editing is locked on the Free plan",
                                message: "Upgrade to Plus to edit invoices.",
                                primaryLabel: "Upgrade to Plus",
                                secondaryLabel: "Not now",
                                onPrimary: () => router.push("/dashboard/upgrade"),
                              })
                              return
                            }
                            router.push(`/dashboard/invoices/edit/${inv.invoiceNumber}?returnTo=${encodeURIComponent(returnTo)}`)
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

                        {isLatestInvoice && (
                          <button
                            onClick={deleteLast}
                            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100"
                            aria-label="Delete latest invoice"
                            title="Delete latest invoice"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
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

