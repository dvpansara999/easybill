import { expect, test } from "playwright/test"
import {
  PDF_BYTES,
  chooseDesktopSelectOption,
  getStoredInvoices,
  makeInvoiceSeed,
  seedAuthenticatedWorkspace,
} from "./helpers"

test("settings, invoice create/edit/view, and download flow stay stable", async ({ page }) => {
  test.setTimeout(90000)

  await seedAuthenticatedWorkspace(page)

  let exportBody: Record<string, unknown> | null = null

  await page.route("**/api/invoice-pdf-export", async (route) => {
    exportBody = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "https://downloads.easybill.test/invoice.pdf" }),
    })
  })

  await page.route("https://downloads.easybill.test/invoice.pdf", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/pdf",
      body: PDF_BYTES,
    })
  })

  await page.goto("/dashboard/settings")
  await page.locator('input[value="INV-"]').fill("DOC-")
  await chooseDesktopSelectOption(page, "0001 (4 digits)", "001 (3 digits)")
  await chooseDesktopSelectOption(page, "01 of January", "01 of March")
  await page.getByRole("button", { name: "Save Changes" }).click()
  await expect(page.getByText("Changes saved.")).toBeVisible()
  await expect
    .poll(async () =>
      page.evaluate(() => ({
        prefix: localStorage.getItem("invoicePrefix::user-e2e-001"),
        padding: localStorage.getItem("invoicePadding::user-e2e-001"),
        resetDate: localStorage.getItem("invoiceResetMonthDay::user-e2e-001"),
      }))
    )
    .toEqual({
      prefix: "DOC-",
      padding: "3",
      resetDate: "03-01",
    })

  await page.goto("/dashboard/invoices/create")
  await page.getByPlaceholder("Client Name").fill("Raj")
  await page.getByPlaceholder("Client Phone").fill("9999999999")
  await page.locator('input[type="date"]').fill("2026-03-01")
  await page.getByPlaceholder("Product").fill("Consultation")
  await page.getByPlaceholder("HSN").fill("9983")
  await page.getByPlaceholder("Qty").fill("1")
  await page.getByPlaceholder("Price").fill("1000")
  await expect(page.getByText("DOC-001").first()).toBeVisible()
  await page.getByRole("button", { name: "Save Invoice" }).click()
  await expect(page.getByText("Invoice saved")).toBeVisible()
  await page.getByRole("button", { name: "Go to invoices" }).click()

  const invoiceRow = page.locator("tbody tr", { hasText: "DOC-001" }).first()
  await expect(invoiceRow).toBeVisible()
  const invoices = await getStoredInvoices(page)
  expect(invoices).toHaveLength(1)
  const savedInvoice = invoices[0] as {
    id: string
    numberingModeAtCreation?: string
    resetMonthDayAtCreation?: string | null
    sequenceWindowStart?: string | null
    sequenceWindowEnd?: string | null
  }
  const invoiceId = String(savedInvoice.id)
  expect(savedInvoice.numberingModeAtCreation).toBe("financial-year-reset")
  expect(savedInvoice.resetMonthDayAtCreation).toBe("03-01")
  expect(savedInvoice.sequenceWindowStart).toBe("2026-03-01")
  expect(savedInvoice.sequenceWindowEnd).toBe("2027-03-01")
  const invoiceIdPattern = new RegExp(`/dashboard/invoices/view/${invoiceId.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`)
  const editUrlPattern = new RegExp(`/dashboard/invoices/edit/${invoiceId.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`)

  await invoiceRow.locator("td").first().click()
  await expect(page).toHaveURL(invoiceIdPattern)
  await expect(page.getByRole("button", { name: "Back to invoices" })).toBeVisible()

  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download PDF" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe("Invoice-DOC-001.pdf")
  expect(exportBody?.["invoiceId"]).toBe(invoiceId)

  await Promise.all([
    page.waitForURL(/\/dashboard\/invoices(\?.*)?$/, { waitUntil: "domcontentloaded" }),
    page.getByRole("button", { name: "Back to invoices" }).click(),
  ])
  await expect(invoiceRow).toBeVisible()
  await Promise.all([
    page.waitForURL(editUrlPattern, { waitUntil: "domcontentloaded" }),
    page.getByRole("button", { name: "Edit" }).first().click(),
  ])
  await page.getByPlaceholder("Client Name").fill("Raj Updated")
  await page.getByRole("button", { name: "Update Invoice" }).click()
  await expect(page.getByText("Invoice updated")).toBeVisible()
  await Promise.all([
    page.waitForURL(/\/dashboard\/invoices(\?.*)?$/, { waitUntil: "domcontentloaded" }),
    page.getByRole("button", { name: "Back to invoices" }).click(),
  ])

  await page.locator("tbody tr", { hasText: "DOC-001" }).first().click()
  await expect(page.getByText("Raj Updated").first()).toBeVisible()
})

test("mobile share uses the native share flow on the first tap without opening a new tab", async ({ page }) => {
  test.setTimeout(90000)

  await page.setViewportSize({ width: 390, height: 844 })

  await page.addInitScript(() => {
    ;(window as Window & { __shareCalls?: unknown[]; __openCalls?: unknown[] }).__shareCalls = []
    ;(window as Window & { __shareCalls?: unknown[]; __openCalls?: unknown[] }).__openCalls = []

    Object.defineProperty(window.navigator, "canShare", {
      configurable: true,
      value: (payload: { files?: File[] }) => Array.isArray(payload?.files) && payload.files.length > 0,
    })

    Object.defineProperty(window.navigator, "share", {
      configurable: true,
      value: async (payload: { files?: File[]; url?: string; title?: string }) => {
        window.__shareCalls?.push({
          hasFiles: Array.isArray(payload?.files) && payload.files.length > 0,
          url: payload?.url ?? null,
          title: payload?.title ?? null,
        })
      },
    })

    window.open = ((...args: Parameters<typeof window.open>) => {
      window.__openCalls?.push(args[0] ?? null)
      return null
    }) as typeof window.open
  })

  await seedAuthenticatedWorkspace(page, {
    invoices: [
      makeInvoiceSeed({
        id: "inv-mobile-share-001",
        invoiceNumber: "DOC-001",
        date: "2026-03-01",
      }),
    ],
    settings: {
      invoicePrefix: "DOC-",
      invoicePadding: "3",
      invoiceStartNumber: "1",
      resetYearly: "true",
      invoiceResetMonthDay: "03-01",
    },
  })

  await page.route("**/api/invoice-pdf-export", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "https://downloads.easybill.test/mobile-share.pdf" }),
    })
  })

  await page.route("https://downloads.easybill.test/mobile-share.pdf", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/pdf",
      body: PDF_BYTES,
    })
  })

  await page.goto("/dashboard/invoices/view/inv-mobile-share-001")
  await page.getByRole("button", { name: "Download PDF" }).click()
  await expect(page.getByText("PDF ready")).toBeVisible()

  await page.getByRole("button", { name: "Share PDF" }).click()

  await expect
    .poll(async () =>
      page.evaluate(() => ({
        shareCalls: window.__shareCalls ?? [],
        openCalls: window.__openCalls ?? [],
      }))
    )
    .toEqual({
      shareCalls: [{ hasFiles: true, url: null, title: "Invoice" }],
      openCalls: [],
    })
})

