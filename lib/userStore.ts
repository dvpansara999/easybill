import { getActiveUserId } from "@/lib/auth"
import { createSupabaseBrowserClient, getSupabaseUser } from "@/lib/supabase/browser"
import { deleteKvFromSupabase, pushKvToSupabase } from "@/lib/supabase/userKvSync"
import { getAuthMode } from "@/lib/runtimeMode"
import { scopedKey } from "@/lib/scopedKey"
import { protectSensitiveDataForStorage, revealSensitiveDataFromStorage } from "@/lib/sensitiveData"

const PUSH_DEBOUNCE_MS = 600
const pendingTimers = new Map<string, number>()
const ACCOUNT_SETUP_BUNDLE_KEY = "accountSetupBundle"
const BUNDLED_KEYS = new Set([
  "businessProfile",
  "dateFormat",
  "amountFormat",
  "showDecimals",
  "invoicePrefix",
  "invoicePadding",
  "invoiceStartNumber",
  "resetYearly",
  "currencySymbol",
  "currencyPosition",
  "invoiceVisibility",
])

// Supabase-first cache: avoids localStorage as the primary store in cloud mode.
// Keyed as `${userId}:${key}`.
const cloudCache = new Map<string, string>()
const hydratedUsers = new Set<string>()

function isSetupKey(key: string) {
  return key === "setupProfileDraft" || key === "setupResumePath"
}

function cacheId(userId: string, key: string) {
  return `${userId}:${key}`
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
  hydratedUsers.add(userId)
  for (const row of entries) {
    if (!row?.key) continue
    cloudCache.set(cacheId(userId, row.key), row.value)
  }
}

export function clearUserKvCache(userId: string) {
  hydratedUsers.delete(userId)
  for (const k of cloudCache.keys()) {
    if (k.startsWith(`${userId}:`)) cloudCache.delete(k)
  }
}

export function isUserKvHydrated(userId: string) {
  return hydratedUsers.has(userId)
}

export function isActiveUserKvHydrated() {
  const userId = getActiveUserId()
  if (!userId) return true
  if (getAuthMode() !== "supabase") return true
  return isUserKvHydrated(userId)
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
      return localStorage.getItem(key) // pre-OTP fallback
    } catch {
      return null
    }
  }

  if (getAuthMode() === "supabase") {
    const bundled = readBundledValue(userId, key)
    if (bundled != null) return revealSensitiveDataFromStorage(key, bundled)
    const raw = cloudCache.get(cacheId(userId, key)) ?? null
    return raw == null ? null : revealSensitiveDataFromStorage(key, raw)
  }
  const raw = localStorage.getItem(scopedKey(key, userId))
  return raw == null ? null : revealSensitiveDataFromStorage(key, raw)
}

export function setUserItem(key: string, value: string, userId: string) {
  if (getAuthMode() === "supabase" && isSetupKey(key)) {
    try {
      localStorage.setItem(scopedKey(key, userId), value)
      // Keep a global fallback during the OTP step. We'll clear it
      // whenever users start a new signup flow.
      localStorage.setItem(key, value)
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
      schedulePush(ACCOUNT_SETUP_BUNDLE_KEY, bundleRaw)
      // Remove legacy per-key row for cleanliness.
      scheduleDelete(key)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key } }))
      }
      return
    }
    cloudCache.set(cacheId(userId, key), valueForStorage)
    schedulePush(key, valueForStorage)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key } }))
    }
    return
  }
  localStorage.setItem(scopedKey(key, userId), valueForStorage)
}

export function removeUserItem(key: string, userId: string) {
  if (getAuthMode() === "supabase" && isSetupKey(key)) {
    try {
      localStorage.removeItem(scopedKey(key, userId))
      localStorage.removeItem(key)
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
      schedulePush(ACCOUNT_SETUP_BUNDLE_KEY, bundleRaw)
      scheduleDelete(key)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key } }))
      }
      return
    }
    cloudCache.delete(cacheId(userId, key))
    scheduleDelete(key)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key } }))
    }
    return
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
      return localStorage.getItem(key)
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
    // Setup draft/resume are temporary and must never be re-seeded for a different account.
    if (getAuthMode() === "supabase") {
      if (key === "setupProfileDraft" || key === "setupResumePath") {
        try {
          localStorage.removeItem(key)
        } catch {
          // ignore
        }
      }
    }
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
      const supabase = createSupabaseBrowserClient()
      const { data } = await getSupabaseUser()
      const actualUserId = data.user?.id
      if (!actualUserId) return

      // If our cached/active userId drifted, fix cache under the real auth user id.
      if (actualUserId !== capturedUserId) {
        cloudCache.delete(cacheId(capturedUserId, key))
        cloudCache.set(cacheId(actualUserId, key), value)
        hydratedUsers.add(actualUserId)
      }

      try {
        // Only push keys we track in cloud KV.
        await pushKvToSupabase(supabase, actualUserId, key as any, value)
      } catch (e) {
        // Prevent unhandled promise rejections from breaking UX.
        console.error("KV push failed", { key, capturedUserId, actualUserId, e })
      }
    })()
  }, PUSH_DEBOUNCE_MS)

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
      const supabase = createSupabaseBrowserClient()
      const { data } = await getSupabaseUser()
      const actualUserId = data.user?.id
      if (!actualUserId) return

      cloudCache.delete(cacheId(capturedUserId, key))
      cloudCache.delete(cacheId(actualUserId, key))

      try {
        await deleteKvFromSupabase(supabase, actualUserId, key as any)
      } catch (e) {
        console.error("KV delete failed", { key, capturedUserId, actualUserId, e })
      }
    })()
  }, PUSH_DEBOUNCE_MS)

  pendingTimers.set(id, timer)
}

export async function flushCloudKeyNow(key: string) {
  if (getAuthMode() !== "supabase") return
  const activeUserId = getActiveUserId()
  if (!activeUserId) return
  const supabase = createSupabaseBrowserClient()
  const { data } = await getSupabaseUser()
  const actualUserId = data.user?.id
  if (!actualUserId) return

  const value = cloudCache.get(cacheId(actualUserId, key)) ?? cloudCache.get(cacheId(activeUserId, key))
  if (value == null) return
  await pushKvToSupabase(supabase, actualUserId, key as any, value)
}

