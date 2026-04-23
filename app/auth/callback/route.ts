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

    await Promise.allSettled([
      supabase.from("profiles").upsert({ user_id: user.id, onboarding_completed: false }, { onConflict: "user_id" }),
      supabase.from("user_settings").upsert({ user_id: user.id }, { onConflict: "user_id" }),
    ])

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
