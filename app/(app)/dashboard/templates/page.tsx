"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { templates as templateEngines } from "@/components/invoiceTemplates"
import { templateRegistry } from "@/components/invoiceTemplates/loadTemplates"
import { previewTemplateProps } from "@/lib/templatePreviewData"
import { getStoredTemplateTypography, saveStoredTemplateTypography, templateFontOptions, templateFontSizeOptions } from "@/lib/templateTypography"
import { getActiveOrGlobalItem, isActiveUserKvHydrated, setActiveOrGlobalItem } from "@/lib/userStore"
import A4LargePreview from "@/components/templatePreview/A4LargePreview"
import { canUseTemplate, getActivePlanId } from "@/lib/plans"
import SelectMenu from "@/components/ui/SelectMenu"
import { useAppAlert } from "@/components/providers/AppAlertProvider"
import { getAuthMode } from "@/lib/runtimeMode"

function getTemplateEngine(id: string) {

  if (id.startsWith("modern")) {
    return templateEngines.modern
  }

  if (id.startsWith("minimal")) {
    return templateEngines.minimal
  }

  if (id === "classic-default") {
    return templateEngines.default
  }

  if (id.startsWith("classic")) {
    return templateEngines.classic
  }

  return templateEngines.default
}

export default function TemplatesPage(){

const router = useRouter()
const { showAlert } = useAppAlert()

const [previewTemplate,setPreviewTemplate] = useState("classic-default")
const [activeTemplate,setActiveTemplate] = useState("classic-default")
const [fontId,setFontId] = useState("system")
const [fontFamily,setFontFamily] = useState(previewTemplateProps.fontFamily)
const [fontSize,setFontSize] = useState(previewTemplateProps.fontSize)
const leftColumnRef = useRef<HTMLDivElement | null>(null)
const [leftColumnHeight,setLeftColumnHeight] = useState<number>(0)

const templates = templateRegistry || []

useEffect(()=>{
  if(!leftColumnRef.current) return
  const el = leftColumnRef.current
  const ro = new ResizeObserver((entries)=>{
    const h = entries[0]?.contentRect?.height || 0
    setLeftColumnHeight(h)
  })
  ro.observe(el)
  setLeftColumnHeight(el.getBoundingClientRect().height)
  return ()=>ro.disconnect()
},[])

useEffect(()=>{
  function initFromStore(writeDefaults: boolean) {
    const saved = getActiveOrGlobalItem("invoiceTemplate")
    if (saved) {
      setActiveTemplate(saved)
      setPreviewTemplate(saved)
    } else if (writeDefaults) {
      // Brand-new user default.
      setActiveOrGlobalItem("invoiceTemplate", "classic-default")
    }

    const typography = getStoredTemplateTypography()
    setFontId(typography.fontId)
    setFontFamily(typography.fontFamily)
    setFontSize(typography.fontSize)
  }

  const shouldWriteDefaults =
    getAuthMode() !== "supabase" || isActiveUserKvHydrated()

  initFromStore(shouldWriteDefaults)

  function onCloud() {
    initFromStore(true)
  }
  window.addEventListener("easybill:cloud-sync", onCloud as EventListener)
  return () => window.removeEventListener("easybill:cloud-sync", onCloud as EventListener)
},[])

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

function updateFont(nextFontId:string){

const option = templateFontOptions.find((item)=>item.id === nextFontId)
const nextFontFamily = option?.css || previewTemplateProps.fontFamily

setFontId(nextFontId)
setFontFamily(nextFontFamily)
saveStoredTemplateTypography(nextFontId,fontSize)

}

function updateFontSize(nextFontSize:number){

setFontSize(nextFontSize)
saveStoredTemplateTypography(fontId,nextFontSize)

}

function pickRandomTemplates(list:any[], count:number){
  const copy = [...list]
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.min(count, copy.length))
}

const popular = useMemo(()=>{
  const curated = templates.filter((t:any)=>t.popular)
  return curated.length ? curated : pickRandomTemplates(templates, 10)
},[templates])

// Always show "newest" as the most recently added templates (registry order).
const newest = useMemo(()=>{
  return templates.slice().reverse().slice(0, 12)
},[templates])

