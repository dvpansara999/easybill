"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeInvoiceStorePayload, type InvoiceRecord } from "@/lib/invoice"
import { normalizeBusinessProfile } from "@/lib/businessProfile"
import { LOGO_BUCKET } from "@/lib/logoStorage"
import {
  RELATIONAL_CACHE_KEYS,
  buildProfileUpsertFromCache,
  buildRelationalCacheEntries,
  buildSettingsUpsertPatch,
  getSignedStorageUrl,
  mapRelationalInvoicesToRecords,
  syncInvoiceSequencesFromRecords,
  type RelationalCacheKey,
} from "@/lib/supabase/relationalSync"
import { DEFAULT_INVOICE_VISIBILITY } from "@/lib/invoiceVisibilityShared"
import { DEFAULT_RESET_MONTH_DAY } from "@/lib/invoiceResetDate"
import { revealSensitiveDataFromStorage } from "@/lib/sensitiveData"

export const KV_KEYS = RELATIONAL_CACHE_KEYS
export type KvKey = RelationalCacheKey

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function sanitizeProductRows(rawValue: string, userId: string) {
  const parsed = safeJsonParse<Array<Record<string, unknown>>>(rawValue, [])
  return parsed.map((product) => ({
    user_id: userId,
    name: typeof product.name === "string" ? product.name : "",
    hsn: typeof product.hsn === "string" ? product.hsn : "",
    unit: typeof product.unit === "string" ? product.unit : "",
    price: Number(product.price || 0),
    cgst: Number(product.cgst || 0),
    sgst: Number(product.sgst || 0),
    igst: Number(product.igst || 0),
  }))
}

function sanitizeCustomerRows(rawValue: string, userId: string) {
  const parsed = safeJsonParse<Array<Record<string, unknown>>>(rawValue, [])
  return parsed.map((customer) => ({
    user_id: userId,
    name: typeof customer.name === "string" ? customer.name : "",
    phone: typeof customer.phone === "string" ? customer.phone : "",
    email: typeof customer.email === "string" ? customer.email : "",
    gst: typeof customer.gst === "string" ? customer.gst : "",
    address: typeof customer.address === "string" ? customer.address : "",
    identity_key: [
      typeof customer.phone === "string" ? customer.phone.trim() : "",
      typeof customer.gst === "string" ? customer.gst.trim() : "",
      typeof customer.name === "string" ? customer.name.trim().toLowerCase() : "",
    ]
      .filter(Boolean)
      .join("|"),
  }))
}

async function replaceRows(
  supabase: SupabaseClient,
  table: "products" | "customers",
  userId: string,
  rows: Array<Record<string, unknown>>
) {
  await supabase.from(table).delete().eq("user_id", userId)
  if (!rows.length) return
  await supabase.from(table).insert(rows)
}

async function replaceInvoices(supabase: SupabaseClient, userId: string, rawValue: string) {
  const parsed = safeJsonParse<unknown>(revealSensitiveDataFromStorage("invoices", rawValue), [])
  const { store } = normalizeInvoiceStorePayload(parsed)
  const invoices = store.invoices

  await supabase.from("invoice_sequences").delete().eq("user_id", userId)
  await supabase.from("invoices").delete().eq("user_id", userId)

  if (!invoices.length) return

  const invoiceRows = invoices.map((invoice) => ({
    id: invoice.id,
    user_id: userId,
    invoice_number: invoice.invoiceNumber,
    created_at: invoice.createdAt || new Date().toISOString(),
    invoice_date: invoice.date,
    numbering_mode_at_creation: invoice.numberingModeAtCreation || "continuous",
    reset_month_day_at_creation: invoice.resetMonthDayAtCreation || null,
    sequence_window_start: invoice.sequenceWindowStart || null,
    sequence_window_end: invoice.sequenceWindowEnd || null,
    client_name: invoice.clientName,
    client_phone: invoice.clientPhone,
    client_email: invoice.clientEmail,
    client_gst: invoice.clientGST,
    client_address: invoice.clientAddress,
    custom_details: invoice.customDetails,
    notes: invoice.notes || "",
    status: invoice.status || "draft",
    grand_total: invoice.grandTotal,
  }))

  const itemRows = invoices.flatMap((invoice) =>
    (invoice.items || []).map((item, index) => ({
      invoice_id: invoice.id,
      position: index,
      product: item.product,
      hsn: item.hsn,
      qty: Number(item.qty || 0),
      unit: item.unit,
      price: Number(item.price || 0),
      cgst: Number(item.cgst || 0),
      sgst: Number(item.sgst || 0),
      igst: Number(item.igst || 0),
      total: Number(item.total || 0),
    }))
  )

  const historyRows = invoices.flatMap((invoice) =>
    (invoice.history || []).map((entry) => ({
      id: entry.id,
      invoice_id: invoice.id,
      event_type: entry.type,
      label: entry.label,
      happened_at: entry.at,
    }))
  )

  await supabase.from("invoices").insert(invoiceRows)
  if (itemRows.length) {
    await supabase.from("invoice_items").insert(itemRows)
  }
  if (historyRows.length) {
    await supabase.from("invoice_history").insert(historyRows)
  }
  await syncInvoiceSequencesFromRecords(supabase, userId, invoices)
}

