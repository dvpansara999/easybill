import { expect, test } from "playwright/test"
import {
  PRIMARY_EMAIL,
  PRIMARY_PASSWORD,
  captureWorkflowScreenshot,
  expectSeededDashboard,
  installBrowserGuards,
  signIn,
} from "./supabaseHelpers"

test.skip(process.env.PLAYWRIGHT_AUTH_MODE !== "supabase" || !PRIMARY_EMAIL || !PRIMARY_PASSWORD)

test("@auth protects dashboard routes and preserves the signed-in session", async ({ page }, testInfo) => {
  const guard = installBrowserGuards(page)

  await page.goto("/dashboard")
  await expect(page).not.toHaveURL(/\/dashboard$/)

  await signIn(page)
  await expectSeededDashboard(page)
  await page.reload()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText(/EasyBill Development Workspace/i)).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-auth-dashboard")

  guard.assertClean()
})
