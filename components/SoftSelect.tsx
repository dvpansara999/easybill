"use client"

import { useEffect, useRef, useState } from "react"

type OptionValue = string | number

type SoftSelectProps<T extends OptionValue> = {
  value: T
  options: Array<{ label: string; value: T }>
  onChange: (value: T) => void
}

export default function SoftSelect<T extends OptionValue>({ value, options, onChange }: SoftSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const current = options.find((option) => option.value === value)

  return (
    <div className="relative w-44" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-left shadow-sm backdrop-blur transition hover:bg-white/90"
      >
        {current?.label}
      </button>

      {open ? (
        <div className="absolute mt-2 w-full overflow-hidden rounded-xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-xl animate-[fadeIn_.15s_ease]">
          {options.map((option) => (
            <div
              key={String(option.value)}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className="cursor-pointer px-3 py-2 transition hover:bg-white/60"
            >
              {option.label}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
