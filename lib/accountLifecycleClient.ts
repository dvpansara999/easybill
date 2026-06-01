"use client"

import { createSupabaseBrowserClient, getSupabaseUser } from "@/lib/supabase/browser"
import { signOut } from "@/lib/auth"
import { clearUserWorkspaceLocalState } from "@/lib/userStore"
import { publishWorkspaceSyncStatus } from "@/lib/workspaceSyncStatus"

export type LifecycleAction = "reset" | "delete"

export type LifecycleVerification = {
  password?: string
  otp?: string
  phrase: "RESET" | "DELETE"
}

async function lifecycleApi<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/account-lifecycle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T
  if (!response.ok) throw new Error(payload.error || "Account operation failed.")
  return payload
}

export async function requestAccountLifecycleOtp(action: LifecycleAction) {
  await lifecycleApi<void>({ op: "requestOtp", action })
}

export async function verifyLifecyclePassword(password: string) {
  const supabase = createSupabaseBrowserClient()
  const { data } = await getSupabaseUser()
  const email = data.user?.email || ""
  if (!email) throw new Error("Sign in again before continuing.")
  const result = await supabase.auth.signInWithPassword({ email, password })
  if (result.error || !result.data.user) throw new Error("Current password is incorrect.")
}

export async function resetAccount(verification: LifecycleVerification) {
  publishWorkspaceSyncStatus({ state: "syncing", label: "Resetting account", key: "workspace" })
  const { userId } = await lifecycleApi<{ userId: string }>({ op: "reset", verification })
  clearUserWorkspaceLocalState(userId)
  publishWorkspaceSyncStatus({ state: "synced", label: "Account reset complete", key: "workspace" })
}

export async function deleteAccount(verification: LifecycleVerification) {
  publishWorkspaceSyncStatus({ state: "syncing", label: "Deleting account", key: "workspace" })
  const { userId } = await lifecycleApi<{ userId: string }>({ op: "delete", verification })
  clearUserWorkspaceLocalState(userId)
  await createSupabaseBrowserClient().auth.signOut().catch(() => {})
  await signOut().catch(() => {})
  publishWorkspaceSyncStatus({ state: "synced", label: "Account deleted", key: "workspace" })
}
