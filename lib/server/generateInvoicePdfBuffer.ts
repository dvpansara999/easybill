import { existsSync } from "node:fs"
import { chromium } from "playwright-core"

export type PdfGenSuccess = {
  ok: true
  pdfBytes: Uint8Array
  elapsedMs: number
}

export type PdfGenFailure = {
  ok: false
  code: "PDF_ENGINE" | "PDF_NAV_TIMEOUT" | "PDF_RENDER"
  message: string
  httpStatus: number
}

export type PdfGenResult = PdfGenSuccess | PdfGenFailure

function stringifyLaunchError(error: unknown) {
  if (error instanceof Error) {
    return error.stack || error.message
  }
  return String(error)
}

async function launchBrowser() {
  const onVercel = process.env.VERCEL === "1"
  if (onVercel) {
    const chromiumPack = (await import("@sparticuz/chromium")).default
    try {
      chromiumPack.setGraphicsMode = false
    } catch {
      // ignore
    }
    const executablePath = await chromiumPack.executablePath()
    console.info("[invoice-pdf] browser-launch", { mode: "vercel-chromium", executablePath })
    return chromium.launch({
      args: chromiumPack.args,
      executablePath,
      headless: true,
    })
  }

  const { chromium: full } = await import("playwright")
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ]
  const configuredPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim()
  const configuredPathExists = configuredPath ? existsSync(configuredPath) : false
  const attempted: Array<{ mode: string; detail?: string; error: string }> = []

  const tryLaunch = async (
    mode: string,
    detail: string | undefined,
    options: Parameters<typeof full.launch>[0]
  ) => {
    try {
      console.info("[invoice-pdf] browser-launch", { mode, detail: detail || null })
      return await full.launch(options)
    } catch (error) {
      const rendered = stringifyLaunchError(error)
      attempted.push({ mode, detail, error: rendered })
      console.warn("[invoice-pdf] browser-launch-failed", {
        mode,
        detail: detail || null,
        error: rendered,
      })
      return null
    }
  }

  if (configuredPath && configuredPathExists) {
    const launched = await tryLaunch("local-explicit-path", configuredPath, {
      headless: true,
      executablePath: configuredPath,
      args,
    })
    if (launched) return launched
  }

  const defaultLaunch = await tryLaunch("local-default", configuredPath || undefined, {
    headless: true,
    args,
  })
  if (defaultLaunch) return defaultLaunch

  const edgeLaunch = await tryLaunch("local-channel", "msedge", {
    headless: true,
    channel: "msedge",
    args,
  })
  if (edgeLaunch) return edgeLaunch

  const chromeLaunch = await tryLaunch("local-channel", "chrome", {
    headless: true,
    channel: "chrome",
    args,
  })
  if (chromeLaunch) return chromeLaunch

  console.error("[invoice-pdf] all browser launch attempts failed", {
    configuredPath: configuredPath || null,
    configuredPathExists,
    attempted,
  })
  throw new Error("No local Playwright browser could be launched.")
}

export async function generateInvoicePdfBuffer(params: { url: string }): Promise<PdfGenResult> {
  const started = Date.now()
  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null
  try {
    browser = await launchBrowser()
  } catch (e) {
    console.error("[invoice-pdf] Chromium launch failed:", e)
    return {
      ok: false,
      code: "PDF_ENGINE",
      message: "PDF engine failed to start.",
      httpStatus: 503,
    }
  }

  try {
    const page = await browser.newPage({
      viewport: { width: 900, height: 1280 },
      deviceScaleFactor: 2,
    })
    page.setDefaultNavigationTimeout(45_000)

    try {
      await page.goto(params.url, { waitUntil: "domcontentloaded", timeout: 45_000 })
      await page.waitForSelector("[data-easybill-pdf-ready='true']", { timeout: 45_000 })
    } catch {
      return {
        ok: false,
        code: "PDF_NAV_TIMEOUT",
        message: "PDF template page did not load in time.",
        httpStatus: 504,
      }
    }

    // The render page now marks readiness after fonts, images, and layout settle.
    // Keep only a short capped network-idle cushion for any trailing browser work.
    await page.waitForLoadState("networkidle", { timeout: 1200 }).catch(() => {})
    await page.waitForTimeout(120)

    try {
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      })
      const elapsedMs = Date.now() - started
      return { ok: true, pdfBytes: new Uint8Array(pdf), elapsedMs }
    } catch (e) {
      console.error("[invoice-pdf] page.pdf failed:", e)
      return {
        ok: false,
        code: "PDF_RENDER",
        message: "Failed to render PDF document.",
        httpStatus: 500,
      }
    }
  } finally {
    try {
      await browser?.close()
    } catch {
      // ignore
    }
  }
}
