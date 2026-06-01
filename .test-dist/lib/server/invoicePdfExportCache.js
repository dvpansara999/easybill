export function extractFingerprintFromStoragePath(storagePath) {
    if (!storagePath)
        return null;
    const match = storagePath.match(/--fp-([a-f0-9]{24})--/i);
    return match?.[1]?.toLowerCase() || null;
}
export function extractInvoiceIdFromStoragePath(storagePath) {
    if (!storagePath)
        return null;
    const match = storagePath.match(/--iid-([a-z0-9_-]+?)(?=--)/i);
    return match?.[1] || null;
}
export function findMatchingCachedInvoiceExport(rows, invoiceRecordId) {
    return (rows?.find((row) => {
        const storedInvoiceId = row.invoice_id || extractInvoiceIdFromStoragePath(row.storage_path);
        return storedInvoiceId === invoiceRecordId;
    }) || null);
}
export function filterStaleInvoiceExportRows(rows, invoiceRecordId) {
    return (rows?.filter((row) => {
        const storedInvoiceId = row.invoice_id || extractInvoiceIdFromStoragePath(row.storage_path);
        return !storedInvoiceId || storedInvoiceId === invoiceRecordId;
    }) || []);
}
export function filterDuplicateInvoiceExportRows(rows) {
    const seen = new Set();
    const duplicates = [];
    const ordered = [...(rows || [])].sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    for (const row of ordered) {
        const invoiceId = row.invoice_id || extractInvoiceIdFromStoragePath(row.storage_path) || "";
        const fingerprint = row.source_fingerprint || extractFingerprintFromStoragePath(row.storage_path) || "";
        if (!invoiceId || !fingerprint)
            continue;
        const key = [invoiceId, fingerprint].join("::");
        if (seen.has(key)) {
            duplicates.push(row);
            continue;
        }
        seen.add(key);
    }
    return duplicates;
}
