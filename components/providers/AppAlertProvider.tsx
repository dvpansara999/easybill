"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type AlertTone = "info" | "success" | "warning" | "danger"

type AppAlertOptions = {
  title: string
  /** Main explanation */
  message: string
  /** Short “what to do next” line (e.g. fix fields, then retry). */
  actionHint?: string
  tone?: AlertTone
  /** Main action — defaults to “Got it” */
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
        iconWrap: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-emerald-500",
        primary:
          "w-full min-h-[52px] rounded-2xl bg-emerald-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_36px_rgba(5,150,105,0.35)] transition-[transform,opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-emerald-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-300/80 sm:min-h-12 sm:text-sm",
        secondary:
          "w-full min-h-[48px] rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3 text-[15px] font-semibold text-emerald-900 transition-[background-color,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-emerald-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-200/80 sm:text-sm",
      }
    case "warning":
      return {
        icon: AlertTriangle,
        iconWrap: "bg-amber-100 text-amber-800 ring-1 ring-amber-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-amber-500",
        primary:
          "w-full min-h-[52px] rounded-2xl bg-amber-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_36px_rgba(217,119,6,0.35)] transition-[transform,opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-amber-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-300/80 sm:min-h-12 sm:text-sm",
        secondary:
          "w-full min-h-[48px] rounded-2xl border-2 border-amber-200 bg-white px-4 py-3 text-[15px] font-semibold text-amber-950 transition-[background-color,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-amber-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-200/80 sm:text-sm",
      }
    case "danger":
      return {
        icon: AlertTriangle,
        iconWrap: "bg-rose-100 text-rose-700 ring-1 ring-rose-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-rose-500",
        primary:
          "w-full min-h-[52px] rounded-2xl bg-rose-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_40px_rgba(225,29,72,0.38)] transition-[transform,opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-rose-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-300/80 sm:min-h-12 sm:text-sm",
        secondary:
          "w-full min-h-[48px] rounded-2xl border-2 border-rose-200 bg-white px-4 py-3 text-[15px] font-semibold text-rose-950 transition-[background-color,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-rose-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-200/80 sm:text-sm",
      }
    case "info":
    default:
      return {
        icon: Info,
        iconWrap: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-indigo-500",
        primary:
          "w-full min-h-[52px] rounded-2xl bg-indigo-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_36px_rgba(79,70,229,0.35)] transition-[transform,opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-indigo-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-300/80 sm:min-h-12 sm:text-sm",
        secondary:
          "w-full min-h-[48px] rounded-2xl border-2 border-indigo-200 bg-white px-4 py-3 text-[15px] font-semibold text-indigo-950 transition-[background-color,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-indigo-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/80 sm:text-sm",
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
      primaryLabel: "Got it",
      secondaryLabel: "",
      ...next,
    })
    setOpen(true)
  }, [])

  const api = useMemo<AppAlertApi>(() => ({ showAlert }), [showAlert])

  const tone = opts?.tone || "info"
  const styles = toneStyles(tone)
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
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-slate-900/40 supports-backdrop-filter:backdrop-blur-lg"
          className={cn(
            "max-h-[min(92vh,720px)] max-w-[min(calc(100vw-1.5rem),440px)] overflow-hidden rounded-[24px] border border-slate-200/90 bg-white/[0.98] p-0 shadow-[0_32px_80px_rgba(15,23,42,0.18),0_12px_32px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:max-w-[520px] sm:rounded-[28px]",
            "duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] data-open:zoom-in-95"
          )}
        >
          <div className={cn("h-1 w-full rounded-t-[24px] sm:rounded-t-[28px]", styles.accentBar)} aria-hidden />

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 z-10 flex h-10 w-10 touch-manipulation items-center justify-center rounded-full text-slate-500 transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 active:scale-95"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>

          <DialogHeader className="space-y-0 p-5 pb-2 text-left sm:p-6 sm:pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <div
                className={cn(
                  "mx-auto flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl sm:mx-0 sm:h-14 sm:w-14 sm:rounded-[1.125rem]",
                  styles.iconWrap
                )}
              >
                <Icon className="h-10 w-10 sm:h-11 sm:w-11" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0 flex-1 text-center sm:pt-0.5 sm:text-left">
                <DialogTitle
                  className={cn(
                    "font-display pr-10 text-xl font-bold leading-snug tracking-tight text-slate-950 sm:pr-8 sm:text-2xl sm:leading-tight"
                  )}
                >
                  {opts?.title || ""}
                </DialogTitle>
                {opts?.actionHint ? (
                  <p className="mt-2 text-sm font-semibold leading-snug text-slate-800 sm:text-[15px] sm:leading-6">
                    {opts.actionHint}
                  </p>
                ) : null}
                <DialogDescription className="mt-2 text-pretty text-sm leading-relaxed text-slate-600 sm:mt-3 sm:text-[15px] sm:leading-7">
                  {opts?.message || ""}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-2.5 border-t border-slate-200/80 bg-slate-50/40 px-5 py-4 backdrop-blur-sm sm:gap-3 sm:px-6 sm:py-5">
            <button
              type="button"
              onClick={() => {
                close()
                if (opts?.onPrimary) {
                  opts.onPrimary()
                  return
                }
                void router
              }}
              className={styles.primary}
            >
              {opts?.primaryLabel || "Got it"}
            </button>

            {opts?.secondaryLabel ? (
              <button
                type="button"
                onClick={() => {
                  close()
                  opts?.onSecondary?.()
                }}
                className={styles.secondary}
              >
                {opts.secondaryLabel}
              </button>
            ) : null}
          </div>
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
