import { getActiveOrGlobalItem, removeActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import type { RelationalCacheKey as KvKey } from "@/lib/supabase/relationalSync"

export type WorkspaceKey = KvKey

export type WorkspaceCache = {
  get(key: WorkspaceKey): string | null
  set(key: WorkspaceKey, value: string): void
  remove(key: WorkspaceKey): void
}

export function createUserStoreWorkspaceCache(): WorkspaceCache {
  return {
    get(key) {
      return getActiveOrGlobalItem(key)
    },
    set(key, value) {
      setActiveOrGlobalItem(key, value)
    },
    remove(key) {
      removeActiveOrGlobalItem(key)
    },
  }
}
