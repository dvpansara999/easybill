import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { pdfError } from "@/lib/server/invoicePdfRouteHelpers"
import {
  generateInvoicePdfFromResolvedSource,
  resolveInvoicePdfSourceForUser,
} from "@/lib/server/invoicePdfGenerationCore"
import {
  INVOICE_PDF_BUCKET,
  INVOICE_PDF_RETENTION_DAYS,
  sanitizeInvoicePdfFileBase,
} from "@/lib/server/invoicePdfExportConfig"
import { createSupabaseServerClient } from "@/lib/supabase/server"

process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH =
  "C:\\Users\\dvpan\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe"

export const maxDuration = 60
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type ExportBody = {
  invoiceId?: string
  templateId?: string
  fontId?: string
  fontSize?: number | string
  fontFamily?: string
}

function logExport(event: string, meta: Record<string, unknown>) {
  console.info("[invoice-pdf-export]", event, meta)
}

function extractFingerprintFromStoragePath(storagePath: string | null | undefined) {
  if (!storagePath) return null
  const match = storagePath.match(/--fp-([a-f0-9]{24})--/i)
  return match?.[1]?.toLowerCase() || null
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ExportBody
  const supabase = await createSupabaseServerClient()
  const reqUrl = new URL(req.url)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return pdfError("Sign in to download invoices.", "UNAUTHORIZED", 401)
  }

  const invoiceNumberKey = String(body.invoiceId || "").trim()
  if (!invoiceNumberKey) {
    return pdfError(
      "Invoice id is required. PDFs are generated only from your saved account data.",
      "INVOICE_ID_REQUIRED",
      400
    )
  }

  const retentionCutoffIso = new Date(
    Date.now() - INVOICE_PDF_RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  const resolvedSource = await resolveInvoicePdfSourceForUser(
    supabase,
    {
      invoiceId: body.invoiceId,
      templateId: body.templateId,
      fontId: body.fontId,
      fontSize: body.fontSize,
      fontFamily: body.fontFamily,
    },
    reqUrl.origin,
    (ev, meta) => logExport(ev, meta)
  )

  if (!resolvedSource.ok) {
    return pdfError(resolvedSource.message, resolvedSource.code, resolvedSource.httpStatus)
  }

  const { data: cached } = await supabase
    .from("invoice_pdf_exports")
    .select("public_url, created_at, storage_path")
    .eq("user_id", user.id)
    .eq("invoice_number", invoiceNumberKey)
    .gte("created_at", retentionCutoffIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const cachedFingerprint = extractFingerprintFromStoragePath(cached?.storage_path)

  if (cached?.public_url && cachedFingerprint && cachedFingerprint === resolvedSource.source.sourceFingerprint) {
    logExport("cache-hit", { invoiceNumber: invoiceNumberKey, userSuffix: user.id.slice(-6) })
    return NextResponse.json({
      url: cached.public_url,
      createdAt: cached.created_at,
      cached: true,
    })
  }

  if (cached?.public_url) {
    logExport("cache-stale", {
      invoiceNumber: invoiceNumberKey,
      userSuffix: user.id.slice(-6),
      cachedFingerprint,
      currentFingerprint: resolvedSource.source.sourceFingerprint,
    })
  }

  const gen = await generateInvoicePdfFromResolvedSource(
    resolvedSource.source,
    invoiceNumberKey,
    (ev, meta) => logExport(ev, meta)
  )

  if (!gen.ok) {
    return pdfError(gen.message, gen.code, gen.httpStatus)
  }

  if (gen.fileInvoiceNumber !== invoiceNumberKey) {
    logExport("invoice-number-mismatch", {
      request: invoiceNumberKey,
      resolved: gen.fileInvoiceNumber,
    })
  }

  const numberKeys = [...new Set([invoiceNumberKey, gen.fileInvoiceNumber])]

  const { data: staleRows } = await supabase
    .from("invoice_pdf_exports")
    .select("id, storage_path")
    .eq("user_id", user.id)
    .in("invoice_number", numberKeys)

  if (staleRows?.length) {
    const paths = staleRows.map((r) => r.storage_path).filter(Boolean) as string[]
    if (paths.length) {
      await supabase.storage.from(INVOICE_PDF_BUCKET).remove(paths).catch(() => {})
    }
    const ids = staleRows.map((r) => r.id)
    await supabase.from("invoice_pdf_exports").delete().in("id", ids)
  }

  const safeBase = sanitizeInvoicePdfFileBase(gen.fileInvoiceNumber)
  const randomPart = randomBytes(12).toString("hex")
  const storagePath = `${user.id}/${safeBase}--fp-${gen.sourceFingerprint}--${Date.now()}-${randomPart}.pdf`
  const pdfBuffer = Buffer.from(gen.pdfBytes)

  const { error: uploadError } = await supabase.storage.from(INVOICE_PDF_BUCKET).upload(storagePath, pdfBuffer, {
    contentType: "application/pdf",
    upsert: false,
    cacheControl: "3600",
  })

  if (uploadError) {
    logExport("upload-failed", { message: uploadError.message, path: storagePath })
    return pdfError(
      "Could not store PDF. Check that the invoice-pdfs bucket exists and policies allow uploads.",
      "EXPORT_STORAGE",
      500
    )
  }

  const { data: pub } = supabase.storage.from(INVOICE_PDF_BUCKET).getPublicUrl(storagePath)
  const publicUrl = pub?.publicUrl || ""

  if (!publicUrl) {
    await supabase.storage.from(INVOICE_PDF_BUCKET).remove([storagePath]).catch(() => {})
    return pdfError("Storage returned no public URL for the PDF.", "EXPORT_STORAGE", 500)
  }

  const { data: inserted, error: insertError } = await supabase
    .from("invoice_pdf_exports")
    .insert({
      user_id: user.id,
      invoice_number: gen.fileInvoiceNumber,
      storage_path: storagePath,
      public_url: publicUrl,
    })
    .select("id, created_at")
    .maybeSingle()

  if (insertError || !inserted) {
    logExport("db-insert-failed", { message: insertError?.message })
    await supabase.storage.from(INVOICE_PDF_BUCKET).remove([storagePath]).catch(() => {})
    return pdfError(
      insertError?.message?.includes("does not exist") || insertError?.code === "42P01"
        ? 'Run the SQL in supabase/invoice_pdf_exports.sql (table "invoice_pdf_exports").'
        : "Could not save PDF metadata.",
      "EXPORT_DB",
      500
    )
  }

  logExport("ok", { path: storagePath, userSuffix: user.id.slice(-6), cached: false })

  return NextResponse.json({
    url: publicUrl,
    createdAt: inserted.created_at,
    cached: false,
  })
}
