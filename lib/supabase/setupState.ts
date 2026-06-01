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
  const results = await Promise.allSettled([
    supabase.from("profiles").upsert({ user_id: userId, onboarding_completed: false }, { onConflict: "user_id" }),
    supabase.from("user_settings").upsert({ user_id: userId }, { onConflict: "user_id" }),
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
