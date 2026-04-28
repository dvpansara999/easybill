"use client"

import type { ReactNode } from "react"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"

type SetupWizardFrameProps = {
  step: number
  totalSteps: number
  title: string
  description?: string
  bullets?: string[]
  onBack?: (() => void) | null
  children: ReactNode
  aside?: ReactNode
}

export default function SetupWizardFrame({
  step,
  totalSteps,
  title,
  description,
  bullets = [],
  onBack,
  children,
  aside,
}: SetupWizardFrameProps) {
  const progressPct = Math.max(0, Math.min(100, Math.round((step / totalSteps) * 100)))

  return (
    <main className="app-shell relative min-h-screen overflow-hidden px-4 py-8 lg:px-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(15,23,42,0.06)_1px,_transparent_1px),linear-gradient(to_bottom,_rgba(15,23,42,0.06)_1px,_transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
      <div className="absolute left-[-10%] top-[18%] h-80 w-80 rounded-full bg-amber-200/45 blur-3xl" />
      <div className="absolute right-[-12%] top-[6%] h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1120px]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack ? (
              <button
                onClick={onBack}
                className="app-secondary-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(29,107,95,0.12)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div className="h-10 w-10" />
            )}

            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <EasyBillLogoMark size={22} className="opacity-90" />
                <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">easyBILL setup</p>
              </div>
              <p className="text-sm font-semibold text-slate-950">
                Step {step} — <span className="text-slate-600">of {totalSteps}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-xs font-semibold text-slate-600">
              {step}
              <span className="text-slate-400">/</span>
              {totalSteps}
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <header className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="font-display text-3xl leading-[1.02] text-slate-950 sm:text-4xl lg:text-5xl">{title}</h1>
            {description ? (
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
            ) : null}
          </div>

          {bullets.length > 0 ? (
            <div className="app-subtle-panel rounded-[28px] p-4 shadow-sm backdrop-blur sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Quick checklist</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {bullets.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
        </header>

        <div className={`mt-8 grid gap-4 sm:gap-6 ${aside ? "lg:grid-cols-[0.95fr_1.05fr]" : ""}`}>
          {aside ? (
            <>
              {/* Desktop: keep current aside behavior */}
              <aside className="order-2 space-y-6 lg:order-1 lg:sticky lg:top-8 lg:self-start hidden lg:block">
                {aside}
              </aside>

              {/* Mobile: collapse preview/aside so the step content stays primary */}
              <div className="order-2 lg:hidden">
                <details className="app-subtle-panel rounded-[28px] p-4 shadow-sm backdrop-blur">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                    Preview & guidance
                  </summary>
                  <div className="mt-3 space-y-6">{aside}</div>
                </details>
              </div>
            </>
          ) : null}

          <section className={aside ? "order-1 lg:order-2" : ""}>{children}</section>
        </div>
      </div>
    </main>
  )
}
