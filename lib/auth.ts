// @ts-nocheck
import { getAuthMode } from "@/lib/runtimeMode"
import * as local from "@/lib/authLocal"
import * as supabase from "@/lib/authSupabase"

export type AuthRecord = supabase.AuthRecord
type AuthModule = {
  getActiveUserId: typeof local.getActiveUserId
  setActiveUserId: typeof local.setActiveUserId
  getLastUserId: typeof local.getLastUserId
  restoreLastSessionIfNeeded: typeof local.restoreLastSessionIfNeeded
  getActiveAuthRecord: typeof local.getActiveAuthRecord
  signUp: typeof local.signUp
  signIn: typeof local.signIn
  signInWithOtp: typeof local.signInWithOtp
  verifyEmailOtp: typeof supabase.verifyEmailOtp
  signInWithProvider: typeof local.signInWithProvider
  signOut: typeof local.signOut
  updateCredentials: typeof local.updateCredentials
  updatePasswordAfterOtp: typeof local.updatePasswordAfterOtp
  requestEmailChangeOtp: typeof local.requestEmailChangeOtp
  verifyEmailChangeOtp: typeof local.verifyEmailChangeOtp
}

function impl(): AuthModule {
  return getAuthMode() === "local" ? local : supabase
}

export function getActiveUserId() {
  return impl().getActiveUserId()
}

export function setActiveUserId(userId: string | null) {
  return impl().setActiveUserId(userId)
}

export function getLastUserId() {
  return impl().getLastUserId()
}

export function restoreLastSessionIfNeeded() {
  return impl().restoreLastSessionIfNeeded()
}

export function getActiveAuthRecord(): AuthRecord | null {
  return impl().getActiveAuthRecord()
}

export async function signUp(email: string, password: string) {
  return impl().signUp(email, password)
}

export async function signIn(email: string, password: string) {
  return impl().signIn(email, password)
}

export async function signInWithOtp(email: string, opts?: { shouldCreateUser?: boolean }) {
  return impl().signInWithOtp(email, opts)
}

export async function verifyEmailOtp(email: string, token: string, type: "signup" | "email") {
  return impl().verifyEmailOtp(email, token, type)
}

export async function signInWithProvider(provider: "google" | "apple") {
  return impl().signInWithProvider(provider)
}

export async function signOut() {
  return impl().signOut()
}

export async function updateCredentials(params: {
  userId: string
  currentPassword: string
  newEmail?: string
  newPassword?: string
}) {
  return impl().updateCredentials(params)
}

export async function updatePasswordAfterOtp(newPassword: string) {
  return impl().updatePasswordAfterOtp(newPassword)
}

export async function requestEmailChangeOtp(params: { currentPassword: string; newEmail: string }) {
  return impl().requestEmailChangeOtp(params)
}

export async function verifyEmailChangeOtp(newEmail: string, token: string) {
  return impl().verifyEmailChangeOtp(newEmail, token)
}
