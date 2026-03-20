import type { BrowserContext } from "playwright-core"

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

async function launchChromium() {
  const onVercel = process.env.VERCEL === "1"

  if (onVercel) {
    const chromiumPack = (await import("@sparticuz/chromium")).default
    // Smaller extract, fewer GPU deps — recommended for Lambda/Vercel.
    try {
      chromiumPack.setGraphicsMode = false
    } catch {
      // ignore if setter missing on older package builds
    }
    const { chromium: playwrightChromium } = await import("playwright-core")
    const executablePath = await chromiumPack.executablePath()
    // @sparticuz/chromium args already include chrome-headless-shell (`--headless=...`).
    // Playwright's default `headless: true` adds incompatible flags — launch non-headless and let args win.
    return playwrightChromium.launch({
      args: chromiumPack.args,
      executablePath,
      headless: false,
    })
  }

  const { chromium } = await import("playwright")
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim()
  return chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  })
}

/**
 * Real SaaS pattern: one server-owned pipeline from seeded print URL → vector PDF bytes.
 */
export async function generateInvoicePdfBuffer(params: {
  baseUrl: string
  lsEntries: [string, string][]
  fileInvoiceNumber: string
}): Promise<PdfGenResult> {
  const started = Date.now()
  let browser: Awaited<ReturnType<typeof launchChromium>> | null = null
  let pdfContext: BrowserContext | null = null

  try {
    browser = await launchChromium()
  } catch (launchErr) {
    const detail = launchErr instanceof Error ? launchErr.message : String(launchErr)
    console.error("[invoice-pdf] Chromium launch failed:", launchErr)
    const onVercel = process.env.VERCEL === "1"
    return {
      ok: false,
      code: "PDF_ENGINE",
      message: onVercel
        ? "PDF engine failed to start on the server. This is usually fixed by redeploying after a full npm install, or by raising the Vercel function memory (see vercel.json). Check function logs for details."
        : `PDF engine failed to start: ${detail}`,
      httpStatus: 503,
    }
  }

  if (!browser) {
    return {
      ok: false,
      code: "PDF_ENGINE",
      message: "PDF engine unavailable.",
      httpStatus: 503,
    }
  }

  try {
    pdfContext = await browser.newContext({
      viewport: { width: 880, height: 1200 },
      deviceScaleFactor: 2,
    })

    await pdfContext.addInitScript(
      (items: [string, string][]) => {
        for (const [key, value] of items) {
          try {
            localStorage.setItem(key, value)
          } catch {
            // ignore
          }
        }
      },
      params.lsEntries
    )

    const page = await pdfContext.newPage()
    const printUrl = `${params.baseUrl.replace(/\/$/, "")}/invoice-print`

    try {
      // `load` reduces race where React hydrates after `domcontentloaded` and never paints in time.
      await page.goto(printUrl, { waitUntil: "load", timeout: 60000 })
    } catch {
      return {
        ok: false,
        code: "PDF_NAV_TIMEOUT",
        message: "Invoice print page did not load in time (network or script load too slow).",
        httpStatus: 504,
      }
    }

    try {
      await page.waitForFunction(
        () => {
          const root = document.getElementById("invoice-print-root")
          const text = (root?.innerText || "").trim()
          const pdfReady =
            (window as unknown as { __EASYBILL_PDF_READY?: boolean }).__EASYBILL_PDF_READY === true
          // Prefer explicit client signal; also accept long text so we don't depend on rAF/fonts
          // if the page painted real invoice content.
          if (text.length >= 50) return true
          if (pdfReady && text.length >= 20) return true
          return false
        },
        { timeout: 90_000 }
      )
    } catch {
      const diag = await page
        .evaluate(() => {
          const root = document.getElementById("invoice-print-root")
          let pdfInvoiceLen = 0
          try {
            pdfInvoiceLen = localStorage.getItem("pdfInvoice")?.length ?? 0
          } catch {
            // ignore
          }
          return {
            hasRoot: Boolean(root),
            pdfInvoiceLen,
            pdfReady: Boolean((window as unknown as { __EASYBILL_PDF_READY?: boolean }).__EASYBILL_PDF_READY),
            textLen: (root?.innerText || "").trim().length,
            title: document.title,
            bodyHead: (document.body?.innerText || "").trim().slice(0, 120),
          }
        })
        .catch(() => null)
      console.error("[invoice-pdf] PDF_READY_TIMEOUT diagnostic:", diag)
      return {
        ok: false,
        code: "PDF_READY_TIMEOUT",
        message: "Invoice layout did not become ready for PDF export.",
        httpStatus: 504,
      }
    }

    await page.evaluate(async () => {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise<void>((r) => window.setTimeout(() => r(), 5000)),
        ])
      } catch {
        // ignore
      }
    })

    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          window.setTimeout(() => resolve(), 80)
        })
    )

    let pdf: Buffer
    try {
      pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
        tagged: false,
      })
    } catch (pdfErr) {
      console.error("[invoice-pdf] page.pdf failed:", pdfErr)
      return {
        ok: false,
        code: "PDF_RENDER",
        message: "Failed to render PDF document.",
        httpStatus: 500,
      }
    }

    const pdfBytes = new Uint8Array(pdf)
    const elapsedMs = Date.now() - started
    console.info(`[invoice-pdf] ok invoice=${params.fileInvoiceNumber} bytes=${pdfBytes.byteLength} ms=${elapsedMs}`)

    return { ok: true, pdfBytes, elapsedMs }
  } catch (e) {
    console.error("[invoice-pdf] unexpected pipeline error:", e)
    return {
      ok: false,
      code: "PDF_RENDER",
      message: "PDF generation failed.",
      httpStatus: 500,
    }
  } finally {
    try {
      await pdfContext?.close()
    } catch {
      // ignore
    }
    try {
      await browser?.close()
    } catch {
      // ignore
    }
  }
}
