import { normalizeBusinessProfile, readNormalizedBusinessProfileFromStorage } from "./businessProfile"
import { normalizeCustomerGstin, normalizeCustomerPhone } from "./customerIdentity"

export type CustomDetail = {
  label: string
  value: string
}

export type InvoiceItem = {
  product: string
  hsn: string
  qty: number
  unit: string
  price: number
  cgst: number
  sgst: number
  igst: number
  total: number
}

export type InvoiceStatus = "draft" | "issued" | "paid"

export type InvoiceHistoryEntry = {
  id: string
  type: "created" | "edited" | "exported" | "status" | "duplicated"
  label: string
  at: string
}

export type InvoiceRecord = {
  id: string
  invoiceNumber: string
  numberingModeAtCreation?: "continuous" | "financial-year-reset"
  resetMonthDayAtCreation?: string | null
  sequenceWindowStart?: string | null
  sequenceWindowEnd?: string | null
  clientName: string
  clientPhone: string
  clientEmail: string
  clientGST: string
  clientAddress: string
  date: string
  customDetails: CustomDetail[]
  items: InvoiceItem[]
  notes?: string
  status?: InvoiceStatus
  history?: InvoiceHistoryEntry[]
  grandTotal: number
}

export const INVOICE_SCHEMA_VERSION = 3

export type InvoiceStoreEnvelope = {
  schemaVersion: number
  invoices: InvoiceRecord[]
}

type InvoiceRecordInput = Partial<InvoiceRecord>
type UserStoreReader = {
  getActiveOrGlobalItem: (key: string) => string | null
  setActiveOrGlobalItem: (key: string, value: string) => void
}

function hashString(input: string) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function normalizeInvoiceId(id: unknown, invoice: InvoiceRecordInput, legacyIndex: number) {
  if (typeof id === "string" && id.trim()) return id.trim()

  const legacySeed = JSON.stringify({
    legacyIndex,
    invoiceNumber: invoice.invoiceNumber?.trim() || "",
    clientName: invoice.clientName?.trim() || "",
    clientPhone: invoice.clientPhone?.trim() || "",
    clientEmail: invoice.clientEmail?.trim() || "",
    clientGST: invoice.clientGST?.trim() || "",
    clientAddress: invoice.clientAddress?.trim() || "",
    date: invoice.date?.trim() || "",
    grandTotal: Number(invoice.grandTotal) || 0,
    customDetails: Array.isArray(invoice.customDetails) ? invoice.customDetails : [],
    items: Array.isArray(invoice.items) ? invoice.items : [],
  })

  return `inv_legacy_${hashString(legacySeed)}`
}

