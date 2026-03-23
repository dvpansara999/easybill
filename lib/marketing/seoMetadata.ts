import type { Metadata } from "next"
import type { SeoPageDefinition } from "./seoPageTypes"
import { siteOrigin } from "./siteOrigin"

export function metadataForSeoPage(def: SeoPageDefinition): Metadata {
  const url = `${siteOrigin()}${def.path}`
  return {
    title: def.meta.title,
    description: def.meta.description,
    alternates: { canonical: def.path },
    openGraph: {
      title: def.meta.title,
      description: def.meta.description,
      url,
      siteName: "easyBILL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: def.meta.title,
      description: def.meta.description,
    },
  }
}
