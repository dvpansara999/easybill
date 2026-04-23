"use client"

import { createContext, useContext, useEffect, useMemo } from "react"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import { getAuthMode } from "@/lib/runtimeMode"
import { getActiveUserId } from "@/lib/auth"
import { useWorkspaceValue } from "@/lib/useWorkspaceValue"
import {
  DEFAULT_INVOICE_VISIBILITY,
  type InvoiceVisibilitySettings,
} from "@/lib/invoiceVisibilityShared"
import { DEFAULT_RESET_MONTH_DAY, normalizeResetMonthDay } from "@/lib/invoiceResetDate"

export type { InvoiceVisibilitySettings }
export { DEFAULT_INVOICE_VISIBILITY }

type SettingsContextType = {
  dateFormat: string
  updateDateFormat: (format: string) => void
  amountFormat: string
  updateAmountFormat: (format: string) => void
  showDecimals: boolean
  updateShowDecimals: (value: boolean) => void
  invoicePrefix: string
  updateInvoicePrefix: (value: string) => void
  invoicePadding: number
  updateInvoicePadding: (value: number) => void
  invoiceStartNumber: number
  updateInvoiceStartNumber: (value: number) => void
  resetYearly: boolean
  updateResetYearly: (value: boolean) => void
  invoiceResetMonthDay: string
  updateInvoiceResetMonthDay: (value: string) => void
  currencySymbol: string
  updateCurrencySymbol: (value: string) => void
  currencyPosition: "before" | "after"
  updateCurrencyPosition: (value: "before" | "after") => void
  invoiceVisibility: InvoiceVisibilitySettings
  updateInvoiceVisibility: (next: InvoiceVisibilitySettings) => void
}

type SettingsSnapshot = {
  dateFormat: string
  amountFormat: string
  showDecimals: boolean
  invoicePrefix: string
  invoicePadding: number
  invoiceStartNumber: number
  resetYearly: boolean
  invoiceResetMonthDay: string
  currencySymbol: string
  currencyPosition: "before" | "after"
  invoiceVisibility: InvoiceVisibilitySettings
}

