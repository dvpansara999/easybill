import { expect, test } from "playwright/test"
import {
  HAS_PRIMARY_WORKSPACE,
  captureWorkflowScreenshot,
  installBrowserGuards,
  signIn,
} from "./supabaseHelpers"

test.skip(!HAS_PRIMARY_WORKSPACE, "Supabase template tests require the primary development workspace.")

test("@templates template and font controls render from the seeded workspace", async ({ page }, testInfo) => {
  const guard = installBrowserGuards(page)
  await signIn(page)

  await page.goto("/dashboard/templates")
  await expect(page.getByText(/Invoice templates/i)).toBeVisible()
  await expect(page.getByText(/Active template/i)).toBeVisible()
  await expect(page.getByText(/Invoice Font/i)).toBeVisible()
  await expect(page.getByText(/Font Size/i)).toBeVisible()
  await expect(page.getByRole("button", { name: /Use This Template|Active|Upgrade/i }).first()).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-templates-fonts")

  await page.reload()
  await expect(page.getByText(/Invoice templates/i)).toBeVisible()
  guard.assertClean()
})
