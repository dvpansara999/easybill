"use client"

import { createElement, useLayoutEffect, useMemo, useRef, useState } from "react"
import { templates as templateEngines } from "@/components/invoiceTemplates"
import { previewTemplateProps } from "@/lib/templatePreviewData"
import { resolveTemplateId } from "@/lib/templateIds"

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const PAGE_PADDING_PX = 38
const PAGE_GAP_PX = 34
const OVERFLOW_EPSILON_PX = 12

function hasMeaningfulContent(node: HTMLElement) {
  const text = (node.textContent || "").replace(/\s+/g, " ").trim()
  if (text.length > 0) return true
  return Boolean(node.querySelector("img,svg,table"))
}

function measureMeaningfulHeight(container: HTMLElement) {
  const blocks = Array.from(container.querySelectorAll<HTMLElement>(".eb-content-block"))
  if (!blocks.length) return container.scrollHeight || container.offsetHeight || A4_HEIGHT_PX
  const rootRect = container.getBoundingClientRect()
  let maxBottom = 0
  for (const block of blocks) {
    if (!hasMeaningfulContent(block)) continue
    const rect = block.getBoundingClientRect()
    const bottom = rect.bottom - rootRect.top
    maxBottom = Math.max(maxBottom, bottom)
  }
  if (maxBottom <= 0) return container.scrollHeight || container.offsetHeight || A4_HEIGHT_PX
  return Math.ceil(maxBottom + 2)
}

function getTemplateEngine(id: string) {
  const resolved = resolveTemplateId(id)
  if (resolved.startsWith("modern")) return templateEngines.modern
  if (resolved.startsWith("minimal")) return templateEngines.minimal
  if (resolved.startsWith("classic")) return templateEngines.classic
  return templateEngines.default
}

export default function A4LargePreview({
  template,
  fontFamily,
  fontSize,
  viewportMaxHeight,
}: {
  template: string
  fontFamily: string
  fontSize: number
  viewportMaxHeight?: number
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [wrapWidth, setWrapWidth] = useState(0)
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX)
  const [dedicatedTermsPage, setDedicatedTermsPage] = useState(false)

  const Engine = getTemplateEngine(template)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const updateWidth = () => {
      const nextWidth = wrapRef.current?.getBoundingClientRect().width || 0
      if (nextWidth > 0) setWrapWidth(nextWidth)
    }

    updateWidth()
    requestAnimationFrame(updateWidth)
    requestAnimationFrame(updateWidth)

    const ro = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect?.width || 0
      if (nextWidth > 0) setWrapWidth(nextWidth)
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return

    const updateHeight = () => {
      const measuredHeight = measureMeaningfulHeight(el)
      setContentHeight(Math.max(A4_HEIGHT_PX, measuredHeight))
      setDedicatedTermsPage(Boolean(el.querySelector(".eb-terms-fullpage")))
    }

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(updateHeight)
    })

    ro.observe(el)
    requestAnimationFrame(updateHeight)

    return () => ro.disconnect()
  }, [template, fontFamily, fontSize])

  const scale = wrapWidth ? Math.min(1, wrapWidth / A4_WIDTH_PX) : 0.4
  const rawPages = useMemo(() => Math.max(1, Math.ceil(contentHeight / A4_HEIGHT_PX)), [contentHeight])
  const overflowPx = Math.max(0, contentHeight - A4_HEIGHT_PX)
  const overflowPages = dedicatedTermsPage ? 2 : overflowPx > OVERFLOW_EPSILON_PX ? Math.min(2, rawPages) : 1
  const enableScroll = overflowPages > 1
  const pageViewportHeight = Math.max(220, Math.round(A4_HEIGHT_PX * scale))
  const viewportHeight = viewportMaxHeight ? Math.min(viewportMaxHeight, pageViewportHeight) : pageViewportHeight
  const outerOverflowClass = enableScroll ? "overflow-y-auto overflow-x-hidden" : "overflow-y-hidden overflow-x-hidden"

  const templateElement = (pageIndex?: number) =>
    createElement(Engine, {
      ...previewTemplateProps,
      templateId: resolveTemplateId(template),
      fontFamily,
      fontSize,
      key: pageIndex ?? "measure",
    })

  return (
    <div
      ref={wrapRef}
      className={`rounded-[18px] border border-slate-200 bg-slate-100 ${outerOverflowClass}`}
      style={{ height: viewportHeight }}
    >
      <div className="relative mx-auto" style={{ width: A4_WIDTH_PX * scale }}>
        <div className="pointer-events-none absolute left-[-99999px] top-0 h-0 w-0 overflow-hidden">
          <div ref={measureRef} style={{ width: A4_WIDTH_PX, padding: PAGE_PADDING_PX }}>
            {templateElement()}
          </div>
        </div>

        <div
          className="origin-top-left will-change-transform"
          style={{
            width: A4_WIDTH_PX,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
          }}
        >
          {Array.from({ length: overflowPages }, (_, pageIndex) => {
            const pageClass = dedicatedTermsPage ? (pageIndex === 0 ? "eb-page-main" : "eb-page-terms") : ""
            const sliceTop = pageIndex * A4_HEIGHT_PX
            return (
              <div className={pageClass} key={pageIndex} style={{ marginBottom: pageIndex === overflowPages - 1 ? 0 : PAGE_GAP_PX }}>
                <div
                  className="bg-white shadow-[0_18px_60px_rgba(15,23,42,0.10)] ring-1 ring-slate-200"
                  style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, overflow: "hidden" }}
                >
                  {dedicatedTermsPage ? (
                    <div style={{ width: A4_WIDTH_PX, padding: PAGE_PADDING_PX }}>{templateElement(pageIndex)}</div>
                  ) : (
                    <div style={{ transform: `translateY(-${sliceTop}px)` }}>
                      <div style={{ width: A4_WIDTH_PX, padding: PAGE_PADDING_PX }}>{templateElement(pageIndex)}</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <style jsx>{`
        .eb-page-main :global(.eb-terms-fullpage) {
          display: none !important;
        }
        .eb-page-terms :global(.eb-content-block:not(.eb-terms-fullpage)) {
          display: none !important;
        }
        .eb-page-terms :global(.eb-terms-fullpage) {
          margin-top: 0 !important;
          break-before: auto !important;
          page-break-before: auto !important;
        }
      `}</style>
    </div>
  )
}
