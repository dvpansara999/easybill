import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core", "playwright"],
  outputFileTracingIncludes: {
    "/api/invoice-pdf": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/playwright-core/**/*",
    ],
  },
}

export default nextConfig
