"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const selected = useMemo(() => options.find((o) => o.value === value) || null, [options, value])

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      const target = e.target as Node | null
      if (!target) return
      if (wrapRef.current && !wrapRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocDown)
    return () => document.removeEventListener("mousedown", onDocDown)
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
            : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`${selected ? "text-slate-900" : "text-slate-400"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 ${disabled ? "text-slate-300" : "text-slate-400"}`} />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.14)]"
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
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                    isSelected ? "bg-emerald-50 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

