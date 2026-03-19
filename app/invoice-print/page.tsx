"use client"

import { useEffect, useState } from "react"
import { templates } from "@/components/invoiceTemplates"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import { getStoredBusinessRecord } from "@/lib/invoice"
import { getStoredTemplateTypography } from "@/lib/templateTypography"

type InvoiceItem = {
  qty: number
  price: number
  cgst?: number | string
  sgst?: number | string
  igst?: number | string
}

type Invoice = {
  items: InvoiceItem[]
}

type Business = {
  businessName: string
  address: string
  gst: string
  phone: string
  email: string
  bankName: string
  accountNumber: string
  ifsc: string
  upi: string
  terms: string
  logo: string
}

const DefaultTemplate = templates.default
const ClassicTemplate = templates.classic
const ModernTemplate = templates.modern
const MinimalTemplate = templates.minimal

function getStoredInvoice() {
  if (typeof window === "undefined") {
    return null
  }

  const data = localStorage.getItem("pdfInvoice")
  return data ? (JSON.parse(data) as Invoice) : null
}

function getStoredTemplate() {
  if (typeof window === "undefined") {
    return "classic-default"
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  return getActiveOrGlobalItem("invoiceTemplate") || "classic-default"
}

export default function InvoicePrint() {
  const {
    dateFormat,
    amountFormat,
    showDecimals,
    currencySymbol,
    currencyPosition,
    invoiceVisibility,
  } = useSettings()
  const [mounted, setMounted] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [template, setTemplate] = useState("default")
  const [fontFamily, setFontFamily] = useState(getStoredTemplateTypography().fontFamily)
  const [fontSize, setFontSize] = useState(getStoredTemplateTypography().fontSize)

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true)
      document.title = "easyBILL — Print invoice"

      try {
        setInvoice(getStoredInvoice())
        setBusiness(getStoredBusinessRecord())
        setTemplate(getStoredTemplate())
        const typography = getStoredTemplateTypography()
        setFontFamily(typography.fontFamily)
        setFontSize(typography.fontSize)
      } catch {
        setInvoice(null)
        setBusiness(null)
        setTemplate("default")
        setFontFamily(getStoredTemplateTypography().fontFamily)
        setFontSize(getStoredTemplateTypography().fontSize)
      }
    })
  }, [])

  if (!mounted || !invoice) {
    return <div className="p-6 text-sm text-slate-500">Preparing invoice…</div>
  }

  let subtotal = 0
  let totalCGST = 0
  let totalSGST = 0
  let totalIGST = 0

  invoice.items.forEach((item) => {
    const base = item.qty * item.price

    const cgst = item.cgst ? (base * Number(item.cgst)) / 100 : 0
    const sgst = item.sgst ? (base * Number(item.sgst)) / 100 : 0
    const igst = item.igst ? (base * Number(item.igst)) / 100 : 0

    subtotal += base
    totalCGST += cgst
    totalSGST += sgst
    totalIGST += igst
  })

  function money(value: number) {
    return formatCurrency(
      value,
      currencySymbol,
      currencyPosition,
      showDecimals,
      amountFormat
    )
  }

  function gstDisplay(rate: string | number | null | undefined, amount: number) {
    if (!rate || rate === "" || rate === "0") {
      return "-"
    }

    return `${money(amount)} (${rate}%)`
  }

  const templateProps = {
    invoice,
    business,
    templateId: template,
    fontFamily,
    fontSize,
    subtotal,
    totalCGST,
    totalSGST,
    totalIGST,
    money,
    gstDisplay,
    formatDate,
    dateFormat,
    invoiceVisibility,
  }

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #invoice-print-root,
          #invoice-print-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #invoice-print-root {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div
        id="invoice-print-root"
        data-ready="true"
        style={{ padding: "0", background: "white" }}
      >
        {template.startsWith("modern") ? (
          <ModernTemplate {...templateProps} />
        ) : template.startsWith("minimal") ? (
          <MinimalTemplate {...templateProps} />
        ) : template === "classic-default" ? (
          <DefaultTemplate {...templateProps} />
        ) : (
          <ClassicTemplate {...templateProps} />
        )}
      </div>
    </>
  )
}
