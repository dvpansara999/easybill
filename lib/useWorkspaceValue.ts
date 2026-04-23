"use client"

import { useEffect, useRef, useState } from "react"

function matchesStorageKey(storageKey: string | null, watchedKey: string) {
  if (!storageKey) return false
  return storageKey === watchedKey || storageKey.startsWith(`${watchedKey}::`) || storageKey.includes(`warm-cache:${watchedKey}::`)
}

export function useWorkspaceValue<T>(keys: string[], getSnapshot: () => T) {
  const getSnapshotRef = useRef(getSnapshot)
  const keysRef = useRef(keys)
  const keysSignature = keys.join("|")

  const [value, setValue] = useState<T>(() => getSnapshot())

  useEffect(() => {
    getSnapshotRef.current = getSnapshot
  }, [getSnapshot])

  useEffect(() => {
    keysRef.current = keys
  }, [keys, keysSignature])

  useEffect(() => {
    const refresh = () => {
      setValue(getSnapshotRef.current())
    }

    const onCloudSync = () => refresh()
    const onKvWrite = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail
      if (!detail?.key || keysRef.current.includes(detail.key)) {
        refresh()
      }
    }
    const onStorage = (event: StorageEvent) => {
      if (keysRef.current.some((key) => matchesStorageKey(event.key, key))) {
        refresh()
      }
    }

    window.addEventListener("easybill:cloud-sync", onCloudSync as EventListener)
    window.addEventListener("easybill:kv-write", onKvWrite as EventListener)
    window.addEventListener("storage", onStorage)
    refresh()

    return () => {
      window.removeEventListener("easybill:cloud-sync", onCloudSync as EventListener)
      window.removeEventListener("easybill:kv-write", onKvWrite as EventListener)
      window.removeEventListener("storage", onStorage)
    }
  }, [keysSignature])

  return value
}
