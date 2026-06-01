import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeBusinessProfile } from "@/lib/businessProfile"
import {
  normalizeInvoiceStorePayload,
  type InvoiceRecord,
} from "@/lib/invoice"
import {
  buildRelationalCacheEntries,
  mapRelationalInvoicesToRecords,
  syncInvoiceSequencesFromRecords,
  type RelationalCustomerRow,
  type RelationalInvoiceRow,
  type RelationalSyncPayload,
} from "@/lib/supabase/relationalSync"
import {
  fetchWorkspaceChanges,
  fetchWorkspaceSnapshot,
  upsertEmailChangeAudit,
  upsertProductsFromCache,
  upsertSettingsPatch,
  WORKSPACE_SETTINGS_KEYS,
} from "@/lib/supabase/workspaceRepository"
import { revealSensitiveDataFromStorage } from "@/lib/sensitiveData"
import { sealSensitiveFields, openSensitiveFields, openSensitiveString, sealSensitiveString } from "@/lib/server/sensitiveSeal"
import { createCustomerIdentityKey, createLookupHash } from "@/lib/server/sensitiveLookup"
import {
  validateCustomerForPersistence,
  validateInvoiceForPersistence,
} from "@/lib/workspaceValidation"
import { DEFAULT_RESET_MONTH_DAY } from "@/lib/invoiceResetDate"
import { DEFAULT_INVOICE_VISIBILITY } from "@/lib/invoiceVisibilityShared"

type CacheKey = Parameters<typeof upsertSettingsPatch>[2] | "accountSetupBundle"

const PROFILE_SENSITIVE_KEYS = ["business_name", "phone", "gst", "bank_name", "account_number", "ifsc", "upi"]
const CUSTOMER_SENSITIVE_KEYS = ["phone", "gst"]
const INVOICE_SENSITIVE_KEYS = ["client_phone", "client_gst"]

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function openProfileRow<T extends Record<string, unknown> | null>(row: T) {
  if (!row) return row
  return openSensitiveFields(row, PROFILE_SENSITIVE_KEYS)
}

function openCustomerRow<T extends Record<string, unknown>>(row: T) {
  return openSensitiveFields(row, CUSTOMER_SENSITIVE_KEYS)
}

function openInvoiceRow<T extends Record<string, unknown>>(row: T) {
  return openSensitiveFields(row, INVOICE_SENSITIVE_KEYS)
}

function isSealed(value: unknown) {
  return typeof value === "string" && value.startsWith("sealed:v1:")
}

function plaintextForLookup(value: unknown) {
  return typeof value === "string" ? openSensitiveString(value) : ""
}

function sealExistingValue(value: unknown) {
  return typeof value === "string" ? sealSensitiveString(value) : value
}

function withCustomerLookupFields<T extends Record<string, unknown>>(row: T) {
  const plainPhone = typeof row.phone === "string" ? row.phone : ""
  const plainGst = typeof row.gst === "string" ? row.gst : ""
  const phoneHash = createLookupHash(plainPhone, "phone")
  const gstHash = createLookupHash(plainGst, "gst")
  const identityKey = createCustomerIdentityKey({
    phone: plainPhone,
    gst: plainGst,
    name: typeof row.name === "string" ? row.name : "",
    email: typeof row.email === "string" ? row.email : "",
    address: typeof row.address === "string" ? row.address : "",
  })

  return {
    ...sealSensitiveFields(row, CUSTOMER_SENSITIVE_KEYS),
    identity_key: identityKey,
    identity_hash: identityKey,
    phone_hash: phoneHash || null,
    gst_hash: gstHash || null,
  }
}

export function withInvoiceLookupFields(invoice: InvoiceRecord) {
  const phoneHash = createLookupHash(invoice.clientPhone, "phone")
  const gstHash = createLookupHash(invoice.clientGST, "gst")
  return {
    ...invoice,
    clientPhoneHash: phoneHash,
    clientGstHash: gstHash,
    customerIdentityKey: createCustomerIdentityKey({
      phone: invoice.clientPhone,
      gst: invoice.clientGST,
      name: invoice.clientName,
      email: invoice.clientEmail,
      address: invoice.clientAddress,
    }),
  } satisfies InvoiceRecord
}