async function fetchRelationalState(supabase: SupabaseClient, userId: string) {
  const [profileRes, settingsRes, productsRes, customersRes, invoicesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("products").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("customers").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase
      .from("invoices")
      .select(
        "id,user_id,invoice_number,created_at,invoice_date,numbering_mode_at_creation,reset_month_day_at_creation,sequence_window_start,sequence_window_end,client_name,client_phone,client_email,client_gst,client_address,custom_details,notes,status,grand_total,invoice_items(id,invoice_id,position,product,hsn,qty,unit,price,cgst,sgst,igst,total),invoice_history(id,invoice_id,event_type,label,happened_at)"
      )
      .eq("user_id", userId)
      .order("invoice_date", { ascending: false }),
  ])

  const logoSignedUrl = await getSignedStorageUrl(
    supabase,
    LOGO_BUCKET,
    (profileRes.data as { logo_storage_path?: string | null } | null)?.logo_storage_path || null,
    60 * 60 * 24 * 7
  )

  return {
    profile: profileRes.data,
    settings: settingsRes.data,
    products: productsRes.data || [],
    customers: customersRes.data || [],
    invoices: invoicesRes.data || [],
    logoSignedUrl,
  }
}

export async function pullSupabaseKvToCache(supabase: SupabaseClient, userId: string) {
  const payload = await fetchRelationalState(supabase, userId)
  return buildRelationalCacheEntries(payload)
}

async function upsertSettings(supabase: SupabaseClient, userId: string, patch: Record<string, unknown>) {
  if (!Object.keys(patch).length) return
  await supabase.from("user_settings").upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
}

async function upsertBundle(supabase: SupabaseClient, userId: string, rawValue: string) {
  const bundle = safeJsonParse<Record<string, unknown>>(rawValue, {})
  if (bundle.businessProfile) {
    const profilePatch = buildProfileUpsertFromCache(JSON.stringify(bundle.businessProfile))
    await supabase.from("profiles").upsert({ user_id: userId, ...profilePatch }, { onConflict: "user_id" })
  }

  const settingKeys: RelationalCacheKey[] = [
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
  ]
  const settingsPatch = settingKeys.reduce<Record<string, unknown>>((acc, key) => {
    if (!(key in bundle)) return acc
    const partial = buildSettingsUpsertPatch(key, key === "invoiceVisibility" ? JSON.stringify(bundle[key]) : String(bundle[key]))
    return { ...acc, ...partial }
  }, {})
  await upsertSettings(supabase, userId, settingsPatch)
}

