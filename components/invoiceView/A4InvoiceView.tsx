"use client"

import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const PAGE_PADDING_PX = 38
const PAGE_GAP_PX = 34

type A4InvoiceViewProps = {
  TemplateComponent: React.ComponentType<any>
  templateData: any
  viewportMaxHeightPx?: number
  maxPages?: number
}

function getSupportsZoom() {
  try {
    const style = document?.body?.style as any
    return Boolean(style && "zoom" in style)
  } catch {
    return false
  }
}

const A4InvoiceView = forwardRef<HTMLDivElement, A4InvoiceViewProps>(function A4InvoiceView(
  { TemplateComponent, templateData, viewportMaxHeightPx, maxPages = 2 },
  ref
) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)

  const [wrapWidth, setWrapWidth] = useState<number>(0)
  const [contentHeight, setContentHeight] = useState<number>(A4_HEIGHT_PX)
  const [supportsZoom, setSupportsZoom] = useState(false)

  const setRefs = (node: HTMLDivElement | null) => {
    wrapRef.current = node
    if (!ref) return
    if (typeof ref === "function") ref(node)
    else (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
  }

  useEffect(() => {
    const supports = getSupportsZoom()
    setSupportsZoom(supports)
  }, [])

  // Measure wrap width before first paint to avoid a temporary fallback scale.
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const measure = () => {
      const next = wrapRef.current?.getBoundingClientRect().width || 0
      if (next > 0) setWrapWidth(next)
    }

    // Measure now, then re-measure on the next paint cycles.
    // This avoids staying on fallback scale on some mobile timing paths.
    measure()
    requestAnimationFrame(measure)
    requestAnimationFrame(measure)

    const ro = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.width || 0
      if (next > 0) setWrapWidth(next)
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = measureRef.current
    if (!el) return

    const ro = new ResizeObserver(() => {
      setContentHeight(Math.max(A4_HEIGHT_PX, el.scrollHeight || el.offsetHeight || A4_HEIGHT_PX))
    })

    ro.observe(el)
    setContentHeight(Math.max(A4_HEIGHT_PX, el.scrollHeight || el.offsetHeight || A4_HEIGHT_PX))
    return () => ro.disconnect()
  }, [TemplateComponent, templateData])

  const scale = wrapWidth ? Math.min(1, wrapWidth / A4_WIDTH_PX) : 0.9
  const rawPages = useMemo(
    () => Math.max(1, Math.ceil(contentHeight / A4_HEIGHT_PX)),
    [contentHeight]
  )
  const overflowPages = Math.min(maxPages, rawPages)

  const pageViewportHeight = Math.max(220, Math.round(A4_HEIGHT_PX * scale))
  const viewportHeight = viewportMaxHeightPx
    ? Math.min(viewportMaxHeightPx, pageViewportHeight * overflowPages + PAGE_GAP_PX * (overflowPages - 1))
    : pageViewportHeight * overflowPages + PAGE_GAP_PX * (overflowPages - 1)

  const outerOverflowClass = overflowPages > 1 ? "overflow-y-auto" : "overflow-hidden"

  return (
    <div ref={setRefs} className="relative mx-auto w-full max-w-[794px]" style={{ height: viewportHeight }}>
      <div className={`relative ${outerOverflowClass}`} style={{ height: "100%" }}>
        {/* Hidden measurer (unscaled, real A4 width).
            Must be outside the scaled transform container to keep page-count deterministic across devices. */}
        <div className="pointer-events-none absolute left-[-99999px] top-0 h-0 w-0 overflow-hidden">
          <div ref={measureRef} style={{ width: A4_WIDTH_PX, padding: PAGE_PADDING_PX }}>
            <TemplateComponent {...templateData} />
          </div>
        </div>

        <div
          className="origin-top-left will-change-transform"
          style={{
            width: A4_WIDTH_PX,
            transformOrigin: "top left",
            // Always use transform for consistent rendering across mobile browsers.
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
                    <div style={{ width: A4_WIDTH_PX, padding: PAGE_PADDING_PX }}>
                      <TemplateComponent {...templateData} />
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
})

export default A4InvoiceView

