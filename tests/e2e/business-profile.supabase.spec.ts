import { expect, test } from "playwright/test"
import {
  HAS_PRIMARY_WORKSPACE,
  captureWorkflowScreenshot,
  installBrowserGuards,
  signIn,
} from "./supabaseHelpers"

test.skip(!HAS_PRIMARY_WORKSPACE, "Supabase profile tests require the primary development workspace.")

test("@sync business profile and logo fields hydrate from Supabase", async ({ page }, testInfo) => {
  const guard = installBrowserGuards(page)
  await signIn(page)

  await page.goto("/dashboard/business")
  await expect(page.getByText(/Business Profile|Business identity|Business name/i).first()).toBeVisible()
  await expect(page.getByDisplayValue(/EasyBill Development Workspace/i)).toBeVisible()
  await expect(page.getByText(/GST|UPI|Bank|Logo/i).first()).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-business-profile")

  await page.reload()
  await expect(page.getByDisplayValue(/EasyBill Development Workspace/i)).toBeVisible()
  guard.assertClean()
})