export async function pushKvToSupabase(supabase: SupabaseClient, userId: string, key: KvKey, rawValue: string) {
  switch (key) {
    case "accountSetupBundle":
      await upsertBundle(supabase, userId, rawValue)
      return
    case "businessProfile": {
      const profilePatch = buildProfileUpsertFromCache(revealSensitiveDataFromStorage("businessProfile", rawValue))
      await supabase.from("profiles").upsert({ user_id: userId, ...profilePatch }, { onConflict: "user_id" })
      return
    }
    case "products":
      await replaceRows(supabase, "products", userId, sanitizeProductRows(rawValue, userId))
      return
    case "customers":
      await replaceRows(supabase, "customers", userId, sanitizeCustomerRows(rawValue, userId))
      return
    case "invoices":
      await replaceInvoices(supabase, userId, rawValue)
      return
    case "invoiceTemplate":
    case "invoiceVisibility":
    case "subscriptionPlanId":
    case "invoiceUsageCount":
    case "invoiceUsageInitialized:v1":
    case "templateTypography":
    case "invoiceTemplateFontId":
    case "invoiceTemplateFontSize":
    case "dateFormat":
    case "amountFormat":
    case "showDecimals":
    case "invoicePrefix":
    case "invoicePadding":
    case "invoiceStartNumber":
    case "resetYearly":
    case "invoiceResetMonthDay":
    case "currencySymbol":
    case "currencyPosition": {
      await upsertSettings(supabase, userId, buildSettingsUpsertPatch(key, rawValue))
      return
    }
    case "emailChangeAudit": {
      await supabase
        .from("profiles")
        .upsert({ user_id: userId, email_change_audit_at: rawValue ? new Date().toISOString() : null }, { onConflict: "user_id" })
      return
    }
  }
}

export async function deleteKvFromSupabase(supabase: SupabaseClient, userId: string, key: KvKey) {
  switch (key) {
    case "products":
      await supabase.from("products").delete().eq("user_id", userId)
      return
    case "customers":
      await supabase.from("customers").delete().eq("user_id", userId)
      return
    case "invoices":
      await supabase.from("invoice_sequences").delete().eq("user_id", userId)
      await supabase.from("invoices").delete().eq("user_id", userId)
      return
    case "businessProfile":
      await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            ...buildProfileUpsertFromCache(JSON.stringify(normalizeBusinessProfile({}))),
          },
          { onConflict: "user_id" }
        )
      return
    default:
      await upsertSettings(supabase, userId, buildSettingsUpsertPatch(key, ""))
  }
}

export async function pushLocalSeedIfSupabaseEmpty(supabase: SupabaseClient, userId: string) {
  const [profileRes, settingsRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("user_settings").select("user_id").eq("user_id", userId).maybeSingle(),
  ])

  if (!profileRes.data) {
    await supabase.from("profiles").upsert({ user_id: userId, onboarding_completed: false }, { onConflict: "user_id" })
  }

  if (!settingsRes.data) {
    await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: userId,
          date_format: "YYYY-MM-DD",
          amount_format: "indian",
          show_decimals: true,
          invoice_prefix: "INV-",
          invoice_padding: 4,
          invoice_start_number: 1,
          reset_yearly: true,
          invoice_reset_month_day: DEFAULT_RESET_MONTH_DAY,
          currency_symbol: "₹",
          currency_position: "before",
          invoice_visibility: DEFAULT_INVOICE_VISIBILITY,
          subscription_plan_id: "free",
          invoice_usage_count: 0,
          invoice_usage_initialized: false,
        },
        { onConflict: "user_id" }
      )
  }
}

export async function refreshInvoicesFromSupabase(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id,user_id,invoice_number,created_at,invoice_date,numbering_mode_at_creation,reset_month_day_at_creation,sequence_window_start,sequence_window_end,client_name,client_phone,client_email,client_gst,client_address,custom_details,notes,status,grand_total,invoice_items(id,invoice_id,position,product,hsn,qty,unit,price,cgst,sgst,igst,total),invoice_history(id,invoice_id,event_type,label,happened_at)"
    )
    .eq("user_id", userId)
    .order("invoice_date", { ascending: false })

  if (error || !data) return []
  const invoices = mapRelationalInvoicesToRecords(data)
  return invoices as InvoiceRecord[]
}
