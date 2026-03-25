import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    return response
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
      Session refresh is only needed for HTML navigations.
      Skip API routes, Next internals, and asset files so PDFs/icons don't pay an auth round-trip.
    */
    "/((?!api/|_next/|.*\\..*).*)",
  ],
}
