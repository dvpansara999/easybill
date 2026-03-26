import { defineConfig, devices } from "playwright/test"

const port = Number(process.env.PLAYWRIGHT_PORT || "3100")
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`
const useExistingServer = process.env.PLAYWRIGHT_USE_EXISTING_SERVER === "1"
const nextDistDir =
  process.env.NEXT_DIST_DIR ||
  `.next-playwright-e2e-${process.pid}-${Date.now().toString(36)}`

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
        command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          NEXT_DIST_DIR: nextDistDir,
          NEXT_PUBLIC_AUTH_MODE: "local",
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
        },
      },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
      testIgnore: /mobile-branding\.spec\.ts/,
    },
    {
      name: "mobile-webkit",
      use: {
        ...devices["iPhone 13"],
      },
      testMatch: /mobile-branding\.spec\.ts/,
    },
  ],
})
