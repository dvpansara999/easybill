import { expect, test, type Page } from "playwright/test"
import {
  HAS_SECONDARY_WORKSPACE,
  PRIMARY_EMAIL,
  PRIMARY_PASSWORD,
  SECONDARY_EMAIL,
  SECONDARY_PASSWORD,
  captureWorkflowScreenshot,
  installBrowserGuards,
  signIn,
  signOut,
} from "./supabaseHelpers"

const PRIMARY_USER_ID = process.env.DEV_WORKSPACE_USER_ID || ""
const SECONDARY_USER_ID = process.env.DEV_WORKSPACE_SECONDARY_USER_ID || ""
const PRIMARY_WORKSPACE = /EasyBill Development Workspace/i
const SECONDARY_WORKSPACE = /EasyBill Isolation Workspace/i

test.skip(
  !HAS_SECONDARY_WORKSPACE || !PRIMARY_USER_ID || !SECONDARY_USER_ID,
  "Session isolation browser tests require primary and secondary dev workspace accounts."
)

async function expectSecondaryOnlyDashboard(page: Page) {
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText(SECONDARY_WORKSPACE).first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(PRIMARY_WORKSPACE)).toHaveCount(0)
  await expect(page.getByText(/Rolling 12-month revenue|Recent invoices|Top customers/i).first()).toBeVisible()
}

async function expectNoScopedKeys(page: Page, userId: string) {
  const keys = await page.evaluate((id) => {
    const suffix = `::${id}`
    return Object.keys(localStorage).filter((key) => key.endsWith(suffix) || key.includes(`warm-cache:`) && key.endsWith(suffix))
  }, userId)
  expect(keys).toEqual([])
}

async function scopedKeyCount(page: Page, userId: string) {
  return page.evaluate((id) => {
    const suffix = `::${id}`
    return Object.keys(localStorage).filter((key) => key.endsWith(suffix)).length
  }, userId)
}

async function hardRefresh(page: Page) {
  const load = page.waitForLoadState("domcontentloaded", { timeout: 20_000 }).catch(() => {})
  await page.keyboard.press("Control+F5").catch(async () => {
    await page.reload({ waitUntil: "domcontentloaded" })
  })
  await load
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {})
}

test("@auth Account A logout then Account B refresh never renders Account A data", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Account switching cache tests run in desktop Chromium.")
  const guard = installBrowserGuards(page)

  await signIn(page, PRIMARY_EMAIL, PRIMARY_PASSWORD)
  await expect(page.getByText(PRIMARY_WORKSPACE).first()).toBeVisible({ timeout: 20_000 })

  await signOut(page)
  await expectNoScopedKeys(page, PRIMARY_USER_ID)

  await signIn(page, SECONDARY_EMAIL, SECONDARY_PASSWORD)
  await expectSecondaryOnlyDashboard(page)
  await page.reload({ waitUntil: "domcontentloaded" })
  await expectSecondaryOnlyDashboard(page)
  await captureWorkflowScreenshot(page, testInfo, "supabase-account-b-after-refresh")

  guard.assertClean()
})

test("@auth Account A cache cannot bleed into Account B after hard refresh", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Hard-refresh cache tests run in desktop Chromium.")
  const guard = installBrowserGuards(page)

  await signIn(page, PRIMARY_EMAIL, PRIMARY_PASSWORD)
  await page.goto("/dashboard/products")
  await expect(page.getByText(/Cement PPC/i).first()).toBeVisible({ timeout: 20_000 })
  expect(await scopedKeyCount(page, PRIMARY_USER_ID)).toBeGreaterThan(0)

  await signOut(page)
  await expectNoScopedKeys(page, PRIMARY_USER_ID)

  await signIn(page, SECONDARY_EMAIL, SECONDARY_PASSWORD)
  await expectSecondaryOnlyDashboard(page)
  await page.reload({ waitUntil: "domcontentloaded" })
  await expectSecondaryOnlyDashboard(page)
  await hardRefresh(page)
  await expectSecondaryOnlyDashboard(page)
  await expectNoScopedKeys(page, PRIMARY_USER_ID)
  await captureWorkflowScreenshot(page, testInfo, "supabase-account-b-after-hard-refresh")

  guard.assertClean()
})

test("@auth same browser account change shows blocking guidance", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Same-browser account switch detection runs in desktop Chromium.")
  const guard = installBrowserGuards(page)

  await signIn(page, PRIMARY_EMAIL, PRIMARY_PASSWORD)
  await expect(page.getByText(PRIMARY_WORKSPACE).first()).toBeVisible({ timeout: 20_000 })

  const secondTab = await context.newPage()
  const secondGuard = installBrowserGuards(secondTab)
  await signIn(secondTab, SECONDARY_EMAIL, SECONDARY_PASSWORD)
  await expect(secondTab.getByText(SECONDARY_WORKSPACE).first()).toBeVisible({ timeout: 20_000 })

  await expect(page.getByText("Account changed in another tab.")).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText("One easyBILL account is supported per browser profile.")).toBeVisible()
  await expect(page.getByText(/separate browser profile, private window, or different browser/i)).toBeVisible()
  await captureWorkflowScreenshot(page, testInfo, "supabase-same-browser-account-changed")

  guard.assertClean()
  secondGuard.assertClean()
  await secondTab.close()
})

test("@auth pre-auth setup draft promotes to user-scoped storage after authentication", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Setup draft storage checks run in desktop Chromium.")
  const guard = installBrowserGuards(page)
  const draftBusinessName = `Preauth Draft ${Date.now()}`

  await page.goto("/setup/profile")
  await page.getByLabel("Business name").fill(draftBusinessName)
  await page.getByLabel("Email", { exact: true }).fill(PRIMARY_EMAIL)
  await page.getByLabel("Confirm email").fill(PRIMARY_EMAIL)
  await page.getByRole("button", { name: /continue/i }).click()
  await expect(page).toHaveURL(/\/setup\/profile\/contact/)

  const anonymousStorage = await page.evaluate(() => ({
    tempDraft: sessionStorage.getItem("easybill:preauth:setupProfileDraft"),
    tempResume: sessionStorage.getItem("easybill:preauth:setupResumePath"),
    unscopedDraft: localStorage.getItem("setupProfileDraft"),
    unscopedResume: localStorage.getItem("setupResumePath"),
  }))
  expect(anonymousStorage.tempDraft).toContain(draftBusinessName)
  expect(anonymousStorage.tempResume).toBe("/setup/profile/contact")
  expect(anonymousStorage.unscopedDraft).toBeNull()
  expect(anonymousStorage.unscopedResume).toBeNull()

  await signIn(page, PRIMARY_EMAIL, PRIMARY_PASSWORD)
  await page.goto("/setup/profile")
  await expect(page.getByLabel("Business name")).toHaveValue(draftBusinessName)

  const authenticatedStorage = await page.evaluate((userId) => ({
    scopedDraft: localStorage.getItem(`setupProfileDraft::${userId}`),
    tempDraft: sessionStorage.getItem("easybill:preauth:setupProfileDraft"),
    unscopedDraft: localStorage.getItem("setupProfileDraft"),
  }), PRIMARY_USER_ID)
  expect(authenticatedStorage.scopedDraft).toContain(draftBusinessName)
  expect(authenticatedStorage.tempDraft).toBeNull()
  expect(authenticatedStorage.unscopedDraft).toBeNull()
  await captureWorkflowScreenshot(page, testInfo, "supabase-setup-draft-promoted")

  guard.assertClean()
})
