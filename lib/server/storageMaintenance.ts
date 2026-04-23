import type { SupabaseClient } from "@supabase/supabase-js"
import { LOGO_BUCKET } from "@/lib/logoStorage"
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

type ProfileRow = {
  user_id: string
  logo_storage_path?: string | null
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

export async function buildReferencedLogoPathSet(admin: SupabaseClient) {
  const rows: ProfileRow[] = []
  let from = 0

  for (;;) {
    const to = from + STORAGE_BATCH_SIZE - 1
    const query = await admin
      .from("profiles")
      .select("user_id, logo_storage_path")
      .range(from, to)

    if (query.error) {
      throw new Error(query.error.message)
    }

    const batch = (query.data || []) as ProfileRow[]
    rows.push(...batch)
    if (batch.length < STORAGE_BATCH_SIZE) break
    from += STORAGE_BATCH_SIZE
  }

  const referenced = new Set<string>()
  for (const row of rows) {
    const storagePath = typeof row.logo_storage_path === "string" ? row.logo_storage_path.trim() : ""
    if (storagePath) referenced.add(storagePath)
  }

  return referenced
}

export async function buildReferencedInvoiceIdsByUser(admin: SupabaseClient) {
  const rows: Array<{ user_id: string; id: string }> = []
  let from = 0

  for (;;) {
    const to = from + STORAGE_BATCH_SIZE - 1
    const query = await admin
      .from("invoices")
      .select("user_id, id")
      .range(from, to)

    if (query.error) {
      throw new Error(query.error.message)
    }

    const batch = (query.data || []) as Array<{ user_id: string; id: string }>
    rows.push(...batch)
    if (batch.length < STORAGE_BATCH_SIZE) break
    from += STORAGE_BATCH_SIZE
  }

  const invoiceIdsByUser = new Map<string, Set<string>>()

  for (const row of rows) {
    const target = invoiceIdsByUser.get(row.user_id) || new Set<string>()
    if (row.id) target.add(row.id)
    invoiceIdsByUser.set(row.user_id, target)
  }

  return invoiceIdsByUser
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
