import { expect, test } from "playwright/test"
import {
  HAS_PRIMARY_WORKSPACE,
  captureWorkflowScreenshot,
  installBrowserGuards,
  signIn,
} from "./supabaseHelpers"

test.skip(!HAS_PRIMARY_WORKSPACE, "Supabase invoice tests require the primary development workspace.")

test("@invoices seeded invoices can be listed, viewed, and edited without losing identity", async ({ page }, testInfo) => {
  const guard = installBrowserGuards(page)
  await signIn(page)

  await page.goto("/dashboard/invoices")
  await expect(page.getByText(/Total invoices shown/i)).toBeVisible()
  await expect(page.getByText(/DEV-0001/i).first()).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-invoices-list")

  await page.getByRole("button", { name: /^Edit$/i }).first().click()
  await expect(page).toHaveURL(/\/dashboard\/invoices\/edit\//)
  await expect(page.getByLabel(/Client Name/i)).toBeVisible()
  await expect(page.getByText(/Invoice Summary/i)).toBeVisible()

  await page.goto("/dashboard/invoices")
  await expect(page.getByText(/DEV-0001/i).first()).toBeVisible()
  guard.assertClean()
})
