import { expect, test } from "playwright/test"
import { PRIMARY_EMAIL, PRIMARY_PASSWORD, captureWorkflowScreenshot, installBrowserGuards, signIn } from "./supabaseHelpers"

test.skip(process.env.PLAYWRIGHT_AUTH_MODE !== "supabase" || !PRIMARY_EMAIL || !PRIMARY_PASSWORD)

test("@sync dashboard renders seeded Supabase metrics and survives refresh", async ({ page }, testInfo) => {
  const guard = installBrowserGuards(page)
  await signIn(page)

  await page.goto("/dashboard")
  await expect(page.getByText(/Rolling 12-month revenue/i)).toBeVisible()
  await expect(page.getByText(/Top customers/i)).toBeVisible()
  await expect(page.getByText(/Recent invoices/i).first()).toBeVisible()
  await expect(page.getByText(/DEV-0001|Aarav Buildcon|Narmada Traders/i).first()).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-dashboard-desktop")

  await page.reload()
  await expect(page.getByText(/Rolling 12-month revenue/i)).toBeVisible()
  guard.assertClean()
})
