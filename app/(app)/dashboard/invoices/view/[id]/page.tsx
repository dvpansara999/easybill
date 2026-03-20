"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import { getStoredBusinessRecord } from "@/lib/invoice"
import { getStoredTemplateTypography } from "@/lib/templateTypography"
import { getActiveOrGlobalItem } from "@/lib/userStore"
import A4InvoiceView from "@/components/invoiceView/A4InvoiceView"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"

import { appendCanvasToPdfPages, looksLikePdfBytes } from "@/lib/canvasRasterPdf"
import { parsePdfApiErrorMessage } from "@/lib/pdfApiContract"
import { templates } from "@/components/invoiceTemplates"

/** Must match `A4InvoiceView` inner page width + padding for consistent capture vs on-screen layout. */
const A4_CAPTURE_WIDTH_PX = 794
const A4_CAPTURE_PADDING_PX = 38

export default function ViewInvoice(){

const {
  dateFormat,
  amountFormat,
  showDecimals,
  currencySymbol,
  currencyPosition,
  invoiceVisibility,
} = useSettings()

const params = useParams()
const id = params?.id

const [invoice,setInvoice] = useState<any>(null)
const [business,setBusiness] = useState<any>(null)
const [template,setTemplate] = useState("default")
const [fontId,setFontId] = useState(getStoredTemplateTypography().fontId)
const [fontFamily,setFontFamily] = useState(getStoredTemplateTypography().fontFamily)
const [fontSize,setFontSize] = useState(getStoredTemplateTypography().fontSize)
const [downloadingPdf, setDownloadingPdf] = useState(false)
const [downloadError, setDownloadError] = useState("")
const [downloadNotice, setDownloadNotice] = useState("")

let TemplateComponent = templates.default

if(template.startsWith("modern")){
  TemplateComponent = templates.modern
}

if(template.startsWith("minimal")){
  TemplateComponent = templates.minimal
}

if(template === "classic-default"){
  TemplateComponent = templates.default
}

if(template.startsWith("classic") && template !== "classic-default"){
  TemplateComponent = templates.classic
}

/** Single-column, un-paginated DOM for raster PDF fallback (avoids transform + page-slice bugs in html2canvas). */
const captureRef = useRef<HTMLDivElement>(null)


/* DOWNLOAD PDF */

async function downloadInvoiceFallback(){

  const element = captureRef.current
  if(!element) return

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

  nodes.forEach((el)=>{
    prev.push({
      el,
      color: el.style.color,
      bg: el.style.backgroundColor,
      border: el.style.borderColor,
      boxShadow: el.style.boxShadow,
      filter: el.style.filter,
      backdropFilter: el.style.backdropFilter
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
      // ignore — not all browsers expose FontFaceSet
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

    // Lossless slices — best quality for free raster fallback (larger than JPEG).
    appendCanvasToPdfPages(pdf, canvas, { format: "PNG" })
    pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`)

  } finally {

    prev.forEach(({el,color,bg,border,boxShadow,filter,backdropFilter})=>{
      el.style.color = color
      el.style.backgroundColor = bg
      el.style.borderColor = border
      el.style.boxShadow = boxShadow
      el.style.filter = filter
      el.style.backdropFilter = backdropFilter
    })

  }

}

async function downloadInvoice(){

  if (downloadingPdf) return

  if(!invoice){
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
      },
      credentials: "include",
      signal: ac.signal,
      body: JSON.stringify({
        invoiceId: String(id || invoice?.invoiceNumber || ""),
        mode: "download",
      }),
    })

    if (!response.ok) {
      setDownloadError(await parsePdfApiErrorMessage(response))
      return
    }

    const blob = await response.blob()
    const fullBuf = await blob.arrayBuffer()
    const prefix = new Uint8Array(fullBuf.slice(0, 5))
    if (!looksLikePdfBytes(prefix)) {
      const raw = new TextDecoder().decode(fullBuf)
      let msg = "Server did not return a valid PDF. Try again in a moment."
      try {
        const j = JSON.parse(raw) as { error?: string }
        if (typeof j.error === "string" && j.error.trim()) msg = j.error.trim()
      } catch {
        // not JSON — keep default msg
      }
      setDownloadError(msg)
      return
    }

    const pdfBlob = new Blob([fullBuf], { type: "application/pdf" })
    const url = window.URL.createObjectURL(pdfBlob)
    const anchor = document.createElement("a")

    anchor.href = url
    anchor.download = `Invoice-${invoice.invoiceNumber}.pdf`

    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()

    window.URL.revokeObjectURL(url)

    if (response.headers.get("X-EasyBill-Pdf-Engine")?.includes("playwright")) {
      setDownloadNotice("Saved as vector PDF (full quality).")
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
    console.warn("Network or unexpected error — trying high-quality backup export:", primaryErr)
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


/* LOAD INVOICE + TEMPLATE */

useEffect(()=>{

const savedInvoices = getActiveOrGlobalItem("invoices")
if(savedInvoices){

const invoices = JSON.parse(savedInvoices)

const found = invoices.find((inv:any)=>inv.invoiceNumber === id)

if(found){
setInvoice(found)
}

}

const savedTemplate = getActiveOrGlobalItem("invoiceTemplate")
if(savedTemplate){
setTemplate(savedTemplate)
}

const typography = getStoredTemplateTypography()
setFontId(typography.fontId)
setFontFamily(typography.fontFamily)
setFontSize(typography.fontSize)

setBusiness(getStoredBusinessRecord())

},[id])


function money(value:number){

return formatCurrency(
value,
currencySymbol,
currencyPosition,
showDecimals,
amountFormat
)

}

function gstDisplay(rate:any, amount:number){

if(!rate || rate === "" || rate === "0"){
return "-"
}

return `${money(amount)} (${rate}%)`

}


if(!invoice){
return <div className="p-6 text-sm text-slate-500">Invoice not found in this account.</div>
}


/* GST SUMMARY */

let subtotal = 0
let totalCGST = 0
let totalSGST = 0
let totalIGST = 0

invoice.items.forEach((item:any)=>{

const base = item.qty * item.price

const cgstAmount = item.cgst ? (base * Number(item.cgst))/100 : 0
const sgstAmount = item.sgst ? (base * Number(item.sgst))/100 : 0
const igstAmount = item.igst ? (base * Number(item.igst))/100 : 0

subtotal += base
totalCGST += cgstAmount
totalSGST += sgstAmount
totalIGST += igstAmount

})


const templateData = {
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
invoiceVisibility
}


return(

<div className="p-4">

{/* BUTTONS */}

<div className="flex justify-end gap-3 mb-6">

<button
onClick={downloadInvoice}
disabled={downloadingPdf}
className={`px-4 py-2 rounded text-white transition ${
  downloadingPdf
    ? "bg-slate-400 cursor-not-allowed"
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


{/* Hidden capture tree: same template + padding as A4 view, without pagination/transform wrappers. */}
<div
  ref={captureRef}
  data-easybill-pdf-capture="true"
  aria-hidden
  className="pointer-events-none fixed top-0 left-0 -z-10 opacity-[0.01] [&_*]:pointer-events-none"
  style={{
    width: A4_CAPTURE_WIDTH_PX,
    padding: A4_CAPTURE_PADDING_PX,
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
  }}
>
  <TemplateComponent {...templateData} />
</div>

{/* INVOICE: strict A4-only renderer on mobile & desktop */}
<A4InvoiceView TemplateComponent={TemplateComponent} templateData={templateData} />

</div>

)

}
