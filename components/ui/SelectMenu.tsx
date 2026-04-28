"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check } from "lucide-react"

export type SelectOption<T extends string> = {
  value: T
  label: string
}

export default function SelectMenu<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  className = "",
}: {
  value: T
  onChange: (next: T) => void
  options: Array<SelectOption<T>>
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [useNativeMobile, setUseNativeMobile] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  })
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const selected = useMemo(() => options.find((o) => o.value === value) || null, [options, value])

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)")
    const small = window.matchMedia("(max-width: 767px)")
    const apply = () => setUseNativeMobile(coarse.matches || small.matches)
    apply()
    coarse.addEventListener("change", apply)
    small.addEventListener("change", apply)
    return () => {
      coarse.removeEventListener("change", apply)
      small.removeEventListener("change", apply)
    }
  }, [])

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      const target = e.target as Node | null
      if (!target) return
      const insideWrap = wrapRef.current?.contains(target)
      const insidePortal = target instanceof Element && target.closest("[data-select-menu-portal='true']")
      if (!insideWrap && !insidePortal) {
        setOpen(false)
      }
    }
    function onDocTouch(e: TouchEvent) {
      const target = e.target as Node | null
      if (!target) return
      const insideWrap = wrapRef.current?.contains(target)
      const insidePortal = target instanceof Element && target.closest("[data-select-menu-portal='true']")
      if (!insideWrap && !insidePortal) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocDown)
    document.addEventListener("touchstart", onDocTouch)
    return () => {
      document.removeEventListener("mousedown", onDocDown)
      document.removeEventListener("touchstart", onDocTouch)
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === "Escape") {
        e.preventDefault()
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    if (!open || useNativeMobile) return

    const updatePosition = () => {
      const button = buttonRef.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const desiredWidth = rect.width
      const horizontalPadding = 12
      const estimatedMenuHeight = Math.min(256, options.length * 44 + 8)
      const left = Math.min(
        Math.max(horizontalPadding, rect.left),
        Math.max(horizontalPadding, viewportWidth - desiredWidth - horizontalPadding)
      )
      const spaceBelow = viewportHeight - rect.bottom - 12
      const top =
        spaceBelow >= estimatedMenuHeight
          ? rect.bottom + 8
          : Math.max(12, rect.top - estimatedMenuHeight - 8)

      setMenuStyle({
        top,
        left,
        width: desiredWidth,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open, options.length, useNativeMobile])

  if (useNativeMobile) {
    return (
      <div ref={wrapRef} className={`relative ${className}`}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          disabled={disabled}
          className={`w-full appearance-none truncate whitespace-nowrap rounded-2xl border px-4 py-3 pr-10 text-sm shadow-sm outline-none transition-[border-color,box-shadow,background-color,color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
              : "app-select-shell border-[rgba(83,93,105,0.11)] text-slate-900 focus:border-[rgba(29,107,95,0.38)] focus:ring-4 focus:ring-[rgba(29,107,95,0.12)]"
          }`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${disabled ? "text-slate-300" : "text-slate-400"}`} />
      </div>
    )
  }

  const canUsePortal = typeof document !== "undefined"

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
            : "app-select-shell border-[rgba(83,93,105,0.11)] text-slate-900 hover:border-[rgba(83,93,105,0.2)] focus:border-[rgba(29,107,95,0.38)] focus:outline-none focus:ring-4 focus:ring-[rgba(29,107,95,0.12)]"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`min-w-0 flex-1 truncate whitespace-nowrap ${selected ? "text-slate-900" : "text-slate-400"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 ${disabled ? "text-slate-300" : "text-slate-400"}`} />
      </button>

      {open && canUsePortal
        ? createPortal(
            <div
              data-select-menu-portal="true"
              role="listbox"
              className="fixed z-[140] overflow-hidden rounded-2xl border border-[rgba(83,93,105,0.11)] bg-[rgba(255,255,255,0.88)] shadow-[0_20px_52px_rgba(31,41,55,0.12)] backdrop-blur-xl"
              style={{
                top: menuStyle.top,
                left: menuStyle.left,
                width: menuStyle.width,
              }}
            >
              <div className="max-h-64 overflow-auto py-1">
                {options.map((opt) => {
                  const isSelected = opt.value === value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(opt.value)
                        setOpen(false)
                        buttonRef.current?.focus()
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-[background-color,color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        isSelected
                          ? "bg-[rgba(29,107,95,0.08)] text-slate-900"
                          : "text-slate-700 hover:bg-white/80"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate whitespace-nowrap">{opt.label}</span>
                      {isSelected ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                    </button>
                  )
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}

