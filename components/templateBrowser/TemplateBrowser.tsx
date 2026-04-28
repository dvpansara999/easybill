"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import SmallPreview from "@/components/templatePreview/SmallPreview"
import { previewTemplateProps } from "@/lib/templatePreviewData"
import { getStoredTemplateTypography } from "@/lib/templateTypography"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import A4LargePreview from "@/components/templatePreview/A4LargePreview"
import { canUseTemplate } from "@/lib/plans"
import { useAppAlert } from "@/components/providers/AppAlertProvider"
import { TEMPLATE_CROSS_DEVICE_PARITY } from "@/lib/templateDeviceParity"

type TemplateEntry = {
  id: string
  name: string
}

function readTemplateSelection(templates: TemplateEntry[]) {
  if (typeof window === "undefined") {
    return {
      activeTemplate: "",
      previewTemplate: templates[0]?.id || "",
      fontFamily: previewTemplateProps.fontFamily,
      fontSize: previewTemplateProps.fontSize,
    }
  }

  const savedTemplate = getActiveOrGlobalItem("invoiceTemplate") || ""
  const typography = getStoredTemplateTypography()

  return {
    activeTemplate: savedTemplate,
    previewTemplate: savedTemplate || templates[0]?.id || "",
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize,
  }
}

export default function TemplateBrowser({ templates }: { templates: TemplateEntry[] }) {
  const router = useRouter()
  const { showAlert } = useAppAlert()
  const initialSelection = useMemo(() => readTemplateSelection(templates), [templates])

  const [activeTemplate, setActiveTemplate] = useState(initialSelection.activeTemplate)
  const [previewTemplate, setPreviewTemplate] = useState(initialSelection.previewTemplate)
  const [fontFamily] = useState(initialSelection.fontFamily)
  const [fontSize] = useState(initialSelection.fontSize)
  const [page, setPage] = useState(1)
  const [isXl, setIsXl] = useState(false)

  const perPage = 12

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)")
    const apply = () => setIsXl(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  const totalPages = Math.max(1, Math.ceil(templates.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const effectivePreviewTemplate = useMemo(() => {
    if (!templates.length) return ""
    const hasPreview = templates.some((template) => template.id === previewTemplate)
    return hasPreview ? previewTemplate : templates[0].id
  }, [previewTemplate, templates])

  const pagedTemplates = useMemo(() => {
    const start = (safePage - 1) * perPage
    return templates.slice(start, start + perPage)
  }, [perPage, safePage, templates])

  const activateLabel = canUseTemplate(effectivePreviewTemplate)
    ? "Use This Template"
    : "Upgrade to use this template"

  function activateTemplate() {
    if (!canUseTemplate(effectivePreviewTemplate)) {
      showAlert({
        tone: "warning",
        title: "Template locked (Free plan)",
        actionHint: "Upgrade to Plus to unlock this template, or pick another style.",
        message: "This template is available on Plus. Upgrade to unlock it.",
        primaryLabel: "Upgrade to Plus",
        secondaryLabel: "Not now",
        onPrimary: () => router.push("/dashboard/upgrade"),
      })
      return
    }

    setActiveOrGlobalItem("invoiceTemplate", effectivePreviewTemplate)
    setActiveTemplate(effectivePreviewTemplate)

    showAlert({
      tone: "success",
      title: "Template applied",
      actionHint: "Create or preview an invoice to see it in action.",
      message: "This template will be used for new invoices and previews in easyBILL.",
    })
  }

  return (
    <div className="grid min-w-0 gap-5 pb-28 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)] xl:items-start xl:gap-6 xl:pb-0">
      <div className="min-w-0">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {pagedTemplates.map((template) => {
            const isActive = activeTemplate === template.id
            const locked = !canUseTemplate(template.id)

            return (
              <div
                key={template.id}
                role="button"
                tabIndex={0}
                onClick={() => setPreviewTemplate(template.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setPreviewTemplate(template.id)
                  }
                }}
                className={`cursor-pointer rounded-[18px] border p-2.5 transition duration-200 xl:rounded-[20px] xl:p-3 ${
                  effectivePreviewTemplate === template.id
                    ? "border-[rgba(29,107,95,0.2)] bg-[rgba(18,111,84,0.07)] shadow-[0_16px_36px_rgba(15,23,42,0.07)] ring-2 ring-[rgba(29,107,95,0.1)] xl:ring-0"
                    : "app-subtle-panel hover:-translate-y-0.5 hover:border-[rgba(83,93,105,0.2)] hover:bg-white hover:shadow-md"
                }`}
              >
                <SmallPreview template={template.id} fontFamily={fontFamily} fontSize={fontSize} />

                <p className="mt-2 line-clamp-2 text-xs font-semibold leading-tight text-slate-900 xl:mt-3 xl:text-sm">
                  {template.name} {locked ? <span className="text-slate-500">Locked</span> : null}
                </p>

                {isActive ? <p className="mt-1 text-[10px] font-medium text-emerald-700 xl:text-xs">Active</p> : null}
              </div>
            )
          })}
        </div>

        {templates.length > perPage ? (
          <div className="mt-5 space-y-3 xl:mt-6">
            <div className="flex items-center justify-between gap-3 sm:hidden">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
                className="app-secondary-button min-h-11 flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Previous
              </button>
              <p className="shrink-0 text-xs font-medium text-slate-500">
                Page {safePage} / {totalPages}
              </p>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
                className="app-secondary-button min-h-11 flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Next
              </button>
            </div>

            <div className="hidden flex-wrap items-center justify-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
                className="app-secondary-button rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    pageNumber === safePage
                      ? "app-primary-button text-white"
                      : "app-secondary-button text-slate-700 hover:bg-white"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
                className="app-secondary-button rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="soft-card flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-[22px] p-4 sm:p-5 xl:sticky xl:top-8 xl:max-w-[min(400px,100%)] xl:justify-self-end xl:rounded-[26px] xl:p-5">
        <div className="mb-3 xl:mb-4">
          <h2 className="section-title text-lg sm:text-xl xl:text-2xl">Live Preview</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">A4 preview for the selected template.</p>
        </div>

        <div className="min-h-0 flex-1">
          <A4LargePreview
            template={effectivePreviewTemplate}
            fontFamily={fontFamily}
            fontSize={fontSize}
            viewportMaxHeight={TEMPLATE_CROSS_DEVICE_PARITY ? 520 : isXl ? 520 : 360}
          />
        </div>

        <div className="mt-4 hidden xl:mt-6 xl:block">
          {activeTemplate === effectivePreviewTemplate ? (
            <button type="button" disabled className="w-full rounded-2xl bg-slate-200 py-3 text-sm font-semibold text-slate-500">
              Currently Active
            </button>
          ) : (
            <button
              type="button"
              onClick={activateTemplate}
              className={`w-full rounded-2xl py-3 text-sm font-semibold text-white transition ${
                canUseTemplate(effectivePreviewTemplate) ? "app-primary-button" : "cursor-not-allowed bg-slate-400"
              }`}
              disabled={!canUseTemplate(effectivePreviewTemplate)}
            >
              {activateLabel}
            </button>
          )}
        </div>
      </div>

      <div className="app-sticky-bar eb-safe-bottom-pad fixed inset-x-0 bottom-0 z-40 px-4 pt-3 xl:hidden">
        {activeTemplate === effectivePreviewTemplate ? (
          <button type="button" disabled className="w-full rounded-2xl bg-slate-200 py-3.5 text-sm font-semibold text-slate-500">
            Currently Active
          </button>
        ) : (
          <button
            type="button"
            onClick={activateTemplate}
            className={`w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(29,107,95,0.12)] ${
              canUseTemplate(effectivePreviewTemplate) ? "app-primary-button" : "bg-slate-400"
            }`}
            disabled={!canUseTemplate(effectivePreviewTemplate)}
          >
            {activateLabel}
          </button>
        )}
      </div>
    </div>
  )
}
