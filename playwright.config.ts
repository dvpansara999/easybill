import { defineConfig, devices } from "playwright/test"
import { existsSync, readFileSync } from "node:fs"

const port = Number(process.env.PLAYWRIGHT_PORT || "3100")
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`
const useExistingServer = process.env.PLAYWRIGHT_USE_EXISTING_SERVER === "1"
const authMode = process.env.PLAYWRIGHT_AUTH_MODE === "supabase" ? "supabase" : "local"
const supabaseSpecPattern = /(?:supabase-dev-workspace|.*\.supabase)\.spec\.ts/
const nextDistDir =
  process.env.NEXT_DIST_DIR ||
  getExistingNextEnvDistDir() ||
  ".next-playwright-e2e"

function getExistingNextEnvDistDir() {
  const nextEnvPath = "next-env.d.ts"
  if (!existsSync(nextEnvPath)) return ""
  const match = readFileSync(nextEnvPath, "utf8").match(/import "\.\/(.+?)\/dev\/types\/routes\.d\.ts";/)
  return match?.[1] || ""
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    acceptDownloads: true,
  },
  webServer: useExistingServer
    ? undefined
    : {
        command: `node scripts/ensure-next-env-writable.mjs && npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          NEXT_DIST_DIR: nextDistDir,
          NEXT_PUBLIC_AUTH_MODE: authMode,
          NEXT_PUBLIC_SUPABASE_URL:
            authMode === "supabase"
              ? process.env.NEXT_PUBLIC_SUPABASE_URL || ""
              : "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            authMode === "supabase"
              ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
              : "test-anon-key",
        },
      },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: authMode === "supabase" ? supabaseSpecPattern : undefined,
      testIgnore: authMode === "supabase" ? undefined : /(?:mobile-branding|supabase-dev-workspace|.*\.supabase)\.spec\.ts/,
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
      },
      testMatch: authMode === "supabase" ? supabaseSpecPattern : /mobile-branding\.spec\.ts/,
    },
    {
      name: "mobile-webkit",
      use: {
        ...devices["iPhone 13"],
      },
      testMatch: authMode === "supabase" ? supabaseSpecPattern : /mobile-branding\.spec\.ts/,
    },
  ],
})
