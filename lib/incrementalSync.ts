export type SyncStatus = "pending" | "syncing" | "synced" | "error" | "conflict"

export type SyncMetadata = {
  id: string
  updated_at?: string | null
  deleted_at?: string | null
  sync_status?: SyncStatus | string | null
  last_synced_at?: string | null
}

export type IncrementalSyncPlan<T extends SyncMetadata> = {
  localToPush: T[]
  remoteToApply: T[]
  conflicts: Array<{
    id: string
    winner: "local" | "remote"
    local: T
    remote: T
  }>
}

function timestampMs(value: string | null | undefined) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function recordChangedAt(record: SyncMetadata) {
  return Math.max(timestampMs(record.updated_at), timestampMs(record.deleted_at))
}

export function isLocalRecordDirty(record: SyncMetadata) {
  if (record.sync_status && record.sync_status !== "synced") return true
  const lastSyncedAt = timestampMs(record.last_synced_at)
  if (!lastSyncedAt) return true
  return recordChangedAt(record) > lastSyncedAt
}

export function resolveLastWriteWins<T extends SyncMetadata>(
  local: T,
  remote: T
): { winner: "local" | "remote"; record: T; conflict: boolean } {
  const localChangedAt = recordChangedAt(local)
  const remoteChangedAt = recordChangedAt(remote)

  if (localChangedAt > remoteChangedAt) {
    return { winner: "local", record: local, conflict: true }
  }

  if (remoteChangedAt > localChangedAt) {
    return { winner: "remote", record: remote, conflict: true }
  }

  // Deterministic tie-breaker: remote wins so every device converges on the same value.
  return { winner: "remote", record: remote, conflict: false }
}

export function buildIncrementalSyncPlan<T extends SyncMetadata>(
  localRecords: T[],
  remoteChangedRecords: T[]
): IncrementalSyncPlan<T> {
  const remoteById = new Map(remoteChangedRecords.map((record) => [record.id, record]))
  const localById = new Map(localRecords.map((record) => [record.id, record]))
  const localToPush: T[] = []
  const remoteToApply: T[] = []
  const conflicts: IncrementalSyncPlan<T>["conflicts"] = []

  for (const local of localRecords) {
    const remote = remoteById.get(local.id)
    if (!remote) {
      if (isLocalRecordDirty(local)) localToPush.push(local)
      continue
    }

    const result = resolveLastWriteWins(local, remote)
    if (result.conflict) {
      conflicts.push({ id: local.id, winner: result.winner, local, remote })
    }
    if (result.winner === "local") {
      if (isLocalRecordDirty(local)) localToPush.push(local)
    } else {
      remoteToApply.push(remote)
    }
  }

  for (const remote of remoteChangedRecords) {
    if (!localById.has(remote.id)) {
      remoteToApply.push(remote)
    }
  }

  return { localToPush, remoteToApply, conflicts }
}

