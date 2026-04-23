"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/lib/invoiceVisibilityShared"
import { DEFAULT_RESET_MONTH_DAY, normalizeResetMonthDay } from "@/lib/invoiceResetDate"
import { normalizeBusinessProfile, type BusinessProfileRecord } from "@/lib/businessProfile"
import { extractLogoStoragePath } from "@/lib/logoStorage"
import {
  normalizeInvoiceRecord,
  serializeInvoiceStore,
  type InvoiceHistoryEntry,
  type InvoiceItem,
  type InvoiceRecord,
} from "@/lib/invoice"
import { revealSensitiveFields } from "@/lib/sensitiveData"

export type RelationalProfileRow = {
  user_id: string
  business_name: string | null
  phone: string | null
  email: string | null
  gst: string | null
  address: string | null
  bank_name: string | null
  account_number: string | null
  ifsc: string | null
  upi: string | null
  terms: string | null
  logo_storage_path: string | null
  logo_shape: "square" | "round" | null
  onboarding_completed: boolean | null
  email_change_audit_at?: string | null
}

export type RelationalSettingsRow = {
  user_id: string
  date_format: string | null
  amount_format: string | null
  show_decimals: boolean | null
  invoice_prefix: string | null
  invoice_padding: number | null
  invoice_start_number: number | null
  reset_yearly: boolean | null
  invoice_reset_month_day: string | null
  currency_symbol: string | null
  currency_position: "before" | "after" | null
  invoice_visibility: Partial<InvoiceVisibilitySettings> | null
  invoice_template: string | null
  template_typography: string | null
  template_font_id: string | null
  template_font_size: number | null
  subscription_plan_id: string | null
  invoice_usage_count: number | null
  invoice_usage_initialized: boolean | null
}

export type RelationalProductRow = {
  id?: string
  user_id?: string
  name: string | null
  hsn: string | null
  unit: string | null
  price: number | null
  cgst: number | null
  sgst: number | null
  igst: number | null
  created_at?: string | null
}

export type RelationalCustomerRow = {
  id?: string
  user_id?: string
  identity_key?: string | null
  name: string | null
  phone: string | null
  email: string | null
  gst: string | null
  address: string | null
  created_at?: string | null
}

export type RelationalInvoiceItemRow = {
  id?: string
  invoice_id?: string
  position?: number | null
  product: string | null
  hsn: string | null
  qty: number | null
  unit: string | null
  price: number | null
  cgst: number | null
  sgst: number | null
  igst: number | null
  total: number | null
}

export type RelationalInvoiceHistoryRow = {
  id?: string
  invoice_id?: string
  event_type: InvoiceHistoryEntry["type"] | null
  label: string | null
  happened_at: string | null
}

export type RelationalInvoiceRow = {
  id: string
  user_id?: string
  invoice_number: string
  created_at: string | null
  invoice_date: string
  numbering_mode_at_creation: "continuous" | "financial-year-reset" | null
  reset_month_day_at_creation: string | null
  sequence_window_start: string | null
  sequence_window_end: string | null
  client_name: string | null
  client_phone: string | null
  client_email: string | null
  client_gst: string | null
  client_address: string | null
  custom_details: unknown
  notes: string | null
  status: "draft" | "issued" | "paid" | null
  grand_total: number | null
  invoice_items?: RelationalInvoiceItemRow[] | null
  invoice_history?: RelationalInvoiceHistoryRow[] | null
}

export type RelationalSyncPayload = {
  profile: RelationalProfileRow | null
  settings: RelationalSettingsRow | null
  products: RelationalProductRow[]
  customers: RelationalCustomerRow[]
  invoices: RelationalInvoiceRow[]
  logoSignedUrl?: string | null
}

export const RELATIONAL_CACHE_KEYS = [
  "accountSetupBundle",
  "businessProfile",
  "invoices",
  "products",
  "customers",
  "invoiceTemplate",
  "invoiceVisibility",
  "subscriptionPlanId",
  "invoiceUsageCount",
  "invoiceUsageInitialized:v1",
  "templateTypography",
  "invoiceTemplateFontId",
  "invoiceTemplateFontSize",
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
  "emailChangeAudit",
] as const

