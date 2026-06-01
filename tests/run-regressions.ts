import { readFileSync } from "node:fs"
import assert from "node:assert/strict"
import {
  INVOICE_SCHEMA_VERSION,
  normalizeInvoiceStorePayload,
  replaceInvoiceById,
  serializeInvoiceStore,
  validateInvoiceRecord,
} from "../lib/invoice.js"
import { formatAmountInWordsIndian } from "../lib/amountInWords.js"
import { buildCustomerIdentity, matchesCustomerIdentity } from "../lib/customerIdentity.js"
import { compareStoredDates, formatDate, getStoredDateParts, parseStoredDate, storedDatePartsToDate } from "../lib/dateFormat.js"
import {
  generateInvoiceNumber,
  getFirstRepeatedInvoiceNumberWarning,
  getInvoiceNumberingMetadata,
} from "../lib/invoiceNumber.js"
import { getInvoicePrefixError } from "../lib/invoicePrefixValidation.js"
import {
  buildIncrementalSyncPlan,
  isLocalRecordDirty,
  resolveLastWriteWins,
  type SyncMetadata,
} from "../lib/incrementalSync.js"
import { buildLogoStoragePath, getOwnedLogoStoragePath } from "../lib/logoStorage.js"
import {
  extractFingerprintFromStoragePath,
  filterDuplicateInvoiceExportRows,
  findMatchingCachedInvoiceExport,
  filterStaleInvoiceExportRows,
} from "../lib/server/invoicePdfExportCache.js"
import { createMemorySyncRetryQueue } from "../lib/syncRetryQueue.js"
import { createSyncService } from "../lib/syncService.js"
import { mergeCustomersCache, mergeInvoicesCache, mergeProductsCache } from "../lib/workspaceCacheMerge.js"
import { createWorkspaceSyncCoordinator } from "../lib/workspaceSyncCoordinator.js"
import {
  activeRecords,
  ensureRecordIds,
  markRecordDeleted,
  mergeActiveWithExistingTombstones,
} from "../lib/workspaceTombstones.js"
import { redactSensitiveData } from "../lib/workspaceSecurity.js"
import {
  validateCustomerForPersistence,
  validateGstin,
  validateProductForPersistence,
} from "../lib/workspaceValidation.js"
import { createWorkspaceDataAccess } from "../lib/dataAccess.js"

let invoiceSeedCounter = 0

function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: `inv_seed_${invoiceSeedCounter += 1}`,
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

