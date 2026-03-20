"use client"

import { createElement, forwardRef, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { TemplateComponentProps } from "@/components/invoiceTemplates/templateTypes"

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const PAGE_PADDING_PX = 38
const PAGE_GAP_PX = 34

type A4InvoiceViewProps = {
  TemplateComponent: React.ComponentType<TemplateComponentProps>
  templateData: TemplateComponentProps
  viewportMaxHeightPx?: number
  maxPages?: number
}

const A4InvoiceView = forwardRef<HTMLDivElement, A4InvoiceViewProps>(function A4InvoiceView(
  { TemplateComponent, templateData, viewportMaxHeightPx, maxPages = 2 },
  ref
) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [wrapWidth, setWrapWidth] = useState(0)
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX)

  const setRefs = (node: HTMLDivElement | null) => {
    wrapRef.current = node
    if (!ref) return
    if (typeof ref === "function") ref(node)
    else (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
  }

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
  }, [TemplateComponent, templateData])

  const scale = wrapWidth ? Math.min(1, wrapWidth / A4_WIDTH_PX) : 0.9
  const rawPages = useMemo(() => Math.max(1, Math.ceil(contentHeight / A4_HEIGHT_PX)), [contentHeight])
  const overflowPages = Math.min(maxPages, rawPages)
  const pageViewportHeight = Math.max(220, Math.round(A4_HEIGHT_PX * scale))
  const viewportHeight = viewportMaxHeightPx
    ? Math.min(viewportMaxHeightPx, pageViewportHeight * overflowPages + PAGE_GAP_PX * (overflowPages - 1))
    : pageViewportHeight * overflowPages + PAGE_GAP_PX * (overflowPages - 1)
  const outerOverflowClass = overflowPages > 1 ? "overflow-y-auto" : "overflow-hidden"

  const templateElement = (pageIndex?: number) =>
    createElement(TemplateComponent, {
      ...templateData,
      key: pageIndex ?? "measure",
    })

  return (
    <div ref={setRefs} className="relative mx-auto w-full max-w-[794px]" style={{ height: viewportHeight }}>
      <div className={`relative ${outerOverflowClass}`} style={{ height: "100%" }}>
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
})

export default A4InvoiceView
