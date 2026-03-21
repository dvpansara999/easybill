export const DEFAULT_TEMPLATE_ID = "modern-atlas"

export const CURRENT_TEMPLATE_IDS = [
  "modern-atlas",
  "modern-orbital",
  "modern-prism",
  "modern-ledgerflow",
  "modern-zenboard",
  "modern-studiox",
  "minimal-mist",
  "minimal-inkgrid",
  "minimal-lattice",
  "minimal-slateform",
  "minimal-legal",
  "minimal-airmail",
  "classic-registry",
  "classic-merchantile",
  "classic-notaryx",
  "classic-courthouse",
  "classic-heritagex",
  "classic-carboncopy",
] as const

const currentSet = new Set<string>(CURRENT_TEMPLATE_IDS)

const LEGACY_TO_CURRENT: Record<string, string> = {
  default: "classic-registry",
  "classic-default": "classic-registry",
  "classic-gst": "classic-notaryx",
  "classic-ledger": "classic-registry",
  "classic-bold": "classic-carboncopy",
  "classic-office": "classic-merchantile",
  "classic-india": "classic-heritagex",
  "classic-royal": "classic-courthouse",
  "modern-default": "modern-atlas",
  "modern-pro": "modern-atlas",
  "modern-slate": "modern-ledgerflow",
  "modern-clean": "modern-orbital",
  "modern-grid": "modern-prism",
  "modern-glass": "modern-prism",
  "modern-stripe": "modern-zenboard",
  "minimal-light": "minimal-mist",
  "minimal-white": "minimal-mist",
  "minimal-soft": "minimal-airmail",
  "minimal-pro": "minimal-inkgrid",
  "minimal-paper": "minimal-legal",
  "minimal-ink": "minimal-inkgrid",
}

export function resolveTemplateId(input: unknown): string {
  const raw = typeof input === "string" ? input.trim() : ""
  if (!raw) return DEFAULT_TEMPLATE_ID
  if (currentSet.has(raw)) return raw
  const mapped = LEGACY_TO_CURRENT[raw]
  if (mapped) return mapped
  if (raw.startsWith("modern")) return "modern-atlas"
  if (raw.startsWith("minimal")) return "minimal-mist"
  if (raw.startsWith("classic")) return "classic-registry"
  return DEFAULT_TEMPLATE_ID
}

