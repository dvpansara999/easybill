import { NextResponse } from "next/server"
import { pdfError } from "@/lib/server/invoicePdfRouteHelpers"
import { generateInvoicePdfForUser } from "@/lib/server/invoicePdfGenerationCore"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const maxDuration = 60

export const dynamic = "force-dynamic"

/** Playwright + Buffer responses need the Node runtime (not Edge). */
export const runtime = "nodejs"

type PdfRequestBody = {
  invoiceId?: string
  mode?: "print" | "download"
  templateId?: string
  fontId?: string
  fontSize?: number | string
  fontFamily?: string
}

function logPdfDebug(event: string, meta: Record<string, unknown>) {
  console.info("[invoice-pdf]", event, meta)
}

export async function POST(req: Request) {
  const started = Date.now()
  const body = (await req.json().catch(() => ({}))) as PdfRequestBody
  const mode = body.mode === "print" ? "print" : "download"

  const supabase = await createSupabaseServerClient()
  const reqUrl = new URL(req.url)

  const result = await generateInvoicePdfForUser(
    supabase,
    {
      invoiceId: body.invoiceId,
      templateId: body.templateId,
      fontId: body.fontId,
      fontSize: body.fontSize,
      fontFamily: body.fontFamily,
    },
    reqUrl.origin,
    logPdfDebug
  )

  if (!result.ok) {
    return pdfError(result.message, result.code, result.httpStatus)
  }

  const elapsedMs = Date.now() - started
  const pdfBuffer = Buffer.from(result.pdfBytes)

  logPdfDebug("pdf-response", {
    invoiceId: body.invoiceId,
    byteLength: pdfBuffer.length,
    ms: elapsedMs,
  })

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdfBuffer.length),
      "Content-Disposition": mode === "print" ? "inline" : `attachment; filename=Invoice-${result.fileInvoiceNumber}.pdf`,
      "Cache-Control": "no-store, private",
      "X-EasyBill-Pdf-Engine": "playwright-setcontent",
      "X-EasyBill-Pdf-Ms": String(elapsedMs),
    },
  })
}
