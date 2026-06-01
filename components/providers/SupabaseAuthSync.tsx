"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getAuthMode } from "@/lib/runtimeMode"
import { createBrowserWorkspaceSyncCoordinator } from "@/lib/workspaceRuntime"
import { useAppAlert } from "@/components/providers/AppAlertProvider"

export default function SupabaseAuthSync() {
  const router = useRouter()
  const { showAlert } = useAppAlert()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (getAuthMode() !== "supabase") return

    const coordinator = createBrowserWorkspaceSyncCoordinator({
      accountChanged() {
        showAlert({
          tone: "warning",
          eyebrow: "Account changed",
          title: "This browser session switched to another account.",
          actionHint: "This tab now follows the account that was signed in most recently in this browser.",
          message:
            "Using two different easyBILL accounts side by side in the same browser session is not fully isolated yet. Use a different browser profile or private window if you need both open at the same time.",
          primaryLabel: "Open current workspace",
          onPrimary: () => router.replace("/dashboard"),
        })
      },
      signedOut() {
        showAlert({
          tone: "warning",
          eyebrow: "Signed out",
          title: "This account was signed out in another tab.",
          actionHint: "Your current tab no longer has an active session.",
          message: "Sign in again to continue working.",
          primaryLabel: "Go to sign in",
          onPrimary: () => router.replace("/"),
        })
      },
    })

    return coordinator.start()
  }, [router, showAlert])

  return null
}
