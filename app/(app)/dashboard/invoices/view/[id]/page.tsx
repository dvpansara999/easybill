"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import {
  getStoredBusinessRecord,
  normalizeInvoiceRecord,
  type BusinessRecord,
  type InvoiceRecord,
} from "@/lib/invoice"
import { getStoredTemplateTypography } from "@/lib/templateTypography"
import { getActiveOrGlobalItem } from "@/lib/userStore"
import A4InvoiceView from "@/components/invoiceView/A4InvoiceView"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"

import { appendCanvasToPdfPages } from "@/lib/canvasRasterPdf"
import { extractPdfBufferFromResponse, parsePdfApiErrorMessage } from "@/lib/pdfApiContract"
import { templates } from "@/components/invoiceTemplates"

/** Must match `A4InvoiceView` inner page width + padding for consistent capture vs on-screen layout. */
const A4_CAPTURE_WIDTH_PX = 794
const A4_CAPTURE_PADDING_PX = 38

type TemplateKey = keyof typeof templates

type TemplateTypography = ReturnType<typeof getStoredTemplateTypography>

type InvoiceViewState = {
  invoice: InvoiceRecord | null
  business: BusinessRecord | null
  template: string
  typography: TemplateTypography
}

function getInvoiceIdFromParams(id: string | string[] | undefined) {
  if (Array.isArray(id)) {
    return id[0] ?? ""
  }

  return id ?? ""
}

function safeParseInvoices(raw: string | null): InvoiceRecord[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map((invoice) => normalizeInvoiceRecord(invoice as Partial<InvoiceRecord>))
  } catch {
    return []
  }
}

function resolveTemplateKey(templateId: string): TemplateKey {
  if (templateId.startsWith("modern")) return "modern"
  if (templateId.startsWith("minimal")) return "minimal"
  if (templateId.startsWith("classic") && templateId !== "classic-default") return "classic"
  return "default"
}

function readInvoiceViewState(invoiceId: string): InvoiceViewState {
  const invoices = safeParseInvoices(getActiveOrGlobalItem("invoices"))
  const invoice = invoices.find((entry) => entry.invoiceNumber === invoiceId) ?? null
  // Keep default aligned with Templates page (`classic-default` → Default engine).
  const template = getActiveOrGlobalItem("invoiceTemplate") || "classic-default"

  return {
    invoice,
    business: getStoredBusinessRecord(),
    template,
    typography: getStoredTemplateTypography(),
  }
}

