"use client";
import { createBrowserClient } from "@supabase/ssr";
let browserClient = null;
let getUserInFlight = null;
export function createSupabaseBrowserClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    // Singleton prevents multiple concurrent Supabase auth locks.
    if (!browserClient) {
        browserClient = createBrowserClient(url, anon);
    }
    return browserClient;
}
// Single-flight wrapper: prevents concurrent auth lock contention
// when multiple components/timers call `supabase.auth.getUser()` together.
export async function getSupabaseUser() {
    const supabase = createSupabaseBrowserClient();
    if (!getUserInFlight) {
        getUserInFlight = supabase.auth
            .getUser()
            .then((response) => response ?? { data: { user: null }, error: null })
            .finally(() => {
            getUserInFlight = null;
        });
    }
    return getUserInFlight;
}
