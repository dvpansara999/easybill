"use client"

import { templates as templateEngines } from "@/components/invoiceTemplates"
import { previewTemplateProps } from "@/lib/templatePreviewData"

function getTemplateEngine(id:string){

if(id.startsWith("modern")) return templateEngines.modern
if(id.startsWith("minimal")) return templateEngines.minimal
if(id === "classic-default") return templateEngines.default
if(id.startsWith("classic")) return templateEngines.classic

return templateEngines.default

}

export default function SmallPreview({
template,
fontFamily = previewTemplateProps.fontFamily,
fontSize = previewTemplateProps.fontSize
}:{template:string; fontFamily?:string; fontSize?:number}){

const Engine = getTemplateEngine(template)

if(!Engine) return null

return(

<div className="bg-white border rounded aspect-[1/1.414] overflow-hidden w-[140px]">

  <div className="scale-[0.16] origin-top-left w-[600%]">

    <Engine {...previewTemplateProps} templateId={template} fontFamily={fontFamily} fontSize={fontSize}/>

  </div>

</div>

)

}
