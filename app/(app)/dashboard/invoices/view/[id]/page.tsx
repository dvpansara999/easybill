"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Copy, Download, Minus, Plus, Share2, X } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatAmountInWordsIndian } from "@/lib/amountInWords"
import { formatDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import {
  createInvoiceHistoryEntry,
  findInvoiceById,
  getStoredBusinessRecord,
  normalizeInvoiceRecord,
  readStoredInvoices,
  updateInvoiceStatus,
  writeStoredInvoices,
  type BusinessRecord,
  type InvoiceHistoryEntry,
  type InvoiceRecord,
} from "@/lib/invoice"
import { getStoredTemplateTypography } from "@/lib/templateTypography"
import { normalizeTemplateTypography } from "@/lib/globalTemplateTypography"
import { getActiveOrGlobalItem } from "@/lib/userStore"
import { useWorkspaceValue } from "@/lib/useWorkspaceValue"
import A4InvoiceView from "@/components/invoiceView/A4InvoiceView"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"

import { appendCanvasToPdfPages } from "@/lib/canvasRasterPdf"
import { cn } from "@/lib/utils"
import { extractPdfBufferFromResponse, parsePdfApiErrorMessage } from "@/lib/pdfApiContract"
import { templates } from "@/components/invoiceTemplates"
import { DEFAULT_TEMPLATE_ID, resolveTemplateId } from "@/lib/templateIds"
import InvoicePageHeader from "@/components/invoices/InvoicePageHeader"
import NotFoundRecoveryCard from "@/components/shared/NotFoundRecoveryCard"

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

function resolveTemplateKey(templateId: string): TemplateKey {
  if (templateId.startsWith("modern")) return "modern"
  if (templateId.startsWith("minimal")) return "minimal"
  if (templateId.startsWith("classic")) return "classic"
  return "default"
}

function readInvoiceViewState(invoiceId: string): InvoiceViewState {
  const invoices = readStoredInvoices()
  const invoice = findInvoiceById(invoices, invoiceId)
  const template = resolveTemplateId(getActiveOrGlobalItem("invoiceTemplate") || DEFAULT_TEMPLATE_ID)

  return {
    invoice,
    business: getStoredBusinessRecord(),
    template,
    typography: normalizeTemplateTypography(getStoredTemplateTypography()),
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceId = getInvoiceIdFromParams(params?.id)
  const returnTo = searchParams.get("returnTo") || "/dashboard/invoices"

  const viewState = useWorkspaceValue(
    ["invoices", "businessProfile", "invoiceTemplate", "templateTypography", "invoiceTemplateFontId", "invoiceTemplateFontSize"],
    () => readInvoiceViewState(invoiceId)
  )
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadError, setDownloadError] = useState("")
  const [downloadNotice, setDownloadNotice] = useState("")
  const [downloadNoticeTone, setDownloadNoticeTone] = useState<"success" | "info">("success")
  const [exportSheetOpen, setExportSheetOpen] = useState(false)
  const [exportedPdfUrl, setExportedPdfUrl] = useState("")
  const [exportedPdfFile, setExportedPdfFile] = useState<File | null>(null)
  const [exportSheetBusy, setExportSheetBusy] = useState<null | "share" | "download">(null)
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  const [timelineExpanded, setTimelineExpanded] = useState(false)

  useEffect(() => {
    router.prefetch(returnTo)
  }, [returnTo, router])

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 767px)")
    const apply = () => setIsNarrowViewport(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  const invoice = viewState.invoice
  const business = viewState.business
  const template = viewState.template
  const { fontFamily, fontSize } = viewState.typography
  const TemplateComponent = templates[resolveTemplateKey(template)]

  const markInvoiceEvent = useCallback(
    (updater: (invoice: InvoiceRecord) => InvoiceRecord) => {
      const invoices = readStoredInvoices()
      const index = invoices.findIndex((entry) => entry.id === invoiceId)
      if (index === -1) return
      invoices[index] = normalizeInvoiceRecord(updater(invoices[index]))
      writeStoredInvoices(invoices)
    },
    [invoiceId]
  )

  const markInvoiceIssued = useCallback(() => {
    markInvoiceEvent((current) => {
      const nextStatus = current.status === "paid" ? current : updateInvoiceStatus(current, "issued", "PDF exported")
      return {
        ...nextStatus,
        history: [...(nextStatus.history || []), createInvoiceHistoryEntry("exported", "PDF exported")],
      }
    })
  }, [markInvoiceEvent])

  const togglePaid = useCallback(() => {
    markInvoiceEvent((current) => {
      const nextStatus = current.status === "paid" ? "issued" : "paid"
      return updateInvoiceStatus(current, nextStatus, nextStatus === "paid" ? "Marked as paid" : "Marked as unpaid")
    })
  }, [markInvoiceEvent])

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
      amountInWords: formatAmountInWordsIndian(Number(invoice?.grandTotal || 0), {
        currencySymbol,
        showDecimals,
      }),
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
      currencySymbol,
      dateFormat,
      fontFamily,
      fontSize,
      invoice,
      invoiceVisibility,
      showDecimals,
      gstDisplay,
      money,
      template,
      totals,
    ]
  )

  const timelineEntries = useMemo(
    () =>
      [...(invoice?.history || [])].sort((a, b) => {
        return new Date(a.at).getTime() - new Date(b.at).getTime()
      }),
    [invoice?.history]
  )
  const createdEntry = timelineEntries[0] || null

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

  async function downloadPdfFromRemoteUrl(url: string, invoiceNumber: string) {
    const res = await fetch(url)
    if (!res.ok) throw new Error("Could not download PDF from link.")
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = `Invoice-${invoiceNumber}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  }

  /** Original vector Playwright PDF + html2canvas fallback (unchanged behaviour). */
  async function downloadInvoiceDirect() {
    if (!invoice) return

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    const fresh = readInvoiceViewState(invoiceId)
    const templateIdForPdf = fresh.template
    const typoForPdf = fresh.typography

    let vectorOk = false
    let res: Response | undefined
    try {
      res = await fetch("/api/invoice-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          mode: "download",
          templateId: templateIdForPdf,
          fontId: typoForPdf.fontId,
          fontSize: typoForPdf.fontSize,
          fontFamily: typoForPdf.fontFamily,
        }),
      })

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
          markInvoiceIssued()
          vectorOk = true
          setDownloadNoticeTone("success")
          setDownloadNotice("Your PDF is ready and downloaded successfully.")
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

      if (!vectorOk && res) {
        const reason =
          res.status === 204
            ? "Server returned HTTP 204 (empty body). If this persists, check the terminal running `next dev` for [invoice-pdf] lines, or run `npm run build` then `npm start`."
            : res.ok
              ? "Server returned a non-PDF body (see console for reason)."
              : await parsePdfApiErrorMessage(res)
        await downloadInvoiceFallback()
        markInvoiceIssued()
        setDownloadNoticeTone("info")
        setDownloadNotice(`Server PDF was unavailable, so we downloaded a backup PDF from your screen preview (${reason}).`)
        window.setTimeout(() => setDownloadNotice(""), 12000)
      }
    } catch {
      await downloadInvoiceFallback()
      markInvoiceIssued()
      setDownloadNoticeTone("info")
      setDownloadNotice("Server PDF is temporarily unavailable, so we downloaded a backup PDF from your screen preview.")
      window.setTimeout(() => setDownloadNotice(""), 12000)
    }
  }

  async function prepareExportedPdfFile(url: string, invoiceNumber: string) {
    const res = await fetch(url)
    if (!res.ok) throw new Error("fetch failed")
    const blob = await res.blob()
    return new File([blob], `Invoice-${invoiceNumber}.pdf`, { type: "application/pdf" })
  }

  async function sharePreparedExport({
    url,
    file,
  }: {
    url: string
    file: File | null
  }) {
    const canShareFiles =
      file && typeof navigator.canShare === "function" ? navigator.canShare({ files: [file] }) : Boolean(file)

    if (typeof navigator.share === "function" && file && canShareFiles) {
      await navigator.share({ files: [file], title: "Invoice" })
      return true
    }

    if (typeof navigator.share === "function") {
      await navigator.share({ url, title: "Invoice" })
      return true
    }

    return false
  }

  async function shareExportedPdf() {
    if (!exportedPdfUrl || !invoice || exportSheetBusy) return
    setExportSheetBusy("share")
    try {
      try {
        const shared = await sharePreparedExport({
          url: exportedPdfUrl,
          file: exportedPdfFile,
        })
        if (shared) {
          markInvoiceIssued()
          setExportSheetOpen(false)
          return
        }
      } catch {
        // User cancelled or share failed. Fall through to a new tab.
      }

      window.open(exportedPdfUrl, "_blank", "noopener,noreferrer")
      markInvoiceIssued()
      setExportSheetOpen(false)
    } catch {
      window.open(exportedPdfUrl, "_blank", "noopener,noreferrer")
      markInvoiceIssued()
      setExportSheetOpen(false)
    } finally {
      setExportSheetBusy(null)
    }
  }

  async function downloadExportedFromSheet() {
    if (!exportedPdfUrl || !invoice || exportSheetBusy) return
    setExportSheetBusy("download")
    try {
      await downloadPdfFromRemoteUrl(exportedPdfUrl, invoice.invoiceNumber)
      markInvoiceIssued()
      setDownloadNoticeTone("success")
      setDownloadNotice("PDF downloaded.")
      window.setTimeout(() => setDownloadNotice(""), 6000)
      setExportSheetOpen(false)
    } catch {
      setDownloadError("Could not download PDF. Try opening in browser.")
      setExportSheetOpen(false)
    } finally {
      setExportSheetBusy(null)
    }
  }

  async function downloadInvoice() {
    if (downloadingPdf || !invoice) {
      return
    }

    setDownloadingPdf(true)
    setDownloadError("")
    setDownloadNotice("")
    setDownloadNoticeTone("success")
    setExportSheetOpen(false)
    setExportedPdfUrl("")
    setExportedPdfFile(null)
    setExportSheetBusy(null)

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })

      const fresh = readInvoiceViewState(invoiceId)
      const templateIdForPdf = fresh.template
      const typoForPdf = fresh.typography

      const exportRes = await fetch("/api/invoice-pdf-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          templateId: templateIdForPdf,
          fontId: typoForPdf.fontId,
          fontSize: typoForPdf.fontSize,
          fontFamily: typoForPdf.fontFamily,
        }),
      })

      if (exportRes.ok) {
        const data = (await exportRes.json().catch(() => null)) as { url?: string } | null
        if (data?.url && typeof data.url === "string") {
          if (isNarrowViewport) {
            let preparedFile: File | null = null
            try {
              preparedFile = await prepareExportedPdfFile(data.url, invoice.invoiceNumber)
            } catch {
              preparedFile = null
            }
            setExportedPdfUrl(data.url)
            setExportedPdfFile(preparedFile)
            setExportSheetOpen(true)
            setDownloadNoticeTone("success")
            setDownloadNotice("PDF is ready.")
            window.setTimeout(() => setDownloadNotice(""), 8000)
            return
          }

          await downloadPdfFromRemoteUrl(data.url, invoice.invoiceNumber)
          markInvoiceIssued()
          setDownloadNoticeTone("success")
          setDownloadNotice("Your PDF is ready and downloaded successfully.")
          window.setTimeout(() => setDownloadNotice(""), 9000)
          return
        }
      }

      await downloadInvoiceDirect()
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
    return (
      <NotFoundRecoveryCard
        title="Invoice not found"
        description="This invoice is no longer available in the current account. You can return to your invoices, go back to the dashboard, or retry syncing your workspace."
        backLabel="Back to invoices"
        onBack={() => router.push(returnTo)}
        onDashboard={() => router.push("/dashboard")}
        onRetry={() => setTimeout(() => window.dispatchEvent(new CustomEvent("easybill:cloud-sync")), 0)}
      />
    )
  }

  return (
    <div className="space-y-5 pb-6 xl:space-y-6 xl:pb-0">
      <InvoicePageHeader
        eyebrow="View Invoice"
        title={invoice.invoiceNumber}
        description="Review status, timeline, and the final PDF preview."
        backLabel="Back to invoices"
        onBack={() => router.push(returnTo)}
        actions={
          <>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/invoices/create?duplicateId=${encodeURIComponent(invoice.id)}`)}
              className="app-secondary-button inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white sm:w-auto"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={downloadInvoice}
              disabled={downloadingPdf}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition sm:w-auto ${
                downloadingPdf ? "cursor-not-allowed bg-slate-400" : "app-primary-button"
              }`}
            >
              <Download className="h-4 w-4" />
              {downloadingPdf ? "Preparing PDF..." : "Download PDF"}
            </button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(240px,0.42fr)_minmax(0,1fr)]">
        <div className="soft-card rounded-[24px] p-4 sm:p-5 xl:rounded-[28px]">
          <p className="app-kicker">Status</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-2xl font-semibold capitalize text-slate-950">{invoice.status || "draft"}</p>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                invoice.status === "paid"
                  ? "bg-emerald-50 text-emerald-700"
                  : invoice.status === "issued"
                    ? "bg-sky-50 text-sky-700"
                    : "bg-slate-100 text-slate-600"
              )}
            >
              {invoice.status || "draft"}
            </span>
          </div>
          <label className="app-subtle-panel mt-4 inline-flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700">
            <span>Payment received</span>
            <input
              type="checkbox"
              checked={invoice.status === "paid"}
              onChange={togglePaid}
              className="h-4 w-4 rounded border-slate-300 accent-[var(--accent-strong)]"
            />
          </label>
        </div>

        <div className="soft-card rounded-[24px] p-4 sm:p-5 xl:rounded-[28px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="app-kicker">Timeline</p>
              <h2 className="section-title mt-2 text-xl sm:text-2xl">Invoice activity.</h2>
            </div>
            {timelineEntries.length > 1 ? (
              <button
                type="button"
                onClick={() => setTimelineExpanded((current) => !current)}
                className="app-secondary-button inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-white hover:text-slate-950"
                aria-label={timelineExpanded ? "Collapse timeline" : "Expand timeline"}
                title={timelineExpanded ? "Collapse timeline" : "Expand timeline"}
              >
                {timelineExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            {(timelineExpanded ? timelineEntries : createdEntry ? [createdEntry] : []).map((entry: InvoiceHistoryEntry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{entry.label}</p>
                  <p className="text-xs text-slate-500">{formatDate(entry.at.slice(0, 10), dateFormat)}</p>
                </div>
              </div>
            ))}
          </div>
          {invoice.notes ? <p className="mt-4 text-sm leading-7 text-slate-600">{invoice.notes}</p> : null}
        </div>
      </section>

      {downloadError ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">{downloadError}</div>
      ) : null}
      {downloadNotice ? (
        <div
          className={`rounded-[20px] border px-4 py-3 text-sm ${
            downloadNoticeTone === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
              : "border-amber-200 bg-amber-50/80 text-amber-800"
          }`}
        >
          {downloadNotice}
        </div>
      ) : null}

      {exportSheetOpen && exportedPdfUrl ? (
        <div
          className="eb-safe-top-sheet fixed inset-0 z-50 flex items-start justify-center px-4 pb-4 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-sheet-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close"
            disabled={exportSheetBusy !== null}
            onClick={() => {
              if (exportSheetBusy) return
              setExportSheetOpen(false)
            }}
          />
          <div className="soft-card relative z-10 w-full max-w-sm rounded-[24px] p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="export-sheet-title" className="text-lg font-semibold text-slate-950">
                PDF ready
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (exportSheetBusy) return
                  setExportSheetOpen(false)
                  setExportedPdfFile(null)
                }}
                disabled={exportSheetBusy !== null}
                className={cn(
                  "app-secondary-button rounded-full p-1 text-slate-500 transition",
                  exportSheetBusy
                    ? "cursor-not-allowed opacity-40"
                    : "hover:bg-white hover:text-slate-900"
                )}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-600">Share with a client or save the file.</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void shareExportedPdf()}
                disabled={exportSheetBusy !== null}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition",
                  exportSheetBusy === "share"
                    ? "cursor-not-allowed bg-slate-400"
                    : exportSheetBusy === "download"
                      ? "cursor-not-allowed app-primary-button opacity-50"
                      : "app-primary-button"
                )}
              >
                <Share2 className="h-4 w-4 shrink-0" />
                {exportSheetBusy === "share" ? "Sharing..." : "Share PDF"}
              </button>
              <button
                type="button"
                onClick={() => void downloadExportedFromSheet()}
                disabled={exportSheetBusy !== null}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm font-semibold transition",
                  exportSheetBusy === "download"
                    ? "cursor-not-allowed app-secondary-button bg-slate-100 text-slate-500"
                    : exportSheetBusy === "share"
                      ? "cursor-not-allowed app-secondary-button text-slate-800 opacity-50"
                      : "app-secondary-button text-slate-800 hover:bg-white"
                )}
              >
                {exportSheetBusy === "download" ? "Downloading..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
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



