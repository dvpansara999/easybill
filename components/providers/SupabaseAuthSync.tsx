"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { Session } from "@supabase/supabase-js"
import { createSupabaseBrowserClient, getSupabaseUser } from "@/lib/supabase/browser"
import { getActiveUserId, setActiveUserId } from "@/lib/auth"
import { pullSupabaseKvToCache, pushLocalSeedIfSupabaseEmpty } from "@/lib/supabase/userKvSync"
import { getAuthMode } from "@/lib/runtimeMode"
import { clearUserKvCache, primeUserKvCache } from "@/lib/userStore"
import { useAppAlert } from "@/components/providers/AppAlertProvider"

const FOCUS_KV_RESYNC_MIN_MS = 300_000

export default function SupabaseAuthSync() {
  const router = useRouter()
  const { showAlert } = useAppAlert()
  const ran = useRef(false)
  const lastUserId = useRef<string | null>(null)
  const lastFocusSyncAt = useRef(0)
  const syncInFlight = useRef<Map<string, Promise<void>>>(new Map())

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (getAuthMode() !== "supabase") return

    const supabase = createSupabaseBrowserClient()

    async function sync(userId: string) {
      const existing = syncInFlight.current.get(userId)
      if (existing) {
        await existing
        return
      }

      const work = (async () => {
        lastFocusSyncAt.current = Date.now()
        await pushLocalSeedIfSupabaseEmpty(supabase, userId)
        const rows = await pullSupabaseKvToCache(supabase, userId)
        clearUserKvCache(userId)
        primeUserKvCache(userId, rows)
        window.dispatchEvent(new Event("easybill:cloud-sync"))
      })()

      syncInFlight.current.set(userId, work)
      try {
        await work
      } finally {
        syncInFlight.current.delete(userId)
      }
    }

    async function runInitial() {
      const { data } = await getSupabaseUser()
      const user = data.user

      lastUserId.current = user?.id || null
      setActiveUserId(user?.id || null)

      if (!user) {
        window.dispatchEvent(new Event("easybill:auth-sync-initialized"))
        return
      }

      await sync(user.id)
      window.dispatchEvent(new Event("easybill:auth-sync-initialized"))
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_evt: string, session: Session | null) => {
      const nextId = session?.user?.id || null
      const prevId = lastUserId.current
      const tabKnownId = getActiveUserId()
      lastUserId.current = nextId
      setActiveUserId(nextId)

      if (prevId && prevId !== nextId) clearUserKvCache(prevId)
      if (nextId) {
        void sync(nextId)
      } else {
        window.dispatchEvent(new Event("easybill:cloud-sync"))
      }

      const switchedFromAnotherTab = Boolean(prevId && nextId && prevId !== nextId && tabKnownId === prevId)
      const signedOutFromAnotherTab = Boolean(prevId && !nextId && tabKnownId === prevId)

      if (switchedFromAnotherTab) {
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
      } else if (signedOutFromAnotherTab) {
        showAlert({
          tone: "warning",
          eyebrow: "Signed out",
          title: "This account was signed out in another tab.",
          actionHint: "Your current tab no longer has an active session.",
          message: "Sign in again to continue working.",
          primaryLabel: "Go to sign in",
          onPrimary: () => router.replace("/"),
        })
      }
    })

    function onFocus() {
      const id = lastUserId.current
      if (!id) return
      if (document.visibilityState !== "visible") return
      const now = Date.now()
      // Avoid a full user_kv pull on every tab/app focus (common on mobile) — that felt like global slowness.
      if (now - lastFocusSyncAt.current < FOCUS_KV_RESYNC_MIN_MS) return
      void sync(id)
    }
    window.addEventListener("focus", onFocus)

    void runInitial()

    return () => {
      window.removeEventListener("focus", onFocus)
      sub.subscription.unsubscribe()
    }
  }, [router, showAlert])

  return null
}
