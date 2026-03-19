"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import { getStoredBusinessRecord } from "@/lib/invoice"
import { getStoredTemplateTypography } from "@/lib/templateTypography"
import { getActiveOrGlobalItem } from "@/lib/userStore"

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

  const nodes = element.querySelectorAll<HTMLElement>("*")
  const prev: Array<{el:HTMLElement; color:string; bg:string; border:string}> = []

  nodes.forEach((el)=>{
    prev.push({
      el,
      color: el.style.color,
      bg: el.style.backgroundColor,
      border: el.style.borderColor
    })

    el.style.color = "#000"
    el.style.backgroundColor = el.style.backgroundColor || "#fff"
    el.style.borderColor = "#000"
  })

  try {

    const canvas = await html2canvas(element,{
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

    prev.forEach(({el,color,bg,border})=>{
      el.style.color = color
      el.style.backgroundColor = bg
      el.style.borderColor = border
    })

  }

}

async function downloadInvoice(){

  if(!invoice){
    return
  }

  try {

    const businessProfile = getActiveOrGlobalItem("businessProfile")

    const response = await fetch("/api/invoice-pdf",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        invoice,
        template,
        businessProfile,
        typography:{
          fontId,
          fontSize
        },
        settings:{
          dateFormat,
          amountFormat,
          showDecimals,
          currencySymbol,
          currencyPosition,
          invoiceVisibility,
        }
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

    await downloadInvoiceFallback()

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
className="bg-black text-white px-4 py-2 rounded"
>
Download PDF
</button>

</div>


{/* INVOICE */}

<div ref={invoiceRef} className="bg-white p-6 max-w-[900px] mx-auto shadow-sm">

<TemplateComponent {...templateData} />

</div>

</div>

)

}
