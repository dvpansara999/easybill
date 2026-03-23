/**
 * Canonical site origin for SEO metadata (Open Graph URLs, etc.).
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://www.easybill.business).
 */
export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (raw?.startsWith("http")) {
    return raw.replace(/\/$/, "")
  }
  return "https://easybill.business"
}
