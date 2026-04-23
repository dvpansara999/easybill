"use client"

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getActiveUserId } from "@/lib/auth"
import { getAuthMode } from "@/lib/runtimeMode"
import { hasActiveUserWarmCache, isActiveUserKvHydrated } from "@/lib/userStore"

function isPrintPdfBypassPath() {
  try {
    const pathname = window.location?.pathname || ""
    return pathname.includes("/invoice-pdf")
  } catch {
    return false
  }
}

export default function KvHydrationGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  // Run before paint so lightweight routes (e.g. legacy `/invoice-pdf`) are not blocked by KV gating.
  useLayoutEffect(() => {
    if (isPrintPdfBypassPath()) {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    // Important for PDF generation:
    // Avoid delaying routes that do not need a hydrated KV cache.
    if (isPrintPdfBypassPath()) {
      setReady(true)
      return
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
        if (isActiveUserKvHydrated() || hasActiveUserWarmCache()) setReady(true)
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
    return (
      <div className="min-h-screen bg-[linear-gradient(155deg,#eef2fb_0%,#e4eaf7_28%,#eef1fb_55%,#e2e8f8_100%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-[min(52vh,420px)] w-full rounded-2xl lg:rounded-3xl" />
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Skeleton className="h-10 flex-1 rounded-xl sm:max-w-xs" />
            <Skeleton className="h-10 flex-1 rounded-xl sm:max-w-[200px]" />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
