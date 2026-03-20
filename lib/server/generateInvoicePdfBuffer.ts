import { chromium } from "playwright-core"

export type PdfGenSuccess = {
  ok: true
  pdfBytes: Uint8Array
  elapsedMs: number
}

export type PdfGenFailure = {
  ok: false
  code: "PDF_ENGINE" | "PDF_NAV_TIMEOUT" | "PDF_READY_TIMEOUT" | "PDF_RENDER"
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
    return chromium.launch({
      args: chromiumPack.args,
      executablePath,
      headless: false,
    })
  }
  const { chromium: full } = await import("playwright")
  return full.launch({ headless: true })
}

export async function generateInvoicePdfBuffer(params: { html: string }): Promise<PdfGenResult> {
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
      await page.setContent(params.html, { waitUntil: "domcontentloaded", timeout: 45_000 })
    } catch {
      return {
        ok: false,
        code: "PDF_NAV_TIMEOUT",
        message: "PDF HTML template did not load in time.",
        httpStatus: 504,
      }
    }

    try {
      await page.waitForSelector("#pdf-ready[data-ready='1']", { timeout: 45_000 })
    } catch {
      const diag = await page
        .evaluate(() => {
          const root = document.querySelector(".page")
          const textLen = (root?.textContent || "").trim().length
          const rowCount = document.querySelectorAll("tbody tr").length
          const hasSummary = !!document.querySelector(".summary")
          return {
            textLen,
            rowCount,
            hasSummary,
            hasReady: !!document.getElementById("pdf-ready"),
            readyAttr: document.getElementById("pdf-ready")?.getAttribute("data-ready"),
          }
        })
        .catch(() => null)
      console.error("[invoice-pdf] ready timeout diagnostics:", diag)

      // Soft fallback: if core invoice DOM exists, continue PDF generation.
      const looksRenderable =
        !!diag &&
        typeof (diag as { textLen?: unknown }).textLen === "number" &&
        Number((diag as { textLen: number }).textLen) > 80 &&
        Boolean((diag as { hasSummary?: unknown }).hasSummary)
      if (!looksRenderable) {
        return {
          ok: false,
          code: "PDF_READY_TIMEOUT",
          message: "Invoice layout did not become ready for PDF export.",
          httpStatus: 504,
        }
      }
    }

    try {
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "8mm", right: "8mm", bottom: "8mm", left: "8mm" },
        preferCSSPageSize: false,
        tagged: false,
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
