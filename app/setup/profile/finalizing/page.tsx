"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { clearSetupProfileDraft } from "@/lib/setupProfileDraft"
import { getAuthMode } from "@/lib/runtimeMode"
import { createSupabaseBrowserClient, getSupabaseUser } from "@/lib/supabase/browser"
import { setActiveUserId } from "@/lib/auth"
import { markSupabaseOnboardingComplete } from "@/lib/supabase/setupState"
import { flushCloudKeyNow, removeActiveOrGlobalItem } from "@/lib/userStore"

type FinalizingStatus = "syncing" | "error"

const SETUP_SYNC_KEYS = [
  "accountSetupBundle",
  "businessProfile",
  "dateFormat",
  "amountFormat",
  "showDecimals",
  "invoicePrefix",
  "invoicePadding",
  "invoiceStartNumber",
  "resetYearly",
  "invoiceResetMonthDay",
  "currencySymbol",
  "currencyPosition",
  "invoiceVisibility",
]

async function ensureWorkspaceSeed(userId: string) {
  const response = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op: "ensureSeed", userId }),
  })
  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(payload.error || "Workspace seed could not be created.")
}

function getFinalizingErrorCopy(error: unknown) {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false
  const rawMessage = error instanceof Error ? error.message : typeof error === "string" ? error : ""
  const looksNetworkRelated =
    offline ||
    /network|fetch|failed to fetch|timeout|offline|internet|connection/i.test(rawMessage)

  if (looksNetworkRelated) {
    return {
      title: "Check your internet connection.",
      message:
        "We could not confirm your setup with the server. Your entered profile is still here, so reconnect and try again.",
      icon: WifiOff,
    }
  }

  return {
    title: "Server is under maintenance.",
    message:
      rawMessage && process.env.NODE_ENV !== "production"
        ? `We could not finish saving your workspace right now. Details: ${rawMessage}`
        : "We could not finish saving your workspace right now. Your setup details are still saved on this device, so please try again in a moment.",
    icon: AlertTriangle,
  }
}

export default function SetupFinalizingPage() {
  const router = useRouter()
  const [status, setStatus] = useState<FinalizingStatus>("syncing")
  const [errorCopy, setErrorCopy] = useState(() => getFinalizingErrorCopy(""))

  const finalizeSetup = useCallback(async () => {
    setStatus("syncing")

    try {
      if (getAuthMode() === "supabase") {
        const supabase = createSupabaseBrowserClient()
        const { data, error } = await getSupabaseUser()
        const userId = data.user?.id

        if (error || !userId) {
          throw error || new Error("No active session found.")
        }

        setActiveUserId(userId)
        await ensureWorkspaceSeed(userId)
        await Promise.all(SETUP_SYNC_KEYS.map((key) => flushCloudKeyNow(key)))

        const [{ data: profile, error: profileError }, { data: settings, error: settingsError }] = await Promise.all([
          supabase
            .from("profiles")
            .select("business_name,email,logo_storage_path")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase.from("user_settings").select("user_id").eq("user_id", userId).maybeSingle(),
        ])

        if (profileError || settingsError) {
          throw profileError || settingsError
        }

        if (!profile?.business_name || !profile?.email || !settings?.user_id) {
          throw new Error("Workspace data was not confirmed by the server.")
        }

        await markSupabaseOnboardingComplete(supabase, userId)
      }

      clearSetupProfileDraft()
      removeActiveOrGlobalItem("setupResumePath")
      router.replace("/dashboard")
    } catch (error) {
      setErrorCopy(getFinalizingErrorCopy(error))
      setStatus("error")
    }
  }, [router])

  useEffect(() => {
    void finalizeSetup()
  }, [finalizeSetup])

  const ErrorIcon = errorCopy.icon
  const syncing = status === "syncing"

  return (
    <main className="app-shell eb-desktop-public min-h-screen bg-transparent px-4 py-10 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
        <section className="w-full border border-white/70 bg-white/80 px-6 py-10 shadow-[0_28px_70px_rgba(86,94,106,0.14)] backdrop-blur-2xl sm:px-8 sm:py-12">
          <div className="mx-auto max-w-xl text-center">
            {syncing ? (
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                <Skeleton className="h-4 w-3/5 max-w-[220px]" />
                <Skeleton className="h-4 w-4/5 max-w-[280px]" />
                <Skeleton className="h-4 w-2/5 max-w-[120px]" />
              </div>
            ) : (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[rgba(186,52,86,0.14)] bg-[rgba(186,52,86,0.08)] text-[rgb(123,31,52)] shadow-[0_18px_44px_rgba(58,42,28,0.08)]">
                <ErrorIcon className="h-7 w-7" />
              </div>
            )}
            <p className="app-kicker mt-8 text-slate-500">Final setup</p>
            <h1 className="app-page-title mt-3 text-3xl text-slate-950">
              {syncing ? "Preparing your personal easyBILL workspace." : errorCopy.title}
            </h1>
            <p className="app-page-copy mt-4 text-sm text-slate-700 sm:text-base">
              {syncing
                ? "We are syncing your business profile and workspace settings securely. You will be redirected to your dashboard automatically as soon as everything is ready."
                : errorCopy.message}
            </p>

            {!syncing ? (
              <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void finalizeSetup()}
                  className="app-primary-button inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/setup/profile/settings")}
                  className="app-secondary-button rounded-2xl px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  Back to setup
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
