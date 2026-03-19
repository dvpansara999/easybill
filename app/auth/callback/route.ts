import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (code) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Decide where to land after auth (setup step vs dashboard).
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      return NextResponse.redirect(new URL("/dashboard", url.origin))
    }

    const { data: setupRows } = await supabase
      .from("user_kv")
      .select("key,value")
      .eq("user_id", user.id)
      .in("key", ["businessProfile", "accountSetupBundle"])

    const rows = (setupRows ?? []) as Array<{ key: string; value: unknown }>
    const legacy = rows.find((r) => r.key === "businessProfile")?.value
    const bundledRaw = rows.find((r) => r.key === "accountSetupBundle")?.value
    let bundledProfile: unknown = null
    if (bundledRaw && typeof bundledRaw === "object") {
      bundledProfile = (bundledRaw as Record<string, unknown>).businessProfile
    } else if (typeof bundledRaw === "string") {
      try {
        const parsed = JSON.parse(bundledRaw) as Record<string, unknown>
        bundledProfile = parsed.businessProfile
      } catch {
        bundledProfile = null
      }
    }
    const hasBusinessProfile = Boolean(legacy || bundledProfile)

    return NextResponse.redirect(new URL(hasBusinessProfile ? "/dashboard" : "/setup/profile", url.origin))
  }
  return NextResponse.redirect(new URL("/dashboard", url.origin))
}

