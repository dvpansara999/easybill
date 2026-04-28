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
        eyebrow: "Saved",
        iconWrap:
          "bg-[rgba(18,111,84,0.08)] text-[var(--accent-strong)] ring-1 ring-[rgba(18,111,84,0.14)]",
        accentBar: "bg-[linear-gradient(90deg,transparent,rgba(18,111,84,0.42),transparent)]",
        surface:
          "border-[rgba(18,111,84,0.12)] bg-[radial-gradient(circle_at_top_left,rgba(18,111,84,0.07),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,249,246,0.93))]",
        detailCard: "border-[rgba(83,93,105,0.1)] bg-white/62 text-slate-700 backdrop-blur-xl",
        eyebrowBadge: "border-[rgba(18,111,84,0.12)] bg-[rgba(18,111,84,0.06)] text-[var(--accent-strong)]",
        bullet: "bg-emerald-400",
        primary: "app-primary-button w-full min-h-[48px] rounded-2xl px-4 py-3 text-sm font-semibold text-white",
        secondary:
          "app-secondary-button w-full min-h-[46px] rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]",
      }
    case "warning":
      return {
        icon: AlertTriangle,
        eyebrow: "Review",
        iconWrap:
          "bg-[rgba(180,95,26,0.08)] text-[rgb(136,78,30)] ring-1 ring-[rgba(180,95,26,0.14)]",
        accentBar: "bg-[linear-gradient(90deg,transparent,rgba(180,95,26,0.42),transparent)]",
        surface:
          "border-[rgba(180,95,26,0.12)] bg-[radial-gradient(circle_at_top_left,rgba(180,95,26,0.07),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,249,246,0.93))]",
        detailCard: "border-[rgba(83,93,105,0.1)] bg-white/62 text-slate-700 backdrop-blur-xl",
        eyebrowBadge: "border-[rgba(180,95,26,0.12)] bg-[rgba(180,95,26,0.06)] text-[rgb(109,66,22)]",
        bullet: "bg-amber-400",
        primary: "app-primary-button w-full min-h-[48px] rounded-2xl px-4 py-3 text-sm font-semibold text-white",
        secondary:
          "app-secondary-button w-full min-h-[46px] rounded-2xl px-4 py-3 text-sm font-semibold text-[rgb(109,66,22)]",
      }
    case "danger":
      return {
        icon: AlertTriangle,
        eyebrow: "Needs attention",
        iconWrap:
          "bg-[rgba(186,52,86,0.08)] text-[rgb(142,38,61)] ring-1 ring-[rgba(186,52,86,0.14)]",
        accentBar: "bg-[linear-gradient(90deg,transparent,rgba(186,52,86,0.42),transparent)]",
        surface:
          "border-[rgba(186,52,86,0.12)] bg-[radial-gradient(circle_at_top_left,rgba(186,52,86,0.07),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,249,246,0.93))]",
        detailCard: "border-[rgba(83,93,105,0.1)] bg-white/62 text-slate-700 backdrop-blur-xl",
        eyebrowBadge: "border-[rgba(186,52,86,0.12)] bg-[rgba(186,52,86,0.06)] text-[rgb(123,31,52)]",
        bullet: "bg-rose-400",
        primary: "app-primary-button w-full min-h-[48px] rounded-2xl px-4 py-3 text-sm font-semibold text-white",
        secondary:
          "app-secondary-button w-full min-h-[46px] rounded-2xl px-4 py-3 text-sm font-semibold text-[rgb(123,31,52)]",
      }
    case "info":
    default:
      return {
        icon: Info,
        eyebrow: "Note",
        iconWrap:
          "bg-[rgba(73,101,125,0.08)] text-[rgb(63,84,106)] ring-1 ring-[rgba(73,101,125,0.14)]",
        accentBar: "bg-[linear-gradient(90deg,transparent,rgba(73,101,125,0.42),transparent)]",
        surface:
          "border-[rgba(73,101,125,0.12)] bg-[radial-gradient(circle_at_top_left,rgba(73,101,125,0.07),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,249,246,0.93))]",
        detailCard: "border-[rgba(83,93,105,0.1)] bg-white/62 text-slate-700 backdrop-blur-xl",
        eyebrowBadge: "border-[rgba(73,101,125,0.12)] bg-[rgba(73,101,125,0.06)] text-[rgb(63,84,106)]",
        bullet: "bg-slate-400",
        primary: "app-primary-button w-full min-h-[48px] rounded-2xl px-4 py-3 text-sm font-semibold text-white",
        secondary:
          "app-secondary-button w-full min-h-[46px] rounded-2xl px-4 py-3 text-sm font-semibold text-[rgb(63,84,106)]",
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
          overlayClassName="bg-[rgba(37,44,52,0.28)] supports-backdrop-filter:backdrop-blur-lg"
          className={cn(
            "top-auto bottom-2 max-h-[min(82vh,420px)] max-w-[min(calc(100vw-1rem),340px)] -translate-y-0 overflow-hidden rounded-[20px] border p-0 shadow-[0_20px_54px_rgba(58,42,28,0.13),0_8px_20px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:bottom-auto sm:top-1/2 sm:max-h-[min(86vh,460px)] sm:max-w-[380px] sm:-translate-y-1/2 sm:rounded-[24px] sm:shadow-[0_26px_68px_rgba(58,42,28,0.15),0_10px_22px_rgba(15,23,42,0.06)]",
            styles.surface,
            "duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] data-open:zoom-in-95"
          )}
        >
          <div className={cn("mx-auto mt-1.5 h-px w-4/5", styles.accentBar)} aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.62),transparent_76%)] sm:h-20" aria-hidden />

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 touch-manipulation items-center justify-center rounded-full border border-[rgba(255,255,255,0.72)] bg-white/78 text-slate-500 shadow-[0_8px_20px_rgba(58,42,28,0.07)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(29,107,95,0.16)] active:scale-95 sm:h-9 sm:w-9"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>

          <DialogHeader className="space-y-0 p-4 pb-2 text-left sm:p-5 sm:pb-2.5">
            <div className="flex gap-3 sm:gap-3.5">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] shadow-[0_10px_22px_rgba(15,23,42,0.055)] sm:h-10 sm:w-10",
                  styles.iconWrap
                )}
              >
                <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
              </div>

              <div className="min-w-0 flex-1 pr-8 text-left sm:pt-0.5">
                <div className="mb-1.5 flex">
                  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] sm:text-[10px]", styles.eyebrowBadge)}>
                    {eyebrow}
                  </span>
                </div>

                <DialogTitle className="font-display text-[1.08rem] font-semibold leading-[1.12] text-slate-950 sm:text-[1.28rem]">
                  {opts?.title || ""}
                </DialogTitle>

                {(opts?.message || details.length > 0 || opts?.footerNote) ? (
                  <div className={cn("mt-3 rounded-[16px] border px-3.5 py-2.5 sm:rounded-[18px] sm:px-4 sm:py-3", styles.detailCard)}>
                    {opts?.message ? (
                      <DialogDescription className="text-pretty text-[13px] leading-5 text-slate-600 sm:text-sm">
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

          <div className="border-t border-[rgba(255,255,255,0.68)] bg-white/42 px-4 py-3 backdrop-blur-md sm:px-5 sm:py-3.5">
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
