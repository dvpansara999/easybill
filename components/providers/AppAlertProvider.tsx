"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type AlertTone = "info" | "success" | "warning" | "danger"

type AppAlertOptions = {
  title: string
  message: string
  tone?: AlertTone
  primaryLabel?: string
  secondaryLabel?: string
  onPrimary?: () => void
  onSecondary?: () => void
}

type AppAlertApi = {
  showAlert: (opts: AppAlertOptions) => void
}

const AppAlertContext = createContext<AppAlertApi | null>(null)

function toneStyles(tone: AlertTone) {
  switch (tone) {
    case "success":
      return {
        icon: CheckCircle2,
        iconWrap: "bg-emerald-50 text-emerald-700",
        title: "text-slate-950",
        button: "bg-slate-950 hover:bg-slate-800 text-white",
      }
    case "warning":
      return {
        icon: AlertTriangle,
        iconWrap: "bg-amber-50 text-amber-700",
        title: "text-slate-950",
        button: "bg-slate-950 hover:bg-slate-800 text-white",
      }
    case "danger":
      return {
        icon: AlertTriangle,
        iconWrap: "bg-rose-50 text-rose-700",
        title: "text-slate-950",
        button: "bg-slate-950 hover:bg-slate-800 text-white",
      }
    case "info":
    default:
      return {
        icon: Info,
        iconWrap: "bg-sky-50 text-sky-700",
        title: "text-slate-950",
        button: "bg-slate-950 hover:bg-slate-800 text-white",
      }
  }
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<AppAlertOptions | null>(null)

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const showAlert = useCallback((next: AppAlertOptions) => {
    setOpts({
      tone: "info",
      primaryLabel: "OK",
      secondaryLabel: "",
      ...next,
    })
    setOpen(true)
  }, [])

  const api = useMemo<AppAlertApi>(() => ({ showAlert }), [showAlert])

  const styles = toneStyles(opts?.tone || "info")
  const Icon = styles.icon

  return (
    <AppAlertContext.Provider value={api}>
      {children}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setOpts(null)
          }
        }}
      >
        <DialogContent className="max-w-[520px] rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl ${styles.iconWrap}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className={`text-xl font-semibold ${styles.title}`}>{opts?.title || ""}</DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-6 text-slate-600">
                  {opts?.message || ""}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter className="px-6 pb-6 pt-4 !bg-transparent !border-t-0">
            {opts?.secondaryLabel ? (
              <button
                type="button"
                onClick={() => {
                  close()
                  opts?.onSecondary?.()
                }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {opts.secondaryLabel}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                close()
                if (opts?.onPrimary) {
                  opts.onPrimary()
                  return
                }
                // Default: just close (router referenced to keep hooks stable).
                void router
              }}
              className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${styles.button}`}
            >
              {opts?.primaryLabel || "OK"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppAlertContext.Provider>
  )
}

export function useAppAlert() {
  const ctx = useContext(AppAlertContext)
  if (!ctx) {
    throw new Error("useAppAlert must be used within AppAlertProvider")
  }
  return ctx
}

