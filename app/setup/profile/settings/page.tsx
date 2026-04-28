"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import { useBusiness } from "@/context/BusinessContext"
import { useSettings } from "@/context/SettingsContext"
import { useAppAlert } from "@/components/providers/AppAlertProvider"
import SelectMenu from "@/components/ui/SelectMenu"
import { getSetupProfileDraft } from "@/lib/setupProfileDraft"
import {
  buildInvoiceNumberPreviewSeries,
  generateInvoiceNumber,
  getFirstRepeatedInvoiceNumberWarning,
} from "@/lib/invoiceNumber"
import { getInvoicePrefixError } from "@/lib/invoicePrefixValidation"
import { formatResetMonthLabel, RESET_MONTH_DAY_OPTIONS } from "@/lib/invoiceResetDate"
import { readStoredInvoices } from "@/lib/invoice"
import { flushCloudKeyNow, setActiveOrGlobalItem } from "@/lib/userStore"
import { useWorkspaceValue } from "@/lib/useWorkspaceValue"

type InvoiceHistoryRecord = {
  invoiceNumber: string
  date: string
}

export default function SetupProfileSettingsPage() {
  const router = useRouter()
  const { setBusiness } = useBusiness()
  const { showAlert } = useAppAlert()
  const {
    dateFormat,
    updateDateFormat,
    amountFormat,
    updateAmountFormat,
    showDecimals,
    updateShowDecimals,
    invoicePrefix,
    updateInvoicePrefix,
    invoicePadding,
    updateInvoicePadding,
    invoiceStartNumber,
    updateInvoiceStartNumber,
    resetYearly,
    updateResetYearly,
    invoiceResetMonthDay,
    updateInvoiceResetMonthDay,
    currencySymbol,
    updateCurrencySymbol,
    currencyPosition,
    updateCurrencyPosition,
  } = useSettings()

  const [draftProfile] = useState(() => getSetupProfileDraft())
  const invoiceHistory = useWorkspaceValue<InvoiceHistoryRecord[]>(["invoices"], () => readStoredInvoices())
  const [draftDateFormat, setDraftDateFormat] = useState(dateFormat)
  const [draftAmountFormat, setDraftAmountFormat] = useState(amountFormat)
  const [draftShowDecimals, setDraftShowDecimals] = useState(showDecimals)
  const [draftInvoicePrefix, setDraftInvoicePrefix] = useState(invoicePrefix)
  const [draftInvoicePadding, setDraftInvoicePadding] = useState(invoicePadding)
  const [draftInvoiceStartNumber, setDraftInvoiceStartNumber] = useState(invoiceStartNumber)
  const [draftResetYearly, setDraftResetYearly] = useState(resetYearly)
  const [draftInvoiceResetMonthDay, setDraftInvoiceResetMonthDay] = useState(invoiceResetMonthDay)
  const [draftCurrencySymbol, setDraftCurrencySymbol] = useState(currencySymbol === "Rs" ? "₹" : currencySymbol)
  const [draftCurrencyPosition, setDraftCurrencyPosition] = useState(currencyPosition)
  const [finishing, setFinishing] = useState(false)
  const [prefixErrorMessage, setPrefixErrorMessage] = useState("")

  useEffect(() => {
    setActiveOrGlobalItem("setupResumePath", "/setup/profile/settings")
  }, [])

  const invoicePreview = useMemo(() => {
    return generateInvoiceNumber(
      invoiceHistory,
      draftInvoicePrefix,
      draftInvoicePadding,
      Math.max(1, Number.isFinite(draftInvoiceStartNumber) ? draftInvoiceStartNumber : 1),
      draftResetYearly,
      draftInvoiceResetMonthDay
    )
  }, [
    invoiceHistory,
    draftInvoicePadding,
    draftInvoicePrefix,
    draftInvoiceStartNumber,
    draftResetYearly,
    draftInvoiceResetMonthDay,
  ])

  const duplicateCycleWarning = useMemo(() => {
    return getFirstRepeatedInvoiceNumberWarning(invoiceHistory, {
      prefix: draftInvoicePrefix,
      padding: draftInvoicePadding,
      startNumber: Math.max(1, Number.isFinite(draftInvoiceStartNumber) ? draftInvoiceStartNumber : 1),
      resetYearly: draftResetYearly,
      resetMonthDay: draftInvoiceResetMonthDay,
    })
  }, [
    draftInvoicePadding,
    draftInvoicePrefix,
    draftInvoiceResetMonthDay,
    draftInvoiceStartNumber,
    draftResetYearly,
    invoiceHistory,
  ])

  const invoicePrefixError = getInvoicePrefixError(draftInvoicePrefix)

  const invoicePreviewSeries = useMemo(() => {
    return buildInvoiceNumberPreviewSeries(
      invoiceHistory,
      {
        prefix: draftInvoicePrefix,
        padding: draftInvoicePadding,
        startNumber: Math.max(1, Number.isFinite(draftInvoiceStartNumber) ? draftInvoiceStartNumber : 1),
        resetYearly: draftResetYearly,
        resetMonthDay: draftInvoiceResetMonthDay,
      },
      3
    )
  }, [
    draftInvoicePadding,
    draftInvoicePrefix,
    draftInvoiceResetMonthDay,
    draftInvoiceStartNumber,
    draftResetYearly,
    invoiceHistory,
  ])

  const numberingScopeNotice =
    invoiceHistory.length > 0 &&
    (draftInvoicePrefix !== invoicePrefix ||
      draftResetYearly !== resetYearly ||
      draftInvoiceResetMonthDay !== invoiceResetMonthDay)
      ? "These changes affect future invoices only. Existing invoice numbers stay unchanged."
      : ""

  if (!draftProfile.businessName || !draftProfile.email) {
    router.push("/setup/profile")
    return null
  }

  const selectStyle = "app-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition"

  async function finishSetup() {
    if (finishing) return
    if (invoicePrefixError) {
      setPrefixErrorMessage(invoicePrefixError)
      showAlert({
        tone: "danger",
        title: "Invalid invoice prefix",
        actionHint: "Use only supported characters, then try finishing setup again.",
        message: invoicePrefixError,
      })
      return
    }

    setFinishing(true)
    setPrefixErrorMessage("")
    updateDateFormat(draftDateFormat)
    updateAmountFormat(draftAmountFormat)
    updateShowDecimals(draftShowDecimals)
    updateInvoicePrefix(draftInvoicePrefix)
    updateInvoicePadding(draftInvoicePadding)
    updateInvoiceStartNumber(Math.max(1, draftInvoiceStartNumber || 1))
    updateResetYearly(draftResetYearly)
    updateInvoiceResetMonthDay(draftInvoiceResetMonthDay)
    updateCurrencySymbol(draftCurrencySymbol)
    updateCurrencyPosition(draftCurrencyPosition)

    setActiveOrGlobalItem("businessProfile", JSON.stringify(draftProfile))
    setBusiness(draftProfile)
    await flushCloudKeyNow("businessProfile").catch(() => {})
    router.push("/setup/profile/finalizing")
  }

  return (
    <main className="app-shell relative min-h-screen overflow-hidden px-4 py-8 lg:px-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:88px_88px] [mask-image:radial-gradient(ellipse_at_center,black_42%,transparent_78%)]" />
      <div className="absolute left-[-12%] top-[14%] h-72 w-72 rounded-full bg-[rgba(208,174,138,0.14)] blur-3xl" />
      <div className="absolute right-[-12%] top-[4%] h-64 w-64 rounded-full bg-[rgba(165,196,193,0.12)] blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1120px]">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <EasyBillLogoMark size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">easyBILL setup</p>
              <p className="text-sm font-semibold text-slate-950">Step 6 - Invoice defaults</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-xs font-semibold text-slate-600 sm:block">
              6<span className="text-slate-400">/</span>6
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-[rgba(83,93,105,0.14)]">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-[var(--accent-soft)] via-[var(--accent-strong)] to-[rgba(165,196,193,0.95)]" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5">
          <div className="app-dark-card overflow-hidden rounded-[30px] px-4 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Preview</p>
                <p className="mt-3 text-3xl font-semibold">{invoicePreview}</p>
                <p className="mt-2 text-sm text-white/70">Set the defaults your workspace should start with.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {invoicePreviewSeries.map((value) => (
                    <span
                      key={value}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80"
                    >
                      {value}
                    </span>
                  ))}
                </div>
                {numberingScopeNotice ? <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100">{numberingScopeNotice}</p> : null}
                {duplicateCycleWarning ? <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-200">{duplicateCycleWarning}</p> : null}
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                Applies to <span className="font-semibold text-white">new</span> invoices.
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <section className="overflow-hidden rounded-[30px] border border-[rgba(83,93,105,0.12)] bg-[rgba(255,252,247,0.97)] shadow-[0_24px_60px_rgba(73,45,21,0.08)]">
          <div className="border-b border-[rgba(83,93,105,0.11)] px-4 py-5 sm:px-7 sm:py-6">
            <p className="app-kicker text-[11px]">Invoice numbering</p>
            <p className="mt-2 text-[15px] leading-7 text-slate-700 sm:text-[1.05rem]">Choose how invoice numbers should begin.</p>
          </div>

          <div className="grid gap-5 px-4 py-6 sm:px-7 sm:py-7 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Invoice Prefix</p>
              <input
                value={draftInvoicePrefix}
                onChange={(e) => {
                  setDraftInvoicePrefix(e.target.value)
                  setPrefixErrorMessage("")
                }}
                className={`${selectStyle} ${invoicePrefixError ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""}`}
              />
              {invoicePrefixError ? (
                <p className="mt-2 text-xs leading-5 text-rose-600">{prefixErrorMessage || invoicePrefixError}</p>
              ) : (
                <p className="mt-2 text-xs leading-5 text-slate-500">Examples: INV-, DOC_, BILL(2026)-</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Number Format</p>
              <SelectMenu
                value={String(draftInvoicePadding)}
                onChange={(v) => setDraftInvoicePadding(Number(v))}
                options={[
                  { value: "2", label: "01 (2 digits)" },
                  { value: "3", label: "001 (3 digits)" },
                  { value: "4", label: "0001 (4 digits)" },
                  { value: "5", label: "00001 (5 digits)" },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Starting Number</p>
              <input
                type="number"
                min={1}
                value={draftInvoiceStartNumber}
                onChange={(e) => setDraftInvoiceStartNumber(Number(e.target.value))}
                className={selectStyle}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Yearly Reset</p>
              <SelectMenu
                value={draftResetYearly ? "yes" : "no"}
                onChange={(v) => setDraftResetYearly(v === "yes")}
                options={[
                  { value: "yes", label: "Reset Every Financial Year" },
                  { value: "no", label: "Continuous Numbering" },
                ]}
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">Reset is common if you want neat yearly sequences.</p>
            </div>

            {draftResetYearly ? (
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium text-slate-900">Reset Date</p>
                <SelectMenu value={draftInvoiceResetMonthDay} onChange={setDraftInvoiceResetMonthDay} options={RESET_MONTH_DAY_OPTIONS} />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Reset is based on invoice date. Invoices dated on or after the 1st of {formatResetMonthLabel(draftInvoiceResetMonthDay)} restart from your starting number, while earlier invoices remain in the previous cycle.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-[30px] border border-[rgba(83,93,105,0.12)] bg-[rgba(255,252,247,0.97)] shadow-[0_24px_60px_rgba(73,45,21,0.08)]">
          <div className="border-b border-[rgba(83,93,105,0.11)] px-4 py-5 sm:px-7 sm:py-6">
            <p className="app-kicker text-[11px]">Display preferences</p>
            <p className="mt-2 text-[15px] leading-7 text-slate-700 sm:text-[1.05rem]">Set how dates and amounts should appear.</p>
          </div>

          <div className="grid gap-5 px-4 py-6 sm:px-7 sm:py-7 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Date Format</p>
              <SelectMenu
                value={draftDateFormat}
                onChange={setDraftDateFormat}
                options={[
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "MM-DD-YYYY", label: "MM-DD-YYYY" },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Amount Format</p>
              <SelectMenu
                value={draftAmountFormat}
                onChange={setDraftAmountFormat}
                options={[
                  { value: "indian", label: "Indian (1,23,456)" },
                  { value: "international", label: "International (123,456)" },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Decimal Setting</p>
              <SelectMenu
                value={draftShowDecimals ? "yes" : "no"}
                onChange={(v) => setDraftShowDecimals(v === "yes")}
                options={[
                  { value: "yes", label: "Show Decimals" },
                  { value: "no", label: "Round Off" },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Currency Symbol</p>
              <SelectMenu
                value={draftCurrencySymbol}
                onChange={setDraftCurrencySymbol}
                options={[
                  { value: "₹", label: "₹ Indian Rupee" },
                  { value: "$", label: "$ US Dollar" },
                  { value: "EUR", label: "EUR Euro" },
                  { value: "GBP", label: "GBP Pound" },
                ]}
              />
            </div>

            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-900">Currency Position</p>
              <SelectMenu
                value={draftCurrencyPosition}
                onChange={(v) => setDraftCurrencyPosition(v as "before" | "after")}
                options={[
                  { value: "before", label: "₹ 1,250" },
                  { value: "after", label: "1,250 ₹" },
                ]}
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">Choose what feels most natural to your customers.</p>
            </div>
          </div>
        </section>
          </div>
        </div>

      <div className="app-sticky-bar mt-6 flex flex-col-reverse gap-3 px-4 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
        <button
          type="button"
          onClick={() => router.push("/setup/profile/logo")}
          className="app-secondary-button w-full rounded-2xl px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white sm:w-auto"
        >
          Back
        </button>

        <button
          type="button"
          onClick={finishSetup}
          disabled={finishing}
          className={`w-full rounded-2xl px-6 py-3 text-sm font-semibold text-white transition sm:w-auto ${
            finishing ? "cursor-not-allowed bg-slate-400" : "app-primary-button"
          }`}
        >
          {finishing ? "Finishing..." : "Finish Setup"}
        </button>
      </div>
      </div>
    </main>
  )
}
