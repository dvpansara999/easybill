"use client"

import { useCallback, useEffect, useRef } from "react"
import { useAppAlert } from "@/components/providers/AppAlertProvider"

const NAVIGATION_EVENT = "easybill:request-navigation"

type NavigationAction = () => void

type GuardNavigationDetail = {
  intercepted: boolean
  action: NavigationAction
}

type UseUnsavedChangesGuardOptions = {
  hasUnsavedChanges: boolean
  onApply: () => Promise<boolean> | boolean
  onRevert: () => void
  title?: string
  actionHint?: string
  message?: string
}

function runInNextTick(action: NavigationAction) {
  window.setTimeout(action, 0)
}

export function requestGuardedNavigation(action: NavigationAction) {
  if (typeof window === "undefined") {
    action()
    return
  }

  const detail: GuardNavigationDetail = {
    intercepted: false,
    action,
  }

  window.dispatchEvent(new CustomEvent<GuardNavigationDetail>(NAVIGATION_EVENT, { detail }))
  if (!detail.intercepted) {
    action()
  }
}

export function useUnsavedChangesGuard({
  hasUnsavedChanges,
  onApply,
  onRevert,
  title = "Unsaved changes",
  actionHint = "Apply your changes before leaving, or revert them and continue.",
  message = "You have unsaved changes on this page.",
}: UseUnsavedChangesGuardOptions) {
  const { showAlert } = useAppAlert()
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
  const onApplyRef = useRef(onApply)
  const onRevertRef = useRef(onRevert)
  const ignoreNextNavigationRef = useRef(false)

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges
  }, [hasUnsavedChanges])

  useEffect(() => {
    onApplyRef.current = onApply
  }, [onApply])

  useEffect(() => {
    onRevertRef.current = onRevert
  }, [onRevert])

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChangesRef.current || ignoreNextNavigationRef.current) return
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  const confirmNavigation = useCallback(
    (action: NavigationAction) => {
      if (!hasUnsavedChangesRef.current || ignoreNextNavigationRef.current) {
        action()
        return
      }

      showAlert({
        tone: "warning",
        title,
        actionHint,
        message,
        eyebrow: "Changes waiting to be saved",
        details: [
          "Apply changes to keep your latest edits on this page.",
          "Revert changes if you want to leave without updating anything.",
        ],
        footerNote: "Closing the browser tab may still trigger your browser's own leave-page warning.",
        primaryLabel: "Apply changes",
        secondaryLabel: "Revert changes",
        onPrimary: async () => {
          const applied = await onApplyRef.current()
          if (!applied) return
          ignoreNextNavigationRef.current = true
          runInNextTick(action)
          window.setTimeout(() => {
            ignoreNextNavigationRef.current = false
          }, 250)
        },
        onSecondary: () => {
          onRevertRef.current()
          ignoreNextNavigationRef.current = true
          runInNextTick(action)
          window.setTimeout(() => {
            ignoreNextNavigationRef.current = false
          }, 250)
        },
      })
    },
    [actionHint, message, showAlert, title]
  )

  useEffect(() => {
    function handleNavigationRequest(event: Event) {
      const detail = (event as CustomEvent<GuardNavigationDetail>).detail
      if (!detail || typeof detail.action !== "function") return
      if (!hasUnsavedChangesRef.current || ignoreNextNavigationRef.current) return
      detail.intercepted = true
      confirmNavigation(detail.action)
    }

    window.addEventListener(NAVIGATION_EVENT, handleNavigationRequest as EventListener)
    return () => window.removeEventListener(NAVIGATION_EVENT, handleNavigationRequest as EventListener)
  }, [confirmNavigation])

  return {
    confirmNavigation,
  }
}
