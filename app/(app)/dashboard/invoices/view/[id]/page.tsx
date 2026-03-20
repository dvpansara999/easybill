// @ts-nocheck
"use client"

import { useCallback, useMemo, useRef, useState } from "react"
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
import { parsePdfApiErrorMessage } from "@/lib/pdfApiContract"
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
  const template = getActiveOrGlobalItem("invoiceTemplate") || "default"

  return {
    invoice,
    business: getStoredBusinessRecord(),
    template,
    typography: getStoredTemplateTypography(),
  }
}

function responseBodyLooksLikeHtml(u8: Uint8Array): boolean {
  const head = new TextDecoder("utf-8", { fatal: false }).decode(
    u8.slice(0, Math.min(256, u8.length))
  ).trimStart()
  const h = head.toLowerCase()
  return h.startsWith("<!") || h.startsWith("<html") || h.startsWith("<head")
}

function extractPdfBufferFromResponse(raw: ArrayBuffer, contentType: string | null): ArrayBuffer | null {
  const u8 = new Uint8Array(raw)
  if (u8.length < 8) return null

  const ct = (contentType || "").toLowerCase()
  const claimsPdf = ct.includes("application/pdf")

  const maxScan = Math.min(u8.length, 65536)
  let i = 0
  if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) i = 3
  while (
    i < maxScan &&
    (u8[i] === 0x20 || u8[i] === 0x09 || u8[i] === 0x0a || u8[i] === 0x0d || u8[i] === 0x00)
  ) {
    i++
  }
  const headerAt = (at: number) =>
    at + 3 < u8.length && u8[at] === 0x25 && u8[at + 1] === 0x50 && u8[at + 2] === 0x44 && u8[at + 3] === 0x46
  if (headerAt(i)) return raw.slice(i)
  for (let j = 0; j <= maxScan - 4; j++) {
    if (headerAt(j)) return raw.slice(j)
  }

  // Some proxies strip/normalize bytes; trust declared PDF if body is not HTML.
  if (claimsPdf && u8.length >= 64 && !responseBodyLooksLikeHtml(u8) && u8[0] !== 0x3c) {
    return raw
  }

  return null
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

  const [viewState] = useState(() => readInvoiceViewState(invoiceId))
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadError, setDownloadError] = useState("")
  const [downloadNotice, setDownloadNotice] = useState("")

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

  const gstDisplay = useCallback((rate: number | string, amount: number) => {
    if (!rate || rate === "0") {
      return "-"
    }

    return `${money(amount)} (${rate}%)`
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
      invoice,
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
    if (!element || !invoice) return

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

    const ac = new AbortController()
    const abortTimer = window.setTimeout(() => ac.abort(), 90_000)

    try {
      const response = await fetch("/api/invoice-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf, application/json;q=0.9, */*;q=0.8",
        },
        credentials: "include",
        cache: "no-store",
        signal: ac.signal,
        body: JSON.stringify({
          invoiceId: String(invoiceId || invoice.invoiceNumber || ""),
          mode: "download",
        }),
      })

      if (!response.ok) {
        setDownloadError(await parsePdfApiErrorMessage(response))
        return
      }

      const blob = await response.blob()
      const fullBuf = await blob.arrayBuffer()
      const pdfBuf = extractPdfBufferFromResponse(fullBuf, response.headers.get("content-type"))
      if (!pdfBuf) {
        const raw = new TextDecoder().decode(new Uint8Array(fullBuf).slice(0, 2048))
        let msg = "Server did not return a valid PDF. Try again in a moment."
        try {
          const json = JSON.parse(new TextDecoder().decode(fullBuf)) as { error?: string }
          if (typeof json.error === "string" && json.error.trim()) msg = json.error.trim()
        } catch {
          if (raw.trimStart().startsWith("<!") || raw.trimStart().startsWith("<html")) {
            msg = "Server returned an HTML page instead of a PDF. Check deployment logs for /api/invoice-pdf."
          }
        }
        setDownloadError(msg)
        return
      }

      const pdfBlob = new Blob([pdfBuf], { type: "application/pdf" })
      const url = window.URL.createObjectURL(pdfBlob)
      const anchor = document.createElement("a")

      anchor.href = url
      anchor.download = `Invoice-${invoice.invoiceNumber}.pdf`

      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()

      window.URL.revokeObjectURL(url)

      if (response.headers.get("X-EasyBill-Pdf-Engine")?.includes("playwright")) {
        setDownloadNotice("Saved as vector PDF (server-rendered).")
        window.setTimeout(() => setDownloadNotice(""), 7000)
      }
    } catch (primaryErr) {
      const aborted =
        primaryErr instanceof DOMException
          ? primaryErr.name === "AbortError"
          : primaryErr instanceof Error && primaryErr.name === "AbortError"
      if (aborted) {
        setDownloadError("Download timed out. Check your connection and try again.")
        return
      }
      console.warn("Network or unexpected error - trying high-quality backup export:", primaryErr)
      try {
        await downloadInvoiceFallback()
        setDownloadNotice("Saved using high-quality image backup (could not reach the print server).")
        window.setTimeout(() => setDownloadNotice(""), 9000)
      } catch {
        setDownloadError(
          primaryErr instanceof Error && primaryErr.message
            ? primaryErr.message
            : "Unable to download PDF right now. Please try again."
        )
      }
    } finally {
      window.clearTimeout(abortTimer)
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
