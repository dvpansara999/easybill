import { getActiveUserId } from "@/lib/auth"
import { getSupabaseUser } from "@/lib/supabase/browser"
import { KV_KEYS, type KvKey } from "@/lib/supabase/userKvSync";
import { createSupabaseSyncRepository, createSyncService, type SyncService } from "@/lib/syncService"
import { clearLocalStorageSyncRetryQueue } from "@/lib/syncRetryQueue"
import { getAuthMode } from "@/lib/runtimeMode"
import { scopedKey } from "@/lib/scopedKey"
import { protectSensitiveDataForStorage, revealSensitiveDataFromStorage } from "@/lib/sensitiveData"

const PUSH_DEBOUNCE_MS = 600
const pendingTimers = new Map<string, number>()
let syncService: SyncService | null = null
const ACCOUNT_SETUP_BUNDLE_KEY = "accountSetupBundle"
const TEMP_SETUP_KEY_PREFIX = "easybill:preauth:"
const BUNDLED_KEYS = new Set([
  "businessProfile",
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
])

// Supabase-first cache: avoids localStorage as the primary store in cloud mode.
// Keyed as `${userId}:${key}`.
const cloudCache = new Map<string, string>()
const workspaceReadyUsers = new Set<string>()
const hydratedUsers = new Set<string>()
const COLLECTION_KEYS = new Set(["products", "customers", "invoices"])

function warmCacheStorageKey(key: string, userId: string) {
  return scopedKey(`warm-cache:${key}`, userId)
}

function syncWatermarkStorageKey(userId: string) {
  return scopedKey("sync-watermark", userId)
}

function readWarmCache(key: string, userId: string) {
  try {
    return localStorage.getItem(warmCacheStorageKey(key, userId))
  } catch {
    return null
  }
}

function writeWarmCache(key: string, userId: string, value: string) {
  try {
    localStorage.setItem(warmCacheStorageKey(key, userId), value)
  } catch {
    // ignore storage failures
  }
}

function removeWarmCache(key: string, userId: string) {
  try {
    localStorage.removeItem(warmCacheStorageKey(key, userId))
  } catch {
    // ignore storage failures
  }
}

function isSetupKey(key: string) {
  return key === "setupProfileDraft" || key === "setupResumePath"
}

function tempSetupKey(key: string) {
  return `${TEMP_SETUP_KEY_PREFIX}${key}`
}

function readTempSetupKey(key: string) {
  try {
    return sessionStorage.getItem(tempSetupKey(key))
  } catch {
    return null
  }
}

function writeTempSetupKey(key: string, value: string) {
  try {
    sessionStorage.setItem(tempSetupKey(key), value)
  } catch {
    // ignore storage failures
  }
}

function removeTempSetupKey(key: string) {
  try {
    sessionStorage.removeItem(tempSetupKey(key))
  } catch {
    // ignore storage failures
  }
}

function removeLegacySetupFallbacks() {
  try {
    localStorage.removeItem("setupProfileDraft")
    localStorage.removeItem("setupResumePath")
  } catch {
    // ignore storage failures
  }
}

function isCloudKvKey(key: string): key is KvKey {
  return (KV_KEYS as readonly string[]).includes(key)
}

function cacheId(userId: string, key: string) {
  return `${userId}:${key}`
}

async function workspaceApi(body: Record<string, unknown>) {
  const response = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(payload.error || "Workspace sync failed.")
}

