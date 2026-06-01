import type { KvKey } from "@/lib/supabase/userKvSync"

export type SyncQueueOperation = "push" | "delete"

export type SyncQueueItem = {
  id: string
  userId: string
  key: KvKey
  operation: SyncQueueOperation
  rawValue?: string
  attempts: number
  createdAt: string
  updatedAt: string
  lastError?: string
}

export type SyncRetryQueue = {
  enqueue(item: Omit<SyncQueueItem, "id" | "attempts" | "createdAt" | "updatedAt">): SyncQueueItem
  list(userId?: string): SyncQueueItem[]
  remove(id: string): void
  markFailed(id: string, error: string): void
}

const STORAGE_KEY = "easybill:sync-retry-queue:v1"

function nowIso() {
  return new Date().toISOString()
}

function createQueueId(item: Omit<SyncQueueItem, "id" | "attempts" | "createdAt" | "updatedAt">) {
  return [
    item.userId,
    item.key,
    item.operation,
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 10),
  ].join(":")
}

function dedupeKey(item: Pick<SyncQueueItem, "userId" | "key" | "operation">) {
  return `${item.userId}:${item.key}:${item.operation}`
}

export function createMemorySyncRetryQueue(initialItems: SyncQueueItem[] = []): SyncRetryQueue {
  let items = [...initialItems]

  return {
    enqueue(item) {
      const timestamp = nowIso()
      const key = dedupeKey(item)
      items = items.filter((entry) => dedupeKey(entry) !== key)
      const next = {
        ...item,
        id: createQueueId(item),
        attempts: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      items.push(next)
      return next
    },
    list(userId) {
      return items.filter((item) => !userId || item.userId === userId)
    },
    remove(id) {
      items = items.filter((item) => item.id !== id)
    },
    markFailed(id, error) {
      items = items.map((item) =>
        item.id === id
          ? {
              ...item,
              attempts: item.attempts + 1,
              updatedAt: nowIso(),
              lastError: error,
            }
          : item
      )
    },
  }
}

function readStoredItems() {
  if (typeof localStorage === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is SyncQueueItem => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof (item as SyncQueueItem).id === "string" &&
        typeof (item as SyncQueueItem).userId === "string" &&
        typeof (item as SyncQueueItem).key === "string" &&
        ((item as SyncQueueItem).operation === "push" || (item as SyncQueueItem).operation === "delete")
      )
    })
  } catch {
    return []
  }
}

function writeStoredItems(items: SyncQueueItem[]) {
  if (typeof localStorage === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore storage failures
  }
}

export function createLocalStorageSyncRetryQueue(): SyncRetryQueue {
  const memory = createMemorySyncRetryQueue(readStoredItems())

  function persist() {
    writeStoredItems(memory.list())
  }

  return {
    enqueue(item) {
      const next = memory.enqueue(item)
      persist()
      return next
    },
    list(userId) {
      return memory.list(userId)
    },
    remove(id) {
      memory.remove(id)
      persist()
    },
    markFailed(id, error) {
      memory.markFailed(id, error)
      persist()
    },
  }
}

export function clearLocalStorageSyncRetryQueue(userId?: string) {
  if (typeof localStorage === "undefined") return
  if (!userId) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  const remaining = readStoredItems().filter((item) => item.userId !== userId)
  writeStoredItems(remaining)
}

export { STORAGE_KEY as LOCAL_STORAGE_SYNC_RETRY_QUEUE_KEY }
