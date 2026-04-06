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
  return normalizeWhitespace(String(value || "")).toUpperCase()
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

export function buildCustomerIdentity(invoice: Pick<InvoiceRecord, "clientPhone" | "clientGST" | "clientName" | "clientEmail" | "clientAddress">): CustomerIdentity {
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

export function matchesCustomerIdentity(
  invoice: Pick<InvoiceRecord, "clientPhone" | "clientGST" | "clientName" | "clientEmail" | "clientAddress">,
  identity: string
) {
  return buildCustomerIdentity(invoice).id === identity
}