function getSyncService() {
  if (!syncService) {
    syncService = createSyncService({
      cache: {
        get(key) {
          const userId = getActiveUserId()
          return userId ? getUserItem(key, userId) : null
        },
        set(key, value) {
          const userId = getActiveUserId()
          if (userId) setUserItem(key, value, userId)
        },
        remove(key) {
          const userId = getActiveUserId()
          if (userId) removeUserItem(key, userId)
        },
      },
      repository: createSupabaseSyncRepository({
        pushKey(userId, key, rawValue) {
          return workspaceApi({ op: "pushKey", userId, key, rawValue })
        },
        deleteKey(userId, key) {
          return workspaceApi({ op: "deleteKey", userId, key })
        },
      }),
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
      debounceMs: PUSH_DEBOUNCE_MS,
    })
  }
  return syncService
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function readSetupBundle(userId: string): Record<string, unknown> {
  const parsed = parseJson<Record<string, unknown>>(cloudCache.get(cacheId(userId, ACCOUNT_SETUP_BUNDLE_KEY)) ?? null)
  return parsed && typeof parsed === "object" ? parsed : {}
}

function readBundledValue(userId: string, key: string): string | null {
  if (!BUNDLED_KEYS.has(key)) return null
  const bundle = readSetupBundle(userId)
  if (!(key in bundle)) return null
  const value = bundle[key]
  if (value == null) return null
  return typeof value === "string" ? value : JSON.stringify(value)
}

export function primeUserKvCache(userId: string, entries: Array<{ key: string; value: string }>) {
  if (getAuthMode() !== "supabase") return
  workspaceReadyUsers.add(userId)
  hydratedUsers.add(userId)
  for (const row of entries) {
    if (!row?.key) continue
    cloudCache.set(cacheId(userId, row.key), row.value)
    writeWarmCache(row.key, userId, row.value)
  }
}

export function primeUserWorkspaceCache(userId: string, entries: Array<{ key: string; value: string }>) {
  if (getAuthMode() !== "supabase") return
  workspaceReadyUsers.add(userId)
  for (const row of entries) {
    if (!row?.key) continue
    cloudCache.set(cacheId(userId, row.key), row.value)
    writeWarmCache(row.key, userId, row.value)
  }
}

export function clearUserKvCache(userId: string) {
  workspaceReadyUsers.delete(userId)
  hydratedUsers.delete(userId)
  for (const k of cloudCache.keys()) {
    if (k.startsWith(`${userId}:`)) cloudCache.delete(k)
  }
}

export function clearUserWorkspaceLocalState(userId: string) {
  clearUserKvCache(userId)
  clearLocalStorageSyncRetryQueue(userId)
  for (const [id, timer] of pendingTimers.entries()) {
    if (id.startsWith(`${userId}:`)) {
      window.clearTimeout(timer)
      pendingTimers.delete(id)
    }
  }
  try {
    const suffix = `::${userId}`
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key) continue
      if (key.endsWith(suffix)) toRemove.push(key)
      if (key.includes(`warm-cache:`) && key.endsWith(suffix)) toRemove.push(key)
      if (key.startsWith("sync-watermark::") && key.endsWith(suffix)) toRemove.push(key)
    }
    for (const key of new Set(toRemove)) localStorage.removeItem(key)
    localStorage.removeItem("setupProfileDraft")
    localStorage.removeItem("setupResumePath")
    removeTempSetupKey("setupProfileDraft")
    removeTempSetupKey("setupResumePath")
  } catch {
    // ignore storage failures
  }
}

export function isUserKvHydrated(userId: string) {
  return hydratedUsers.has(userId)
}

export function isUserWorkspaceReady(userId: string) {
  return workspaceReadyUsers.has(userId)
}

export function isActiveUserKvHydrated() {
  const userId = getActiveUserId()
  if (!userId) return true
  if (getAuthMode() !== "supabase") return true
  return isUserKvHydrated(userId)
}

export function hasUserWarmCache(userId: string, keys: string[] = ["accountSetupBundle", "businessProfile", "invoices"]) {
  if (typeof window === "undefined") return false
  return keys.some((key) => readWarmCache(key, userId) != null)
}

export function hasActiveUserWarmCache(keys?: string[]) {
  const userId = getActiveUserId()
  if (!userId) return false
  if (getAuthMode() !== "supabase") return false
  return hasUserWarmCache(userId, keys)
}

export function getActiveScopedKey(key: string) {
  const userId = getActiveUserId()
  if (!userId) return null
  return scopedKey(key, userId)
}

export function getUserItem(key: string, userId: string) {
  // Setup draft/resume are local-only (avoid Supabase KV writes + RLS issues).
  if (getAuthMode() === "supabase" && isSetupKey(key)) {
    try {
      const scoped = localStorage.getItem(scopedKey(key, userId))
      if (scoped != null) return scoped
      const pending = readTempSetupKey(key)
      if (pending != null) {
        localStorage.setItem(scopedKey(key, userId), pending)
        removeTempSetupKey(key)
        removeLegacySetupFallbacks()
      }
      return pending
    } catch {
      return null
    }
  }

  if (getAuthMode() === "supabase") {
    const bundled = readBundledValue(userId, key)
    if (bundled != null) return revealSensitiveDataFromStorage(key, bundled)
    const inMemoryRaw = cloudCache.get(cacheId(userId, key))
    const raw =
      inMemoryRaw ??
      (COLLECTION_KEYS.has(key) && !hydratedUsers.has(userId)
        ? null
        : readWarmCache(key, userId))
    return raw == null ? null : revealSensitiveDataFromStorage(key, raw)
  }
  const raw = localStorage.getItem(scopedKey(key, userId))
  return raw == null ? null : revealSensitiveDataFromStorage(key, raw)
}

