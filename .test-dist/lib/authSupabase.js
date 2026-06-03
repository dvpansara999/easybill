"use client";
import { createSupabaseBrowserClient, getSupabaseUser } from "@/lib/supabase/browser";
import { clearUserWorkspaceLocalState } from "@/lib/userStore";
const AUTH_ACTIVE_USER_ID_KEY = "authActiveUserId"; // sessionStorage (tab)
const AUTH_LAST_USER_ID_KEY = "authLastUserId"; // localStorage (restore)
const AUTH_LAST_EMAIL_KEY = "authLastEmail";
function isValidSupabaseUserId(userId) {
    return Boolean(userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId));
}
function getSignupErrorMessage(error) {
    const rawMessage = (error.message || "").trim();
    const msg = rawMessage.toLowerCase();
    if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
        return "User already exists.";
    }
    if (msg.includes("signup") && msg.includes("disabled")) {
        return "Email signups are disabled in Supabase Auth settings.";
    }
    if (msg.includes("invalid email")) {
        return "Enter a valid email address.";
    }
    if (msg.includes("password")) {
        return rawMessage || "Password does not meet the Supabase Auth requirements.";
    }
    if (msg.includes("confirmation email") || msg.includes("sending email") || msg.includes("send email")) {
        return "Supabase could not send the confirmation email. Configure Auth SMTP/email settings, or disable email confirmations for local testing.";
    }
    if (msg.includes("rate limit") || msg.includes("security purposes") || error.status === 429) {
        return rawMessage || "Too many signup attempts. Please wait and try again.";
    }
    if (msg.includes("database error") || msg.includes("saving new user")) {
        return "Supabase could not create the auth user. Check database triggers/functions on the fresh project.";
    }
    return rawMessage || "Unable to create account. Check Supabase Auth settings and try again.";
}
function readSessionActiveUserId() {
    try {
        const raw = window.sessionStorage.getItem(AUTH_ACTIVE_USER_ID_KEY);
        const userId = raw?.trim() ? raw.trim() : null;
        if (!userId)
            return null;
        if (isValidSupabaseUserId(userId))
            return userId;
        window.sessionStorage.removeItem(AUTH_ACTIVE_USER_ID_KEY);
        return null;
    }
    catch {
        return null;
    }
}
function writeSessionActiveUserId(userId) {
    try {
        if (!userId)
            window.sessionStorage.removeItem(AUTH_ACTIVE_USER_ID_KEY);
        else
            window.sessionStorage.setItem(AUTH_ACTIVE_USER_ID_KEY, userId);
    }
    catch {
        // ignore
    }
}
export function getActiveUserId() {
    const sessionId = readSessionActiveUserId();
    if (sessionId)
        return sessionId;
    return restoreLastSessionIfNeeded();
}
export function setActiveUserId(userId) {
    const safeUserId = isValidSupabaseUserId(userId) ? userId : null;
    writeSessionActiveUserId(safeUserId);
    try {
        if (!safeUserId)
            localStorage.removeItem(AUTH_LAST_USER_ID_KEY);
        else
            localStorage.setItem(AUTH_LAST_USER_ID_KEY, safeUserId);
    }
    catch {
        // ignore
    }
}
export function getLastUserId() {
    try {
        const raw = localStorage.getItem(AUTH_LAST_USER_ID_KEY);
        const userId = raw?.trim() ? raw.trim() : null;
        if (!userId)
            return null;
        if (isValidSupabaseUserId(userId))
            return userId;
        localStorage.removeItem(AUTH_LAST_USER_ID_KEY);
        return null;
    }
    catch {
        return null;
    }
}
function getLastEmail() {
    try {
        return localStorage.getItem(AUTH_LAST_EMAIL_KEY) || "";
    }
    catch {
        return "";
    }
}
function setLastEmail(email) {
    try {
        if (!email)
            localStorage.removeItem(AUTH_LAST_EMAIL_KEY);
        else
            localStorage.setItem(AUTH_LAST_EMAIL_KEY, email.trim());
    }
    catch {
        // ignore
    }
}
export function restoreLastSessionIfNeeded() {
    const sessionId = readSessionActiveUserId();
    if (sessionId)
        return sessionId;
    const last = getLastUserId();
    if (!last)
        return null;
    writeSessionActiveUserId(last);
    return last;
}
export function getActiveAuthRecord() {
    const activeId = getActiveUserId();
    if (!activeId)
        return null;
    return { userId: activeId, email: getLastEmail() };
}
export async function signUp(email, password) {
    try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            return { record: null, error: getSignupErrorMessage(error) };
        }
        const user = data.user;
        if (!user)
            return { record: null, error: "Unable to create account." };
        // Important for email-confirm flows:
        // `signUp()` can return a user even when the account is not yet confirmed,
        // but Supabase may not have an authenticated session at this moment.
        // If we setActiveUserId() now, our KV writes will hit RLS with `auth.uid() = null`.
        // So we only set active userId when a session actually exists.
        const { data: me } = await getSupabaseUser();
        // If user is not yet confirmed, Supabase often doesn't create a session.
        // Keep active userId unset so setup continues in local (no RLS writes).
        setActiveUserId(me.user?.id ?? null);
        setLastEmail(user.email || email.trim());
        return { record: { userId: user.id, email: user.email || email.trim() }, error: "" };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("NEXT_PUBLIC_SUPABASE_URL") || message.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
            return { record: null, error: "Missing Supabase browser environment variables." };
        }
        return { record: null, error: "Unable to reach Supabase Auth. Check connection and try again." };
    }
}
export async function signIn(email, password) {
    try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });
        if (error)
            return { record: null, error: "Incorrect email or password." };
        const user = data.user;
        if (!user)
            return { record: null, error: "Unable to sign in." };
        setActiveUserId(user.id);
        setLastEmail(user.email || email.trim());
        return { record: { userId: user.id, email: user.email || email.trim() }, error: "" };
    }
    catch {
        return { record: null, error: "Unable to reach server. Check internet and try again." };
    }
}
export async function signInWithOtp(email, opts) {
    try {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
                shouldCreateUser: opts?.shouldCreateUser ?? true,
            },
        });
        if (error) {
            const msg = (error.message || "").toLowerCase();
            if ((opts?.shouldCreateUser ?? true) === false && (msg.includes("not found") || msg.includes("invalid login"))) {
                return { error: "User not found." };
            }
            return { error: error.message };
        }
        return { error: "" };
    }
    catch {
        return { error: "Unable to reach server. Check internet and try again." };
    }
}
export async function verifyEmailOtp(email, token, type) {
    try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: token.trim(),
            type,
        });
        if (error || !data.user) {
            return { error: error?.message || "OTP verification failed." };
        }
        setActiveUserId(data.user.id);
        setLastEmail(data.user.email || email.trim());
        return { error: "" };
    }
    catch {
        return { error: "Unable to reach server. Check internet and try again." };
    }
}
export async function signInWithProvider(provider) {
    try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error)
            return { url: "", error: error.message };
        return { url: data.url || "", error: "" };
    }
    catch {
        return { url: "", error: "Unable to reach server. Check internet and try again." };
    }
}
export async function updatePasswordAfterOtp(newPassword) {
    try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.updateUser({ password: newPassword });
        if (error || !data.user) {
            return { record: null, error: error?.message || "Unable to update password." };
        }
        setActiveUserId(data.user.id);
        setLastEmail(data.user.email || "");
        return { record: { userId: data.user.id, email: data.user.email || "" }, error: "" };
    }
    catch {
        return { record: null, error: "Error occurred, try again." };
    }
}
export async function requestEmailChangeOtp(params) {
    try {
        const supabase = createSupabaseBrowserClient();
        const { data: me } = await getSupabaseUser();
        const currentEmail = me.user?.email || "";
        if (!currentEmail) {
            return { error: "Account not found." };
        }
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: currentEmail,
            password: params.currentPassword,
        });
        if (authError || !authData.user) {
            return { error: "Wrong password." };
        }
        const { error } = await supabase.auth.updateUser({ email: params.newEmail.trim() });
        if (error) {
            const msg = (error.message || "").toLowerCase();
            if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
                return { error: "User already exists." };
            }
            return { error: error.message || "Error occurred, try again." };
        }
        return { error: "" };
    }
    catch {
        return { error: "Error occurred, try again." };
    }
}
export async function verifyEmailChangeOtp(newEmail, token) {
    try {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.verifyOtp({
            email: newEmail.trim(),
            token: token.trim(),
            type: "email_change",
        });
        if (error) {
            return { record: null, error: error.message || "OTP verification failed." };
        }
        const { data: me } = await getSupabaseUser();
        const user = me.user;
        if (!user) {
            return { record: null, error: "Unable to verify OTP right now. Please sign in again." };
        }
        const effectiveEmail = (user.email || "").trim();
        if (effectiveEmail.toLowerCase() !== newEmail.trim().toLowerCase()) {
            return {
                record: null,
                error: "Email change is still pending confirmation. Please complete all confirmation steps from your email.",
            };
        }
        setActiveUserId(user.id);
        setLastEmail(effectiveEmail || null);
        return { record: { userId: user.id, email: effectiveEmail }, error: "" };
    }
    catch {
        return { record: null, error: "Error occurred, try again." };
    }
}
export async function signOut() {
    const activeUserId = getActiveUserId();
    try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
    }
    finally {
        if (activeUserId) {
            clearUserWorkspaceLocalState(activeUserId);
        }
        setActiveUserId(null);
        setLastEmail(null);
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("easybill:cloud-sync"));
        }
    }
}
export async function updateCredentials(params) {
    try {
        const supabase = createSupabaseBrowserClient();
        const { data: me } = await getSupabaseUser();
        const email = me.user?.email || "";
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: params.currentPassword,
        });
        if (authError || !authData.user) {
            return { record: null, error: "Current password is incorrect." };
        }
        const updates = {};
        if (params.newEmail && params.newEmail.trim())
            updates.email = params.newEmail.trim();
        if (params.newPassword)
            updates.password = params.newPassword;
        const { data, error } = await supabase.auth.updateUser(updates);
        if (error || !data.user) {
            return { record: null, error: error?.message || "Unable to update credentials." };
        }
        setActiveUserId(data.user.id);
        setLastEmail(data.user.email || "");
        return { record: { userId: data.user.id, email: data.user.email || "" }, error: "" };
    }
    catch {
        return { record: null, error: "Unable to reach server. Check internet and try again." };
    }
}
