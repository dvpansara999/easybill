import { expect, test } from "playwright/test"
import {
  HAS_PRIMARY_WORKSPACE,
  captureWorkflowScreenshot,
  installBrowserGuards,
  signIn,
} from "./supabaseHelpers"

test.skip(!HAS_PRIMARY_WORKSPACE, "Lifecycle UI tests require the primary development workspace.")

test("@lifecycle reset and delete actions require deliberate confirmation before any destructive operation", async ({ page }, testInfo) => {
  const guard = installBrowserGuards(page)
  await signIn(page)

  await page.goto("/dashboard/settings")
  await expect(page.getByText(/Danger Zone/i)).toBeVisible()
  await page.getByRole("button", { name: /Reset Account/i }).click()
  await expect(page.getByText(/We recommend exporting your invoices and customer data before continuing/i)).toBeVisible()
  await expect(page.getByLabel(/Type RESET to confirm/i)).toBeVisible()
  await expect(page.getByRole("button", { name: /Confirm Reset/i })).toBeDisabled()
  await captureWorkflowScreenshot(page, testInfo, "supabase-lifecycle-reset-guard")
  await page.getByRole("button", { name: /Cancel/i }).click()

  await page.getByRole("button", { name: /Delete Account/i }).click()
  await expect(page.getByText(/permanently deletes your easyBILL account/i)).toBeVisible()
  await expect(page.getByLabel(/Type DELETE to confirm/i)).toBeVisible()
  await expect(page.getByRole("button", { name: /Permanently Delete Account/i })).toBeDisabled()
  await captureWorkflowScreenshot(page, testInfo, "supabase-lifecycle-delete-guard")
  await page.getByRole("button", { name: /Cancel/i }).click()

  guard.assertClean()
})
