import type { Metadata } from "next"
import type { SeoPageDefinition } from "./seoPageTypes"
import { BRAND_NAME, metadataImagesForPage } from "./siteMetadata"
import { siteOrigin } from "./siteOrigin"

export function metadataForSeoPage(def: SeoPageDefinition): Metadata {
  const url = `${siteOrigin()}${def.path}`
  const images = metadataImagesForPage(def.meta.title, def.meta.description, def.path)
  return {
    title: def.meta.title,
    description: def.meta.description,
    alternates: { canonical: def.path },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: def.meta.title,
      description: def.meta.description,
      url,
      siteName: BRAND_NAME,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: def.meta.title,
      description: def.meta.description,
      images: images.map((image) => image.url),
    },
  }
}
