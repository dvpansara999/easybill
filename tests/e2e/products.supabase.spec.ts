import { expect, test } from "playwright/test"
import { PRIMARY_EMAIL, PRIMARY_PASSWORD, captureWorkflowScreenshot, createTempProduct, installBrowserGuards, signIn } from "./supabaseHelpers"

test.skip(process.env.PLAYWRIGHT_AUTH_MODE !== "supabase" || !PRIMARY_EMAIL || !PRIMARY_PASSWORD)

test("@sync products can be created, searched, edited, deleted, and refreshed", async ({ page }, testInfo) => {
  const guard = installBrowserGuards(page)
  await signIn(page)
  const name = await createTempProduct(page, "PW-PRODUCT")

  await page.getByPlaceholder(/search name or hsn/i).fill(name)
  await expect(page.getByText(name).first()).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-products-search")

  await page.getByRole("button", { name: /^Edit$/i }).first().click()
  await page.getByPlaceholder(/e\.g\. Website design/i).fill(`${name}-EDITED`)
  await page.getByRole("button", { name: /update product/i }).click()
  await expect(page.getByText("Saved to Cloud").first()).toBeVisible({ timeout: 20_000 })
  await page.reload()
  await page.getByPlaceholder(/search name or hsn/i).fill(`${name}-EDITED`)
  await expect(page.getByText(`${name}-EDITED`).first()).toBeVisible()

  await page.getByRole("button", { name: /^Delete$/i }).first().click()
  await expect(page.getByText("Saved to Cloud").first()).toBeVisible({ timeout: 20_000 })
  await page.reload()
  await page.getByPlaceholder(/search name or hsn/i).fill(`${name}-EDITED`)
  await expect(page.getByText(`${name}-EDITED`)).toHaveCount(0)

  guard.assertClean()
})
