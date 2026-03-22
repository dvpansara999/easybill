"use client"

import A4LargePreview from "@/components/templatePreview/A4LargePreview"
import { previewTemplateProps } from "@/lib/templatePreviewData"

/**
 * Showcase pair: flagship Modern (color + structure) + Minimal (calm editorial).
 * Different engine families so visitors immediately see range — full page, no forced crop.
 */
const LANDING_TEMPLATE_SHOWCASE = [
  { id: "modern-v01", categoryLabel: "Modern" },
  { id: "minimal-v02", categoryLabel: "Minimal" },
] as const

/**
 * Real template render (same engine as dashboard) for the public sign-in landing page.
 */
export default function LandingInvoicePreview() {
  return (
    <div className="flex w-full flex-col overflow-x-hidden rounded-xl md:rounded-2xl lg:rounded-3xl">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-white/25 px-2.5 py-2 md:gap-2 md:px-4 md:py-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400/85 md:h-3 md:w-3" />
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400/85 md:h-3 md:w-3" />
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400/85 md:h-3 md:w-3" />
        <span className="ml-0.5 line-clamp-2 min-w-0 flex-1 text-[9px] font-semibold uppercase leading-tight tracking-[0.14em] text-slate-500 md:ml-1 md:line-clamp-none md:text-[10px] md:tracking-[0.2em] lg:text-xs">
          Your invoice — same templates as the app
        </span>
      </div>
      <div className="bg-white/25 px-1 pb-1.5 pt-1.5 md:px-2 md:pb-3 md:pt-2.5">
        <div className="grid grid-cols-1 gap-3 md:gap-5 lg:grid-cols-2 lg:gap-4">
          {LANDING_TEMPLATE_SHOWCASE.map(({ id, categoryLabel }) => (
            <div key={id} className="flex min-w-0 flex-col">
              <p className="mb-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500/95 md:mb-2 md:text-[10px]">
                {categoryLabel}
              </p>
              <A4LargePreview
                template={id}
                fontFamily={previewTemplateProps.fontFamily}
                fontSize={previewTemplateProps.fontSize}
                className="rounded-xl border border-white/40 bg-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.05)] md:rounded-2xl"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
