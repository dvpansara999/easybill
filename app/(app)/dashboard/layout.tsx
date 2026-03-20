"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import { getSupabaseUser } from "@/lib/supabase/browser"
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

      if (getAuthMode() !== "supabase" || isActiveUserKvHydrated()) {
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

  if (!ready) return null

  return (
    <div className="app-shell flex min-h-screen flex-col lg:flex-row">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-2">
          <div className="glass-card mx-auto my-2 w-full max-w-[1180px] min-h-[calc(100vh-1rem)] rounded-[24px] px-3 py-3 sm:px-5 sm:py-5 lg:mx-4 lg:my-4 lg:min-h-[calc(100vh-2rem)] lg:rounded-[32px] lg:px-8 lg:py-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-7">
              <div className="flex items-center gap-3">
                <EasyBillLogoMark size={38} className="drop-shadow-sm" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500">easyBILL</p>
                  <p className="mt-1 text-sm text-slate-600">A calm workspace for invoices, customers, and templates.</p>
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
            {children}
          </div>
        </div>
      </main>

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
