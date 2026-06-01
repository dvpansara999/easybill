const SUPABASE_ENDPOINT_SUFFIXES = ["/rest/v1", "/auth/v1", "/storage/v1", "/functions/v1"];
export function normalizeSupabaseProjectUrl(value) {
    const raw = (value || "").trim().replace(/\/+$/, "");
    if (!raw)
        return "";
    let url;
    try {
        url = new URL(raw);
    }
    catch {
        return raw;
    }
    let pathname = url.pathname.replace(/\/+$/, "");
    for (const suffix of SUPABASE_ENDPOINT_SUFFIXES) {
        if (pathname.toLowerCase().endsWith(suffix)) {
            pathname = pathname.slice(0, -suffix.length) || "";
            break;
        }
    }
    url.pathname = pathname || "/";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
}
