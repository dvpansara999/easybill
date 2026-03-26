import assert from "node:assert/strict"
import {
  INVOICE_SCHEMA_VERSION,
  normalizeInvoiceStorePayload,
} from "../lib/invoice.js"
import {
  generateInvoiceNumber,
  getFirstRepeatedInvoiceNumberWarning,
  getInvoiceNumberingMetadata,
} from "../lib/invoiceNumber.js"
import { getInvoicePrefixError } from "../lib/invoicePrefixValidation.js"
import { buildLogoStoragePath, getOwnedLogoStoragePath } from "../lib/logoStorage.js"
import {
  extractFingerprintFromStoragePath,
  filterDuplicateInvoiceExportRows,
  findMatchingCachedInvoiceExport,
  filterStaleInvoiceExportRows,
} from "../lib/server/invoicePdfExportCache.js"

function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    invoiceNumber: "DOC-001",
    clientName: "Raj",
    clientPhone: "9999999999",
    clientEmail: "raj@example.com",
    clientGST: "",
    clientAddress: "Vadodara",
    date: "2026-02-01",
    customDetails: [],
    items: [
      {
        product: "Service",
        hsn: "9983",
        qty: 1,
        unit: "pcs",
        price: 100,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 100,
      },
    ],
    grandTotal: 100,
    ...overrides,
  }
}

