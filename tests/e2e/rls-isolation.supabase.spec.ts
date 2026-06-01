import { expect, test } from "playwright/test"
import {
  HAS_SECONDARY_WORKSPACE,
  closeContexts,
  signedInPage,
} from "./supabaseHelpers"

test.skip(!HAS_SECONDARY_WORKSPACE, "RLS isolation tests require primary and secondary development workspaces.")

test("@sync secondary isolation account stays read-only for baseline checks and cannot see primary products", async ({ browser }) => {
  const primary = await signedInPage(browser)
  const secondary = await signedInPage(
    browser,
    process.env.DEV_WORKSPACE_SECONDARY_EMAIL!,
    process.env.DEV_WORKSPACE_SECONDARY_PASSWORD!
  )

  await primary.page.goto("/dashboard/products")
  await secondary.page.goto("/dashboard/products")

  await expect(primary.page.getByText(/Cement PPC/i).first()).toBeVisible()
  await expect(secondary.page.getByText(/Cement PPC/i)).toHaveCount(0)
  await expect(secondary.page.getByText(/Saved products/i)).toBeVisible()

  primary.guard.assertClean()
  secondary.guard.assertClean()
  await closeContexts(primary.context, secondary.context)
})
