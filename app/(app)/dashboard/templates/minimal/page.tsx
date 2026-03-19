"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import TemplateBrowser from "@/components/templateBrowser/TemplateBrowser"
import { templateRegistry } from "@/components/invoiceTemplates/loadTemplates"

export default function MinimalTemplatesPage(){

const router = useRouter()

const templates = templateRegistry.filter((t)=>t.category === "minimal")

return(

<div className="space-y-8">

<button
onClick={()=>router.back()}
className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
>
<ArrowLeft className="h-4 w-4" />
Back to Templates
</button>

<section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
<div>
<p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Minimal Collection</p>
<h1 className="font-display mt-3 text-[2.45rem] leading-[1.08] text-slate-950">Explore minimal templates shaped around clarity and calm.</h1>
<p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
Browse our minimal layouts, preview them instantly, and choose a cleaner invoice direction with less visual noise.
</p>
</div>

<div className="soft-card rounded-[28px] p-6">
<p className="text-sm font-semibold text-slate-900">Minimal Templates</p>
<p className="mt-2 text-sm leading-7 text-slate-500">
These designs keep the structure light, the spacing breathable, and the invoice details easy to scan.
</p>
</div>
</section>

<TemplateBrowser templates={templates}/>

</div>

)

}
