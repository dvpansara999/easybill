"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/lib/dateFormat"
import { getActiveUserId } from "@/lib/auth"
import { formatCurrency, formatCurrencyQuickStatsMobile } from "@/lib/formatCurrency"
import { getAuthMode } from "@/lib/runtimeMode"
import { isActiveUserKvHydrated } from "@/lib/userStore"
import { readStoredInvoices, type InvoiceRecord } from "@/lib/invoice"
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

function sortInvoicesByDate(invoices: InvoiceRecord[]) {
  return [...invoices].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (dateDiff !== 0) return dateDiff

    const aNum = Number(String(a.invoiceNumber || "").replace(/\D/g, ""))
    const bNum = Number(String(b.invoiceNumber || "").replace(/\D/g, ""))
    return bNum - aNum
  })
}

function buildDashboardSnapshot(): DashboardSnapshot {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  const invoices = readStoredInvoices()
  const products = safeParseProducts(getActiveOrGlobalItem("products"))

  if (invoices.length === 0) {
    return {
      ...EMPTY_SNAPSHOT,
      productsCount: products.length,
    }
  }

  const sortedInvoices = sortInvoicesByDate(invoices)

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
  const customerMap: Record<string, TopCustomer> = {}
  const revenueMap: Record<string, number> = {}

  sortedInvoices.forEach((invoice) => {
    const amount = Number(invoice.grandTotal || 0)
    const date = new Date(invoice.date)
    const key = `${date.getFullYear()}-${date.getMonth()}`

    revenueMap[key] = (revenueMap[key] || 0) + amount

    if (invoice.clientName) {
      clients.add(invoice.clientName)

      if (!customerMap[invoice.clientName]) {
        customerMap[invoice.clientName] = {
          name: invoice.clientName,
          revenue: 0,
          count: 0,
        }
      }

      customerMap[invoice.clientName].revenue += amount
      customerMap[invoice.clientName].count += 1
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

    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      monthRevenue += amount
      monthCount += 1
      gstTotal += invoiceTaxes.cgst + invoiceTaxes.sgst + invoiceTaxes.igst
    }

    if (date.getFullYear() === currentYear) {
      gstYearTotal += invoiceTaxes.cgst + invoiceTaxes.sgst + invoiceTaxes.igst
      yearRevenue += amount
    }

    if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
      lastRevenue += amount
    }
  })

  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const lastInvoiceDate = new Date(sortedInvoices[0]?.date || now.toISOString())
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
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(EMPTY_SNAPSHOT)

  useEffect(() => {
    let initialLoaded = false

    const loadIfReady = () => {
      if (initialLoaded) return

      const userId = getActiveUserId()
      const mode = getAuthMode()

      if (mode === "supabase") {
        if (!userId) return
        if (!isActiveUserKvHydrated()) return
      }

      initialLoaded = true
      setSnapshot(buildDashboardSnapshot())
    }

    const onCloudSync = () => {
      initialLoaded = true
      setSnapshot(buildDashboardSnapshot())
    }

    window.addEventListener("easybill:cloud-sync", onCloudSync as EventListener)

    loadIfReady()
    let attempts = 0
    const intervalId = window.setInterval(() => {
      if (initialLoaded) {
        window.clearInterval(intervalId)
        return
      }

      attempts += 1
      loadIfReady()
      if (attempts >= 20) {
        window.clearInterval(intervalId)
      }
    }, 150)

    return () => {
      window.removeEventListener("easybill:cloud-sync", onCloudSync as EventListener)
      window.clearInterval(intervalId)
    }
  }, [])

  function money(value: number) {
    return formatCurrency(
      value,
      currencySymbol,
      currencyPosition,
      showDecimals,
      amountFormat
    )
  }

  function moneyQuickStatsMobile(value: number) {
    return formatCurrencyQuickStatsMobile(
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

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:p-8 lg:p-8">
          <p className="text-xs uppercase tracking-[0.34em] text-emerald-300/80">
            Business Overview
          </p>
          <h1 className="font-display mt-4 max-w-3xl text-3xl leading-tight sm:text-4xl lg:text-5xl">
            Your business pulse, recent work, and growth snapshot in one modern dashboard.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Track invoices, revenue, GST, and customer momentum without changing any of the underlying invoice workflow you already rely on.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="soft-card rounded-[28px] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">This Year Revenue</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
              {snapshot.revenueYear ? money(snapshot.revenueYear) : "-"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Current annual revenue generated from stored invoices.
            </p>
          </div>

          <div className="soft-card rounded-[28px] border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Growth This Month</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
              {snapshot.growthPercent !== null ? `${snapshot.growthPercent > 0 ? "+" : ""}${snapshot.growthPercent}%` : "-"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {snapshot.growthAmount !== null
                ? `${snapshot.growthAmount > 0 ? "+" : ""}${money(snapshot.growthAmount)}`
                : "Revenue comparison appears after at least one prior month."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <div className="soft-card rounded-[24px] p-5 sm:p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">This Month Invoices</p>
          <AutoFitText wrapperClassName="mt-2" spanClassName="text-xl sm:text-2xl font-semibold text-slate-950" minPx={14}>
            {snapshot.thisMonthCount}
          </AutoFitText>
        </div>

        <div
          onClick={() => router.push("/dashboard/products")}
          className="soft-card cursor-pointer rounded-[24px] p-5 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-6"
        >
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <Package2 className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">My Products</p>
          <AutoFitText wrapperClassName="mt-2" spanClassName="text-xl sm:text-2xl font-semibold text-slate-950" minPx={14}>
            {snapshot.productsCount}
          </AutoFitText>
        </div>

        <div className="soft-card rounded-[24px] p-5 sm:p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <ReceiptIndianRupee className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">GST This Month</p>
          <AutoFitText wrapperClassName="mt-2" spanClassName="text-xl sm:text-2xl font-semibold text-slate-950" minPx={14}>
            {money(snapshot.gstMonth)}
          </AutoFitText>
        </div>

        <div className="soft-card rounded-[24px] p-5 sm:p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">Total Clients</p>
          <AutoFitText wrapperClassName="mt-2" spanClassName="text-xl sm:text-2xl font-semibold text-slate-950" minPx={14}>
            {snapshot.clientsCount}
          </AutoFitText>
        </div>
      </section>

      <section className="soft-card rounded-[28px] p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="section-title text-xl sm:text-2xl">Recent Invoices</h2>
            <p className="mt-1 text-sm text-slate-500">Open the latest entries and continue faster.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/invoices")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 lg:hidden">
          {snapshot.recentInvoices.length === 0 ? (
            <div className="rounded-[24px] border border-slate-200/70 bg-white p-6 text-center text-sm text-slate-500">
              No recent invoices
            </div>
          ) : (
            snapshot.recentInvoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() => router.push(`/dashboard/invoices/view/${encodeURIComponent(invoice.id)}`)}
                className="w-full rounded-[24px] border border-slate-200/70 bg-white p-4 text-left transition hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                    <p className="mt-1 truncate text-sm text-slate-600">{invoice.clientName}</p>
                    <p className="mt-2 text-xs text-slate-500">Date: {formatDate(invoice.date, dateFormat)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Amount</p>
                    <AutoFitText
                      wrapperClassName="mt-2"
                      spanClassName="text-sm font-semibold text-slate-950"
                      minPx={10}
                    >
                      {money(invoice.grandTotal)}
                    </AutoFitText>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="hidden lg:block">
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
                {snapshot.recentInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/70"
                    onClick={() => router.push(`/dashboard/invoices/view/${encodeURIComponent(invoice.id)}`)}
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
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        <div className="soft-card rounded-[28px] p-5 sm:p-6 xl:col-span-3">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="section-title text-xl sm:text-2xl">Monthly Revenue</h2>
              <p className="text-sm text-slate-500">A rolling 12-month view of invoice totals.</p>
            </div>
          </div>

          <div className="h-44 sm:h-52 lg:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshot.chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.32} />
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

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Best Month</p>
              <AutoFitText
                wrapperClassName="mt-2"
                spanClassName="text-lg font-semibold text-slate-950"
                minPx={10}
              >
                {MONTH_LABELS_FULL_MAP[bestMonth.month] ?? bestMonth.month}
              </AutoFitText>
              <p className="mt-1 text-sm text-slate-500">{money(bestMonth.revenue || 0)}</p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">12-Month Average</p>
              <AutoFitText
                wrapperClassName="mt-2"
                spanClassName="text-lg font-semibold text-slate-950"
                minPx={10}
              >
                {money(averageRevenue)}
              </AutoFitText>
              <p className="mt-1 text-sm text-slate-500">Average billed revenue per month.</p>
            </div>

            <div className="rounded-3xl bg-slate-950 p-4 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current Momentum</p>
              <AutoFitText
                wrapperClassName="mt-2"
                spanClassName="text-lg font-semibold"
                minPx={10}
              >
                {snapshot.thisMonthCount} invoices
              </AutoFitText>
              <p className="mt-1 text-sm text-slate-300">
                {snapshot.revenueThisMonth ? money(snapshot.revenueThisMonth) : "-"} billed this month.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Lowest Month</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <p className="text-lg font-semibold text-slate-950">
                  {MONTH_LABELS_FULL_MAP[lowestMonth.month] ?? lowestMonth.month}
                </p>
                <p className="text-sm font-medium text-slate-500">{money(lowestMonth.revenue || 0)}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Rolling 12-Month Total</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <p className="text-lg font-semibold text-slate-950">{money(rollingRevenue)}</p>
                <p className="text-sm font-medium text-slate-500">{snapshot.chartData.length} months tracked</p>
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
              <h2 className="section-title text-xl sm:text-2xl">Quick Stats</h2>
              <p className="text-sm text-slate-500">Short-term signals worth watching.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Last Month</p>
              {snapshot.revenueLastMonth ? (
                <>
                  <AutoFitText
                    wrapperClassName="mt-2 lg:hidden"
                    spanClassName="text-base font-semibold text-slate-950 sm:text-xl"
                    minPx={12}
                  >
                    {moneyQuickStatsMobile(snapshot.revenueLastMonth)}
                  </AutoFitText>
                  <AutoFitText
                    wrapperClassName="mt-2 hidden lg:block"
                    spanClassName="text-base font-semibold text-slate-950 sm:text-xl"
                    minPx={12}
                  >
                    {money(snapshot.revenueLastMonth)}
                  </AutoFitText>
                </>
              ) : (
                <AutoFitText
                  wrapperClassName="mt-2"
                  spanClassName="text-base font-semibold text-slate-950 sm:text-xl"
                  minPx={12}
                >
                  -
                </AutoFitText>
              )}
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">This Month</p>
              {snapshot.revenueThisMonth ? (
                <>
                  <AutoFitText
                    wrapperClassName="mt-2 lg:hidden"
                    spanClassName="text-base font-semibold text-slate-950 sm:text-xl"
                    minPx={12}
                  >
                    {moneyQuickStatsMobile(snapshot.revenueThisMonth)}
                  </AutoFitText>
                  <AutoFitText
                    wrapperClassName="mt-2 hidden lg:block"
                    spanClassName="text-base font-semibold text-slate-950 sm:text-xl"
                    minPx={12}
                  >
                    {money(snapshot.revenueThisMonth)}
                  </AutoFitText>
                </>
              ) : (
                <AutoFitText
                  wrapperClassName="mt-2"
                  spanClassName="text-base font-semibold text-slate-950 sm:text-xl"
                  minPx={12}
                >
                  -
                </AutoFitText>
              )}
            </div>

            {snapshot.growthPercent !== null && (
              <div className="rounded-3xl bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-700">Growth This Month</p>
                <AutoFitText
                  wrapperClassName="mt-2 lg:hidden"
                  spanClassName="text-base font-semibold text-slate-950 sm:text-xl"
                  minPx={12}
                >
                  {snapshot.growthAmount && snapshot.growthAmount > 0 ? "+" : ""}
                  {moneyQuickStatsMobile(snapshot.growthAmount || 0)}
                </AutoFitText>
                <AutoFitText
                  wrapperClassName="mt-2 hidden lg:block"
                  spanClassName="text-base font-semibold text-slate-950 sm:text-xl"
                  minPx={12}
                >
                  {snapshot.growthAmount && snapshot.growthAmount > 0 ? "+" : ""}
                  {money(snapshot.growthAmount || 0)}
                </AutoFitText>
                <p className={`text-sm ${snapshot.growthPercent >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                  {snapshot.growthPercent >= 0 ? "Up" : "Down"} {snapshot.growthPercent > 0 ? "+" : ""}
                  {snapshot.growthPercent}%
                </p>
              </div>
            )}

            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">GST This Year</p>
              <AutoFitText
                wrapperClassName="mt-2 lg:hidden"
                spanClassName="text-base font-semibold text-slate-950 sm:text-xl"
                minPx={12}
              >
                {moneyQuickStatsMobile(snapshot.gstYear)}
              </AutoFitText>
              <AutoFitText
                wrapperClassName="mt-2 hidden lg:block"
                spanClassName="text-base font-semibold text-slate-950 sm:text-xl"
                minPx={12}
              >
                {money(snapshot.gstYear)}
              </AutoFitText>
            </div>

            <div className="rounded-3xl bg-slate-950 p-4 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">This Year Revenue</p>
              {snapshot.revenueYear ? (
                <>
                  <AutoFitText
                    wrapperClassName="mt-2 lg:hidden"
                    spanClassName="text-xl font-semibold sm:text-2xl"
                    minPx={12}
                  >
                    {moneyQuickStatsMobile(snapshot.revenueYear)}
                  </AutoFitText>
                  <AutoFitText
                    wrapperClassName="mt-2 hidden lg:block"
                    spanClassName="text-xl font-semibold sm:text-2xl"
                    minPx={12}
                  >
                    {money(snapshot.revenueYear)}
                  </AutoFitText>
                </>
              ) : (
                <AutoFitText
                  wrapperClassName="mt-2"
                  spanClassName="text-xl font-semibold sm:text-2xl"
                  minPx={12}
                >
                  -
                </AutoFitText>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="soft-card rounded-[28px] p-6">
        <h2 className="section-title mb-4 text-2xl">Top Customers</h2>
        <div className="space-y-3 lg:hidden">
          {snapshot.topCustomers.length === 0 ? (
            <div className="rounded-[24px] border border-slate-200/70 bg-white p-6 text-center text-sm text-slate-500">
              No top customers yet
            </div>
          ) : (
            snapshot.topCustomers.map((customer, index) => (
              <div key={`${customer.name}-${index}`} className="rounded-[24px] border border-slate-200/70 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{customer.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{customer.count} invoices</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Revenue</p>
                    <AutoFitText
                      wrapperClassName="mt-2"
                      spanClassName="text-sm font-semibold text-slate-950"
                      minPx={10}
                    >
                      {money(customer.revenue)}
                    </AutoFitText>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden lg:block">
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
                {snapshot.topCustomers.map((customer, index) => (
                  <tr key={`${customer.name}-${index}`} className="border-b border-slate-100">
                    <td className="px-4 py-4 font-medium text-slate-900">{customer.name}</td>
                    <td className="px-4 py-4">{customer.count}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{money(customer.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
