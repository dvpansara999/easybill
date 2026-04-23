import { normalizeBusinessProfile, type BusinessProfileRecord } from "@/lib/businessProfile"
import { normalizeInvoiceStorePayload, readStoredInvoices, serializeInvoiceStore, type InvoiceRecord } from "@/lib/invoice"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/lib/invoiceVisibilityShared"
import { DEFAULT_RESET_MONTH_DAY, normalizeResetMonthDay } from "@/lib/invoiceResetDate"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"

export type AppBackupPayload = {
  version: 1 | 2
  exportedAt: string
  data: {
    businessProfile: BusinessProfileRecord
    invoices: InvoiceRecord[]
    products: unknown[]
    customers: unknown[]
    settings: {
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
      invoiceTemplate: string
      templateTypography: string
      templateFontId?: string
      templateFontSize?: number
    }
  }
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function buildAppBackupPayload(): AppBackupPayload {
  const visibilityRaw = getActiveOrGlobalItem("invoiceVisibility")
  const visibilityParsed = safeParse<Partial<InvoiceVisibilitySettings>>(visibilityRaw, {})

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      businessProfile: normalizeBusinessProfile(safeParse(getActiveOrGlobalItem("businessProfile"), {})),
      invoices: readStoredInvoices(),
      products: safeParse<unknown[]>(getActiveOrGlobalItem("products"), []),
      customers: safeParse<unknown[]>(getActiveOrGlobalItem("customers"), []),
      settings: {
        dateFormat: getActiveOrGlobalItem("dateFormat") || "YYYY-MM-DD",
        amountFormat: getActiveOrGlobalItem("amountFormat") || "indian",
        showDecimals: (getActiveOrGlobalItem("showDecimals") || "true") === "true",
        invoicePrefix: getActiveOrGlobalItem("invoicePrefix") || "INV-",
        invoicePadding: Number(getActiveOrGlobalItem("invoicePadding") || 4),
        invoiceStartNumber: Number(getActiveOrGlobalItem("invoiceStartNumber") || 1),
        resetYearly: (getActiveOrGlobalItem("resetYearly") || "true") === "true",
        invoiceResetMonthDay: normalizeResetMonthDay(getActiveOrGlobalItem("invoiceResetMonthDay") || DEFAULT_RESET_MONTH_DAY),
        currencySymbol: getActiveOrGlobalItem("currencySymbol") || "₹",
        currencyPosition: getActiveOrGlobalItem("currencyPosition") === "after" ? "after" : "before",
        invoiceVisibility: { ...DEFAULT_INVOICE_VISIBILITY, ...visibilityParsed },
        invoiceTemplate: getActiveOrGlobalItem("invoiceTemplate") || "",
        templateTypography: getActiveOrGlobalItem("templateTypography") || "",
        templateFontId: getActiveOrGlobalItem("invoiceTemplateFontId") || "",
        templateFontSize: Number(getActiveOrGlobalItem("invoiceTemplateFontSize") || 10),
      },
    },
  }
}

export function downloadAppBackupJson() {
  const payload = buildAppBackupPayload()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `easybill-backup-${payload.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function importAppBackupJson(file: File) {
  const raw = await file.text()
  const parsed = JSON.parse(raw) as Partial<AppBackupPayload>
  if (!parsed || (parsed.version !== 1 && parsed.version !== 2) || !parsed.data) {
    throw new Error("This backup file is not valid for easyBILL import.")
  }

  const normalizedInvoices = normalizeInvoiceStorePayload(parsed.data.invoices || []).store.invoices
  const normalizedBusiness = normalizeBusinessProfile(parsed.data.businessProfile || {})
  const settings = parsed.data.settings || {}
  const visibility = {
    ...DEFAULT_INVOICE_VISIBILITY,
    ...(typeof settings.invoiceVisibility === "object" && settings.invoiceVisibility ? settings.invoiceVisibility : {}),
  }

  setActiveOrGlobalItem("businessProfile", JSON.stringify(normalizedBusiness))
  setActiveOrGlobalItem("invoices", serializeInvoiceStore(normalizedInvoices))
  setActiveOrGlobalItem("products", JSON.stringify(Array.isArray(parsed.data.products) ? parsed.data.products : []))
  setActiveOrGlobalItem("customers", JSON.stringify(Array.isArray(parsed.data.customers) ? parsed.data.customers : []))
  setActiveOrGlobalItem("dateFormat", String(settings.dateFormat || "YYYY-MM-DD"))
  setActiveOrGlobalItem("amountFormat", String(settings.amountFormat || "indian"))
  setActiveOrGlobalItem("showDecimals", String(Boolean(settings.showDecimals ?? true)))
  setActiveOrGlobalItem("invoicePrefix", String(settings.invoicePrefix || "INV-"))
  setActiveOrGlobalItem("invoicePadding", String(Number(settings.invoicePadding || 4)))
  setActiveOrGlobalItem("invoiceStartNumber", String(Number(settings.invoiceStartNumber || 1)))
  setActiveOrGlobalItem("resetYearly", String(Boolean(settings.resetYearly ?? true)))
  setActiveOrGlobalItem("invoiceResetMonthDay", normalizeResetMonthDay(String(settings.invoiceResetMonthDay || DEFAULT_RESET_MONTH_DAY)))
  setActiveOrGlobalItem("currencySymbol", String(settings.currencySymbol || "₹"))
  setActiveOrGlobalItem("currencyPosition", settings.currencyPosition === "after" ? "after" : "before")
  setActiveOrGlobalItem("invoiceVisibility", JSON.stringify(visibility))
  setActiveOrGlobalItem("invoiceTemplate", String(settings.invoiceTemplate || ""))
  setActiveOrGlobalItem("templateTypography", String(settings.templateTypography || ""))
  setActiveOrGlobalItem("invoiceTemplateFontId", String(settings.templateFontId || ""))
  setActiveOrGlobalItem("invoiceTemplateFontSize", String(Number(settings.templateFontSize || 10)))

  window.dispatchEvent(new CustomEvent("easybill:cloud-sync"))

  return {
    invoiceCount: normalizedInvoices.length,
  }
}
