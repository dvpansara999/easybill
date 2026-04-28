"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatDate, getStoredDateParts, parseStoredDate, storedDatePartsToDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import { compareInvoicesNewestFirst, sortInvoicesNewestFirst } from "@/lib/invoiceCollections"
import { buildCustomerIdentity } from "@/lib/customerIdentity"
import { getActiveOrGlobalItem } from "@/lib/userStore"
import { readStoredInvoices, type InvoiceRecord } from "@/lib/invoice"
import { useWorkspaceValue } from "@/lib/useWorkspaceValue"
import {
  ArrowRight,
  FileText,
  Package2,
  Users,
} from "lucide-react"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import AutoFitText from "@/components/ui/AutoFitText"

type ProductRecord = {
  name: string
}

type RevenuePoint = {
  month: string
  revenue: number
}

type TopCustomer = {
  identity: string
  name: string
  revenue: number
  count: number
}

type DashboardSnapshot = {
  recentInvoices: InvoiceRecord[]
  productsCount: number
  clientsCount: number
  thisMonthCount: number
  gstMonth: number
  gstYear: number
  revenueThisMonth: number | null
  revenueLastMonth: number | null
  revenueYear: number | null
  growthPercent: number | null
  growthAmount: number | null
  topCustomers: TopCustomer[]
  chartData: RevenuePoint[]
}

const EMPTY_SNAPSHOT: DashboardSnapshot = {
  recentInvoices: [],
  productsCount: 0,
  clientsCount: 0,
  thisMonthCount: 0,
  gstMonth: 0,
  gstYear: 0,
  revenueThisMonth: null,
  revenueLastMonth: null,
  revenueYear: null,
  growthPercent: null,
  growthAmount: null,
  topCustomers: [],
  chartData: [],
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const MONTH_LABELS_FULL_MAP: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
}

function safeParseProducts(raw: string | null): ProductRecord[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((product): product is ProductRecord => {
      return typeof product === "object" && product !== null && "name" in product
    })
  } catch {
    return []
  }
}

