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
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
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
    <div className="space-y-8">
      <section>
        <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Settings</p>
        <h1 className="font-display mt-3 text-4xl text-slate-950">Invoice visibility</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          Choose what information appears on your invoices. This applies everywhere: templates, invoice view, print, and PDF
          downloads.
        </p>
      </section>

      <div className="soft-card rounded-[28px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title text-2xl">Business information</h2>
            <p className="mt-1 text-sm text-slate-500">Controls what your business section shows.</p>
          </div>
          <button
            type="button"
            onClick={resetAllOn}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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

      <div className="soft-card rounded-[28px] p-6">
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
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Back to Settings
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={apply}
            disabled={!hasChanges}
            className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

