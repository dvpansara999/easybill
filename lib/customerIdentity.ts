import type { InvoiceRecord } from "@/lib/invoice"

export type CustomerIdentityKind = "phone" | "gst" | "legacy"

export type CustomerIdentity = {
  id: string
  kind: CustomerIdentityKind
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

export function normalizeCustomerPhone(value: string | null | undefined) {
  const raw = normalizeWhitespace(String(value || ""))
  if (!raw) return ""
  return raw.replace(/[^\d+()-\s]/g, "").replace(/\s+/g, " ").trim()
}

export function normalizeCustomerGstin(value: string | null | undefined) {
  return normalizeWhitespace(String(value || "")).toUpperCase().replace(/[^0-9A-Z]/g, "")
}

function normalizeLegacyValue(value: string | null | undefined) {
  return normalizeWhitespace(String(value || "")).toLowerCase()
}

function hashString(input: string) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

type CustomerIdentityInput = Pick<InvoiceRecord, "clientPhone" | "clientGST" | "clientName" | "clientEmail" | "clientAddress">

function buildPlainCustomerIdentity(invoice: CustomerIdentityInput): CustomerIdentity {
  const sealedIdentity = (invoice as Partial<InvoiceRecord>).customerIdentityKey
  if (typeof sealedIdentity === "string" && /^(phone|gst|legacy):/.test(sealedIdentity)) {
    return { id: sealedIdentity, kind: sealedIdentity.split(":", 1)[0] as CustomerIdentityKind }
  }

  return buildLegacyCustomerIdentity(invoice)
}

function buildLegacyCustomerIdentity(invoice: CustomerIdentityInput): CustomerIdentity {
  const phone = normalizeCustomerPhone(invoice.clientPhone)
  if (phone) {
    return { id: `phone:${phone}`, kind: "phone" }
  }

  const gstin = normalizeCustomerGstin(invoice.clientGST)
  if (gstin) {
    return { id: `gst:${gstin}`, kind: "gst" }
  }

  const legacySeed = JSON.stringify({
    name: normalizeLegacyValue(invoice.clientName),
    email: normalizeLegacyValue(invoice.clientEmail),
    address: normalizeLegacyValue(invoice.clientAddress),
  })

  return { id: `legacy:${hashString(legacySeed)}`, kind: "legacy" }
}

export function buildCustomerIdentity(invoice: CustomerIdentityInput): CustomerIdentity {
  return buildPlainCustomerIdentity(invoice)
}

export function matchesCustomerIdentity(
  invoice: CustomerIdentityInput,
  identity: string
) {
  return buildCustomerIdentity(invoice).id === identity || buildLegacyCustomerIdentity(invoice).id === identity
}
