"use client"

import { createContext, useContext, useEffect, useMemo } from "react"
import { getAuthMode } from "@/lib/runtimeMode"
import { getActiveUserId } from "@/lib/auth"
import { useWorkspaceValue } from "@/lib/useWorkspaceValue"
import {
  DEFAULT_INVOICE_VISIBILITY,
  type InvoiceVisibilitySettings,
} from "@/lib/invoiceVisibilityShared"
import { normalizeResetMonthDay } from "@/lib/invoiceResetDate"
import { defaultSettings, workspaceDomain } from "@/lib/workspaceDomain"

export type { InvoiceVisibilitySettings }
export { DEFAULT_INVOICE_VISIBILITY }

type SettingsContextType = {
  dateFormat: string
  updateDateFormat: (format: string) => Promise<void>
  amountFormat: string
  updateAmountFormat: (format: string) => Promise<void>
  showDecimals: boolean
  updateShowDecimals: (value: boolean) => Promise<void>
  invoicePrefix: string
  updateInvoicePrefix: (value: string) => Promise<void>
  invoicePadding: number
  updateInvoicePadding: (value: number) => Promise<void>
  invoiceStartNumber: number
  updateInvoiceStartNumber: (value: number) => Promise<void>
  resetYearly: boolean
  updateResetYearly: (value: boolean) => Promise<void>
  invoiceResetMonthDay: string
  updateInvoiceResetMonthDay: (value: string) => Promise<void>
  currencySymbol: string
  updateCurrencySymbol: (value: string) => Promise<void>
  currencyPosition: "before" | "after"
  updateCurrencyPosition: (value: "before" | "after") => Promise<void>
  invoiceVisibility: InvoiceVisibilitySettings
  updateInvoiceVisibility: (next: InvoiceVisibilitySettings) => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

function readSettingsFromStorage() {
  return workspaceDomain.getSettings()
}

function writeMissingDefaults() {
  if (typeof window === "undefined") return
  workspaceDomain.writeMissingSettingsDefaults(defaultSettings)
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
    const canWriteWorkspaceDefaults = getAuthMode() !== "supabase" || Boolean(getActiveUserId())
    if (canWriteWorkspaceDefaults) writeMissingDefaults()
  }, [])

  const value = useMemo<SettingsContextType>(
    () => ({
      ...settings,
      updateDateFormat(format: string) {
        return workspaceDomain.saveSettingsPatch("dateFormat", format)
      },
      updateAmountFormat(format: string) {
        return workspaceDomain.saveSettingsPatch("amountFormat", format)
      },
      updateShowDecimals(next: boolean) {
        return workspaceDomain.saveSettingsPatch("showDecimals", String(next))
      },
      updateInvoicePrefix(next: string) {
        return workspaceDomain.saveSettingsPatch("invoicePrefix", next)
      },
      updateInvoicePadding(next: number) {
        return workspaceDomain.saveSettingsPatch("invoicePadding", String(next))
      },
      updateInvoiceStartNumber(next: number) {
        return workspaceDomain.saveSettingsPatch("invoiceStartNumber", String(next))
      },
      updateResetYearly(next: boolean) {
        return workspaceDomain.saveSettingsPatch("resetYearly", String(next))
      },
      updateInvoiceResetMonthDay(next: string) {
        return workspaceDomain.saveSettingsPatch("invoiceResetMonthDay", normalizeResetMonthDay(next))
      },
      updateCurrencySymbol(next: string) {
        return workspaceDomain.saveSettingsPatch("currencySymbol", next)
      },
      updateCurrencyPosition(next: "before" | "after") {
        return workspaceDomain.saveSettingsPatch("currencyPosition", next)
      },
      updateInvoiceVisibility(next: InvoiceVisibilitySettings) {
        return workspaceDomain.saveSettingsPatch("invoiceVisibility", JSON.stringify(next))
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
