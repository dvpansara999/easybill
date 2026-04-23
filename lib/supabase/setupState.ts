"use client"

import type { SupabaseClient } from "@supabase/supabase-js"

export async function ensureRelationalSetupRows(supabase: SupabaseClient, userId: string) {
  await Promise.allSettled([
    supabase.from("profiles").upsert({ user_id: userId, onboarding_completed: false }, { onConflict: "user_id" }),
    supabase.from("user_settings").upsert({ user_id: userId }, { onConflict: "user_id" }),
  ])
}

export async function markSupabaseOnboardingComplete(supabase: SupabaseClient, userId: string) {
  await ensureRelationalSetupRows(supabase, userId)
  await supabase
    .from("profiles")
    .upsert({ user_id: userId, onboarding_completed: true }, { onConflict: "user_id" })
}
