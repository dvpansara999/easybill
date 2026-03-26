import { expect, test } from "playwright/test"

test("mobile landing and branding assets stay present for share and Safari/iPhone usage", async ({ page, request }) => {
  await page.goto("/")
  await page.waitForLoadState("domcontentloaded")

  await expect(page.getByRole("heading", { name: "Professional invoices, made easy." })).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByText("easyBILL").first()).toBeVisible()
  await expect(page.getByText("Your invoice").first()).toBeVisible()

  const appleIcon = page.locator('head link[rel="apple-touch-icon"]')
  const manifest = page.locator('head link[rel="manifest"]')
  const favicon = page.locator('head link[rel="icon"]').first()

  await expect(appleIcon).toHaveAttribute("href", /apple-touch-icon\.png/)
  await expect(manifest).toHaveAttribute("href", /manifest\.webmanifest/)
  await expect(favicon).toHaveAttribute("href", /favicon/)

  const appleRes = await request.get("/apple-touch-icon.png")
  const faviconRes = await request.get("/favicon.ico")
  const manifestRes = await request.get("/manifest.webmanifest")
  const ogRes = await request.get("/opengraph-image")

  expect(appleRes.ok()).toBeTruthy()
  expect(faviconRes.ok()).toBeTruthy()
  expect(manifestRes.ok()).toBeTruthy()
  expect(ogRes.ok()).toBeTruthy()

  const manifestJson = await manifestRes.json()
  expect(manifestJson.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: "/icon-192.png" }),
      expect.objectContaining({ src: "/icon-512.png" }),
    ])
  )
})