export type RelationalCacheKey = (typeof RELATIONAL_CACHE_KEYS)[number]

const defaultSettings = {
  dateFormat: "YYYY-MM-DD",
  amountFormat: "indian",
  showDecimals: true,
  invoicePrefix: "INV-",
  invoicePadding: 4,
  invoiceStartNumber: 1,
  resetYearly: true,
  invoiceResetMonthDay: DEFAULT_RESET_MONTH_DAY,
  currencySymbol: "₹",
  currencyPosition: "before" as const,
  invoiceVisibility: DEFAULT_INVOICE_VISIBILITY,
  invoiceTemplate: "",
  templateTypography: "",
  templateFontId: "",
  templateFontSize: 10,
  subscriptionPlanId: "free",
  invoiceUsageCount: 0,
  invoiceUsageInitialized: false,
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function normalizeCustomDetails(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((detail) => {
      const parsed = typeof detail === "object" && detail !== null ? (detail as { label?: unknown; value?: unknown }) : {}
      return {
        label: typeof parsed.label === "string" ? parsed.label : "",
        value: typeof parsed.value === "string" ? parsed.value : "",
      }
    })
    .filter((detail) => detail.label || detail.value)
}

function mapInvoiceItems(rows: RelationalInvoiceItemRow[] | null | undefined): InvoiceItem[] {
  return (rows || [])
    .slice()
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map((row) => ({
      product: row.product || "",
      hsn: row.hsn || "",
      qty: Number(row.qty || 0),
      unit: row.unit || "",
      price: Number(row.price || 0),
      cgst: Number(row.cgst || 0),
      sgst: Number(row.sgst || 0),
      igst: Number(row.igst || 0),
      total: Number(row.total || 0),
    }))
}

function mapInvoiceHistory(rows: RelationalInvoiceHistoryRow[] | null | undefined): InvoiceHistoryEntry[] {
  return (rows || [])
    .slice()
    .sort((a, b) => String(a.happened_at || "").localeCompare(String(b.happened_at || "")))
    .map((row) => ({
      id: row.id || "",
      type:
        row.event_type === "edited" ||
        row.event_type === "exported" ||
        row.event_type === "status" ||
        row.event_type === "duplicated"
          ? row.event_type
          : "created",
      label: row.label || "Invoice updated",
      at: row.happened_at || new Date().toISOString(),
    }))
}

export function mapRelationalInvoicesToRecords(rows: RelationalInvoiceRow[]) {
  return rows.map((row) =>
    {
      const safeRow = revealSensitiveFields(
        {
          client_name: row.client_name || "",
          client_phone: row.client_phone || "",
          client_email: row.client_email || "",
          client_gst: row.client_gst || "",
          client_address: row.client_address || "",
        },
        ["client_phone", "client_gst"]
      )

      return normalizeInvoiceRecord({
        id: row.id,
        invoiceNumber: row.invoice_number,
        createdAt: row.created_at || undefined,
        numberingModeAtCreation: row.numbering_mode_at_creation || "continuous",
        resetMonthDayAtCreation: row.reset_month_day_at_creation || null,
        sequenceWindowStart: row.sequence_window_start || null,
        sequenceWindowEnd: row.sequence_window_end || null,
        clientName: String(safeRow.client_name || ""),
        clientPhone: String(safeRow.client_phone || ""),
        clientEmail: String(safeRow.client_email || ""),
        clientGST: String(safeRow.client_gst || ""),
        clientAddress: String(safeRow.client_address || ""),
        date: row.invoice_date,
        customDetails: normalizeCustomDetails(row.custom_details),
        items: mapInvoiceItems(row.invoice_items),
        notes: row.notes || "",
        status: row.status || "draft",
        history: mapInvoiceHistory(row.invoice_history),
        grandTotal: Number(row.grand_total || 0),
      })
    }
  )
}

export function buildBusinessProfileCache(profile: RelationalProfileRow | null, logoSignedUrl?: string | null): BusinessProfileRecord {
  const safeProfile = revealSensitiveFields(
    {
      business_name: profile?.business_name || "",
      phone: profile?.phone || "",
      email: profile?.email || "",
      gst: profile?.gst || "",
      address: profile?.address || "",
      bank_name: profile?.bank_name || "",
      account_number: profile?.account_number || "",
      ifsc: profile?.ifsc || "",
      upi: profile?.upi || "",
      terms: profile?.terms || "",
    },
    ["business_name", "phone", "gst", "bank_name", "account_number", "ifsc", "upi"]
  )

  return normalizeBusinessProfile({
    businessName: String(safeProfile.business_name || ""),
    phone: String(safeProfile.phone || ""),
    email: String(safeProfile.email || ""),
    gst: String(safeProfile.gst || ""),
    address: String(safeProfile.address || ""),
    bankName: String(safeProfile.bank_name || ""),
    accountNumber: String(safeProfile.account_number || ""),
    ifsc: String(safeProfile.ifsc || ""),
    upi: String(safeProfile.upi || ""),
    terms: String(safeProfile.terms || ""),
    logo: logoSignedUrl || "",
    logoShape: profile?.logo_shape === "round" ? "round" : "square",
    logoStoragePath: profile?.logo_storage_path || "",
  })
}

function buildSettingsSnapshot(settings: RelationalSettingsRow | null) {
  const invoiceVisibility = {
    ...DEFAULT_INVOICE_VISIBILITY,
    ...((settings?.invoice_visibility as Partial<InvoiceVisibilitySettings> | null) || {}),
  }

  return {
    dateFormat: settings?.date_format || defaultSettings.dateFormat,
    amountFormat: settings?.amount_format || defaultSettings.amountFormat,
    showDecimals: settings?.show_decimals ?? defaultSettings.showDecimals,
    invoicePrefix: settings?.invoice_prefix || defaultSettings.invoicePrefix,
    invoicePadding: Number(settings?.invoice_padding ?? defaultSettings.invoicePadding),
    invoiceStartNumber: Number(settings?.invoice_start_number ?? defaultSettings.invoiceStartNumber),
    resetYearly: settings?.reset_yearly ?? defaultSettings.resetYearly,
    invoiceResetMonthDay: normalizeResetMonthDay(settings?.invoice_reset_month_day || DEFAULT_RESET_MONTH_DAY),
    currencySymbol: settings?.currency_symbol || defaultSettings.currencySymbol,
    currencyPosition: settings?.currency_position === "after" ? "after" : "before",
    invoiceVisibility,
    invoiceTemplate: settings?.invoice_template || defaultSettings.invoiceTemplate,
    templateTypography: settings?.template_typography || defaultSettings.templateTypography,
    templateFontId: settings?.template_font_id || defaultSettings.templateFontId,
    templateFontSize: Number(settings?.template_font_size ?? defaultSettings.templateFontSize),
    subscriptionPlanId: settings?.subscription_plan_id || defaultSettings.subscriptionPlanId,
    invoiceUsageCount: Number(settings?.invoice_usage_count ?? defaultSettings.invoiceUsageCount),
    invoiceUsageInitialized: settings?.invoice_usage_initialized ?? defaultSettings.invoiceUsageInitialized,
  }
}

export function buildRelationalCacheEntries(payload: RelationalSyncPayload) {
  const settings = buildSettingsSnapshot(payload.settings)
  const businessProfile = buildBusinessProfileCache(payload.profile, payload.logoSignedUrl)
  const invoices = mapRelationalInvoicesToRecords(payload.invoices)
  const products = payload.products.map((row) => ({
    name: row.name || "",
    hsn: row.hsn || "",
    unit: row.unit || "",
    price: Number(row.price || 0),
    cgst: Number(row.cgst || 0),
    sgst: Number(row.sgst || 0),
    igst: Number(row.igst || 0),
  }))
  const customers = payload.customers.map((row) => ({
    name: row.name || "",
    phone: row.phone || "",
    email: row.email || "",
    gst: row.gst || "",
    address: row.address || "",
  }))

  const bundle = {
    businessProfile,
    dateFormat: settings.dateFormat,
    amountFormat: settings.amountFormat,
    showDecimals: settings.showDecimals,
    invoicePrefix: settings.invoicePrefix,
    invoicePadding: settings.invoicePadding,
    invoiceStartNumber: settings.invoiceStartNumber,
    resetYearly: settings.resetYearly,
    invoiceResetMonthDay: settings.invoiceResetMonthDay,
    currencySymbol: settings.currencySymbol,
    currencyPosition: settings.currencyPosition,
    invoiceVisibility: settings.invoiceVisibility,
  }

  const emailAudit = payload.profile?.email_change_audit_at ? "1" : ""

  return [
    { key: "accountSetupBundle", value: JSON.stringify(bundle) },
    { key: "businessProfile", value: JSON.stringify(businessProfile) },
    { key: "invoices", value: serializeInvoiceStore(invoices) },
    { key: "products", value: JSON.stringify(products) },
    { key: "customers", value: JSON.stringify(customers) },
    { key: "invoiceTemplate", value: settings.invoiceTemplate },
    { key: "invoiceVisibility", value: JSON.stringify(settings.invoiceVisibility) },
    { key: "subscriptionPlanId", value: settings.subscriptionPlanId },
    { key: "invoiceUsageCount", value: String(settings.invoiceUsageCount) },
    { key: "invoiceUsageInitialized:v1", value: String(settings.invoiceUsageInitialized) },
    { key: "templateTypography", value: settings.templateTypography },
    { key: "invoiceTemplateFontId", value: settings.templateFontId },
    { key: "invoiceTemplateFontSize", value: String(settings.templateFontSize) },
    { key: "dateFormat", value: settings.dateFormat },
    { key: "amountFormat", value: settings.amountFormat },
    { key: "showDecimals", value: String(settings.showDecimals) },
    { key: "invoicePrefix", value: settings.invoicePrefix },
    { key: "invoicePadding", value: String(settings.invoicePadding) },
    { key: "invoiceStartNumber", value: String(settings.invoiceStartNumber) },
    { key: "resetYearly", value: String(settings.resetYearly) },
    { key: "invoiceResetMonthDay", value: settings.invoiceResetMonthDay },
    { key: "currencySymbol", value: settings.currencySymbol },
    { key: "currencyPosition", value: settings.currencyPosition },
    { key: "emailChangeAudit", value: emailAudit },
  ] as Array<{ key: RelationalCacheKey; value: string }>
}

export async function getSignedStorageUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string | null | undefined,
  expiresInSeconds = 60 * 60 * 24
) {
  if (!path) return null
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds)
  if (error) return null
  return data.signedUrl || null
}

