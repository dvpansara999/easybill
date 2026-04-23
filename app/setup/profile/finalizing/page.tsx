"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { clearSetupProfileDraft } from "@/lib/setupProfileDraft"
import { getAuthMode } from "@/lib/runtimeMode"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { getActiveUserId } from "@/lib/auth"
import { markSupabaseOnboardingComplete } from "@/lib/supabase/setupState"
import { flushCloudKeyNow, removeActiveOrGlobalItem } from "@/lib/userStore"

export default function SetupFinalizingPage() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function finalizeSetup() {
      try {
        if (getAuthMode() === "supabase") {
          await Promise.allSettled([flushCloudKeyNow("accountSetupBundle"), flushCloudKeyNow("businessProfile")])
          const userId = getActiveUserId()
          if (userId) {
            await markSupabaseOnboardingComplete(createSupabaseBrowserClient(), userId)
          }
        }
      } catch {
        // Non-blocking: user can still continue with local fallback.
      } finally {
        clearSetupProfileDraft()
        removeActiveOrGlobalItem("setupResumePath")
        if (!cancelled) router.replace("/dashboard")
      }
    }

    void finalizeSetup()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <main className="eb-desktop-public min-h-screen bg-transparent px-4 py-10 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
        <section className="auth-glass-desktop w-full rounded-[32px] border border-slate-200 bg-white px-6 py-10 shadow-[0_20px_56px_rgba(15,23,42,0.06)] sm:px-8 sm:py-12">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
              <Skeleton className="h-4 w-3/5 max-w-[220px]" />
              <Skeleton className="h-4 w-4/5 max-w-[280px]" />
              <Skeleton className="h-4 w-2/5 max-w-[120px]" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Final setup</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Sit back and relax, creating your personal easyBILL workspace.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              We are syncing your business profile and settings securely. You will be redirected to your dashboard
              automatically once everything is ready.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
