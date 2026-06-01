import { normalizeInvoiceRecord, normalizeInvoiceStorePayload, serializeInvoiceStore } from "./invoice";
import { revealSensitiveFields } from "./sensitiveData";
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
function productKey(row) {
    return String(row.id || `${row.name || ""}|${row.hsn || ""}|${row.unit || ""}`).toLowerCase();
}
function customerKey(row) {
    return String(row.id || row.identity_key || `${row.phone || ""}|${row.gst || ""}|${row.name || ""}`).toLowerCase();
}
function changedAt(row) {
    const updatedAt = typeof row.updated_at === "string" ? Date.parse(row.updated_at) || 0 : 0;
    const deletedAt = typeof row.deleted_at === "string" ? Date.parse(row.deleted_at) || 0 : 0;
    return Math.max(updatedAt, deletedAt);
}
function shouldApplyRemote(local, remote) {
    if (!local)
        return true;
    const localChanged = changedAt(local);
    const remoteChanged = changedAt(remote);
    return remoteChanged >= localChanged;
}
export function mergeProductsCache(rawValue, remoteRows) {
    const current = safeJsonParse(rawValue, []);
    const byKey = new Map(current.map((row) => [productKey(row), row]));
    for (const row of remoteRows) {
        const mapped = {
            id: row.id || undefined,
            updated_at: row.updated_at || undefined,
            deleted_at: row.deleted_at || undefined,
            sync_status: row.sync_status || undefined,
            last_synced_at: row.last_synced_at || undefined,
            name: row.name || "",
            hsn: row.hsn || "",
            unit: row.unit || "",
            price: Number(row.price || 0),
            cgst: Number(row.cgst || 0),
            sgst: Number(row.sgst || 0),
            igst: Number(row.igst || 0),
        };
        const key = productKey(mapped);
        if (!shouldApplyRemote(byKey.get(key), mapped))
            continue;
        if (row.deleted_at)
            byKey.delete(key);
        else
            byKey.set(key, mapped);
    }
    return JSON.stringify(Array.from(byKey.values()));
}
export function mergeCustomersCache(rawValue, remoteRows) {
    const current = safeJsonParse(rawValue, []);
    const byKey = new Map(current.map((row) => [customerKey(row), row]));
    for (const row of remoteRows) {
        const mapped = {
            id: row.id || undefined,
            identity_key: row.identity_key || undefined,
            identity_hash: row.identity_hash || undefined,
            phone_hash: row.phone_hash || undefined,
            gst_hash: row.gst_hash || undefined,
            updated_at: row.updated_at || undefined,
            deleted_at: row.deleted_at || undefined,
            sync_status: row.sync_status || undefined,
            last_synced_at: row.last_synced_at || undefined,
            name: row.name || "",
            phone: row.phone || "",
            email: row.email || "",
            gst: row.gst || "",
            address: row.address || "",
        };
        const key = customerKey(mapped);
        if (!shouldApplyRemote(byKey.get(key), mapped))
            continue;
        if (row.deleted_at)
            byKey.delete(key);
        else
            byKey.set(key, mapped);
    }
    return JSON.stringify(Array.from(byKey.values()));
}
export function mergeInvoicesCache(rawValue, remoteRows) {
    const parsed = safeJsonParse(rawValue, []);
    const { store } = normalizeInvoiceStorePayload(parsed);
    const byId = new Map(store.invoices.map((invoice) => [invoice.id, invoice]));
    for (const row of remoteRows) {
        const safeRow = revealSensitiveFields({
            client_name: row.client_name || "",
            client_phone: row.client_phone || "",
            client_email: row.client_email || "",
            client_gst: row.client_gst || "",
            client_address: row.client_address || "",
        }, ["client_phone", "client_gst"]);
        const invoice = normalizeInvoiceRecord({
            id: row.id,
            invoiceNumber: row.invoice_number,
            createdAt: row.created_at || undefined,
            numberingModeAtCreation: row.numbering_mode_at_creation || "continuous",
            resetMonthDayAtCreation: row.reset_month_day_at_creation || null,
            sequenceWindowStart: row.sequence_window_start || null,
            sequenceWindowEnd: row.sequence_window_end || null,
            clientName: String(safeRow.client_name || ""),
            clientPhone: String(safeRow.client_phone || ""),
            clientPhoneHash: row.client_phone_hash || undefined,
            clientEmail: String(safeRow.client_email || ""),
            clientGST: String(safeRow.client_gst || ""),
            clientGstHash: row.client_gst_hash || undefined,
            customerIdentityKey: row.customer_identity_key || undefined,
            clientAddress: String(safeRow.client_address || ""),
            date: row.invoice_date,
            customDetails: Array.isArray(row.custom_details) ? row.custom_details : [],
            items: (row.invoice_items || [])
                .filter((item) => !item.deleted_at)
                .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
                .map((item) => ({
                product: item.product || "",
                hsn: item.hsn || "",
                qty: Number(item.qty || 0),
                unit: item.unit || "",
                price: Number(item.price || 0),
                cgst: Number(item.cgst || 0),
                sgst: Number(item.sgst || 0),
                igst: Number(item.igst || 0),
                total: Number(item.total || 0),
            })),
            notes: row.notes || "",
            status: row.status || "draft",
            history: (row.invoice_history || [])
                .filter((entry) => !entry.deleted_at)
                .sort((a, b) => String(a.happened_at || "").localeCompare(String(b.happened_at || "")))
                .map((entry) => ({
                id: entry.id || "",
                type: entry.event_type === "edited" ||
                    entry.event_type === "exported" ||
                    entry.event_type === "status" ||
                    entry.event_type === "duplicated"
                    ? entry.event_type
                    : "created",
                label: entry.label || "Invoice updated",
                at: entry.happened_at || new Date().toISOString(),
            })),
            grandTotal: Number(row.grand_total || 0),
        });
        const mapped = {
            ...invoice,
            updated_at: row.updated_at || undefined,
            deleted_at: row.deleted_at || undefined,
            sync_status: row.sync_status || undefined,
            last_synced_at: row.last_synced_at || undefined,
        };
        if (!shouldApplyRemote(byId.get(row.id), mapped))
            continue;
        if (row.deleted_at)
            byId.delete(row.id);
        else
            byId.set(row.id, mapped);
    }
    return serializeInvoiceStore(Array.from(byId.values()));
}