function buildDashboardSnapshot(invoices: InvoiceRecord[], products: ProductRecord[]): DashboardSnapshot {
  if (invoices.length === 0) {
    return {
      ...EMPTY_SNAPSHOT,
      productsCount: products.length,
    }
  }

  const sortedInvoices = sortInvoicesNewestFirst(invoices)

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const lastMonthDate = new Date()
  lastMonthDate.setMonth(currentMonth - 1)

  const lastMonth = lastMonthDate.getMonth()
  const lastMonthYear = lastMonthDate.getFullYear()

  let monthRevenue = 0
  let lastRevenue = 0
  let yearRevenue = 0
  let monthCount = 0
  let gstTotal = 0
  let gstYearTotal = 0

  const clients = new Set<string>()
  const customerMap: Record<string, TopCustomer & { latestInvoice: InvoiceRecord }> = {}
  const revenueMap: Record<string, number> = {}

  sortedInvoices.forEach((invoice) => {
    const amount = Number(invoice.grandTotal || 0)
    const dateParts = getStoredDateParts(invoice.date)
    if (!dateParts) return
    const key = `${dateParts.year}-${dateParts.month - 1}`

    revenueMap[key] = (revenueMap[key] || 0) + amount

    const identity = buildCustomerIdentity(invoice)
    clients.add(identity.id)

    if (!customerMap[identity.id]) {
      customerMap[identity.id] = {
        identity: identity.id,
        name: invoice.clientName || "Unknown",
        revenue: 0,
        count: 0,
        latestInvoice: invoice,
      }
    }

    customerMap[identity.id].revenue += amount
    customerMap[identity.id].count += 1

    if (compareInvoicesNewestFirst(invoice, customerMap[identity.id].latestInvoice) > 0) {
      customerMap[identity.id].latestInvoice = invoice
      customerMap[identity.id].name = invoice.clientName || customerMap[identity.id].name
    }

    const invoiceTaxes = invoice.items.reduce(
      (acc, item) => {
        const base = item.qty * item.price
        acc.cgst += item.cgst ? (base * Number(item.cgst)) / 100 : 0
        acc.sgst += item.sgst ? (base * Number(item.sgst)) / 100 : 0
        acc.igst += item.igst ? (base * Number(item.igst)) / 100 : 0
        return acc
      },
      { cgst: 0, sgst: 0, igst: 0 }
    )

    if (dateParts.month - 1 === currentMonth && dateParts.year === currentYear) {
      monthRevenue += amount
      monthCount += 1
      gstTotal += invoiceTaxes.cgst + invoiceTaxes.sgst + invoiceTaxes.igst
    }

    if (dateParts.year === currentYear) {
      gstYearTotal += invoiceTaxes.cgst + invoiceTaxes.sgst + invoiceTaxes.igst
      yearRevenue += amount
    }

    if (dateParts.month - 1 === lastMonth && dateParts.year === lastMonthYear) {
      lastRevenue += amount
    }
  })

  const topCustomers = Object.values(customerMap)
    .map((customer) => ({
      identity: customer.identity,
      name: customer.name,
      revenue: customer.revenue,
      count: customer.count,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const lastInvoiceDateParts = parseStoredDate(sortedInvoices[0]?.date)
  const lastInvoiceDate = lastInvoiceDateParts ? storedDatePartsToDate(lastInvoiceDateParts) : now
  const months: Array<{ year: number; month: number }> = []

  for (let index = 11; index >= 0; index -= 1) {
    const date = new Date(lastInvoiceDate)
    date.setMonth(date.getMonth() - index)
    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
    })
  }

  const chartData = months.map((month) => {
    const key = `${month.year}-${month.month}`
    return {
      month: MONTH_LABELS[month.month],
      revenue: revenueMap[key] || 0,
    }
  })

  const growthAmount = lastRevenue > 0 ? monthRevenue - lastRevenue : null
  const growthPercent =
    lastRevenue > 0 && growthAmount !== null
      ? Number(((growthAmount / lastRevenue) * 100).toFixed(1))
      : null

  return {
    recentInvoices: sortedInvoices.slice(0, 10),
    productsCount: products.length,
    clientsCount: clients.size,
    thisMonthCount: monthCount,
    gstMonth: gstTotal,
    gstYear: gstYearTotal,
    revenueThisMonth: monthRevenue || null,
    revenueLastMonth: lastRevenue || null,
    revenueYear: yearRevenue || null,
    growthPercent,
    growthAmount,
    topCustomers,
    chartData,
  }
}

export default function Dashboard() {
  const {
    dateFormat,
    amountFormat,
    showDecimals,
    currencySymbol,
    currencyPosition,
  } = useSettings()

  const router = useRouter()
  const dashboardReturnTo = "/dashboard"
  const invoices = useWorkspaceValue(["invoices"], readStoredInvoices)
  const products = useWorkspaceValue(["products"], () => safeParseProducts(getActiveOrGlobalItem("products")))
  const snapshot = useMemo(() => buildDashboardSnapshot(invoices, products), [invoices, products])
  const loadingSnapshot = false

  useEffect(() => {
    router.prefetch("/dashboard/invoices")
    router.prefetch("/dashboard/invoices/create")
    router.prefetch("/dashboard/customers")
    router.prefetch("/dashboard/templates")
    router.prefetch("/dashboard/settings")
    snapshot.recentInvoices.slice(0, 8).forEach((invoice) => {
      router.prefetch(`/dashboard/invoices/view/${encodeURIComponent(invoice.id)}`)
    })
  }, [router, snapshot.recentInvoices])

  function money(value: number) {
    return formatCurrency(
      value,
      currencySymbol,
      currencyPosition,
      showDecimals,
      amountFormat
    )
  }

  const bestMonth = useMemo(
    () =>
      snapshot.chartData.length > 0
        ? snapshot.chartData.reduce((best, current) =>
            current.revenue > best.revenue ? current : best
          )
        : { month: "-", revenue: 0 },
    [snapshot.chartData]
  )

  const averageRevenue = useMemo(
    () =>
      snapshot.chartData.length > 0
        ? snapshot.chartData.reduce((sum, entry) => sum + Number(entry.revenue || 0), 0) / snapshot.chartData.length
        : 0,
    [snapshot.chartData]
  )

  const lowestMonth = useMemo(
    () =>
      snapshot.chartData.length > 0
        ? snapshot.chartData.reduce((lowest, current) =>
            current.revenue < lowest.revenue ? current : lowest
          )
        : { month: "-", revenue: 0 },
    [snapshot.chartData]
  )

  const rollingRevenue = useMemo(
    () => snapshot.chartData.reduce((sum, entry) => sum + Number(entry.revenue || 0), 0),
    [snapshot.chartData]
  )

  if (loadingSnapshot) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="soft-card min-h-[220px] animate-pulse rounded-[30px] bg-slate-100" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="soft-card min-h-[140px] animate-pulse rounded-[28px] bg-slate-100" />
            <div className="soft-card min-h-[140px] animate-pulse rounded-[28px] bg-slate-100" />
          </div>
        </section>
        <section className="grid grid-cols-2 gap-4 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="soft-card min-h-[150px] animate-pulse rounded-[24px] bg-slate-100" />
          ))}
        </section>
        <section className="soft-card min-h-[320px] animate-pulse rounded-[28px] bg-slate-100" />
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-7">
      <section className="app-hero-panel overflow-hidden rounded-[30px] px-5 py-5 text-white sm:px-7 sm:py-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px] xl:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-emerald-200/80">Overview</p>
            <h1 className="font-display mt-3 max-w-3xl text-[2rem] leading-[0.98] tracking-[-0.05em] sm:text-[3.25rem]">
              Revenue, invoices, and client activity in one calm workspace.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200/78 sm:text-[15px] sm:leading-7">
              Start here to see what moved this month, what needs attention next, and where revenue is trending.
            </p>
          </div>

          <div className="grid gap-3 grid-cols-2 xl:grid-cols-1">
            <button
              type="button"
              onClick={() => router.push("/dashboard/invoices/create")}
              className="flex w-full items-center justify-between rounded-[22px] border border-white/16 bg-[rgba(255,255,255,0.16)] px-3 py-3 text-left backdrop-blur-xl transition hover:bg-[rgba(255,255,255,0.2)] xl:px-4 xl:py-4"
            >
              <div className="flex min-w-0 items-center gap-2.5 xl:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/18 text-white xl:h-11 xl:w-11">
                  <FileText className="h-4 w-4 xl:h-5 xl:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold leading-4 text-white xl:text-sm">Create invoice</p>
                  <p className="mt-0.5 hidden truncate text-[10px] leading-3.5 text-white/78 xl:block xl:text-xs">Start a fresh bill right away.</p>
                </div>
              </div>
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-white/75 xl:block" />
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/customers")}
              className="flex w-full items-center justify-between rounded-[22px] border border-white/16 bg-[rgba(255,255,255,0.16)] px-3 py-3 text-left backdrop-blur-xl transition hover:bg-[rgba(255,255,255,0.2)] xl:px-4 xl:py-4"
            >
              <div className="flex min-w-0 items-center gap-2.5 xl:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/18 text-white xl:h-11 xl:w-11">
                  <Users className="h-4 w-4 xl:h-5 xl:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold leading-4 text-white xl:text-sm">Review customers</p>
                  <p className="mt-0.5 hidden truncate text-[10px] leading-3.5 text-white/78 xl:block xl:text-xs">Check repeat clients and details.</p>
                </div>
              </div>
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-white/75 xl:block" />
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/products")}
              className="flex w-full items-center justify-between rounded-[22px] border border-white/16 bg-[rgba(255,255,255,0.16)] px-3 py-3 text-left backdrop-blur-xl transition hover:bg-[rgba(255,255,255,0.2)] xl:px-4 xl:py-4"
            >
              <div className="flex min-w-0 items-center gap-2.5 xl:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/18 text-white xl:h-11 xl:w-11">
                  <Package2 className="h-4 w-4 xl:h-5 xl:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold leading-4 text-white xl:text-sm">Update products</p>
                  <p className="mt-0.5 hidden truncate text-[10px] leading-3.5 text-white/78 xl:block xl:text-xs">Keep pricing and tax ready.</p>
                </div>
              </div>
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-white/75 xl:block" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/16 bg-[rgba(255,255,255,0.14)] px-4 py-4 backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/68">Year revenue</p>
            <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">
              {snapshot.revenueYear ? money(snapshot.revenueYear) : "-"}
            </p>
            <p className="mt-1 hidden truncate text-xs text-white/80 xl:block">All saved invoices this year</p>
          </div>

          <div className="rounded-[24px] border border-white/16 bg-[rgba(255,255,255,0.14)] px-4 py-4 backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/68">This month</p>
            <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">
              {snapshot.revenueThisMonth ? money(snapshot.revenueThisMonth) : "-"}
            </p>
            <p className="mt-1 hidden truncate text-xs text-white/80 xl:block">{snapshot.thisMonthCount} invoices issued</p>
          </div>

          <div className="rounded-[24px] border border-white/16 bg-[rgba(255,255,255,0.14)] px-4 py-4 backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/68">Growth</p>
            <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">
              {snapshot.growthPercent !== null ? `${snapshot.growthPercent > 0 ? "+" : ""}${snapshot.growthPercent}%` : "-"}
            </p>
            <p className="mt-1 hidden truncate text-xs text-white/80 xl:block">
              {snapshot.growthAmount !== null
                ? `${snapshot.growthAmount > 0 ? "+" : ""}${money(snapshot.growthAmount)} vs last month`
                : "Appears after one previous month"}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/16 bg-[rgba(255,255,255,0.14)] px-4 py-4 backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/68">Client base</p>
            <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">{snapshot.clientsCount}</p>
            <p className="mt-1 hidden truncate text-xs text-white/80 xl:block">{snapshot.productsCount} products in catalog</p>
          </div>
        </div>
      </section>

      <section className="soft-card rounded-[30px] p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Revenue</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Rolling 12-month revenue</h2>
            <p className="mt-1 text-sm text-slate-500">A cleaner yearly view without breaking the working surface.</p>
          </div>
          <div className="rounded-[20px] border border-[rgba(83,93,105,0.12)] bg-slate-50/90 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Rolling total</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{money(rollingRevenue)}</p>
          </div>
        </div>

        <div className="h-52 sm:h-64 lg:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={snapshot.chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis
                stroke="#94a3b8"
                width={typeof window !== "undefined" && window.innerWidth < 1024 ? 56 : undefined}
                tickFormatter={(value) => {
                  const n = Number(value)
                  if (!Number.isFinite(n)) return String(value)

                  const stripTrailingZero = (text: string) => (text.endsWith(".0") ? text.slice(0, -2) : text)

                  if (n < 100000) {
                    if (n === 0) return "0"
                    const k = Math.min(98, Math.max(1, Math.floor(n / 1000)))
                    return `${k}K`
                  }

                  if (n < 10000000) {
                    const lakh = n / 100000
                    const asText = lakh >= 10 ? String(Math.round(lakh)) : lakh.toFixed(1)
                    return `${stripTrailingZero(asText)}L`
                  }

                  const crore = n / 10000000
                  const croreText = crore >= 10 ? String(Math.round(crore)) : crore.toFixed(1)
                  return `${stripTrailingZero(croreText)}Cr`
                }}
              />
              <Tooltip formatter={(value) => money(Number(value ?? 0))} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0f766e"
                strokeWidth={3}
                fill="url(#colorRevenue)"
                dot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <div className="app-dark-card rounded-[26px] p-5 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/52">Current momentum</p>
            <p className="mt-3 text-3xl font-semibold">
              {snapshot.thisMonthCount} <span className="text-lg font-medium text-white/70">invoices</span>
            </p>
            <p className="mt-2 hidden truncate text-sm text-white/66 xl:block">
              {snapshot.revenueThisMonth ? money(snapshot.revenueThisMonth) : "-"} billed this month.
            </p>
          </div>

          <div className="soft-card rounded-[26px] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Best month</p>
            <p className="mt-3 text-xl font-semibold text-slate-950">
              {MONTH_LABELS_FULL_MAP[bestMonth.month] ?? bestMonth.month}
            </p>
            <p className="mt-2 hidden truncate text-sm text-slate-500 xl:block">{money(bestMonth.revenue || 0)}</p>
          </div>

          <div className="soft-card rounded-[26px] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Average month</p>
            <p className="mt-3 text-xl font-semibold text-slate-950">{money(averageRevenue)}</p>
            <p className="mt-2 hidden truncate text-sm text-slate-500 xl:block">Across the last 12 months.</p>
          </div>

          <div className="soft-card rounded-[26px] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Quietest month</p>
            <p className="mt-3 text-xl font-semibold text-slate-950">
              {MONTH_LABELS_FULL_MAP[lowestMonth.month] ?? lowestMonth.month}
            </p>
            <p className="mt-2 hidden truncate text-sm text-slate-500 xl:block">{money(lowestMonth.revenue || 0)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="soft-card rounded-[30px] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Recent work</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Latest invoices</h2>
            </div>
            <button
              onClick={() => router.push("/dashboard/invoices")}
              className="app-secondary-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-600 transition hover:text-slate-950"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 lg:hidden">
            {snapshot.recentInvoices.length === 0 ? (
              <div className="app-mobile-card rounded-[24px] p-6 text-center text-sm text-slate-500">
                No recent invoices
              </div>
            ) : (
            snapshot.recentInvoices.slice(0, 5).map((invoice) => (
                <button
                  key={invoice.id}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/dashboard/invoices/view/${encodeURIComponent(invoice.id)}?returnTo=${encodeURIComponent(dashboardReturnTo)}`
                    )
                  }
                  className="app-mobile-card w-full rounded-[24px] p-4 text-left transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(29,107,95,0.12)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                      <p className="mt-1 truncate text-sm text-slate-600">{invoice.clientName}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatDate(invoice.date, dateFormat)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Amount</p>
                      <AutoFitText wrapperClassName="mt-2" spanClassName="text-sm font-semibold text-slate-950" minPx={10}>
                        {money(invoice.grandTotal)}
                      </AutoFitText>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="hidden lg:block">
            <div className="app-table-shell rounded-[24px]">
              <table className="w-full text-sm">
                <thead className="app-table-head">
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                {snapshot.recentInvoices.slice(0, 10).map((invoice) => (
                  <tr
                      key={invoice.id}
                      className="cursor-pointer border-b border-slate-100/70 transition hover:bg-white/55"
                      onClick={() =>
                        router.push(
                          `/dashboard/invoices/view/${encodeURIComponent(invoice.id)}?returnTo=${encodeURIComponent(dashboardReturnTo)}`
                        )
                      }
                    >
                      <td className="px-4 py-4 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-4">{invoice.clientName}</td>
                      <td className="px-4 py-4">{formatDate(invoice.date, dateFormat)}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{money(invoice.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="soft-card rounded-[30px] p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Clients</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Top customers</h2>
          </div>

          <div className="space-y-3">
            {snapshot.topCustomers.length === 0 ? (
              <div className="app-mobile-card rounded-[24px] p-6 text-center text-sm text-slate-500">
                No top customers yet
              </div>
            ) : (
              snapshot.topCustomers.slice(0, 5).map((customer, index) => (
                <div
                  key={`${customer.identity}-${index}`}
                  className="rounded-[24px] border border-[rgba(83,93,105,0.11)] bg-white/84 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{customer.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{customer.count} invoices</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Revenue</p>
                      <AutoFitText wrapperClassName="mt-2" spanClassName="text-sm font-semibold text-slate-950" minPx={10}>
                        {money(customer.revenue)}
                      </AutoFitText>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
