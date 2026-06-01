import { createInvoiceHistoryEntry, normalizeInvoiceRecord, normalizeInvoiceStorePayload, replaceInvoiceById, serializeInvoiceStore, } from "./invoice";
const SETTINGS_KEYS = [
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
];
function parseArray(raw) {
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
function readInvoicesWithDeleted(raw) {
    return normalizeInvoiceStorePayload(raw ? JSON.parse(raw) : []).store.invoices;
}
function readActiveInvoices(raw) {
    return readInvoicesWithDeleted(raw).filter((invoice) => !invoice.deleted_at);
}
function assertValid(result) {
    if (result && !result.ok)
        throw new Error(result.message || "Validation failed.");
}
function requireUser(auth) {
    const userId = auth.getUserId();
    if (!userId)
        throw new Error("No active workspace user.");
    return userId;
}
export function createWorkspaceDataAccess({ cache, sync, repository, auth, events, clock = () => new Date(), validators = {}, }) {
    async function writeKey(key, value) {
        const userId = requireUser(auth);
        if (auth.isCloudMode()) {
            events.emitWorkspaceSyncStatus?.({ state: "saving", label: "Saving", key });
            try {
                await sync.flushPush(userId, key, value);
                cache.set(key, value);
                events.emitWorkspaceWrite(key);
                events.emitWorkspaceSyncStatus?.({ state: "synced", label: "Saved to Cloud", key });
            }
            catch (error) {
                events.emitWorkspaceSyncStatus?.({
                    state: "error",
                    label: "Sync Failed - Retry",
                    key,
                    detail: error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
            return;
        }
        cache.set(key, value);
        events.emitWorkspaceWrite(key);
        events.emitWorkspaceSyncStatus?.({ state: "pending", label: "Pending Sync", key });
    }
    async function removeKey(key) {
        const userId = requireUser(auth);
        if (auth.isCloudMode()) {
            events.emitWorkspaceSyncStatus?.({ state: "saving", label: "Saving", key });
            try {
                await sync.flushDelete(userId, key);
                cache.remove(key);
                events.emitWorkspaceWrite(key);
                events.emitWorkspaceSyncStatus?.({ state: "synced", label: "Saved to Cloud", key });
            }
            catch (error) {
                events.emitWorkspaceSyncStatus?.({
                    state: "error",
                    label: "Sync Failed - Retry",
                    key,
                    detail: error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
            return;
        }
        cache.remove(key);
        events.emitWorkspaceWrite(key);
        events.emitWorkspaceSyncStatus?.({ state: "pending", label: "Pending Sync", key });
    }
    return {
        async getProfile() {
            return cache.get("businessProfile");
        },
        async saveProfile(profileData) {
            assertValid(validators.validateProfile?.(profileData));
            await writeKey("businessProfile", profileData);
        },
        async getSettings() {
            return Object.fromEntries(SETTINGS_KEYS.map((key) => [key, cache.get(key)]));
        },
        async saveSettingsPatch(key, value) {
            assertValid(validators.validateSettingsPatch?.(key, value));
            await writeKey(key, value);
        },
        async listProducts() {
            return parseArray(cache.get("products")).filter((row) => !row.deleted_at);
        },
        async saveProduct(productsData) {
            assertValid(validators.validateProducts?.(productsData));
            await writeKey("products", productsData);
        },
        async deleteProduct(productsData) {
            assertValid(validators.validateProducts?.(productsData));
            await writeKey("products", productsData);
        },
        async listCustomers() {
            return parseArray(cache.get("customers")).filter((row) => !row.deleted_at);
        },
        async saveCustomer(customersData) {
            assertValid(validators.validateCustomers?.(customersData));
            await writeKey("customers", customersData);
        },
        async deleteCustomer(customersData) {
            assertValid(validators.validateCustomers?.(customersData));
            await writeKey("customers", customersData);
        },
        async listInvoices() {
            return readActiveInvoices(cache.get("invoices"));
        },
        async createInvoice(invoice, options) {
            assertValid(validators.validateInvoice?.(invoice));
            const userId = requireUser(auth);
            const remoteMeta = auth.isCloudMode()
                ? await repository.createInvoiceRecord(userId, invoice, options)
                : {};
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
            });
            const invoices = readInvoicesWithDeleted(cache.get("invoices"));
            cache.set("invoices", serializeInvoiceStore([...invoices, createdInvoice]));
            events.emitWorkspaceWrite("invoices");
            if (!auth.isCloudMode())
                sync.schedulePush(userId, "invoices");
            return createdInvoice;
        },
        async updateInvoice(invoice) {
            assertValid(validators.validateInvoice?.(invoice));
            const userId = requireUser(auth);
            const updatedAt = clock().toISOString();
            const nextInvoice = normalizeInvoiceRecord({
                ...invoice,
                updated_at: updatedAt,
                sync_status: auth.isCloudMode() ? "synced" : "pending",
                last_synced_at: auth.isCloudMode() ? updatedAt : invoice.last_synced_at,
            });
            if (auth.isCloudMode()) {
                await repository.updateInvoiceRecord(userId, nextInvoice);
            }
            const next = replaceInvoiceById(readInvoicesWithDeleted(cache.get("invoices")), nextInvoice);
            if (!next)
                throw new Error("Invoice not found.");
            cache.set("invoices", serializeInvoiceStore(next));
            events.emitWorkspaceWrite("invoices");
            if (!auth.isCloudMode())
                sync.schedulePush(userId, "invoices");
            return nextInvoice;
        },
        async softDeleteInvoice(invoiceId) {
            const userId = requireUser(auth);
            const deleted = auth.isCloudMode() ? await repository.softDeleteInvoiceRecord(userId, invoiceId) : true;
            const deletedAt = clock().toISOString();
            const next = readInvoicesWithDeleted(cache.get("invoices")).map((invoice) => invoice.id === invoiceId
                ? { ...invoice, deleted_at: deletedAt, updated_at: deletedAt, sync_status: "pending" }
                : invoice);
            cache.set("invoices", serializeInvoiceStore(next));
            events.emitWorkspaceWrite("invoices");
            if (!auth.isCloudMode())
                sync.schedulePush(userId, "invoices");
            return deleted;
        },
        async fetchInvoices() {
            const userId = auth.getUserId();
            if (!userId || !auth.isCloudMode())
                return readActiveInvoices(cache.get("invoices"));
            const invoices = await repository.listInvoices(userId);
            cache.set("invoices", serializeInvoiceStore(invoices));
            events.emitWorkspaceWrite("invoices");
            return invoices;
        },
        setKvItem(key, value) {
            return writeKey(key, value);
        },
        removeKvItem(key) {
            return removeKey(key);
        },
        updateBusinessProfile(profileData) {
            return this.saveProfile(profileData);
        },
        updateSettings(key, value) {
            return this.saveSettingsPatch(key, value);
        },
        updateProducts(productsData) {
            return this.saveProduct(productsData);
        },
        updateCustomers(customersData) {
            return this.saveCustomer(customersData);
        },
    };
}
