// @ts-nocheck
"use client"

import { createElement, useLayoutEffect, useMemo, useRef, useState } from "react"
import { templates as templateEngines } from "@/components/invoiceTemplates"
import { previewTemplateProps } from "@/lib/templatePreviewData"

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const PAGE_PADDING_PX = 38
const PAGE_GAP_PX = 34

function getTemplateEngine(id: string) {
  if (id.startsWith("modern")) return templateEngines.modern
  if (id.startsWith("minimal")) return templateEngines.minimal
  if (id === "classic-default") return templateEngines.default
  if (id.startsWith("classic")) return templateEngines.classic
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
      setContentHeight(Math.max(A4_HEIGHT_PX, el.scrollHeight || el.offsetHeight || A4_HEIGHT_PX))
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
  const overflowPages = Math.min(2, rawPages)
  const enableScroll = rawPages > 1
  const pageViewportHeight = Math.max(220, Math.round(A4_HEIGHT_PX * scale))
  const viewportHeight = viewportMaxHeight ? Math.min(viewportMaxHeight, pageViewportHeight) : pageViewportHeight
  const outerOverflowClass = enableScroll ? "overflow-y-auto overflow-x-hidden" : "overflow-y-hidden overflow-x-hidden"

  const templateElement = (pageIndex?: number) =>
    createElement(Engine, {
      ...previewTemplateProps,
      templateId: template,
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
            const sliceTop = pageIndex * A4_HEIGHT_PX
            return (
              <div key={pageIndex} style={{ marginBottom: pageIndex === overflowPages - 1 ? 0 : PAGE_GAP_PX }}>
                <div
                  className="bg-white shadow-[0_18px_60px_rgba(15,23,42,0.10)] ring-1 ring-slate-200"
                  style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, overflow: "hidden" }}
                >
                  <div style={{ transform: `translateY(-${sliceTop}px)` }}>
                    <div style={{ width: A4_WIDTH_PX, padding: PAGE_PADDING_PX }}>{templateElement(pageIndex)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
