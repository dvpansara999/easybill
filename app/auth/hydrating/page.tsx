"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth"
import { getSupabaseUser } from "@/lib/supabase/browser"
import { ensureWorkspaceReadyForNavigation } from "@/lib/workspaceRuntime"
import { RefreshCw } from "lucide-react"

type HydrationState = "loading" | "error"

function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard"
}

export default function AuthHydratingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = safeNextPath(searchParams.get("next"))
  const [state, setState] = useState<HydrationState>("loading")
  const [message, setMessage] = useState("")

  const loadWorkspace = useCallback(async () => {
    setState("loading")
    setMessage("")
    try {
      const { data } = await getSupabaseUser()
      const userId = data.user?.id
      if (!userId) throw new Error("No active session found. Please sign in again.")
      await ensureWorkspaceReadyForNavigation(userId)
      router.replace(nextPath)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load workspace. Please try again.")
      setState("error")
    }
  }, [nextPath, router])

  useEffect(() => {
    void loadWorkspace()
  }, [loadWorkspace])

  return (
    <main className="app-shell eb-desktop-public min-h-screen bg-transparent px-4 py-10 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[72vh] w-full max-w-3xl items-center justify-center">
        <section className="w-full border border-white/70 bg-white/80 px-6 py-10 text-center shadow-[0_28px_70px_rgba(86,94,106,0.14)] backdrop-blur-2xl sm:px-8 sm:py-12">
          <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-[22px] bg-emerald-50 text-emerald-700">
            <EasyBillLogoMark size={38} />
          </div>
          <p className="app-kicker mt-8 text-slate-500">Creating your workspace</p>
          <h1 className="app-page-title mt-3 text-3xl text-slate-950">
            {state === "loading" ? "Loading your EasyBill workspace." : "Unable to load workspace."}
          </h1>
          <p className="app-page-copy mx-auto mt-4 max-w-xl text-sm text-slate-700 sm:text-base">
            {state === "loading"
              ? "We are confirming your business profile and settings from Supabase before opening the dashboard."
              : message || "Your session is active, but workspace hydration did not finish."}
          </p>

          {state === "error" ? (
            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
              <Button type="button" onClick={() => void loadWorkspace()} className="rounded-2xl px-6 py-3">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  await signOut()
                  router.replace("/")
                }}
                className="rounded-2xl px-6 py-3"
              >
                Sign Out
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
