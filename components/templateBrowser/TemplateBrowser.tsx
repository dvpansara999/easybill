"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { templates as templateEngines } from "@/components/invoiceTemplates"
import SmallPreview from "@/components/templatePreview/SmallPreview"
import { previewTemplateProps } from "@/lib/templatePreviewData"
import { getStoredTemplateTypography } from "@/lib/templateTypography"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import A4LargePreview from "@/components/templatePreview/A4LargePreview"
import { canUseTemplate } from "@/lib/plans"
import { useAppAlert } from "@/components/providers/AppAlertProvider"

function getTemplateEngine(id:string){

if(id.startsWith("modern")) return templateEngines.modern
if(id.startsWith("minimal")) return templateEngines.minimal
if(id === "classic-default") return templateEngines.default
if(id.startsWith("classic")) return templateEngines.classic

return templateEngines.default

}

export default function TemplateBrowser({templates}:{templates:any[]}){

const router = useRouter()
const { showAlert } = useAppAlert()
const [previewTemplate,setPreviewTemplate] = useState(templates[0]?.id)
const [activeTemplate,setActiveTemplate] = useState("")
const [ready,setReady] = useState(false)
const [fontFamily,setFontFamily] = useState(previewTemplateProps.fontFamily)
const [fontSize,setFontSize] = useState(previewTemplateProps.fontSize)
const [page,setPage] = useState(1)
const perPage = 12

useEffect(()=>{

if(typeof window === "undefined") return

const savedTemplate = getActiveOrGlobalItem("invoiceTemplate")

if(savedTemplate){
setActiveTemplate(savedTemplate)
setPreviewTemplate(savedTemplate)
}

const typography = getStoredTemplateTypography()
setFontFamily(typography.fontFamily)
setFontSize(typography.fontSize)

setReady(true)

},[])

useEffect(()=>{
  // Keep preview selection valid if templates list changes.
  if(!templates?.length) return
  if(!previewTemplate){
    setPreviewTemplate(templates[0].id)
  }
},[templates, previewTemplate])

useEffect(()=>{
  // Reset page when category changes.
  setPage(1)
},[templates])

function activateTemplate(){

if(!canUseTemplate(previewTemplate)){
  showAlert({
    tone: "warning",
    title: "Template locked (Free plan)",
    message: "This template is available on Plus. Upgrade to unlock it.",
    primaryLabel: "Upgrade to Plus",
    secondaryLabel: "Not now",
    onPrimary: () => router.push("/dashboard/upgrade"),
  })
  return
}

setActiveOrGlobalItem("invoiceTemplate",previewTemplate)
setActiveTemplate(previewTemplate)

showAlert({
  tone: "success",
  title: "Template applied",
  message: "This template will be used for new invoices (and previews) in easyBILL.",
  primaryLabel: "OK",
})

}

if(!ready) return null

const totalPages = Math.max(1, Math.ceil(templates.length / perPage))
const safePage = Math.min(Math.max(1, page), totalPages)
const start = (safePage - 1) * perPage
const pagedTemplates = templates.slice(start, start + perPage)

return(

<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">

{/* LEFT SIDE */}

<div className="min-w-0">

<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

{pagedTemplates.map((t:any)=>{

const isActive = activeTemplate===t.id
const locked = !canUseTemplate(t.id)

return(

<div
key={t.id}
onClick={()=>setPreviewTemplate(t.id)}
className={`cursor-pointer rounded-[24px] border p-3 transition duration-200 ${
previewTemplate===t.id
? "border-slate-950 bg-slate-950/5 shadow-lg"
: "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
}`}
>

<SmallPreview template={t.id} fontFamily={fontFamily} fontSize={fontSize}/>

<p className="mt-3 text-sm font-semibold text-slate-900">
{t.name} {locked ? <span className="text-slate-500">🔒</span> : null}
</p>

{isActive && (
<p className="mt-1 text-xs font-medium text-emerald-700">
Active
</p>
)}

</div>

)

})}

</div>

{templates.length > perPage ? (
  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
    <button
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={safePage <= 1}
      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      Prev
    </button>
    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
      <button
        key={p}
        onClick={() => setPage(p)}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
          p === safePage
            ? "bg-slate-950 text-white"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {p}
      </button>
    ))}
    <button
      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      disabled={safePage >= totalPages}
      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      Next
    </button>
  </div>
) : null}

</div>


{/* RIGHT SIDE */}

<div className="soft-card sticky top-8 flex w-full max-w-[420px] flex-col justify-self-end rounded-[28px] p-6">

<div className="mb-4">
<h2 className="section-title text-2xl">
Live Preview
</h2>
<p className="mt-1 text-sm text-slate-500">Preview exactly how your PDF will look on A4.</p>
</div>

<div className="min-h-0 flex-1">
  <A4LargePreview template={previewTemplate} fontFamily={fontFamily} fontSize={fontSize} viewportMaxHeight={520}/>
</div>

<div className="mt-6">
<p className="mb-3 text-xs leading-5 text-slate-500">
  A4-sized preview. Scrolling appears only when content flows to page 2 (preview capped at 2 pages).
</p>

{activeTemplate===previewTemplate ? (

<button
disabled
className="w-full rounded-2xl bg-slate-200 py-3 text-sm font-semibold text-slate-500"
>
Currently Active
</button>

):( 

<button
onClick={activateTemplate}
className={`w-full rounded-2xl py-3 text-sm font-semibold text-white transition ${
  canUseTemplate(previewTemplate) ? "bg-slate-950 hover:bg-slate-800" : "bg-slate-400 cursor-not-allowed"
}`}
disabled={!canUseTemplate(previewTemplate)}
>
{canUseTemplate(previewTemplate) ? "Use This Template" : "Upgrade to use this template"}
</button>

)}

</div>

</div>

</div>

)

}

