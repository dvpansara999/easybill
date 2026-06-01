import "server-only"

import crypto from "node:crypto"

export type SensitiveLookupKind = "phone" | "gst" | "upi" | "email" | "legacy"

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

export function normalizeSensitiveLookup(value: string | null | undefined, kind: SensitiveLookupKind) {
  const raw = normalizeWhitespace(String(value || ""))
  if (!raw) return ""

  switch (kind) {
    case "phone":
      return raw.replace(/[^\d+]/g, "")
    case "gst":
      return raw.toUpperCase()
    case "upi":
    case "email":
      return raw.toLowerCase()
    case "legacy":
      return raw.toLowerCase()
    default:
      return raw
  }
}

function hashKeyBytes() {
  const configured = process.env.SERVER_DATA_HASH_KEY
  if (configured) return Buffer.from(configured, "utf8")

  const encryptionKey = process.env.SERVER_DATA_ENCRYPTION_KEY
  if (!encryptionKey) {
    throw new Error("Missing SERVER_DATA_HASH_KEY or SERVER_DATA_ENCRYPTION_KEY")
  }

  return Buffer.from(crypto.hkdfSync(
    "sha256",
    Buffer.from(encryptionKey, "utf8"),
    Buffer.from("easybill-sensitive-lookup-salt", "utf8"),
    Buffer.from("easybill-sensitive-lookup-v1", "utf8"),
    32
  ))
}

export function createLookupHash(value: string | null | undefined, purpose: SensitiveLookupKind) {
  const normalized = normalizeSensitiveLookup(value, purpose)
  if (!normalized) return ""

  return crypto
    .createHmac("sha256", hashKeyBytes())
    .update(`easybill:${purpose}:v1:${normalized}`)
    .digest("base64url")
}

export function createCustomerIdentityKey(input: {
  phone?: string | null
  gst?: string | null
  name?: string | null
  email?: string | null
  address?: string | null
}) {
  const phoneHash = createLookupHash(input.phone, "phone")
  if (phoneHash) return `phone:${phoneHash}`

  const gstHash = createLookupHash(input.gst, "gst")
  if (gstHash) return `gst:${gstHash}`

  const legacySeed = JSON.stringify({
    name: normalizeSensitiveLookup(input.name, "legacy"),
    email: normalizeSensitiveLookup(input.email, "email"),
    address: normalizeSensitiveLookup(input.address, "legacy"),
  })
  const legacyHash = createLookupHash(legacySeed, "legacy")
  return legacyHash ? `legacy:${legacyHash}` : ""
}
