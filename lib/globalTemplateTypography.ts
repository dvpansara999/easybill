import { defaultTemplateTypography, getTemplateFontCss } from "@/lib/templateTypography"

export type GlobalTemplateTypography = {
  fontId: string
  fontFamily: string
  fontSize: number
}

type TypographyInput = Partial<GlobalTemplateTypography> & {
  fontSize?: number | string
}

function clampFontSize(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.max(7, Math.min(17, Math.round(v)))
  }
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.trim())
    if (Number.isFinite(n)) return Math.max(7, Math.min(17, Math.round(n)))
  }
  return defaultTemplateTypography.fontSize
}

export function normalizeTemplateTypography(input?: TypographyInput | null): GlobalTemplateTypography {
  const fontId =
    typeof input?.fontId === "string" && input.fontId.trim()
      ? input.fontId.trim()
      : defaultTemplateTypography.fontId
  const fontFamily =
    typeof input?.fontFamily === "string" && input.fontFamily.trim()
      ? input.fontFamily.trim()
      : getTemplateFontCss(fontId)
  const fontSize = clampFontSize(input?.fontSize)
  return { fontId, fontFamily, fontSize }
}

