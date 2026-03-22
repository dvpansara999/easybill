"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import TemplateBrowser from "@/components/templateBrowser/TemplateBrowser"
import { templateRegistry } from "@/components/invoiceTemplates/loadTemplates"

export default function ClassicTemplatesPage(){

const router = useRouter()

const templates = templateRegistry.filter((t)=>t.category === "classic")

return(

<div className="min-w-0 space-y-5 xl:space-y-8">

<button
type="button"
onClick={()=>router.back()}
className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:w-auto sm:justify-start sm:rounded-full sm:py-2"
>
<ArrowLeft className="h-4 w-4" />
Back to Templates
</button>

<section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,min(360px,40vw))] xl:gap-6">
<div className="soft-card relative min-w-0 overflow-hidden rounded-[22px] p-5 sm:p-6 xl:rounded-[28px] xl:p-8">
  <div
    className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-br from-emerald-50/45 via-white/40 to-slate-50/35 xl:rounded-[28px]"
    aria-hidden
  />
  <div className="relative">
    <p className="text-[10px] font-semibold tracking-[0.24em] text-emerald-700 xl:text-xs">
      <span className="text-slate-500">Templates</span>
      <span className="mx-1.5 text-slate-300">/</span>
      <span>Classic</span>
    </p>
    <h1 className="font-display mt-2 text-3xl leading-[1.12] text-slate-950 sm:text-4xl xl:mt-3 xl:text-[2.65rem] xl:leading-[1.06]">
      Classic templates
    </h1>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base xl:mt-4">
      Explore classic templates rooted in formal invoice tradition. Browse layouts, preview instantly, and choose a timeless style with a familiar structure.
    </p>
  </div>
</div>

<div className="soft-card rounded-[22px] p-4 sm:p-5 xl:rounded-[28px] xl:p-6">
<p className="text-sm font-semibold text-slate-900">Classic Templates</p>
<p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm sm:leading-7">
These designs lean into formal sections, traditional balance, and a more established paperwork feel.
</p>
</div>
</section>

<TemplateBrowser templates={templates}/>

</div>

)

}
