import { CLASSIC_TEMPLATE_IDS, MINIMAL_TEMPLATE_IDS, MODERN_TEMPLATE_IDS } from "@/lib/templateCatalog"

export const DEFAULT_TEMPLATE_ID = "modern-v01"

export const CURRENT_TEMPLATE_IDS = [...MODERN_TEMPLATE_IDS, ...MINIMAL_TEMPLATE_IDS, ...CLASSIC_TEMPLATE_IDS] as const

const currentSet = new Set<string>(CURRENT_TEMPLATE_IDS)

const LEGACY_TO_CURRENT: Record<string, string> = {
  default: "classic-v01",
  "classic-default": "classic-v01",
  "classic-gst": "classic-v03",
  "classic-ledger": "classic-v02",
  "classic-bold": "classic-v08",
  "classic-office": "classic-v05",
  "classic-india": "classic-v07",
  "classic-royal": "classic-v10",
  "modern-default": "modern-v01",
  "modern-pro": "modern-v02",
  "modern-slate": "modern-v04",
  "modern-clean": "modern-v05",
  "modern-grid": "modern-v03",
  "modern-glass": "modern-v06",
  "modern-stripe": "modern-v09",
  "minimal-light": "minimal-v01",
  "minimal-white": "minimal-v02",
  "minimal-soft": "minimal-v06",
  "minimal-pro": "minimal-v03",
  "minimal-paper": "minimal-v10",
  "minimal-ink": "minimal-v04",
  "modern-atlas": "modern-v01",
  "modern-orbital": "modern-v02",
  "modern-prism": "modern-v03",
  "modern-ledgerflow": "modern-v04",
  "modern-zenboard": "modern-v05",
  "modern-studiox": "modern-v06",
  "minimal-mist": "minimal-v01",
  "minimal-inkgrid": "minimal-v02",
  "minimal-lattice": "minimal-v03",
  "minimal-slateform": "minimal-v04",
  "minimal-legal": "minimal-v05",
  "minimal-airmail": "minimal-v06",
  "classic-registry": "classic-v01",
  "classic-merchantile": "classic-v02",
  "classic-notaryx": "classic-v03",
  "classic-courthouse": "classic-v04",
  "classic-heritagex": "classic-v05",
  "classic-carboncopy": "classic-v06",
}

export function resolveTemplateId(input: unknown): string {
  const raw = typeof input === "string" ? input.trim() : ""
  if (!raw) return DEFAULT_TEMPLATE_ID
  if (currentSet.has(raw)) return raw
  const mapped = LEGACY_TO_CURRENT[raw]
  if (mapped) return mapped
  if (raw.startsWith("modern")) return "modern-v01"
  if (raw.startsWith("minimal")) return "minimal-v01"
  if (raw.startsWith("classic")) return "classic-v01"
  return DEFAULT_TEMPLATE_ID
}

