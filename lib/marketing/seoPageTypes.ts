export type SeoIconName =
  | "Receipt"
  | "FileText"
  | "Zap"
  | "Download"
  | "Shield"
  | "Layers"
  | "Smartphone"
  | "Banknote"
  | "Palette"
  | "Users"
  | "BarChart3"
  | "Clock"
  | "CheckCircle2"
  | "Sparkles"
  | "FilePenLine"
  | "Share2"
  | "Cloud"
  | "Package"

export type SeoLandingContent = {
  heroEyebrow?: string
  heroTitle: string
  heroSubtitle: string
  problemTitle: string
  problems: { title: string; text: string }[]
  solutionTitle: string
  solutionLead: string
  solutionPoints: string[]
  featuresSectionTitle: string
  features: { icon: SeoIconName; title: string; desc: string }[]
  howItWorksTitle: string
  steps: { title: string; desc: string }[]
  faqTitle: string
  /** Each FAQ: question + 2–3 very short lines (easy to scan in the grid layout). */
  faqs: { q: string; points: string[] }[]
  ctaTitle: string
  ctaSubtitle: string
}

export type SeoPageMeta = {
  title: string
  description: string
}

export type SeoPageDefinition = {
  path: `/${string}`
  meta: SeoPageMeta
  content: SeoLandingContent
}
