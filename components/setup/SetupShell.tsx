"use client"

import { ReactNode } from "react"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

type SetupShellProps = {
  step: string
  title: string
  description: string
  bullets: string[]
  onBack: () => void
  children: ReactNode
}

export default function SetupShell({
  step,
  title,
  description,
  bullets,
  onBack,
  children,
}: SetupShellProps) {
  return (
    <main className="app-shell relative min-h-screen overflow-hidden px-4 py-6 lg:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.1),_transparent_28%)]" />
      <div className="absolute left-[-6%] top-[10%] h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="absolute bottom-[8%] right-[-4%] h-80 w-80 rounded-full bg-sky-200/20 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-[1580px] gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="space-y-6 rounded-[34px] bg-slate-950 p-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-emerald-300/80">{step}</p>
            <h1 className="font-display mt-4 max-w-2xl text-5xl leading-[1.04] text-white">{title}</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">{description}</p>
          </div>

          <div className="grid gap-3">
            {bullets.map((item) => (
              <div key={item} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <p className="text-sm leading-6 text-slate-200">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-[34px] border-white/70 p-8 shadow-2xl">
          {children}
        </section>
      </div>
    </main>
  )
}
