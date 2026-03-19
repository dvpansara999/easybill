import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const COOLDOWN_DAYS = 90
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000
const TEMP_UNLOCK_FOR_TESTING = false

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: auditRow } = await supabase
      .from("user_kv")
      .select("updated_at")
      .eq("user_id", user.id)
      .eq("key", "emailChangeAudit")
      .maybeSingle()

    const createdAtMs = new Date(user.created_at || 0).getTime()
    const lastChangedMs = auditRow?.updated_at ? new Date(auditRow.updated_at).getTime() : null
    const baselineMs = Number.isFinite(lastChangedMs as number)
      ? Math.max(createdAtMs, lastChangedMs as number)
      : createdAtMs
    const nowMs = Date.now()
    const lockUntilMs = baselineMs + COOLDOWN_MS
    const canChange = TEMP_UNLOCK_FOR_TESTING ? true : nowMs >= lockUntilMs
    const remainingDays = canChange ? 0 : Math.ceil((lockUntilMs - nowMs) / (24 * 60 * 60 * 1000))

    return NextResponse.json({
      canChange,
      cooldownDays: COOLDOWN_DAYS,
      remainingDays,
      lockUntil: new Date(lockUntilMs).toISOString(),
      basedOn: lastChangedMs ? "last_email_change" : "account_created_at",
    })
  } catch {
    return NextResponse.json({ error: "Unable to check email change policy." }, { status: 500 })
  }
}
