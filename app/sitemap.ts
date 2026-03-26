import type { MetadataRoute } from "next"
import { SEO_PAGE_DEFINITIONS } from "@/lib/marketing/seoPagesData"
import { siteOrigin } from "@/lib/marketing/siteOrigin"

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin()
  const now = new Date()

  return [
    {
      url: `${origin}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...SEO_PAGE_DEFINITIONS.map((page) => ({
      url: `${origin}${page.path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: page.path === "/pricing" || page.path === "/features" ? 0.9 : 0.8,
    })),
    {
      url: `${origin}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ]
}
