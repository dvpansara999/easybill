"use client";
import { RELATIONAL_CACHE_KEYS } from "@/lib/supabase/relationalSync";
import { deleteWorkspaceKey, ensureWorkspaceSeed, fetchWorkspaceChanges, fetchWorkspaceSnapshotEntries, listInvoiceRecords, pushWorkspaceKey, } from "@/lib/supabase/workspaceRepository";
import { mergeCustomersCache, mergeInvoicesCache, mergeProductsCache, } from "@/lib/workspaceCacheMerge";
export const KV_KEYS = RELATIONAL_CACHE_KEYS;
export async function pullSupabaseKvToCache(supabase, userId) {
    return fetchWorkspaceSnapshotEntries(supabase, userId);
}
export async function pullSupabaseChangesToCache(supabase, userId, changedSince, currentValues) {
    const changes = await fetchWorkspaceChanges(supabase, userId, changedSince);
    const entries = [];
    if (changes.products.length) {
        entries.push({ key: "products", value: mergeProductsCache(currentValues.products || null, changes.products) });
    }
    if (changes.customers.length) {
        entries.push({ key: "customers", value: mergeCustomersCache(currentValues.customers || null, changes.customers) });
    }
    if (changes.invoices.length) {
        entries.push({ key: "invoices", value: mergeInvoicesCache(currentValues.invoices || null, changes.invoices) });
    }
    return entries;
}
export function pushKvToSupabase(supabase, userId, key, rawValue) {
    return pushWorkspaceKey(supabase, userId, key, rawValue);
}
export function deleteKvFromSupabase(supabase, userId, key) {
    return deleteWorkspaceKey(supabase, userId, key);
}
export function pushLocalSeedIfSupabaseEmpty(supabase, userId) {
    return ensureWorkspaceSeed(supabase, userId);
}
export function refreshInvoicesFromSupabase(supabase, userId) {
    return listInvoiceRecords(supabase, userId);
}
