"use client"

import { useEffect, useRef } from "react"
import { createSupabaseBrowserClient, getSupabaseUser } from "@/lib/supabase/browser"
import { setActiveUserId } from "@/lib/auth"
import { pullSupabaseKvToCache, pushLocalSeedIfSupabaseEmpty } from "@/lib/supabase/userKvSync"
import { getAuthMode } from "@/lib/runtimeMode"
import { clearUserKvCache, primeUserKvCache } from "@/lib/userStore"

export default function SupabaseAuthSync() {
  const ran = useRef(false)
  const lastUserId = useRef<string | null>(null)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (getAuthMode() !== "supabase") return

    const supabase = createSupabaseBrowserClient()

    async function sync(userId: string) {
      await pushLocalSeedIfSupabaseEmpty(supabase, userId)
      const rows = await pullSupabaseKvToCache(supabase, userId)
      clearUserKvCache(userId)
      primeUserKvCache(userId, rows)
      window.dispatchEvent(new Event("easybill:cloud-sync"))
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

    const { data: sub } = supabase.auth.onAuthStateChange((_evt: string, session: any) => {
      const nextId = session?.user?.id || null
      const prevId = lastUserId.current
      lastUserId.current = nextId
      setActiveUserId(nextId)

      if (prevId && prevId !== nextId) clearUserKvCache(prevId)
      if (nextId) {
        void sync(nextId)
      } else {
        window.dispatchEvent(new Event("easybill:cloud-sync"))
      }
    })

    function onFocus() {
      const id = lastUserId.current
      if (!id) return
      void sync(id)
    }
    window.addEventListener("focus", onFocus)

    void runInitial()

    return () => {
      window.removeEventListener("focus", onFocus)
      sub.subscription.unsubscribe()
    }
  }, [])

  return null
}

