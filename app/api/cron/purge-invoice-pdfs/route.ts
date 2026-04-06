import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { INVOICE_PDF_BUCKET, INVOICE_PDF_RETENTION_DAYS } from "@/lib/server/invoicePdfExportConfig"
import { filterDuplicateInvoiceExportRows } from "@/lib/server/invoicePdfExportCache"
import {
  buildReferencedInvoiceIdsByUser,
  buildPdfExportReferenceSet,
  deleteStorageObjects,
  fetchAllInvoicePdfExportRows,
  filterOldUnreferencedObjects,
  listBucketObjects,
} from "@/lib/server/storageMaintenance"

export const maxDuration = 60
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Deletes invoice PDFs from Storage and rows older than {@link INVOICE_PDF_RETENTION_DAYS}.
 * Secure with `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron) or matching query `?secret=`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const auth = req.headers.get("authorization")
  const url = new URL(req.url)
  const qSecret = url.searchParams.get("secret")

  const ok =
    secret &&
    (auth === `Bearer ${secret}` || (qSecret !== null && qSecret === secret))

  if (!ok) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const admin = createSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured; purge skipped." },
      { status: 503 }
    )
  }

  const cutoff = new Date(Date.now() - INVOICE_PDF_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const orphanCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  let deletedRows = 0
  let deletedDuplicateRows = 0
  let deletedRemovedInvoiceRows = 0
  let deletedOrphanedFiles = 0
  const batchSize = 200

  for (;;) {
    const { data: rows, error } = await admin
      .from("invoice_pdf_exports")
      .select("id, storage_path")
      .lt("created_at", cutoff)
      .limit(batchSize)

    if (error) {
      return NextResponse.json({ error: error.message, deletedRows }, { status: 500 })
    }

    if (!rows?.length) break

    const paths = rows.map((r) => r.storage_path).filter(Boolean)
    if (paths.length) {
      await admin.storage.from(INVOICE_PDF_BUCKET).remove(paths)
    }

    const ids = rows.map((r) => r.id)
    const { error: delErr } = await admin.from("invoice_pdf_exports").delete().in("id", ids)
    if (delErr) {
      return NextResponse.json({ error: delErr.message, deletedRows }, { status: 500 })
    }

    deletedRows += rows.length
    if (rows.length < batchSize) break
  }

  const allRows = await fetchAllInvoicePdfExportRows(admin)
  const duplicateRows = filterDuplicateInvoiceExportRows(allRows)
  if (duplicateRows.length) {
    const duplicatePaths = duplicateRows.map((row) => row.storage_path).filter((value): value is string => Boolean(value))
    if (duplicatePaths.length) {
      await deleteStorageObjects(admin, INVOICE_PDF_BUCKET, duplicatePaths)
    }

    const duplicateIds = duplicateRows.map((row) => row.id)
    const { error: duplicateDeleteError } = await admin.from("invoice_pdf_exports").delete().in("id", duplicateIds)
    if (duplicateDeleteError) {
      return NextResponse.json(
        { error: duplicateDeleteError.message, deletedRows, deletedDuplicateRows, deletedOrphanedFiles },
        { status: 500 }
      )
    }
    deletedDuplicateRows = duplicateRows.length
  }

  const refreshedRows = await fetchAllInvoicePdfExportRows(admin)
  const referencedInvoiceIdsByUser = await buildReferencedInvoiceIdsByUser(admin)
  const removedInvoiceRows = refreshedRows.filter((row) => {
    const storagePath = String(row.storage_path || "")
    const slashIndex = storagePath.indexOf("/")
    const userId = slashIndex > 0 ? storagePath.slice(0, slashIndex) : ""
    if (!userId || !row.invoice_id) return false
    const invoiceIds = referencedInvoiceIdsByUser.get(userId)
    return !invoiceIds || !invoiceIds.has(row.invoice_id)
  })

  if (removedInvoiceRows.length) {
    const removedPaths = removedInvoiceRows.map((row) => row.storage_path).filter((value): value is string => Boolean(value))
    if (removedPaths.length) {
      await deleteStorageObjects(admin, INVOICE_PDF_BUCKET, removedPaths)
    }

    const removedIds = removedInvoiceRows.map((row) => row.id)
    const { error: removedInvoiceDeleteError } = await admin.from("invoice_pdf_exports").delete().in("id", removedIds)
    if (removedInvoiceDeleteError) {
      return NextResponse.json(
        { error: removedInvoiceDeleteError.message, deletedRows, deletedDuplicateRows, deletedOrphanedFiles },
        { status: 500 }
      )
    }
    deletedRemovedInvoiceRows = removedInvoiceRows.length
  }

  const finalRows = await fetchAllInvoicePdfExportRows(admin)
  const referencedPaths = buildPdfExportReferenceSet(finalRows)
  const bucketObjects = await listBucketObjects(admin, INVOICE_PDF_BUCKET)
  const orphanedObjects = filterOldUnreferencedObjects(bucketObjects, referencedPaths, orphanCutoff)
  if (orphanedObjects.length) {
    deletedOrphanedFiles = await deleteStorageObjects(
      admin,
      INVOICE_PDF_BUCKET,
      orphanedObjects.map((row) => row.name)
    )
  }

  return NextResponse.json({
    ok: true,
    deletedRows,
    deletedDuplicateRows,
    deletedRemovedInvoiceRows,
    deletedOrphanedFiles,
    retentionDays: INVOICE_PDF_RETENTION_DAYS,
    cutoff,
  })
}
