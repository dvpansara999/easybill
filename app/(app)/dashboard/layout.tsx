"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import { getSupabaseUser } from "@/lib/supabase/browser"
import { getActiveAuthRecord } from "@/lib/auth"
import { enforceFreeRestrictions, getActivePlanId, type PlanId } from "@/lib/plans"
import { getAuthMode } from "@/lib/runtimeMode"
import { isActiveUserKvHydrated } from "@/lib/userStore"
import { Menu } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [planId, setPlanId] = useState<PlanId>("free")
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function guard() {
      const mode = getAuthMode()

      if (mode === "local") {
        if (!getActiveAuthRecord()?.userId) {
          router.replace("/")
          return
        }
        enforceFreeRestrictions()
        setPlanId(getActivePlanId())
        setReady(true)
        return
      }

      // Reuse single-flight getUser (same as SupabaseAuthSync) to avoid duplicate auth requests on first paint.
      const { data } = await getSupabaseUser()
      if (!data.user) {
        router.replace("/")
        return
      }
      const applyPlanAndRestrictions = () => {
        enforceFreeRestrictions()
        setPlanId(getActivePlanId())
      }

      if (mode !== "supabase" || isActiveUserKvHydrated()) {
        applyPlanAndRestrictions()
      } else {
        // Wait for initial cloud KV pull to avoid overwriting remote values.
        const onCloud = () => {
          window.removeEventListener("easybill:cloud-sync", onCloud as EventListener)
          applyPlanAndRestrictions()
        }
        window.addEventListener("easybill:cloud-sync", onCloud as EventListener)
      }
      setReady(true)
    }
    void guard()
  }, [router])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "subscriptionPlanId") setPlanId(getActivePlanId())
    }

    function onKvWrite(e: Event) {
      const ce = e as CustomEvent<{ key?: string }>
      if (ce.detail?.key === "subscriptionPlanId") {
        setPlanId(getActivePlanId())
      }
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener("easybill:kv-write", onKvWrite as EventListener)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("easybill:kv-write", onKvWrite as EventListener)
    }
  }, [])

  useEffect(() => {
    router.prefetch("/dashboard/invoices")
    router.prefetch("/dashboard/invoices/create")
    router.prefetch("/dashboard/settings")
    router.prefetch("/dashboard/business")
    router.prefetch("/dashboard/templates")
    router.prefetch("/dashboard/customers")
  }, [router])

  if (!ready) {
    return (
      <div className="app-shell relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
        <div className="mx-auto flex min-h-screen w-full max-w-[1180px] items-center justify-center px-4">
          <div className="glass-card auth-glass-desktop w-full max-w-xl rounded-[28px] px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <EasyBillLogoMark size={34} />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Loading workspace</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Syncing your account, settings, and plan details so the dashboard opens in the right state.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell relative flex min-h-screen flex-col overflow-hidden lg:flex-row">
      <div className="auth-desktop-depth pointer-events-none absolute inset-0 z-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.32]"
        style={{
          backgroundImage: "radial-gradient(rgba(15, 23, 42, 0.045) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
      <div className="relative z-[2] flex min-h-screen w-full min-w-0 max-w-full flex-col overflow-x-hidden lg:flex-row">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="min-w-0 px-2 py-2 sm:px-4 sm:py-4 lg:px-2">
            <div className="glass-card auth-glass-desktop mx-auto my-1.5 w-full min-w-0 max-w-[1180px] min-h-[calc(100vh-0.75rem)] rounded-[22px] px-3 py-3 sm:px-5 sm:py-5 lg:mx-4 lg:my-4 lg:min-h-[calc(100vh-2rem)] lg:rounded-[32px] lg:px-8 lg:py-8">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-7 sm:items-center">
              <div className="min-w-0 flex items-center gap-3">
                <EasyBillLogoMark size={36} className="drop-shadow-sm sm:h-auto sm:w-auto" />
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">easyBILL</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">A calm workspace for invoices, customers, and templates.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              {planId === "plus" ? (
                <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 sm:inline-flex">
                  Plus active
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/upgrade")}
                  className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
                >
                  Upgrade
                </button>
              )}
            </div>
            <div className="eb-page-transition-root">{children}</div>
          </div>
          </div>
        </main>
      </div>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm max-h-[85vh] overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.18)] backdrop-blur">
          <DialogTitle className="sr-only">Dashboard menu</DialogTitle>
          <DialogDescription className="sr-only">Navigation links for your dashboard.</DialogDescription>
          <Sidebar variant="drawer" onNavigate={() => setMenuOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
