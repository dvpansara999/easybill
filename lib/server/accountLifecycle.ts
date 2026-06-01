import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  ACCOUNT_OWNED_STORAGE_BUCKETS,
  PRESERVED_RESET_SETTINGS_FIELDS,
} from "@/lib/server/accountOwnershipRegistry"
import { DEFAULT_RESET_MONTH_DAY } from "@/lib/invoiceResetDate"
import { DEFAULT_INVOICE_VISIBILITY } from "@/lib/invoiceVisibilityShared"

export type AccountLifecycleAction = "reset" | "delete"
export type AccountLifecycleVerification = {
  password?: string
  otp?: string
  phrase?: string
}

const LIFECYCLE_LOCKED_MESSAGE = "Account deletion in progress. New workspace changes are disabled until cleanup finishes."

type PreservedSettings = {
  subscription_plan_id?: string | null
  invoice_usage_count?: number | null
  invoice_usage_initialized?: boolean | null
}

function requireAdmin() {
  const admin = createSupabaseAdminClient()
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.")
  return admin
}

function createAnonAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) throw new Error("Missing Supabase public environment variables.")
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
}

function assertPhrase(action: AccountLifecycleAction, phrase?: string) {
  const expected = action === "reset" ? "RESET" : "DELETE"
  if (phrase !== expected) throw new Error(`Type ${expected} to confirm.`)
}

async function verifyLifecycleProof(user: { id: string; email?: string | null }, action: AccountLifecycleAction, verification: AccountLifecycleVerification) {
  assertPhrase(action, verification.phrase)
  const email = user.email || ""
  if (!email) throw new Error("Account email is required for verification.")

  const auth = createAnonAuthClient()
  if (verification.password) {
    const { error } = await auth.auth.signInWithPassword({ email, password: verification.password })
    if (error) throw new Error("Current password is incorrect.")
    return
  }

  if (verification.otp) {
    const { error } = await auth.auth.verifyOtp({ email, token: verification.otp, type: "email" })
    if (error) throw new Error("OTP verification failed.")
    return
  }

  throw new Error("Verify with your password or email OTP before continuing.")
}

export async function requestAccountLifecycleOtp(user: { email?: string | null }) {
  const email = user.email || ""
  if (!email) throw new Error("Account email is required for OTP verification.")
  const auth = createAnonAuthClient()
  const { error } = await auth.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })
  if (error) throw error
}

export async function assertAccountLifecycleUnlocked(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("account_lifecycle_locks")
    .select("account_deleting, operation")
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  if (data?.account_deleting || data?.operation === "resetting") throw new Error(LIFECYCLE_LOCKED_MESSAGE)
}

async function acquireLifecycleLock(admin: SupabaseClient, userId: string, action: AccountLifecycleAction) {
  const { data: existing, error: readError } = await admin
    .from("account_lifecycle_locks")
    .select("operation, account_deleting")
    .eq("user_id", userId)
    .maybeSingle()
  if (readError) throw readError
  if (existing?.account_deleting || existing?.operation === "resetting") {
    throw new Error("An account cleanup operation is already in progress.")
  }

  const { error } = await admin.from("account_lifecycle_locks").upsert(
    {
      user_id: userId,
      operation: action === "delete" ? "deleting" : "resetting",
      account_deleting: action === "delete",
      locked_at: new Date().toISOString(),
      last_error: null,
    },
    { onConflict: "user_id" }
  )
  if (error) throw error
}

async function releaseResetLock(admin: SupabaseClient, userId: string) {
  const { error } = await admin.from("account_lifecycle_locks").upsert(
    {
      user_id: userId,
      operation: "idle",
      account_deleting: false,
      locked_at: null,
      last_error: null,
    },
    { onConflict: "user_id" }
  )
  if (error) throw error
}

async function markLifecycleFailure(admin: SupabaseClient, userId: string, error: unknown) {
  await admin
    .from("account_lifecycle_locks")
    .update({ last_error: error instanceof Error ? error.message : String(error) })
    .eq("user_id", userId)
}

