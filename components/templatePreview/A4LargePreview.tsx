"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { templates as templateEngines } from "@/components/invoiceTemplates"
import { previewTemplateProps } from "@/lib/templatePreviewData"

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
  const Engine = getTemplateEngine(template)
  if (!Engine) return null

  const A4_WIDTH_PX = 794
  const A4_HEIGHT_PX = 1123
  const PAGE_PADDING_PX = 38 // ~10mm margin feel
  const PAGE_GAP_PX = 34

  const wrapRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [wrapWidth, setWrapWidth] = useState<number>(0)
  const [contentHeight, setContentHeight] = useState<number>(A4_HEIGHT_PX)
  const [supportsZoom, setSupportsZoom] = useState(false)

  useEffect(() => {
    if (!wrapRef.current) return
    const el = wrapRef.current
    const ro = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.width || 0
      setWrapWidth(next)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    try {
      const style = document?.body?.style as any
      setSupportsZoom(style && "zoom" in style)
    } catch {
      setSupportsZoom(false)
    }
  }, [])

  useEffect(() => {
    if (!measureRef.current) return
    const el = measureRef.current
    const ro = new ResizeObserver(() => {
      setContentHeight(Math.max(A4_HEIGHT_PX, el.scrollHeight || el.offsetHeight || A4_HEIGHT_PX))
    })
    ro.observe(el)
    setContentHeight(Math.max(A4_HEIGHT_PX, el.scrollHeight || el.offsetHeight || A4_HEIGHT_PX))
    return () => ro.disconnect()
  }, [template, fontFamily, fontSize])

  const scale = wrapWidth ? Math.min(1, wrapWidth / A4_WIDTH_PX) : 0.4
  const rawPages = useMemo(() => Math.max(1, Math.ceil(contentHeight / A4_HEIGHT_PX)), [contentHeight])
  const overflowPages = Math.min(2, rawPages)
  const enableScroll = rawPages > 1
  const pageViewportHeight = Math.max(220, Math.round(A4_HEIGHT_PX * scale))
  const viewportHeight = viewportMaxHeight ? Math.min(viewportMaxHeight, pageViewportHeight) : pageViewportHeight

  return (
    <div
      ref={wrapRef}
      className={`rounded-[18px] border border-slate-200 bg-slate-100 ${enableScroll ? "overflow-y-auto" : "overflow-y-hidden"}`}
      style={{ height: viewportHeight }}
    >
      <div className="relative mx-auto" style={{ width: A4_WIDTH_PX * scale }}>
          {/* Hidden measurer (unscaled, real A4 width) */}
          <div className="pointer-events-none absolute left-[-99999px] top-0 h-0 w-0 overflow-hidden">
            <div ref={measureRef} style={{ width: A4_WIDTH_PX, padding: PAGE_PADDING_PX }}>
              <Engine {...previewTemplateProps} templateId={template} fontFamily={fontFamily} fontSize={fontSize} />
            </div>
          </div>

          <div className="origin-top-left will-change-transform" style={{ width: A4_WIDTH_PX, transformOrigin: "top left", ...(supportsZoom ? ({ zoom: scale } as any) : { transform: `scale(${scale})` }) }}>
            {Array.from({ length: overflowPages }, (_, pageIndex) => {
              const sliceTop = pageIndex * A4_HEIGHT_PX
              return (
                <div key={pageIndex} style={{ marginBottom: pageIndex === overflowPages - 1 ? 0 : PAGE_GAP_PX }}>
                  <div
                    className="bg-white shadow-[0_18px_60px_rgba(15,23,42,0.10)] ring-1 ring-slate-200"
                    style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, overflow: "hidden" }}
                  >
                    <div style={{ transform: `translateY(-${sliceTop}px)` }}>
                      <div style={{ width: A4_WIDTH_PX, padding: PAGE_PADDING_PX }}>
                        <Engine {...previewTemplateProps} templateId={template} fontFamily={fontFamily} fontSize={fontSize} />
                      </div>
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

