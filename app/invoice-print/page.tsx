"use client"

import { useEffect, useState } from "react"
import { templates } from "@/components/invoiceTemplates"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import { getStoredBusinessRecord } from "@/lib/invoice"
import { getStoredTemplateTypography } from "@/lib/templateTypography"
import { htmlFontSizePxForInvoicePdf } from "@/lib/htmlRemForInvoicePdf"

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
  const fromKv = getActiveOrGlobalItem("invoiceTemplate")
  if (fromKv) return fromKv

  // Playwright PDF rendering has no authenticated user.
  // `/api/invoice-pdf` seeds `localStorage.invoiceTemplate`, so fall back to it.
  try {
    const raw = localStorage.getItem("invoiceTemplate")
    return raw || "classic-default"
  } catch {
    return "classic-default"
  }
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
  const [assetsReady, setAssetsReady] = useState(false)

  useEffect(() => {
    ;(window as any).__EASYBILL_PDF_READY = false
    return () => {
      ;(window as any).__EASYBILL_PDF_READY = false
    }
  }, [])

  // Deterministic rem scale for Tailwind typography (matches screen transform scale at same fontSize).
  useEffect(() => {
    if (!mounted || !invoice) return
    const html = document.documentElement
    const prev = html.style.fontSize
    html.style.fontSize = htmlFontSizePxForInvoicePdf(fontSize)
    return () => {
      html.style.fontSize = prev
    }
  }, [mounted, invoice, fontSize])

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

  useEffect(() => {
    if (!mounted || !invoice) {
      setAssetsReady(false)
      ;(window as any).__EASYBILL_PDF_READY = false
      return
    }

    let cancelled = false
    const markReadyIfNotCancelled = () => {
      if (cancelled) return
      setAssetsReady(true)
      ;(window as any).__EASYBILL_PDF_READY = true
    }

    const run = async () => {
      try {
        await document.fonts.ready
      } catch {
        // ignore
      }

      // Let React commit + paint; headless PDF can be blank if we flag ready too early.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      await new Promise<void>((resolve) => setTimeout(resolve, 40))
      if (cancelled) return

      const root = document.getElementById("invoice-print-root")
      if (!root) {
        markReadyIfNotCancelled()
        return
      }

      const images = Array.from(root.querySelectorAll("img"))
      if (images.length > 0) {
        await Promise.all(
          images.map(async (img) => {
            if (img.complete) return
            await new Promise<void>((resolve) => {
              const done = () => resolve()
              img.addEventListener("load", done, { once: true })
              img.addEventListener("error", done, { once: true })
            })
          })
        )
      }

      // One more frame after images decode.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      markReadyIfNotCancelled()
    }

    ;(window as any).__EASYBILL_PDF_READY = false
    setAssetsReady(false)
    void run()

    return () => {
      cancelled = true
      ;(window as any).__EASYBILL_PDF_READY = false
    }
  }, [mounted, invoice, business, template, fontFamily, fontSize])

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
    /** Vector PDF path: no CSS transform; rem scaled via <html> font-size above. */
    renderContext: "pdf" as const,
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

          /* Safety net for headless print (nested utilities, etc.) */
          #invoice-print-root * {
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>

      <div
        id="invoice-print-root"
        data-ready={assetsReady ? "true" : "false"}
        style={{ padding: "0", background: "white", width: "794px", margin: "0 auto" }}
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