async function runCaseAsync(name: string, fn: () => Promise<void>) {
  try {
    await fn()
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

runCase("replaceInvoiceById preserves unrelated invoices when saving an edited invoice", () => {
  const latestStore = [
    makeInvoice({ id: "inv_edit", clientName: "Original Name", invoiceNumber: "DOC-001" }),
    makeInvoice({ id: "inv_newer", clientName: "Later Invoice", invoiceNumber: "DOC-002" }),
  ]
  const editedInvoice = makeInvoice({ id: "inv_edit", clientName: "Edited Name", invoiceNumber: "DOC-001" })

  const updated = replaceInvoiceById(latestStore as never, editedInvoice as never)

  assert.ok(updated)
  assert.equal(updated?.length, 2)
  assert.equal(updated?.[0]?.clientName, "Edited Name")
  assert.equal(updated?.[1]?.id, "inv_newer")
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

runCase("customer identity uses phone first, GST fallback, and stable legacy fallback ids", () => {
  const phoneIdentity = buildCustomerIdentity(makeInvoice({ id: "inv_phone", clientPhone: "9999999999", clientGST: "24ABCDE1234F1Z5" }) as never)
  const gstIdentity = buildCustomerIdentity(makeInvoice({ id: "inv_gst", clientPhone: "", clientGST: "24AAAAA0000A1Z5" }) as never)
  const legacyIdentityA = buildCustomerIdentity(makeInvoice({ id: "inv_legacy_1", clientPhone: "", clientGST: "", clientName: "Legacy A", clientEmail: "a@example.com", clientAddress: "Surat" }) as never)
  const legacyIdentityB = buildCustomerIdentity(makeInvoice({ id: "inv_legacy_2", clientPhone: "", clientGST: "", clientName: "Legacy B", clientEmail: "b@example.com", clientAddress: "Vadodara" }) as never)

  assert.deepEqual(phoneIdentity, { id: "phone:9999999999", kind: "phone" })
  assert.deepEqual(gstIdentity, { id: "gst:24AAAAA0000A1Z5", kind: "gst" })
  assert.match(legacyIdentityA.id, /^legacy:/)
  assert.match(legacyIdentityB.id, /^legacy:/)
  assert.notEqual(legacyIdentityA.id, legacyIdentityB.id)
})

runCase("customer identity prefers sealed lookup ids while preserving legacy route matches", () => {
  const invoice = makeInvoice({
    clientPhone: "9999999999",
    customerIdentityKey: "phone:hmac-safe-id",
  }) as never

  assert.deepEqual(buildCustomerIdentity(invoice), { id: "phone:hmac-safe-id", kind: "phone" })
  assert.equal(matchesCustomerIdentity(invoice, "phone:hmac-safe-id"), true)
  assert.equal(matchesCustomerIdentity(invoice, "phone:9999999999"), true)
})

runCase("customer rows use createdAt to break same-day latest-invoice ties", () => {
  const source = readFileSync(new URL("../../lib/invoiceCollections.ts", import.meta.url), "utf8")
  assert.match(source, /CUSTOMER_MODEL/)
  assert.match(source, /dateDiff === 0 && createdAtDiff > 0/)
  assert.match(source, /map\[identity\.id\]\.latestCreatedAt = invoice\.createdAt \|\| ""/)
})

runCase("customer model is formally invoice-derived", () => {
  const model = readFileSync(new URL("../../lib/customerModel.ts", import.meta.url), "utf8")
  const customersPage = readFileSync(new URL("../../app/(app)/dashboard/customers/page.tsx", import.meta.url), "utf8")
  const createInvoice = readFileSync(new URL("../../app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx", import.meta.url), "utf8")

  assert.match(model, /CUSTOMER_MODEL_KIND = "invoice-derived"/)
  assert.match(model, /authoritativeSource: "invoices"/)
  assert.match(model, /editableSurface: "invoice-customer-fields"/)
  assert.match(customersPage, /buildCustomerRows\(invoices\)/)
  assert.match(createInvoice, /buildCustomerIdentity\(invoice\)/)
  assert.doesNotMatch(customersPage, /saveCustomers|saveCustomer/)
})

runCase("invoice validation requires either phone or GSTIN for a customer", () => {
  const invalid = validateInvoiceRecord(
    makeInvoice({
      id: "inv_missing_contact",
      clientPhone: "",
      clientGST: "",
    }) as never
  )
  const validWithGst = validateInvoiceRecord(
    makeInvoice({
      id: "inv_gst_only",
      clientPhone: "",
      clientGST: "24ABCDE1234F1Z5",
    }) as never
  )

  assert.match(invalid || "", /Add either phone number or GSTIN/i)
  assert.equal(validWithGst, null)
})

runCase("amount in words uses Indian currency wording and honors decimals setting", () => {
  assert.equal(formatAmountInWordsIndian(1534, { currencySymbol: "\u20B9", showDecimals: true }), "Rupees One Thousand Five Hundred Thirty Four Only")
  assert.equal(formatAmountInWordsIndian(1534.5, { currencySymbol: "\u20B9", showDecimals: true }), "Rupees One Thousand Five Hundred Thirty Four and Fifty Paise Only")
  assert.equal(formatAmountInWordsIndian(1534.5, { currencySymbol: "\u20B9", showDecimals: false }), "Rupees One Thousand Five Hundred Thirty Five Only")
  assert.equal(formatAmountInWordsIndian(12345678, { currencySymbol: "\u20B9", showDecimals: true }), "Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only")
})

runCase("stored invoice dates stay calendar-stable for formatting and filtering", () => {
  const parsed = parseStoredDate("2026-04-01")

  assert.deepEqual(parsed, { year: 2026, month: 4, day: 1 })
  assert.deepEqual(getStoredDateParts("2026-04-01"), { year: 2026, month: 4, day: 1 })
  assert.equal(formatDate("2026-04-01", "DD/MM/YYYY"), "01/04/2026")
  assert.equal(compareStoredDates("2026-04-01", "2026-03-31") > 0, true)

  const localDate = storedDatePartsToDate(parsed!)
  assert.equal(localDate.getFullYear(), 2026)
  assert.equal(localDate.getMonth(), 3)
  assert.equal(localDate.getDate(), 1)
})

runCase("backup payload falls back to a clean rupee symbol", () => {
  const source = readFileSync(new URL("../../lib/appBackup.ts", import.meta.url), "utf8")
  assert.match(source, /currencySymbol: getActiveOrGlobalItem\("currencySymbol"\) \|\| "\u20B9"/)
  assert.match(source, /setActiveOrGlobalItem\("currencySymbol", String\(settings\.currencySymbol \|\| "\u20B9"\)\)/)
})

runCase("bundled Supabase profile writes do not schedule a destructive profile delete", () => {
  const source = readFileSync(new URL("../../lib/userStore.ts", import.meta.url), "utf8")
  const branchStart = source.indexOf("if (BUNDLED_KEYS.has(key)) {")
  const branchReturn = source.indexOf("return", source.indexOf("schedulePush(ACCOUNT_SETUP_BUNDLE_KEY, bundleRaw)", branchStart))
  const branchEnd = source.indexOf("}", branchReturn)
  const bundledWriteBranch = source.slice(branchStart, branchEnd)

  assert.ok(bundledWriteBranch.includes("schedulePush(ACCOUNT_SETUP_BUNDLE_KEY, bundleRaw)"))
  assert.ok(!bundledWriteBranch.includes("scheduleDelete(key)"))
})

runCase("framework-agnostic sync layers avoid React and Zustand coupling", () => {
  const layerPaths = [
    "../../lib/dataAccess.ts",
    "../../lib/syncService.ts",
    "../../lib/supabase/workspaceRepository.ts",
    "../../lib/workspaceCache.ts",
    "../../lib/workspaceValidation.ts",
    "../../lib/workspaceSecurity.ts",
  ]

  for (const layerPath of layerPaths) {
    const source = readFileSync(new URL(layerPath, import.meta.url), "utf8")
    assert.doesNotMatch(source, /from ["']react["']/)
    assert.doesNotMatch(source, /from ["']zustand["']/)
    assert.doesNotMatch(source, /create\(["']?zustand/)
  }
})

runCase("Data Access and Context boundaries stay dependency-clean", () => {
  const dataAccess = readFileSync(new URL("../../lib/dataAccess.ts", import.meta.url), "utf8")
  assert.doesNotMatch(dataAccess, /createSupabaseBrowserClient/)
  assert.doesNotMatch(dataAccess, /userStore/)
  assert.doesNotMatch(dataAccess, /localStorage/)
  assert.doesNotMatch(dataAccess, /dispatchEvent/)
  assert.doesNotMatch(dataAccess, /pushKvToSupabase|deleteKvFromSupabase|refreshInvoicesFromSupabase/)

  for (const contextPath of ["../../context/BusinessContext.tsx", "../../context/SettingsContext.tsx"]) {
    const source = readFileSync(new URL(contextPath, import.meta.url), "utf8")
    assert.doesNotMatch(source, /userStore/)
    assert.doesNotMatch(source, /workspaceRepository|userKvSync|syncService/)
    assert.doesNotMatch(source, /createSupabaseBrowserClient/)
  }
})

runCase("SettingsProvider does not write workspace defaults before Supabase auth is active", () => {
  const source = readFileSync(new URL("../../context/SettingsContext.tsx", import.meta.url), "utf8")
  assert.match(source, /canWriteWorkspaceDefaults = getAuthMode\(\) !== "supabase" \|\| Boolean\(getActiveUserId\(\)\)/)
  assert.match(source, /if \(canWriteWorkspaceDefaults\) writeMissingDefaults\(\)/)
  assert.doesNotMatch(source, /if \(!supabaseNeedsHydration\) writeMissingDefaults\(\)/)
})

runCase("Auth bootstrap preserves reset-completed onboarding state", () => {
  for (const sourcePath of ["../../app/auth/callback/route.ts", "../../app/page.tsx"]) {
    const source = readFileSync(new URL(sourcePath, import.meta.url), "utf8")
    assert.match(source, /profiles"\)\.select\("user_id"\)\.eq\("user_id"/)
    assert.doesNotMatch(source, /profiles"\)\.upsert\(\{ user_id: [^}]+onboarding_completed: false/)
  }
})

runCase("Supabase signup exposes actionable errors and recovers the create form busy state", () => {
  const authSource = readFileSync(new URL("../../lib/authSupabase.ts", import.meta.url), "utf8")
  const pageSource = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8")
  const signupSource = authSource.slice(authSource.indexOf("export async function signUp"), authSource.indexOf("export async function signIn"))

  assert.match(authSource, /function getSignupErrorMessage/)
  assert.match(authSource, /Email signups are disabled in Supabase Auth settings\./)
  assert.match(authSource, /Supabase could not send the confirmation email/)
  assert.match(authSource, /Supabase could not create the auth user/)
  assert.doesNotMatch(signupSource, /return \{ record: null as AuthRecord \| null, error: "Error occurred, try again\." \}/)

  assert.match(pageSource, /if \(!createFormValid\) \{\s*setPrimaryBusy\(false\)\s*return\s*\}/)
  assert.match(pageSource, /setCreateErrorMessage\(error\)\s*setPrimaryBusy\(false\)\s*return/)
  assert.match(pageSource, /setCreateOtpMessage\("We sent an OTP code to your email\. Enter it below to continue setup\."\)\s*setPrimaryBusy\(false\)\s*return/)
})

runCase("Supabase auth rejects corrupted workspace-key user ids", () => {
  const authSource = readFileSync(new URL("../../lib/authSupabase.ts", import.meta.url), "utf8")
  const runtimeSource = readFileSync(new URL("../../lib/workspaceRuntime.ts", import.meta.url), "utf8")

  assert.match(authSource, /function isValidSupabaseUserId/)
  assert.match(authSource, /\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[1-5\]\[0-9a-f\]\{3\}-\[89ab\]\[0-9a-f\]\{3\}-\[0-9a-f\]\{12\}\$/)
  assert.match(authSource, /window\.sessionStorage\.removeItem\(AUTH_ACTIVE_USER_ID_KEY\)/)
  assert.match(authSource, /localStorage\.removeItem\(AUTH_LAST_USER_ID_KEY\)/)
  assert.match(authSource, /const safeUserId = isValidSupabaseUserId\(userId\) \? userId : null/)
  assert.match(authSource, /writeSessionActiveUserId\(safeUserId\)/)
  assert.match(runtimeSource, /error\(message, details\) \{\s*console\.warn\(message, details\)/)
})

runCase("Setup finalizing seeds fresh Supabase workspace before verifying rows", () => {
  const source = readFileSync(new URL("../../app/setup/profile/finalizing/page.tsx", import.meta.url), "utf8")
  const seedIndex = source.indexOf("await ensureWorkspaceSeed(userId)")
  const flushIndex = source.indexOf("await Promise.all(SETUP_SYNC_KEYS.map((key) => flushCloudKeyNow(key)))")
  const verifyIndex = source.indexOf("Workspace data was not confirmed by the server.")

  assert.match(source, /const SETUP_SYNC_KEYS = \[/)
  assert.match(source, /body: JSON\.stringify\(\{ op: "ensureSeed", userId \}\)/)
  assert.doesNotMatch(source, /app-hero-panel/)
  assert.match(source, /bg-white\/80/)
  assert.ok(seedIndex > -1)
  assert.ok(flushIndex > seedIndex)
  assert.ok(verifyIndex > flushIndex)
})

runCase("Server workspace setup writes surface Supabase errors", () => {
  const sealingSource = readFileSync(new URL("../../lib/server/workspaceSealing.ts", import.meta.url), "utf8")
  const repositorySource = readFileSync(new URL("../../lib/supabase/workspaceRepository.ts", import.meta.url), "utf8")
  const profileSource = sealingSource.slice(
    sealingSource.indexOf("export async function upsertSealedProfileFromCache"),
    sealingSource.indexOf("export async function upsertSealedCustomersFromCache")
  )
  const seedSource = sealingSource.slice(
    sealingSource.indexOf("export async function ensureSealedWorkspaceSeed"),
    sealingSource.indexOf("export async function backfillSealedWorkspace")
  )
  const settingsSource = repositorySource.slice(
    repositorySource.indexOf("export async function upsertSettingsPatch"),
    repositorySource.indexOf("export async function upsertProductsFromCache")
  )

  assert.match(profileSource, /const \{ error \} = await supabase\.from\("profiles"\)\.upsert/)
  assert.match(profileSource, /if \(error\) throw error/)
  assert.match(seedSource, /const \{ error \} = await supabase\.from\("profiles"\)\.upsert/)
  assert.match(seedSource, /const \{ error \} = await supabase\.from\("user_settings"\)\.upsert/)
  assert.match(settingsSource, /const \{ error \} = await supabase\.from\("user_settings"\)\.upsert/)
  assert.match(settingsSource, /if \(error\) throw error/)
})

runCase("Legacy userStore sync delegates cloud writes to trusted workspace API", () => {
  const source = readFileSync(new URL("../../lib/userStore.ts", import.meta.url), "utf8")

  assert.doesNotMatch(source, /createSupabaseBrowserClient/)
  assert.doesNotMatch(source, /pushKvToSupabase|deleteKvFromSupabase/)
  assert.match(source, /fetch\("\/api\/workspace"/)
  assert.match(source, /workspaceApi\(\{ op: "pushKey", userId, key, rawValue \}\)/)
  assert.match(source, /workspaceApi\(\{ op: "deleteKey", userId, key \}\)/)
  assert.match(source, /error\(message, details\) \{\s*console\.warn\(message, details\)/)
})

runCase("Workspace runtime surfaces API error bodies and coordinator contains background failures", () => {
  const runtimeSource = readFileSync(new URL("../../lib/workspaceRuntime.ts", import.meta.url), "utf8")
  const coordinatorSource = readFileSync(new URL("../../lib/workspaceSyncCoordinator.ts", import.meta.url), "utf8")
  const workspaceRouteSource = readFileSync(new URL("../../app/api/workspace/route.ts", import.meta.url), "utf8")

  assert.match(runtimeSource, /const raw = await response\.text\(\)/)
  assert.match(runtimeSource, /payload\.error \|\| fallback \|\| `Workspace sync failed with HTTP \$\{response\.status\}\.`/)
  assert.match(runtimeSource, /function safeJsonParse/)
  assert.match(workspaceRouteSource, /function getErrorMessage\(error: unknown\)/)
  assert.match(workspaceRouteSource, /details\.message, details\.error, details\.details, details\.hint, details\.code/)
  assert.match(workspaceRouteSource, /const message = getErrorMessage\(error\)/)
  assert.match(coordinatorSource, /function runBackground/)
  assert.match(coordinatorSource, /logger\.warn\(`Workspace sync \$\{label\} failed`, error\)/)
  assert.match(coordinatorSource, /runBackground\("initialization", initialize\)/)
  assert.doesNotMatch(coordinatorSource, /void initialize\(\)/)
})

runCase("Auth provider delegates sync orchestration to the coordinator", () => {
  const source = readFileSync(new URL("../../components/providers/SupabaseAuthSync.tsx", import.meta.url), "utf8")
  assert.match(source, /createBrowserWorkspaceSyncCoordinator/)
  assert.doesNotMatch(source, /pullSupabaseChangesToCache|pullSupabaseKvToCache|pushLocalSeedIfSupabaseEmpty/)
  assert.doesNotMatch(source, /workspaceRepository|userKvSync/)
})

runCase("repository sync avoids full-table delete and exposes changed-since fetches", () => {
  const source = readFileSync(new URL("../../lib/supabase/workspaceRepository.ts", import.meta.url), "utf8")
  const compatibilitySource = readFileSync(new URL("../../lib/supabase/userKvSync.ts", import.meta.url), "utf8")

  assert.doesNotMatch(source, /\.delete\(\)\.eq\("user_id", userId\)/)
  assert.match(source, /upsertProductsFromCache/)
  assert.match(source, /upsertCustomersFromCache/)
  assert.match(source, /upsertInvoicesFromCache/)
  assert.match(source, /fetchChangedProducts/)
  assert.match(source, /fetchChangedCustomers/)
  assert.match(source, /fetchChangedInvoices/)
  assert.match(source, /updated_at\.gt\.\$\{changedSince\},deleted_at\.gt\.\$\{changedSince\}/)
  assert.doesNotMatch(compatibilitySource, /\.from\(|\.rpc\(/)
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

runCase("incremental sync marks unsynced and newer local records as dirty", () => {
  assert.equal(
    isLocalRecordDirty({
      id: "prod_1",
      updated_at: "2026-03-10T10:05:00.000Z",
      last_synced_at: "2026-03-10T10:00:00.000Z",
      sync_status: "synced",
    }),
    true
  )
  assert.equal(
    isLocalRecordDirty({
      id: "prod_2",
      updated_at: "2026-03-10T09:55:00.000Z",
      last_synced_at: "2026-03-10T10:00:00.000Z",
      sync_status: "synced",
    }),
    false
  )
  assert.equal(
    isLocalRecordDirty({
      id: "prod_3",
      updated_at: "2026-03-10T09:55:00.000Z",
      last_synced_at: "2026-03-10T10:00:00.000Z",
      sync_status: "pending",
    }),
    true
  )
})

runCase("last-write-wins chooses newer remote records and treats tombstones as changes", () => {
  type TestSyncRecord = SyncMetadata & { name: string }
  const local: TestSyncRecord = {
    id: "inv_1",
    updated_at: "2026-03-10T10:00:00.000Z",
    last_synced_at: "2026-03-10T10:00:00.000Z",
    sync_status: "synced",
    name: "Local",
  }
  const remote: TestSyncRecord = {
    id: "inv_1",
    updated_at: "2026-03-10T10:01:00.000Z",
    deleted_at: "2026-03-10T10:02:00.000Z",
    sync_status: "synced",
    name: "Remote",
  }

  const result = resolveLastWriteWins(local, remote)
  assert.equal(result.winner, "remote")
  assert.equal(result.record.deleted_at, "2026-03-10T10:02:00.000Z")
})

runCase("incremental sync plan pushes dirty local records and applies changed remote rows", () => {
  const plan = buildIncrementalSyncPlan(
    [
      {
        id: "prod_local",
        updated_at: "2026-03-10T10:05:00.000Z",
        last_synced_at: "2026-03-10T10:00:00.000Z",
        sync_status: "synced",
      },
      {
        id: "prod_remote",
        updated_at: "2026-03-10T10:00:00.000Z",
        last_synced_at: "2026-03-10T10:00:00.000Z",
        sync_status: "synced",
      },
    ],
    [
      {
        id: "prod_remote",
        updated_at: "2026-03-10T10:07:00.000Z",
        sync_status: "synced",
      },
      {
        id: "prod_new_remote",
        updated_at: "2026-03-10T10:08:00.000Z",
        sync_status: "synced",
      },
    ]
  )

  assert.deepEqual(
    plan.localToPush.map((row) => row.id),
    ["prod_local"]
  )
  assert.deepEqual(
    plan.remoteToApply.map((row) => row.id),
    ["prod_remote", "prod_new_remote"]
  )
  assert.deepEqual(
    plan.conflicts.map((row) => [row.id, row.winner]),
    [["prod_remote", "remote"]]
  )
})

runCase("workspace validation centralizes GST, product, and customer checks", () => {
  assert.equal(validateGstin("24ABCDE1234F1Z5").ok, true)
  assert.equal(validateGstin("24 abcde 1234 f1z5").ok, true)
  assert.equal(validateGstin("bad-gstin").ok, false)
  const invalidGstin = validateGstin("123456789012345")
  assert.equal(invalidGstin.ok, false)
  assert.match(invalidGstin.ok ? "" : invalidGstin.message || "", /24ABCDE1234F1Z5/)
  assert.equal(validateProductForPersistence({ name: "Service", price: 0 }).ok, true)
  assert.equal(validateProductForPersistence({ name: "", price: 0 }).ok, false)
  assert.equal(validateCustomerForPersistence({ name: "Raj", phone: "", gst: "" }).ok, false)
  assert.equal(validateCustomerForPersistence({ name: "Raj", phone: "9999999999", gst: "" }).ok, true)
})

runCase("sync logging redacts sensitive fields recursively", () => {
  const redacted = redactSensitiveData({
    phone: "9999999999",
    nested: {
      accountNumber: "123456",
      safe: "visible",
    },
    rows: [{ clientGST: "24ABCDE1234F1Z5", name: "Raj" }],
  })

  assert.equal(redacted.phone, "[REDACTED]")
  assert.equal(redacted.nested.accountNumber, "[REDACTED]")
  assert.equal(redacted.nested.safe, "visible")
  assert.equal(redacted.rows[0]?.clientGST, "[REDACTED]")
  assert.equal(redacted.rows[0]?.name, "Raj")
})

runCase("server sensitive sealing uses server-only keys and keeps client compatibility weak", () => {
  const serverSource = readFileSync(new URL("../../lib/server/sensitiveSeal.ts", import.meta.url), "utf8")
  const lookupSource = readFileSync(new URL("../../lib/server/sensitiveLookup.ts", import.meta.url), "utf8")
  const workspaceRouteSource = readFileSync(new URL("../../app/api/workspace/route.ts", import.meta.url), "utf8")
  const runtimeSource = readFileSync(new URL("../../lib/workspaceRuntime.ts", import.meta.url), "utf8")
  const clientSource = readFileSync(new URL("../../lib/sensitiveData.ts", import.meta.url), "utf8")

  assert.match(serverSource, /SERVER_DATA_ENCRYPTION_KEY/)
  assert.match(serverSource, /sealed:v1:/)
  assert.match(serverSource, /enc:v1:/)
  assert.doesNotMatch(serverSource, /NEXT_PUBLIC_DATA_ENCRYPTION_KEY/)
  assert.match(lookupSource, /SERVER_DATA_HASH_KEY/)
  assert.match(lookupSource, /createHmac\("sha256"/)
  assert.match(workspaceRouteSource, /pushSealedWorkspaceKey/)
  assert.match(workspaceRouteSource, /createSealedInvoiceRecord/)
  assert.match(runtimeSource, /\/api\/workspace/)
  assert.match(clientSource, /return value/)
  assert.doesNotMatch(clientSource, /NEXT_PUBLIC_DATA_ENCRYPTION_KEY/)
})

runCase("schema stores sealed contact values with non-reversible lookup hashes", () => {
  const schema = readFileSync(new URL("../../supabase/schema.sql", import.meta.url), "utf8")

  assert.match(schema, /phone_hash text/)
  assert.match(schema, /gst_hash text/)
  assert.match(schema, /client_phone_hash text/)
  assert.match(schema, /client_gst_hash text/)
  assert.match(schema, /customer_identity_key text/)
  assert.match(schema, /p_identity_key text default null/)
  assert.doesNotMatch(schema, /identity_key text := concat_ws\('\|'/)
})

runCase("fresh Supabase bootstrap schema is canonical and complete", () => {
  const schema = readFileSync(new URL("../../supabase/schema.sql", import.meta.url), "utf8")
  const pdfExportRoute = readFileSync(new URL("../../app/api/invoice-pdf-export/route.ts", import.meta.url), "utf8")

  assert.match(schema, /Canonical source of truth for a fresh Supabase project/)
  assert.match(schema, /Fresh Project Setup/)
  assert.match(schema, /logos/)
  assert.match(schema, /invoice-pdfs/)
  assert.match(schema, /currency_symbol text not null default '₹'/)
  assert.doesNotMatch(schema, /â‚¹/)
  assert.match(schema, /create table if not exists public\.customers \(\s+id text primary key default \('cust_' \|\| replace\(gen_random_uuid\(\)::text, '-', ''\)\)/)
  assert.match(schema, /create table if not exists public\.products \(\s+id text primary key default \('prod_' \|\| replace\(gen_random_uuid\(\)::text, '-', ''\)\)/)
  assert.match(schema, /alter table public\.customers alter column id type text using id::text/)
  assert.match(schema, /alter table public\.products alter column id type text using id::text/)
  assert.doesNotMatch(schema, /create table if not exists public\.customers \(\s+id uuid primary key/)
  assert.doesNotMatch(schema, /create table if not exists public\.products \(\s+id uuid primary key/)
  assert.match(schema, /create policy "invoice_pdf_exports_update_own" on public\.invoice_pdf_exports for update using \(auth\.uid\(\) = user_id\) with check \(auth\.uid\(\) = user_id\)/)
  assert.match(schema, /grant usage on schema public to authenticated, service_role/)
  assert.match(schema, /grant select, insert, update, delete on table\s+public\.profiles,\s+public\.user_settings,\s+public\.account_lifecycle_locks,\s+public\.customers,\s+public\.products,\s+public\.invoice_sequences,\s+public\.invoices,\s+public\.invoice_items,\s+public\.invoice_history,\s+public\.invoice_pdf_exports\s+to authenticated;/)
  assert.match(schema, /grant select, insert, update, delete on table\s+public\.profiles,\s+public\.user_settings,\s+public\.account_lifecycle_locks,\s+public\.customers,\s+public\.products,\s+public\.invoice_sequences,\s+public\.invoices,\s+public\.invoice_items,\s+public\.invoice_history,\s+public\.invoice_pdf_exports\s+to service_role;/)
  assert.match(schema, /grant execute on function public\.create_invoice_record\(jsonb\) to authenticated;/)
  assert.match(schema, /grant execute on function public\.update_invoice_record\(jsonb\) to authenticated;/)
  assert.match(schema, /coalesce\(nullif\(p_invoice->>'id', ''\), 'inv_' \|\| replace\(gen_random_uuid\(\)::text, '-', ''\)\) as invoice_id_value/)

  for (const table of [
    "profiles",
    "user_settings",
    "account_lifecycle_locks",
    "customers",
    "products",
    "invoice_sequences",
    "invoices",
    "invoice_items",
    "invoice_history",
    "invoice_pdf_exports",
  ]) {
    assert.match(schema, new RegExp(`create table if not exists public\\.${table}\\b`))
    assert.match(schema, new RegExp(`alter table public\\.${table} enable row level security`))
  }

  for (const fn of [
    "touch_updated_at",
    "normalize_reset_month_day",
    "compute_invoice_scope",
    "upsert_customer_from_invoice",
    "create_invoice_record",
    "update_invoice_record",
    "delete_invoice_record",
    "soft_delete_invoice_record",
  ]) {
    assert.match(schema, new RegExp(`create or replace function public\\.${fn}\\b`))
  }

  for (const policy of [
    "invoice_pdf_exports_select_own",
    "invoice_pdf_exports_insert_own",
    "invoice_pdf_exports_update_own",
    "invoice_pdf_exports_delete_own",
    "logos_insert_own",
    "logos_select_own",
    "logos_delete_own",
    "invoice_pdfs_insert_own",
    "invoice_pdfs_select_own",
    "invoice_pdfs_delete_own",
    "account_lifecycle_locks_select_own",
  ]) {
    assert.match(schema, new RegExp(`create policy "${policy}"`))
  }

  assert.match(schema, /customers_phone_hash_idx/)
  assert.match(schema, /customers_gst_hash_idx/)
  assert.match(schema, /invoices_client_phone_hash_idx/)
  assert.match(schema, /invoices_client_gst_hash_idx/)
  assert.match(schema, /invoice_pdf_exports_purge_idx/)
  assert.doesNotMatch(pdfExportRoute, /invoice_pdf_exports\.sql/)
  assert.match(pdfExportRoute, /supabase\/schema\.sql/)
})

runCase("invoice PDF export is resilient to repeated invoice numbers", () => {
  const schema = readFileSync(new URL("../../supabase/schema.sql", import.meta.url), "utf8")
  const viewPage = readFileSync(
    new URL("../../app/(app)/dashboard/invoices/view/[id]/page.tsx", import.meta.url),
    "utf8"
  )
  const core = readFileSync(new URL("../../lib/server/invoicePdfGenerationCore.ts", import.meta.url), "utf8")
  const workspaceRoute = readFileSync(new URL("../../app/api/workspace/route.ts", import.meta.url), "utf8")
  const runtime = readFileSync(new URL("../../lib/workspaceRuntime.ts", import.meta.url), "utf8")

  assert.match(schema, /coalesce\(nullif\(p_invoice->>'id', ''\), 'inv_' \|\| replace\(gen_random_uuid\(\)::text, '-', ''\)\) as invoice_id_value/)
  assert.doesNotMatch(schema, /unique \(user_id, invoice_number\)/)
  assert.match(schema, /alter table public\.invoices drop constraint if exists invoices_user_id_invoice_number_key/)
  assert.match(viewPage, /ensureInvoiceForPdfViaSupabase\(invoice\)/)
  assert.match(viewPage, /invoiceNumber: invoice\.invoiceNumber/)
  assert.match(viewPage, /invoiceDate: invoice\.date/)
  assert.match(viewPage, /clientName: invoice\.clientName/)
  assert.match(viewPage, /grandTotal: invoice\.grandTotal/)
  assert.match(core, /\.eq\("id", String\(body\.invoiceId\)\)/)
  assert.doesNotMatch(core, /pickInvoiceFallbackMatch/)
  assert.doesNotMatch(core, /\.eq\("invoice_number", cleanLookupString\(body\.invoiceNumber\)\)/)
  assert.match(workspaceRoute, /op: "upsertInvoice"/)
  assert.match(workspaceRoute, /upsertSealedInvoiceRecord\(supabase, userId, body\.invoice\)/)
  assert.match(runtime, /ensureInvoiceRecordForPdf/)
  assert.match(runtime, /op: "upsertInvoice"/)
})

runCase("required runtime environment variables are documented and referenced", () => {
  const migrationDoc = readFileSync(new URL("../../docs/FRESH-SUPABASE-MIGRATION.md", import.meta.url), "utf8")
  const schema = readFileSync(new URL("../../supabase/schema.sql", import.meta.url), "utf8")
  const browserClient = readFileSync(new URL("../../lib/supabase/browser.ts", import.meta.url), "utf8")
  const serverClient = readFileSync(new URL("../../lib/supabase/server.ts", import.meta.url), "utf8")
  const adminClient = readFileSync(new URL("../../lib/supabase/admin.ts", import.meta.url), "utf8")
  const sealSource = readFileSync(new URL("../../lib/server/sensitiveSeal.ts", import.meta.url), "utf8")
  const lookupSource = readFileSync(new URL("../../lib/server/sensitiveLookup.ts", import.meta.url), "utf8")
  const purgeInvoices = readFileSync(new URL("../../app/api/cron/purge-invoice-pdfs/route.ts", import.meta.url), "utf8")
  const purgeLogos = readFileSync(new URL("../../app/api/cron/purge-logo-orphans/route.ts", import.meta.url), "utf8")

  for (const name of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SERVER_DATA_ENCRYPTION_KEY",
    "SERVER_DATA_HASH_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "CRON_SECRET",
  ]) {
    assert.match(`${migrationDoc}\n${schema}`, new RegExp(name))
  }

  assert.match(browserClient, /NEXT_PUBLIC_SUPABASE_URL/)
  assert.match(browserClient, /NEXT_PUBLIC_SUPABASE_ANON_KEY/)
  assert.match(serverClient, /NEXT_PUBLIC_SUPABASE_URL/)
  assert.match(serverClient, /NEXT_PUBLIC_SUPABASE_ANON_KEY/)
  assert.match(adminClient, /NEXT_PUBLIC_SUPABASE_URL/)
  assert.match(adminClient, /SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(sealSource, /SERVER_DATA_ENCRYPTION_KEY/)
  assert.match(lookupSource, /SERVER_DATA_HASH_KEY/)
  assert.match(purgeInvoices, /CRON_SECRET/)
  assert.match(purgeLogos, /CRON_SECRET/)
})

runCase("incremental cache merge applies remote products and tombstones without full replacement", () => {
  const merged = JSON.parse(
    mergeProductsCache(
      JSON.stringify([
        {
          id: "prod_keep",
          name: "Keep",
          hsn: "1",
          unit: "pcs",
          price: 10,
          updated_at: "2026-03-10T10:00:00.000Z",
        },
        {
          id: "prod_delete",
          name: "Delete",
          hsn: "2",
          unit: "pcs",
          price: 20,
          updated_at: "2026-03-10T10:00:00.000Z",
        },
      ]),
      [
        {
          id: "prod_new",
          name: "New",
          hsn: "3",
          unit: "hr",
          price: 30,
          cgst: 0,
          sgst: 0,
          igst: 0,
          updated_at: "2026-03-10T10:05:00.000Z",
        },
        {
          id: "prod_delete",
          name: "Delete",
          hsn: "2",
          unit: "pcs",
          price: 20,
          cgst: 0,
          sgst: 0,
          igst: 0,
          updated_at: "2026-03-10T10:05:00.000Z",
          deleted_at: "2026-03-10T10:05:00.000Z",
        },
      ]
    )
  ) as Array<Record<string, unknown>>

  assert.deepEqual(
    merged.map((row) => row.id).sort(),
    ["prod_keep", "prod_new"]
  )
})

runCase("incremental customer merge preserves existing rows while applying changed rows", () => {
  const merged = JSON.parse(
    mergeCustomersCache(
      JSON.stringify([{ id: "cust_keep", name: "Keep", phone: "1", gst: "", email: "", address: "" }]),
      [
        {
          id: "cust_new",
          name: "New",
          phone: "2",
          gst: "",
          email: "new@example.com",
          address: "Surat",
          updated_at: "2026-03-10T10:05:00.000Z",
        },
      ]
    )
  ) as Array<Record<string, unknown>>

  assert.deepEqual(
    merged.map((row) => row.id).sort(),
    ["cust_keep", "cust_new"]
  )
})

runCase("incremental invoice merge applies remote tombstones", () => {
  const existing = {
    schemaVersion: INVOICE_SCHEMA_VERSION,
    invoices: [
      makeInvoice({ id: "inv_keep", invoiceNumber: "DOC-001" }),
      makeInvoice({ id: "inv_delete", invoiceNumber: "DOC-002" }),
    ],
  }
  const merged = normalizeInvoiceStorePayload(
    JSON.parse(
      mergeInvoicesCache(JSON.stringify(existing), [
        {
          id: "inv_delete",
          invoice_number: "DOC-002",
          created_at: "2026-03-10T10:00:00.000Z",
          updated_at: "2026-03-10T10:05:00.000Z",
          deleted_at: "2026-03-10T10:05:00.000Z",
          invoice_date: "2026-03-10",
          numbering_mode_at_creation: "continuous",
          reset_month_day_at_creation: null,
          sequence_window_start: null,
          sequence_window_end: null,
          client_name: "Raj",
          client_phone: "9999999999",
          client_email: "",
          client_gst: "",
          client_address: "Surat",
          custom_details: [],
          notes: "",
          status: "draft",
          grand_total: 100,
          invoice_items: [],
          invoice_history: [],
        },
      ])
    )
  )

  assert.deepEqual(
    merged.store.invoices.map((invoice) => invoice.id),
    ["inv_keep"]
  )
})

await runCaseAsync("full workspace snapshot preserves local records missing from remote", async () => {
  const userId = "11111111-1111-4111-8111-111111111111"
  const cacheValues = new Map<string, string>([
    [
      `${userId}:products`,
      JSON.stringify([
        {
          id: "prod_local",
          name: "Local Service",
          hsn: "60",
          unit: "pcs",
          price: 100,
          updated_at: "2026-03-10T10:00:00.000Z",
          sync_status: "pending",
        },
      ]),
    ],
    [
      `${userId}:invoices`,
      serializeInvoiceStore([
        makeInvoice({
          id: "inv_local",
          invoiceNumber: "INV-0001",
          updated_at: "2026-03-10T10:00:00.000Z",
          sync_status: "pending",
        }),
      ]),
    ],
  ])
  let primedRows: Array<{ key: string; value: string }> = []

  const coordinator = createWorkspaceSyncCoordinator({
    auth: {
      async getCurrentUser() {
        return { id: userId }
      },
      getActiveUserId() {
        return userId
      },
      setActiveUserId() {},
      onAuthStateChange() {
        return { unsubscribe() {} }
      },
    },
    cache: {
      clearUser(id) {
        for (const key of Array.from(cacheValues.keys())) {
          if (key.startsWith(`${id}:`)) cacheValues.delete(key)
        }
      },
      getUserItem(key, id) {
        return cacheValues.get(`${id}:${key}`) || null
      },
      isHydrated() {
        return false
      },
      primeUser(id, entries) {
        primedRows = entries
        for (const entry of entries) cacheValues.set(`${id}:${entry.key}`, entry.value)
      },
      readWatermark() {
        return null
      },
      writeWatermark() {},
    },
    repository: {
      async ensureSeed() {},
      async fetchSnapshot() {
        return [
          { key: "products", value: "[]" },
          { key: "customers", value: "[]" },
          { key: "invoices", value: serializeInvoiceStore([]) },
        ]
      },
      async fetchChanges() {
        return []
      },
    },
    syncService: {
      async replayQueued() {},
    },
    events: {
      emitCloudSync() {},
      emitAuthSyncInitialized() {},
      onFocus() {
        return () => {}
      },
      isVisible() {
        return true
      },
    },
  })

  await coordinator.sync(userId)

  const productsRow = primedRows.find((row) => row.key === "products")
  const invoicesRow = primedRows.find((row) => row.key === "invoices")
  assert.match(productsRow?.value || "", /Local Service/)
  assert.match(invoicesRow?.value || "", /INV-0001/)
})

runCase("sync retry queue dedupes by user key and operation", () => {
  const queue = createMemorySyncRetryQueue()
  const first = queue.enqueue({
    userId: "user_1",
    key: "products",
    operation: "push",
    rawValue: "old",
  })
  const second = queue.enqueue({
    userId: "user_1",
    key: "products",
    operation: "push",
    rawValue: "new",
  })

  assert.notEqual(first.id, second.id)
  assert.deepEqual(
    queue.list("user_1").map((item) => item.rawValue),
    ["new"]
  )
})

runCase("sync retry queue keeps separate push and delete operations and tracks failures", () => {
  const queue = createMemorySyncRetryQueue()
  const push = queue.enqueue({
    userId: "user_1",
    key: "customers",
    operation: "push",
    rawValue: "[]",
  })
  const del = queue.enqueue({
    userId: "user_1",
    key: "customers",
    operation: "delete",
  })

  queue.markFailed(push.id, "network down")
  const items = queue.list("user_1")

  assert.equal(items.length, 2)
  assert.equal(items.find((item) => item.id === push.id)?.attempts, 1)
  assert.equal(items.find((item) => item.id === push.id)?.lastError, "network down")
  queue.remove(del.id)
  assert.deepEqual(
    queue.list("user_1").map((item) => item.operation),
    ["push"]
  )
})

await runCaseAsync("sync service reads latest cache value and validates before push", async () => {
  const pushed: Array<{ key: string; value: string }> = []
  const retryQueue = createMemorySyncRetryQueue()
  let cached = "cached-value"
  const service = createSyncService({
    cache: {
      get: () => cached,
      set: () => {},
      remove: () => {},
    },
    repository: {
      async pushKey(_userId, key, rawValue) {
        pushed.push({ key, value: rawValue })
      },
      async deleteKey() {},
    },
    validators: {
      validatePush(_key, rawValue) {
        return rawValue === "bad" ? { ok: false, message: "bad payload" } : { ok: true }
      },
    },
    retryQueue,
    debounceMs: 1,
    maxRetries: 0,
  })

  await service.flushPush("user_1", "products")
  cached = "bad"
  await assert.rejects(() => service.flushPush("user_1", "products"), /bad payload/)

  assert.deepEqual(pushed, [{ key: "products", value: "cached-value" }])
  assert.equal(retryQueue.list("user_1").length, 1)
})

runCase("workspace tombstones hide deleted records while preserving deletion intent", () => {
  type NamedTombstone = { id?: string; name: string; deleted_at?: string; sync_status?: string; updated_at?: string }
  const active = ensureRecordIds<NamedTombstone>([{ name: "One" }, { name: "Two" }], "prod")
  const deleted = markRecordDeleted(active, active[0]!.id!, "2026-03-10T10:00:00.000Z")

  assert.deepEqual(
    activeRecords(deleted).map((row) => row.name),
    ["Two"]
  )
  assert.equal(deleted[0]?.deleted_at, "2026-03-10T10:00:00.000Z")
  assert.equal(deleted[0]?.sync_status, "pending")
})

runCase("active cache writes keep existing tombstones alongside visible records", () => {
  const existing = [
    { id: "prod_deleted", name: "Deleted", deleted_at: "2026-03-10T10:00:00.000Z" },
    { id: "prod_keep", name: "Keep" },
  ]
  const merged = mergeActiveWithExistingTombstones(existing, [{ id: "prod_keep", name: "Keep edited" }], "prod")

  assert.deepEqual(
    merged.map((row) => row.id),
    ["prod_deleted", "prod_keep"]
  )
  assert.equal(merged[1]?.name, "Keep edited")
})

runCase("invoice product suggestions search product names and HSN codes", () => {
  for (const path of [
    "../../app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
    "../../app/(app)/dashboard/invoices/edit/[id]/page.tsx",
  ]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8")
    assert.match(source, /function productMatchesSuggestion/)
    assert.match(source, /String\(product\.name \|\| ""\)\.toLowerCase\(\)\.includes\(normalized\)/)
    assert.match(source, /String\(product\.hsn \|\| ""\)\.toLowerCase\(\)\.includes\(normalized\)/)
    assert.match(source, /products\.filter\(\(product\) => productMatchesSuggestion\(product, value\)\)/)
    assert.match(source, /String\(product\.hsn \|\| ""\)\.toLowerCase\(\)\.includes\(normalized\)/)
    assert.match(source, /deleted_at/)
  }
})

runCase("dashboard revenue chart uses stable month buckets", () => {
  const source = readFileSync(new URL("../../app/(app)/dashboard/page.tsx", import.meta.url), "utf8")

  assert.match(source, /date\.setDate\(1\)/)
  assert.match(source, /date\.setMonth\(date\.getMonth\(\) - index\)/)
  assert.match(source, /const key = `\$\{month\.year\}-\$\{month\.month\}`/)
})

runCase("edited invoices keep fresh cache timestamps for dashboard totals", () => {
  const source = readFileSync(new URL("../../lib/dataAccess.ts", import.meta.url), "utf8")

  assert.match(source, /const updatedAt = clock\(\)\.toISOString\(\)/)
  assert.match(source, /updated_at: updatedAt/)
  assert.match(source, /replaceInvoiceById\(readInvoicesWithDeleted\(cache\.get\("invoices"\)\), nextInvoice\)/)
  assert.match(source, /events\.emitWorkspaceWrite\("invoices"\)/)
})

runCase("invoice GSTIN inputs normalize to compact uppercase GST format", () => {
  for (const path of [
    "../../app/(app)/dashboard/invoices/create/CreateInvoiceClient.tsx",
    "../../app/(app)/dashboard/invoices/edit/[id]/page.tsx",
  ]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8")
    assert.match(source, /normalizeCustomerGstin/)
    assert.match(source, /setClientGST\(normalizeCustomerGstin\(/)
    assert.match(source, /placeholder="e\.g\. 24ABCDE1234F1Z5"/)
  }
})

await runCaseAsync("authoritative cloud product save writes Supabase before cache success", async () => {
  const calls: string[] = []
  let cached: string | null = null
  const dataAccess = createWorkspaceDataAccess({
    cache: {
      get() {
        return cached
      },
      set(_key, value) {
        calls.push("cache:set")
        cached = value
      },
      remove() {
        calls.push("cache:remove")
        cached = null
      },
    },
    sync: {
      schedulePush() {},
      scheduleDelete() {},
      flushPush: async (_userId, key, rawValue) => {
        calls.push(`supabase:${key}:${rawValue}`)
      },
      flushDelete: async (_userId, key) => {
        calls.push(`supabase-delete:${key}`)
      },
      replayQueued: async () => {},
    },
    repository: {
      listInvoices: async () => [],
      createInvoiceRecord: async () => ({}),
      updateInvoiceRecord: async () => {},
      softDeleteInvoiceRecord: async () => true,
    },
    auth: {
      getUserId: () => "user_1",
      isCloudMode: () => true,
    },
    events: {
      emitWorkspaceWrite(key) {
        calls.push(`event:${key}`)
      },
    },
  })

  await dataAccess.saveProduct('[{"id":"prod_1","name":"Cloud product"}]')

  assert.deepEqual(calls, [
    'supabase:products:[{"id":"prod_1","name":"Cloud product"}]',
    "cache:set",
    "event:products",
  ])
  assert.equal(cached, '[{"id":"prod_1","name":"Cloud product"}]')
})

await runCaseAsync("authoritative cloud save failure leaves cache untouched", async () => {
  let cached: string | null = '[{"id":"prod_old","name":"Old"}]'
  const dataAccess = createWorkspaceDataAccess({
    cache: {
      get() {
        return cached
      },
      set(_key, value) {
        cached = value
      },
      remove() {
        cached = null
      },
    },
    sync: {
      schedulePush() {},
      scheduleDelete() {},
      flushPush: async () => {
        throw new Error("network down")
      },
      flushDelete: async () => {},
      replayQueued: async () => {},
    },
    repository: {
      listInvoices: async () => [],
      createInvoiceRecord: async () => ({}),
      updateInvoiceRecord: async () => {},
      softDeleteInvoiceRecord: async () => true,
    },
    auth: {
      getUserId: () => "user_1",
      isCloudMode: () => true,
    },
    events: {
      emitWorkspaceWrite() {
        throw new Error("cache event should not fire on failed authoritative save")
      },
    },
  })

  await assert.rejects(
    () => dataAccess.saveProduct('[{"id":"prod_new","name":"New"}]'),
    /network down/
  )
  assert.equal(cached, '[{"id":"prod_old","name":"Old"}]')
})

await runCaseAsync("authoritative cloud customer save uses the same Supabase-first boundary", async () => {
  const calls: string[] = []
  const dataAccess = createWorkspaceDataAccess({
    cache: {
      get() {
        return null
      },
      set(_key, value) {
        calls.push(`cache:${value}`)
      },
      remove() {},
    },
    sync: {
      schedulePush() {},
      scheduleDelete() {},
      flushPush: async (_userId, key, rawValue) => {
        calls.push(`supabase:${key}:${rawValue}`)
      },
      flushDelete: async () => {},
      replayQueued: async () => {},
    },
    repository: {
      listInvoices: async () => [],
      createInvoiceRecord: async () => ({}),
      updateInvoiceRecord: async () => {},
      softDeleteInvoiceRecord: async () => true,
    },
    auth: {
      getUserId: () => "user_1",
      isCloudMode: () => true,
    },
    events: {
      emitWorkspaceWrite(key) {
        calls.push(`event:${key}`)
      },
    },
  })

  await dataAccess.saveCustomer('[{"id":"cust_1","name":"Cloud customer"}]')

  assert.deepEqual(calls, [
    'supabase:customers:[{"id":"cust_1","name":"Cloud customer"}]',
    'cache:[{"id":"cust_1","name":"Cloud customer"}]',
    "event:customers",
  ])
})

runCase("authoritative save UI waits for domain results before success messages", () => {
  const productsPage = readFileSync(new URL("../../app/(app)/dashboard/products/page.tsx", import.meta.url), "utf8")
  const businessPage = readFileSync(new URL("../../app/(app)/dashboard/business/BusinessProfileClient.tsx", import.meta.url), "utf8")
  const settingsPage = readFileSync(new URL("../../app/(app)/dashboard/settings/SettingsClient.tsx", import.meta.url), "utf8")
  const visibilityPage = readFileSync(new URL("../../app/(app)/dashboard/settings/invoice-visibility/visibilityClient.tsx", import.meta.url), "utf8")

  assert.match(productsPage, /await workspaceDomain\.saveProducts/)
  assert.match(productsPage, /Saved to Cloud/)
  assert.match(productsPage, /Sync Failed - Retry/)
  assert.match(businessPage, /await setBusiness\(nextProfile\)/)
  assert.match(businessPage, /Saved to Cloud/)
  assert.match(settingsPage, /await workspaceDomain\.saveSettingsPatches/)
  assert.match(settingsPage, /Saved to Cloud/)
  assert.match(visibilityPage, /await updateInvoiceVisibility/)
  assert.match(visibilityPage, /Sync Failed - Retry/)
})

runCase("workspace has a unified sync status surface", () => {
  const statusSource = readFileSync(new URL("../../lib/workspaceSyncStatus.ts", import.meta.url), "utf8")
  const dataAccess = readFileSync(new URL("../../lib/dataAccess.ts", import.meta.url), "utf8")
  const coordinator = readFileSync(new URL("../../lib/workspaceSyncCoordinator.ts", import.meta.url), "utf8")
  const runtime = readFileSync(new URL("../../lib/workspaceRuntime.ts", import.meta.url), "utf8")
  const dashboardLayout = readFileSync(new URL("../../app/(app)/dashboard/layout.tsx", import.meta.url), "utf8")
  const indicator = readFileSync(new URL("../../components/WorkspaceSyncStatusIndicator.tsx", import.meta.url), "utf8")

  for (const label of ["Saving", "Saved to Cloud", "Pending Sync", "Sync Failed - Retry", "Conflict resolved"]) {
    assert.match(`${statusSource}\n${dataAccess}\n${coordinator}`, new RegExp(label))
  }
  assert.match(statusSource, /"conflict"/)
  assert.match(runtime, /publishWorkspaceSyncStatus/)
  assert.match(dataAccess, /emitWorkspaceSyncStatus/)
  assert.match(coordinator, /emitWorkspaceSyncStatus/)
  assert.match(dashboardLayout, /WorkspaceSyncStatusIndicator/)
  assert.match(indicator, /subscribeWorkspaceSyncStatus/)
})

runCase("account lifecycle cleanup is registry-driven and lock-protected", () => {
  const registry = readFileSync(new URL("../../lib/server/accountOwnershipRegistry.ts", import.meta.url), "utf8")
  const lifecycle = readFileSync(new URL("../../lib/server/accountLifecycle.ts", import.meta.url), "utf8")
  const route = readFileSync(new URL("../../app/api/account-lifecycle/route.ts", import.meta.url), "utf8")
  const workspaceRoute = readFileSync(new URL("../../app/api/workspace/route.ts", import.meta.url), "utf8")
  const pdfRoute = readFileSync(new URL("../../app/api/invoice-pdf-export/route.ts", import.meta.url), "utf8")
  const settingsPage = readFileSync(new URL("../../app/(app)/dashboard/settings/SettingsClient.tsx", import.meta.url), "utf8")
  const userStore = readFileSync(new URL("../../lib/userStore.ts", import.meta.url), "utf8")
  const retryQueue = readFileSync(new URL("../../lib/syncRetryQueue.ts", import.meta.url), "utf8")

  for (const table of [
    "profiles",
    "user_settings",
    "products",
    "customers",
    "invoices",
    "invoice_items",
    "invoice_history",
    "invoice_sequences",
    "invoice_pdf_exports",
  ]) {
    assert.match(registry, new RegExp(`"${table}"`))
  }
  assert.match(registry, /LOGO_BUCKET/)
  assert.match(registry, /INVOICE_PDF_BUCKET/)
  assert.match(registry, /ACCOUNT_SYNC_RETRY_QUEUE_KEY/)
  assert.match(registry, /PRESERVED_RESET_SETTINGS_FIELDS/)
  assert.match(lifecycle, /account_deleting: action === "delete"/)
  assert.match(lifecycle, /deleteUser\(user\.id\)/)
  assert.match(lifecycle, /recreateResetDefaults/)
  assert.match(lifecycle, /onboarding_completed: true/)
  assert.match(lifecycle, /subscription_plan_id: preserved\.subscription_plan_id/)
  assert.match(route, /op === "requestOtp"/)
  assert.match(route, /resetWorkspaceAccount/)
  assert.match(route, /deleteWorkspaceAccount/)
  assert.match(workspaceRoute, /assertAccountLifecycleUnlocked/)
  assert.match(pdfRoute, /assertAccountLifecycleUnlocked/)
  assert.match(settingsPage, /We recommend exporting your invoices and customer data before continuing/)
  assert.match(settingsPage, /Permanently Delete Account/)
  assert.match(settingsPage, /Confirm Reset/)
  assert.match(settingsPage, /verifyLifecyclePassword/)
  assert.match(userStore, /clearUserWorkspaceLocalState/)
  assert.match(retryQueue, /clearLocalStorageSyncRetryQueue/)
})

runCase("workspace repository surfaces Supabase persistence failures", () => {
  const repository = readFileSync(new URL("../../lib/supabase/workspaceRepository.ts", import.meta.url), "utf8")

  assert.match(repository, /upsertProductsFromCache/)
  assert.match(repository, /if \(error\) throw error/)
  assert.match(repository, /upsertCustomersFromCache/)
  assert.match(repository, /upsertProfileFromCache/)
})

runCase("permanent development workspace tooling is scoped and guarded", () => {
  const pkg = readFileSync(new URL("../../package.json", import.meta.url), "utf8")
  const core = readFileSync(new URL("../../scripts/dev-workspace-core.mjs", import.meta.url), "utf8")
  const seed = readFileSync(new URL("../../scripts/seed-dev-workspace.mjs", import.meta.url), "utf8")
  const reset = readFileSync(new URL("../../scripts/reset-dev-workspace.mjs", import.meta.url), "utf8")
  const validate = readFileSync(new URL("../../scripts/validate-dev-workspace.mjs", import.meta.url), "utf8")
  const createAccounts = readFileSync(new URL("../../scripts/create-dev-workspace-accounts.mjs", import.meta.url), "utf8")
  const docs = readFileSync(new URL("../../docs/PERMANENT-DEVELOPMENT-WORKSPACE.md", import.meta.url), "utf8")
  const playwright = readFileSync(new URL("../../playwright.config.ts", import.meta.url), "utf8")
  const e2e = readFileSync(new URL("../../tests/e2e/supabase-dev-workspace.spec.ts", import.meta.url), "utf8")

  for (const command of [
    "seed-dev-workspace",
    "reset-dev-workspace",
    "validate-dev-workspace",
    "dev-workspace:create-accounts",
  ]) {
    assert.match(pkg, new RegExp(`"${command}"`))
  }

  for (const name of [
    "DEV_WORKSPACE_EMAIL",
    "DEV_WORKSPACE_PASSWORD",
    "DEV_WORKSPACE_USER_ID",
    "DEV_WORKSPACE_SECONDARY_EMAIL",
    "DEV_WORKSPACE_SECONDARY_PASSWORD",
    "DEV_WORKSPACE_SECONDARY_USER_ID",
    "DEV_WORKSPACE_CONFIRM",
  ]) {
    assert.match(docs, new RegExp(`${name}=`))
    assert.match(core, new RegExp(name))
  }

  assert.match(core, /CONFIRM_VALUE = "EASYBILL_DEV_WORKSPACE"/)
  assert.match(core, /loadEnvFiles/)
  assert.match(core, /\.env\.local/)
  assert.match(core, /env\.local/)
  assert.match(core, /assertAccountMatches/)
  assert.match(core, /clearWorkspaceRows/)
  assert.match(core, /\.eq\("user_id", userId\)/)
  assert.doesNotMatch(core, /\.from\("[^"]+"\)\.delete\(\)(?!\.eq|\.in)/)
  assert.match(core, /deleteUserStorage/)
  assert.match(core, /createAnon/)
  assert.match(core, /secondaryCanSeePrimaryProduct/)
  assert.match(seed, /--include-secondary/)
  assert.match(reset, /--secondary/)
  assert.match(validate, /validateWorkspace/)
  assert.match(createAccounts, /ensureAuthAccount/)
  assert.match(docs, /Secondary account: read-only-for-normal-testing isolation account/)
  assert.match(playwright, /PLAYWRIGHT_AUTH_MODE/)
  assert.match(playwright, /supabase-dev-workspace/)
  assert.match(e2e, /DEV_WORKSPACE_SECONDARY_EMAIL/)
  assert.match(e2e, /does not use the primary seeded baseline/)
})

runCase("Playwright browser verification framework exposes Supabase confidence gates", () => {
  const pkg = readFileSync(new URL("../../package.json", import.meta.url), "utf8")
  const config = readFileSync(new URL("../../playwright.config.ts", import.meta.url), "utf8")
  const runner = readFileSync(new URL("../../scripts/run-playwright.mjs", import.meta.url), "utf8")
  const helpers = readFileSync(new URL("../../tests/e2e/supabaseHelpers.ts", import.meta.url), "utf8")
  const workspaceDocs = readFileSync(new URL("../../docs/PERMANENT-DEVELOPMENT-WORKSPACE.md", import.meta.url), "utf8")
  const releaseDocs = readFileSync(new URL("../../docs/RELEASE-CHECKLIST.md", import.meta.url), "utf8")

  for (const command of [
    "test:e2e:local",
    "test:e2e:supabase",
    "test:e2e:supabase:desktop",
    "test:e2e:supabase:mobile",
    "test:e2e:supabase:auth",
    "test:e2e:supabase:invoices",
    "test:e2e:supabase:pdf",
    "test:e2e:supabase:templates",
    "test:e2e:supabase:sync",
    "test:e2e:supabase:lifecycle",
    "confidence:deployment",
  ]) {
    assert.match(pkg, new RegExp(`"${command}"`))
  }

  assert.match(config, /supabaseSpecPattern/)
  assert.match(config, /mobile-chromium/)
  assert.match(config, /mobile-webkit/)
  assert.match(config, /PLAYWRIGHT_USE_EXISTING_SERVER/)
  assert.match(config, /NEXT_DIST_DIR/)
  assert.match(runner, /PLAYWRIGHT_AUTH_MODE: mode/)
  assert.match(runner, /valuesAfter\("--project"\)/)

  for (const helper of [
    "installBrowserGuards",
    "expectNonEmptyPdfDownload",
    "captureWorkflowScreenshot",
    "signedInPage",
    "createTempProduct",
  ]) {
    assert.match(helpers, new RegExp(helper))
  }

  for (const spec of [
    "auth.supabase.spec.ts",
    "dashboard.supabase.spec.ts",
    "business-profile.supabase.spec.ts",
    "products.supabase.spec.ts",
    "customers.supabase.spec.ts",
    "invoices.supabase.spec.ts",
    "templates-fonts.supabase.spec.ts",
    "pdf-downloads.supabase.spec.ts",
    "sync-cross-device.supabase.spec.ts",
    "rls-isolation.supabase.spec.ts",
    "account-lifecycle.disposable.spec.ts",
    "mobile.supabase.spec.ts",
  ]) {
    const source = readFileSync(new URL(`../../tests/e2e/${spec}`, import.meta.url), "utf8")
    assert.match(source, /installBrowserGuards|signedInPage/)
    assert.match(source, /captureWorkflowScreenshot|expect|createTempProduct|DEV_WORKSPACE_SECONDARY_EMAIL/)
  }

  assert.match(workspaceDocs, /Deployment Confidence Gate/)
  assert.match(workspaceDocs, /PLAYWRIGHT_USE_EXISTING_SERVER=1/)
  assert.match(releaseDocs, /Deployment Confidence Gate/)
  assert.match(releaseDocs, /test:e2e:supabase:\*/)
})

console.log("All regression checks passed.")