function invoiceScopeParts(invoice: InvoiceRecord) {
  const scopeStart = invoice.sequenceWindowStart || "continuous"
  const resetMonthDay = invoice.resetMonthDayAtCreation || "none"
  const numberingMode = invoice.numberingModeAtCreation || "continuous"
  return {
    scopeKey: `${numberingMode}:${scopeStart}:${resetMonthDay}`,
    numberingMode,
    scopeStart,
    scopeEnd: invoice.sequenceWindowEnd || null,
    resetMonthDay,
  }
}

function extractTrailingSequence(invoiceNumber: string) {
  const match = /(\d+)$/.exec(invoiceNumber)
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

export async function syncInvoiceSequencesFromRecords(
  supabase: SupabaseClient,
  userId: string,
  invoices: InvoiceRecord[]
) {
  const maxByScope = new Map<
    string,
    { numbering_mode: string; scope_start: string; scope_end: string | null; reset_month_day: string | null; last_value: number }
  >()

  for (const invoice of invoices) {
    const sequenceValue = extractTrailingSequence(invoice.invoiceNumber)
    if (!sequenceValue) continue
    const scope = invoiceScopeParts(invoice)
    const existing = maxByScope.get(scope.scopeKey)
    if (!existing || sequenceValue > existing.last_value) {
      maxByScope.set(scope.scopeKey, {
        numbering_mode: scope.numberingMode,
        scope_start: scope.scopeStart,
        scope_end: scope.scopeEnd,
        reset_month_day: scope.resetMonthDay === "none" ? null : scope.resetMonthDay,
        last_value: sequenceValue,
      })
    }
  }

  const rows = Array.from(maxByScope.entries()).map(([scopeKey, row]) => ({
    user_id: userId,
    scope_key: scopeKey,
    ...row,
  }))

  if (!rows.length) return

  await supabase.from("invoice_sequences").upsert(rows, { onConflict: "user_id,scope_key" })
}

export function buildProfileUpsertFromCache(rawValue: string) {
  const profile = normalizeBusinessProfile(safeJsonParse(rawValue, {}))
  const logoStoragePath =
    (profile as BusinessProfileRecord & { logoStoragePath?: string }).logoStoragePath ||
    extractLogoStoragePath(profile.logo) ||
    null
  return {
    business_name: profile.businessName || null,
    phone: profile.phone || null,
    email: profile.email || null,
    gst: profile.gst || null,
    address: profile.address || null,
    bank_name: profile.bankName || null,
    account_number: profile.accountNumber || null,
    ifsc: profile.ifsc || null,
    upi: profile.upi || null,
    terms: profile.terms || null,
    logo_storage_path: logoStoragePath,
    logo_shape: profile.logoShape === "round" ? "round" : "square",
  }
}

export function buildSettingsUpsertPatch(key: RelationalCacheKey, rawValue: string) {
  const invoiceVisibility = safeJsonParse<Partial<InvoiceVisibilitySettings>>(rawValue, DEFAULT_INVOICE_VISIBILITY)
  switch (key) {
    case "invoiceTemplate":
      return { invoice_template: rawValue || "" }
    case "invoiceVisibility":
      return { invoice_visibility: invoiceVisibility }
    case "subscriptionPlanId":
      return { subscription_plan_id: rawValue || "free" }
    case "invoiceUsageCount":
      return { invoice_usage_count: Number(rawValue || 0) }
    case "invoiceUsageInitialized:v1":
      return { invoice_usage_initialized: rawValue === "true" }
    case "templateTypography":
      return { template_typography: rawValue || "" }
    case "invoiceTemplateFontId":
      return { template_font_id: rawValue || "" }
    case "invoiceTemplateFontSize":
      return { template_font_size: Number(rawValue || 10) }
    case "dateFormat":
      return { date_format: rawValue || defaultSettings.dateFormat }
    case "amountFormat":
      return { amount_format: rawValue || defaultSettings.amountFormat }
    case "showDecimals":
      return { show_decimals: rawValue === "true" }
    case "invoicePrefix":
      return { invoice_prefix: rawValue || defaultSettings.invoicePrefix }
    case "invoicePadding":
      return { invoice_padding: Number(rawValue || defaultSettings.invoicePadding) }
    case "invoiceStartNumber":
      return { invoice_start_number: Number(rawValue || defaultSettings.invoiceStartNumber) }
    case "resetYearly":
      return { reset_yearly: rawValue === "true" }
    case "invoiceResetMonthDay":
      return { invoice_reset_month_day: normalizeResetMonthDay(rawValue) }
    case "currencySymbol":
      return { currency_symbol: rawValue || defaultSettings.currencySymbol }
    case "currencyPosition":
      return { currency_position: rawValue === "after" ? "after" : "before" }
    case "emailChangeAudit":
      return rawValue ? { email_change_audit_at: new Date().toISOString() } : {}
    default:
      return {}
  }
}