export function setUserItem(key: string, value: string, userId: string) {
  if (getAuthMode() === "supabase" && isSetupKey(key)) {
    try {
      localStorage.setItem(scopedKey(key, userId), value)
      removeTempSetupKey(key)
      removeLegacySetupFallbacks()
    } catch {
      // ignore storage failures
    }
    return
  }

  const valueForStorage = protectSensitiveDataForStorage(key, value)

  if (getAuthMode() === "supabase") {
    if (BUNDLED_KEYS.has(key)) {
      const bundle = readSetupBundle(userId)
      bundle[key] = parseJson<unknown>(valueForStorage) ?? valueForStorage
      const bundleRaw = JSON.stringify(bundle)
      cloudCache.set(cacheId(userId, ACCOUNT_SETUP_BUNDLE_KEY), bundleRaw)
      // Keep in-memory reads consistent immediately.
      cloudCache.set(cacheId(userId, key), valueForStorage)
      writeWarmCache(ACCOUNT_SETUP_BUNDLE_KEY, userId, bundleRaw)
      writeWarmCache(key, userId, valueForStorage)
      schedulePush(ACCOUNT_SETUP_BUNDLE_KEY, bundleRaw)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key } }))
      }
      return
    }
    cloudCache.set(cacheId(userId, key), valueForStorage);
    writeWarmCache(key, userId, valueForStorage);
    // Schedule push through the framework-agnostic sync service.
    schedulePush(key, valueForStorage);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key } }));
    }
    return;
  }
  localStorage.setItem(scopedKey(key, userId), valueForStorage)
}

export function removeUserItem(key: string, userId: string) {
  if (getAuthMode() === "supabase" && isSetupKey(key)) {
    try {
      localStorage.removeItem(scopedKey(key, userId))
      removeTempSetupKey(key)
      removeLegacySetupFallbacks()
    } catch {
      // ignore
    }
    return
  }

  if (getAuthMode() === "supabase") {
    if (BUNDLED_KEYS.has(key)) {
      const bundle = readSetupBundle(userId)
      delete bundle[key]
      const bundleRaw = JSON.stringify(bundle)
      cloudCache.set(cacheId(userId, ACCOUNT_SETUP_BUNDLE_KEY), bundleRaw)
      cloudCache.delete(cacheId(userId, key))
      writeWarmCache(ACCOUNT_SETUP_BUNDLE_KEY, userId, bundleRaw)
      removeWarmCache(key, userId)
      schedulePush(ACCOUNT_SETUP_BUNDLE_KEY, bundleRaw)
      scheduleDelete(key)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key } }))
      }
      return
    }
    cloudCache.delete(cacheId(userId, key));
    removeWarmCache(key, userId);
    // Schedule delete through the framework-agnostic sync service.
    scheduleDelete(key);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key } }));
    }
    return;
  }
  localStorage.removeItem(scopedKey(key, userId))
}

export function getActiveUserItem(key: string) {
  const activeKey = getActiveScopedKey(key)
  if (!activeKey) return null
  const userId = getActiveUserId()
  if (!userId) return null
  return getUserItem(key, userId)
}

export function getActiveOrGlobalItem(key: string) {
  const userId = getActiveUserId()
  if (userId) {
    // If a user is logged in, never fall back to global keys.
    // This prevents data leaking across accounts.
    return getUserItem(key, userId)
  }

  // Not logged in (e.g. before auth).
  // In Supabase mode we must avoid reading global sample keys (data leakage).
  if (getAuthMode() === "supabase") {
    if (key === "setupProfileDraft" || key === "setupResumePath") {
      return readTempSetupKey(key)
    }
    return null
  }

  // Local (safety) mode: allow global reads.
  return localStorage.getItem(key)
}

export function setActiveUserItem(key: string, value: string) {
  const activeKey = getActiveScopedKey(key)
  if (!activeKey) return
  const userId = getActiveUserId()
  if (!userId) return
  setUserItem(key, value, userId)
}

export function setActiveOrGlobalItem(key: string, value: string) {
  const activeKey = getActiveScopedKey(key)
  if (activeKey) {
    const userId = getActiveUserId()
    if (!userId) return
    setUserItem(key, value, userId)
    return
  }
  if (getAuthMode() === "supabase" && isSetupKey(key)) {
    writeTempSetupKey(key, value)
    removeLegacySetupFallbacks()
    return
  }
  localStorage.setItem(key, value)
}

export function removeActiveUserItem(key: string) {
  const activeKey = getActiveScopedKey(key)
  if (!activeKey) return
  const userId = getActiveUserId()
  if (!userId) return
  removeUserItem(key, userId)
}

