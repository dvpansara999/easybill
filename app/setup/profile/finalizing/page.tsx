"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { clearSetupProfileDraft } from "@/lib/setupProfileDraft"
import { getAuthMode } from "@/lib/runtimeMode"
import { flushCloudKeyNow, removeActiveOrGlobalItem } from "@/lib/userStore"

export default function SetupFinalizingPage() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function finalizeSetup() {
      try {
        if (getAuthMode() === "supabase") {
          await flushCloudKeyNow("accountSetupBundle")
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
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-slate-200 bg-white px-6 py-10 shadow-[0_25px_80px_rgba(15,23,42,0.10)] sm:px-8 sm:py-12">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
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
