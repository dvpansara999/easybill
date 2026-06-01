import type { SupabaseClient } from "@supabase/supabase-js"
import {
  buildRelationalCacheEntries,
  buildProfileUpsertFromCache,
  buildSettingsUpsertPatch,
  getSignedStorageUrl,
  mapRelationalInvoicesToRecords,
  syncInvoiceSequencesFromRecords,
  type RelationalCacheKey,
  type RelationalCustomerRow,
  type RelationalInvoiceRow,
  type RelationalProductRow,
} from "./relationalSync"
import { normalizeInvoiceStorePayload, type InvoiceRecord } from "../invoice"
import { normalizeBusinessProfile } from "../businessProfile"
import { revealSensitiveDataFromStorage } from "../sensitiveData"
import {
  validateCustomerForPersistence,
  validateInvoiceForPersistence,
  validateProductForPersistence,
} from "../workspaceValidation"
import { DEFAULT_INVOICE_VISIBILITY } from "../invoiceVisibilityShared"
import { DEFAULT_RESET_MONTH_DAY } from "../invoiceResetDate"
import { LOGO_BUCKET } from "../logoStorage"

export type SyncableWorkspaceTable = "products" | "customers" | "invoices"

export const WORKSPACE_SETTINGS_KEYS: RelationalCacheKey[] = [
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

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function identityKey(row: { phone?: unknown; gst?: unknown; name?: unknown }) {
  const existing = (row as { identity_hash?: unknown; identity_key?: unknown }).identity_hash || (row as { identity_key?: unknown }).identity_key
  if (typeof existing === "string" && existing.trim()) return existing.trim()
  return [
    typeof row.phone === "string" ? row.phone.trim() : "",
    typeof row.gst === "string" ? row.gst.trim() : "",
    typeof row.name === "string" ? row.name.trim().toLowerCase() : "",
  ]
    .filter(Boolean)
    .join("|")
}

export function sanitizeProductRows(rawValue: string, userId: string) {
  const parsed = safeJsonParse<Array<Record<string, unknown>>>(rawValue, [])
  return parsed.map((product) => {
    if (!product.deleted_at) {
      const result = validateProductForPersistence(product)
      if (!result.ok) throw new Error(result.message)
    }
    return {
      id: typeof product.id === "string" ? product.id : undefined,
      user_id: userId,
      name: typeof product.name === "string" ? product.name : "",
      hsn: typeof product.hsn === "string" ? product.hsn : "",
      unit: typeof product.unit === "string" ? product.unit : "",
      price: Number(product.price || 0),
      cgst: Number(product.cgst || 0),
      sgst: Number(product.sgst || 0),
      igst: Number(product.igst || 0),
      updated_at: typeof product.updated_at === "string" ? product.updated_at : undefined,
      deleted_at: typeof product.deleted_at === "string" ? product.deleted_at : undefined,
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    }
  })
}

export function sanitizeCustomerRows(rawValue: string, userId: string) {
  const parsed = safeJsonParse<Array<Record<string, unknown>>>(rawValue, [])
  return parsed.map((customer) => {
    if (!customer.deleted_at) {
      const result = validateCustomerForPersistence(customer)
      if (!result.ok) throw new Error(result.message)
    }
    const row = {
      id: typeof customer.id === "string" ? customer.id : undefined,
      user_id: userId,
      identity_hash: typeof customer.identity_hash === "string" ? customer.identity_hash : undefined,
      phone_hash: typeof customer.phone_hash === "string" ? customer.phone_hash : undefined,
      gst_hash: typeof customer.gst_hash === "string" ? customer.gst_hash : undefined,
      name: typeof customer.name === "string" ? customer.name : "",
      phone: typeof customer.phone === "string" ? customer.phone : "",
      email: typeof customer.email === "string" ? customer.email : "",
      gst: typeof customer.gst === "string" ? customer.gst : "",
      address: typeof customer.address === "string" ? customer.address : "",
      updated_at: typeof customer.updated_at === "string" ? customer.updated_at : undefined,
      deleted_at: typeof customer.deleted_at === "string" ? customer.deleted_at : undefined,
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    }
    return { ...row, identity_key: identityKey(row) }
  })
}

function invoiceRowsFromCache(rawValue: string, userId: string) {
  const parsed = safeJsonParse<unknown>(revealSensitiveDataFromStorage("invoices", rawValue), [])
  const { store } = normalizeInvoiceStorePayload(parsed)
  const invoices = store.invoices

  return {
    invoices,
    rows: invoices.map((invoice) => {
      if (!invoice.deleted_at) {
        const result = validateInvoiceForPersistence(invoice)
        if (!result.ok) throw new Error(result.message)
      }
      return {
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
        client_phone_hash: invoice.clientPhoneHash || null,
        client_email: invoice.clientEmail,
        client_gst: invoice.clientGST,
        client_gst_hash: invoice.clientGstHash || null,
        customer_identity_key: invoice.customerIdentityKey || null,
        client_address: invoice.clientAddress,
        custom_details: invoice.customDetails,
        notes: invoice.notes || "",
        status: invoice.status || "draft",
        grand_total: invoice.grandTotal,
        updated_at: invoice.updated_at || undefined,
        deleted_at: invoice.deleted_at || undefined,
        sync_status: "synced",
        last_synced_at: new Date().toISOString(),
      }
    }),
  }
}

export async function upsertProfileFromCache(supabase: SupabaseClient, userId: string, rawValue: string) {
  const profilePatch = buildProfileUpsertFromCache(revealSensitiveDataFromStorage("businessProfile", rawValue))
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      ...profilePatch,
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (error) throw error
}

export async function upsertSettingsPatch(
  supabase: SupabaseClient,
  userId: string,
  key: RelationalCacheKey,
  rawValue: string
) {
  const patch = buildSettingsUpsertPatch(key, rawValue)
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      ...patch,
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (error) throw error
}

export async function upsertProductsFromCache(supabase: SupabaseClient, userId: string, rawValue: string) {
  const rows = sanitizeProductRows(rawValue, userId)
  if (!rows.length) return
  const { error } = await supabase.from("products").upsert(rows, { onConflict: "id", ignoreDuplicates: false })
  if (error) throw error
}

export async function upsertCustomersFromCache(supabase: SupabaseClient, userId: string, rawValue: string) {
  const rows = sanitizeCustomerRows(rawValue, userId)
  if (!rows.length) return
  const { error } = await supabase.from("customers").upsert(rows, { onConflict: "id", ignoreDuplicates: false })
  if (error) throw error
}

export async function upsertInvoicesFromCache(supabase: SupabaseClient, userId: string, rawValue: string) {
  const { invoices, rows } = invoiceRowsFromCache(rawValue, userId)
  if (!rows.length) return

  const { error } = await supabase.from("invoices").upsert(rows, { onConflict: "id", ignoreDuplicates: false })
  if (error) throw error

  for (const invoice of invoices) {
    await upsertInvoiceChildren(supabase, invoice)
  }

  await syncInvoiceSequencesFromRecords(supabase, userId, invoices)
}

async function upsertInvoiceChildren(supabase: SupabaseClient, invoice: InvoiceRecord) {
  const itemRows = (invoice.items || []).map((item, index) => ({
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
    sync_status: "synced",
    last_synced_at: new Date().toISOString(),
  }))

  const deleteItems = await supabase.from("invoice_items").update({ deleted_at: new Date().toISOString() }).eq("invoice_id", invoice.id)
  if (deleteItems.error) throw deleteItems.error
  if (itemRows.length) {
    const { error } = await supabase.from("invoice_items").insert(itemRows)
    if (error) throw error
  }

  const historyRows = (invoice.history || []).map((entry) => ({
    id: entry.id,
    invoice_id: invoice.id,
    event_type: entry.type,
    label: entry.label,
    happened_at: entry.at,
    sync_status: "synced",
    last_synced_at: new Date().toISOString(),
  }))

  if (historyRows.length) {
    const { error } = await supabase.from("invoice_history").upsert(historyRows, { onConflict: "id", ignoreDuplicates: false })
    if (error) throw error
  }
}

export async function softDeleteEntitySet(
  supabase: SupabaseClient,
  table: "products" | "customers" | "invoices",
  userId: string
) {
  await supabase
    .from(table)
    .update({
      deleted_at: new Date().toISOString(),
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
}

export async function fetchChangedRows<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: SyncableWorkspaceTable,
  userId: string,
  changedSince?: string | null
) {
  let query = supabase.from(table).select("*").eq("user_id", userId).order("updated_at", { ascending: true })
  if (changedSince) {
    query = query.or(`updated_at.gt.${changedSince},deleted_at.gt.${changedSince}`)
  }
  const { data, error } = await query
  if (error) throw error
  return (data || []) as T[]
}

export function fetchChangedProducts<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  userId: string,
  changedSince?: string | null
) {
  return fetchChangedRows<T>(supabase, "products", userId, changedSince)
}

export function fetchChangedCustomers<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  userId: string,
  changedSince?: string | null
) {
  return fetchChangedRows<T>(supabase, "customers", userId, changedSince)
}