function toSealedInvoiceRow(invoice: InvoiceRecord, userId: string) {
  if (!invoice.deleted_at) {
    const result = validateInvoiceForPersistence(invoice)
    if (!result.ok) throw new Error(result.message)
  }

  const lookup = withInvoiceLookupFields(invoice)
  return sealSensitiveFields(
    {
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
      client_phone_hash: lookup.clientPhoneHash || null,
      client_email: invoice.clientEmail,
      client_gst: invoice.clientGST,
      client_gst_hash: lookup.clientGstHash || null,
      customer_identity_key: lookup.customerIdentityKey || null,
      client_address: invoice.clientAddress,
      custom_details: invoice.customDetails,
      notes: invoice.notes || "",
      status: invoice.status || "draft",
      grand_total: invoice.grandTotal,
      updated_at: invoice.updated_at || undefined,
      deleted_at: invoice.deleted_at || undefined,
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    },
    INVOICE_SENSITIVE_KEYS
  )
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

  await supabase.from("invoice_items").update({ deleted_at: new Date().toISOString() }).eq("invoice_id", invoice.id)
  if (itemRows.length) await supabase.from("invoice_items").insert(itemRows)

  const historyRows = (invoice.history || []).map((entry) => ({
    id: entry.id,
    invoice_id: invoice.id,
    event_type: entry.type,
    label: entry.label,
    happened_at: entry.at,
    sync_status: "synced",
    last_synced_at: new Date().toISOString(),
  }))
  if (historyRows.length) await supabase.from("invoice_history").upsert(historyRows, { onConflict: "id", ignoreDuplicates: false })
}

export function openWorkspaceSnapshot(payload: RelationalSyncPayload): RelationalSyncPayload {
  return {
    ...payload,
    profile: openProfileRow(payload.profile),
    customers: payload.customers.map((row) => openCustomerRow(row)),
    invoices: payload.invoices.map((row) => openInvoiceRow(row)),
  }
}

export async function fetchOpenedWorkspaceSnapshotEntries(supabase: SupabaseClient, userId: string) {
  return buildRelationalCacheEntries(openWorkspaceSnapshot(await fetchWorkspaceSnapshot(supabase, userId)))
}

export async function fetchOpenedWorkspaceChanges(
  supabase: SupabaseClient,
  userId: string,
  changedSince: string | null
) {
  const changes = await fetchWorkspaceChanges(supabase, userId, changedSince)
  return {
    products: changes.products,
    customers: changes.customers.map((row) => openCustomerRow(row)) as RelationalCustomerRow[],
    invoices: changes.invoices.map((row) => openInvoiceRow(row)) as RelationalInvoiceRow[],
  }
}

export async function listOpenedInvoiceRecords(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id,user_id,invoice_number,created_at,invoice_date,numbering_mode_at_creation,reset_month_day_at_creation,sequence_window_start,sequence_window_end,client_name,client_phone,client_phone_hash,client_email,client_gst,client_gst_hash,customer_identity_key,client_address,custom_details,notes,status,grand_total,invoice_items(id,invoice_id,deleted_at,position,product,hsn,qty,unit,price,cgst,sgst,igst,total),invoice_history(id,invoice_id,deleted_at,event_type,label,happened_at)"
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("invoice_date", { ascending: false })

  if (error || !data) return []
  return mapRelationalInvoicesToRecords(data.map((row) => openInvoiceRow(row) as RelationalInvoiceRow))
}

export async function upsertSealedProfileFromCache(supabase: SupabaseClient, userId: string, rawValue: string) {
  const profile = normalizeBusinessProfile(safeJsonParse(revealSensitiveDataFromStorage("businessProfile", rawValue), {}))
  const patch = sealSensitiveFields(
    {
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
      logo_storage_path: profile.logoStoragePath || null,
      logo_shape: profile.logoShape === "round" ? "round" : "square",
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    },
    PROFILE_SENSITIVE_KEYS
  )
  const { error } = await supabase.from("profiles").upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
  if (error) throw error
}

