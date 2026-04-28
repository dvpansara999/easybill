"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatDate, getStoredDateParts } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import { sortInvoicesNewestFirst } from "@/lib/invoiceCollections"
import { matchesCustomerIdentity } from "@/lib/customerIdentity"
import { ArrowLeft, FilePlus2, Mail, MapPin, Phone, ReceiptIndianRupee } from "lucide-react"
import { readStoredInvoices, type InvoiceRecord } from "@/lib/invoice"
import { useWorkspaceValue } from "@/lib/useWorkspaceValue"
import SelectMenu from "@/components/ui/SelectMenu"
import NotFoundRecoveryCard from "@/components/shared/NotFoundRecoveryCard"

type CustomerSummary = {
  name: string
  phone: string
  email: string
  gstin: string
  address: string
}

export default function CustomerDetails() {
  const { dateFormat, amountFormat, showDecimals, currencySymbol, currencyPosition } = useSettings()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerIdentity = decodeURIComponent(String(params.phone || ""))
  const returnTo = searchParams.get("returnTo") || "/dashboard/customers"
  const [month, setMonth] = useState(searchParams.get("month") || "all")
  const [year, setYear] = useState(searchParams.get("year") || "all")
  const allInvoices = useWorkspaceValue<InvoiceRecord[]>(["invoices"], readStoredInvoices)
  const deferredMonth = useDeferredValue(month)
  const deferredYear = useDeferredValue(year)

  useEffect(() => {
    router.prefetch("/dashboard/customers")
    router.prefetch("/dashboard/invoices/create")
    allInvoices
      .filter((invoice) => matchesCustomerIdentity(invoice, customerIdentity))
      .slice(0, 8)
      .forEach((invoice) => {
        router.prefetch(`/dashboard/invoices/view/${encodeURIComponent(invoice.id)}`)
      })
  }, [allInvoices, customerIdentity, router])

  const invoices = useMemo(
    () => sortInvoicesNewestFirst(allInvoices.filter((invoice) => matchesCustomerIdentity(invoice, customerIdentity))),
    [allInvoices, customerIdentity]
  )

  const customer = useMemo<CustomerSummary | null>(() => {
    const latest = invoices[0]
    if (!latest) return null

    return {
      name: latest.clientName,
      phone: latest.clientPhone,
      email: latest.clientEmail,
      gstin: latest.clientGST,
      address: latest.clientAddress,
    }
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    let result = [...invoices]

    if (deferredMonth !== "all") {
      result = result.filter((invoice) => getStoredDateParts(invoice.date)?.month === Number(deferredMonth))
    }

    if (deferredYear !== "all") {
      result = result.filter((invoice) => getStoredDateParts(invoice.date)?.year === Number(deferredYear))
    }

    return sortInvoicesNewestFirst(result)
  }, [deferredMonth, deferredYear, invoices])

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const years = useMemo(
    () =>
      Array.from(
        new Set(
          invoices
            .map((invoice) => getStoredDateParts(invoice.date)?.year)
            .filter((year): year is number => year !== undefined)
        )
      ),
    [invoices]
  )
  const customerViewReturnTo = `/dashboard/customers/${encodeURIComponent(customerIdentity)}?returnTo=${encodeURIComponent(returnTo)}&month=${month}&year=${year}`

  const yearOptions = [{ value: "all", label: "All Years" }, ...years.map((value) => ({ value: String(value), label: String(value) }))]
  const monthOptions = [
    { value: "all", label: "All Months" },
    ...months.map((label, idx) => ({ value: String(idx + 1), label })),
  ]

  function getGST(invoice: InvoiceRecord) {
    return (invoice.items || []).reduce((totalGST, item) => {
      const base = Number(item.qty || 0) * Number(item.price || 0)
      const cgstAmount = item.cgst ? (base * Number(item.cgst)) / 100 : 0
      const sgstAmount = item.sgst ? (base * Number(item.sgst)) / 100 : 0
      const igstAmount = item.igst ? (base * Number(item.igst)) / 100 : 0
      return totalGST + cgstAmount + sgstAmount + igstAmount
    }, 0)
  }

  function money(value: number) {
    return formatCurrency(value, currencySymbol, currencyPosition, showDecimals, amountFormat)
  }

  const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0)

  function createInvoice() {
    if (!customer) {
      router.push("/dashboard/invoices/create")
      return
    }

    const query = new URLSearchParams({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      gstin: customer.gstin || "",
      address: customer.address || "",
    })

    router.push(`/dashboard/invoices/create?${query.toString()}`)
  }

  if (!customer && invoices.length === 0) {
    return (
      <NotFoundRecoveryCard
        title="Customer not found"
        description="This customer no longer has invoice history in the current workspace. You can return to customers, go back to the dashboard, or retry syncing your workspace."
        backLabel="Back to customers"
        onBack={() => router.push(returnTo)}
        onDashboard={() => router.push("/dashboard")}
        onRetry={() => setTimeout(() => window.dispatchEvent(new CustomEvent("easybill:cloud-sync")), 0)}
      />
    )
  }

  return (
    <div className="space-y-6 pb-24 lg:space-y-8 lg:pb-0">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="app-dark-card rounded-[30px] p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:p-8">
          <button
            onClick={() => router.push(returnTo)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white sm:w-auto sm:rounded-full sm:justify-start sm:px-4 sm:py-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </button>

          <p className="mt-5 text-xs uppercase tracking-[0.34em] text-emerald-300/80">Customer Profile</p>
          <h1 className="font-display mt-3 text-3xl leading-tight text-white sm:mt-4 sm:text-4xl">
            {customer?.name || "Customer"}
          </h1>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-3">
            <div className="col-span-2 rounded-[24px] border border-white/10 bg-white/5 p-3 sm:hidden">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Phone</p>
              <div className="mt-2 flex min-w-0 items-center gap-3 text-slate-100">
                <Phone className="h-4 w-4 shrink-0 text-emerald-300" />
                <span className="min-w-0 break-words leading-snug">{customer?.phone || "Not added yet"}</span>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Email</p>
                <div className="mt-2 flex min-w-0 items-center gap-3 text-slate-100">
                  <Mail className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span className="min-w-0 break-all leading-snug">{customer?.email || "Not added yet"}</span>
                </div>
              </div>
            </div>

            <div className="hidden rounded-[24px] border border-white/10 bg-white/5 p-3 sm:block sm:p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Phone</p>
              <div className="mt-2 flex min-w-0 items-center gap-3 text-slate-100">
                <Phone className="h-4 w-4 shrink-0 text-emerald-300" />
                <span className="min-w-0 break-words leading-snug">{customer?.phone || "Not added yet"}</span>
              </div>
            </div>

            <div className="hidden rounded-[24px] border border-white/10 bg-white/5 p-3 sm:block sm:p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Email</p>
              <div className="mt-2 flex min-w-0 items-center gap-3 text-slate-100">
                <Mail className="h-4 w-4 shrink-0 text-emerald-300" />
                <span className="min-w-0 break-words leading-snug">{customer?.email || "Not added yet"}</span>
              </div>
            </div>

            <div className="col-span-2 rounded-[24px] border border-white/10 bg-white/5 p-3 sm:p-4 md:col-span-1">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">GSTIN</p>
              <div className="mt-2 flex items-center gap-3 text-slate-100">
                <ReceiptIndianRupee className="h-4 w-4 text-emerald-300" />
                <span className="break-words leading-snug">{customer?.gstin || "Not added yet"}</span>
              </div>
            </div>

            <div className="col-span-2 rounded-[24px] border border-white/10 bg-white/5 p-3 sm:p-4 md:col-span-1">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Address</p>
              <div className="mt-2 flex items-start gap-3 text-slate-100">
                <MapPin className="mt-0.5 h-4 w-4 text-emerald-300" />
                <span className="break-words leading-snug">{customer?.address || "Not added yet"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="grid grid-cols-2 gap-4">
            <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Invoices On Record</p>
              <p className="mt-2.5 text-2xl font-semibold text-slate-950 sm:mt-3 sm:text-3xl">{invoices.length}</p>
              <p className="mt-1.5 text-xs text-slate-500 sm:mt-2 sm:text-sm">Complete invoice history stored for this customer.</p>
            </div>

            <button
              onClick={createInvoice}
              className="app-primary-button inline-flex items-center justify-center gap-2 rounded-[24px] px-5 py-4 text-sm font-semibold"
            >
              <FilePlus2 className="h-4 w-4" />
              Create Invoice
            </button>

            <div className="soft-card col-span-2 rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Revenue</p>
              <p className="mt-2.5 text-2xl font-semibold text-slate-950 sm:mt-3 sm:text-3xl">{money(totalRevenue)}</p>
              <p className="mt-1.5 text-xs text-slate-500 sm:mt-2 sm:text-sm">Total billed value generated from this customer.</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Invoices On Record</p>
              <p className="mt-2.5 text-2xl font-semibold text-slate-950 sm:mt-3 sm:text-3xl">{invoices.length}</p>
              <p className="mt-1.5 text-xs text-slate-500 sm:mt-2 sm:text-sm">Complete invoice history stored for this customer.</p>
            </div>

            <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Revenue</p>
              <p className="mt-2.5 text-2xl font-semibold text-slate-950 sm:mt-3 sm:text-3xl">{money(totalRevenue)}</p>
              <p className="mt-1.5 text-xs text-slate-500 sm:mt-2 sm:text-sm">Total billed value generated from this customer.</p>
            </div>

            <button
              onClick={createInvoice}
              className="app-primary-button inline-flex items-center justify-center gap-2 rounded-[24px] px-5 py-4 text-sm font-semibold"
            >
              <FilePlus2 className="h-4 w-4" />
              Create Invoice
            </button>
          </div>
        </div>
      </section>

      <section className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
        <div className="grid gap-3 lg:grid-cols-[0.7fr_0.3fr] lg:items-end lg:gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Invoice History</p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Use the month and year filters to narrow down this customer&apos;s invoice timeline.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="app-subtle-panel rounded-2xl px-4 py-3">
              <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Month</span>
              <div className="mt-1">
                <SelectMenu
                  value={month}
                  onChange={setMonth}
                  options={monthOptions}
                  className="[&>button]:px-3 [&>button]:py-2.5 [&>button]:text-[12px] [&>button>span]:whitespace-nowrap [&_[role='option']>span]:whitespace-nowrap [&_[role='option']]:text-[12px]"
                />
              </div>
            </label>

            <label className="app-subtle-panel rounded-2xl px-4 py-3">
              <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Year</span>
              <div className="mt-1">
                <SelectMenu
                  value={year}
                  onChange={setYear}
                  options={yearOptions}
                  className="[&>button]:px-3 [&>button]:py-2.5 [&>button]:text-[12px] [&>button>span]:whitespace-nowrap [&_[role='option']>span]:whitespace-nowrap [&_[role='option']]:text-[12px]"
                />
              </div>
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-3 lg:hidden">
          {filteredInvoices.length === 0 ? (
            <div className="app-mobile-card rounded-[24px] p-6 text-center text-sm text-slate-500">
              <p>No invoices match these filters yet.</p>
              <p className="mt-2">Create a new invoice for this customer to keep the history moving.</p>
              <button
                type="button"
                onClick={createInvoice}
                className="app-secondary-button mt-4 inline-flex rounded-full px-4 py-2 font-semibold"
              >
                Create invoice
              </button>
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/invoices/view/${encodeURIComponent(invoice.id)}?returnTo=${encodeURIComponent(customerViewReturnTo)}`
                  )
                }
                className="app-mobile-card w-full rounded-[22px] p-4 text-left transition hover:bg-white/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(29,107,95,0.12)]"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                    <p className="mt-2 text-xs text-slate-500">GST-{money(getGST(invoice))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-950">{money(invoice.grandTotal || 0)}</p>
                    <p className="mt-1 text-xs text-slate-600">{formatDate(invoice.date, dateFormat)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="app-table-shell mt-6 hidden rounded-[24px] lg:block">
          <table className="w-full text-sm">
            <thead className="app-table-head">
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">GST</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    <div className="mx-auto max-w-md">
                      <p className="font-medium text-slate-700">No invoices match these filters yet.</p>
                      <p className="mt-2 text-sm">Create a new invoice for this customer to keep the history moving.</p>
                      <button
                        type="button"
                        onClick={createInvoice}
                        className="app-secondary-button mt-4 inline-flex rounded-full px-4 py-2 font-semibold"
                      >
                        Create invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() =>
                    router.push(
                      `/dashboard/invoices/view/${encodeURIComponent(invoice.id)}?returnTo=${encodeURIComponent(customerViewReturnTo)}`
                    )
                  }
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-white/70"
                >
                  <td className="break-words px-4 py-4 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(invoice.date, dateFormat)}</td>
                  <td className="px-4 py-4 text-slate-600">{money(getGST(invoice))}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{money(invoice.grandTotal || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
