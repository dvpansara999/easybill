import type { KvKey } from "./supabase/userKvSync"
import { normalizeInvoiceStorePayload, serializeInvoiceStore, type InvoiceRecord } from "./invoice"
import { mergeCustomersCache, mergeProductsCache } from "./workspaceCacheMerge"

export type WorkspaceSyncCoordinatorRepository = {
  ensureSeed(userId: string): Promise<void>
  fetchSnapshot(userId: string): Promise<Array<{ key: KvKey; value: string }>>
  fetchChanges(
    userId: string,
    changedSince: string | null,
    currentValues: Partial<Record<"products" | "customers" | "invoices", string | null>>
  ): Promise<Array<{ key: KvKey; value: string }>>
}

export type WorkspaceSyncCoordinatorCache = {
  clearUser(userId: string): void
  getUserItem(key: KvKey, userId: string): string | null
  isHydrated(userId: string): boolean
  primeUser(userId: string, entries: Array<{ key: string; value: string }>): void
  readWatermark(userId: string): string | null
  writeWatermark(userId: string, value: string): void
}

export type WorkspaceSyncCoordinatorAuth = {
  getCurrentUser(): Promise<{ id: string } | null>
  getActiveUserId(): string | null
  setActiveUserId(userId: string | null): void
  onAuthStateChange(callback: (user: { id: string } | null) => void): { unsubscribe(): void }
}

export type WorkspaceSyncCoordinatorEvents = {
  emitCloudSync(): void
  emitAuthSyncInitialized(): void
  emitWorkspaceSyncStatus?(status: {
    state: "syncing" | "synced" | "pending" | "error" | "conflict"
    label: string
    key?: KvKey | "workspace"
    detail?: string
  }): void
  onFocus(callback: () => void): () => void
  isVisible(): boolean
}

export type WorkspaceSyncCoordinatorAlerts = {
  accountChanged(): void
  signedOut(): void
}