export function fetchChangedInvoices<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  userId: string,
  changedSince?: string | null
) {
  let query = supabase
    .from("invoices")
    .select(
      "id,user_id,invoice_number,created_at,updated_at,deleted_at,sync_status,last_synced_at,invoice_date,numbering_mode_at_creation,reset_month_day_at_creation,sequence_window_start,sequence_window_end,client_name,client_phone,client_phone_hash,client_email,client_gst,client_gst_hash,customer_identity_key,client_address,custom_details,notes,status,grand_total,invoice_items(id,invoice_id,deleted_at,position,product,hsn,qty,unit,price,cgst,sgst,igst,total),invoice_history(id,invoice_id,deleted_at,event_type,label,happened_at)"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: true })
  if (changedSince) {
    query = query.or(`updated_at.gt.${changedSince},deleted_at.gt.${changedSince}`)
  }
  return query.then(({ data, error }) => {
    if (error) throw error
    return (data || []) as T[]
  })
}

export async function fetchWorkspaceSnapshot(supabase: SupabaseClient, userId: string) {
  const [profileRes, settingsRes, productsRes, customersRes, invoicesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("products").select("*").eq("user_id", userId).is("deleted_at", null).order("created_at", { ascending: true }),
    supabase.from("customers").select("*").eq("user_id", userId).is("deleted_at", null).order("created_at", { ascending: true }),
    supabase
      .from("invoices")
      .select(
        "id,user_id,invoice_number,created_at,invoice_date,numbering_mode_at_creation,reset_month_day_at_creation,sequence_window_start,sequence_window_end,client_name,client_phone,client_phone_hash,client_email,client_gst,client_gst_hash,customer_identity_key,client_address,custom_details,notes,status,grand_total,invoice_items(id,invoice_id,deleted_at,position,product,hsn,qty,unit,price,cgst,sgst,igst,total),invoice_history(id,invoice_id,deleted_at,event_type,label,happened_at)"
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
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

export async function fetchWorkspaceBasics(supabase: SupabaseClient, userId: string) {
  const [profileRes, settingsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
  ])

  if (profileRes.error) throw profileRes.error
  if (settingsRes.error) throw settingsRes.error

  const logoSignedUrl = await getSignedStorageUrl(
    supabase,
    LOGO_BUCKET,
    (profileRes.data as { logo_storage_path?: string | null } | null)?.logo_storage_path || null,
    60 * 60 * 24 * 7
  )

  return {
    profile: profileRes.data,
    settings: settingsRes.data,
    products: [],
    customers: [],
    invoices: [],
    logoSignedUrl,
  }
}

export async function fetchWorkspaceSnapshotEntries(supabase: SupabaseClient, userId: string) {
  return buildRelationalCacheEntries(await fetchWorkspaceSnapshot(supabase, userId))
}

export async function fetchWorkspaceChanges(
  supabase: SupabaseClient,
  userId: string,
  changedSince: string | null
) {
  const [products, customers, invoices] = await Promise.all([
    fetchChangedProducts<RelationalProductRow>(supabase, userId, changedSince),
    fetchChangedCustomers<RelationalCustomerRow>(supabase, userId, changedSince),
    fetchChangedInvoices<RelationalInvoiceRow>(supabase, userId, changedSince),
  ])
  return { products, customers, invoices }
}

export async function ensureWorkspaceSeed(supabase: SupabaseClient, userId: string) {
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
          currency_symbol: "\u20B9",
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

export async function pushWorkspaceKey(
  supabase: SupabaseClient,
  userId: string,
  key: RelationalCacheKey,
  rawValue: string
) {
  switch (key) {
    case "accountSetupBundle": {
      const bundle = safeJsonParse<Record<string, unknown>>(rawValue, {})
      if (bundle.businessProfile) {
        await upsertProfileFromCache(supabase, userId, JSON.stringify(bundle.businessProfile))
      }
      for (const settingKey of WORKSPACE_SETTINGS_KEYS) {
        if (settingKey in bundle) {
          await upsertSettingsPatch(
            supabase,
            userId,
            settingKey,
            settingKey === "invoiceVisibility" ? JSON.stringify(bundle[settingKey]) : String(bundle[settingKey])
          )
        }
      }
      return
    }
    case "businessProfile":
      await upsertProfileFromCache(supabase, userId, rawValue)
      return
    case "products":
      await upsertProductsFromCache(supabase, userId, rawValue)
      return
    case "customers":
      await upsertCustomersFromCache(supabase, userId, rawValue)
      return
    case "invoices":
      await upsertInvoicesFromCache(supabase, userId, rawValue)
      return
    case "emailChangeAudit":
      await upsertEmailChangeAudit(supabase, userId, rawValue)
      return
    default:
      await upsertSettingsPatch(supabase, userId, key, rawValue)
  }
}

export async function deleteWorkspaceKey(supabase: SupabaseClient, userId: string, key: RelationalCacheKey) {
  switch (key) {
    case "products":
      await softDeleteEntitySet(supabase, "products", userId)
      return
    case "customers":
      await softDeleteEntitySet(supabase, "customers", userId)
      return
    case "invoices":
      await softDeleteEntitySet(supabase, "invoices", userId)
      return
    case "businessProfile":
      await upsertProfileFromCache(supabase, userId, JSON.stringify(normalizeBusinessProfile({})))
      return
    default:
      await upsertSettingsPatch(supabase, userId, key, "")
  }
}

export async function upsertEmailChangeAudit(supabase: SupabaseClient, userId: string, rawValue: string) {
  await supabase
    .from("profiles")
    .upsert({ user_id: userId, email_change_audit_at: rawValue ? new Date().toISOString() : null }, { onConflict: "user_id" })
}

function toRpcPayload(invoice: InvoiceRecord, options?: { duplicateSourceInvoiceNumber?: string }) {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    createdAt: invoice.createdAt,
    numberingModeAtCreation: invoice.numberingModeAtCreation,
    resetMonthDayAtCreation: invoice.resetMonthDayAtCreation,
    sequenceWindowStart: invoice.sequenceWindowStart,
    sequenceWindowEnd: invoice.sequenceWindowEnd,
    clientName: invoice.clientName,
    clientPhone: invoice.clientPhone,
    clientPhoneHash: invoice.clientPhoneHash || null,
    clientEmail: invoice.clientEmail,
    clientGST: invoice.clientGST,
    clientGstHash: invoice.clientGstHash || null,
    customerIdentityKey: invoice.customerIdentityKey || null,
    clientAddress: invoice.clientAddress,
    date: invoice.date,
    customDetails: invoice.customDetails,
    items: (invoice.items || []).map((item, index) => ({
      position: index,
      product: item.product,
      hsn: item.hsn,
      qty: item.qty,
      unit: item.unit,
      price: item.price,
      cgst: item.cgst,
      sgst: item.sgst,
      igst: item.igst,
      total: item.total,
    })),
    notes: invoice.notes || "",
    status: invoice.status || "draft",
    grandTotal: invoice.grandTotal,
    duplicateSourceInvoiceNumber: options?.duplicateSourceInvoiceNumber || null,
  }
}

function mapMutationError(error: { message?: string; code?: string } | null) {
  const rawMessage = error?.message || "Database operation failed."
  const normalized = rawMessage.toLowerCase()
  const missingRpc =
    (normalized.includes("create_invoice_record") ||
      normalized.includes("update_invoice_record") ||
      normalized.includes("soft_delete_invoice_record")) &&
    (normalized.includes("could not find the function") ||
      normalized.includes("does not exist") ||
      error?.code === "PGRST202" ||
      error?.code === "42883")

  if (missingRpc) {
    return "Your Supabase project is still using the old schema. Run D:/Projects/invoice-app/supabase/schema.sql in the Supabase SQL editor, then reload the app."
  }
  if (normalized.includes("relation") && normalized.includes("does not exist")) {
    return "Your Supabase project is missing the new relational tables. Run D:/Projects/invoice-app/supabase/schema.sql in the Supabase SQL editor, then reload the app."
  }
  return rawMessage
}

export async function createInvoiceRecord(
  supabase: SupabaseClient,
  _userId: string,
  invoice: InvoiceRecord,
  options?: { duplicateSourceInvoiceNumber?: string }
) {
  const { data, error } = await supabase.rpc("create_invoice_record", { p_invoice: toRpcPayload(invoice, options) })
  if (error) throw new Error(mapMutationError(error))
  return (data || {}) as Partial<InvoiceRecord>
}

export async function updateInvoiceRecord(supabase: SupabaseClient, _userId: string, invoice: InvoiceRecord) {
  const { error } = await supabase.rpc("update_invoice_record", { p_invoice: toRpcPayload(invoice) })
  if (error) throw new Error(mapMutationError(error))
}

export async function softDeleteInvoiceRecord(supabase: SupabaseClient, _userId: string, invoiceId: string) {
  const { data, error } = await supabase.rpc("soft_delete_invoice_record", { p_invoice_id: invoiceId })
  if (error) throw new Error(mapMutationError(error))
  return Boolean(data)
}

export async function listInvoiceRecords(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id,user_id,invoice_number,created_at,invoice_date,numbering_mode_at_creation,reset_month_day_at_creation,sequence_window_start,sequence_window_end,client_name,client_phone,client_phone_hash,client_email,client_gst,client_gst_hash,customer_identity_key,client_address,custom_details,notes,status,grand_total,invoice_items(id,invoice_id,deleted_at,position,product,hsn,qty,unit,price,cgst,sgst,igst,total),invoice_history(id,invoice_id,deleted_at,event_type,label,happened_at)"
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("invoice_date", { ascending: false })

  if (error || !data) return []
  return mapRelationalInvoicesToRecords(data) as InvoiceRecord[]
}
