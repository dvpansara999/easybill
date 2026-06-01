"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import { RELATIONAL_CACHE_KEYS, type RelationalCacheKey } from "@/lib/supabase/relationalSync"
import {
  deleteWorkspaceKey,
  ensureWorkspaceSeed,
  fetchWorkspaceChanges,
  fetchWorkspaceSnapshotEntries,
  listInvoiceRecords,
  pushWorkspaceKey,
} from "@/lib/supabase/workspaceRepository"
import {
  mergeCustomersCache,
  mergeInvoicesCache,
  mergeProductsCache,
} from "@/lib/workspaceCacheMerge"

export const KV_KEYS = RELATIONAL_CACHE_KEYS
export type KvKey = RelationalCacheKey

export async function pullSupabaseKvToCache(supabase: SupabaseClient, userId: string) {
  return fetchWorkspaceSnapshotEntries(supabase, userId)
}

export async function pullSupabaseChangesToCache(
  supabase: SupabaseClient,
  userId: string,
  changedSince: string | null,
  currentValues: Partial<Record<"products" | "customers" | "invoices", string | null>>
) {
  const changes = await fetchWorkspaceChanges(supabase, userId, changedSince)
  const entries: Array<{ key: KvKey; value: string }> = []
  if (changes.products.length) {
    entries.push({ key: "products", value: mergeProductsCache(currentValues.products || null, changes.products) })
  }
  if (changes.customers.length) {
    entries.push({ key: "customers", value: mergeCustomersCache(currentValues.customers || null, changes.customers) })
  }
  if (changes.invoices.length) {
    entries.push({ key: "invoices", value: mergeInvoicesCache(currentValues.invoices || null, changes.invoices) })
  }
  return entries
}

export function pushKvToSupabase(supabase: SupabaseClient, userId: string, key: KvKey, rawValue: string) {
  return pushWorkspaceKey(supabase, userId, key, rawValue)
}

export function deleteKvFromSupabase(supabase: SupabaseClient, userId: string, key: KvKey) {
  return deleteWorkspaceKey(supabase, userId, key)
}

export function pushLocalSeedIfSupabaseEmpty(supabase: SupabaseClient, userId: string) {
  return ensureWorkspaceSeed(supabase, userId)
}

export function refreshInvoicesFromSupabase(supabase: SupabaseClient, userId: string) {
  return listInvoiceRecords(supabase, userId)
}
