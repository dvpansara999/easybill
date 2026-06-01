"use client"

import type { Session } from "@supabase/supabase-js"
import { getActiveUserId, setActiveUserId } from "@/lib/auth"
import { getAuthMode } from "@/lib/runtimeMode"
import { createWorkspaceDataAccess, type WorkspaceDataAccess } from "@/lib/dataAccess"
import { createSupabaseBrowserClient, getSupabaseUser } from "@/lib/supabase/browser"
import type { KvKey } from "@/lib/supabase/userKvSync"
import { createSyncService, createSupabaseSyncRepository, type SyncService } from "@/lib/syncService"
import {
  clearUserKvCache,
  getActiveOrGlobalItem,
  getUserItem,
  isUserWorkspaceReady,
  isUserKvHydrated,
  primeUserKvCache,
  primeUserWorkspaceCache,
  readUserSyncWatermark,
  removeActiveOrGlobalItem,
  replayQueuedCloudSync,
  setActiveOrGlobalItem,
  writeUserSyncWatermark,
} from "@/lib/userStore"
import { createWorkspaceSyncCoordinator } from "@/lib/workspaceSyncCoordinator"
import { publishWorkspaceSyncStatus } from "@/lib/workspaceSyncStatus"
import { validateCustomerForPersistence, validateInvoiceForPersistence, validateProductForPersistence, valid } from "@/lib/workspaceValidation"
import type { InvoiceRecord } from "@/lib/invoice"

let syncService: SyncService | null = null
let dataAccess: WorkspaceDataAccess | null = null
let syncCoordinator: ReturnType<typeof createWorkspaceSyncCoordinator> | null = null
let syncCoordinatorAlerts: BrowserWorkspaceSyncAlerts = {
  accountChanged() {},
  signedOut() {},
}

type BrowserWorkspaceSyncAlerts = {
  accountChanged(): void
  signedOut(): void
}

const WORKSPACE_READY_KEYS: KvKey[] = ["accountSetupBundle", "businessProfile"]
const WORKSPACE_READY_TIMEOUT_MS = 60_000

async function workspaceApi<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const raw = await response.text()
  const payload = (raw ? safeJsonParse<{ error?: string } & T>(raw, {} as { error?: string } & T) : ({} as { error?: string } & T))
  if (!response.ok) {
    const fallback = raw.trim().replace(/\s+/g, " ").slice(0, 240)
    throw new Error(payload.error || fallback || `Workspace sync failed with HTTP ${response.status}.`)
  }
  return payload
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function createBrowserWorkspaceEvents() {
  return {
    emitWorkspaceWrite(key: KvKey) {
      window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key } }))
    },
    emitWorkspaceSyncStatus: publishWorkspaceSyncStatus,
  }
}

export function getBrowserWorkspaceSyncService() {
  if (!syncService) {
    const supabase = createSupabaseBrowserClient()
    syncService = createSyncService({
      cache: {
        get: getActiveOrGlobalItem,
        set: setActiveOrGlobalItem,
        remove: removeActiveOrGlobalItem,
      },
      repository: createSupabaseSyncRepository({
        pushKey(userId, key, rawValue) {
          void supabase
          return workspaceApi<void>({ op: "pushKey", userId, key, rawValue })
        },
        deleteKey(userId, key) {
          void supabase
          return workspaceApi<void>({ op: "deleteKey", userId, key })
        },
      }),
      validators: {
        validatePush(key, rawValue) {
          if (key === "products") {
            try {
              const rows = JSON.parse(rawValue) as Array<Record<string, unknown>>
              for (const row of Array.isArray(rows) ? rows : []) {
                if (!row.deleted_at) {
                  const result = validateProductForPersistence(row)
                  if (!result.ok) return result
                }
              }
            } catch {
              return { ok: false, message: "Products cache is not valid JSON." }
            }
          }
          if (key === "customers") {
            try {
              const rows = JSON.parse(rawValue) as Array<Record<string, unknown>>
              for (const row of Array.isArray(rows) ? rows : []) {
                if (!row.deleted_at) {
                  const result = validateCustomerForPersistence(row)
                  if (!result.ok) return result
                }
              }
            } catch {
              return { ok: false, message: "Customers cache is not valid JSON." }
            }
          }
          return valid()
        },
      },
      logger: {
        info(message, details) {
          console.info(message, details)
        },
        warn(message, details) {
          console.warn(message, details)
        },
        error(message, details) {
          console.warn(message, details)
        },
      },
    })
  }
  return syncService
}

export function getWorkspaceDataAccess() {
  if (!dataAccess) {
    const supabase = createSupabaseBrowserClient()
    dataAccess = createWorkspaceDataAccess({
      cache: {
        get: getActiveOrGlobalItem,
        set: setActiveOrGlobalItem,
        remove: removeActiveOrGlobalItem,
      },
      sync: getBrowserWorkspaceSyncService(),
      repository: {
        listInvoices(userId) {
          void supabase
          return workspaceApi<{ invoices: InvoiceRecord[] }>({ op: "listInvoices", userId }).then((result) => result.invoices)
        },
        createInvoiceRecord(userId, invoice, options) {
          void supabase
          return workspaceApi<{ meta: Partial<InvoiceRecord> }>({ op: "createInvoice", userId, invoice, options }).then((result) => result.meta)
        },
        updateInvoiceRecord(userId, invoice) {
          void supabase
          return workspaceApi<void>({ op: "updateInvoice", userId, invoice })
        },
        softDeleteInvoiceRecord(userId, invoiceId) {
          void supabase
          return workspaceApi<{ deleted: boolean }>({ op: "softDeleteInvoice", userId, invoiceId }).then((result) => result.deleted)
        },
      },
      auth: {
        getUserId: getActiveUserId,
        isCloudMode() {
          return getAuthMode() === "supabase"
        },
      },
      events: createBrowserWorkspaceEvents(),
      validators: {
        validateInvoice: validateInvoiceForPersistence,
      },
    })
  }
  return dataAccess
}

