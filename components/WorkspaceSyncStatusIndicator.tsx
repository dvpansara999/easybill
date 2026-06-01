"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Cloud, CloudCog, Loader2 } from "lucide-react"
import {
  getWorkspaceSyncStatus,
  subscribeWorkspaceSyncStatus,
  type WorkspaceSyncStatus,
} from "@/lib/workspaceSyncStatus"
import { cn } from "@/lib/utils"

function statusChrome(state: WorkspaceSyncStatus["state"]) {
  switch (state) {
    case "saving":
    case "syncing":
      return {
        icon: Loader2,
        className: "border-sky-200/70 bg-sky-50/80 text-sky-800",
        spin: true,
      }
    case "pending":
      return {
        icon: CloudCog,
        className: "border-amber-200/80 bg-amber-50/85 text-amber-800",
        spin: false,
      }
    case "error":
      return {
        icon: AlertCircle,
        className: "border-rose-200/80 bg-rose-50/85 text-rose-800",
        spin: false,
      }
    case "conflict":
      return {
        icon: CloudCog,
        className: "border-violet-200/80 bg-violet-50/85 text-violet-800",
        spin: false,
      }
    case "synced":
      return {
        icon: CheckCircle2,
        className: "border-emerald-200/80 bg-emerald-50/85 text-emerald-800",
        spin: false,
      }
    case "idle":
    default:
      return {
        icon: Cloud,
        className: "border-slate-200/80 bg-white/70 text-slate-600",
        spin: false,
      }
  }
}

export default function WorkspaceSyncStatusIndicator() {
  const [status, setStatus] = useState<WorkspaceSyncStatus>(() => getWorkspaceSyncStatus())

  useEffect(() => subscribeWorkspaceSyncStatus(setStatus), [])

  const chrome = statusChrome(status.state)
  const Icon = chrome.icon

  return (
    <div
      className={cn(
        "inline-flex min-h-[38px] max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-[0_10px_22px_rgba(15,23,42,0.04)] backdrop-blur-xl",
        chrome.className
      )}
      title={status.detail || status.label}
      aria-live="polite"
    >
      <Icon className={cn("h-4 w-4 shrink-0", chrome.spin ? "animate-spin" : "")} aria-hidden />
      <span className="max-w-[170px] truncate sm:max-w-[220px]">{status.label}</span>
    </div>
  )
}

