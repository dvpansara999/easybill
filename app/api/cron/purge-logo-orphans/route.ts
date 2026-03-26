import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  STORAGE_BUCKETS,
  buildReferencedLogoPathSet,
  deleteStorageObjects,
  filterOldUnreferencedObjects,
  listBucketObjects,
} from "@/lib/server/storageMaintenance"

export const maxDuration = 60
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Deletes unreferenced logo files that are older than 24 hours.
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
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured; logo purge skipped." },
      { status: 503 }
    )
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const referencedPaths = await buildReferencedLogoPathSet(admin)
  const bucketObjects = await listBucketObjects(admin, STORAGE_BUCKETS.logo)
  const orphanedObjects = filterOldUnreferencedObjects(bucketObjects, referencedPaths, cutoff)

  const deletedOrphanedFiles = orphanedObjects.length
    ? await deleteStorageObjects(
        admin,
        STORAGE_BUCKETS.logo,
        orphanedObjects.map((row) => row.name)
      )
    : 0

  return NextResponse.json({
    ok: true,
    deletedOrphanedFiles,
    cutoff,
  })
}