return(

<div className="space-y-8 overflow-x-hidden">

<section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
<div>
<p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Templates</p>
<h1 className="font-display mt-3 max-w-none text-[2.45rem] leading-[1.08] text-slate-950">
Choose the invoice experience that
<br />
your customers will remember.
</h1>
<p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
Browse styles, preview them instantly, and tune typography — all inside easyBILL.
</p>
</div>

<div className="soft-card rounded-[28px] p-6">
<div className="mb-4 flex items-center gap-3">
<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
<Sparkles className="h-5 w-5" />
</div>
<div>
<p className="text-sm font-semibold text-slate-900">Typography</p>
</div>
</div>

<div className="grid gap-4 md:grid-cols-2">
<div>
<label className="mb-2 block text-sm font-medium text-slate-700">Invoice Font</label>
<SelectMenu
  value={fontId}
  onChange={updateFont}
  options={templateFontOptions.map((o) => ({ value: o.id, label: o.label }))}
/>
</div>

<div>
<label className="mb-2 block text-sm font-medium text-slate-700">Font Size</label>
<SelectMenu
  value={String(fontSize)}
  onChange={(v) => updateFontSize(Number(v))}
  options={templateFontSizeOptions.map((size) => ({ value: String(size), label: `${size}px` }))}
/>
</div>
</div>
</div>
</section>

<section className="grid gap-4 md:grid-cols-3 xl:max-w-2xl">
<button onClick={()=>router.push("/dashboard/templates/modern")} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
Modern
</button>
<button onClick={()=>router.push("/dashboard/templates/minimal")} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
Minimal
</button>
<button onClick={()=>router.push("/dashboard/templates/classic")} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
Classic
</button>
</section>

<section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
<div ref={leftColumnRef} className="min-w-0 space-y-8">
<div className="soft-card rounded-[28px] p-6">
<h2 className="section-title text-2xl">Most Popular Templates</h2>
<p className="mt-1 text-sm text-slate-500">The styles users reach for most often.</p>

<div className="mt-5 overflow-x-auto pb-3">
<div className="flex w-max gap-4 pr-1">
{popular.map((t:any)=>{

const isActive = activeTemplate===t.id
const locked = !canUseTemplate(t.id)

return(
<div
key={t.id}
onClick={()=>setPreviewTemplate(t.id)}
className={`min-w-[118px] max-w-[118px] cursor-pointer rounded-[20px] border p-2.5 transition ${
previewTemplate===t.id
? "border-slate-950 bg-slate-950/5 shadow-lg"
: "border-slate-200 bg-white hover:border-slate-300"
}`}
>
<SmallPreview template={t.id} fontFamily={fontFamily} fontSize={fontSize}/>
<p className="mt-2.5 text-xs font-semibold text-slate-900">
  {t.name} {locked ? <span className="text-slate-500">🔒</span> : null}
</p>
{isActive&&(
<p className="mt-1 text-[11px] font-medium text-emerald-700">Active</p>
)}
</div>
)

})}
</div>
</div>
</div>

<div className="soft-card rounded-[28px] p-6">
<h2 className="section-title text-2xl">Newest Templates Available</h2>
<p className="mt-1 text-sm text-slate-500">Fresh layouts added to our template marketplace.</p>

<div className="mt-5 overflow-x-auto pb-3">
<div className="flex w-max gap-4 pr-1">
{newest.map((t:any)=>{

const isActive = activeTemplate===t.id
const locked = !canUseTemplate(t.id)

return(
<div
key={t.id}
onClick={()=>setPreviewTemplate(t.id)}
className={`min-w-[118px] max-w-[118px] cursor-pointer rounded-[20px] border p-2.5 transition ${
previewTemplate===t.id
? "border-slate-950 bg-slate-950/5 shadow-lg"
: "border-slate-200 bg-white hover:border-slate-300"
}`}
>
<SmallPreview template={t.id} fontFamily={fontFamily} fontSize={fontSize}/>
<p className="mt-2.5 text-xs font-semibold text-slate-900">
  {t.name} {locked ? <span className="text-slate-500">🔒</span> : null}
</p>
{isActive&&(
<p className="mt-1 text-[11px] font-medium text-emerald-700">Active</p>
)}
</div>
)

})}
</div>
</div>
</div>
</div>

<div
  className="soft-card sticky top-8 flex w-full max-w-[420px] flex-col justify-self-end overflow-hidden rounded-[28px] p-6"
  style={leftColumnHeight ? { maxHeight: leftColumnHeight } : undefined}
>
<div className="mb-4">
<h2 className="section-title text-2xl">Live Preview</h2>
<p className="mt-1 text-sm text-slate-500">See the exact direction before you activate it.</p>
</div>

<div className="min-h-0 flex-1">
  <A4LargePreview template={previewTemplate} fontFamily={fontFamily} fontSize={fontSize} viewportMaxHeight={520}/>
</div>

<div className="mt-6">
<p className="mb-3 text-xs leading-5 text-slate-500">
  Preview is sized like A4 PDF output. Scroll appears only if it flows to page 2 (preview capped at 2 pages).
</p>
{activeTemplate===previewTemplate ? (
<button disabled className="w-full rounded-2xl bg-slate-200 py-3 text-sm font-semibold text-slate-500">
Currently Active
</button>
) : (
<button onClick={activateTemplate} className="w-full rounded-2xl bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
{canUseTemplate(previewTemplate) ? "Use This Template" : getActivePlanId() === "free" ? "Upgrade to use this template" : "Use This Template"}
</button>
)}
</div>
</div>
</section>

</div>

)

}

function SmallPreview({template,fontFamily,fontSize}:{template:string; fontFamily:string; fontSize:number}){

const Engine = getTemplateEngine(template)

if(!Engine) return null

return(

<div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white aspect-[1/1.414]">
<div className="origin-top-left scale-[0.14] w-[715%]">
<Engine {...previewTemplateProps} templateId={template} fontFamily={fontFamily} fontSize={fontSize}/>
</div>
</div>

)

}
