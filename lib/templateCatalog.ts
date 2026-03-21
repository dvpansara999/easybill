export type TemplateCatalogItem = {
  id: string
  name: string
  category: "modern" | "minimal" | "classic"
  popular?: boolean
  newest?: boolean
}

function two(n: number) {
  return String(n).padStart(2, "0")
}

const MODERN_STYLE_NAMES = ["Atlas", "Studio", "Prism", "Edge", "Frame", "Flux", "Grid", "Pulse"] as const
const MINIMAL_STYLE_NAMES = ["Pure", "Paper", "Slate", "Calm", "Mono", "Draft", "Line", "Air"] as const
const CLASSIC_STYLE_NAMES = ["Ledger", "Notary", "Mercantile", "Registry", "Office", "Heritage", "Charter", "Stamp"] as const

// Only these variants intentionally push Terms to page 2.
export const TERMS_PAGE2_TEMPLATE_IDS = new Set<string>([
  "modern-v10",
  "modern-v20",
  "modern-v30",
  "modern-v40",
  "minimal-v10",
  "minimal-v20",
  "minimal-v30",
  "minimal-v40",
  "classic-v10",
  "classic-v20",
  "classic-v30",
  "classic-v40",
])

function buildCategory(prefix: "modern" | "minimal" | "classic", label: string): TemplateCatalogItem[] {
  const styleNames =
    prefix === "modern"
      ? MODERN_STYLE_NAMES
      : prefix === "minimal"
        ? MINIMAL_STYLE_NAMES
        : CLASSIC_STYLE_NAMES
  const paletteNames = ["A", "B", "C", "D"] as const
  const out: TemplateCatalogItem[] = []
  let n = 1
  for (let layoutIdx = 0; layoutIdx < 10; layoutIdx++) {
    const style = styleNames[layoutIdx % styleNames.length]
    for (let paletteIdx = 0; paletteIdx < 4; paletteIdx++) {
      const id = `${prefix}-v${two(n)}`
      const isLegal = TERMS_PAGE2_TEMPLATE_IDS.has(id)
      const palette = paletteNames[paletteIdx]
      const name = isLegal ? `${label} Legal ${two(n)}` : `${label} ${style} ${palette}`
      out.push({
        id,
        name,
        category: prefix,
        popular: n <= 6 || n % 10 === 0,
        newest: n > 32,
      })
      n++
    }
  }
  return out
}

export const MODERN_TEMPLATE_IDS = buildCategory("modern", "Modern").map((x) => x.id)
export const MINIMAL_TEMPLATE_IDS = buildCategory("minimal", "Minimal").map((x) => x.id)
export const CLASSIC_TEMPLATE_IDS = buildCategory("classic", "Classic").map((x) => x.id)

export const TEMPLATE_REGISTRY: TemplateCatalogItem[] = [
  ...buildCategory("modern", "Modern"),
  ...buildCategory("minimal", "Minimal"),
  ...buildCategory("classic", "Classic"),
]

