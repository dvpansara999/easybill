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
import {
  filterDuplicateInvoiceExportRows,
  findMatchingCachedInvoiceExport,
  filterStaleInvoiceExportRows,
} from "@/lib/server/invoicePdfExportCache"
import { createSupabaseServerClient } from "@/lib/supabase/server"

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

  const invoiceRecordId = String(body.invoiceId || "").trim()
  if (!invoiceRecordId) {
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

  const cachedQuery = await supabase
    .from("invoice_pdf_exports")
    .select("id, invoice_id, source_fingerprint, public_url, created_at, storage_path")
    .eq("user_id", user.id)
    .eq("invoice_id", resolvedSource.source.invoiceRecordId)
    .gte("created_at", retentionCutoffIso)
    .order("created_at", { ascending: false })
    .limit(20)

  if (cachedQuery.error) {
    return pdfError("Could not load cached PDF metadata.", "EXPORT_DB", 500)
  }

  const cachedRows = cachedQuery.data
  const cached = findMatchingCachedInvoiceExport(cachedRows, resolvedSource.source.invoiceRecordId)
  const cachedFingerprint = cached?.source_fingerprint || null

  if (cached?.public_url && cachedFingerprint && cachedFingerprint === resolvedSource.source.sourceFingerprint) {
    logExport("cache-hit", {
      invoiceId: resolvedSource.source.invoiceRecordId,
      invoiceNumber: resolvedSource.source.fileInvoiceNumber,
      userSuffix: user.id.slice(-6),
    })
    return NextResponse.json({
      url: cached.public_url,
      createdAt: cached.created_at,
      cached: true,
    })
  }

  if (cached?.public_url) {
    logExport("fingerprint-mismatch", {
      invoiceId: resolvedSource.source.invoiceRecordId,
      invoiceNumber: resolvedSource.source.fileInvoiceNumber,
      userSuffix: user.id.slice(-6),
      cachedFingerprint,
      currentFingerprint: resolvedSource.source.sourceFingerprint,
    })
  } else {
    logExport("cache-miss", {
      invoiceId: resolvedSource.source.invoiceRecordId,
      invoiceNumber: resolvedSource.source.fileInvoiceNumber,
      userSuffix: user.id.slice(-6),
    })
  }

  logExport("export-regeneration", {
    invoiceId: resolvedSource.source.invoiceRecordId,
    invoiceNumber: resolvedSource.source.fileInvoiceNumber,
    reason: cached?.public_url ? "fingerprint-mismatch" : "cache-miss",
    userSuffix: user.id.slice(-6),
  })

  const gen = await generateInvoicePdfFromResolvedSource(
    resolvedSource.source,
    invoiceRecordId,
    (ev, meta) => logExport(ev, meta)
  )

  if (!gen.ok) {
    return pdfError(gen.message, gen.code, gen.httpStatus)
  }

  const staleQuery = await supabase
    .from("invoice_pdf_exports")
    .select("id, invoice_id, source_fingerprint, storage_path, created_at")
    .eq("user_id", user.id)
    .eq("invoice_id", resolvedSource.source.invoiceRecordId)

  if (staleQuery.error) {
    return pdfError("Could not clean stale PDF cache metadata.", "EXPORT_DB", 500)
  }

  const staleRows = staleQuery.data
  const matchedStaleRows = filterStaleInvoiceExportRows(staleRows, resolvedSource.source.invoiceRecordId)
  const duplicateRows = filterDuplicateInvoiceExportRows(staleRows)
  const cleanupRows = [...matchedStaleRows, ...duplicateRows.filter((row) => !matchedStaleRows.some((m) => m.id === row.id))]

  if (cleanupRows.length) {
    const paths = cleanupRows.map((r) => r.storage_path).filter(Boolean) as string[]
    if (paths.length) {
      await supabase.storage.from(INVOICE_PDF_BUCKET).remove(paths).catch(() => {})
    }
    const ids = cleanupRows.map((r) => r.id)
    await supabase.from("invoice_pdf_exports").delete().in("id", ids)
  }

  const safeBase = sanitizeInvoicePdfFileBase(gen.fileInvoiceNumber)
  const randomPart = randomBytes(12).toString("hex")
  const storagePath = `${user.id}/${safeBase}--iid-${resolvedSource.source.invoiceRecordId}--fp-${gen.sourceFingerprint}--${Date.now()}-${randomPart}.pdf`
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

  const insertResult = await supabase
    .from("invoice_pdf_exports")
    .insert({
      user_id: user.id,
      invoice_id: resolvedSource.source.invoiceRecordId,
      invoice_number: gen.fileInvoiceNumber,
      source_fingerprint: gen.sourceFingerprint,
      storage_path: storagePath,
      public_url: publicUrl,
    })
    .select("id, created_at")
    .maybeSingle()

  const inserted = insertResult.data
  const insertError = insertResult.error

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

  logExport("ok", {
    path: storagePath,
    invoiceId: resolvedSource.source.invoiceRecordId,
    userSuffix: user.id.slice(-6),
    cached: false,
  })

  return NextResponse.json({
    url: publicUrl,
    createdAt: inserted.created_at,
    cached: false,
  })
}