export async function ensureInvoiceRecordForPdf(invoice: InvoiceRecord) {
  const userId = getActiveUserId()
  if (!userId || getAuthMode() !== "supabase") return
  await workspaceApi<void>({ op: "upsertInvoice", userId, invoice })
}

function hasWorkspaceReadyEntries(userId: string) {
  return WORKSPACE_READY_KEYS.every((key) => getUserItem(key, userId) != null)
}

function createWorkspaceLoadTimeout(timeoutMs: number) {
  return new Promise<never>((_, reject) => {
    window.setTimeout(() => {
      reject(new Error("Unable to load workspace. Check your connection and try again."))
    }, timeoutMs)
  })
}

async function fetchWorkspaceReadyEntries(userId: string) {
  const { entries } = await workspaceApi<{ entries: Array<{ key: KvKey; value: string }> }>({
    op: "fetchWorkspaceReady",
    userId,
  })
  return entries
}

async function loadWorkspaceReady(userId: string) {
  await workspaceApi<void>({ op: "ensureSeed", userId })
  const entries = await fetchWorkspaceReadyEntries(userId)
  primeUserWorkspaceCache(userId, entries)
  writeUserSyncWatermark(userId, new Date().toISOString())
  window.dispatchEvent(new Event("easybill:workspace-ready"))
  window.dispatchEvent(new Event("easybill:cloud-sync"))
  publishWorkspaceSyncStatus({ state: "syncing", label: "Loading Data", key: "workspace" })
  void createBrowserWorkspaceSyncCoordinator().sync(userId).catch((error: unknown) => {
    publishWorkspaceSyncStatus({
      state: "error",
      label: "Sync Failed - Retry",
      key: "workspace",
      detail: error instanceof Error ? error.message : String(error),
    })
  })
}

export function isWorkspaceReadyForNavigation(userId: string) {
  return isUserWorkspaceReady(userId) && hasWorkspaceReadyEntries(userId) && Boolean(readUserSyncWatermark(userId))
}

export async function ensureWorkspaceReadyForNavigation(
  userId: string,
  options: { timeoutMs?: number } = {}
) {
  if (getAuthMode() !== "supabase") return
  setActiveUserId(userId)
  const timeoutMs = options.timeoutMs ?? WORKSPACE_READY_TIMEOUT_MS
  if (isWorkspaceReadyForNavigation(userId)) return
  await Promise.race([loadWorkspaceReady(userId), createWorkspaceLoadTimeout(timeoutMs)])
  if (!isWorkspaceReadyForNavigation(userId)) {
    throw new Error("Workspace data was not confirmed by the server.")
  }
}

export function createBrowserWorkspaceSyncCoordinator(alerts?: BrowserWorkspaceSyncAlerts) {
  if (alerts) syncCoordinatorAlerts = alerts
  if (syncCoordinator) return syncCoordinator

  const supabase = createSupabaseBrowserClient()
  syncCoordinator = createWorkspaceSyncCoordinator({
    auth: {
      async getCurrentUser() {
        const { data } = await getSupabaseUser()
        return data.user ? { id: data.user.id } : null
      },
      getActiveUserId,
      setActiveUserId,
      onAuthStateChange(callback) {
        const { data: sub } = supabase.auth.onAuthStateChange((_evt: string, session: Session | null) => {
          callback(session?.user ? { id: session.user.id } : null)
        })
        return {
          unsubscribe() {
            sub.subscription.unsubscribe()
          },
        }
      },
    },
    cache: {
      clearUser: clearUserKvCache,
      getUserItem,
      isHydrated: isUserKvHydrated,
      primeUser: primeUserKvCache,
      readWatermark: readUserSyncWatermark,
      writeWatermark: writeUserSyncWatermark,
    },
    repository: {
      ensureSeed(userId) {
        void supabase
        return workspaceApi<void>({ op: "ensureSeed", userId })
      },
      fetchSnapshot(userId) {
        void supabase
        return workspaceApi<{ entries: Array<{ key: KvKey; value: string }> }>({ op: "fetchSnapshot", userId }).then((result) => result.entries)
      },
      async fetchChanges(userId, changedSince, currentValues) {
        void supabase
        return workspaceApi<{ entries: Array<{ key: KvKey; value: string }> }>({
          op: "fetchChanges",
          userId,
          changedSince,
          currentValues,
        }).then((result) => result.entries)
      },
    },
    syncService: {
      replayQueued: replayQueuedCloudSync,
    },
    events: {
      emitCloudSync() {
        window.dispatchEvent(new Event("easybill:cloud-sync"))
      },
      emitAuthSyncInitialized() {
        window.dispatchEvent(new Event("easybill:auth-sync-initialized"))
      },
      emitWorkspaceSyncStatus: publishWorkspaceSyncStatus,
      onFocus(callback) {
        window.addEventListener("focus", callback)
        return () => window.removeEventListener("focus", callback)
      },
      isVisible() {
        return document.visibilityState === "visible"
      },
    },
    alerts: {
      accountChanged() {
        syncCoordinatorAlerts.accountChanged()
      },
      signedOut() {
        syncCoordinatorAlerts.signedOut()
      },
    },
  })
  return syncCoordinator
}
