"use client"

import { useEffect, useState, type ReactNode } from "react"
import { getActiveUserId } from "@/lib/auth"
import { getAuthMode } from "@/lib/runtimeMode"
import { isActiveUserKvHydrated } from "@/lib/userStore"

export default function KvHydrationGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Important for PDF generation:
    // `/api/invoice-pdf` uses Playwright to open `/invoice-print` and waits for the DOM.
    // We should never let KV hydration gating delay or block that print page.
    try {
      const pathname = window.location?.pathname || ""
      if (pathname.includes("/invoice-print") || pathname.includes("/invoice-pdf")) {
        setReady(true)
        return
      }
    } catch {
      // ignore
    }

    const mode = getAuthMode()
    if (mode !== "supabase") {
      setReady(true)
      return
    }

    let authInitSeen = false

    const checkReady = () => {
      const userId = getActiveUserId()

      // If user exists, we only render once KV cache is hydrated.
      if (userId) {
        if (isActiveUserKvHydrated()) setReady(true)
        return
      }

      // No user yet: wait briefly for auth init, then assume logged out.
      if (authInitSeen) setReady(true)
    }

    const onAuthInit = () => {
      authInitSeen = true
      checkReady()
    }

    const onCloudSync = () => {
      checkReady()
    }

    window.addEventListener("easybill:auth-sync-initialized", onAuthInit as EventListener)
    window.addEventListener("easybill:cloud-sync", onCloudSync as EventListener)

    let attempts = 0
    const intervalId = window.setInterval(() => {
      attempts++
      checkReady()

      // Safety: don't block the whole app if auth init event is missed.
      if (attempts >= 20) {
        authInitSeen = true
        checkReady()
        window.clearInterval(intervalId)
      }
    }, 150)

    return () => {
      window.removeEventListener("easybill:auth-sync-initialized", onAuthInit as EventListener)
      window.removeEventListener("easybill:cloud-sync", onCloudSync as EventListener)
      window.clearInterval(intervalId)
    }
  }, [])

  if (!ready) {
    return <div className="min-h-screen" />
  }

  return <>{children}</>
}

