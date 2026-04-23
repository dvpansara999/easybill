"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getActiveUserId } from "@/lib/auth"
import { getAuthMode } from "@/lib/runtimeMode"
import { getSupabaseUser } from "@/lib/supabase/browser"
import { hasActiveUserWarmCache, hasUserWarmCache, isActiveUserKvHydrated, isUserKvHydrated } from "@/lib/userStore"

function isPrintPdfBypassPath() {
  try {
    const pathname = window.location?.pathname || ""
    return pathname.includes("/invoice-pdf")
  } catch {
    return false
  }
}

export default function KvHydrationGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(() => {
    if (typeof window === "undefined") return false
    if (isPrintPdfBypassPath()) return true
    if (getAuthMode() !== "supabase") return true
    return Boolean(getActiveUserId() && (isActiveUserKvHydrated() || hasActiveUserWarmCache()))
  })

  useEffect(() => {
    if (ready) return

    // Important for PDF generation:
    // Avoid delaying routes that do not need a hydrated KV cache.
    if (isPrintPdfBypassPath()) {
      return
    }

    const mode = getAuthMode()
    if (mode !== "supabase") {
      return
    }

    let authInitSeen = false
    let cancelled = false

    const checkReady = (explicitUserId?: string | null) => {
      const userId = explicitUserId ?? getActiveUserId()

      if (userId) {
        if (
          (explicitUserId ? isUserKvHydrated(userId) : isActiveUserKvHydrated()) ||
          (explicitUserId ? hasUserWarmCache(userId) : hasActiveUserWarmCache())
        ) {
          setReady(true)
          return true
        }
        return false
      }

      if (authInitSeen) {
        setReady(true)
        return true
      }

      return false
    }

    const onAuthInit = () => {
      authInitSeen = true
      checkReady()
    }

    const onCloudSync = () => {
      checkReady()
    }

    if (checkReady()) {
      return
    }

    window.addEventListener("easybill:auth-sync-initialized", onAuthInit as EventListener)
    window.addEventListener("easybill:cloud-sync", onCloudSync as EventListener)
    void getSupabaseUser()
      .then(({ data }) => {
        if (cancelled) return
        authInitSeen = true
        checkReady(data.user?.id || null)
      })
      .catch(() => {
        if (cancelled) return
        authInitSeen = true
        checkReady()
      })

    return () => {
      cancelled = true
      window.removeEventListener("easybill:auth-sync-initialized", onAuthInit as EventListener)
      window.removeEventListener("easybill:cloud-sync", onCloudSync as EventListener)
    }
  }, [ready])

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