export type WorkspaceSyncCoordinatorOptions = {
  auth: WorkspaceSyncCoordinatorAuth
  cache: WorkspaceSyncCoordinatorCache
  repository: WorkspaceSyncCoordinatorRepository
  syncService: { replayQueued(userId?: string): Promise<void> }
  events: WorkspaceSyncCoordinatorEvents
  alerts?: WorkspaceSyncCoordinatorAlerts
  logger?: Pick<Console, "warn">
  clock?: () => Date
  focusResyncMinMs?: number
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function invoiceChangedAt(invoice: InvoiceRecord) {
  return Date.parse(invoice.updated_at || invoice.deleted_at || invoice.createdAt || "") || 0
}

function mergeInvoiceSnapshot(currentRaw: string | null, remoteRaw: string) {
  const current = normalizeInvoiceStorePayload(safeJsonParse<unknown>(currentRaw, [])).store.invoices
  const remote = normalizeInvoiceStorePayload(safeJsonParse<unknown>(remoteRaw, [])).store.invoices
  const byId = new Map(current.map((invoice) => [invoice.id, invoice]))

  for (const remoteInvoice of remote) {
    const localInvoice = byId.get(remoteInvoice.id)
    if (!localInvoice || invoiceChangedAt(remoteInvoice) >= invoiceChangedAt(localInvoice)) {
      byId.set(remoteInvoice.id, remoteInvoice)
    }
  }

  return serializeInvoiceStore(Array.from(byId.values()))
}

export function createWorkspaceSyncCoordinator({
  auth,
  cache,
  repository,
  syncService,
  events,
  alerts,
  logger = console,
  clock = () => new Date(),
  focusResyncMinMs = 300_000,
}: WorkspaceSyncCoordinatorOptions) {
  let lastUserId: string | null = null
  let lastFocusSyncAt = 0
  const syncInFlight = new Map<string, Promise<void>>()

  function mergeSnapshotRows(userId: string, rows: Array<{ key: KvKey; value: string }>) {
    return rows.map((row) => {
      if (row.key === "products") {
        return {
          ...row,
          value: mergeProductsCache(
            cache.getUserItem("products", userId),
            safeJsonParse(row.value, [])
          ),
        }
      }
      if (row.key === "customers") {
        return {
          ...row,
          value: mergeCustomersCache(
            cache.getUserItem("customers", userId),
            safeJsonParse(row.value, [])
          ),
        }
      }
      if (row.key === "invoices") {
        return {
          ...row,
          value: mergeInvoiceSnapshot(cache.getUserItem("invoices", userId), row.value),
        }
      }
      return row
    })
  }

  async function sync(userId: string, options: { incremental?: boolean } = {}) {
    const existing = syncInFlight.get(userId)
    if (existing) {
      await existing
      return
    }

    const work = (async () => {
      lastFocusSyncAt = clock().getTime()
      events.emitWorkspaceSyncStatus?.({ state: "syncing", label: "Syncing", key: "workspace" })
      await repository.ensureSeed(userId)
      await syncService.replayQueued(userId)
      const watermark = cache.readWatermark(userId)
      const canIncremental = Boolean(options.incremental && watermark && cache.isHydrated(userId))
      const rows = canIncremental
        ? await repository.fetchChanges(userId, watermark, {
            products: cache.getUserItem("products", userId),
            customers: cache.getUserItem("customers", userId),
            invoices: cache.getUserItem("invoices", userId),
          })
        : await repository.fetchSnapshot(userId)
      const rowsToPrime = canIncremental ? rows : mergeSnapshotRows(userId, rows)

      if (!canIncremental) cache.clearUser(userId)
      cache.primeUser(userId, rowsToPrime)
      cache.writeWatermark(userId, clock().toISOString())
      events.emitCloudSync()
      events.emitWorkspaceSyncStatus?.({ state: "synced", label: "Saved to Cloud", key: "workspace" })
    })()

    syncInFlight.set(userId, work)
    try {
      await work
    } finally {
      syncInFlight.delete(userId)
    }
  }

  async function initialize() {
    const user = await auth.getCurrentUser()
    lastUserId = user?.id || null
    auth.setActiveUserId(user?.id || null)

    if (!user) {
      events.emitAuthSyncInitialized()
      return
    }

    await sync(user.id)
    events.emitAuthSyncInitialized()
  }

  function runBackground(label: string, callback: () => Promise<void>) {
    void callback().catch((error) => {
      logger.warn(`Workspace sync ${label} failed`, error)
      events.emitWorkspaceSyncStatus?.({
        state: "error",
        label: "Sync Failed - Retry",
        key: "workspace",
        detail: error instanceof Error ? error.message : String(error),
      })
      events.emitAuthSyncInitialized()
    })
  }

  function handleAuthChange(user: { id: string } | null) {
    const nextId = user?.id || null
    const prevId = lastUserId
    const tabKnownId = auth.getActiveUserId()
    lastUserId = nextId
    auth.setActiveUserId(nextId)

    if (prevId && prevId !== nextId) cache.clearUser(prevId)
    if (nextId) {
      runBackground("after auth change", () => sync(nextId))
    } else {
      events.emitCloudSync()
      events.emitWorkspaceSyncStatus?.({ state: "pending", label: "Pending Sync", key: "workspace" })
    }

    const switchedFromAnotherTab = Boolean(prevId && nextId && prevId !== nextId && tabKnownId === prevId)
    const signedOutFromAnotherTab = Boolean(prevId && !nextId && tabKnownId === prevId)
    if (switchedFromAnotherTab) alerts?.accountChanged()
    if (signedOutFromAnotherTab) alerts?.signedOut()
  }

  function handleFocus() {
    const id = lastUserId
    if (!id) return
    if (!events.isVisible()) return
    const now = clock().getTime()
    if (now - lastFocusSyncAt < focusResyncMinMs) return
    runBackground("on focus", () => sync(id, { incremental: true }))
  }

  function start() {
    const authSubscription = auth.onAuthStateChange(handleAuthChange)
    const removeFocus = events.onFocus(handleFocus)
    runBackground("initialization", initialize)

    return () => {
      removeFocus()
      authSubscription.unsubscribe()
    }
  }

  return { start, sync }
}
