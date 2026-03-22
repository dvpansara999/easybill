"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"

export type BusinessType = {
  businessName: string
  phone: string
  email: string
  gst: string
  address: string
  bankName: string
  accountNumber: string
  ifsc: string
  upi: string
  /** Invoice terms / payment notes — must persist with profile (templates + PDF). */
  terms: string
  logo: string
  logoShape: "square" | "round"
}

type BusinessContextType = {
  business: BusinessType
  setBusiness: (data: BusinessType) => void
}

const emptyBusiness: BusinessType = {
  businessName: "",
  phone: "",
  email: "",
  gst: "",
  address: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  upi: "",
  terms: "",
  logo: "",
  logoShape: "square",
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

function normalizeBusiness(value: unknown): BusinessType {
  const parsed = typeof value === "object" && value !== null ? (value as Partial<BusinessType>) : {}

  return {
    businessName: parsed.businessName || "",
    phone: parsed.phone || "",
    email: parsed.email || "",
    gst: parsed.gst || "",
    address: parsed.address || "",
    bankName: parsed.bankName || "",
    accountNumber: parsed.accountNumber || "",
    ifsc: parsed.ifsc || "",
    upi: parsed.upi || "",
    terms: typeof parsed.terms === "string" ? parsed.terms : "",
    logo: parsed.logo || "",
    logoShape: parsed.logoShape === "round" ? "round" : "square",
  }
}

function readBusinessFromStore() {
  if (typeof window === "undefined") return emptyBusiness

  const stored = getActiveOrGlobalItem("businessProfile")
  if (!stored) return emptyBusiness

  try {
    return normalizeBusiness(JSON.parse(stored))
  } catch {
    return emptyBusiness
  }
}

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusinessState] = useState<BusinessType>(() => readBusinessFromStore())

  useEffect(() => {
    function onCloud() {
      setBusinessState(readBusinessFromStore())
    }

    window.addEventListener("easybill:cloud-sync", onCloud as EventListener)
    return () => window.removeEventListener("easybill:cloud-sync", onCloud as EventListener)
  }, [])

  const value = useMemo<BusinessContextType>(
    () => ({
      business,
      setBusiness(data: BusinessType) {
        const normalizedBusiness = normalizeBusiness(data)
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
