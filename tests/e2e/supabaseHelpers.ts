import { expect, type Browser, type BrowserContext, type Page, type TestInfo } from "playwright/test"

export const PRIMARY_EMAIL = process.env.DEV_WORKSPACE_EMAIL || ""
export const PRIMARY_PASSWORD = process.env.DEV_WORKSPACE_PASSWORD || ""
export const SECONDARY_EMAIL = process.env.DEV_WORKSPACE_SECONDARY_EMAIL || ""
export const SECONDARY_PASSWORD = process.env.DEV_WORKSPACE_SECONDARY_PASSWORD || ""
export const IS_SUPABASE_MODE = process.env.PLAYWRIGHT_AUTH_MODE === "supabase"
export const HAS_PRIMARY_WORKSPACE = IS_SUPABASE_MODE && Boolean(PRIMARY_EMAIL && PRIMARY_PASSWORD)
export const HAS_SECONDARY_WORKSPACE = HAS_PRIMARY_WORKSPACE && Boolean(SECONDARY_EMAIL && SECONDARY_PASSWORD)

export async function signIn(page: Page, email = PRIMARY_EMAIL, password = PRIMARY_PASSWORD) {
  await page.goto("/")
  await page.getByRole("link", { name: /sign in/i }).click().catch(() => {})
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })
}

export async function signOut(page: Page) {
  await page.goto("/dashboard/settings")
  await page.getByRole("button", { name: /sign out|logout/i }).click()
  await expect(page).toHaveURL(/\/$/)
}

export async function signedInPage(browser: Browser, email = PRIMARY_EMAIL, password = PRIMARY_PASSWORD) {
  const context = await browser.newContext({ acceptDownloads: true })
  const page = await context.newPage()
  const guard = installBrowserGuards(page)
  await signIn(page, email, password)
  return { context, page, guard }
}

export function installBrowserGuards(page: Page, allowedFailure?: (url: string, status: number) => boolean) {
  const errors: string[] = []

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console error: ${message.text()}`)
    }
  })

  page.on("pageerror", (error) => {
    errors.push(`page error: ${error.message}`)
  })

  page.on("response", (response) => {
    const url = response.url()
    const sameOrigin = url.includes("localhost") || url.includes("127.0.0.1")
    const status = response.status()
    if (sameOrigin && status >= 400 && !allowedFailure?.(url, status)) {
      errors.push(`request failed: ${status} ${url}`)
    }
  })

  return {
    assertClean() {
      expect(errors, errors.join("\n")).toEqual([])
    },
  }
}

export async function captureWorkflowScreenshot(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(`${name}.png`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  })
}

export async function expectSeededDashboard(page: Page) {
  await page.goto("/dashboard")
  await expect(page.getByText(/Rolling 12-month revenue|Recent invoices|Top customers/i).first()).toBeVisible()
  await expect(page.getByText(/EasyBill Development Workspace/i)).toBeVisible()
}

export async function waitForWorkspaceIdle(page: Page) {
  await expect(page.getByText(/Saving|Pending Sync|Sync Failed - Retry/i)).toHaveCount(0, { timeout: 20_000 })
}

export async function expectNonEmptyPdfDownload(page: Page, trigger: () => Promise<void>, filenamePattern = /\.pdf$/i) {
  const downloadPromise = page.waitForEvent("download")
  await trigger()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(filenamePattern)
  const stream = await download.createReadStream()
  let size = 0
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => {
      size += chunk.length
    })
    stream.on("end", resolve)
    stream.on("error", reject)
  })
  expect(size).toBeGreaterThan(0)
}

export async function openFirstSeededInvoice(page: Page) {
  await page.goto("/dashboard/invoices")
  await expect(page.getByText(/DEV-0001/i).first()).toBeVisible()
  await page.getByText(/DEV-0001/i).first().click()
  await expect(page).toHaveURL(/\/dashboard\/invoices\/view\//)
}

export async function openFirstSeededInvoiceView(page: Page) {
  await page.goto("/dashboard/invoices")
  await expect(page.getByText(/DEV-0001/i).first()).toBeVisible()
  const viewLink = page.locator("a[href*='/dashboard/invoices/view/']").first()
  if (await viewLink.count()) {
    await viewLink.click()
  } else {
    await page.getByText(/DEV-0001/i).first().click()
  }
  await expect(page).toHaveURL(/\/dashboard\/invoices\/view\//)
}

export async function createTempProduct(page: Page, prefix = "PW-TEMP") {
  const name = `${prefix}-${Date.now()}`
  await page.goto("/dashboard/products")
  await page.getByPlaceholder(/e\.g\. Website design/i).fill(name)
  await page.getByPlaceholder("Code").fill("998399")
  await page.getByPlaceholder("pcs, hr").fill("PCS")
  await page.getByPlaceholder("0.00").fill("1234")
  await page.getByPlaceholder("%").nth(0).fill("9")
  await page.getByPlaceholder("%").nth(1).fill("9")
  await page.getByRole("button", { name: /save product/i }).click()
  await expect(page.getByText("Saved to Cloud").first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(name).first()).toBeVisible()
  return name
}

export async function closeContexts(...contexts: BrowserContext[]) {
  await Promise.all(contexts.map((context) => context.close().catch(() => {})))
}
