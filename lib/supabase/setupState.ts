"use client"

import type { SupabaseClient } from "@supabase/supabase-js"

async function assertLifecycleUnlocked(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("account_lifecycle_locks")
    .select("account_deleting, operation")
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  if (data?.account_deleting || data?.operation === "resetting") {
    throw new Error("Account deletion in progress. New workspace changes are disabled until cleanup finishes.")
  }
}

export async function ensureRelationalSetupRows(supabase: SupabaseClient, userId: string) {
  await assertLifecycleUnlocked(supabase, userId)
  const [profileSeed, settingsSeed] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("user_settings").select("user_id").eq("user_id", userId).maybeSingle(),
  ])
  const results = await Promise.allSettled([
    profileSeed.data ? Promise.resolve({ error: null }) : supabase.from("profiles").insert({ user_id: userId, onboarding_completed: false }),
    settingsSeed.data ? Promise.resolve({ error: null }) : supabase.from("user_settings").insert({ user_id: userId }),
  ])

  for (const result of results) {
    if (result.status === "rejected") {
      throw result.reason
    }

    if (result.value.error) {
      throw result.value.error
    }
  }
}

export async function markSupabaseOnboardingComplete(supabase: SupabaseClient, userId: string) {
  await ensureRelationalSetupRows(supabase, userId)
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, onboarding_completed: true }, { onConflict: "user_id" })

  if (error) {
    throw error
  }
}
