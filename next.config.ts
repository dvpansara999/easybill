import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Browsers request /favicon.ico before or instead of metadata <link rel="icon">.
  // Without a static file, that URL 404s and tabs can keep showing a stale default (e.g. Vercel).
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/icon" },
      { source: "/apple-touch-icon.png", destination: "/apple-icon" },
    ]
  },
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core", "playwright"],
  outputFileTracingIncludes: {
    "/api/invoice-pdf": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/playwright-core/**/*",
    ],
  },
}

export default nextConfig
