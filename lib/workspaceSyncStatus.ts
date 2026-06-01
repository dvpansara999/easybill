"use client"

import type { KvKey } from "@/lib/supabase/userKvSync"

export type WorkspaceSyncState =
  | "idle"
  | "saving"
  | "syncing"
  | "synced"
  | "pending"
  | "error"
  | "conflict"

export type WorkspaceSyncStatus = {
  state: WorkspaceSyncState
  label: string
  key?: KvKey | "workspace"
  detail?: string
  at: number
}

const EVENT_NAME = "easybill:workspace-sync-status"

export const WORKSPACE_SYNC_LABELS: Record<WorkspaceSyncState, string> = {
  idle: "Ready",
  saving: "Saving",
  syncing: "Syncing",
  synced: "Saved to Cloud",
  pending: "Pending Sync",
  error: "Sync Failed - Retry",
  conflict: "Conflict resolved",
}

let currentStatus: WorkspaceSyncStatus = {
  state: "idle",
  label: WORKSPACE_SYNC_LABELS.idle,
  at: Date.now(),
}

export function getWorkspaceSyncStatus() {
  return currentStatus
}

export function publishWorkspaceSyncStatus(status: Omit<WorkspaceSyncStatus, "at"> & { at?: number }) {
  currentStatus = {
    ...status,
    label: status.label || WORKSPACE_SYNC_LABELS[status.state],
    at: status.at ?? Date.now(),
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: currentStatus }))
  }
}

export function subscribeWorkspaceSyncStatus(callback: (status: WorkspaceSyncStatus) => void) {
  if (typeof window === "undefined") return () => {}

  const listener = (event: Event) => {
    callback((event as CustomEvent<WorkspaceSyncStatus>).detail || currentStatus)
  }

  window.addEventListener(EVENT_NAME, listener)
  callback(currentStatus)
  return () => window.removeEventListener(EVENT_NAME, listener)
}
