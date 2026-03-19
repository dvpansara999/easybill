export type AuthMode = "supabase" | "local"

export function getAuthMode(): AuthMode {
  const raw = process.env.NEXT_PUBLIC_AUTH_MODE
  return raw === "local" ? "local" : "supabase"
}

