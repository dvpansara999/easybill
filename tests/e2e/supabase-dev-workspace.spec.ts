import { expect, test } from "playwright/test"

const required = [
  "DEV_WORKSPACE_EMAIL",
  "DEV_WORKSPACE_PASSWORD",
  "DEV_WORKSPACE_SECONDARY_EMAIL",
  "DEV_WORKSPACE_SECONDARY_PASSWORD",
]

test.skip(
  process.env.PLAYWRIGHT_AUTH_MODE !== "supabase" || required.some((key) => !process.env[key]),
  "Supabase dev workspace tests require PLAYWRIGHT_AUTH_MODE=supabase and dev workspace credentials."
)

async function signIn(page: import("playwright/test").Page, email: string, password: string) {
  await page.goto("/")
  await page.getByRole("link", { name: /sign in/i }).click().catch(() => {})
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test("primary seeded workspace supports dashboard, products, invoices, and PDF download", async ({ page }) => {
  await signIn(page, process.env.DEV_WORKSPACE_EMAIL!, process.env.DEV_WORKSPACE_PASSWORD!)

  await expect(page.getByText(/EasyBill Development Workspace/i)).toBeVisible()
  await page.goto("/dashboard/products")
  await expect(page.getByText(/Saved products/i)).toBeVisible()
  await expect(page.getByText(/Cement PPC|TMT Steel Bar|River Sand/i).first()).toBeVisible()

  await page.goto("/dashboard/invoices")
  await expect(page.getByText(/DEV-0001/i).first()).toBeVisible()
  await page.getByText(/DEV-0001/i).first().click()
  await expect(page.getByRole("button", { name: /download pdf/i })).toBeVisible()
})

test("secondary isolation account does not use the primary seeded baseline", async ({ browser }) => {
  const primaryContext = await browser.newContext()
  const secondaryContext = await browser.newContext()
  const primary = await primaryContext.newPage()
  const secondary = await secondaryContext.newPage()

  await signIn(primary, process.env.DEV_WORKSPACE_EMAIL!, process.env.DEV_WORKSPACE_PASSWORD!)
  await signIn(secondary, process.env.DEV_WORKSPACE_SECONDARY_EMAIL!, process.env.DEV_WORKSPACE_SECONDARY_PASSWORD!)

  await primary.goto("/dashboard/products")
  await secondary.goto("/dashboard/products")
  await expect(primary.getByText(/Cement PPC/i).first()).toBeVisible()
  await expect(secondary.getByText(/Cement PPC/i)).toHaveCount(0)

  await primaryContext.close()
  await secondaryContext.close()
})
