import type { SupabaseClient } from "@supabase/supabase-js"
import { revealSensitiveDataFromStorage } from "@/lib/sensitiveData"
import { LOGO_BUCKET, getOwnedLogoStoragePath } from "@/lib/logoStorage"
import { INVOICE_PDF_BUCKET } from "@/lib/server/invoicePdfExportConfig"

type StorageObjectRow = {
  name: string
  created_at?: string | null
}

type InvoicePdfExportDbRow = {
  id: string
  invoice_id?: string | null
  storage_path?: string | null
  created_at?: string | null
}

type UserKvRow = {
  user_id: string
  key: string
  value: unknown
}

const STORAGE_BATCH_SIZE = 1000

function storageSchema(admin: SupabaseClient) {
  return admin.schema("storage")
}

export async function listBucketObjects(admin: SupabaseClient, bucket: string) {
  const rows: StorageObjectRow[] = []
  let from = 0

  for (;;) {
    const to = from + STORAGE_BATCH_SIZE - 1
    const query = await storageSchema(admin)
      .from("objects")
      .select("name, created_at")
      .eq("bucket_id", bucket)
      .order("name", { ascending: true })
      .range(from, to)

    if (query.error) {
      throw new Error(query.error.message)
    }

    const batch = (query.data || []) as StorageObjectRow[]
    rows.push(...batch)
    if (batch.length < STORAGE_BATCH_SIZE) break
    from += STORAGE_BATCH_SIZE
  }

  return rows
}

export async function fetchAllInvoicePdfExportRows(admin: SupabaseClient) {
  const rows: InvoicePdfExportDbRow[] = []
  let from = 0

  for (;;) {
    const to = from + STORAGE_BATCH_SIZE - 1
    const query = await admin
      .from("invoice_pdf_exports")
      .select("id, invoice_id, storage_path, created_at")
      .order("created_at", { ascending: false })
      .range(from, to)

    if (query.error) {
      throw new Error(query.error.message)
    }

    const batch = (query.data || []) as InvoicePdfExportDbRow[]
    rows.push(...batch)
    if (batch.length < STORAGE_BATCH_SIZE) break
    from += STORAGE_BATCH_SIZE
  }

  return rows
}

export async function deleteStorageObjects(admin: SupabaseClient, bucket: string, paths: string[]) {
  let deleted = 0

  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100)
    if (!chunk.length) continue
    const { error } = await admin.storage.from(bucket).remove(chunk)
    if (error) {
      throw new Error(error.message)
    }
    deleted += chunk.length
  }

  return deleted
}

export function buildPdfExportReferenceSet(rows: Array<{ storage_path?: string | null }>) {
  return new Set(rows.map((row) => row.storage_path).filter((value): value is string => Boolean(value)))
}

function parseJsonLoose(raw: unknown) {
  if (typeof raw !== "string" || !raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function extractBusinessProfileFromKvRow(row: UserKvRow) {
  if (row.key === "businessProfile") {
    const raw = typeof row.value === "string" ? row.value : JSON.stringify(row.value)
    const revealed = revealSensitiveDataFromStorage("businessProfile", raw)
    const parsed = parseJsonLoose(revealed)
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null
  }

  if (row.key === "accountSetupBundle") {
    const bundle = parseJsonLoose(typeof row.value === "string" ? row.value : JSON.stringify(row.value))
    if (!bundle || typeof bundle !== "object") return null
    const businessRaw = (bundle as Record<string, unknown>).businessProfile
    if (typeof businessRaw !== "string") return null
    const revealed = revealSensitiveDataFromStorage("businessProfile", businessRaw)
    const parsed = parseJsonLoose(revealed)
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null
  }

  return null
}

export async function buildReferencedLogoPathSet(admin: SupabaseClient) {
  const rows: UserKvRow[] = []
  let from = 0

  for (;;) {
    const to = from + STORAGE_BATCH_SIZE - 1
    const query = await admin
      .from("user_kv")
      .select("user_id, key, value")
      .in("key", ["businessProfile", "accountSetupBundle"])
      .order("created_at", { ascending: false })
      .range(from, to)

    if (query.error) {
      throw new Error(query.error.message)
    }

    const batch = (query.data || []) as UserKvRow[]
    rows.push(...batch)
    if (batch.length < STORAGE_BATCH_SIZE) break
    from += STORAGE_BATCH_SIZE
  }

  const latestByUser = new Map<string, Record<string, unknown>>()
  for (const row of rows) {
    if (latestByUser.has(row.user_id)) continue
    const businessProfile = extractBusinessProfileFromKvRow(row)
    if (businessProfile) {
      latestByUser.set(row.user_id, businessProfile)
    }
  }

  const referenced = new Set<string>()
  for (const [userId, profile] of latestByUser.entries()) {
    const logo = typeof profile.logo === "string" ? profile.logo.trim() : ""
    if (!logo) continue
    const storagePath = getOwnedLogoStoragePath(logo, userId)
    if (storagePath) referenced.add(storagePath)
  }

  return referenced
}

export function filterOldUnreferencedObjects(
  objects: StorageObjectRow[],
  referencedPaths: Set<string>,
  olderThanIso: string
) {
  const cutoff = Date.parse(olderThanIso)
  return objects.filter((row) => {
    if (!row.name || referencedPaths.has(row.name)) return false
    const created = Date.parse(String(row.created_at || ""))
    return Number.isFinite(created) && created < cutoff
  })
}

export const STORAGE_BUCKETS = {
  pdf: INVOICE_PDF_BUCKET,
  logo: LOGO_BUCKET,
} as const
