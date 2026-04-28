"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings, useSettings } from "@/context/SettingsContext"

type ToggleDef = {
  key: keyof InvoiceVisibilitySettings
  label: string
  description: string
}

const BUSINESS_TOGGLES: ToggleDef[] = [
  { key: "businessLogo", label: "Logo", description: "Show your business logo in the invoice header." },
  { key: "businessName", label: "Business name", description: "Show your business name in the header." },
  { key: "businessAddress", label: "Address", description: "Show your business address." },
  { key: "businessPhone", label: "Phone number", description: "Show your business phone number." },
  { key: "businessGstin", label: "GSTIN", description: "Show your business GSTIN (tax ID)." },
  { key: "businessBankDetails", label: "Bank details", description: "Show bank details section in the footer." },
  { key: "businessTerms", label: "Terms", description: "Show the terms section in the footer." },
]

const CLIENT_TOGGLES: ToggleDef[] = [
  { key: "clientName", label: "Client name", description: "Show the client name in the Bill To section." },
  { key: "clientAddress", label: "Client address", description: "Show the client address." },
  { key: "clientPhone", label: "Client phone number", description: "Show the client phone number." },
  { key: "clientGstin", label: "Client GSTIN", description: "Show the client GSTIN (tax ID)." },
]

function normalizeVisibility(input: InvoiceVisibilitySettings) {
  return { ...DEFAULT_INVOICE_VISIBILITY, ...input }
}

function ToggleCard({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean
  label: string
  description: string
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`group rounded-[22px] border p-4 text-left transition ${
        checked
          ? "border-emerald-200 bg-emerald-50/60"
          : "app-subtle-panel hover:border-slate-300 hover:bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <span
          aria-hidden
          className={`mt-0.5 inline-flex h-6 w-11 items-center rounded-full p-1 transition ${
            checked ? "bg-emerald-600" : "bg-slate-200 group-hover:bg-slate-300"
          }`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-5" : "translate-x-0"}`}
          />
        </span>
      </div>
    </button>
  )
}

export default function InvoiceVisibilityClient() {
  const router = useRouter()
  const { invoiceVisibility, updateInvoiceVisibility } = useSettings()
  const [draft, setDraft] = useState<InvoiceVisibilitySettings>(() => normalizeVisibility(invoiceVisibility))
  const [message, setMessage] = useState("")

  const hasChanges = useMemo(() => JSON.stringify(draft) !== JSON.stringify(invoiceVisibility), [draft, invoiceVisibility])

  function setToggle(key: keyof InvoiceVisibilitySettings, value: boolean) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function apply() {
    updateInvoiceVisibility(normalizeVisibility(draft))
    setMessage("Applied to all invoices.")
    window.setTimeout(() => setMessage(""), 1800)
  }

  function resetAllOn() {
    setDraft(DEFAULT_INVOICE_VISIBILITY)
  }

  return (
    <div className="space-y-6 pb-24 lg:space-y-8 lg:pb-0">
      <section>
        <p className="app-kicker">Settings</p>
        <h1 className="app-page-title mt-3 text-3xl sm:text-4xl">Invoice visibility</h1>
        <p className="app-page-copy mt-3 max-w-2xl text-sm">
          Choose what information appears on your invoices. This applies everywhere: templates, invoice view, print, and PDF
          downloads.
        </p>
      </section>

      <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title text-2xl">Business information</h2>
            <p className="mt-1 text-sm text-slate-500">Controls what your business section shows.</p>
          </div>
          <button
            type="button"
            onClick={resetAllOn}
            className="app-secondary-button rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white sm:px-5"
          >
            Reset all ON
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {BUSINESS_TOGGLES.map((t) => (
            <ToggleCard
              key={t.key}
              checked={draft[t.key]}
              label={t.label}
              description={t.description}
              onChange={(next) => setToggle(t.key, next)}
            />
          ))}
        </div>
      </div>

      <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
        <div>
          <h2 className="section-title text-2xl">Client information</h2>
          <p className="mt-1 text-sm text-slate-500">Controls what the Bill To section shows.</p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {CLIENT_TOGGLES.map((t) => (
            <ToggleCard
              key={t.key}
              checked={draft[t.key]}
              label={t.label}
              description={t.description}
              onChange={(next) => setToggle(t.key, next)}
            />
          ))}
        </div>
      </div>

      {message ? <p className="-mt-2 text-sm font-medium text-emerald-700">{message}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push("/dashboard/settings")}
          className="app-secondary-button w-full rounded-2xl px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white sm:w-auto"
        >
          Back to Settings
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={apply}
            disabled={!hasChanges}
            className="app-primary-button w-full rounded-2xl px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