const defaultSettings: SettingsSnapshot = {
  dateFormat: "YYYY-MM-DD",
  amountFormat: "indian",
  showDecimals: true,
  invoicePrefix: "INV-",
  invoicePadding: 4,
  invoiceStartNumber: 1,
  resetYearly: true,
  invoiceResetMonthDay: DEFAULT_RESET_MONTH_DAY,
  currencySymbol: "₹",
  currencyPosition: "before",
  invoiceVisibility: DEFAULT_INVOICE_VISIBILITY,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

function readSettingsFromStorage() {
  if (typeof window === "undefined") return defaultSettings

  const savedDate = getActiveOrGlobalItem("dateFormat")
  const savedAmount = getActiveOrGlobalItem("amountFormat")
  const savedDecimals = getActiveOrGlobalItem("showDecimals")
  const savedPrefix = getActiveOrGlobalItem("invoicePrefix")
  const savedPadding = getActiveOrGlobalItem("invoicePadding")
  const savedStart = getActiveOrGlobalItem("invoiceStartNumber")
  const savedReset = getActiveOrGlobalItem("resetYearly")
  const savedResetMonthDay = getActiveOrGlobalItem("invoiceResetMonthDay")
  const savedCurrency = getActiveOrGlobalItem("currencySymbol")
  const savedCurrencyPos = getActiveOrGlobalItem("currencyPosition")
  const savedInvoiceVisibility = getActiveOrGlobalItem("invoiceVisibility")

  let invoiceVisibility = DEFAULT_INVOICE_VISIBILITY
  if (savedInvoiceVisibility) {
    try {
      const parsed = JSON.parse(savedInvoiceVisibility) as Partial<InvoiceVisibilitySettings>
      invoiceVisibility = { ...DEFAULT_INVOICE_VISIBILITY, ...(parsed || {}) }
    } catch {
      invoiceVisibility = DEFAULT_INVOICE_VISIBILITY
    }
  }

  return {
    dateFormat: savedDate || defaultSettings.dateFormat,
    amountFormat: savedAmount || defaultSettings.amountFormat,
    showDecimals: savedDecimals ? savedDecimals === "true" : defaultSettings.showDecimals,
    invoicePrefix: savedPrefix || defaultSettings.invoicePrefix,
    invoicePadding: savedPadding ? Number(savedPadding) : defaultSettings.invoicePadding,
    invoiceStartNumber: savedStart ? Number(savedStart) : defaultSettings.invoiceStartNumber,
    resetYearly: savedReset ? savedReset === "true" : defaultSettings.resetYearly,
    invoiceResetMonthDay: normalizeResetMonthDay(savedResetMonthDay),
    currencySymbol: savedCurrency || defaultSettings.currencySymbol,
    currencyPosition: savedCurrencyPos === "after" ? "after" : defaultSettings.currencyPosition,
    invoiceVisibility,
  } satisfies SettingsSnapshot
}

function writeMissingDefaults(snapshot: SettingsSnapshot) {
  if (typeof window === "undefined") return

  const entries: Array<[string, string]> = [
    ["dateFormat", snapshot.dateFormat],
    ["amountFormat", snapshot.amountFormat],
    ["showDecimals", String(snapshot.showDecimals)],
    ["invoicePrefix", snapshot.invoicePrefix],
    ["invoicePadding", String(snapshot.invoicePadding)],
    ["invoiceStartNumber", String(snapshot.invoiceStartNumber)],
    ["resetYearly", String(snapshot.resetYearly)],
    ["invoiceResetMonthDay", snapshot.invoiceResetMonthDay],
    ["currencySymbol", snapshot.currencySymbol],
    ["currencyPosition", snapshot.currencyPosition],
    ["invoiceVisibility", JSON.stringify(snapshot.invoiceVisibility)],
  ]

  for (const [key, value] of entries) {
    if (getActiveOrGlobalItem(key) == null) {
      setActiveOrGlobalItem(key, value)
    }
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settings = useWorkspaceValue(
    [
      "dateFormat",
      "amountFormat",
      "showDecimals",
      "invoicePrefix",
      "invoicePadding",
      "invoiceStartNumber",
      "resetYearly",
      "invoiceResetMonthDay",
      "currencySymbol",
      "currencyPosition",
      "invoiceVisibility",
    ],
    readSettingsFromStorage
  )

  useEffect(() => {
    const supabaseNeedsHydration = getAuthMode() === "supabase" && Boolean(getActiveUserId())
    if (!supabaseNeedsHydration) {
      writeMissingDefaults(settings)
    }
  }, [settings])

  const value = useMemo<SettingsContextType>(
    () => ({
      ...settings,
      updateDateFormat(format: string) {
        setActiveOrGlobalItem("dateFormat", format)
      },
      updateAmountFormat(format: string) {
        setActiveOrGlobalItem("amountFormat", format)
      },
      updateShowDecimals(next: boolean) {
        setActiveOrGlobalItem("showDecimals", String(next))
      },
      updateInvoicePrefix(next: string) {
        setActiveOrGlobalItem("invoicePrefix", next)
      },
      updateInvoicePadding(next: number) {
        setActiveOrGlobalItem("invoicePadding", String(next))
      },
      updateInvoiceStartNumber(next: number) {
        setActiveOrGlobalItem("invoiceStartNumber", String(next))
      },
      updateResetYearly(next: boolean) {
        setActiveOrGlobalItem("resetYearly", String(next))
      },
      updateInvoiceResetMonthDay(next: string) {
        setActiveOrGlobalItem("invoiceResetMonthDay", normalizeResetMonthDay(next))
      },
      updateCurrencySymbol(next: string) {
        setActiveOrGlobalItem("currencySymbol", next)
      },
      updateCurrencyPosition(next: "before" | "after") {
        setActiveOrGlobalItem("currencyPosition", next)
      },
      updateInvoiceVisibility(next: InvoiceVisibilitySettings) {
        setActiveOrGlobalItem("invoiceVisibility", JSON.stringify(next))
      },
    }),
    [settings]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)

  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider")
  }

  return context
}
