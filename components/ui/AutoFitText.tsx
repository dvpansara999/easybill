"use client"

import { useLayoutEffect, useMemo, useRef } from "react"
import type { ReactNode } from "react"

type AutoFitTextProps = {
  children: ReactNode
  spanClassName?: string
  wrapperClassName?: string
  minPx?: number
  stepPx?: number
}

/**
 * Keeps a single-line text fitting inside a fixed-width box by reducing font-size when needed.
 * - Starts from the CSS-computed font-size (from your Tailwind classes)
 * - If it overflows, it decreases until it fits or reaches `minPx`
 */
export default function AutoFitText({
  children,
  spanClassName = "",
  wrapperClassName = "",
  minPx = 12,
  stepPx = 1,
}: AutoFitTextProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const spanRef = useRef<HTMLSpanElement | null>(null)

  const runFit = useMemo(() => {
    return () => {
      const wrapper = wrapperRef.current
      const span = spanRef.current
      if (!wrapper || !span) return

      const wrapperWidth = wrapper.clientWidth
      if (!wrapperWidth) return

      const computed = window.getComputedStyle(span)
      const initial = Number.parseFloat(computed.fontSize || "")
      if (!Number.isFinite(initial)) return

      let size = initial

      // Ensure we measure with the current font-size first.
      span.style.fontSize = `${size}px`

      // Clamp font-size down if overflowed.
      while (size > minPx && span.scrollWidth > wrapperWidth) {
        size = size - stepPx
        span.style.fontSize = `${size}px`
      }
    }
  }, [minPx, stepPx])

  useLayoutEffect(() => {
    // Defer to next frame to ensure layout is settled.
    const id = window.requestAnimationFrame(() => runFit())
    return () => window.cancelAnimationFrame(id)
  }, [children, runFit])

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    const span = spanRef.current
    if (!wrapper || !span) return

    const ro = new ResizeObserver(() => runFit())
    ro.observe(wrapper)
    ro.observe(span)
    return () => ro.disconnect()
  }, [runFit])

  return (
    <div ref={wrapperRef} className={`min-w-0 ${wrapperClassName}`}>
      <span ref={spanRef} className={`whitespace-nowrap ${spanClassName}`}>
        {children}
      </span>
    </div>
  )
}