function runCase(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

runCase("invoice store migrates legacy arrays into a versioned envelope and assigns stable ids", () => {
  const legacyPayload = [
    makeInvoice({ invoiceNumber: "DOC-001", date: "2026-02-02" }),
    makeInvoice({ invoiceNumber: "DOC-001", date: "2026-03-02" }),
  ]

  const normalized = normalizeInvoiceStorePayload(legacyPayload)

  assert.equal(normalized.store.schemaVersion, INVOICE_SCHEMA_VERSION)
  assert.equal(normalized.changed, true)
  assert.equal(normalized.store.invoices.length, 2)
  assert.notEqual(normalized.store.invoices[0]?.id, normalized.store.invoices[1]?.id)
})

runCase("invoice store keeps existing ids stable for edited invoices under the current schema", () => {
  const currentPayload = {
    schemaVersion: INVOICE_SCHEMA_VERSION,
    invoices: [makeInvoice({ id: "inv_fixed_1", clientName: "Edited Name" })],
  }

  const normalized = normalizeInvoiceStorePayload(currentPayload)

  assert.equal(normalized.changed, false)
  assert.equal(normalized.store.invoices[0]?.id, "inv_fixed_1")
  assert.equal(normalized.store.invoices[0]?.clientName, "Edited Name")
})

runCase("continuous numbering only counts invoices that match the current prefix", () => {
  const next = generateInvoiceNumber(
    [
      { invoiceNumber: "INV-999", date: "2026-02-01" },
      { invoiceNumber: "DOC-007", date: "2026-02-02" },
      { invoiceNumber: "DOC-010", date: "2026-02-03" },
    ],
    "DOC-",
    3,
    1,
    false
  )

  assert.equal(next, "DOC-011")
})

runCase("financial-year resets use the invoice date instead of the current day", () => {
  const invoices = [
    { invoiceNumber: "DOC-007", date: "2026-02-20" },
    { invoiceNumber: "DOC-001", date: "2026-03-05" },
  ]

  const februaryBackdated = generateInvoiceNumber(invoices, "DOC-", 3, 1, true, "03-01", "2026-02-25")
  const marchInvoice = generateInvoiceNumber(invoices, "DOC-", 3, 1, true, "03-01", "2026-03-10")

  assert.equal(februaryBackdated, "DOC-008")
  assert.equal(marchInvoice, "DOC-002")
})

runCase("reset periods allow duplicate display numbers across cycles without affecting the new cycle sequence", () => {
  const next = generateInvoiceNumber(
    [{ invoiceNumber: "DOC-001", date: "2026-02-02" }],
    "DOC-",
    3,
    1,
    true,
    "03-01",
    "2026-03-02"
  )

  assert.equal(next, "DOC-001")
})

runCase("same-day invoices still increment correctly", () => {
  const next = generateInvoiceNumber(
    [
      { invoiceNumber: "DOC-001", date: "2026-03-01" },
      { invoiceNumber: "DOC-002", date: "2026-03-01" },
    ],
    "DOC-",
    3,
    1,
    true,
    "03-01",
    "2026-03-01"
  )

  assert.equal(next, "DOC-003")
})

runCase("invoice numbering metadata captures the reset window used at creation time", () => {
  const metadata = getInvoiceNumberingMetadata(
    {
      prefix: "DOC-",
      padding: 3,
      startNumber: 1,
      resetYearly: true,
      resetMonthDay: "03-01",
    },
    "2026-03-10"
  )

  assert.deepEqual(metadata, {
    numberingModeAtCreation: "financial-year-reset",
    resetMonthDayAtCreation: "03-01",
    sequenceWindowStart: "2026-03-01",
    sequenceWindowEnd: "2027-03-01",
  })
})

runCase("duplicate reset warning appears only for the first repeated number in a new cycle", () => {
  const warning = getFirstRepeatedInvoiceNumberWarning(
    [{ invoiceNumber: "DOC-001", date: "2026-02-02" }],
    {
      prefix: "DOC-",
      padding: 3,
      startNumber: 1,
      resetYearly: true,
      resetMonthDay: "03-01",
    },
    "2026-03-02"
  )

  const noWarning = getFirstRepeatedInvoiceNumberWarning(
    [
      { invoiceNumber: "DOC-001", date: "2026-02-02" },
      { invoiceNumber: "DOC-001", date: "2026-03-02" },
    ],
    {
      prefix: "DOC-",
      padding: 3,
      startNumber: 1,
      resetYearly: true,
      resetMonthDay: "03-01",
    },
    "2026-03-03"
  )

  assert.match(warning || "", /DOC-001 already exists/i)
  assert.equal(noWarning, null)
})

runCase("invoice prefix validation blocks route-unsafe values", () => {
  assert.match(getInvoicePrefixError("DOC No"), /cannot contain spaces/i)
  assert.match(getInvoicePrefixError("DOC/"), /unsupported characters/i)
  assert.equal(getInvoicePrefixError("DOC-"), "")
})

runCase("pdf export cache matching stays scoped to the invoice internal id", () => {
  const rows = [
    {
      id: "legacy",
      storage_path: "user/DOC-001--fp-aaaaaaaaaaaaaaaaaaaaaaaa--123.pdf",
      public_url: "https://cdn.example.com/legacy.pdf",
    },
    {
      id: "match",
      storage_path: "user/DOC-001--iid-inv_a--fp-bbbbbbbbbbbbbbbbbbbbbbbb--123.pdf",
      public_url: "https://cdn.example.com/a.pdf",
    },
    {
      id: "other",
      storage_path: "user/DOC-001--iid-inv_b--fp-cccccccccccccccccccccccc--123.pdf",
      public_url: "https://cdn.example.com/b.pdf",
    },
    {
      id: "db-match",
      invoice_id: "inv_db",
      storage_path: "user/DOC-001--fp-dddddddddddddddddddddddd--123.pdf",
      public_url: "https://cdn.example.com/db.pdf",
    },
  ]

  const cached = findMatchingCachedInvoiceExport(rows, "inv_a")
  const dbCached = findMatchingCachedInvoiceExport(rows, "inv_db")
  const staleRows = filterStaleInvoiceExportRows(rows, "inv_a")

  assert.equal(cached?.id, "match")
  assert.equal(dbCached?.id, "db-match")
  assert.deepEqual(
    staleRows.map((row) => row.id),
    ["legacy", "match"]
  )
  assert.equal(
    extractFingerprintFromStoragePath(rows[1]?.storage_path),
    "bbbbbbbbbbbbbbbbbbbbbbbb"
  )
})

runCase("pdf export duplicate cleanup keeps only the newest row per invoice and fingerprint", () => {
  const duplicates = filterDuplicateInvoiceExportRows([
    {
      id: "newest",
      invoice_id: "inv_a",
      created_at: "2026-03-10T10:00:00.000Z",
      storage_path: "user/DOC-001--iid-inv_a--fp-bbbbbbbbbbbbbbbbbbbbbbbb--999.pdf",
    },
    {
      id: "older-duplicate",
      invoice_id: "inv_a",
      created_at: "2026-03-09T10:00:00.000Z",
      storage_path: "user/DOC-001--iid-inv_a--fp-bbbbbbbbbbbbbbbbbbbbbbbb--111.pdf",
    },
    {
      id: "different-fingerprint",
      invoice_id: "inv_a",
      created_at: "2026-03-08T10:00:00.000Z",
      storage_path: "user/DOC-001--iid-inv_a--fp-cccccccccccccccccccccccc--222.pdf",
    },
  ])

  assert.deepEqual(
    duplicates.map((row) => row.id),
    ["older-duplicate"]
  )
})

runCase("logo storage paths are versioned and only owned urls can be deleted", () => {
  const firstPath = buildLogoStoragePath("user_123", 1000, "alpha")
  const secondPath = buildLogoStoragePath("user_123", 1001, "beta")

  assert.notEqual(firstPath, secondPath)
  assert.equal(firstPath, "user_123/logo-1000-alpha.webp")

  const owned = getOwnedLogoStoragePath(
    "https://example.supabase.co/storage/v1/object/public/logos/user_123/logo-1000-alpha.webp",
    "user_123"
  )
  const foreign = getOwnedLogoStoragePath(
    "https://example.supabase.co/storage/v1/object/public/logos/other_user/logo-1000-alpha.webp",
    "user_123"
  )

  assert.equal(owned, "user_123/logo-1000-alpha.webp")
  assert.equal(foreign, null)
})

console.log("All regression checks passed.")
