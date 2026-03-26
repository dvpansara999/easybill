"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, ChevronRight, Info, Sparkles, X } from "lucide-react"
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
        statusLine: "Everything is ready to keep moving.",
        iconWrap:
          "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-emerald-500",
        surface:
          "border-emerald-100/90 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]",
        hintCard: "border-emerald-200/90 bg-emerald-50/90 text-emerald-950",
        detailCard: "border-emerald-100/80 bg-white/88 text-slate-700",
        eyebrowBadge: "border-emerald-200/90 bg-emerald-50 text-emerald-800",
        statusBadge: "border-emerald-200/80 bg-white/75 text-emerald-700",
        sparkle: "text-emerald-500/70",
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
        statusLine: "A quick correction will keep things on track.",
        iconWrap:
          "bg-amber-100 text-amber-800 ring-1 ring-amber-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-amber-500",
        surface:
          "border-amber-100/90 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]",
        hintCard: "border-amber-200/90 bg-amber-50/90 text-amber-950",
        detailCard: "border-amber-100/80 bg-white/88 text-slate-700",
        eyebrowBadge: "border-amber-200/90 bg-amber-50 text-amber-800",
        statusBadge: "border-amber-200/80 bg-white/75 text-amber-800",
        sparkle: "text-amber-500/70",
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
        statusLine: "This needs a fix before the app can continue.",
        iconWrap:
          "bg-rose-100 text-rose-700 ring-1 ring-rose-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-rose-500",
        surface:
          "border-rose-100/90 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]",
        hintCard: "border-rose-200/90 bg-rose-50/90 text-rose-950",
        detailCard: "border-rose-100/80 bg-white/88 text-slate-700",
        eyebrowBadge: "border-rose-200/90 bg-rose-50 text-rose-800",
        statusBadge: "border-rose-200/80 bg-white/75 text-rose-700",
        sparkle: "text-rose-500/70",
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
        statusLine: "Here is what the app needs from you next.",
        iconWrap:
          "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        accentBar: "bg-indigo-500",
        surface:
          "border-indigo-100/90 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]",
        hintCard: "border-indigo-200/90 bg-indigo-50/90 text-indigo-950",
        detailCard: "border-indigo-100/80 bg-white/88 text-slate-700",
        eyebrowBadge: "border-indigo-200/90 bg-indigo-50 text-indigo-800",
        statusBadge: "border-indigo-200/80 bg-white/75 text-indigo-700",
        sparkle: "text-indigo-500/70",
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
            "top-auto bottom-3 max-h-[min(92vh,760px)] max-w-[min(calc(100vw-1rem),460px)] -translate-y-0 overflow-hidden rounded-[30px] border p-0 shadow-[0_36px_96px_rgba(15,23,42,0.24),0_12px_30px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:bottom-auto sm:top-1/2 sm:max-w-[610px] sm:-translate-y-1/2 sm:rounded-[34px]",
            styles.surface,
            "duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] data-open:zoom-in-95"
          )}
        >
          <div className={cn("h-1.5 w-full rounded-t-[30px] sm:rounded-t-[34px]", styles.accentBar)} aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_72%)]" aria-hidden />

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 z-10 flex h-10 w-10 touch-manipulation items-center justify-center rounded-full border border-white/70 bg-white/82 text-slate-500 shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 active:scale-95"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>

          <DialogHeader className="space-y-0 p-5 pb-3 text-left sm:p-7 sm:pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <div
                className={cn(
                  "mx-auto flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[1.15rem] shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:mx-0 sm:h-[68px] sm:w-[68px] sm:rounded-[1.35rem]",
                  styles.iconWrap
                )}
              >
                <Icon className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={2} aria-hidden />
              </div>

              <div className="min-w-0 flex-1 text-center sm:pt-0.5 sm:text-left">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]", styles.eyebrowBadge)}>
                    {eyebrow}
                  </span>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.06em]", styles.statusBadge)}>
                    <Sparkles className={cn("h-3.5 w-3.5", styles.sparkle)} strokeWidth={2} />
                    {styles.statusLine}
                  </span>
                </div>

                <DialogTitle className="font-display pr-10 text-[1.75rem] font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:pr-8 sm:text-[2rem]">
                  {opts?.title || ""}
                </DialogTitle>

                {opts?.actionHint ? (
                  <div className={cn("mt-4 rounded-[24px] border px-4 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:px-5", styles.hintCard)}>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/60 text-current shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                      </span>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">What to do next</p>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 sm:text-[15px]">{opts.actionHint}</p>
                  </div>
                ) : null}

                {(opts?.message || details.length > 0) ? (
                  <div className={cn("mt-4 rounded-[24px] border px-4 py-3.5 sm:px-5", styles.detailCard)}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">What changed</p>
                    <DialogDescription className="mt-2 text-pretty text-sm leading-relaxed text-slate-600 sm:text-[15px] sm:leading-7">
                      {opts?.message || ""}
                    </DialogDescription>
                    {details.length > 0 ? (
                      <ul className="mt-3 space-y-2.5 text-sm leading-6 text-slate-600">
                        {details.map((detail) => (
                          <li key={detail} className="flex items-start gap-2">
                            <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", styles.bullet)} />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </DialogHeader>

          <div className="border-t border-white/70 bg-white/58 px-5 py-4 backdrop-blur-md sm:px-7 sm:py-5">
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

            {opts?.footerNote ? (
              <p className="mt-3 rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-center text-xs leading-5 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:text-left">
                {opts.footerNote}
              </p>
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
