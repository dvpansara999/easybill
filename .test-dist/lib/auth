import { getAuthMode } from "@/lib/runtimeMode";
import * as local from "@/lib/authLocal";
import * as supabase from "@/lib/authSupabase";
function impl() {
    return getAuthMode() === "local" ? local : supabase;
}
export function getActiveUserId() {
    return impl().getActiveUserId();
}
export function setActiveUserId(userId) {
    return impl().setActiveUserId(userId);
}
export function getLastUserId() {
    return impl().getLastUserId();
}
export function restoreLastSessionIfNeeded() {
    return impl().restoreLastSessionIfNeeded();
}
export function getActiveAuthRecord() {
    return impl().getActiveAuthRecord();
}
export async function signUp(email, password) {
    return impl().signUp(email, password);
}
export async function signIn(email, password) {
    return impl().signIn(email, password);
}
export async function signInWithOtp(email, opts) {
    return impl().signInWithOtp(email, opts);
}
export async function verifyEmailOtp(email, token, type) {
    return impl().verifyEmailOtp(email, token, type);
}
export async function signInWithProvider(provider) {
    return impl().signInWithProvider(provider);
}
export async function signOut() {
    return impl().signOut();
}
export async function updateCredentials(params) {
    return impl().updateCredentials(params);
}
export async function updatePasswordAfterOtp(newPassword) {
    return impl().updatePasswordAfterOtp(newPassword);
}
export async function requestEmailChangeOtp(params) {
    return impl().requestEmailChangeOtp(params);
}
export async function verifyEmailChangeOtp(newEmail, token) {
    return impl().verifyEmailChangeOtp(newEmail, token);
}
