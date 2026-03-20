"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { templates as templateEngines } from "@/components/invoiceTemplates"
import SmallPreview from "@/components/templatePreview/SmallPreview"
import { previewTemplateProps } from "@/lib/templatePreviewData"
import { getStoredTemplateTypography } from "@/lib/templateTypography"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import A4LargePreview from "@/components/templatePreview/A4LargePreview"
import { canUseTemplate } from "@/lib/plans"
import { useAppAlert } from "@/components/providers/AppAlertProvider"
import { TEMPLATE_CROSS_DEVICE_PARITY } from "@/lib/templateDeviceParity"

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
const [isXl, setIsXl] = useState(false)

useEffect(() => {
  const mq = window.matchMedia("(min-width: 1280px)")
  const apply = () => setIsXl(mq.matches)
  apply()
  mq.addEventListener("change", apply)
  return () => mq.removeEventListener("change", apply)
}, [])

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

const activateLabel = canUseTemplate(previewTemplate)
  ? "Use This Template"
  : "Upgrade to use this template"

return(

<div className="grid gap-6 pb-28 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start xl:gap-8 xl:pb-0">

{/* LEFT SIDE */}

<div className="min-w-0">

<div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">

{pagedTemplates.map((t:any)=>{

const isActive = activeTemplate===t.id
const locked = !canUseTemplate(t.id)

return(

<div
key={t.id}
role="button"
tabIndex={0}
onClick={()=>setPreviewTemplate(t.id)}
onKeyDown={(e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    setPreviewTemplate(t.id)
  }
}}
className={`cursor-pointer rounded-[20px] border p-2.5 transition duration-200 xl:rounded-[24px] xl:p-3 ${
previewTemplate===t.id
? "border-slate-950 bg-slate-950/5 shadow-lg ring-2 ring-slate-950/10 xl:ring-0"
: "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
}`}
>

<SmallPreview template={t.id} fontFamily={fontFamily} fontSize={fontSize}/>

<p className="mt-2 line-clamp-2 text-xs font-semibold leading-tight text-slate-900 xl:mt-3 xl:text-sm">
{t.name} {locked ? <span className="text-slate-500">🔒</span> : null}
</p>

{isActive && (
<p className="mt-1 text-[10px] font-medium text-emerald-700 xl:text-xs">
Active
</p>
)}

</div>

)

})}

</div>

{templates.length > perPage ? (
  <div className="mt-5 space-y-3 xl:mt-6">
    <div className="flex items-center justify-between gap-3 sm:hidden">
      <button
        type="button"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={safePage <= 1}
        className="min-h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
      >
        Previous
      </button>
      <p className="shrink-0 text-xs font-medium text-slate-500">
        Page {safePage} / {totalPages}
      </p>
      <button
        type="button"
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={safePage >= totalPages}
        className="min-h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
      >
        Next
      </button>
    </div>
    <div className="hidden flex-wrap items-center justify-center gap-2 sm:flex">
    <button
      type="button"
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={safePage <= 1}
      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      Prev
    </button>
    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
      <button
        key={p}
        type="button"
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
      type="button"
      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      disabled={safePage >= totalPages}
      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      Next
    </button>
    </div>
  </div>
) : null}

</div>


{/* RIGHT SIDE */}

<div className="soft-card flex w-full max-w-full flex-col rounded-[22px] p-4 sm:p-5 xl:sticky xl:top-8 xl:max-w-[420px] xl:justify-self-end xl:rounded-[28px] xl:p-6">

<div className="mb-3 xl:mb-4">
<h2 className="section-title text-lg sm:text-xl xl:text-2xl">
Live Preview
</h2>
<p className="mt-1 text-xs text-slate-500 sm:text-sm">Preview exactly how your PDF will look on A4.</p>
</div>

<div className="min-h-0 flex-1">
  <A4LargePreview
    template={previewTemplate}
    fontFamily={fontFamily}
    fontSize={fontSize}
    viewportMaxHeight={TEMPLATE_CROSS_DEVICE_PARITY ? 520 : isXl ? 520 : 360}
  />
</div>

<div className="mt-4 hidden xl:mt-6 xl:block">
<p className="mb-3 text-xs leading-5 text-slate-500">
  A4-sized preview. Scrolling appears only when content flows to page 2 (preview capped at 2 pages).
</p>

{activeTemplate===previewTemplate ? (

<button
type="button"
disabled
className="w-full rounded-2xl bg-slate-200 py-3 text-sm font-semibold text-slate-500"
>
Currently Active
</button>

):( 

<button
type="button"
onClick={activateTemplate}
className={`w-full rounded-2xl py-3 text-sm font-semibold text-white transition ${
  canUseTemplate(previewTemplate) ? "bg-slate-950 hover:bg-slate-800" : "bg-slate-400 cursor-not-allowed"
}`}
disabled={!canUseTemplate(previewTemplate)}
>
{activateLabel}
</button>

)}

</div>

</div>

{/* Mobile sticky CTA */}
<div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur-md xl:hidden">
  <p className="mb-2 text-center text-[10px] leading-4 text-slate-500">
    A4 preview above · scroll if your invoice spans 2 pages
  </p>
  {activeTemplate === previewTemplate ? (
    <button type="button" disabled className="w-full rounded-2xl bg-slate-200 py-3.5 text-sm font-semibold text-slate-500">
      Currently Active
    </button>
  ) : (
    <button
      type="button"
      onClick={activateTemplate}
      className={`w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 ${
        canUseTemplate(previewTemplate) ? "bg-slate-950 hover:bg-slate-800" : "bg-slate-400"
      }`}
      disabled={!canUseTemplate(previewTemplate)}
    >
      {activateLabel}
    </button>
  )}
</div>

</div>

)

}

