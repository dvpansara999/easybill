"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import { getAuthMode } from "@/lib/runtimeMode"
import { getActiveUserId } from "@/lib/auth"

export type InvoiceVisibilitySettings = {
  businessName: boolean
  businessAddress: boolean
  businessPhone: boolean
  businessGstin: boolean
  businessTerms: boolean
  businessBankDetails: boolean
  businessLogo: boolean
  clientName: boolean
  clientAddress: boolean
  clientPhone: boolean
  clientGstin: boolean
}

export const DEFAULT_INVOICE_VISIBILITY: InvoiceVisibilitySettings = {
  businessName: true,
  businessAddress: true,
  businessPhone: true,
  businessGstin: true,
  businessTerms: true,
  businessBankDetails: true,
  businessLogo: true,
  clientName: true,
  clientAddress: true,
  clientPhone: true,
  clientGstin: true,
}

type SettingsContextType = {
  dateFormat: string
  updateDateFormat: (format: string) => void

  amountFormat: string
  updateAmountFormat: (format: string) => void

  showDecimals: boolean
  updateShowDecimals: (value: boolean) => void

  invoicePrefix: string
  updateInvoicePrefix: (value: string) => void

  invoicePadding: number
  updateInvoicePadding: (value: number) => void

  invoiceStartNumber: number
  updateInvoiceStartNumber: (value: number) => void

  resetYearly: boolean
  updateResetYearly: (value: boolean) => void

  currencySymbol: string
  updateCurrencySymbol: (value: string) => void

  currencyPosition: "before" | "after"
  updateCurrencyPosition: (value: "before" | "after") => void

  invoiceVisibility: InvoiceVisibilitySettings
  updateInvoiceVisibility: (next: InvoiceVisibilitySettings) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {

  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD")
  const [amountFormat, setAmountFormat] = useState("indian")
  const [showDecimals, setShowDecimals] = useState(true)

  const [invoicePrefix, setInvoicePrefix] = useState("INV-")
  const [invoicePadding, setInvoicePadding] = useState(4)
  const [invoiceStartNumber, setInvoiceStartNumber] = useState(1)
  const [resetYearly, setResetYearly] = useState(true)

  const [currencySymbol, setCurrencySymbol] = useState("₹")
  const [currencyPosition, setCurrencyPosition] = useState<"before" | "after">("before")
  const [invoiceVisibility, setInvoiceVisibility] = useState<InvoiceVisibilitySettings>(DEFAULT_INVOICE_VISIBILITY)

  function loadFromStorage(opts: { writeDefaults: boolean }) {
    const savedDate = getActiveOrGlobalItem("dateFormat")
    const savedAmount = getActiveOrGlobalItem("amountFormat")
    const savedDecimals = getActiveOrGlobalItem("showDecimals")

    const savedPrefix = getActiveOrGlobalItem("invoicePrefix")
    const savedPadding = getActiveOrGlobalItem("invoicePadding")
    const savedStart = getActiveOrGlobalItem("invoiceStartNumber")
    const savedReset = getActiveOrGlobalItem("resetYearly")

    const savedCurrency = getActiveOrGlobalItem("currencySymbol")
    const savedCurrencyPos = getActiveOrGlobalItem("currencyPosition")
    const savedInvoiceVisibility = getActiveOrGlobalItem("invoiceVisibility")

    if (savedDate) setDateFormat(savedDate)
    else if (opts.writeDefaults) setActiveOrGlobalItem("dateFormat", "YYYY-MM-DD")

    if (savedAmount) setAmountFormat(savedAmount)
    else if (opts.writeDefaults) setActiveOrGlobalItem("amountFormat", "indian")

    if (savedDecimals) setShowDecimals(savedDecimals === "true")
    else if (opts.writeDefaults) setActiveOrGlobalItem("showDecimals", "true")

    if (savedPrefix) setInvoicePrefix(savedPrefix)
    else if (opts.writeDefaults) setActiveOrGlobalItem("invoicePrefix", "INV-")

    if (savedPadding) setInvoicePadding(Number(savedPadding))
    else if (opts.writeDefaults) setActiveOrGlobalItem("invoicePadding", "4")

    if (savedStart) setInvoiceStartNumber(Number(savedStart))
    else if (opts.writeDefaults) setActiveOrGlobalItem("invoiceStartNumber", "1")

    if (savedReset) setResetYearly(savedReset === "true")
    else if (opts.writeDefaults) setActiveOrGlobalItem("resetYearly", "true")

    if (savedCurrency) setCurrencySymbol(savedCurrency)
    else if (opts.writeDefaults) setActiveOrGlobalItem("currencySymbol", "₹")

    if (savedCurrencyPos) setCurrencyPosition(savedCurrencyPos as "before" | "after")
    else if (opts.writeDefaults) setActiveOrGlobalItem("currencyPosition", "before")

    if (savedInvoiceVisibility) {
      try {
        const parsed = JSON.parse(savedInvoiceVisibility) as Partial<InvoiceVisibilitySettings>
        setInvoiceVisibility({ ...DEFAULT_INVOICE_VISIBILITY, ...(parsed || {}) })
      } catch {
        setInvoiceVisibility(DEFAULT_INVOICE_VISIBILITY)
        if (opts.writeDefaults) {
          setActiveOrGlobalItem("invoiceVisibility", JSON.stringify(DEFAULT_INVOICE_VISIBILITY))
        }
      }
    } else {
      if (opts.writeDefaults) {
        setActiveOrGlobalItem("invoiceVisibility", JSON.stringify(DEFAULT_INVOICE_VISIBILITY))
      }
    }
  }

  useEffect(() => {
    const supabaseNeedsHydration = getAuthMode() === "supabase" && Boolean(getActiveUserId())
    loadFromStorage({ writeDefaults: !supabaseNeedsHydration })

    function onCloud() {
      loadFromStorage({ writeDefaults: true })
    }
    window.addEventListener("easybill:cloud-sync", onCloud as EventListener)
    return () => window.removeEventListener("easybill:cloud-sync", onCloud as EventListener)
  }, [])

  function updateDateFormat(format: string) {
    setDateFormat(format)
    setActiveOrGlobalItem("dateFormat", format)
  }

  function updateAmountFormat(format: string) {
    setAmountFormat(format)
    setActiveOrGlobalItem("amountFormat", format)
  }

  function updateShowDecimals(value: boolean) {
    setShowDecimals(value)
    setActiveOrGlobalItem("showDecimals", String(value))
  }

  function updateInvoicePrefix(value: string) {
    setInvoicePrefix(value)
    setActiveOrGlobalItem("invoicePrefix", value)
  }

  function updateInvoicePadding(value: number) {
    setInvoicePadding(value)
    setActiveOrGlobalItem("invoicePadding", String(value))
  }

  function updateInvoiceStartNumber(value: number) {
    setInvoiceStartNumber(value)
    setActiveOrGlobalItem("invoiceStartNumber", String(value))
  }

  function updateResetYearly(value: boolean) {
    setResetYearly(value)
    setActiveOrGlobalItem("resetYearly", String(value))
  }

  function updateCurrencySymbol(value: string) {
    setCurrencySymbol(value)
    setActiveOrGlobalItem("currencySymbol", value)
  }

  function updateCurrencyPosition(value: "before" | "after") {
    setCurrencyPosition(value)
    setActiveOrGlobalItem("currencyPosition", value)
  }

  function updateInvoiceVisibility(next: InvoiceVisibilitySettings) {
    setInvoiceVisibility(next)
    setActiveOrGlobalItem("invoiceVisibility", JSON.stringify(next))
  }

  return (
    <SettingsContext.Provider
      value={{
        dateFormat,
        updateDateFormat,

        amountFormat,
        updateAmountFormat,

        showDecimals,
        updateShowDecimals,

        invoicePrefix,
        updateInvoicePrefix,

        invoicePadding,
        updateInvoicePadding,

        invoiceStartNumber,
        updateInvoiceStartNumber,

        resetYearly,
        updateResetYearly,

        currencySymbol,
        updateCurrencySymbol,

        currencyPosition,
        updateCurrencyPosition,

        invoiceVisibility,
        updateInvoiceVisibility,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {

  const context = useContext(SettingsContext)

  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider")
  }

  return context
}