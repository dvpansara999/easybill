"use client"

export type AuthRecord = {
  userId: string
  email: string
  salt: string
  hash: string
}

type PublicAuthRecord = {
  userId: string
  email: string
}

type AuthResult = {
  record: PublicAuthRecord | null
  error: string
}

const AUTH_ACCOUNTS_KEY = "authAccounts:v2"
const AUTH_ACTIVE_USER_ID_KEY = "authActiveUserId" // sessionStorage
const AUTH_LAST_USER_ID_KEY = "authLastUserId" // localStorage

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function utf8Bytes(input: string) {
  return new TextEncoder().encode(input)
}

function randomSaltHex(byteLen = 16) {
  const bytes = new Uint8Array(byteLen)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", utf8Bytes(input))
  return bytesToHex(new Uint8Array(digest))
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function generateUserId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const hex = bytesToHex(bytes)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function readAccounts(): AuthRecord[] {
  const raw = localStorage.getItem(AUTH_ACCOUNTS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as AuthRecord[]
  } catch {
    return []
  }
}

function writeAccounts(accounts: AuthRecord[]) {
  localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(accounts))
}

function readSessionActiveUserId(): string | null {
  try {
    const raw = window.sessionStorage.getItem(AUTH_ACTIVE_USER_ID_KEY)
    return raw?.trim() ? raw.trim() : null
  } catch {
    return null
  }
}

function writeSessionActiveUserId(userId: string | null) {
  try {
    if (!userId) window.sessionStorage.removeItem(AUTH_ACTIVE_USER_ID_KEY)
    else window.sessionStorage.setItem(AUTH_ACTIVE_USER_ID_KEY, userId)
  } catch {
    // ignore
  }
}

export function getActiveUserId(): string | null {
  return readSessionActiveUserId() || getLastUserId()
}

export function setActiveUserId(userId: string | null) {
  writeSessionActiveUserId(userId)
  try {
    if (!userId) localStorage.removeItem(AUTH_LAST_USER_ID_KEY)
    else localStorage.setItem(AUTH_LAST_USER_ID_KEY, userId)
  } catch {
    // ignore
  }
}

export function getLastUserId(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_LAST_USER_ID_KEY)
    return raw?.trim() ? raw.trim() : null
  } catch {
    return null
  }
}

export function restoreLastSessionIfNeeded() {
  const sessionId = readSessionActiveUserId()
  if (sessionId) return sessionId
  const last = getLastUserId()
  if (!last) return null
  writeSessionActiveUserId(last)
  return last
}

export function getActiveAuthRecord(): { userId: string; email: string } | null {
  const active = getActiveUserId()
  if (!active) return null
  const rec = readAccounts().find((a) => a.userId === active)
  return rec ? { userId: rec.userId, email: rec.email } : { userId: active, email: "" }
}

async function createAuthRecord(email: string, password: string, userId?: string): Promise<AuthRecord> {
  const salt = randomSaltHex(16)
  const hash = await sha256Hex(`${salt}:${password}`)
  return { userId: userId || generateUserId(), email, salt, hash }
}

async function verifyPassword(record: AuthRecord, password: string) {
  const hash = await sha256Hex(`${record.salt}:${password}`)
  return hash === record.hash
}

export async function signUp(email: string, password: string) {
  const accounts = readAccounts()
  const emailNorm = normalizeEmail(email)
  if (accounts.some((a) => normalizeEmail(a.email) === emailNorm)) {
    return { record: null, error: "An account with this email already exists." } satisfies AuthResult
  }
  const rec = await createAuthRecord(email.trim(), password)
  writeAccounts([...accounts, rec])
  setActiveUserId(rec.userId)
  return { record: { userId: rec.userId, email: rec.email }, error: "" } satisfies AuthResult
}

export async function signIn(email: string, password: string) {
  const accounts = readAccounts()
  const emailNorm = normalizeEmail(email)
  const rec = accounts.find((a) => normalizeEmail(a.email) === emailNorm)
  if (!rec) return { record: null, error: "Incorrect email or password." } satisfies AuthResult
  const ok = await verifyPassword(rec, password)
  if (!ok) return { record: null, error: "Incorrect email or password." } satisfies AuthResult
  setActiveUserId(rec.userId)
  return { record: { userId: rec.userId, email: rec.email }, error: "" } satisfies AuthResult
}

export async function signInWithOtp(email: string, options?: { shouldCreateUser?: boolean }) {
  void email
  void options
  return { error: "OTP sign-in is not available in localStorage safety mode." }
}

export async function verifyEmailOtp(email: string, token: string) {
  void email
  void token
  return { error: "OTP verification is not available in localStorage safety mode." }
}

export async function signInWithProvider(provider: "google" | "apple") {
  void provider
  return { url: "", error: "OAuth sign-in is not available in localStorage safety mode." }
}

export async function signOut() {
  setActiveUserId(null)
}

export async function updatePasswordAfterOtp(password: string) {
  void password
  return { record: null, error: "OTP password update is not available in localStorage safety mode." } satisfies AuthResult
}

export async function requestEmailChangeOtp(payload: { currentPassword: string; newEmail: string }) {
  void payload
  return { error: "OTP email change is not available in localStorage safety mode." }
}

export async function verifyEmailChangeOtp(email: string, code: string) {
  void email
  void code
  return { record: null, error: "OTP email change is not available in localStorage safety mode." } satisfies AuthResult
}

export async function updateCredentials(params: {
  userId: string
  currentPassword: string
  newEmail?: string
  newPassword?: string
}) {
  const accounts = readAccounts()
  const existing = accounts.find((a) => a.userId === params.userId)
  if (!existing) return { record: null, error: "Account not found." } satisfies AuthResult

  const ok = await verifyPassword(existing, params.currentPassword)
  if (!ok) return { record: null, error: "Current password is incorrect." } satisfies AuthResult

  const nextEmail = params.newEmail?.trim() ? params.newEmail.trim() : existing.email
  const emailNorm = normalizeEmail(nextEmail)
  const collision = accounts.find((a) => a.userId !== existing.userId && normalizeEmail(a.email) === emailNorm)
  if (collision) return { record: null, error: "That email is already used by another account." } satisfies AuthResult

  const nextPassword = params.newPassword ? params.newPassword : params.currentPassword
  const nextRecord = await createAuthRecord(nextEmail, nextPassword, existing.userId)
  writeAccounts(accounts.map((a) => (a.userId === existing.userId ? nextRecord : a)))
  setActiveUserId(existing.userId)
  return { record: { userId: nextRecord.userId, email: nextRecord.email }, error: "" } satisfies AuthResult
}