export default function ViewInvoice() {
  const {
    dateFormat,
    amountFormat,
    showDecimals,
    currencySymbol,
    currencyPosition,
    invoiceVisibility,
  } = useSettings()

  const params = useParams()
  const invoiceId = getInvoiceIdFromParams(params?.id)

  const [viewState, setViewState] = useState<InvoiceViewState>(() => readInvoiceViewState(invoiceId))
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadError, setDownloadError] = useState("")
  const [downloadNotice, setDownloadNotice] = useState("")

  // Stay in sync with Templates page + KV (template, typography, invoices) without full remount.
  useEffect(() => {
    setViewState(readInvoiceViewState(invoiceId))
  }, [invoiceId])

  useEffect(() => {
    const refresh = () => setViewState(readInvoiceViewState(invoiceId))
    window.addEventListener("easybill:kv-write", refresh as EventListener)
    window.addEventListener("easybill:cloud-sync", refresh as EventListener)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener("easybill:kv-write", refresh as EventListener)
      window.removeEventListener("easybill:cloud-sync", refresh as EventListener)
      window.removeEventListener("storage", refresh)
    }
  }, [invoiceId])

  const invoice = viewState.invoice
  const business = viewState.business
  const template = viewState.template
  const { fontFamily, fontSize } = viewState.typography
  const TemplateComponent = templates[resolveTemplateKey(template)]

  /** Single-column, un-paginated DOM for raster PDF fallback (avoids transform + page-slice bugs in html2canvas). */
  const captureRef = useRef<HTMLDivElement>(null)

  const money = useCallback((value: number) => {
    return formatCurrency(
      value,
      currencySymbol,
      currencyPosition,
      showDecimals,
      amountFormat
    )
  }, [amountFormat, currencyPosition, currencySymbol, showDecimals])

  const gstDisplay = useCallback((rate: unknown, amount: number) => {
    if (rate === null || rate === undefined) return "-"

    if (typeof rate === "number") {
      if (!Number.isFinite(rate) || rate === 0) return "-"
      return `${money(amount)} (${rate}%)`
    }

    if (typeof rate === "string") {
      if (!rate || rate === "0") return "-"
      return `${money(amount)} (${rate}%)`
    }

    return "-"
  }, [money])

  const totals = useMemo(() => {
    if (!invoice) {
      return {
        subtotal: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
      }
    }

    return invoice.items.reduce(
      (acc, item) => {
        const base = item.qty * item.price
        acc.subtotal += base
        acc.totalCGST += item.cgst ? (base * Number(item.cgst)) / 100 : 0
        acc.totalSGST += item.sgst ? (base * Number(item.sgst)) / 100 : 0
        acc.totalIGST += item.igst ? (base * Number(item.igst)) / 100 : 0
        return acc
      },
      { subtotal: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0 }
    )
  }, [invoice])

  const templateData = useMemo(
    () => ({
      invoice: invoice ?? undefined,
      business,
      templateId: template,
      fontFamily,
      fontSize,
      subtotal: totals.subtotal,
      totalCGST: totals.totalCGST,
      totalSGST: totals.totalSGST,
      totalIGST: totals.totalIGST,
      money,
      gstDisplay,
      formatDate,
      dateFormat,
      invoiceVisibility,
    }),
    [
      business,
      dateFormat,
      fontFamily,
      fontSize,
      invoice,
      invoiceVisibility,
      gstDisplay,
      money,
      template,
      totals,
    ]
  )

  async function downloadInvoiceFallback() {
    const element = captureRef.current
    if (!invoice) {
      throw new Error("No invoice loaded.")
    }
    if (!element) {
      throw new Error("Invoice preview is not ready. Refresh the page and try again.")
    }

    const nodes = element.querySelectorAll<HTMLElement>("*")
    const prev: Array<{
      el: HTMLElement
      color: string
      bg: string
      border: string
      boxShadow: string
      filter: string
      backdropFilter: string
    }> = []

    nodes.forEach((el) => {
      prev.push({
        el,
        color: el.style.color,
        bg: el.style.backgroundColor,
        border: el.style.borderColor,
        boxShadow: el.style.boxShadow,
        filter: el.style.filter,
        backdropFilter: el.style.backdropFilter,
      })

      el.style.color = "#000"
      // Force safe inline colors (avoid unsupported computed CSS `lab(...)` in html2canvas).
      el.style.backgroundColor = "#ffffff"
      el.style.borderColor = "#000"
      el.style.boxShadow = "none"
      el.style.filter = "none"
      el.style.backdropFilter = "none"
    })

    try {
      try {
        await document.fonts.ready
      } catch {
        // ignore - not all browsers expose FontFaceSet
      }

      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
      const rasterScale = Math.min(3, Math.max(2, dpr))

      const canvas = await html2canvas(element, {
        scale: rasterScale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (_doc, cloned) => {
          // Near-invisible nodes often rasterize as blank; fix on the clone only (no UI flash).
          if (cloned instanceof HTMLElement) {
            cloned.style.opacity = "1"
            cloned.style.zIndex = "2147483646"
            cloned.style.clipPath = "none"
          }
        },
      })

      if (canvas.width < 4 || canvas.height < 4) {
        throw new Error("Invoice capture was empty")
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Lossless slices - best quality for free raster fallback (larger than JPEG).
      appendCanvasToPdfPages(pdf, canvas, { format: "PNG" })
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`)
    } finally {
      prev.forEach(({ el, color, bg, border, boxShadow, filter, backdropFilter }) => {
        el.style.color = color
        el.style.backgroundColor = bg
        el.style.borderColor = border
        el.style.boxShadow = boxShadow
        el.style.filter = filter
        el.style.backdropFilter = backdropFilter
      })
    }
  }

  async function downloadInvoice() {
    if (downloadingPdf || !invoice) {
      return
    }

    setDownloadingPdf(true)
    setDownloadError("")
    setDownloadNotice("")

    try {
      // Same source as Templates page + preview: flush so we send the template id the user sees.
      flushSync(() => {
        setViewState(readInvoiceViewState(invoiceId))
      })
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })

      const fresh = readInvoiceViewState(invoiceId)
      const templateIdForPdf = fresh.template
      const typoForPdf = fresh.typography

      let vectorOk = false
      try {
        const res = await fetch("/api/invoice-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId,
            mode: "download",
            templateId: templateIdForPdf,
            // Must match on-screen invoice — server KV can lag behind local cache / debounced sync.
            fontId: typoForPdf.fontId,
            fontSize: typoForPdf.fontSize,
            fontFamily: typoForPdf.fontFamily,
          }),
        })

        // 204 No Content is still `res.ok` — never treat as PDF. We only accept explicit 200 + body.
        if (res.ok && res.status === 200) {
          const extracted = await extractPdfBufferFromResponse(res)
          if (extracted.ok && extracted.bytes.byteLength >= 8) {
            const pdfSlice = extracted.bytes.slice()
            const blob = new Blob([pdfSlice], { type: "application/pdf" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `Invoice-${invoice.invoiceNumber}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            vectorOk = true
            setDownloadNotice("Vector PDF (Playwright) — template and data from your account.")
            window.setTimeout(() => setDownloadNotice(""), 9000)
          } else if (!extracted.ok) {
            console.warn("[invoice-pdf] non-pdf response", {
              reason: extracted.reason,
              contentType: extracted.contentType,
              byteLength: extracted.byteLength,
              sampleHex: extracted.sampleHex,
              status: res.status,
            })
          }
        }

        if (!vectorOk) {
          const reason =
            res.status === 204
              ? "Server returned HTTP 204 (empty body). If this persists, check the terminal running `next dev` for [invoice-pdf] lines, or run `npm run build` then `npm start`."
              : res.ok
                ? "Server returned a non-PDF body (see console for reason)."
                : await parsePdfApiErrorMessage(res)
          await downloadInvoiceFallback()
          setDownloadNotice(
            `Saved a screen capture instead (${reason}).`
          )
          window.setTimeout(() => setDownloadNotice(""), 12000)
        }
      } catch {
        await downloadInvoiceFallback()
        setDownloadNotice(
          "Vector PDF unavailable (network or server). Saved a screen capture instead."
        )
        window.setTimeout(() => setDownloadNotice(""), 12000)
      }
    } catch (err) {
      setDownloadError(
        err instanceof Error && err.message
          ? err.message
          : "Unable to create PDF right now. Please try again."
      )
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (!invoice) {
    return <div className="p-6 text-sm text-slate-500">Invoice not found in this account.</div>
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex justify-end gap-3">
        <button
          onClick={downloadInvoice}
          disabled={downloadingPdf}
          className={`rounded px-4 py-2 text-white transition ${
            downloadingPdf
              ? "cursor-not-allowed bg-slate-400"
              : "bg-black hover:bg-slate-800"
          }`}
        >
          {downloadingPdf ? "Downloading..." : "Download PDF"}
        </button>
      </div>
      {downloadError ? (
        <p className="mb-4 text-right text-sm text-rose-600">{downloadError}</p>
      ) : null}
      {downloadNotice ? (
        <p className="mb-4 text-right text-sm text-emerald-700">{downloadNotice}</p>
      ) : null}

      <div
        ref={captureRef}
        data-easybill-pdf-capture="true"
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 -z-10 opacity-[0.01] [&_*]:pointer-events-none"
        style={{
          width: A4_CAPTURE_WIDTH_PX,
          padding: A4_CAPTURE_PADDING_PX,
          backgroundColor: "#ffffff",
          boxSizing: "border-box",
        }}
      >
        <TemplateComponent {...templateData} />
      </div>

      <A4InvoiceView TemplateComponent={TemplateComponent} templateData={templateData} />
    </div>
  )
}
