import {
  createInvoiceHistoryEntry,
  normalizeInvoiceRecord,
  normalizeInvoiceStorePayload,
  replaceInvoiceById,
  serializeInvoiceStore,
  type InvoiceRecord,
} from "./invoice"
import type { RelationalCacheKey as KvKey } from "./supabase/relationalSync"
import type { WorkspaceCache } from "./workspaceCache"
import type { SyncService } from "./syncService"
import type { ValidationResult } from "./workspaceValidation"

export type WorkspaceAuth = {
  getUserId(): string | null
  isCloudMode(): boolean
}

export type WorkspaceEvents = {
  emitWorkspaceWrite(key: KvKey): void
  emitWorkspaceSyncStatus?(status: {
    state: "saving" | "synced" | "pending" | "error" | "conflict"
    label: string
    key?: KvKey | "workspace"
    detail?: string
  }): void
}

export type WorkspaceRepositoryFacade = {
  listInvoices(userId: string): Promise<InvoiceRecord[]>
  createInvoiceRecord(
    userId: string,
    invoice: InvoiceRecord,
    options?: { duplicateSourceInvoiceNumber?: string }
  ): Promise<Partial<InvoiceRecord>>
  updateInvoiceRecord(userId: string, invoice: InvoiceRecord): Promise<void>
  softDeleteInvoiceRecord(userId: string, invoiceId: string): Promise<boolean>
}

export type WorkspaceDataAccessValidators = {
  validateProfile?(rawValue: string): ValidationResult
  validateSettingsPatch?(key: KvKey, rawValue: string): ValidationResult
  validateProducts?(rawValue: string): ValidationResult
  validateCustomers?(rawValue: string): ValidationResult
  validateInvoice?(invoice: InvoiceRecord): ValidationResult
}

export type WorkspaceDataAccess = {
  getProfile(): Promise<string | null>
  saveProfile(profileData: string): Promise<void>
  getSettings(): Promise<Record<string, string | null>>
  saveSettingsPatch(key: KvKey, value: string): Promise<void>
  listProducts(): Promise<unknown[]>
  saveProduct(productsData: string): Promise<void>
  deleteProduct(productsData: string): Promise<void>
  listCustomers(): Promise<unknown[]>
  saveCustomer(customersData: string): Promise<void>
  deleteCustomer(customersData: string): Promise<void>
  listInvoices(): Promise<InvoiceRecord[]>
  createInvoice(invoice: InvoiceRecord, options?: { duplicateSourceInvoiceNumber?: string }): Promise<InvoiceRecord>
  updateInvoice(invoice: InvoiceRecord): Promise<InvoiceRecord>
  softDeleteInvoice(invoiceId: string): Promise<boolean>
  fetchInvoices(): Promise<InvoiceRecord[]>
  setKvItem(key: KvKey, value: string): Promise<void>
  removeKvItem(key: KvKey): Promise<void>
  updateBusinessProfile(profileData: string): Promise<void>
  updateSettings(key: KvKey, value: string): Promise<void>
  updateProducts(productsData: string): Promise<void>
  updateCustomers(customersData: string): Promise<void>
}

export type WorkspaceDataAccessOptions = {
  cache: WorkspaceCache
  sync: SyncService
  repository: WorkspaceRepositoryFacade
  auth: WorkspaceAuth
  events: WorkspaceEvents
  clock?: () => Date
  validators?: WorkspaceDataAccessValidators
}

const SETTINGS_KEYS: KvKey[] = [
  "dateFormat",
  "amountFormat",
  "showDecimals",
  "invoicePrefix",
  "invoicePadding",
  "invoiceStartNumber",
  "resetYearly",
  "invoiceResetMonthDay",
  "currencySymbol",
  "currencyPosition",
  "invoiceVisibility",
]

function parseArray(raw: string | null) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readInvoicesWithDeleted(raw: string | null) {
  return normalizeInvoiceStorePayload(raw ? JSON.parse(raw) : []).store.invoices
}

function readActiveInvoices(raw: string | null) {
  return readInvoicesWithDeleted(raw).filter((invoice) => !invoice.deleted_at)
}

function assertValid(result: ValidationResult | undefined) {
  if (result && !result.ok) throw new Error(result.message || "Validation failed.")
}

function requireUser(auth: WorkspaceAuth) {
  const userId = auth.getUserId()
  if (!userId) throw new Error("No active workspace user.")
  return userId
}

