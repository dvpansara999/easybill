export type TombstoneRecord = {
  id?: string
  updated_at?: string
  deleted_at?: string
  sync_status?: string
  last_synced_at?: string
}

export function createWorkspaceRecordId(prefix: string) {
  const raw =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`

  return `${prefix}_${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`
}

export function activeRecords<T extends TombstoneRecord>(records: T[]) {
  return records.filter((record) => !record.deleted_at)
}

export function ensureRecordIds<T extends TombstoneRecord>(records: T[], prefix: string) {
  return records.map((record) => ({
    ...record,
    id: record.id || createWorkspaceRecordId(prefix),
  }))
}

export function markRecordDeleted<T extends TombstoneRecord>(records: T[], id: string, deletedAt = new Date().toISOString()) {
  return records.map((record) =>
    record.id === id
      ? {
          ...record,
          deleted_at: deletedAt,
          updated_at: deletedAt,
          sync_status: "pending",
        }
      : record
  )
}

export function mergeActiveWithExistingTombstones<T extends TombstoneRecord>(existing: T[], active: T[], prefix: string) {
  const activeWithIds = ensureRecordIds(active, prefix)
  const activeIds = new Set(activeWithIds.map((record) => record.id))
  const tombstones = existing.filter((record) => record.deleted_at && record.id && !activeIds.has(record.id))
  return [...tombstones, ...activeWithIds]
}

