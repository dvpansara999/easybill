import { expect, test } from "playwright/test"
import {
  HAS_PRIMARY_WORKSPACE,
  captureWorkflowScreenshot,
  installBrowserGuards,
  signIn,
} from "./supabaseHelpers"

test.skip(!HAS_PRIMARY_WORKSPACE, "Supabase mobile tests require the primary development workspace.")

test("@mobile seeded workspace supports core mobile navigation and invoice preview", async ({ page }, testInfo) => {
  const guard = installBrowserGuards(page)
  await signIn(page)

  await page.goto("/dashboard")
  await expect(page.getByText(/Rolling 12-month revenue/i)).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-mobile-dashboard")

  await page.goto("/dashboard/products")
  await expect(page.getByText(/Saved products/i)).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-mobile-products")

  await page.goto("/dashboard/invoices")
  await expect(page.getByText(/DEV-0001/i).first()).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-mobile-invoices")

  await page.goto("/dashboard/templates")
  await expect(page.getByText(/Invoice templates/i)).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-mobile-templates")

  await page.goto("/dashboard/settings")
  await expect(page.getByText(/Settings|Invoice Prefix|Danger Zone/i).first()).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-mobile-settings")

  guard.assertClean()
})
