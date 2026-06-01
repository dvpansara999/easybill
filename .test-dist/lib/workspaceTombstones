export function createWorkspaceRecordId(prefix) {
    const raw = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}_${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
export function activeRecords(records) {
    return records.filter((record) => !record.deleted_at);
}
export function ensureRecordIds(records, prefix) {
    return records.map((record) => ({
        ...record,
        id: record.id || createWorkspaceRecordId(prefix),
    }));
}
export function markRecordDeleted(records, id, deletedAt = new Date().toISOString()) {
    return records.map((record) => record.id === id
        ? {
            ...record,
            deleted_at: deletedAt,
            updated_at: deletedAt,
            sync_status: "pending",
        }
        : record);
}
export function mergeActiveWithExistingTombstones(existing, active, prefix) {
    const activeWithIds = ensureRecordIds(active, prefix);
    const activeIds = new Set(activeWithIds.map((record) => record.id));
    const tombstones = existing.filter((record) => record.deleted_at && record.id && !activeIds.has(record.id));
    return [...tombstones, ...activeWithIds];
}
