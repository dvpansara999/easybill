"use client"

import type { SupabaseClient } from "@supabase/supabase-js"

const TABLE = "user_kv"

export const KV_KEYS = [
  "accountSetupBundle",
  "businessProfile",
  "invoices",
  "products",
  "customers",
  "invoiceTemplate",
  "invoiceVisibility",
  "subscriptionPlanId",
  "invoiceUsageCount",
  "invoiceUsageInitialized:v1",
  "templateTypography",
  "invoiceTemplateFontId",
  "invoiceTemplateFontSize",
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
  "emailChangeAudit",
] as const

export type KvKey = (typeof KV_KEYS)[number]

export async function pullSupabaseKvToCache(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("key,value")
    .eq("user_id", userId)
    .in("key", KV_KEYS as unknown as string[])

  if (error || !data) return []

  const out: Array<{ key: string; value: string }> = []
  for (const row of data as Array<{ key: string; value: unknown }>) {
    if (!row?.key) continue
    const v = typeof row.value === "string" ? row.value : JSON.stringify(row.value ?? "")
    out.push({ key: row.key, value: v })
  }
  return out
}

export async function pushKvToSupabase(supabase: SupabaseClient, userId: string, key: KvKey, rawValue: string) {
  await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        key,
        value: rawValue,
      },
      { onConflict: "user_id,key" }
    )
}

export async function deleteKvFromSupabase(supabase: SupabaseClient, userId: string, key: KvKey) {
  await supabase.from(TABLE).delete().eq("user_id", userId).eq("key", key)
}

export async function pushLocalSeedIfSupabaseEmpty(supabase: SupabaseClient, userId: string) {
  void supabase
  void userId
  // Setup draft/resume are stored locally-only now (to avoid RLS issues and
  // cross-account leakage during onboarding). User KV seeding is therefore disabled.
  return
}
