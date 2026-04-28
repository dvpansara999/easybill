"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import TemplateBrowser from "@/components/templateBrowser/TemplateBrowser"
import { templateRegistry } from "@/components/invoiceTemplates/loadTemplates"

export default function MinimalTemplatesPage() {
  const router = useRouter()
  const templates = templateRegistry.filter((t) => t.category === "minimal")

  return (
    <div className="min-w-0 space-y-5 xl:space-y-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="app-secondary-button inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950 sm:w-auto sm:justify-start sm:rounded-full sm:py-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Templates
      </button>

      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="app-kicker">Templates / Minimal</p>
          <h1 className="app-page-title mt-2 text-2xl sm:text-3xl xl:mt-3 xl:text-4xl">Minimal templates.</h1>
          <p className="app-page-copy mt-2 max-w-2xl text-xs sm:mt-3 sm:text-sm">
            Light layouts for invoices that should feel quiet and easy to scan.
          </p>
        </div>

        <div className="app-stat-card rounded-[20px] px-4 py-3 xl:min-w-[180px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Available</p>
          <p className="mt-2 text-xl font-semibold text-slate-950">{templates.length}</p>
        </div>
      </section>

      <TemplateBrowser templates={templates} />
    </div>
  )
}
