(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/runtimeMode.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAuthMode",
    ()=>getAuthMode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
function getAuthMode() {
    const raw = ("TURBOPACK compile-time value", "local");
    return ("TURBOPACK compile-time truthy", 1) ? "local" : "TURBOPACK unreachable";
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/authLocal.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getActiveAuthRecord",
    ()=>getActiveAuthRecord,
    "getActiveUserId",
    ()=>getActiveUserId,
    "getLastUserId",
    ()=>getLastUserId,
    "requestEmailChangeOtp",
    ()=>requestEmailChangeOtp,
    "restoreLastSessionIfNeeded",
    ()=>restoreLastSessionIfNeeded,
    "setActiveUserId",
    ()=>setActiveUserId,
    "signIn",
    ()=>signIn,
    "signInWithOtp",
    ()=>signInWithOtp,
    "signInWithProvider",
    ()=>signInWithProvider,
    "signOut",
    ()=>signOut,
    "signUp",
    ()=>signUp,
    "updateCredentials",
    ()=>updateCredentials,
    "updatePasswordAfterOtp",
    ()=>updatePasswordAfterOtp,
    "verifyEmailChangeOtp",
    ()=>verifyEmailChangeOtp,
    "verifyEmailOtp",
    ()=>verifyEmailOtp
]);
"use client";
const AUTH_ACCOUNTS_KEY = "authAccounts:v2";
const AUTH_ACTIVE_USER_ID_KEY = "authActiveUserId" // sessionStorage
;
const AUTH_LAST_USER_ID_KEY = "authLastUserId" // localStorage
;
function bytesToHex(bytes) {
    return Array.from(bytes).map((b)=>b.toString(16).padStart(2, "0")).join("");
}
function utf8Bytes(input) {
    return new TextEncoder().encode(input);
}
function randomSaltHex(byteLen = 16) {
    const bytes = new Uint8Array(byteLen);
    crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
}
async function sha256Hex(input) {
    const digest = await crypto.subtle.digest("SHA-256", utf8Bytes(input));
    return bytesToHex(new Uint8Array(digest));
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function generateUserId() {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = bytesToHex(bytes);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function readAccounts() {
    const raw = localStorage.getItem(AUTH_ACCOUNTS_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch  {
        return [];
    }
}
function writeAccounts(accounts) {
    localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
}
function readSessionActiveUserId() {
    try {
        const raw = window.sessionStorage.getItem(AUTH_ACTIVE_USER_ID_KEY);
        return raw?.trim() ? raw.trim() : null;
    } catch  {
        return null;
    }
}
function writeSessionActiveUserId(userId) {
    try {
        if (!userId) window.sessionStorage.removeItem(AUTH_ACTIVE_USER_ID_KEY);
        else window.sessionStorage.setItem(AUTH_ACTIVE_USER_ID_KEY, userId);
    } catch  {
    // ignore
    }
}
function getActiveUserId() {
    return readSessionActiveUserId() || getLastUserId();
}
function setActiveUserId(userId) {
    writeSessionActiveUserId(userId);
    try {
        if (!userId) localStorage.removeItem(AUTH_LAST_USER_ID_KEY);
        else localStorage.setItem(AUTH_LAST_USER_ID_KEY, userId);
    } catch  {
    // ignore
    }
}
function getLastUserId() {
    try {
        const raw = localStorage.getItem(AUTH_LAST_USER_ID_KEY);
        return raw?.trim() ? raw.trim() : null;
    } catch  {
        return null;
    }
}
function restoreLastSessionIfNeeded() {
    const sessionId = readSessionActiveUserId();
    if (sessionId) return sessionId;
    const last = getLastUserId();
    if (!last) return null;
    writeSessionActiveUserId(last);
    return last;
}
function getActiveAuthRecord() {
    const active = getActiveUserId();
    if (!active) return null;
    const rec = readAccounts().find((a)=>a.userId === active);
    return rec ? {
        userId: rec.userId,
        email: rec.email
    } : {
        userId: active,
        email: ""
    };
}
async function createAuthRecord(email, password, userId) {
    const salt = randomSaltHex(16);
    const hash = await sha256Hex(`${salt}:${password}`);
    return {
        userId: userId || generateUserId(),
        email,
        salt,
        hash
    };
}
async function verifyPassword(record, password) {
    const hash = await sha256Hex(`${record.salt}:${password}`);
    return hash === record.hash;
}
async function signUp(email, password) {
    const accounts = readAccounts();
    const emailNorm = normalizeEmail(email);
    if (accounts.some((a)=>normalizeEmail(a.email) === emailNorm)) {
        return {
            record: null,
            error: "An account with this email already exists."
        };
    }
    const rec = await createAuthRecord(email.trim(), password);
    writeAccounts([
        ...accounts,
        rec
    ]);
    setActiveUserId(rec.userId);
    return {
        record: {
            userId: rec.userId,
            email: rec.email
        },
        error: ""
    };
}
async function signIn(email, password) {
    const accounts = readAccounts();
    const emailNorm = normalizeEmail(email);
    const rec = accounts.find((a)=>normalizeEmail(a.email) === emailNorm);
    if (!rec) return {
        record: null,
        error: "Incorrect email or password."
    };
    const ok = await verifyPassword(rec, password);
    if (!ok) return {
        record: null,
        error: "Incorrect email or password."
    };
    setActiveUserId(rec.userId);
    return {
        record: {
            userId: rec.userId,
            email: rec.email
        },
        error: ""
    };
}
async function signInWithOtp(email, options) {
    void email;
    void options;
    return {
        error: "OTP sign-in is not available in localStorage safety mode."
    };
}
async function verifyEmailOtp(email, token, type) {
    void email;
    void token;
    void type;
    return {
        error: "OTP verification is not available in localStorage safety mode."
    };
}
async function signInWithProvider(provider) {
    void provider;
    return {
        url: "",
        error: "OAuth sign-in is not available in localStorage safety mode."
    };
}
async function signOut() {
    setActiveUserId(null);
}
async function updatePasswordAfterOtp(password) {
    void password;
    return {
        record: null,
        error: "OTP password update is not available in localStorage safety mode."
    };
}
async function requestEmailChangeOtp(payload) {
    void payload;
    return {
        error: "OTP email change is not available in localStorage safety mode."
    };
}
async function verifyEmailChangeOtp(email, code) {
    void email;
    void code;
    return {
        record: null,
        error: "OTP email change is not available in localStorage safety mode."
    };
}
async function updateCredentials(params) {
    const accounts = readAccounts();
    const existing = accounts.find((a)=>a.userId === params.userId);
    if (!existing) return {
        record: null,
        error: "Account not found."
    };
    const ok = await verifyPassword(existing, params.currentPassword);
    if (!ok) return {
        record: null,
        error: "Current password is incorrect."
    };
    const nextEmail = params.newEmail?.trim() ? params.newEmail.trim() : existing.email;
    const emailNorm = normalizeEmail(nextEmail);
    const collision = accounts.find((a)=>a.userId !== existing.userId && normalizeEmail(a.email) === emailNorm);
    if (collision) return {
        record: null,
        error: "That email is already used by another account."
    };
    const nextPassword = params.newPassword ? params.newPassword : params.currentPassword;
    const nextRecord = await createAuthRecord(nextEmail, nextPassword, existing.userId);
    writeAccounts(accounts.map((a)=>a.userId === existing.userId ? nextRecord : a));
    setActiveUserId(existing.userId);
    return {
        record: {
            userId: nextRecord.userId,
            email: nextRecord.email
        },
        error: ""
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/supabase/browser.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSupabaseBrowserClient",
    ()=>createSupabaseBrowserClient,
    "getSupabaseUser",
    ()=>getSupabaseUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-client] (ecmascript)");
"use client";
;
let browserClient = null;
let getUserInFlight = null;
function createSupabaseBrowserClient() {
    const url = ("TURBOPACK compile-time value", "https://example.supabase.co");
    const anon = ("TURBOPACK compile-time value", "test-anon-key");
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Singleton prevents multiple concurrent Supabase auth locks.
    if (!browserClient) {
        browserClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createBrowserClient"])(url, anon);
    }
    return browserClient;
}
async function getSupabaseUser() {
    const supabase = createSupabaseBrowserClient();
    if (!getUserInFlight) {
        getUserInFlight = supabase.auth.getUser().then((response)=>response ?? {
                data: {
                    user: null
                },
                error: null
            }).finally(()=>{
            getUserInFlight = null;
        });
    }
    return getUserInFlight;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/authSupabase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getActiveAuthRecord",
    ()=>getActiveAuthRecord,
    "getActiveUserId",
    ()=>getActiveUserId,
    "getLastUserId",
    ()=>getLastUserId,
    "requestEmailChangeOtp",
    ()=>requestEmailChangeOtp,
    "restoreLastSessionIfNeeded",
    ()=>restoreLastSessionIfNeeded,
    "setActiveUserId",
    ()=>setActiveUserId,
    "signIn",
    ()=>signIn,
    "signInWithOtp",
    ()=>signInWithOtp,
    "signInWithProvider",
    ()=>signInWithProvider,
    "signOut",
    ()=>signOut,
    "signUp",
    ()=>signUp,
    "updateCredentials",
    ()=>updateCredentials,
    "updatePasswordAfterOtp",
    ()=>updatePasswordAfterOtp,
    "verifyEmailChangeOtp",
    ()=>verifyEmailChangeOtp,
    "verifyEmailOtp",
    ()=>verifyEmailOtp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/browser.ts [app-client] (ecmascript)");
"use client";
;
const AUTH_ACTIVE_USER_ID_KEY = "authActiveUserId" // sessionStorage (tab)
;
const AUTH_LAST_USER_ID_KEY = "authLastUserId" // localStorage (restore)
;
const AUTH_LAST_EMAIL_KEY = "authLastEmail";
function readSessionActiveUserId() {
    try {
        const raw = window.sessionStorage.getItem(AUTH_ACTIVE_USER_ID_KEY);
        return raw?.trim() ? raw.trim() : null;
    } catch  {
        return null;
    }
}
function writeSessionActiveUserId(userId) {
    try {
        if (!userId) window.sessionStorage.removeItem(AUTH_ACTIVE_USER_ID_KEY);
        else window.sessionStorage.setItem(AUTH_ACTIVE_USER_ID_KEY, userId);
    } catch  {
    // ignore
    }
}
function getActiveUserId() {
    const sessionId = readSessionActiveUserId();
    if (sessionId) return sessionId;
    return restoreLastSessionIfNeeded();
}
function setActiveUserId(userId) {
    writeSessionActiveUserId(userId);
    try {
        if (!userId) localStorage.removeItem(AUTH_LAST_USER_ID_KEY);
        else localStorage.setItem(AUTH_LAST_USER_ID_KEY, userId);
    } catch  {
    // ignore
    }
}
function getLastUserId() {
    try {
        const raw = localStorage.getItem(AUTH_LAST_USER_ID_KEY);
        return raw?.trim() ? raw.trim() : null;
    } catch  {
        return null;
    }
}
function getLastEmail() {
    try {
        return localStorage.getItem(AUTH_LAST_EMAIL_KEY) || "";
    } catch  {
        return "";
    }
}
function setLastEmail(email) {
    try {
        if (!email) localStorage.removeItem(AUTH_LAST_EMAIL_KEY);
        else localStorage.setItem(AUTH_LAST_EMAIL_KEY, email.trim());
    } catch  {
    // ignore
    }
}
function restoreLastSessionIfNeeded() {
    const sessionId = readSessionActiveUserId();
    if (sessionId) return sessionId;
    const last = getLastUserId();
    if (!last) return null;
    writeSessionActiveUserId(last);
    return last;
}
function getActiveAuthRecord() {
    const activeId = getActiveUserId();
    if (!activeId) return null;
    return {
        userId: activeId,
        email: getLastEmail()
    };
}
async function signUp(email, password) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) {
            const msg = (error.message || "").toLowerCase();
            if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
                return {
                    record: null,
                    error: "User already exists."
                };
            }
            return {
                record: null,
                error: "Error occurred, try again."
            };
        }
        const user = data.user;
        if (!user) return {
            record: null,
            error: "Unable to create account."
        };
        // Important for email-confirm flows:
        // `signUp()` can return a user even when the account is not yet confirmed,
        // but Supabase may not have an authenticated session at this moment.
        // If we setActiveUserId() now, our KV writes will hit RLS with `auth.uid() = null`.
        // So we only set active userId when a session actually exists.
        const { data: me } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseUser"])();
        // If user is not yet confirmed, Supabase often doesn't create a session.
        // Keep active userId unset so setup continues in local (no RLS writes).
        setActiveUserId(me.user?.id ?? null);
        setLastEmail(user.email || email.trim());
        return {
            record: {
                userId: user.id,
                email: user.email || email.trim()
            },
            error: ""
        };
    } catch  {
        return {
            record: null,
            error: "Error occurred, try again."
        };
    }
}
async function signIn(email, password) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
        });
        if (error) return {
            record: null,
            error: "Incorrect email or password."
        };
        const user = data.user;
        if (!user) return {
            record: null,
            error: "Unable to sign in."
        };
        setActiveUserId(user.id);
        setLastEmail(user.email || email.trim());
        return {
            record: {
                userId: user.id,
                email: user.email || email.trim()
            },
            error: ""
        };
    } catch  {
        return {
            record: null,
            error: "Unable to reach server. Check internet and try again."
        };
    }
}
async function signInWithOtp(email, opts) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
                shouldCreateUser: opts?.shouldCreateUser ?? true
            }
        });
        if (error) {
            const msg = (error.message || "").toLowerCase();
            if ((opts?.shouldCreateUser ?? true) === false && (msg.includes("not found") || msg.includes("invalid login"))) {
                return {
                    error: "User not found."
                };
            }
            return {
                error: error.message
            };
        }
        return {
            error: ""
        };
    } catch  {
        return {
            error: "Unable to reach server. Check internet and try again."
        };
    }
}
async function verifyEmailOtp(email, token, type) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
        const { data, error } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: token.trim(),
            type
        });
        if (error || !data.user) {
            return {
                error: error?.message || "OTP verification failed."
            };
        }
        setActiveUserId(data.user.id);
        setLastEmail(data.user.email || email.trim());
        return {
            error: ""
        };
    } catch  {
        return {
            error: "Unable to reach server. Check internet and try again."
        };
    }
}
async function signInWithProvider(provider) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) return {
            url: "",
            error: error.message
        };
        return {
            url: data.url || "",
            error: ""
        };
    } catch  {
        return {
            url: "",
            error: "Unable to reach server. Check internet and try again."
        };
    }
}
async function updatePasswordAfterOtp(newPassword) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error || !data.user) {
            return {
                record: null,
                error: error?.message || "Unable to update password."
            };
        }
        setActiveUserId(data.user.id);
        setLastEmail(data.user.email || "");
        return {
            record: {
                userId: data.user.id,
                email: data.user.email || ""
            },
            error: ""
        };
    } catch  {
        return {
            record: null,
            error: "Error occurred, try again."
        };
    }
}
async function requestEmailChangeOtp(params) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
        const { data: me } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseUser"])();
        const currentEmail = me.user?.email || "";
        if (!currentEmail) {
            return {
                error: "Account not found."
            };
        }
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: currentEmail,
            password: params.currentPassword
        });
        if (authError || !authData.user) {
            return {
                error: "Wrong password."
            };
        }
        const { error } = await supabase.auth.updateUser({
            email: params.newEmail.trim()
        });
        if (error) {
            const msg = (error.message || "").toLowerCase();
            if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
                return {
                    error: "User already exists."
                };
            }
            return {
                error: error.message || "Error occurred, try again."
            };
        }
        return {
            error: ""
        };
    } catch  {
        return {
            error: "Error occurred, try again."
        };
    }
}
async function verifyEmailChangeOtp(newEmail, token) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
        const { error } = await supabase.auth.verifyOtp({
            email: newEmail.trim(),
            token: token.trim(),
            type: "email_change"
        });
        if (error) {
            return {
                record: null,
                error: error.message || "OTP verification failed."
            };
        }
        const { data: me } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseUser"])();
        const user = me.user;
        if (!user) {
            return {
                record: null,
                error: "Unable to verify OTP right now. Please sign in again."
            };
        }
        const effectiveEmail = (user.email || "").trim();
        if (effectiveEmail.toLowerCase() !== newEmail.trim().toLowerCase()) {
            return {
                record: null,
                error: "Email change is still pending confirmation. Please complete all confirmation steps from your email."
            };
        }
        setActiveUserId(user.id);
        setLastEmail(effectiveEmail || null);
        return {
            record: {
                userId: user.id,
                email: effectiveEmail
            },
            error: ""
        };
    } catch  {
        return {
            record: null,
            error: "Error occurred, try again."
        };
    }
}
async function signOut() {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
        await supabase.auth.signOut();
    } finally{
        setActiveUserId(null);
        setLastEmail(null);
    }
}
async function updateCredentials(params) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
        const { data: me } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseUser"])();
        const email = me.user?.email || "";
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: params.currentPassword
        });
        if (authError || !authData.user) {
            return {
                record: null,
                error: "Current password is incorrect."
            };
        }
        const updates = {};
        if (params.newEmail && params.newEmail.trim()) updates.email = params.newEmail.trim();
        if (params.newPassword) updates.password = params.newPassword;
        const { data, error } = await supabase.auth.updateUser(updates);
        if (error || !data.user) {
            return {
                record: null,
                error: error?.message || "Unable to update credentials."
            };
        }
        setActiveUserId(data.user.id);
        setLastEmail(data.user.email || "");
        return {
            record: {
                userId: data.user.id,
                email: data.user.email || ""
            },
            error: ""
        };
    } catch  {
        return {
            record: null,
            error: "Unable to reach server. Check internet and try again."
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getActiveAuthRecord",
    ()=>getActiveAuthRecord,
    "getActiveUserId",
    ()=>getActiveUserId,
    "getLastUserId",
    ()=>getLastUserId,
    "requestEmailChangeOtp",
    ()=>requestEmailChangeOtp,
    "restoreLastSessionIfNeeded",
    ()=>restoreLastSessionIfNeeded,
    "setActiveUserId",
    ()=>setActiveUserId,
    "signIn",
    ()=>signIn,
    "signInWithOtp",
    ()=>signInWithOtp,
    "signInWithProvider",
    ()=>signInWithProvider,
    "signOut",
    ()=>signOut,
    "signUp",
    ()=>signUp,
    "updateCredentials",
    ()=>updateCredentials,
    "updatePasswordAfterOtp",
    ()=>updatePasswordAfterOtp,
    "verifyEmailChangeOtp",
    ()=>verifyEmailChangeOtp,
    "verifyEmailOtp",
    ()=>verifyEmailOtp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/runtimeMode.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$authLocal$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/authLocal.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$authSupabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/authSupabase.ts [app-client] (ecmascript)");
;
;
;
function impl() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() === "local" ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$authLocal$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ : __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$authSupabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__;
}
function getActiveUserId() {
    return impl().getActiveUserId();
}
function setActiveUserId(userId) {
    return impl().setActiveUserId(userId);
}
function getLastUserId() {
    return impl().getLastUserId();
}
function restoreLastSessionIfNeeded() {
    return impl().restoreLastSessionIfNeeded();
}
function getActiveAuthRecord() {
    return impl().getActiveAuthRecord();
}
async function signUp(email, password) {
    return impl().signUp(email, password);
}
async function signIn(email, password) {
    return impl().signIn(email, password);
}
async function signInWithOtp(email, opts) {
    return impl().signInWithOtp(email, opts);
}
async function verifyEmailOtp(email, token, type) {
    return impl().verifyEmailOtp(email, token, type);
}
async function signInWithProvider(provider) {
    return impl().signInWithProvider(provider);
}
async function signOut() {
    return impl().signOut();
}
async function updateCredentials(params) {
    return impl().updateCredentials(params);
}
async function updatePasswordAfterOtp(newPassword) {
    return impl().updatePasswordAfterOtp(newPassword);
}
async function requestEmailChangeOtp(params) {
    return impl().requestEmailChangeOtp(params);
}
async function verifyEmailChangeOtp(newEmail, token) {
    return impl().verifyEmailChangeOtp(newEmail, token);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/supabase/userKvSync.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "KV_KEYS",
    ()=>KV_KEYS,
    "deleteKvFromSupabase",
    ()=>deleteKvFromSupabase,
    "pullSupabaseKvToCache",
    ()=>pullSupabaseKvToCache,
    "pushKvToSupabase",
    ()=>pushKvToSupabase,
    "pushLocalSeedIfSupabaseEmpty",
    ()=>pushLocalSeedIfSupabaseEmpty
]);
"use client";
const TABLE = "user_kv";
const KV_KEYS = [
    "accountSetupBundle",
    "businessProfile",
    "invoices",
    "products",
    "customers",
    "invoiceTemplate",
    "invoiceVisibility",
    "subscriptionPlanId",
    "invoiceUsageCount",
    "invoiceUsageInitialized:v1",
    "templateTypography",
    "invoiceTemplateFontId",
    "invoiceTemplateFontSize",
    "dateFormat",
    "amountFormat",
    "showDecimals",
    "invoicePrefix",
    "invoicePadding",
    "invoiceStartNumber",
    "resetYearly",
    "invoiceResetMonthDay",
    "currencySymbol",
    "currencyPosition",
    "emailChangeAudit"
];
async function pullSupabaseKvToCache(supabase, userId) {
    const { data, error } = await supabase.from(TABLE).select("key,value").eq("user_id", userId).in("key", KV_KEYS);
    if (error || !data) return [];
    const out = [];
    for (const row of data){
        if (!row?.key) continue;
        const v = typeof row.value === "string" ? row.value : JSON.stringify(row.value ?? "");
        out.push({
            key: row.key,
            value: v
        });
    }
    return out;
}
async function pushKvToSupabase(supabase, userId, key, rawValue) {
    await supabase.from(TABLE).upsert({
        user_id: userId,
        key,
        value: rawValue
    }, {
        onConflict: "user_id,key"
    });
}
async function deleteKvFromSupabase(supabase, userId, key) {
    await supabase.from(TABLE).delete().eq("user_id", userId).eq("key", key);
}
async function pushLocalSeedIfSupabaseEmpty(supabase, userId) {
    void supabase;
    void userId;
    // Setup draft/resume are stored locally-only now (to avoid RLS issues and
    // cross-account leakage during onboarding). User KV seeding is therefore disabled.
    return;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/scopedKey.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "scopedKey",
    ()=>scopedKey
]);
function scopedKey(key, userId) {
    return `${key}::${userId}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/sensitiveData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "protectSensitiveDataForStorage",
    ()=>protectSensitiveDataForStorage,
    "revealSensitiveDataFromStorage",
    ()=>revealSensitiveDataFromStorage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$crypto$2d$js$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/crypto-js/index.js [app-client] (ecmascript)");
;
const ENC_PREFIX = "enc:v1:";
const DEFAULT_SECRET = "easybill-default-sensitive-data-key-v1";
const SECRET = (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_DATA_ENCRYPTION_KEY || DEFAULT_SECRET).trim();
function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function encryptValue(value) {
    if (!value) return value;
    if (value.startsWith(ENC_PREFIX)) return value;
    const cipher = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$crypto$2d$js$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].AES.encrypt(value, SECRET).toString();
    return `${ENC_PREFIX}${cipher}`;
}
function decryptValue(value) {
    if (!value) return value;
    if (!value.startsWith(ENC_PREFIX)) return value;
    const cipher = value.slice(ENC_PREFIX.length);
    try {
        const bytes = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$crypto$2d$js$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].AES.decrypt(cipher, SECRET);
        const plain = bytes.toString(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$crypto$2d$js$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].enc.Utf8);
        return plain || value;
    } catch  {
        return value;
    }
}
function transformFields(target, keys, mode) {
    const next = {
        ...target
    };
    for (const key of keys){
        const raw = next[key];
        if (typeof raw !== "string") continue;
        next[key] = mode === "encrypt" ? encryptValue(raw) : decryptValue(raw);
    }
    return next;
}
function protectSensitiveDataForStorage(key, rawValue) {
    try {
        if (key === "businessProfile") {
            const parsed = JSON.parse(rawValue);
            if (!isObject(parsed)) return rawValue;
            const encrypted = transformFields(parsed, [
                "businessName",
                "phone",
                "gst",
                "bankName",
                "accountNumber",
                "ifsc",
                "upi"
            ], "encrypt");
            return JSON.stringify(encrypted);
        }
        if (key === "invoices") {
            const parsed = JSON.parse(rawValue);
            if (!Array.isArray(parsed)) return rawValue;
            const encrypted = parsed.map((row)=>{
                if (!isObject(row)) return row;
                return transformFields(row, [
                    "clientPhone",
                    "clientGST"
                ], "encrypt");
            });
            return JSON.stringify(encrypted);
        }
        return rawValue;
    } catch  {
        return rawValue;
    }
}
function revealSensitiveDataFromStorage(key, rawValue) {
    try {
        if (key === "businessProfile") {
            const parsed = JSON.parse(rawValue);
            if (!isObject(parsed)) return rawValue;
            const decrypted = transformFields(parsed, [
                "businessName",
                "phone",
                "gst",
                "bankName",
                "accountNumber",
                "ifsc",
                "upi"
            ], "decrypt");
            return JSON.stringify(decrypted);
        }
        if (key === "invoices") {
            const parsed = JSON.parse(rawValue);
            if (!Array.isArray(parsed)) return rawValue;
            const decrypted = parsed.map((row)=>{
                if (!isObject(row)) return row;
                return transformFields(row, [
                    "clientPhone",
                    "clientGST"
                ], "decrypt");
            });
            return JSON.stringify(decrypted);
        }
        return rawValue;
    } catch  {
        return rawValue;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/userStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearUserKvCache",
    ()=>clearUserKvCache,
    "flushCloudKeyNow",
    ()=>flushCloudKeyNow,
    "getActiveOrGlobalItem",
    ()=>getActiveOrGlobalItem,
    "getActiveScopedKey",
    ()=>getActiveScopedKey,
    "getActiveUserItem",
    ()=>getActiveUserItem,
    "getUserItem",
    ()=>getUserItem,
    "isActiveUserKvHydrated",
    ()=>isActiveUserKvHydrated,
    "isUserKvHydrated",
    ()=>isUserKvHydrated,
    "migrateGlobalKeyToUser",
    ()=>migrateGlobalKeyToUser,
    "primeUserKvCache",
    ()=>primeUserKvCache,
    "removeActiveOrGlobalItem",
    ()=>removeActiveOrGlobalItem,
    "removeActiveUserItem",
    ()=>removeActiveUserItem,
    "removeUserItem",
    ()=>removeUserItem,
    "setActiveOrGlobalItem",
    ()=>setActiveOrGlobalItem,
    "setActiveUserItem",
    ()=>setActiveUserItem,
    "setUserItem",
    ()=>setUserItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/browser.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$userKvSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/userKvSync.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/runtimeMode.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$scopedKey$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/scopedKey.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sensitiveData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/sensitiveData.ts [app-client] (ecmascript)");
;
;
;
;
;
;
const PUSH_DEBOUNCE_MS = 600;
const pendingTimers = new Map();
const ACCOUNT_SETUP_BUNDLE_KEY = "accountSetupBundle";
const BUNDLED_KEYS = new Set([
    "businessProfile",
    "dateFormat",
    "amountFormat",
    "showDecimals",
    "invoicePrefix",
    "invoicePadding",
    "invoiceStartNumber",
    "resetYearly",
    "invoiceResetMonthDay",
    "currencySymbol",
    "currencyPosition",
    "invoiceVisibility"
]);
// Supabase-first cache: avoids localStorage as the primary store in cloud mode.
// Keyed as `${userId}:${key}`.
const cloudCache = new Map();
const hydratedUsers = new Set();
function isSetupKey(key) {
    return key === "setupProfileDraft" || key === "setupResumePath";
}
function isCloudKvKey(key) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$userKvSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KV_KEYS"].includes(key);
}
function cacheId(userId, key) {
    return `${userId}:${key}`;
}
function parseJson(raw) {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch  {
        return null;
    }
}
function readSetupBundle(userId) {
    const parsed = parseJson(cloudCache.get(cacheId(userId, ACCOUNT_SETUP_BUNDLE_KEY)) ?? null);
    return parsed && typeof parsed === "object" ? parsed : {};
}
function readBundledValue(userId, key) {
    if (!BUNDLED_KEYS.has(key)) return null;
    const bundle = readSetupBundle(userId);
    if (!(key in bundle)) return null;
    const value = bundle[key];
    if (value == null) return null;
    return typeof value === "string" ? value : JSON.stringify(value);
}
function primeUserKvCache(userId, entries) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() !== "supabase") return;
    hydratedUsers.add(userId);
    for (const row of entries){
        if (!row?.key) continue;
        cloudCache.set(cacheId(userId, row.key), row.value);
    }
}
function clearUserKvCache(userId) {
    hydratedUsers.delete(userId);
    for (const k of cloudCache.keys()){
        if (k.startsWith(`${userId}:`)) cloudCache.delete(k);
    }
}
function isUserKvHydrated(userId) {
    return hydratedUsers.has(userId);
}
function isActiveUserKvHydrated() {
    const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
    if (!userId) return true;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() !== "supabase") return true;
    return isUserKvHydrated(userId);
}
function getActiveScopedKey(key) {
    const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
    if (!userId) return null;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$scopedKey$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopedKey"])(key, userId);
}
function getUserItem(key, userId) {
    // Setup draft/resume are local-only (avoid Supabase KV writes + RLS issues).
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() === "supabase" && isSetupKey(key)) {
        try {
            const scoped = localStorage.getItem((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$scopedKey$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopedKey"])(key, userId));
            if (scoped != null) return scoped;
            return localStorage.getItem(key) // pre-OTP fallback
            ;
        } catch  {
            return null;
        }
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() === "supabase") {
        const bundled = readBundledValue(userId, key);
        if (bundled != null) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sensitiveData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["revealSensitiveDataFromStorage"])(key, bundled);
        const raw = cloudCache.get(cacheId(userId, key)) ?? null;
        return raw == null ? null : (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sensitiveData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["revealSensitiveDataFromStorage"])(key, raw);
    }
    const raw = localStorage.getItem((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$scopedKey$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopedKey"])(key, userId));
    return raw == null ? null : (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sensitiveData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["revealSensitiveDataFromStorage"])(key, raw);
}
function setUserItem(key, value, userId) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() === "supabase" && isSetupKey(key)) {
        try {
            localStorage.setItem((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$scopedKey$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopedKey"])(key, userId), value);
            // Keep a global fallback during the OTP step. We'll clear it
            // whenever users start a new signup flow.
            localStorage.setItem(key, value);
        } catch  {
        // ignore storage failures
        }
        return;
    }
    const valueForStorage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sensitiveData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["protectSensitiveDataForStorage"])(key, value);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() === "supabase") {
        if (BUNDLED_KEYS.has(key)) {
            const bundle = readSetupBundle(userId);
            bundle[key] = parseJson(valueForStorage) ?? valueForStorage;
            const bundleRaw = JSON.stringify(bundle);
            cloudCache.set(cacheId(userId, ACCOUNT_SETUP_BUNDLE_KEY), bundleRaw);
            // Keep in-memory reads consistent immediately.
            cloudCache.set(cacheId(userId, key), valueForStorage);
            schedulePush(ACCOUNT_SETUP_BUNDLE_KEY, bundleRaw);
            // Remove legacy per-key row for cleanliness.
            scheduleDelete(key);
            if ("TURBOPACK compile-time truthy", 1) {
                window.dispatchEvent(new CustomEvent("easybill:kv-write", {
                    detail: {
                        key
                    }
                }));
            }
            return;
        }
        cloudCache.set(cacheId(userId, key), valueForStorage);
        schedulePush(key, valueForStorage);
        if ("TURBOPACK compile-time truthy", 1) {
            window.dispatchEvent(new CustomEvent("easybill:kv-write", {
                detail: {
                    key
                }
            }));
        }
        return;
    }
    localStorage.setItem((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$scopedKey$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopedKey"])(key, userId), valueForStorage);
}
function removeUserItem(key, userId) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() === "supabase" && isSetupKey(key)) {
        try {
            localStorage.removeItem((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$scopedKey$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopedKey"])(key, userId));
            localStorage.removeItem(key);
        } catch  {
        // ignore
        }
        return;
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() === "supabase") {
        if (BUNDLED_KEYS.has(key)) {
            const bundle = readSetupBundle(userId);
            delete bundle[key];
            const bundleRaw = JSON.stringify(bundle);
            cloudCache.set(cacheId(userId, ACCOUNT_SETUP_BUNDLE_KEY), bundleRaw);
            cloudCache.delete(cacheId(userId, key));
            schedulePush(ACCOUNT_SETUP_BUNDLE_KEY, bundleRaw);
            scheduleDelete(key);
            if ("TURBOPACK compile-time truthy", 1) {
                window.dispatchEvent(new CustomEvent("easybill:kv-write", {
                    detail: {
                        key
                    }
                }));
            }
            return;
        }
        cloudCache.delete(cacheId(userId, key));
        scheduleDelete(key);
        if ("TURBOPACK compile-time truthy", 1) {
            window.dispatchEvent(new CustomEvent("easybill:kv-write", {
                detail: {
                    key
                }
            }));
        }
        return;
    }
    localStorage.removeItem((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$scopedKey$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopedKey"])(key, userId));
}
function getActiveUserItem(key) {
    const activeKey = getActiveScopedKey(key);
    if (!activeKey) return null;
    const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
    if (!userId) return null;
    return getUserItem(key, userId);
}
function getActiveOrGlobalItem(key) {
    const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
    if (userId) {
        // If a user is logged in, never fall back to global keys.
        // This prevents data leaking across accounts.
        return getUserItem(key, userId);
    }
    // Not logged in (e.g. before auth).
    // In Supabase mode we must avoid reading global sample keys (data leakage).
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() === "supabase") {
        if (key === "setupProfileDraft" || key === "setupResumePath") {
            return localStorage.getItem(key);
        }
        return null;
    }
    // Local (safety) mode: allow global reads.
    return localStorage.getItem(key);
}
function setActiveUserItem(key, value) {
    const activeKey = getActiveScopedKey(key);
    if (!activeKey) return;
    const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
    if (!userId) return;
    setUserItem(key, value, userId);
}
function setActiveOrGlobalItem(key, value) {
    const activeKey = getActiveScopedKey(key);
    if (activeKey) {
        const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
        if (!userId) return;
        setUserItem(key, value, userId);
        return;
    }
    localStorage.setItem(key, value);
}
function removeActiveUserItem(key) {
    const activeKey = getActiveScopedKey(key);
    if (!activeKey) return;
    const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
    if (!userId) return;
    removeUserItem(key, userId);
}
function removeActiveOrGlobalItem(key) {
    const activeKey = getActiveScopedKey(key);
    if (activeKey) {
        const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
        if (!userId) return;
        removeUserItem(key, userId);
        // Setup draft/resume are temporary and must never be re-seeded for a different account.
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() === "supabase") {
            if (key === "setupProfileDraft" || key === "setupResumePath") {
                try {
                    localStorage.removeItem(key);
                } catch  {
                // ignore
                }
            }
        }
        return;
    }
    localStorage.removeItem(key);
}
function migrateGlobalKeyToUser(key, userId) {
    // Legacy migration helper (localStorage mode only).
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() === "supabase") return false;
    const global = localStorage.getItem(key);
    if (global == null) return false;
    const targetKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$scopedKey$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopedKey"])(key, userId);
    if (localStorage.getItem(targetKey) != null) return false;
    localStorage.setItem(targetKey, global);
    return true;
}
function schedulePush(key, value) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() !== "supabase") return;
    const capturedUserId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
    if (!capturedUserId) return;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const id = `${capturedUserId}:${key}`;
    const existing = pendingTimers.get(id);
    if (existing) {
        window.clearTimeout(existing);
    }
    const timer = window.setTimeout(()=>{
        pendingTimers.delete(id);
        (async ()=>{
            const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
            const { data } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseUser"])();
            const actualUserId = data.user?.id;
            if (!actualUserId) return;
            // If our cached/active userId drifted, fix cache under the real auth user id.
            if (actualUserId !== capturedUserId) {
                cloudCache.delete(cacheId(capturedUserId, key));
                cloudCache.set(cacheId(actualUserId, key), value);
                hydratedUsers.add(actualUserId);
            }
            try {
                // Only push keys we track in cloud KV.
                if (!isCloudKvKey(key)) return;
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$userKvSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pushKvToSupabase"])(supabase, actualUserId, key, value);
            } catch (e) {
                // Prevent unhandled promise rejections from breaking UX.
                console.error("KV push failed", {
                    key,
                    capturedUserId,
                    actualUserId,
                    e
                });
            }
        })();
    }, PUSH_DEBOUNCE_MS);
    pendingTimers.set(id, timer);
}
function scheduleDelete(key) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() !== "supabase") return;
    const capturedUserId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
    if (!capturedUserId) return;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const id = `${capturedUserId}:${key}`;
    const existing = pendingTimers.get(id);
    if (existing) window.clearTimeout(existing);
    const timer = window.setTimeout(()=>{
        pendingTimers.delete(id);
        (async ()=>{
            const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
            const { data } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseUser"])();
            const actualUserId = data.user?.id;
            if (!actualUserId) return;
            cloudCache.delete(cacheId(capturedUserId, key));
            cloudCache.delete(cacheId(actualUserId, key));
            try {
                if (!isCloudKvKey(key)) return;
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$userKvSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deleteKvFromSupabase"])(supabase, actualUserId, key);
            } catch (e) {
                console.error("KV delete failed", {
                    key,
                    capturedUserId,
                    actualUserId,
                    e
                });
            }
        })();
    }, PUSH_DEBOUNCE_MS);
    pendingTimers.set(id, timer);
}
async function flushCloudKeyNow(key) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() !== "supabase") return;
    const activeUserId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
    if (!activeUserId) return;
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
    const { data } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseUser"])();
    const actualUserId = data.user?.id;
    if (!actualUserId) return;
    const value = cloudCache.get(cacheId(actualUserId, key)) ?? cloudCache.get(cacheId(activeUserId, key));
    if (value == null) return;
    if (!isCloudKvKey(key)) return;
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$userKvSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pushKvToSupabase"])(supabase, actualUserId, key, value);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/context/BusinessContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BusinessProvider",
    ()=>BusinessProvider,
    "useBusiness",
    ()=>useBusiness
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/userStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const emptyBusiness = {
    businessName: "",
    phone: "",
    email: "",
    gst: "",
    address: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upi: "",
    terms: "",
    logo: "",
    logoShape: "square"
};
const BusinessContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function normalizeBusiness(value) {
    const parsed = typeof value === "object" && value !== null ? value : {};
    return {
        businessName: parsed.businessName || "",
        phone: parsed.phone || "",
        email: parsed.email || "",
        gst: parsed.gst || "",
        address: parsed.address || "",
        bankName: parsed.bankName || "",
        accountNumber: parsed.accountNumber || "",
        ifsc: parsed.ifsc || "",
        upi: parsed.upi || "",
        terms: typeof parsed.terms === "string" ? parsed.terms : "",
        logo: parsed.logo || "",
        logoShape: parsed.logoShape === "round" ? "round" : "square"
    };
}
function readBusinessFromStore() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const stored = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("businessProfile");
    if (!stored) return emptyBusiness;
    try {
        return normalizeBusiness(JSON.parse(stored));
    } catch  {
        return emptyBusiness;
    }
}
function BusinessProvider({ children }) {
    _s();
    const [business, setBusinessState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "BusinessProvider.useState": ()=>readBusinessFromStore()
    }["BusinessProvider.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BusinessProvider.useEffect": ()=>{
            function onCloud() {
                setBusinessState(readBusinessFromStore());
            }
            window.addEventListener("easybill:cloud-sync", onCloud);
            return ({
                "BusinessProvider.useEffect": ()=>window.removeEventListener("easybill:cloud-sync", onCloud)
            })["BusinessProvider.useEffect"];
        }
    }["BusinessProvider.useEffect"], []);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "BusinessProvider.useMemo[value]": ()=>({
                business,
                setBusiness (data) {
                    const normalizedBusiness = normalizeBusiness(data);
                    setBusinessState(normalizedBusiness);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("businessProfile", JSON.stringify(normalizedBusiness));
                }
            })
    }["BusinessProvider.useMemo[value]"], [
        business
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BusinessContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/context/BusinessContext.tsx",
        lineNumber: 100,
        columnNumber: 10
    }, this);
}
_s(BusinessProvider, "dBDOg/g1imQAQDooOjehMJqf9rA=");
_c = BusinessProvider;
function useBusiness() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(BusinessContext);
    if (!context) {
        throw new Error("useBusiness must be used inside BusinessProvider");
    }
    return context;
}
_s1(useBusiness, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "BusinessProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/invoiceVisibilityShared.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Shared between client settings and server PDF — must stay free of `"use client"`. */ __turbopack_context__.s([
    "DEFAULT_INVOICE_VISIBILITY",
    ()=>DEFAULT_INVOICE_VISIBILITY
]);
const DEFAULT_INVOICE_VISIBILITY = {
    businessName: true,
    businessAddress: true,
    businessPhone: true,
    businessGstin: true,
    businessTerms: true,
    businessBankDetails: true,
    businessLogo: true,
    clientName: true,
    clientAddress: true,
    clientPhone: true,
    clientGstin: true
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/invoiceResetDate.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_RESET_MONTH_DAY",
    ()=>DEFAULT_RESET_MONTH_DAY,
    "RESET_MONTH_DAY_OPTIONS",
    ()=>RESET_MONTH_DAY_OPTIONS,
    "formatResetMonthDayLabel",
    ()=>formatResetMonthDayLabel,
    "formatResetMonthLabel",
    ()=>formatResetMonthLabel,
    "getResetMonthDayOptions",
    ()=>getResetMonthDayOptions,
    "normalizeResetMonthDay",
    ()=>normalizeResetMonthDay
]);
const MONTH_LABELS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];
const DEFAULT_RESET_MONTH_DAY = "01-01";
function normalizeResetMonthDay(value) {
    if (!value) return DEFAULT_RESET_MONTH_DAY;
    const match = /^(\d{2})-(\d{2})$/.exec(value);
    if (!match) return DEFAULT_RESET_MONTH_DAY;
    const month = Number(match[1]);
    const day = Number(match[2]);
    if (month < 1 || month > 12) return DEFAULT_RESET_MONTH_DAY;
    if (day !== 1) return DEFAULT_RESET_MONTH_DAY;
    return `${String(month).padStart(2, "0")}-01`;
}
function formatResetMonthDayLabel(value) {
    const normalized = normalizeResetMonthDay(value);
    const [monthRaw, dayRaw] = normalized.split("-");
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    return `${MONTH_LABELS[month - 1]} ${String(day).padStart(2, "0")}`;
}
function formatResetMonthLabel(value) {
    const normalized = normalizeResetMonthDay(value);
    const [monthRaw] = normalized.split("-");
    const month = Number(monthRaw);
    return MONTH_LABELS[month - 1];
}
function getResetMonthDayOptions() {
    const options = [];
    for(let month = 1; month <= 12; month += 1){
        const value = `${String(month).padStart(2, "0")}-01`;
        options.push({
            value,
            label: `01 of ${MONTH_LABELS[month - 1]}`
        });
    }
    return options;
}
const RESET_MONTH_DAY_OPTIONS = getResetMonthDayOptions();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/context/SettingsContext.tsx [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SettingsProvider",
    ()=>SettingsProvider,
    "useSettings",
    ()=>useSettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/userStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/runtimeMode.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceVisibilityShared$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/invoiceVisibilityShared.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceResetDate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/invoiceResetDate.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
const defaultSettings = {
    dateFormat: "YYYY-MM-DD",
    amountFormat: "indian",
    showDecimals: true,
    invoicePrefix: "INV-",
    invoicePadding: 4,
    invoiceStartNumber: 1,
    resetYearly: true,
    invoiceResetMonthDay: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceResetDate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_RESET_MONTH_DAY"],
    currencySymbol: "₹",
    currencyPosition: "before",
    invoiceVisibility: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceVisibilityShared$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_INVOICE_VISIBILITY"]
};
const SettingsContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function readSettingsFromStorage() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const savedDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("dateFormat");
    const savedAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("amountFormat");
    const savedDecimals = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("showDecimals");
    const savedPrefix = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("invoicePrefix");
    const savedPadding = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("invoicePadding");
    const savedStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("invoiceStartNumber");
    const savedReset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("resetYearly");
    const savedResetMonthDay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("invoiceResetMonthDay");
    const savedCurrency = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("currencySymbol");
    const savedCurrencyPos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("currencyPosition");
    const savedInvoiceVisibility = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])("invoiceVisibility");
    let invoiceVisibility = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceVisibilityShared$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_INVOICE_VISIBILITY"];
    if (savedInvoiceVisibility) {
        try {
            const parsed = JSON.parse(savedInvoiceVisibility);
            invoiceVisibility = {
                ...__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceVisibilityShared$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_INVOICE_VISIBILITY"],
                ...parsed || {}
            };
        } catch  {
            invoiceVisibility = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceVisibilityShared$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_INVOICE_VISIBILITY"];
        }
    }
    return {
        dateFormat: savedDate || defaultSettings.dateFormat,
        amountFormat: savedAmount || defaultSettings.amountFormat,
        showDecimals: savedDecimals ? savedDecimals === "true" : defaultSettings.showDecimals,
        invoicePrefix: savedPrefix || defaultSettings.invoicePrefix,
        invoicePadding: savedPadding ? Number(savedPadding) : defaultSettings.invoicePadding,
        invoiceStartNumber: savedStart ? Number(savedStart) : defaultSettings.invoiceStartNumber,
        resetYearly: savedReset ? savedReset === "true" : defaultSettings.resetYearly,
        invoiceResetMonthDay: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceResetDate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizeResetMonthDay"])(savedResetMonthDay),
        currencySymbol: savedCurrency || defaultSettings.currencySymbol,
        currencyPosition: savedCurrencyPos === "after" ? "after" : defaultSettings.currencyPosition,
        invoiceVisibility
    };
}
function writeMissingDefaults(snapshot) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const entries = [
        [
            "dateFormat",
            snapshot.dateFormat
        ],
        [
            "amountFormat",
            snapshot.amountFormat
        ],
        [
            "showDecimals",
            String(snapshot.showDecimals)
        ],
        [
            "invoicePrefix",
            snapshot.invoicePrefix
        ],
        [
            "invoicePadding",
            String(snapshot.invoicePadding)
        ],
        [
            "invoiceStartNumber",
            String(snapshot.invoiceStartNumber)
        ],
        [
            "resetYearly",
            String(snapshot.resetYearly)
        ],
        [
            "invoiceResetMonthDay",
            snapshot.invoiceResetMonthDay
        ],
        [
            "currencySymbol",
            snapshot.currencySymbol
        ],
        [
            "currencyPosition",
            snapshot.currencyPosition
        ],
        [
            "invoiceVisibility",
            JSON.stringify(snapshot.invoiceVisibility)
        ]
    ];
    for (const [key, value] of entries){
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveOrGlobalItem"])(key) == null) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])(key, value);
        }
    }
}
function SettingsProvider({ children }) {
    _s();
    const [settings, setSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "SettingsProvider.useState": ()=>readSettingsFromStorage()
    }["SettingsProvider.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SettingsProvider.useEffect": ()=>{
            const supabaseNeedsHydration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() === "supabase" && Boolean((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])());
            if (!supabaseNeedsHydration) {
                writeMissingDefaults(readSettingsFromStorage());
            }
            function onCloud() {
                const nextSettings = readSettingsFromStorage();
                setSettings(nextSettings);
                writeMissingDefaults(nextSettings);
            }
            window.addEventListener("easybill:cloud-sync", onCloud);
            return ({
                "SettingsProvider.useEffect": ()=>window.removeEventListener("easybill:cloud-sync", onCloud)
            })["SettingsProvider.useEffect"];
        }
    }["SettingsProvider.useEffect"], []);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SettingsProvider.useMemo[value]": ()=>({
                ...settings,
                updateDateFormat (format) {
                    setSettings({
                        "SettingsProvider.useMemo[value]": (prev)=>({
                                ...prev,
                                dateFormat: format
                            })
                    }["SettingsProvider.useMemo[value]"]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("dateFormat", format);
                },
                updateAmountFormat (format) {
                    setSettings({
                        "SettingsProvider.useMemo[value]": (prev)=>({
                                ...prev,
                                amountFormat: format
                            })
                    }["SettingsProvider.useMemo[value]"]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("amountFormat", format);
                },
                updateShowDecimals (next) {
                    setSettings({
                        "SettingsProvider.useMemo[value]": (prev)=>({
                                ...prev,
                                showDecimals: next
                            })
                    }["SettingsProvider.useMemo[value]"]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("showDecimals", String(next));
                },
                updateInvoicePrefix (next) {
                    setSettings({
                        "SettingsProvider.useMemo[value]": (prev)=>({
                                ...prev,
                                invoicePrefix: next
                            })
                    }["SettingsProvider.useMemo[value]"]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("invoicePrefix", next);
                },
                updateInvoicePadding (next) {
                    setSettings({
                        "SettingsProvider.useMemo[value]": (prev)=>({
                                ...prev,
                                invoicePadding: next
                            })
                    }["SettingsProvider.useMemo[value]"]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("invoicePadding", String(next));
                },
                updateInvoiceStartNumber (next) {
                    setSettings({
                        "SettingsProvider.useMemo[value]": (prev)=>({
                                ...prev,
                                invoiceStartNumber: next
                            })
                    }["SettingsProvider.useMemo[value]"]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("invoiceStartNumber", String(next));
                },
                updateResetYearly (next) {
                    setSettings({
                        "SettingsProvider.useMemo[value]": (prev)=>({
                                ...prev,
                                resetYearly: next
                            })
                    }["SettingsProvider.useMemo[value]"]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("resetYearly", String(next));
                },
                updateInvoiceResetMonthDay (next) {
                    const normalized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceResetDate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizeResetMonthDay"])(next);
                    setSettings({
                        "SettingsProvider.useMemo[value]": (prev)=>({
                                ...prev,
                                invoiceResetMonthDay: normalized
                            })
                    }["SettingsProvider.useMemo[value]"]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("invoiceResetMonthDay", normalized);
                },
                updateCurrencySymbol (next) {
                    setSettings({
                        "SettingsProvider.useMemo[value]": (prev)=>({
                                ...prev,
                                currencySymbol: next
                            })
                    }["SettingsProvider.useMemo[value]"]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("currencySymbol", next);
                },
                updateCurrencyPosition (next) {
                    setSettings({
                        "SettingsProvider.useMemo[value]": (prev)=>({
                                ...prev,
                                currencyPosition: next
                            })
                    }["SettingsProvider.useMemo[value]"]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("currencyPosition", next);
                },
                updateInvoiceVisibility (next) {
                    setSettings({
                        "SettingsProvider.useMemo[value]": (prev)=>({
                                ...prev,
                                invoiceVisibility: next
                            })
                    }["SettingsProvider.useMemo[value]"]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveOrGlobalItem"])("invoiceVisibility", JSON.stringify(next));
                }
            })
    }["SettingsProvider.useMemo[value]"], [
        settings
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SettingsContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/context/SettingsContext.tsx",
        lineNumber: 206,
        columnNumber: 10
    }, this);
}
_s(SettingsProvider, "OGQigEZmXEb6VE7uJewUs+9AuLs=");
_c = SettingsProvider;
function useSettings() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used inside SettingsProvider");
    }
    return context;
}
_s1(useSettings, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "SettingsProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/context/SettingsContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_INVOICE_VISIBILITY",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceVisibilityShared$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_INVOICE_VISIBILITY"],
    "SettingsProvider",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$context$2f$SettingsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["SettingsProvider"],
    "useSettings",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$context$2f$SettingsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useSettings"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$SettingsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/context/SettingsContext.tsx [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$invoiceVisibilityShared$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/invoiceVisibilityShared.ts [app-client] (ecmascript)");
}),
"[project]/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Slot$3e$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript) <export * as Slot>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none transition-[transform,opacity,background-color,border-color,box-shadow,color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
            outline: "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
            ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
            destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
            xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
            sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
            lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
            icon: "size-8",
            "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
            "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
            "icon-lg": "size-9"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Slot$3e$__["Slot"].Root : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        "data-variant": variant,
        "data-size": size,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/button.tsx",
        lineNumber: 57,
        columnNumber: 5
    }, this);
}
_c = Button;
;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/dialog.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Dialog",
    ()=>Dialog,
    "DialogClose",
    ()=>DialogClose,
    "DialogContent",
    ()=>DialogContent,
    "DialogDescription",
    ()=>DialogDescription,
    "DialogFooter",
    ()=>DialogFooter,
    "DialogHeader",
    ()=>DialogHeader,
    "DialogOverlay",
    ()=>DialogOverlay,
    "DialogPortal",
    ()=>DialogPortal,
    "DialogTitle",
    ()=>DialogTitle,
    "DialogTrigger",
    ()=>DialogTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [app-client] (ecmascript) <export * as Dialog>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XIcon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as XIcon>");
"use client";
;
;
;
;
;
function Dialog({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Root, {
        "data-slot": "dialog",
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/dialog.tsx",
        lineNumber: 13,
        columnNumber: 10
    }, this);
}
_c = Dialog;
function DialogTrigger({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Trigger, {
        "data-slot": "dialog-trigger",
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/dialog.tsx",
        lineNumber: 19,
        columnNumber: 10
    }, this);
}
_c1 = DialogTrigger;
function DialogPortal({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Portal, {
        "data-slot": "dialog-portal",
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/dialog.tsx",
        lineNumber: 25,
        columnNumber: 10
    }, this);
}
_c2 = DialogPortal;
function DialogClose({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Close, {
        "data-slot": "dialog-close",
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/dialog.tsx",
        lineNumber: 31,
        columnNumber: 10
    }, this);
}
_c3 = DialogClose;
function DialogOverlay({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Overlay, {
        "data-slot": "dialog-overlay",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("fixed inset-0 isolate z-50 bg-slate-900/30 duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] supports-backdrop-filter:backdrop-blur-md data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:backdrop-blur-none motion-reduce:transition-none", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/dialog.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
_c4 = DialogOverlay;
function DialogContent({ className, children, showCloseButton = true, overlayClassName, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogPortal, {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogOverlay, {
                className: overlayClassName
            }, void 0, false, {
                fileName: "[project]/components/ui/dialog.tsx",
                lineNumber: 63,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Content, {
                "data-slot": "dialog-content",
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-background p-4 text-sm ring-1 ring-foreground/10 outline-none duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none sm:max-w-sm", className),
                ...props,
                children: [
                    children,
                    showCloseButton && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Close, {
                        "data-slot": "dialog-close",
                        asChild: true,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "ghost",
                            className: "absolute top-2 right-2",
                            size: "icon-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XIcon$3e$__["XIcon"], {}, void 0, false, {
                                    fileName: "[project]/components/ui/dialog.tsx",
                                    lineNumber: 80,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "sr-only",
                                    children: "Close"
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/dialog.tsx",
                                    lineNumber: 82,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ui/dialog.tsx",
                            lineNumber: 75,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ui/dialog.tsx",
                        lineNumber: 74,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ui/dialog.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ui/dialog.tsx",
        lineNumber: 62,
        columnNumber: 5
    }, this);
}
_c5 = DialogContent;
function DialogHeader({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "dialog-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/dialog.tsx",
        lineNumber: 93,
        columnNumber: 5
    }, this);
}
_c6 = DialogHeader;
function DialogFooter({ className, showCloseButton = false, children, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "dialog-footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end", className),
        ...props,
        children: [
            children,
            showCloseButton && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Close, {
                asChild: true,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                    variant: "outline",
                    children: "Close"
                }, void 0, false, {
                    fileName: "[project]/components/ui/dialog.tsx",
                    lineNumber: 121,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/ui/dialog.tsx",
                lineNumber: 120,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ui/dialog.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
_c7 = DialogFooter;
function DialogTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Title, {
        "data-slot": "dialog-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-base leading-none font-medium", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/dialog.tsx",
        lineNumber: 133,
        columnNumber: 5
    }, this);
}
_c8 = DialogTitle;
function DialogDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Description, {
        "data-slot": "dialog-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/dialog.tsx",
        lineNumber: 146,
        columnNumber: 5
    }, this);
}
_c9 = DialogDescription;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9;
__turbopack_context__.k.register(_c, "Dialog");
__turbopack_context__.k.register(_c1, "DialogTrigger");
__turbopack_context__.k.register(_c2, "DialogPortal");
__turbopack_context__.k.register(_c3, "DialogClose");
__turbopack_context__.k.register(_c4, "DialogOverlay");
__turbopack_context__.k.register(_c5, "DialogContent");
__turbopack_context__.k.register(_c6, "DialogHeader");
__turbopack_context__.k.register(_c7, "DialogFooter");
__turbopack_context__.k.register(_c8, "DialogTitle");
__turbopack_context__.k.register(_c9, "DialogDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/providers/AppAlertProvider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppAlertProvider",
    ()=>AppAlertProvider,
    "useAppAlert",
    ()=>useAppAlert
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-client] (ecmascript) <export default as CheckCircle2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.js [app-client] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/dialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const AppAlertContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function toneStyles(tone) {
    switch(tone){
        case "success":
            return {
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"],
                iconWrap: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
                accentBar: "bg-emerald-500",
                primary: "w-full min-h-[52px] rounded-2xl bg-emerald-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_36px_rgba(5,150,105,0.35)] transition-[transform,opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-emerald-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-300/80 sm:min-h-12 sm:text-sm",
                secondary: "w-full min-h-[48px] rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3 text-[15px] font-semibold text-emerald-900 transition-[background-color,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-emerald-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-200/80 sm:text-sm"
            };
        case "warning":
            return {
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
                iconWrap: "bg-amber-100 text-amber-800 ring-1 ring-amber-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
                accentBar: "bg-amber-500",
                primary: "w-full min-h-[52px] rounded-2xl bg-amber-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_36px_rgba(217,119,6,0.35)] transition-[transform,opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-amber-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-300/80 sm:min-h-12 sm:text-sm",
                secondary: "w-full min-h-[48px] rounded-2xl border-2 border-amber-200 bg-white px-4 py-3 text-[15px] font-semibold text-amber-950 transition-[background-color,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-amber-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-200/80 sm:text-sm"
            };
        case "danger":
            return {
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
                iconWrap: "bg-rose-100 text-rose-700 ring-1 ring-rose-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
                accentBar: "bg-rose-500",
                primary: "w-full min-h-[52px] rounded-2xl bg-rose-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_40px_rgba(225,29,72,0.38)] transition-[transform,opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-rose-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-300/80 sm:min-h-12 sm:text-sm",
                secondary: "w-full min-h-[48px] rounded-2xl border-2 border-rose-200 bg-white px-4 py-3 text-[15px] font-semibold text-rose-950 transition-[background-color,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-rose-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-200/80 sm:text-sm"
            };
        case "info":
        default:
            return {
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"],
                iconWrap: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
                accentBar: "bg-indigo-500",
                primary: "w-full min-h-[52px] rounded-2xl bg-indigo-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_36px_rgba(79,70,229,0.35)] transition-[transform,opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-indigo-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-300/80 sm:min-h-12 sm:text-sm",
                secondary: "w-full min-h-[48px] rounded-2xl border-2 border-indigo-200 bg-white px-4 py-3 text-[15px] font-semibold text-indigo-950 transition-[background-color,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-indigo-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/80 sm:text-sm"
            };
    }
}
function AppAlertProvider({ children }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [opts, setOpts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const close = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AppAlertProvider.useCallback[close]": ()=>{
            setOpen(false);
        }
    }["AppAlertProvider.useCallback[close]"], []);
    const showAlert = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AppAlertProvider.useCallback[showAlert]": (next)=>{
            setOpts({
                tone: "info",
                primaryLabel: "Got it",
                secondaryLabel: "",
                ...next
            });
            setOpen(true);
        }
    }["AppAlertProvider.useCallback[showAlert]"], []);
    const api = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AppAlertProvider.useMemo[api]": ()=>({
                showAlert
            })
    }["AppAlertProvider.useMemo[api]"], [
        showAlert
    ]);
    const tone = opts?.tone || "info";
    const styles = toneStyles(tone);
    const Icon = styles.icon;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AppAlertContext.Provider, {
        value: api,
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Dialog"], {
                open: open,
                onOpenChange: (nextOpen)=>{
                    setOpen(nextOpen);
                    if (!nextOpen) {
                        setOpts(null);
                    }
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogContent"], {
                    showCloseButton: false,
                    overlayClassName: "bg-slate-900/40 supports-backdrop-filter:backdrop-blur-lg",
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("max-h-[min(92vh,720px)] max-w-[min(calc(100vw-1.5rem),440px)] overflow-hidden rounded-[24px] border border-slate-200/90 bg-white/[0.98] p-0 shadow-[0_32px_80px_rgba(15,23,42,0.18),0_12px_32px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:max-w-[520px] sm:rounded-[28px]", "duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] data-open:zoom-in-95"),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("h-1 w-full rounded-t-[24px] sm:rounded-t-[28px]", styles.accentBar),
                            "aria-hidden": true
                        }, void 0, false, {
                            fileName: "[project]/components/providers/AppAlertProvider.tsx",
                            lineNumber: 129,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>setOpen(false),
                            className: "absolute top-3 right-3 z-10 flex h-10 w-10 touch-manipulation items-center justify-center rounded-full text-slate-500 transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 active:scale-95",
                            "aria-label": "Close",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "h-5 w-5",
                                strokeWidth: 2
                            }, void 0, false, {
                                fileName: "[project]/components/providers/AppAlertProvider.tsx",
                                lineNumber: 137,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/providers/AppAlertProvider.tsx",
                            lineNumber: 131,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogHeader"], {
                            className: "space-y-0 p-5 pb-2 text-left sm:p-6 sm:pb-3",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("mx-auto flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl sm:mx-0 sm:h-14 sm:w-14 sm:rounded-[1.125rem]", styles.iconWrap),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                            className: "h-10 w-10 sm:h-11 sm:w-11",
                                            strokeWidth: 2,
                                            "aria-hidden": true
                                        }, void 0, false, {
                                            fileName: "[project]/components/providers/AppAlertProvider.tsx",
                                            lineNumber: 148,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/providers/AppAlertProvider.tsx",
                                        lineNumber: 142,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "min-w-0 flex-1 text-center sm:pt-0.5 sm:text-left",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogTitle"], {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("font-display pr-10 text-xl font-bold leading-snug tracking-tight text-slate-950 sm:pr-8 sm:text-2xl sm:leading-tight"),
                                                children: opts?.title || ""
                                            }, void 0, false, {
                                                fileName: "[project]/components/providers/AppAlertProvider.tsx",
                                                lineNumber: 151,
                                                columnNumber: 17
                                            }, this),
                                            opts?.actionHint ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-2 text-sm font-semibold leading-snug text-slate-800 sm:text-[15px] sm:leading-6",
                                                children: opts.actionHint
                                            }, void 0, false, {
                                                fileName: "[project]/components/providers/AppAlertProvider.tsx",
                                                lineNumber: 159,
                                                columnNumber: 19
                                            }, this) : null,
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogDescription"], {
                                                className: "mt-2 text-pretty text-sm leading-relaxed text-slate-600 sm:mt-3 sm:text-[15px] sm:leading-7",
                                                children: opts?.message || ""
                                            }, void 0, false, {
                                                fileName: "[project]/components/providers/AppAlertProvider.tsx",
                                                lineNumber: 163,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/providers/AppAlertProvider.tsx",
                                        lineNumber: 150,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/providers/AppAlertProvider.tsx",
                                lineNumber: 141,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/providers/AppAlertProvider.tsx",
                            lineNumber: 140,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-2.5 border-t border-slate-200/80 bg-slate-50/40 px-5 py-4 backdrop-blur-sm sm:gap-3 sm:px-6 sm:py-5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>{
                                        close();
                                        if (opts?.onPrimary) {
                                            opts.onPrimary();
                                            return;
                                        }
                                        void router;
                                    },
                                    className: styles.primary,
                                    children: opts?.primaryLabel || "Got it"
                                }, void 0, false, {
                                    fileName: "[project]/components/providers/AppAlertProvider.tsx",
                                    lineNumber: 171,
                                    columnNumber: 13
                                }, this),
                                opts?.secondaryLabel ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>{
                                        close();
                                        opts?.onSecondary?.();
                                    },
                                    className: styles.secondary,
                                    children: opts.secondaryLabel
                                }, void 0, false, {
                                    fileName: "[project]/components/providers/AppAlertProvider.tsx",
                                    lineNumber: 187,
                                    columnNumber: 15
                                }, this) : null
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/providers/AppAlertProvider.tsx",
                            lineNumber: 170,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/providers/AppAlertProvider.tsx",
                    lineNumber: 121,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/providers/AppAlertProvider.tsx",
                lineNumber: 112,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/providers/AppAlertProvider.tsx",
        lineNumber: 109,
        columnNumber: 5
    }, this);
}
_s(AppAlertProvider, "se1+hOL6Gum5cjjbbyU98Un9qMA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AppAlertProvider;
function useAppAlert() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AppAlertContext);
    if (!ctx) {
        throw new Error("useAppAlert must be used within AppAlertProvider");
    }
    return ctx;
}
_s1(useAppAlert, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "AppAlertProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/providers/SupabaseAuthSync.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SupabaseAuthSync
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/browser.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$userKvSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/userKvSync.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/runtimeMode.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/userStore.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
const FOCUS_KV_RESYNC_MIN_MS = 60_000;
function SupabaseAuthSync() {
    _s();
    const ran = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const lastUserId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastFocusSyncAt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SupabaseAuthSync.useEffect": ()=>{
            if (ran.current) return;
            ran.current = true;
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])() !== "supabase") return;
            const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSupabaseBrowserClient"])();
            async function sync(userId) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$userKvSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pushLocalSeedIfSupabaseEmpty"])(supabase, userId);
                const rows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$userKvSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pullSupabaseKvToCache"])(supabase, userId);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearUserKvCache"])(userId);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["primeUserKvCache"])(userId, rows);
                window.dispatchEvent(new Event("easybill:cloud-sync"));
            }
            async function runInitial() {
                const { data } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$browser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseUser"])();
                const user = data.user;
                lastUserId.current = user?.id || null;
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveUserId"])(user?.id || null);
                if (!user) {
                    window.dispatchEvent(new Event("easybill:auth-sync-initialized"));
                    return;
                }
                await sync(user.id);
                window.dispatchEvent(new Event("easybill:auth-sync-initialized"));
            }
            const { data: sub } = supabase.auth.onAuthStateChange({
                "SupabaseAuthSync.useEffect": (_evt, session)=>{
                    const nextId = session?.user?.id || null;
                    const prevId = lastUserId.current;
                    lastUserId.current = nextId;
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveUserId"])(nextId);
                    if (prevId && prevId !== nextId) (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearUserKvCache"])(prevId);
                    if (nextId) {
                        void sync(nextId);
                    } else {
                        window.dispatchEvent(new Event("easybill:cloud-sync"));
                    }
                }
            }["SupabaseAuthSync.useEffect"]);
            function onFocus() {
                const id = lastUserId.current;
                if (!id) return;
                const now = Date.now();
                // Avoid a full user_kv pull on every tab/app focus (common on mobile) — that felt like global slowness.
                if (now - lastFocusSyncAt.current < FOCUS_KV_RESYNC_MIN_MS) return;
                lastFocusSyncAt.current = now;
                void sync(id);
            }
            window.addEventListener("focus", onFocus);
            void runInitial();
            return ({
                "SupabaseAuthSync.useEffect": ()=>{
                    window.removeEventListener("focus", onFocus);
                    sub.subscription.unsubscribe();
                }
            })["SupabaseAuthSync.useEffect"];
        }
    }["SupabaseAuthSync.useEffect"], []);
    return null;
}
_s(SupabaseAuthSync, "aF05nQBuUmxa0ASxSbvlaH94nrs=");
_c = SupabaseAuthSync;
var _c;
__turbopack_context__.k.register(_c, "SupabaseAuthSync");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/skeleton.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Skeleton",
    ()=>Skeleton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
function Skeleton({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "skeleton",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("rounded-md bg-muted/70 eb-skeleton-pulse", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/skeleton.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
_c = Skeleton;
;
var _c;
__turbopack_context__.k.register(_c, "Skeleton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/providers/KvHydrationGate.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>KvHydrationGate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/skeleton.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/runtimeMode.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/userStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function isPrintPdfBypassPath() {
    try {
        const pathname = window.location?.pathname || "";
        return pathname.includes("/invoice-pdf");
    } catch  {
        return false;
    }
}
function KvHydrationGate({ children }) {
    _s();
    const [ready, setReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Run before paint so lightweight routes (e.g. legacy `/invoice-pdf`) are not blocked by KV gating.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "KvHydrationGate.useLayoutEffect": ()=>{
            if (isPrintPdfBypassPath()) {
                setReady(true);
            }
        }
    }["KvHydrationGate.useLayoutEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "KvHydrationGate.useEffect": ()=>{
            // Important for PDF generation:
            // Avoid delaying routes that do not need a hydrated KV cache.
            if (isPrintPdfBypassPath()) {
                setReady(true);
                return;
            }
            const mode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$runtimeMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthMode"])();
            if (mode !== "supabase") {
                setReady(true);
                return;
            }
            let authInitSeen = false;
            const checkReady = {
                "KvHydrationGate.useEffect.checkReady": ()=>{
                    const userId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveUserId"])();
                    // If user exists, we only render once KV cache is hydrated.
                    if (userId) {
                        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isActiveUserKvHydrated"])()) setReady(true);
                        return;
                    }
                    // No user yet: wait briefly for auth init, then assume logged out.
                    if (authInitSeen) setReady(true);
                }
            }["KvHydrationGate.useEffect.checkReady"];
            const onAuthInit = {
                "KvHydrationGate.useEffect.onAuthInit": ()=>{
                    authInitSeen = true;
                    checkReady();
                }
            }["KvHydrationGate.useEffect.onAuthInit"];
            const onCloudSync = {
                "KvHydrationGate.useEffect.onCloudSync": ()=>{
                    checkReady();
                }
            }["KvHydrationGate.useEffect.onCloudSync"];
            window.addEventListener("easybill:auth-sync-initialized", onAuthInit);
            window.addEventListener("easybill:cloud-sync", onCloudSync);
            let attempts = 0;
            const intervalId = window.setInterval({
                "KvHydrationGate.useEffect.intervalId": ()=>{
                    attempts++;
                    checkReady();
                    // Safety: don't block the whole app if auth init event is missed.
                    if (attempts >= 20) {
                        authInitSeen = true;
                        checkReady();
                        window.clearInterval(intervalId);
                    }
                }
            }["KvHydrationGate.useEffect.intervalId"], 150);
            return ({
                "KvHydrationGate.useEffect": ()=>{
                    window.removeEventListener("easybill:auth-sync-initialized", onAuthInit);
                    window.removeEventListener("easybill:cloud-sync", onCloudSync);
                    window.clearInterval(intervalId);
                }
            })["KvHydrationGate.useEffect"];
        }
    }["KvHydrationGate.useEffect"], []);
    if (!ready) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-[linear-gradient(155deg,#eef2fb_0%,#e4eaf7_28%,#eef1fb_55%,#e2e8f8_100%)]",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-10 lg:py-12",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                        className: "h-9 w-44 rounded-lg"
                    }, void 0, false, {
                        fileName: "[project]/components/providers/KvHydrationGate.tsx",
                        lineNumber: 93,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                        className: "h-[min(52vh,420px)] w-full rounded-2xl lg:rounded-3xl"
                    }, void 0, false, {
                        fileName: "[project]/components/providers/KvHydrationGate.tsx",
                        lineNumber: 94,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-2 sm:flex-row sm:gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                className: "h-10 flex-1 rounded-xl sm:max-w-xs"
                            }, void 0, false, {
                                fileName: "[project]/components/providers/KvHydrationGate.tsx",
                                lineNumber: 96,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                className: "h-10 flex-1 rounded-xl sm:max-w-[200px]"
                            }, void 0, false, {
                                fileName: "[project]/components/providers/KvHydrationGate.tsx",
                                lineNumber: 97,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/providers/KvHydrationGate.tsx",
                        lineNumber: 95,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/providers/KvHydrationGate.tsx",
                lineNumber: 92,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/providers/KvHydrationGate.tsx",
            lineNumber: 91,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(KvHydrationGate, "gTbQJCOSY9R2qZ/+DXCBl1DanzY=");
_c = KvHydrationGate;
var _c;
__turbopack_context__.k.register(_c, "KvHydrationGate");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_6b0eec8f._.js.map