async function listUserStoragePaths(admin: SupabaseClient, bucket: string, userId: string) {
  const rows: Array<{ name: string }> = []
  let from = 0
  for (;;) {
    const to = from + 999
    const { data, error } = await admin
      .schema("storage")
      .from("objects")
      .select("name")
      .eq("bucket_id", bucket)
      .like("name", `${userId}/%`)
      .range(from, to)
    if (error) throw error
    rows.push(...((data || []) as Array<{ name: string }>))
    if (!data || data.length < 1000) break
    from += 1000
  }
  return rows.map((row) => row.name).filter(Boolean)
}

async function deleteUserStorage(admin: SupabaseClient, userId: string) {
  for (const entry of ACCOUNT_OWNED_STORAGE_BUCKETS) {
    const paths = await listUserStoragePaths(admin, entry.bucket, userId)
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100)
      if (!chunk.length) continue
      const { error } = await admin.storage.from(entry.bucket).remove(chunk)
      if (error) throw error
    }
  }
}

async function readPreservedSettings(admin: SupabaseClient, userId: string): Promise<PreservedSettings> {
  const { data, error } = await admin
    .from("user_settings")
    .select(PRESERVED_RESET_SETTINGS_FIELDS.join(","))
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  return (data || {}) as PreservedSettings
}

async function deleteBusinessRows(admin: SupabaseClient, userId: string) {
  const invoiceIdsResult = await admin.from("invoices").select("id").eq("user_id", userId)
  if (invoiceIdsResult.error) throw invoiceIdsResult.error
  const invoiceIds = (invoiceIdsResult.data || []).map((row) => String(row.id)).filter(Boolean)

  if (invoiceIds.length) {
    for (const table of ["invoice_history", "invoice_items"]) {
      const { error } = await admin.from(table).delete().in("invoice_id", invoiceIds)
      if (error) throw error
    }
  }

  for (const table of [
    "invoice_pdf_exports",
    "invoices",
    "invoice_sequences",
    "products",
    "customers",
    "profiles",
    "user_settings",
  ]) {
    const { error } = await admin.from(table).delete().eq("user_id", userId)
    if (error) throw error
  }
}

async function recreateResetDefaults(admin: SupabaseClient, userId: string, preserved: PreservedSettings) {
  const profileResult = await admin.from("profiles").upsert(
    {
      user_id: userId,
      onboarding_completed: true,
      business_name: "",
      phone: "",
      email: "",
      gst: "",
      address: "",
      bank_name: "",
      account_number: "",
      ifsc: "",
      upi: "",
      terms: "",
      logo_storage_path: null,
      logo_shape: "square",
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (profileResult.error) throw profileResult.error

  const settingsResult = await admin.from("user_settings").upsert(
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
      invoice_template: "",
      template_typography: "",
      template_font_id: "",
      template_font_size: 10,
      subscription_plan_id: preserved.subscription_plan_id || "free",
      invoice_usage_count: preserved.invoice_usage_count ?? 0,
      invoice_usage_initialized: preserved.invoice_usage_initialized ?? false,
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (settingsResult.error) throw settingsResult.error
}

export async function resetWorkspaceAccount(user: { id: string; email?: string | null }, verification: AccountLifecycleVerification) {
  await verifyLifecycleProof(user, "reset", verification)
  const admin = requireAdmin()
  await acquireLifecycleLock(admin, user.id, "reset")
  try {
    const preserved = await readPreservedSettings(admin, user.id)
    await deleteUserStorage(admin, user.id)
    await deleteBusinessRows(admin, user.id)
    await recreateResetDefaults(admin, user.id, preserved)
    await releaseResetLock(admin, user.id)
  } catch (error) {
    await markLifecycleFailure(admin, user.id, error)
    await releaseResetLock(admin, user.id).catch(() => {})
    throw error
  }
}

export async function deleteWorkspaceAccount(user: { id: string; email?: string | null }, verification: AccountLifecycleVerification) {
  await verifyLifecycleProof(user, "delete", verification)
  const admin = requireAdmin()
  await acquireLifecycleLock(admin, user.id, "delete")
  try {
    await deleteUserStorage(admin, user.id)
    await deleteBusinessRows(admin, user.id)
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error
  } catch (error) {
    await markLifecycleFailure(admin, user.id, error)
    throw error
  }
}
