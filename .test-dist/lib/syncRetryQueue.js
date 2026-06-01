const STORAGE_KEY = "easybill:sync-retry-queue:v1";
function nowIso() {
    return new Date().toISOString();
}
function createQueueId(item) {
    return [
        item.userId,
        item.key,
        item.operation,
        Date.now().toString(36),
        Math.random().toString(36).slice(2, 10),
    ].join(":");
}
function dedupeKey(item) {
    return `${item.userId}:${item.key}:${item.operation}`;
}
export function createMemorySyncRetryQueue(initialItems = []) {
    let items = [...initialItems];
    return {
        enqueue(item) {
            const timestamp = nowIso();
            const key = dedupeKey(item);
            items = items.filter((entry) => dedupeKey(entry) !== key);
            const next = {
                ...item,
                id: createQueueId(item),
                attempts: 0,
                createdAt: timestamp,
                updatedAt: timestamp,
            };
            items.push(next);
            return next;
        },
        list(userId) {
            return items.filter((item) => !userId || item.userId === userId);
        },
        remove(id) {
            items = items.filter((item) => item.id !== id);
        },
        markFailed(id, error) {
            items = items.map((item) => item.id === id
                ? {
                    ...item,
                    attempts: item.attempts + 1,
                    updatedAt: nowIso(),
                    lastError: error,
                }
                : item);
        },
    };
}
function readStoredItems() {
    if (typeof localStorage === "undefined")
        return [];
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((item) => {
            return (typeof item === "object" &&
                item !== null &&
                typeof item.id === "string" &&
                typeof item.userId === "string" &&
                typeof item.key === "string" &&
                (item.operation === "push" || item.operation === "delete"));
        });
    }
    catch {
        return [];
    }
}
function writeStoredItems(items) {
    if (typeof localStorage === "undefined")
        return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
    catch {
        // ignore storage failures
    }
}
export function createLocalStorageSyncRetryQueue() {
    const memory = createMemorySyncRetryQueue(readStoredItems());
    function persist() {
        writeStoredItems(memory.list());
    }
    return {
        enqueue(item) {
            const next = memory.enqueue(item);
            persist();
            return next;
        },
        list(userId) {
            return memory.list(userId);
        },
        remove(id) {
            memory.remove(id);
            persist();
        },
        markFailed(id, error) {
            memory.markFailed(id, error);
            persist();
        },
    };
}
export function clearLocalStorageSyncRetryQueue(userId) {
    if (typeof localStorage === "undefined")
        return;
    if (!userId) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }
    const remaining = readStoredItems().filter((item) => item.userId !== userId);
    writeStoredItems(remaining);
}
export { STORAGE_KEY as LOCAL_STORAGE_SYNC_RETRY_QUEUE_KEY };
