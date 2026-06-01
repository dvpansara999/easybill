import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { assertAccountLifecycleUnlocked } from "@/lib/server/accountLifecycle"

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

    try {
      await assertAccountLifecycleUnlocked(supabase, user.id)
      const [profileSeed, settingsSeed] = await Promise.all([
        supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_settings").select("user_id").eq("user_id", user.id).maybeSingle(),
      ])
      await Promise.allSettled([
        profileSeed.data
          ? Promise.resolve()
          : supabase.from("profiles").insert({ user_id: user.id, onboarding_completed: false }),
        settingsSeed.data ? Promise.resolve() : supabase.from("user_settings").insert({ user_id: user.id }),
      ])
    } catch {
      return NextResponse.redirect(new URL("/", url.origin))
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed,business_name,address,phone,email")
      .eq("user_id", user.id)
      .maybeSingle()

    const hasBusinessProfile = Boolean(
      profile?.onboarding_completed ||
        profile?.business_name ||
        profile?.address ||
        profile?.phone ||
        profile?.email
    )

    return NextResponse.redirect(new URL(hasBusinessProfile ? "/dashboard" : "/setup/profile", url.origin))
  }
  return NextResponse.redirect(new URL("/dashboard", url.origin))
}
