"use client"

import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"

type InvoicePageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  backLabel: string
  onBack: () => void
  actions?: ReactNode
}

export default function InvoicePageHeader({
  eyebrow,
  title,
  description,
  backLabel,
  onBack,
  actions,
}: InvoicePageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="app-secondary-button mb-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:mb-5 sm:w-auto sm:justify-start sm:rounded-full sm:px-4 sm:py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
        <p className="app-kicker">{eyebrow}</p>
        <h1 className="app-page-title mt-2 max-w-4xl text-2xl sm:text-3xl xl:mt-3 xl:text-4xl">{title}</h1>
        <p className="app-page-copy mt-3 max-w-2xl text-sm sm:leading-7">{description}</p>
      </div>

      {actions ? <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">{actions}</div> : null}
    </section>
  )
}