export function removeActiveOrGlobalItem(key: string) {
  const activeKey = getActiveScopedKey(key)
  if (activeKey) {
    const userId = getActiveUserId()
    if (!userId) return
    removeUserItem(key, userId)
    if (getAuthMode() === "supabase") {
      if (key === "setupProfileDraft" || key === "setupResumePath") {
        removeTempSetupKey(key)
        removeLegacySetupFallbacks()
      }
    }
    return
  }
  if (getAuthMode() === "supabase" && isSetupKey(key)) {
    removeTempSetupKey(key)
    removeLegacySetupFallbacks()
    return
  }
  localStorage.removeItem(key)
}

export function migrateGlobalKeyToUser(key: string, userId: string) {
  // Legacy migration helper (localStorage mode only).
  if (getAuthMode() === "supabase") return false
  const global = localStorage.getItem(key)
  if (global == null) return false
  const targetKey = scopedKey(key, userId)
  if (localStorage.getItem(targetKey) != null) return false
  localStorage.setItem(targetKey, global)
  return true
}

function schedulePush(key: string, value: string) {
  if (getAuthMode() !== "supabase") return
  const capturedUserId = getActiveUserId()
  if (!capturedUserId) return
  if (typeof window === "undefined") return

  const id = `${capturedUserId}:${key}`
  const existing = pendingTimers.get(id)
  if (existing) {
    window.clearTimeout(existing)
  }
  const timer = window.setTimeout(() => {
    pendingTimers.delete(id)
    ;(async () => {
      const { data } = await getSupabaseUser()
      const actualUserId = data.user?.id
      if (!actualUserId) return

      if (actualUserId !== capturedUserId) {
        console.warn("Skipping KV push after auth drift", { key, capturedUserId, actualUserId })
        return
      }

      try {
        // Only push keys we track in cloud KV.
      if (!isCloudKvKey(key)) return;
      await getSyncService().flushPush(actualUserId, key, value);
    } catch (e) {
      // Prevent unhandled promise rejections from breaking UX.
      console.warn("KV push failed", { key, capturedUserId, actualUserId, e });
    }
  })();
}, PUSH_DEBOUNCE_MS);

  pendingTimers.set(id, timer)
}

function scheduleDelete(key: string) {
  if (getAuthMode() !== "supabase") return
  const capturedUserId = getActiveUserId()
  if (!capturedUserId) return
  if (typeof window === "undefined") return

  const id = `${capturedUserId}:${key}`
  const existing = pendingTimers.get(id)
  if (existing) window.clearTimeout(existing)

  const timer = window.setTimeout(() => {
    pendingTimers.delete(id)
    ;(async () => {
      const { data } = await getSupabaseUser()
      const actualUserId = data.user?.id
      if (!actualUserId) return

      if (actualUserId !== capturedUserId) {
        console.warn("Skipping KV delete after auth drift", { key, capturedUserId, actualUserId })
        return
      }

      cloudCache.delete(cacheId(capturedUserId, key))

      try {
      if (!isCloudKvKey(key)) return;
      await getSyncService().flushDelete(actualUserId, key);
    } catch (e) {
      console.warn("KV delete failed", { key, capturedUserId, actualUserId, e });
    }
  })();
}, PUSH_DEBOUNCE_MS);

  pendingTimers.set(id, timer)
}

export async function flushCloudKeyNow(key: string) {
  if (getAuthMode() !== "supabase") return
  const activeUserId = getActiveUserId()
  if (!activeUserId) return
  const { data } = await getSupabaseUser()
  const actualUserId = data.user?.id
  if (!actualUserId) return
  if (actualUserId !== activeUserId) {
    console.warn("Skipping KV flush after auth drift", { key, activeUserId, actualUserId })
    return
  }

  const value = cloudCache.get(cacheId(actualUserId, key)) ?? cloudCache.get(cacheId(activeUserId, key))
  if (value == null) return;
  if (!isCloudKvKey(key)) return;
  await getSyncService().flushPush(actualUserId, key, value);
}

export async function replayQueuedCloudSync(userId?: string) {
  if (getAuthMode() !== "supabase") return
  await getSyncService().replayQueued(userId)
}

export function readUserSyncWatermark(userId: string) {
  try {
    return localStorage.getItem(syncWatermarkStorageKey(userId))
  } catch {
    return null
  }
}

export function writeUserSyncWatermark(userId: string, value: string) {
  try {
    localStorage.setItem(syncWatermarkStorageKey(userId), value)
  } catch {
    // ignore storage failures
  }
}