export async function upsertSealedCustomersFromCache(supabase: SupabaseClient, userId: string, rawValue: string) {
  const parsed = safeJsonParse<Array<Record<string, unknown>>>(rawValue, [])
  const rows = parsed.map((customer) => {
    if (!customer.deleted_at) {
      const result = validateCustomerForPersistence(customer)
      if (!result.ok) throw new Error(result.message)
    }
    return withCustomerLookupFields({
      id: typeof customer.id === "string" ? customer.id : undefined,
      user_id: userId,
      name: typeof customer.name === "string" ? customer.name : "",
      phone: typeof customer.phone === "string" ? customer.phone : "",
      email: typeof customer.email === "string" ? customer.email : "",
      gst: typeof customer.gst === "string" ? customer.gst : "",
      address: typeof customer.address === "string" ? customer.address : "",
      updated_at: typeof customer.updated_at === "string" ? customer.updated_at : undefined,
      deleted_at: typeof customer.deleted_at === "string" ? customer.deleted_at : undefined,
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    })
  })
  if (rows.length) {
    const { error } = await supabase.from("customers").upsert(rows, { onConflict: "id", ignoreDuplicates: false })
    if (error) throw error
  }
}

export async function upsertSealedInvoicesFromCache(supabase: SupabaseClient, userId: string, rawValue: string) {
  const parsed = safeJsonParse<unknown>(revealSensitiveDataFromStorage("invoices", rawValue), [])
  const { store } = normalizeInvoiceStorePayload(parsed)
  const rows = store.invoices.map((invoice) => toSealedInvoiceRow(invoice, userId))
  if (!rows.length) return
  const { error } = await supabase.from("invoices").upsert(rows, { onConflict: "id", ignoreDuplicates: false })
  if (error) throw error
  for (const invoice of store.invoices) await upsertInvoiceChildren(supabase, invoice)
  await syncInvoiceSequencesFromRecords(supabase, userId, store.invoices)
}

