"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import SetupWizardFrame from "@/components/setup/SetupWizardFrame"
import { useBusiness } from "@/context/BusinessContext"
import { useSettings } from "@/context/SettingsContext"
import { getSetupProfileDraft } from "@/lib/setupProfileDraft"
import { buildInvoiceNumberPreviewSeries, generateInvoiceNumber, getFirstRepeatedInvoiceNumberWarning } from "@/lib/invoiceNumber"
import { getInvoicePrefixError } from "@/lib/invoicePrefixValidation"
import { formatResetMonthLabel, RESET_MONTH_DAY_OPTIONS } from "@/lib/invoiceResetDate"
import { flushCloudKeyNow, setActiveOrGlobalItem } from "@/lib/userStore"
import SelectMenu from "@/components/ui/SelectMenu"
import { useAppAlert } from "@/components/providers/AppAlertProvider"
import { readStoredInvoices } from "@/lib/invoice"

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
  const [invoiceHistory] = useState<InvoiceHistoryRecord[]>(() => readStoredInvoices())
  const [draftDateFormat, setDraftDateFormat] = useState(dateFormat)
  const [draftAmountFormat, setDraftAmountFormat] = useState(amountFormat)
  const [draftShowDecimals, setDraftShowDecimals] = useState(showDecimals)
  const [draftInvoicePrefix, setDraftInvoicePrefix] = useState(invoicePrefix)
  const [draftInvoicePadding, setDraftInvoicePadding] = useState(invoicePadding)
  const [draftInvoiceStartNumber, setDraftInvoiceStartNumber] = useState(invoiceStartNumber)
  const [draftResetYearly, setDraftResetYearly] = useState(resetYearly)
  const [draftInvoiceResetMonthDay, setDraftInvoiceResetMonthDay] = useState(invoiceResetMonthDay)
  const [draftCurrencySymbol, setDraftCurrencySymbol] = useState(currencySymbol)
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
  }, [invoiceHistory, draftInvoicePadding, draftInvoicePrefix, draftInvoiceStartNumber, draftResetYearly, draftInvoiceResetMonthDay])
  const duplicateCycleWarning = useMemo(() => {
    return getFirstRepeatedInvoiceNumberWarning(
      invoiceHistory,
      {
        prefix: draftInvoicePrefix,
        padding: draftInvoicePadding,
        startNumber: Math.max(1, Number.isFinite(draftInvoiceStartNumber) ? draftInvoiceStartNumber : 1),
        resetYearly: draftResetYearly,
        resetMonthDay: draftInvoiceResetMonthDay,
      }
    )
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
 
  const selectStyle =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"

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
    // Route to a finalizing step that blocks until cloud sync is completed.
    router.push("/setup/profile/finalizing")
  }

  return (
    <SetupWizardFrame
      step={6}
      totalSteps={6}
      title="Set invoice defaults, then launch."
      description="These are your starting preferences for numbering, currency, dates, and decimals. You can edit them later."
      bullets={[
        "Invoice preview updates live.",
        "These defaults apply to new invoices.",
        "Finish to open your dashboard.",
      ]}
      onBack={() => router.push("/setup/profile/logo")}
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <div className="lg:col-span-2 overflow-hidden rounded-[34px] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 px-4 py-5 sm:px-7 sm:py-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Next invoice</p>
              <p className="mt-3 text-3xl font-semibold">{invoicePreview}</p>
              <p className="mt-2 text-sm text-white/70">This is how the next generated invoice number will look.</p>
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
              {numberingScopeNotice ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100">{numberingScopeNotice}</p>
              ) : null}
              {duplicateCycleWarning ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-200">{duplicateCycleWarning}</p>
              ) : null}
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
              These defaults apply to{" "}
              <span className="font-semibold text-white">new</span> invoices.
            </div>
          </div>
        </div>

        <section className="flex h-full flex-col overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-7 sm:py-6">
            <p className="text-sm font-semibold text-slate-900">Invoice numbering</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Set how invoice numbers look and where they start.</p>
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
                <p className="mt-2 text-xs leading-5 text-rose-600">
                  {prefixErrorMessage || invoicePrefixError}
                </p>
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
                <SelectMenu
                  value={draftInvoiceResetMonthDay}
                  onChange={setDraftInvoiceResetMonthDay}
                  options={RESET_MONTH_DAY_OPTIONS}
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Reset is based on invoice date. Invoices dated on or after the 1st of {formatResetMonthLabel(draftInvoiceResetMonthDay)} restart from your starting number, while earlier invoices remain in the previous cycle.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="flex h-full flex-col overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-7 sm:py-6">
            <p className="text-sm font-semibold text-slate-900">Display preferences</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Control how dates and amounts appear throughout the app.</p>
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
              <p className="mt-2 text-xs leading-5 text-slate-500">Choose what looks most natural to your customers.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 rounded-[34px] border border-slate-200 bg-slate-50/70 px-4 py-5 sm:px-7 sm:py-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => router.push("/setup/profile/logo")}
          className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
        >
          Back
        </button>
        <button
          onClick={finishSetup}
          disabled={finishing}
          className={`w-full sm:w-auto rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 ${
            finishing ? "cursor-not-allowed bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
          }`}
        >
          {finishing ? "Finishing..." : "Finish Setup"}
        </button>
      </div>
    </SetupWizardFrame>
  )
}
