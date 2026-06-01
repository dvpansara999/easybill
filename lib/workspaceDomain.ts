"use client"

import {
  EMPTY_BUSINESS_PROFILE,
  normalizeBusinessProfile,
  type BusinessProfileRecord,
} from "@/lib/businessProfile"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/lib/invoiceVisibilityShared"
import { DEFAULT_RESET_MONTH_DAY, normalizeResetMonthDay } from "@/lib/invoiceResetDate"
import { getWorkspaceDataAccess } from "@/lib/workspaceRuntime"
import { getActiveOrGlobalItem } from "@/lib/userStore"
import type { KvKey } from "@/lib/supabase/userKvSync"

export type SettingsSnapshot = {
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

export const defaultSettings: SettingsSnapshot = {
  dateFormat: "YYYY-MM-DD",
  amountFormat: "indian",
  showDecimals: true,
  invoicePrefix: "INV-",
  invoicePadding: 4,
  invoiceStartNumber: 1,
  resetYearly: true,
  invoiceResetMonthDay: DEFAULT_RESET_MONTH_DAY,
  currencySymbol: "\u20B9",
  currencyPosition: "before",
  invoiceVisibility: DEFAULT_INVOICE_VISIBILITY,
}

function readJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const workspaceDomain = {
  getBusinessProfile(): BusinessProfileRecord {
    if (typeof window === "undefined") return EMPTY_BUSINESS_PROFILE
    return normalizeBusinessProfile(readJson(getActiveOrGlobalItem("businessProfile"), EMPTY_BUSINESS_PROFILE))
  },
  async saveBusinessProfile(profile: BusinessProfileRecord) {
    const normalized = normalizeBusinessProfile(profile)
    await getWorkspaceDataAccess().saveProfile(JSON.stringify(normalized))
    return normalized
  },
  getSettings(): SettingsSnapshot {
    if (typeof window === "undefined") return defaultSettings

    const savedVisibility = readJson<Partial<InvoiceVisibilitySettings>>(
      getActiveOrGlobalItem("invoiceVisibility"),
      {}
    )

    return {
      dateFormat: getActiveOrGlobalItem("dateFormat") || defaultSettings.dateFormat,
      amountFormat: getActiveOrGlobalItem("amountFormat") || defaultSettings.amountFormat,
      showDecimals: (getActiveOrGlobalItem("showDecimals") || String(defaultSettings.showDecimals)) === "true",
      invoicePrefix: getActiveOrGlobalItem("invoicePrefix") || defaultSettings.invoicePrefix,
      invoicePadding: Number(getActiveOrGlobalItem("invoicePadding") || defaultSettings.invoicePadding),
      invoiceStartNumber: Number(getActiveOrGlobalItem("invoiceStartNumber") || defaultSettings.invoiceStartNumber),
      resetYearly: (getActiveOrGlobalItem("resetYearly") || String(defaultSettings.resetYearly)) === "true",
      invoiceResetMonthDay: normalizeResetMonthDay(getActiveOrGlobalItem("invoiceResetMonthDay")),
      currencySymbol: getActiveOrGlobalItem("currencySymbol") || defaultSettings.currencySymbol,
      currencyPosition: getActiveOrGlobalItem("currencyPosition") === "after" ? "after" : "before",
      invoiceVisibility: { ...DEFAULT_INVOICE_VISIBILITY, ...(savedVisibility || {}) },
    }
  },
  async saveSettingsPatch(key: KvKey, value: string) {
    await getWorkspaceDataAccess().saveSettingsPatch(key, value)
  },
  async saveSettingsPatches(entries: Array<[KvKey, string]>) {
    for (const [key, value] of entries) {
      await this.saveSettingsPatch(key, value)
    }
  },
  async saveProducts(products: unknown[]) {
    await getWorkspaceDataAccess().saveProduct(JSON.stringify(products))
    return products
  },
  async saveCustomers(customers: unknown[]) {
    await getWorkspaceDataAccess().saveCustomer(JSON.stringify(customers))
    return customers
  },
  writeMissingSettingsDefaults(snapshot: SettingsSnapshot) {
    const entries: Array<[KvKey, string]> = [
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
        this.saveSettingsPatch(key, value)
      }
    }
  },
}
