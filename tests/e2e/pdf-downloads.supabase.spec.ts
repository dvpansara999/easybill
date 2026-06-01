import { expect, test } from "playwright/test"
import {
  HAS_PRIMARY_WORKSPACE,
  captureWorkflowScreenshot,
  expectNonEmptyPdfDownload,
  installBrowserGuards,
  openFirstSeededInvoiceView,
  signIn,
} from "./supabaseHelpers"

test.skip(!HAS_PRIMARY_WORKSPACE, "Supabase PDF tests require the primary development workspace.")

test("@pdf downloads the selected seeded invoice as a non-empty PDF", async ({ page }, testInfo) => {
  const guard = installBrowserGuards(page)
  await signIn(page)

  await openFirstSeededInvoiceView(page)
  await expect(page.getByText(/DEV-0001/i).first()).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-invoice-view")

  await expectNonEmptyPdfDownload(
    page,
    async () => {
      await page.getByRole("button", { name: /download pdf/i }).first().click()
    },
    /DEV-0001.*\.pdf$|Invoice-DEV-0001.*\.pdf$/i
  )

  guard.assertClean()
})
