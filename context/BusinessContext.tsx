"use client"

import { createContext, useCallback, useContext, useMemo } from "react"
import { useWorkspaceValue } from "@/lib/useWorkspaceValue"
import {
  type BusinessProfileRecord,
} from "@/lib/businessProfile"
import { workspaceDomain } from "@/lib/workspaceDomain"

export type BusinessType = BusinessProfileRecord

type BusinessContextType = {
  business: BusinessType
  setBusiness: (data: BusinessType) => Promise<void>
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

function readBusinessFromStore() {
  return workspaceDomain.getBusinessProfile()
}

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const business = useWorkspaceValue(["businessProfile"], readBusinessFromStore)

  const setBusiness = useCallback(async (data: BusinessType) => {
    await workspaceDomain.saveBusinessProfile(data)
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
