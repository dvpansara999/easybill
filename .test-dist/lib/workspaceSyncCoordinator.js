import { normalizeInvoiceStorePayload, serializeInvoiceStore } from "./invoice";
import { mergeCustomersCache, mergeProductsCache } from "./workspaceCacheMerge";
function safeJsonParse(raw, fallback) {
    if (!raw)
        return fallback;
    try {
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function invoiceChangedAt(invoice) {
    return Date.parse(invoice.updated_at || invoice.deleted_at || invoice.createdAt || "") || 0;
}
function mergeInvoiceSnapshot(currentRaw, remoteRaw) {
    const current = normalizeInvoiceStorePayload(safeJsonParse(currentRaw, [])).store.invoices;
    const remote = normalizeInvoiceStorePayload(safeJsonParse(remoteRaw, [])).store.invoices;
    const byId = new Map(current.map((invoice) => [invoice.id, invoice]));
    for (const remoteInvoice of remote) {
        const localInvoice = byId.get(remoteInvoice.id);
        if (!localInvoice || invoiceChangedAt(remoteInvoice) >= invoiceChangedAt(localInvoice)) {
            byId.set(remoteInvoice.id, remoteInvoice);
        }
    }
    return serializeInvoiceStore(Array.from(byId.values()));
}
export function createWorkspaceSyncCoordinator({ auth, cache, repository, syncService, events, alerts, logger = console, clock = () => new Date(), focusResyncMinMs = 300_000, }) {
    let lastUserId = null;
    let lastFocusSyncAt = 0;
    const syncInFlight = new Map();
    function mergeSnapshotRows(userId, rows) {
        return rows.map((row) => {
            if (row.key === "products") {
                return {
                    ...row,
                    value: mergeProductsCache(cache.getUserItem("products", userId), safeJsonParse(row.value, [])),
                };
            }
            if (row.key === "customers") {
                return {
                    ...row,
                    value: mergeCustomersCache(cache.getUserItem("customers", userId), safeJsonParse(row.value, [])),
                };
            }
            if (row.key === "invoices") {
                return {
                    ...row,
                    value: mergeInvoiceSnapshot(cache.getUserItem("invoices", userId), row.value),
                };
            }
            return row;
        });
    }
    async function sync(userId, options = {}) {
        const existing = syncInFlight.get(userId);
        if (existing) {
            await existing;
            return;
        }
        const work = (async () => {
            lastFocusSyncAt = clock().getTime();
            events.emitWorkspaceSyncStatus?.({ state: "syncing", label: "Syncing", key: "workspace" });
            await repository.ensureSeed(userId);
            await syncService.replayQueued(userId);
            const watermark = cache.readWatermark(userId);
            const canIncremental = Boolean(options.incremental && watermark && cache.isHydrated(userId));
            const rows = canIncremental
                ? await repository.fetchChanges(userId, watermark, {
                    products: cache.getUserItem("products", userId),
                    customers: cache.getUserItem("customers", userId),
                    invoices: cache.getUserItem("invoices", userId),
                })
                : await repository.fetchSnapshot(userId);
            const rowsToPrime = canIncremental ? rows : mergeSnapshotRows(userId, rows);
            if (!canIncremental)
                cache.clearUser(userId);
            cache.primeUser(userId, rowsToPrime);
            cache.writeWatermark(userId, clock().toISOString());
            events.emitCloudSync();
            events.emitWorkspaceSyncStatus?.({ state: "synced", label: "Saved to Cloud", key: "workspace" });
        })();
        syncInFlight.set(userId, work);
        try {
            await work;
        }
        finally {
            syncInFlight.delete(userId);
        }
    }
    async function initialize() {
        const user = await auth.getCurrentUser();
        lastUserId = user?.id || null;
        auth.setActiveUserId(user?.id || null);
        if (!user) {
            events.emitAuthSyncInitialized();
            return;
        }
        await sync(user.id);
        events.emitAuthSyncInitialized();
    }
    function runBackground(label, callback) {
        void callback().catch((error) => {
            logger.warn(`Workspace sync ${label} failed`, error);
            events.emitWorkspaceSyncStatus?.({
                state: "error",
                label: "Sync Failed - Retry",
                key: "workspace",
                detail: error instanceof Error ? error.message : String(error),
            });
            events.emitAuthSyncInitialized();
        });
    }
    function handleAuthChange(user) {
        const nextId = user?.id || null;
        const prevId = lastUserId;
        const tabKnownId = auth.getActiveUserId();
        lastUserId = nextId;
        auth.setActiveUserId(nextId);
        if (prevId && prevId !== nextId)
            cache.clearUser(prevId);
        if (nextId) {
            runBackground("after auth change", () => sync(nextId));
        }
        else {
            events.emitCloudSync();
            events.emitWorkspaceSyncStatus?.({ state: "pending", label: "Pending Sync", key: "workspace" });
        }
        const switchedFromAnotherTab = Boolean(prevId && nextId && prevId !== nextId && tabKnownId === prevId);
        const signedOutFromAnotherTab = Boolean(prevId && !nextId && tabKnownId === prevId);
        if (switchedFromAnotherTab)
            alerts?.accountChanged();
        if (signedOutFromAnotherTab)
            alerts?.signedOut();
    }
    function handleFocus() {
        const id = lastUserId;
        if (!id)
            return;
        if (!events.isVisible())
            return;
        const now = clock().getTime();
        if (now - lastFocusSyncAt < focusResyncMinMs)
            return;
        runBackground("on focus", () => sync(id, { incremental: true }));
    }
    function start() {
        const authSubscription = auth.onAuthStateChange(handleAuthChange);
        const removeFocus = events.onFocus(handleFocus);
        runBackground("initialization", initialize);
        return () => {
            removeFocus();
            authSubscription.unsubscribe();
        };
    }
    return { start, sync };
}
