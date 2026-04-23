"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import {
  EMPTY_BUSINESS_PROFILE,
  normalizeBusinessProfile,
  type BusinessProfileRecord,
} from "@/lib/businessProfile"

export type BusinessType = BusinessProfileRecord

type BusinessContextType = {
  business: BusinessType
  setBusiness: (data: BusinessType) => void
}

const emptyBusiness: BusinessType = EMPTY_BUSINESS_PROFILE

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

function readBusinessFromStore() {
  if (typeof window === "undefined") return emptyBusiness

  const stored = getActiveOrGlobalItem("businessProfile")
  if (!stored) return emptyBusiness

  try {
    return normalizeBusinessProfile(JSON.parse(stored))
  } catch {
    return emptyBusiness
  }
}

function businessEquals(a: BusinessType, b: BusinessType) {
  return (
    a.businessName === b.businessName &&
    a.phone === b.phone &&
    a.email === b.email &&
    a.gst === b.gst &&
    a.address === b.address &&
    a.bankName === b.bankName &&
    a.accountNumber === b.accountNumber &&
    a.ifsc === b.ifsc &&
    a.upi === b.upi &&
    a.terms === b.terms &&
    a.logo === b.logo &&
    a.logoStoragePath === b.logoStoragePath &&
    a.logoShape === b.logoShape
  )
}

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusinessState] = useState<BusinessType>(() => readBusinessFromStore())
  const refreshFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshFrameRef.current != null) {
        window.cancelAnimationFrame(refreshFrameRef.current)
      }
      refreshFrameRef.current = window.requestAnimationFrame(() => {
        refreshFrameRef.current = null
        const nextBusiness = readBusinessFromStore()
        setBusinessState((prev) => (businessEquals(prev, nextBusiness) ? prev : nextBusiness))
      })
    }

    function onCloud() {
      scheduleRefresh()
    }

    function onKvWrite(e: Event) {
      const ce = e as CustomEvent<{ key?: string }>
      if (ce.detail?.key === "businessProfile") {
        scheduleRefresh()
      }
    }

    function onStorage(e: StorageEvent) {
      if (e.key?.startsWith("businessProfile::") || e.key === "businessProfile") {
        scheduleRefresh()
      }
    }

    scheduleRefresh()

    window.addEventListener("easybill:cloud-sync", onCloud as EventListener)
    window.addEventListener("easybill:kv-write", onKvWrite as EventListener)
    window.addEventListener("storage", onStorage)
    return () => {
      if (refreshFrameRef.current != null) {
        window.cancelAnimationFrame(refreshFrameRef.current)
      }
      window.removeEventListener("easybill:cloud-sync", onCloud as EventListener)
      window.removeEventListener("easybill:kv-write", onKvWrite as EventListener)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const value = useMemo<BusinessContextType>(
    () => ({
      business,
      setBusiness(data: BusinessType) {
        const normalizedBusiness = normalizeBusinessProfile(data)
        setBusinessState(normalizedBusiness)
        setActiveOrGlobalItem("businessProfile", JSON.stringify(normalizedBusiness))
      },
    }),
    [business]
  )

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
}

export function useBusiness() {
  const context = useContext(BusinessContext)

  if (!context) {
    throw new Error("useBusiness must be used inside BusinessProvider")
  }

  return context
}
