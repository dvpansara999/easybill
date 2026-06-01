import { expect, test } from "playwright/test"
import {
  HAS_PRIMARY_WORKSPACE,
  closeContexts,
  createTempProduct,
  signedInPage,
} from "./supabaseHelpers"

test.skip(!HAS_PRIMARY_WORKSPACE, "Supabase cross-device tests require the primary development workspace.")

test("@sync a confirmed product save appears after refresh in a second browser context", async ({ browser }) => {
  const deviceA = await signedInPage(browser)
  const deviceB = await signedInPage(browser)
  const createdName = await createTempProduct(deviceA.page, "PW-XDEVICE")

  await deviceB.page.goto("/dashboard/products")
  await deviceB.page.reload()
  await deviceB.page.getByPlaceholder(/search name or hsn/i).fill(createdName)
  await expect(deviceB.page.getByText(createdName).first()).toBeVisible({ timeout: 20_000 })

  await deviceA.page.goto("/dashboard/products")
  await deviceA.page.getByPlaceholder(/search name or hsn/i).fill(createdName)
  await deviceA.page.getByRole("button", { name: /^Delete$/i }).first().click()
  await expect(deviceA.page.getByText("Saved to Cloud").first()).toBeVisible({ timeout: 20_000 })

  deviceA.guard.assertClean()
  deviceB.guard.assertClean()
  await closeContexts(deviceA.context, deviceB.context)
})
