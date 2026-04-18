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

  if (configuredPath && configuredPathExists) {
    console.info("[invoice-pdf] browser-launch", { mode: "local-explicit-path", executablePath: configuredPath })
    return full.launch({
      headless: true,
      executablePath: configuredPath,
      args,
    })
  }

  console.info("[invoice-pdf] browser-launch", {
    mode: "local-default",
    configuredPath: configuredPath || null,
    configuredPathExists,
  })
  return full.launch({
    headless: true,
    args,
  })
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

    // Give remote images (e.g. Supabase logo URL) time to finish without failing the run:
    // optional network idle, capped; never reject the PDF path.
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(400)

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
