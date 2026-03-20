import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF route uses Playwright / serverless Chromium — keep these out of the server bundle edge cases.
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core", "playwright"],
  /**
   * Ensure Chromium Brotli binaries under `@sparticuz/chromium/bin` are copied into the
   * serverless bundle (otherwise `executablePath()` throws "input directory does not exist").
   */
  outputFileTracingIncludes: {
    "/api/invoice-pdf": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/playwright-core/**/*",
    ],
  },
};

export default nextConfig;