export function createWorkspaceDataAccess({
  cache,
  sync,
  repository,
  auth,
  events,
  clock = () => new Date(),
  validators = {},
}: WorkspaceDataAccessOptions): WorkspaceDataAccess {
  async function writeKey(key: KvKey, value: string) {
    const userId = requireUser(auth)
    if (auth.isCloudMode()) {
      events.emitWorkspaceSyncStatus?.({ state: "saving", label: "Saving", key })
      try {
        await sync.flushPush(userId, key, value)
        cache.set(key, value)
        events.emitWorkspaceWrite(key)
        events.emitWorkspaceSyncStatus?.({ state: "synced", label: "Saved to Cloud", key })
      } catch (error) {
        events.emitWorkspaceSyncStatus?.({
          state: "error",
          label: "Sync Failed - Retry",
          key,
          detail: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
      return
    }

    cache.set(key, value)
    events.emitWorkspaceWrite(key)
    events.emitWorkspaceSyncStatus?.({ state: "pending", label: "Pending Sync", key })
  }

  async function removeKey(key: KvKey) {
    const userId = requireUser(auth)
    if (auth.isCloudMode()) {
      events.emitWorkspaceSyncStatus?.({ state: "saving", label: "Saving", key })
      try {
        await sync.flushDelete(userId, key)
        cache.remove(key)
        events.emitWorkspaceWrite(key)
        events.emitWorkspaceSyncStatus?.({ state: "synced", label: "Saved to Cloud", key })
      } catch (error) {
        events.emitWorkspaceSyncStatus?.({
          state: "error",
          label: "Sync Failed - Retry",
          key,
          detail: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
      return
    }

    cache.remove(key)
    events.emitWorkspaceWrite(key)
    events.emitWorkspaceSyncStatus?.({ state: "pending", label: "Pending Sync", key })
  }

  return {
    async getProfile() {
      return cache.get("businessProfile")
    },
    async saveProfile(profileData) {
      assertValid(validators.validateProfile?.(profileData))
      await writeKey("businessProfile", profileData)
    },
    async getSettings() {
      return Object.fromEntries(SETTINGS_KEYS.map((key) => [key, cache.get(key)]))
    },
    async saveSettingsPatch(key, value) {
      assertValid(validators.validateSettingsPatch?.(key, value))
      await writeKey(key, value)
    },
    async listProducts() {
      return parseArray(cache.get("products")).filter((row) => !(row as Record<string, unknown>).deleted_at)
    },
    async saveProduct(productsData) {
      assertValid(validators.validateProducts?.(productsData))
      await writeKey("products", productsData)
    },
    async deleteProduct(productsData) {
      assertValid(validators.validateProducts?.(productsData))
      await writeKey("products", productsData)
    },
    async listCustomers() {
      return parseArray(cache.get("customers")).filter((row) => !(row as Record<string, unknown>).deleted_at)
    },
    async saveCustomer(customersData) {
      assertValid(validators.validateCustomers?.(customersData))
      await writeKey("customers", customersData)
    },
    async deleteCustomer(customersData) {
      assertValid(validators.validateCustomers?.(customersData))
      await writeKey("customers", customersData)
    },
    async listInvoices() {
      return readActiveInvoices(cache.get("invoices"))
    },
    async createInvoice(invoice, options) {
      assertValid(validators.validateInvoice?.(invoice))
      const userId = requireUser(auth)
      const remoteMeta = auth.isCloudMode()
        ? await repository.createInvoiceRecord(userId, invoice, options)
        : {}
      const createdInvoice = normalizeInvoiceRecord({
        ...invoice,
        ...remoteMeta,
        id: String(remoteMeta.id || invoice.id),
        invoiceNumber: String(remoteMeta.invoiceNumber || invoice.invoiceNumber),
        createdAt: typeof remoteMeta.createdAt === "string" ? remoteMeta.createdAt : invoice.createdAt || clock().toISOString(),
        history: [
          createInvoiceHistoryEntry("created", "Invoice created"),
          ...(options?.duplicateSourceInvoiceNumber
            ? [createInvoiceHistoryEntry("duplicated", `Duplicated from ${options.duplicateSourceInvoiceNumber}`)]
            : []),
        ],
      })

      const invoices = readInvoicesWithDeleted(cache.get("invoices"))
      cache.set("invoices", serializeInvoiceStore([...invoices, createdInvoice]))
      events.emitWorkspaceWrite("invoices")
      if (!auth.isCloudMode()) sync.schedulePush(userId, "invoices")
      return createdInvoice
    },
    async updateInvoice(invoice) {
      assertValid(validators.validateInvoice?.(invoice))
      const userId = requireUser(auth)
      const updatedAt = clock().toISOString()
      const nextInvoice = normalizeInvoiceRecord({
        ...invoice,
        updated_at: updatedAt,
        sync_status: auth.isCloudMode() ? "synced" : "pending",
        last_synced_at: auth.isCloudMode() ? updatedAt : invoice.last_synced_at,
      })
      if (auth.isCloudMode()) {
        await repository.updateInvoiceRecord(userId, nextInvoice)
      }
      const next = replaceInvoiceById(readInvoicesWithDeleted(cache.get("invoices")), nextInvoice)
      if (!next) throw new Error("Invoice not found.")
      cache.set("invoices", serializeInvoiceStore(next))
      events.emitWorkspaceWrite("invoices")
      if (!auth.isCloudMode()) sync.schedulePush(userId, "invoices")
      return nextInvoice
    },
    async softDeleteInvoice(invoiceId) {
      const userId = requireUser(auth)
      const deleted = auth.isCloudMode() ? await repository.softDeleteInvoiceRecord(userId, invoiceId) : true
      const deletedAt = clock().toISOString()
      const next = readInvoicesWithDeleted(cache.get("invoices")).map((invoice) =>
        invoice.id === invoiceId
          ? { ...invoice, deleted_at: deletedAt, updated_at: deletedAt, sync_status: "pending" }
          : invoice
      )
      cache.set("invoices", serializeInvoiceStore(next))
      events.emitWorkspaceWrite("invoices")
      if (!auth.isCloudMode()) sync.schedulePush(userId, "invoices")
      return deleted
    },
    async fetchInvoices() {
      const userId = auth.getUserId()
      if (!userId || !auth.isCloudMode()) return readActiveInvoices(cache.get("invoices"))
      const invoices = await repository.listInvoices(userId)
      cache.set("invoices", serializeInvoiceStore(invoices))
      events.emitWorkspaceWrite("invoices")
      return invoices
    },
    setKvItem(key, value) {
      return writeKey(key, value)
    },
    removeKvItem(key) {
      return removeKey(key)
    },
    updateBusinessProfile(profileData) {
      return this.saveProfile(profileData)
    },
    updateSettings(key, value) {
      return this.saveSettingsPatch(key, value)
    },
    updateProducts(productsData) {
      return this.saveProduct(productsData)
    },
    updateCustomers(customersData) {
      return this.saveCustomer(customersData)
    },
  }
}
