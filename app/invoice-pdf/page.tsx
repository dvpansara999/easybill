"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import SharedInvoiceTemplate from "@/components/invoiceTemplates/SharedInvoiceTemplate"
import type { TemplateComponentProps } from "@/components/invoiceTemplates/templateTypes"
import { formatCurrency } from "@/lib/formatCurrency"
import { formatDate } from "@/lib/dateFormat"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/lib/invoiceVisibilityShared"
import { normalizeTemplateTypography } from "@/lib/globalTemplateTypography"

type PdfRenderPayload = {
  invoice: TemplateComponentProps["invoice"]
  business: TemplateComponentProps["business"]
  visibility: Partial<InvoiceVisibilitySettings> | null
  templateId: string
  dateFormat: string
  amountFormat: string
  showDecimals: boolean
  currencySymbol: string
  currencyPosition: "before" | "after"
  fontFamily: string
  fontSize: number
  totals: {
    subtotal: number
    totalCGST: number
    totalSGST: number
    totalIGST: number
  }
}

function readPayload(searchParams: URLSearchParams): PdfRenderPayload | null {
  const raw = searchParams.get("payload")
  if (!raw) return null
  try {
    const normalized = raw.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4)
    // Base64url carries UTF-8 JSON bytes; decode safely to preserve symbols like ₹.
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
    const json = new TextDecoder("utf-8").decode(bytes)
    return JSON.parse(json) as PdfRenderPayload
  } catch {
    return null
  }
}

export default function InvoicePdfRenderPage() {
  const searchParams = useSearchParams()
  const payload = useMemo(() => readPayload(searchParams), [searchParams])

  const content = useMemo(() => {
    if (!payload) {
      return <div style={{ padding: 24 }}>Unable to render invoice preview.</div>
    }

    const visibility = { ...DEFAULT_INVOICE_VISIBILITY, ...(payload.visibility || {}) }
    const typography = normalizeTemplateTypography({
      fontFamily: payload.fontFamily,
      fontSize: payload.fontSize,
    })
    const money = (value: number) =>
      formatCurrency(
        value,
        payload.currencySymbol,
        payload.currencyPosition,
        payload.showDecimals,
        payload.amountFormat
      )
    const gstDisplay = (rate: string | number | null | undefined, amount: number) =>
      !rate || rate === "" || rate === "0" ? "-" : `${money(amount)} (${rate}%)`

    const templateData: TemplateComponentProps = {
      invoice: payload.invoice,
      business: payload.business,
      templateId: payload.templateId,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      subtotal: payload.totals.subtotal,
      totalCGST: payload.totals.totalCGST,
      totalSGST: payload.totals.totalSGST,
      totalIGST: payload.totals.totalIGST,
      money,
      gstDisplay,
      formatDate,
      dateFormat: payload.dateFormat,
      invoiceVisibility: visibility,
      // Keep same typography behavior as preview + invoice view.
      renderContext: "screen",
    }

    return (
      <div style={{ width: 794, padding: 38, boxSizing: "border-box", background: "#fff", margin: "0 auto" }}>
        <SharedInvoiceTemplate {...templateData} />
      </div>
    )
  }, [payload])

  return (
    <main style={{ margin: 0, padding: 0, background: "#fff" }}>
      <div data-easybill-pdf-ready="true">{content}</div>
      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }
        @page {
          size: A4;
          margin: 10mm;
        }
      `}</style>
    </main>
  )
}
