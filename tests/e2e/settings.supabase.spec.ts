import { expect, test } from "playwright/test"
import {
  HAS_PRIMARY_WORKSPACE,
  captureWorkflowScreenshot,
  installBrowserGuards,
  signIn,
} from "./supabaseHelpers"

test.skip(!HAS_PRIMARY_WORKSPACE, "Supabase settings tests require the primary development workspace.")

test("@sync invoice-affecting settings hydrate and survive refresh", async ({ page }, testInfo) => {
  const guard = installBrowserGuards(page)
  await signIn(page)

  await page.goto("/dashboard/settings")
  await expect(page.getByText(/Invoice Prefix/i)).toBeVisible()
  await expect(page.getByText(/Number Format/i)).toBeVisible()
  await expect(page.getByText(/Currency Symbol/i)).toBeVisible()
  await expect(page.getByText(/DEV-/i).first()).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-settings")

  await page.reload()
  await expect(page.getByText(/Invoice Prefix/i)).toBeVisible()
  guard.assertClean()
})
