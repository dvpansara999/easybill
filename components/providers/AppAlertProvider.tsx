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
  message: string
  actionHint?: string
  eyebrow?: string
  details?: string[]
  footerNote?: string
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
        eyebrow: "Saved successfully",
        iconWrap:
          "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-emerald-500",
        surface:
          "border-emerald-100/90 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]",
        hintCard: "border-emerald-200/90 bg-emerald-50/90 text-emerald-950",
        detailCard: "border-emerald-100/80 bg-white/88 text-slate-700",
        eyebrowBadge: "border-emerald-200/90 bg-emerald-50 text-emerald-800",
        bullet: "bg-emerald-400",
        primary:
          "w-full min-h-[52px] rounded-2xl bg-emerald-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_36px_rgba(5,150,105,0.35)] transition-[transform,opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-emerald-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-300/80 sm:min-h-12 sm:text-sm",
        secondary:
          "w-full min-h-[48px] rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3 text-[15px] font-semibold text-emerald-900 transition-[background-color,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-emerald-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-200/80 sm:text-sm",
      }
    case "warning":
      return {
        icon: AlertTriangle,
        eyebrow: "Review before continuing",
        iconWrap:
          "bg-amber-100 text-amber-800 ring-1 ring-amber-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-amber-500",
        surface:
          "border-amber-100/90 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]",
        hintCard: "border-amber-200/90 bg-amber-50/90 text-amber-950",
        detailCard: "border-amber-100/80 bg-white/88 text-slate-700",
        eyebrowBadge: "border-amber-200/90 bg-amber-50 text-amber-800",
        bullet: "bg-amber-400",
        primary:
          "w-full min-h-[52px] rounded-2xl bg-amber-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_36px_rgba(217,119,6,0.35)] transition-[transform,opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-amber-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-300/80 sm:min-h-12 sm:text-sm",
        secondary:
          "w-full min-h-[48px] rounded-2xl border-2 border-amber-200 bg-white px-4 py-3 text-[15px] font-semibold text-amber-950 transition-[background-color,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-amber-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-200/80 sm:text-sm",
      }
    case "danger":
      return {
        icon: AlertTriangle,
        eyebrow: "Needs attention",
        iconWrap:
          "bg-rose-100 text-rose-700 ring-1 ring-rose-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-rose-500",
        surface:
          "border-rose-100/90 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]",
        hintCard: "border-rose-200/90 bg-rose-50/90 text-rose-950",
        detailCard: "border-rose-100/80 bg-white/88 text-slate-700",
        eyebrowBadge: "border-rose-200/90 bg-rose-50 text-rose-800",
        bullet: "bg-rose-400",
        primary:
          "w-full min-h-[52px] rounded-2xl bg-rose-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_40px_rgba(225,29,72,0.38)] transition-[transform,opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-rose-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-300/80 sm:min-h-12 sm:text-sm",
        secondary:
          "w-full min-h-[48px] rounded-2xl border-2 border-rose-200 bg-white px-4 py-3 text-[15px] font-semibold text-rose-950 transition-[background-color,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-rose-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-200/80 sm:text-sm",
      }
    case "info":
    default:
      return {
        icon: Info,
        eyebrow: "Heads up",
        iconWrap:
          "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-indigo-500",
        surface:
          "border-indigo-100/90 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]",
        hintCard: "border-indigo-200/90 bg-indigo-50/90 text-indigo-950",
        detailCard: "border-indigo-100/80 bg-white/88 text-slate-700",
        eyebrowBadge: "border-indigo-200/90 bg-indigo-50 text-indigo-800",
        bullet: "bg-indigo-400",
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
      details: [],
      footerNote: "",
      ...next,
    })
    setOpen(true)
  }, [])

  const api = useMemo<AppAlertApi>(() => ({ showAlert }), [showAlert])

  const tone = opts?.tone || "info"
  const styles = toneStyles(tone)
  const Icon = styles.icon
  const eyebrow = opts?.eyebrow || styles.eyebrow
  const details = Array.isArray(opts?.details) ? opts.details.filter(Boolean) : []
  const hasSecondary = Boolean(opts?.secondaryLabel)

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
          overlayClassName="bg-slate-950/45 supports-backdrop-filter:backdrop-blur-xl"
          className={cn(
            "top-auto bottom-2 max-h-[min(88vh,620px)] max-w-[min(calc(100vw-0.75rem),410px)] -translate-y-0 overflow-hidden rounded-[24px] border p-0 shadow-[0_28px_72px_rgba(15,23,42,0.18),0_8px_22px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:bottom-auto sm:top-1/2 sm:max-h-[min(92vh,700px)] sm:max-w-[500px] sm:-translate-y-1/2 sm:rounded-[30px] sm:shadow-[0_32px_84px_rgba(15,23,42,0.2),0_10px_24px_rgba(15,23,42,0.09)]",
            styles.surface,
            "duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] data-open:zoom-in-95"
          )}
        >
          <div className={cn("h-1.5 w-full rounded-t-[24px] sm:rounded-t-[30px]", styles.accentBar)} aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-18 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),transparent_76%)] sm:h-24" aria-hidden />

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 touch-manipulation items-center justify-center rounded-full border border-white/70 bg-white/82 text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 active:scale-95 sm:h-10 sm:w-10 sm:shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2} />
          </button>

          <DialogHeader className="space-y-0 p-4 pb-2 text-left sm:p-6 sm:pb-3">
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-start sm:gap-4">
              <div
                className={cn(
                  "mx-auto flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[0.95rem] shadow-[0_14px_30px_rgba(15,23,42,0.08)] sm:mx-0 sm:h-[62px] sm:w-[62px] sm:rounded-[1.2rem] sm:shadow-[0_18px_40px_rgba(15,23,42,0.08)]",
                  styles.iconWrap
                )}
              >
                <Icon className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={2} aria-hidden />
              </div>

              <div className="min-w-0 flex-1 text-center sm:pt-0.5 sm:text-left">
                <div className="mb-2.5 flex justify-center sm:justify-start">
                  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] sm:px-3 sm:text-[11px] sm:tracking-[0.24em]", styles.eyebrowBadge)}>
                    {eyebrow}
                  </span>
                </div>

                <DialogTitle className="font-display pr-8 text-[1.4rem] font-bold leading-[1.06] tracking-[-0.04em] text-slate-950 sm:pr-8 sm:text-[2rem]">
                  {opts?.title || ""}
                </DialogTitle>

                {opts?.actionHint ? (
                  <p className="mt-3 text-pretty text-[14px] font-semibold leading-5.5 text-slate-900 sm:mt-4 sm:text-base sm:leading-6">
                    {opts.actionHint}
                  </p>
                ) : null}

                {(opts?.message || details.length > 0 || opts?.footerNote) ? (
                  <div className={cn("mt-3 rounded-[20px] border px-3.5 py-3 sm:rounded-[22px] sm:px-5", styles.detailCard)}>
                    {opts?.message ? (
                      <DialogDescription className="text-pretty text-[13px] leading-5.5 text-slate-600 sm:text-[15px] sm:leading-6">
                        {opts?.message || ""}
                      </DialogDescription>
                    ) : null}
                    {details.length > 0 ? (
                      <ul className={cn(opts?.message ? "mt-2.5" : "", "space-y-1.5 text-[12px] leading-5 text-slate-500 sm:text-sm")}>
                        {details.slice(0, 2).map((detail) => (
                          <li key={detail} className="flex items-start gap-2">
                            <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", styles.bullet)} />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {opts?.footerNote ? (
                      <p className={cn(opts?.message || details.length > 0 ? "mt-2.5" : "", "text-xs leading-5 text-slate-500")}>
                        {opts.footerNote}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </DialogHeader>

          <div className="border-t border-white/70 bg-white/58 px-4 py-3.5 backdrop-blur-md sm:px-6 sm:py-4.5">
            <div className={cn("flex flex-col gap-2.5 sm:gap-3", hasSecondary ? "sm:grid sm:grid-cols-2" : "")}>
              {hasSecondary ? (
                <button
                  type="button"
                  onClick={() => {
                    close()
                    opts?.onSecondary?.()
                  }}
                  className={styles.secondary}
                >
                  {opts?.secondaryLabel}
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
                  void router
                }}
                className={styles.primary}
              >
                {opts?.primaryLabel || "Got it"}
              </button>
            </div>

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
