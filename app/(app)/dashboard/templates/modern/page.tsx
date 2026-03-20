"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import TemplateBrowser from "@/components/templateBrowser/TemplateBrowser"
import { templateRegistry } from "@/components/invoiceTemplates/loadTemplates"

export default function ModernTemplatesPage(){

const router = useRouter()

const templates = templateRegistry.filter((t)=>t.category === "modern")

return(

<div className="space-y-5 xl:space-y-8">

<button
type="button"
onClick={()=>router.back()}
className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:w-auto sm:justify-start sm:rounded-full sm:py-2"
>
<ArrowLeft className="h-4 w-4" />
Back to Templates
</button>

<section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:gap-6">
<div className="rounded-[22px] border border-slate-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-slate-50/80 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none">
<p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-emerald-700 xl:text-xs">Modern Collection</p>
<h1 className="font-display mt-2 text-2xl leading-[1.15] text-slate-950 sm:text-3xl xl:mt-3 xl:text-[2.45rem] xl:leading-[1.08]">Explore modern templates built for bold, polished invoicing.</h1>
<p className="mt-2 max-w-2xl text-xs leading-6 text-slate-600 sm:text-sm sm:leading-7 xl:mt-3 xl:text-slate-500">
Browse our modern layouts, preview them instantly, and choose the direction that fits your business best.
</p>
</div>

<div className="soft-card rounded-[22px] p-4 sm:p-5 xl:rounded-[28px] xl:p-6">
<p className="text-sm font-semibold text-slate-900">Modern Templates</p>
<p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm sm:leading-7">
These designs lean into stronger contrast, cleaner hierarchy, and a more contemporary invoice feel.
</p>
</div>
</section>

<TemplateBrowser templates={templates}/>

</div>

)

}