export function createInvoiceId() {
  const raw =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`

  return `inv_${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`
}

export function createInvoiceHistoryId() {
  return `invh_${hashString(`${Date.now()}_${Math.random().toString(36).slice(2, 10)}`)}`
}

export function createInvoiceHistoryEntry(
  type: InvoiceHistoryEntry["type"],
  label: string,
  at?: string
): InvoiceHistoryEntry {
  return {
    id: createInvoiceHistoryId(),
    type,
    label: label.trim(),
    at: at || new Date().toISOString(),
  }
}

export type BusinessRecord = {
  businessName: string
  address: string
  gst: string
  phone: string
  email: string
  bankName: string
  accountNumber: string
  ifsc: string
  upi: string
  terms: string
  logo: string
  logoShape: "square" | "round"
}

export function createEmptyInvoiceItem(): InvoiceItem {
  return {
    product: "",
    hsn: "",
    qty: 1,
    unit: "",
    price: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0,
  }
}

export function normalizeInvoiceItem(item: Partial<InvoiceItem>): InvoiceItem {
  const qty = Number(item.qty ?? 1)
  const price = Number(item.price ?? 0)
  const cgst = Number(item.cgst ?? 0)
  const sgst = Number(item.sgst ?? 0)
  const igst = Number(item.igst ?? 0)

  const base = qty * price
  const total = base + (base * cgst) / 100 + (base * sgst) / 100 + (base * igst) / 100

  return {
    product: item.product?.trim() || "",
    hsn: item.hsn?.trim() || "",
    qty,
    unit: item.unit?.trim() || "",
    price,
    cgst,
    sgst,
    igst,
    total,
  }
}

export function normalizeInvoiceRecord(invoice: InvoiceRecordInput, legacyIndex = 0): InvoiceRecord {
  const items = Array.isArray(invoice.items)
    ? invoice.items.map((item) => normalizeInvoiceItem(item))
    : []

  const grandTotal =
    Number(invoice.grandTotal) ||
    items.reduce((sum, item) => sum + Number(item.total || 0), 0)

  const status: InvoiceStatus =
    invoice.status === "paid" ? "paid" : invoice.status === "issued" ? "issued" : "draft"
  const notes = typeof invoice.notes === "string" ? invoice.notes.trim() : ""
  const history =
    Array.isArray(invoice.history) && invoice.history.length > 0
      ? invoice.history
          .map((entry) => {
            const parsed = typeof entry === "object" && entry !== null ? (entry as Partial<InvoiceHistoryEntry>) : {}
            return {
              id: typeof parsed.id === "string" && parsed.id.trim() ? parsed.id.trim() : createInvoiceHistoryId(),
              type:
                parsed.type === "edited" ||
                parsed.type === "exported" ||
                parsed.type === "status" ||
                parsed.type === "duplicated"
                  ? parsed.type
                  : "created",
              label: typeof parsed.label === "string" && parsed.label.trim() ? parsed.label.trim() : "Invoice updated",
              at: typeof parsed.at === "string" && parsed.at.trim() ? parsed.at.trim() : new Date().toISOString(),
            } satisfies InvoiceHistoryEntry
          })
      : [createInvoiceHistoryEntry("created", "Invoice created", invoice.date?.trim() || undefined)]

  return {
    id: normalizeInvoiceId(invoice.id, invoice, legacyIndex),
    invoiceNumber: invoice.invoiceNumber?.trim() || "",
    numberingModeAtCreation:
      invoice.numberingModeAtCreation === "financial-year-reset" ? "financial-year-reset" : "continuous",
    resetMonthDayAtCreation:
      typeof invoice.resetMonthDayAtCreation === "string" && invoice.resetMonthDayAtCreation.trim()
        ? invoice.resetMonthDayAtCreation.trim()
        : null,
    sequenceWindowStart:
      typeof invoice.sequenceWindowStart === "string" && invoice.sequenceWindowStart.trim()
        ? invoice.sequenceWindowStart.trim()
        : null,
    sequenceWindowEnd:
      typeof invoice.sequenceWindowEnd === "string" && invoice.sequenceWindowEnd.trim()
        ? invoice.sequenceWindowEnd.trim()
        : null,
    clientName: invoice.clientName?.trim() || "",
    clientPhone: invoice.clientPhone?.trim() || "",
    clientEmail: invoice.clientEmail?.trim() || "",
    clientGST: invoice.clientGST?.trim() || "",
    clientAddress: invoice.clientAddress?.trim() || "",
    date: invoice.date?.trim() || "",
    customDetails: Array.isArray(invoice.customDetails)
      ? invoice.customDetails
          .map((detail) => ({
            label: detail.label?.trim() || "",
            value: detail.value?.trim() || "",
          }))
          .filter((detail) => detail.label || detail.value)
      : [],
    items,
    notes,
    status,
    history,
    grandTotal,
  }
}

export function normalizeInvoiceRecords(invoices: unknown) {
  if (!Array.isArray(invoices)) {
    return { invoices: [] as InvoiceRecord[], changed: false }
  }

  let changed = false
  const normalized = invoices.map((invoice, index) => {
    const raw = typeof invoice === "object" && invoice !== null ? (invoice as InvoiceRecordInput) : {}
    const next = normalizeInvoiceRecord(raw, index)
    if (!raw.id || raw.id !== next.id) {
      changed = true
    }
    return next
  })

  return { invoices: normalized, changed }
}

function isInvoiceStoreEnvelope(value: unknown): value is { schemaVersion?: unknown; invoices?: unknown } {
  return typeof value === "object" && value !== null && "invoices" in value
}

export function normalizeInvoiceStorePayload(payload: unknown) {
  let changed = false
  let schemaVersion = INVOICE_SCHEMA_VERSION
  let invoicePayload: unknown = payload

  if (Array.isArray(payload)) {
    schemaVersion = 1
    changed = true
  } else if (isInvoiceStoreEnvelope(payload)) {
    schemaVersion =
      typeof payload.schemaVersion === "number" && Number.isFinite(payload.schemaVersion)
        ? Math.trunc(payload.schemaVersion)
        : 1
    invoicePayload = payload.invoices
    if (schemaVersion !== INVOICE_SCHEMA_VERSION) {
      changed = true
    }
  } else {
    invoicePayload = []
  }

  const normalizedRecords = normalizeInvoiceRecords(invoicePayload)
  changed = changed || normalizedRecords.changed

  return {
    store: {
      schemaVersion: INVOICE_SCHEMA_VERSION,
      invoices: normalizedRecords.invoices,
    } satisfies InvoiceStoreEnvelope,
    changed,
  }
}

export function serializeInvoiceStore(invoices: InvoiceRecord[]) {
  const normalized = normalizeInvoiceStorePayload({ schemaVersion: INVOICE_SCHEMA_VERSION, invoices })
  return JSON.stringify(normalized.store)
}

export function findInvoiceById(invoices: InvoiceRecord[], invoiceId: string) {
  return invoices.find((invoice) => invoice.id === invoiceId) ?? null
}

export function appendInvoiceHistory(
  invoice: InvoiceRecord,
  entry: InvoiceHistoryEntry
) {
  return normalizeInvoiceRecord({
    ...invoice,
    history: [...(invoice.history || []), entry],
  })
}

export function updateInvoiceStatus(
  invoice: InvoiceRecord,
  status: InvoiceStatus,
  label?: string
) {
  if (invoice.status === status) return invoice
  return normalizeInvoiceRecord({
    ...invoice,
    status,
    history: [
      ...(invoice.history || []),
      createInvoiceHistoryEntry("status", label || `Status changed to ${status}`),
    ],
  })
}

export function findInvoiceByIdentity(invoices: InvoiceRecord[], value: string) {
  // Legacy fallback only. New routes and features should resolve invoices by `invoice.id`.
  return (
    invoices.find((invoice) => invoice.id === value) ??
    invoices.find((invoice) => invoice.invoiceNumber === value) ??
    null
  )
}

export function readStoredInvoices() {
  if (typeof window === "undefined") return [] as InvoiceRecord[]

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getActiveOrGlobalItem, setActiveOrGlobalItem } = require("@/lib/userStore") as UserStoreReader
  const raw = getActiveOrGlobalItem("invoices")
  if (!raw) return [] as InvoiceRecord[]

  try {
    const parsed = JSON.parse(raw) as unknown
    const { store, changed } = normalizeInvoiceStorePayload(parsed)
    if (changed) {
      setActiveOrGlobalItem("invoices", JSON.stringify(store))
    }
    return store.invoices
  } catch {
    return [] as InvoiceRecord[]
  }
}

export function writeStoredInvoices(invoices: InvoiceRecord[]) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { setActiveOrGlobalItem } = require("@/lib/userStore") as Pick<UserStoreReader, "setActiveOrGlobalItem">
  setActiveOrGlobalItem("invoices", serializeInvoiceStore(invoices))
}

export function getStoredBusinessRecord(): BusinessRecord | null {
  if (typeof window === "undefined") {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getActiveOrGlobalItem } = require("@/lib/userStore") as Pick<UserStoreReader, "getActiveOrGlobalItem">
  const stored = getActiveOrGlobalItem("businessProfile")
  if (!stored) {
    // No authenticated Supabase session (e.g. edge flows): `userStore` blocks global keys.
    // Allow reading seeded `localStorage.businessProfile` when present.
    // So we fall back to localStorage directly when the KV/global read is null.
    try {
      const fallback = readNormalizedBusinessProfileFromStorage()
      return fallback.businessName || fallback.address || fallback.phone || fallback.email || fallback.logo ? fallback : null
    } catch {
      return null
    }
  }

  return normalizeBusinessProfile(JSON.parse(stored))
}

export function validateBusinessRecord(business: BusinessRecord | null) {
  if (!business) {
    return "Please save your business profile first."
  }

  if (!business.businessName) {
    return "Business name is required in Business Profile."
  }

  if (!business.address) {
    return "Business address is required in Business Profile."
  }

  if (!business.phone && !business.email) {
    return "Add at least a business phone or email in Business Profile."
  }

  return null
}

export function validateInvoiceRecord(invoice: InvoiceRecord) {
  if (!invoice.invoiceNumber) {
    return "Invoice number is required."
  }

  if (!invoice.date) {
    return "Invoice date is required."
  }

  if (!invoice.clientName) {
    return "Client name is required."
  }

  const hasPhone = Boolean(normalizeCustomerPhone(invoice.clientPhone))
  const hasGstin = Boolean(normalizeCustomerGstin(invoice.clientGST))
  if (!hasPhone && !hasGstin) {
    return "Add either phone number or GSTIN for this customer."
  }

  if (invoice.items.length === 0) {
    return "Add at least one invoice item."
  }

  const hasInvalidItem = invoice.items.some(
    (item) => !item.product || item.qty <= 0 || item.price <= 0
  )

  if (hasInvalidItem) {
    return "Each invoice item needs a product name, quantity, and price greater than 0."
  }

  return null
}
