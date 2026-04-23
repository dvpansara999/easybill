"use client"

import { createContext, useCallback, useContext, useMemo } from "react"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import { useWorkspaceValue } from "@/lib/useWorkspaceValue"
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

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const business = useWorkspaceValue(["businessProfile"], readBusinessFromStore)

  const setBusiness = useCallback((data: BusinessType) => {
    const normalizedBusiness = normalizeBusinessProfile(data)
    setActiveOrGlobalItem("businessProfile", JSON.stringify(normalizedBusiness))
  }, [])

  const value = useMemo<BusinessContextType>(
    () => ({ business, setBusiness }),
    [business, setBusiness]
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
