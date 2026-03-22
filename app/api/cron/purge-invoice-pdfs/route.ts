import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { INVOICE_PDF_BUCKET, INVOICE_PDF_RETENTION_DAYS } from "@/lib/server/invoicePdfExportConfig"

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
  let deletedRows = 0
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

  return NextResponse.json({
    ok: true,
    deletedRows,
    retentionDays: INVOICE_PDF_RETENTION_DAYS,
    cutoff,
  })
}
