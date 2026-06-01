import "server-only"

import crypto from "node:crypto"
import CryptoJS from "crypto-js"

const SEALED_PREFIX = "sealed:v1:"
const LEGACY_PREFIX = "enc:v1:"
const LEGACY_SECRET = "easybill-default-sensitive-data-key-v1"

function keyBytes() {
  const secret = process.env.SERVER_DATA_ENCRYPTION_KEY
  if (!secret) {
    throw new Error("Missing SERVER_DATA_ENCRYPTION_KEY")
  }
  return crypto.createHash("sha256").update(secret).digest()
}

export function sealSensitiveString(value: string) {
  if (!value || value.startsWith(SEALED_PREFIX)) return value
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBytes(), iv)
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${SEALED_PREFIX}${Buffer.concat([iv, tag, ciphertext]).toString("base64url")}`
}

export function openSensitiveString(value: string) {
  if (!value) return value
  if (value.startsWith(SEALED_PREFIX)) {
    const payload = Buffer.from(value.slice(SEALED_PREFIX.length), "base64url")
    const iv = payload.subarray(0, 12)
    const tag = payload.subarray(12, 28)
    const ciphertext = payload.subarray(28)
    const decipher = crypto.createDecipheriv("aes-256-gcm", keyBytes(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
  }
  if (value.startsWith(LEGACY_PREFIX)) {
    const cipher = value.slice(LEGACY_PREFIX.length)
    const bytes = CryptoJS.AES.decrypt(cipher, LEGACY_SECRET)
    return bytes.toString(CryptoJS.enc.Utf8) || value
  }
  return value
}

export function sealSensitiveFields<T extends Record<string, unknown>>(row: T, keys: string[]) {
  const next: Record<string, unknown> = { ...row }
  for (const key of keys) {
    const value = next[key]
    if (typeof value === "string") next[key] = sealSensitiveString(value)
  }
  return next as T
}

export function openSensitiveFields<T extends Record<string, unknown>>(row: T, keys: string[]) {
  const next: Record<string, unknown> = { ...row }
  for (const key of keys) {
    const value = next[key]
    if (typeof value === "string") next[key] = openSensitiveString(value)
  }
  return next as T
}
