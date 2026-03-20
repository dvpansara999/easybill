export const templateFontOptions = [
  { id: "system", label: "System Sans", css: 'Arial, "Helvetica Neue", sans-serif' },
  { id: "serif", label: "Classic Serif", css: 'Georgia, "Times New Roman", serif' },
  { id: "humanist", label: "Humanist", css: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { id: "mono", label: "Mono", css: '"Courier New", monospace' },
  { id: "verdana", label: "Verdana", css: 'Verdana, Geneva, sans-serif' },
  { id: "times", label: "Times New Roman", css: '"Times New Roman", Times, serif' },
  { id: "calibri", label: "Calibri", css: 'Calibri, "Segoe UI", sans-serif' },
  { id: "cambria", label: "Cambria", css: 'Cambria, Georgia, serif' },
  { id: "garamond", label: "Garamond", css: 'Garamond, "Times New Roman", serif' },
  { id: "tahoma", label: "Tahoma", css: 'Tahoma, Geneva, sans-serif' },
  { id: "palatino", label: "Palatino", css: '"Palatino Linotype", Palatino, serif' },
  { id: "book-antiqua", label: "Book Antiqua", css: '"Book Antiqua", Palatino, serif' },
  { id: "lucida", label: "Lucida Sans", css: '"Lucida Sans Unicode", "Lucida Grande", sans-serif' },
  { id: "arial-narrow", label: "Arial Narrow", css: '"Arial Narrow", Arial, sans-serif' },
  { id: "century-gothic", label: "Century Gothic", css: '"Century Gothic", Verdana, sans-serif' },
]

export const defaultTemplateTypography = {
  fontId: "system",
  fontFamily: templateFontOptions[0].css,
  fontSize: 10,
}

export const templateFontSizeOptions = Array.from({ length: 11 }, (_, idx) => idx + 7)

export function getTemplateFontCss(fontId: string) {
  return templateFontOptions.find((option) => option.id === fontId)?.css || defaultTemplateTypography.fontFamily
}

export function getStoredTemplateTypography() {
  if (typeof window === "undefined") {
    return defaultTemplateTypography
  }

  // Lazy import to avoid SSR issues.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")

  let fontId = getActiveOrGlobalItem("invoiceTemplateFontId")
  let storedSizeRaw = getActiveOrGlobalItem("invoiceTemplateFontSize")

  // Unauthenticated / edge reads: `userStore` can return null in Supabase mode.
  // Use localStorage fallback only when KV values are missing (do not override valid KV state).
  if (!fontId || !storedSizeRaw) {
    try {
      const rawFontId = localStorage.getItem("invoiceTemplateFontId")
      const rawFontSize = localStorage.getItem("invoiceTemplateFontSize")
      if (!fontId && rawFontId) fontId = rawFontId
      if (!storedSizeRaw && rawFontSize) storedSizeRaw = rawFontSize
    } catch {
      // ignore
    }
  }

  fontId = fontId || defaultTemplateTypography.fontId
  storedSizeRaw = storedSizeRaw || String(defaultTemplateTypography.fontSize)

  const storedSize = Number(storedSizeRaw)
  const normalizedSize = Number.isFinite(storedSize)
    ? Math.max(7, Math.min(17, storedSize))
    : defaultTemplateTypography.fontSize

  return {
    fontId,
    fontFamily: getTemplateFontCss(fontId),
    fontSize: normalizedSize,
  }
}

export function saveStoredTemplateTypography(fontId: string, fontSize: number) {
  if (typeof window === "undefined") {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { setActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  setActiveOrGlobalItem("invoiceTemplateFontId", fontId)
  setActiveOrGlobalItem("invoiceTemplateFontSize", String(fontSize))
}
