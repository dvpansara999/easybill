"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Sparkles } from "lucide-react"
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
import { TEMPLATE_CROSS_DEVICE_PARITY } from "@/lib/templateDeviceParity"

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
const [isXl, setIsXl] = useState(false)

const templates = templateRegistry || []

useEffect(() => {
  const mq = window.matchMedia("(min-width: 1280px)")
  const apply = () => setIsXl(mq.matches)
  apply()
  mq.addEventListener("change", apply)
  return () => mq.removeEventListener("change", apply)
}, [])

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

const typographyFields = (
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
)

const activateLabel =
  canUseTemplate(previewTemplate)
    ? "Use This Template"
    : getActivePlanId() === "free"
      ? "Upgrade to use this template"
      : "Use This Template"

return(

<div className="space-y-5 overflow-x-hidden pb-28 xl:space-y-8 xl:pb-0">

<section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:gap-6">
<div className="rounded-[22px] border border-slate-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-slate-50/80 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none">
<p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-emerald-700 xl:text-xs">Templates</p>
<h1 className="font-display mt-2 max-w-none text-2xl leading-[1.15] text-slate-950 sm:text-3xl xl:mt-3 xl:text-[2.45rem] xl:leading-[1.08]">
Choose the invoice experience that
<br className="hidden xl:block" />
your customers will remember.
</h1>
<p className="mt-2 max-w-2xl text-xs leading-6 text-slate-600 sm:text-sm sm:leading-7 xl:mt-3 xl:text-slate-500">
Browse styles, preview them instantly, and tune typography — all inside easyBILL.
</p>
</div>

{/* Mobile: collapsible typography */}
<details className="group soft-card overflow-visible rounded-[22px] border border-slate-200/80 xl:hidden">
  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
    <span className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Sparkles className="h-5 w-5" />
      </span>
      Typography &amp; font
    </span>
    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
  </summary>
  <div className="border-t border-slate-100 px-4 pb-4 pt-2">{typographyFields}</div>
</details>

{/* Desktop: typography card (unchanged layout) */}
<div className="soft-card hidden rounded-[28px] p-6 xl:block">
  <div className="mb-4 flex items-center gap-3">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
      <Sparkles className="h-5 w-5" />
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-900">Typography</p>
    </div>
  </div>
  {typographyFields}
</div>
</section>

<section className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:snap-none md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0 xl:max-w-2xl [&::-webkit-scrollbar]:hidden">
<button
  type="button"
  onClick={()=>router.push("/dashboard/templates/modern")}
  className="shrink-0 snap-start rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 md:shrink md:py-4"
>
  Modern
</button>
<button
  type="button"
  onClick={()=>router.push("/dashboard/templates/minimal")}
  className="shrink-0 snap-start rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 md:shrink md:py-4"
>
  Minimal
</button>
<button
  type="button"
  onClick={()=>router.push("/dashboard/templates/classic")}
  className="shrink-0 snap-start rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 md:shrink md:py-4"
>
  Classic
</button>
</section>

<section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start xl:gap-8">
<div ref={leftColumnRef} className="min-w-0 space-y-5 xl:space-y-8">
<div className="soft-card rounded-[22px] p-4 sm:p-5 xl:rounded-[28px] xl:p-6">
<h2 className="section-title text-lg sm:text-xl xl:text-2xl">Most Popular Templates</h2>
<p className="mt-1 text-xs text-slate-500 sm:text-sm">The styles users reach for most often.</p>

<div className="mt-4 overflow-x-auto pb-2 xl:mt-5 xl:pb-3">
<div className="flex w-max snap-x snap-mandatory gap-3 pr-2 xl:gap-4 xl:pr-1">
{popular.map((t:any)=>{

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
className={`min-w-[128px] max-w-[128px] cursor-pointer snap-start rounded-[18px] border p-2.5 transition xl:min-w-[118px] xl:max-w-[118px] xl:rounded-[20px] ${
previewTemplate===t.id
? "border-slate-950 bg-slate-950/5 shadow-lg ring-2 ring-slate-950/10"
: "border-slate-200 bg-white hover:border-slate-300"
}`}
>
<SmallPreview template={t.id} fontFamily={fontFamily} fontSize={fontSize}/>
<p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-tight text-slate-900 xl:mt-2.5 xl:text-xs">
  {t.name} {locked ? <span className="text-slate-500">🔒</span> : null}
</p>
{isActive&&(
<p className="mt-1 text-[10px] font-medium text-emerald-700 xl:text-[11px]">Active</p>
)}
</div>
)

})}
</div>
</div>
</div>

<div className="soft-card rounded-[22px] p-4 sm:p-5 xl:rounded-[28px] xl:p-6">
<h2 className="section-title text-lg sm:text-xl xl:text-2xl">Newest Templates Available</h2>
<p className="mt-1 text-xs text-slate-500 sm:text-sm">Fresh layouts added to our template marketplace.</p>

<div className="mt-4 overflow-x-auto pb-2 xl:mt-5 xl:pb-3">
<div className="flex w-max snap-x snap-mandatory gap-3 pr-2 xl:gap-4 xl:pr-1">
{newest.map((t:any)=>{

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
className={`min-w-[128px] max-w-[128px] cursor-pointer snap-start rounded-[18px] border p-2.5 transition xl:min-w-[118px] xl:max-w-[118px] xl:rounded-[20px] ${
previewTemplate===t.id
? "border-slate-950 bg-slate-950/5 shadow-lg ring-2 ring-slate-950/10"
: "border-slate-200 bg-white hover:border-slate-300"
}`}
>
<SmallPreview template={t.id} fontFamily={fontFamily} fontSize={fontSize}/>
<p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-tight text-slate-900 xl:mt-2.5 xl:text-xs">
  {t.name} {locked ? <span className="text-slate-500">🔒</span> : null}
</p>
{isActive&&(
<p className="mt-1 text-[10px] font-medium text-emerald-700 xl:text-[11px]">Active</p>
)}
</div>
)

})}
</div>
</div>
</div>
</div>

<div
  className="soft-card flex w-full max-w-full flex-col overflow-hidden rounded-[22px] p-4 sm:p-5 xl:sticky xl:top-8 xl:max-w-[420px] xl:justify-self-end xl:rounded-[28px] xl:p-6"
  style={isXl && leftColumnHeight ? { maxHeight: leftColumnHeight } : undefined}
>
<div className="mb-3 xl:mb-4">
<h2 className="section-title text-lg sm:text-xl xl:text-2xl">Live Preview</h2>
<p className="mt-1 text-xs text-slate-500 sm:text-sm">See the exact direction before you activate it.</p>
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
  Preview is sized like A4 PDF output. Scroll appears only if it flows to page 2 (preview capped at 2 pages).
</p>
{activeTemplate===previewTemplate ? (
<button disabled className="w-full rounded-2xl bg-slate-200 py-3 text-sm font-semibold text-slate-500">
Currently Active
</button>
) : (
<button onClick={activateTemplate} className="w-full rounded-2xl bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
{activateLabel}
</button>
)}
</div>
</div>
</section>

{/* Mobile sticky CTA */}
<div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur-md xl:hidden">
<p className="mb-2 text-center text-[10px] leading-4 text-slate-500">
  A4-sized preview above · capped at 2 pages when content is long
</p>
{activeTemplate===previewTemplate ? (
<button type="button" disabled className="w-full rounded-2xl bg-slate-200 py-3.5 text-sm font-semibold text-slate-500">
Currently Active
</button>
) : (
<button
  type="button"
  onClick={activateTemplate}
  className="w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
>
{activateLabel}
</button>
)}
</div>

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
