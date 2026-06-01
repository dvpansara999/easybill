import { expect, test } from "playwright/test"
import { PRIMARY_EMAIL, PRIMARY_PASSWORD, captureWorkflowScreenshot, installBrowserGuards, signIn } from "./supabaseHelpers"

test.skip(process.env.PLAYWRIGHT_AUTH_MODE !== "supabase" || !PRIMARY_EMAIL || !PRIMARY_PASSWORD)

test("@invoices invoice-derived customers can be searched and opened", async ({ page }, testInfo) => {
  const guard = installBrowserGuards(page)
  await signIn(page)

  await page.goto("/dashboard/customers")
  await expect(page.getByText(/Visible customers/i)).toBeVisible()
  await page.getByPlaceholder(/search/i).fill("Aarav")
  await expect(page.getByText(/Aarav Buildcon/i).first()).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-customers-search")

  await page.getByText(/Aarav Buildcon/i).first().click()
  await expect(page).toHaveURL(/\/dashboard\/customers\//)
  await expect(page.getByText(/Customer|Invoices|Revenue/i).first()).toBeVisible()
  guard.assertClean()
})
