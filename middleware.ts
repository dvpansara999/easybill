import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
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

  // Refresh session if needed.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
      Session refresh is only needed for HTML navigations — not for API routes (PDF, etc.)
      or static assets. Broad middleware was adding a Supabase round-trip to every API call
      and slowing normal browsing on mobile/slow networks.
    */
    "/((?!api/|_next/static|_next/image|favicon.ico).*)",
  ],
}

