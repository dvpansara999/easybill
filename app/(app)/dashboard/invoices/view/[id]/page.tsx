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

import { templates } from "@/components/invoiceTemplates"

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

const invoiceRef = useRef<HTMLDivElement>(null)


/* DOWNLOAD PDF */

async function downloadInvoiceFallback(){

  const element = invoiceRef.current
  if(!element) return

  // Capture an unscaled A4 DOM subtree to make html2canvas output stable across mobile/desktop.
  const captureEl = (element.querySelector('[data-html2canvas-capture]') as HTMLElement | null) || element

  const nodes = captureEl.querySelectorAll<HTMLElement>("*")
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

    const canvas = await html2canvas(captureEl,{
      scale:2,
      useCORS:true,
      backgroundColor:"#ffffff"
    })

    const pdf = new jsPDF({
      orientation:"portrait",
      unit:"mm",
      format:"a4"
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    const imgData = canvas.toDataURL("image/png")

    pdf.addImage(imgData,"PNG",0,position,imgWidth,imgHeight)
    heightLeft -= pageHeight

    while(heightLeft > 0){
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData,"PNG",0,position,imgWidth,imgHeight)
      heightLeft -= pageHeight
    }

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

  try {
    const response = await fetch("/api/invoice-pdf",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        invoiceId: String(id || invoice?.invoiceNumber || ""),
        mode: "download",
      })
    })

    if(!response.ok){
      throw new Error(`PDF export failed with status ${response.status}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")

    anchor.href = url
    anchor.download = `Invoice-${invoice.invoiceNumber}.pdf`

    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()

    window.URL.revokeObjectURL(url)

  } catch {
    try {
      await downloadInvoiceFallback()
    } catch {
      setDownloadError("Unable to download PDF right now. Please try again.")
    }
  } finally {
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


{/* INVOICE: strict A4-only renderer on mobile & desktop */}
<A4InvoiceView ref={invoiceRef} TemplateComponent={TemplateComponent} templateData={templateData} />

</div>

)

}