export async function pushSealedWorkspaceKey(
  supabase: SupabaseClient,
  userId: string,
  key: CacheKey,
  rawValue: string
) {
  if (key === "accountSetupBundle") {
    const bundle = safeJsonParse<Record<string, unknown>>(rawValue, {})
    if (bundle.businessProfile) await upsertSealedProfileFromCache(supabase, userId, JSON.stringify(bundle.businessProfile))
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

  if (key === "businessProfile") return upsertSealedProfileFromCache(supabase, userId, rawValue)
  if (key === "customers") return upsertSealedCustomersFromCache(supabase, userId, rawValue)
  if (key === "invoices") return upsertSealedInvoicesFromCache(supabase, userId, rawValue)
  if (key === "products") return upsertProductsFromCache(supabase, userId, rawValue)
  if (key === "emailChangeAudit") return upsertEmailChangeAudit(supabase, userId, rawValue)
  return upsertSettingsPatch(supabase, userId, key, rawValue)
}

export async function createSealedInvoiceRecord(
  supabase: SupabaseClient,
  invoice: InvoiceRecord,
  options?: { duplicateSourceInvoiceNumber?: string }
) {
  const withLookup = withInvoiceLookupFields(invoice)
  const sealed = {
    ...withLookup,
    clientPhone: sealSensitiveFields({ value: invoice.clientPhone }, ["value"]).value as string,
    clientGST: sealSensitiveFields({ value: invoice.clientGST }, ["value"]).value as string,
  }
  const { data, error } = await supabase.rpc("create_invoice_record", {
    p_invoice: {
      ...sealed,
      duplicateSourceInvoiceNumber: options?.duplicateSourceInvoiceNumber || null,
    },
  })
  if (error) throw error
  return {
    ...((data || {}) as Partial<InvoiceRecord>),
    clientPhoneHash: withLookup.clientPhoneHash,
    clientGstHash: withLookup.clientGstHash,
    customerIdentityKey: withLookup.customerIdentityKey,
  } satisfies Partial<InvoiceRecord>
}

export async function upsertSealedInvoiceRecord(supabase: SupabaseClient, userId: string, invoice: InvoiceRecord) {
  const row = toSealedInvoiceRow(invoice, userId)
  const { error } = await supabase.from("invoices").upsert(row, { onConflict: "id", ignoreDuplicates: false })
  if (error) throw error
  await upsertInvoiceChildren(supabase, invoice)
  await syncInvoiceSequencesFromRecords(supabase, userId, [invoice])
}

export async function updateSealedInvoiceRecord(supabase: SupabaseClient, invoice: InvoiceRecord) {
  const withLookup = withInvoiceLookupFields(invoice)
  const sealed = {
    ...withLookup,
    clientPhone: sealSensitiveFields({ value: invoice.clientPhone }, ["value"]).value as string,
    clientGST: sealSensitiveFields({ value: invoice.clientGST }, ["value"]).value as string,
  }
  const { error } = await supabase.rpc("update_invoice_record", { p_invoice: sealed })
  if (error) throw error
}

export async function ensureSealedWorkspaceSeed(supabase: SupabaseClient, userId: string) {
  const [profileRes, settingsRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("user_settings").select("user_id").eq("user_id", userId).maybeSingle(),
  ])

  if (!profileRes.data) {
    const { error } = await supabase.from("profiles").upsert({ user_id: userId, onboarding_completed: false }, { onConflict: "user_id" })
    if (error) throw error
  }
  if (!settingsRes.data) {
    const { error } = await supabase.from("user_settings").upsert(
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
    if (error) throw error
  }

  await backfillSealedWorkspace(supabase, userId)
}

export async function backfillSealedWorkspace(supabase: SupabaseClient, userId: string) {
  const [profileRes, customersRes, invoicesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("customers").select("*").eq("user_id", userId),
    supabase.from("invoices").select("id,client_phone,client_phone_hash,client_gst,client_gst_hash,customer_identity_key,client_name,client_email,client_address").eq("user_id", userId),
  ])

  const profile = profileRes.data as Record<string, unknown> | null
  if (profile) {
    const profilePatch: Record<string, unknown> = {}
    for (const key of PROFILE_SENSITIVE_KEYS) {
      if (profile[key] && !isSealed(profile[key])) profilePatch[key] = sealExistingValue(profile[key])
    }
    if (Object.keys(profilePatch).length) {
      await supabase.from("profiles").update(profilePatch).eq("user_id", userId)
    }
  }

  for (const customer of (customersRes.data || []) as Array<Record<string, unknown>>) {
    const phone = plaintextForLookup(customer.phone)
    const gst = plaintextForLookup(customer.gst)
    const identityKey = createCustomerIdentityKey({
      phone,
      gst,
      name: typeof customer.name === "string" ? customer.name : "",
      email: typeof customer.email === "string" ? customer.email : "",
      address: typeof customer.address === "string" ? customer.address : "",
    })
    const phoneHash = createLookupHash(phone, "phone") || null
    const gstHash = createLookupHash(gst, "gst") || null
    const patch: Record<string, unknown> = {}
    if (identityKey && customer.identity_key !== identityKey) patch.identity_key = identityKey
    if (identityKey && customer.identity_hash !== identityKey) patch.identity_hash = identityKey
    if ((customer.phone_hash || null) !== phoneHash) patch.phone_hash = phoneHash
    if ((customer.gst_hash || null) !== gstHash) patch.gst_hash = gstHash
    if (customer.phone && !isSealed(customer.phone)) patch.phone = sealExistingValue(customer.phone)
    if (customer.gst && !isSealed(customer.gst)) patch.gst = sealExistingValue(customer.gst)
    if (Object.keys(patch).length) await supabase.from("customers").update(patch).eq("id", customer.id)
  }

  for (const invoice of (invoicesRes.data || []) as Array<Record<string, unknown>>) {
    const phone = plaintextForLookup(invoice.client_phone)
    const gst = plaintextForLookup(invoice.client_gst)
    const identityKey = createCustomerIdentityKey({
      phone,
      gst,
      name: typeof invoice.client_name === "string" ? invoice.client_name : "",
      email: typeof invoice.client_email === "string" ? invoice.client_email : "",
      address: typeof invoice.client_address === "string" ? invoice.client_address : "",
    })
    const phoneHash = createLookupHash(phone, "phone") || null
    const gstHash = createLookupHash(gst, "gst") || null
    const patch: Record<string, unknown> = {}
    if ((invoice.client_phone_hash || null) !== phoneHash) patch.client_phone_hash = phoneHash
    if ((invoice.client_gst_hash || null) !== gstHash) patch.client_gst_hash = gstHash
    if ((invoice.customer_identity_key || null) !== (identityKey || null)) patch.customer_identity_key = identityKey || null
    if (invoice.client_phone && !isSealed(invoice.client_phone)) patch.client_phone = sealExistingValue(invoice.client_phone)
    if (invoice.client_gst && !isSealed(invoice.client_gst)) patch.client_gst = sealExistingValue(invoice.client_gst)
    if (Object.keys(patch).length) await supabase.from("invoices").update(patch).eq("id", invoice.id).eq("user_id", userId)
  }
}
