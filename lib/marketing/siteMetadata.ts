import { siteOrigin } from "./siteOrigin"

export const BRAND_NAME = "easyBILL"
export const BRAND_DESCRIPTION = "easyBILL - modern invoice workspace"
export const OG_IMAGE_PATH = "/opengraph-image"
export const TWITTER_IMAGE_PATH = "/twitter-image"
export const BRAND_LOGO_PATH = "/icon-512.png"

export function absoluteSiteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${siteOrigin()}${normalizedPath}`
}

export function defaultMetadataImages() {
  const ogImage = absoluteSiteUrl(OG_IMAGE_PATH)
  return [
    {
      url: ogImage,
      width: 1200,
      height: 630,
      alt: "easyBILL preview card",
    },
  ]
}
