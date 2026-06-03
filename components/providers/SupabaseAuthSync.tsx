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
          title: "Account changed in another tab.",
          actionHint: "One easyBILL account is supported per browser profile.",
          message:
            "Use a separate browser profile, private window, or different browser for another account. This tab can only open the account that is currently signed in for this browser profile.",
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
