import { NextResponse } from "next/server"
import { chromium } from "playwright"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revealSensitiveDataFromStorage } from "@/lib/sensitiveData"

type PdfRequestBody = {
  invoiceId?: string
  mode?: "print" | "download"
  // Backward-compatible fallback during transition
  invoice?: any
  template?: string
  settings?: any
  businessProfile?: string
  typography?: { fontId?: string; fontSize?: number }
}

function parseJsonLoose(raw: unknown): any {
  if (raw == null) return null
  if (typeof raw === "object") return raw
  if (typeof raw !== "string") return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function toRawString(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

function deriveBaseUrl(req: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  if (envUrl) {
    const normalized = envUrl.startsWith("http") ? envUrl : `https://${envUrl}`
    return normalized.replace(/\/$/, "")
  }
  const reqUrl = new URL(req.url)
  return `${reqUrl.protocol}//${reqUrl.host}`
}

export async function POST(req: Request) {
  const body = (await req.json()) as PdfRequestBody
  const mode = body.mode

  let invoiceData: any = null
  let templateId = "classic-default"
  let typographySettings: { fontId?: string; fontSize?: number } = {}
  let businessDataRaw: string | null = null
  let exportSettings: Record<string, any> = {}
  let fileInvoiceNumber = "invoice"

  // Preferred secure path: server-side ownership check + server-side data load.
  if (body.invoiceId) {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const wantedKeys = [
      "invoices",
      "businessProfile",
      "accountSetupBundle",
      "invoiceTemplate",
      "invoiceTemplateFontId",
      "invoiceTemplateFontSize",
      "dateFormat",
      "amountFormat",
      "showDecimals",
      "currencySymbol",
      "currencyPosition",
      "invoiceVisibility",
    ]

    const { data: rows, error } = await supabase
      .from("user_kv")
      .select("key,value")
      .eq("user_id", user.id)
      .in("key", wantedKeys)

    if (error) {
      return NextResponse.json({ error: "Unable to load invoice data" }, { status: 500 })
    }

    const kv = new Map<string, unknown>()
    for (const row of rows || []) {
      kv.set(String((row as any).key), (row as any).value)
    }
    const bundle = parseJsonLoose(kv.get("accountSetupBundle")) || {}
    const getKvOrBundle = (key: string) => {
      const direct = kv.get(key)
      if (direct != null) return direct
      if (bundle && typeof bundle === "object" && key in bundle) return (bundle as any)[key]
      return null
    }

    const invoicesRaw = toRawString(getKvOrBundle("invoices"))
    const invoicesDecrypted = invoicesRaw ? revealSensitiveDataFromStorage("invoices", invoicesRaw) : null
    const invoicesParsed = parseJsonLoose(invoicesDecrypted) || []
    const found = Array.isArray(invoicesParsed)
      ? invoicesParsed.find((inv: any) => String(inv?.invoiceNumber || "") === String(body.invoiceId))
      : null

    if (!found) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    invoiceData = found
    fileInvoiceNumber = String(found?.invoiceNumber || "invoice")

    const businessRaw = toRawString(getKvOrBundle("businessProfile"))
    businessDataRaw = businessRaw ? revealSensitiveDataFromStorage("businessProfile", businessRaw) : null

    templateId = String(getKvOrBundle("invoiceTemplate") || "classic-default")
    typographySettings = {
      fontId: String(getKvOrBundle("invoiceTemplateFontId") || "system"),
      fontSize: Number(getKvOrBundle("invoiceTemplateFontSize") || 10),
    }

    const invoiceVisibilityRaw = toRawString(getKvOrBundle("invoiceVisibility"))
    exportSettings = {
      dateFormat: String(getKvOrBundle("dateFormat") || "YYYY-MM-DD"),
      amountFormat: String(getKvOrBundle("amountFormat") || "indian"),
      showDecimals: String(getKvOrBundle("showDecimals") || "true") === "true",
      currencySymbol: String(getKvOrBundle("currencySymbol") || "₹"),
      currencyPosition: String(getKvOrBundle("currencyPosition") || "before"),
      invoiceVisibility: parseJsonLoose(invoiceVisibilityRaw) || undefined,
    }
  } else {
    // Backward-compatible fallback path to avoid breaking in-flight clients.
    invoiceData = body.invoice
    templateId = body.template || "classic-default"
    exportSettings = body.settings || {}
    businessDataRaw = body.businessProfile || null
    typographySettings = body.typography || {}
    fileInvoiceNumber = String(body.invoice?.invoiceNumber || "invoice")
  }

  if (!invoiceData) {
    return NextResponse.json({ error: "Missing invoice data" }, { status: 400 })
  }

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  })

  try {
    const page = await browser.newPage()
    const baseUrl = deriveBaseUrl(req)

    await page.goto(`${baseUrl}/invoice-print`, { waitUntil: "domcontentloaded" })

    await page.evaluate(
      ({ invoice, template, settings, businessProfile, typography }) => {
        localStorage.setItem("pdfInvoice", JSON.stringify(invoice))

        if (template) localStorage.setItem("invoiceTemplate", template)
        if (businessProfile) localStorage.setItem("businessProfile", businessProfile)

        if (settings?.dateFormat) localStorage.setItem("dateFormat", settings.dateFormat)
        if (settings?.amountFormat) localStorage.setItem("amountFormat", settings.amountFormat)
        if (typeof settings?.showDecimals === "boolean") localStorage.setItem("showDecimals", String(settings.showDecimals))
        if (settings?.currencySymbol) localStorage.setItem("currencySymbol", settings.currencySymbol)
        if (settings?.currencyPosition) localStorage.setItem("currencyPosition", settings.currencyPosition)
        if (settings?.invoiceVisibility) {
          try {
            localStorage.setItem("invoiceVisibility", JSON.stringify(settings.invoiceVisibility))
          } catch {
            // ignore
          }
        }

        if (typography?.fontId) localStorage.setItem("invoiceTemplateFontId", typography.fontId)
        if (typography?.fontSize) localStorage.setItem("invoiceTemplateFontSize", String(typography.fontSize))
      },
      {
        invoice: invoiceData,
        template: templateId,
        settings: exportSettings,
        businessProfile: businessDataRaw,
        typography: typographySettings,
      }
    )

    await page.reload({ waitUntil: "domcontentloaded" })

    // Deterministic readiness flag from invoice-print page.
    await page.waitForFunction(() => (window as any).__EASYBILL_PDF_READY === true, undefined, {
      timeout: 30000,
    })

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    })

    const pdfBytes = new Uint8Array(pdf)
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": mode === "print" ? "inline" : `attachment; filename=Invoice-${fileInvoiceNumber}.pdf`,
        "Cache-Control": "no-store",
      },
    })
  } finally {
    await browser.close()
  }
}
