import { expect, test } from "playwright/test"
import {
  BLUE_DOT_PNG,
  RED_DOT_PNG,
  TEST_USER_ID,
  getBusinessProfile,
  makeInvoiceSeed,
  seedAuthenticatedWorkspace,
} from "./helpers"

test.describe.configure({ mode: "serial" })

test("business profile logo, terms, and identity apply through invoice view", async ({ page }) => {
  test.setTimeout(90000)

  const seededInvoice = makeInvoiceSeed({ id: "inv-business-001", invoiceNumber: "DOC-001" })
  await seedAuthenticatedWorkspace(page, {
    settings: {
      invoicePrefix: "DOC-",
      invoicePadding: "3",
      invoiceStartNumber: "1",
      resetYearly: "true",
      invoiceResetMonthDay: "03-01",
    },
    invoices: [seededInvoice],
  })

  await page.goto("/dashboard/business")
  await page.getByPlaceholder("Business Name").fill("Dr.DOCTOR Labs")
  await page.getByPlaceholder("Email").fill("contact@drdoctor.test")
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "logo-red.png",
    mimeType: "image/png",
    buffer: RED_DOT_PNG,
  })
  await page.getByRole("button", { name: "Save Business Profile" }).click()
  await expect(page.getByText("Business profile saved")).toBeVisible()
  await page.getByRole("button", { name: "Got it" }).click()

  let business = await getBusinessProfile(page)
  expect(String(business?.businessName)).toBe("Dr.DOCTOR Labs")
  const firstLogo = String(business?.logo || "")
  expect(firstLogo.startsWith("data:image/")).toBeTruthy()

  await page.goto(`/dashboard/invoices/view/${seededInvoice.id}`, { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { name: "Dr.DOCTOR Labs" }).first()).toBeVisible({ timeout: 30000 })
  await expect(page.getByText("Payment due within 7 days.").first()).toBeVisible()
  await expect(page.locator('img[src^="data:image/"]').first()).toBeVisible()

  await page.goto("/dashboard/business")
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "logo-blue.png",
    mimeType: "image/png",
    buffer: BLUE_DOT_PNG,
  })
  await page.getByRole("button", { name: "Save Business Profile" }).click()
  await expect(page.getByText("Business profile saved")).toBeVisible()
  await page.getByRole("button", { name: "Got it" }).click()

  business = await getBusinessProfile(page)
  const secondLogo = String(business?.logo || "")
  expect(secondLogo.startsWith("data:image/")).toBeTruthy()
  expect(secondLogo).not.toBe(firstLogo)

  await page.getByRole("button", { name: "Remove" }).click()
  await page.getByRole("button", { name: "Save Business Profile" }).click()
  await expect(page.getByText("Business profile saved")).toBeVisible()
  await page.getByRole("button", { name: "Got it" }).click()

  business = await getBusinessProfile(page)
  expect(String(business?.logo || "")).toBe("")
})

test("setup finalization persists the saved setup draft into workspace business, settings, and invoice defaults", async ({ page }) => {
  test.setTimeout(90000)

  const setupLogo = `data:image/png;base64,${RED_DOT_PNG.toString("base64")}`

  await seedAuthenticatedWorkspace(page, {
    businessProfile: {
      businessName: "",
      address: "",
      gst: "",
      phone: "",
      email: "",
      bankName: "",
      accountNumber: "",
      ifsc: "",
      upi: "",
      terms: "",
      logo: "",
      logoShape: "square",
    },
    settings: {
      invoicePrefix: "INV-",
      invoicePadding: "4",
      invoiceStartNumber: "1",
      resetYearly: "true",
      invoiceResetMonthDay: "01-01",
    },
    invoices: [],
  })

  await page.addInitScript(
    ({ userId, logo }) => {
      localStorage.setItem(
        `setupProfileDraft::${userId}`,
        JSON.stringify({
          businessName: "Setup Clinic",
          address: "Vadodara, Gujarat",
          gst: "24ABCDE1234F1Z5",
          phone: "9876543210",
          email: "setup@easybill.test",
          emailLocked: false,
          bankName: "ICICI Bank",
          accountNumber: "123456789012",
          ifsc: "ICIC0001234",
          upi: "setup@upi",
          terms: "Setup term: payment due in 3 days.",
          logo,
          logoShape: "square",
          logoSource: logo,
          logoZoom: 1,
          logoOffsetX: 50,
          logoOffsetY: 50,
        })
      )
      localStorage.setItem(`setupResumePath::${userId}`, "/setup/profile/settings")
    },
    { userId: TEST_USER_ID, logo: setupLogo }
  )

  await page.goto("/setup/profile/settings")
  await expect(page.getByRole("heading", { name: "Set invoice defaults, then launch." })).toBeVisible()
  await page.locator('input[value="INV-"]').fill("SB-")
  await page.getByRole("button", { name: "Finish Setup" }).click()
  await expect.poll(() => page.url(), { timeout: 60000 }).toMatch(/\/setup\/profile\/finalizing|\/dashboard/)

  await page.goto("/dashboard/business")
  await expect(page.getByPlaceholder("Business Name")).toHaveValue("Setup Clinic")
  await expect(page.getByPlaceholder("Phone")).toHaveValue("9876543210")
  await expect(page.getByPlaceholder("Bank Name")).toHaveValue("ICICI Bank")
  await expect(page.locator("textarea").last()).toHaveValue("Setup term: payment due in 3 days.")
  await expect(page.locator('img[src^="data:image/"]').first()).toBeVisible()

  await page.goto("/dashboard/settings")
  await expect(page.locator('input[value="SB-"]')).toBeVisible()

  await page.goto("/dashboard/invoices/create")
  await expect(page.getByText("SB-0001").first()).toBeVisible()
})

