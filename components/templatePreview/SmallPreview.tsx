// @ts-nocheck
"use client"

import { createElement } from "react"
import { templates as templateEngines } from "@/components/invoiceTemplates"
import { previewTemplateProps } from "@/lib/templatePreviewData"

function getTemplateEngine(id: string) {
  if (id.startsWith("modern")) return templateEngines.modern
  if (id.startsWith("minimal")) return templateEngines.minimal
  if (id === "classic-default") return templateEngines.default
  if (id.startsWith("classic")) return templateEngines.classic

  return templateEngines.default
}

export default function SmallPreview({
  template,
  fontFamily = previewTemplateProps.fontFamily,
  fontSize = previewTemplateProps.fontSize,
}: {
  template: string
  fontFamily?: string
  fontSize?: number
}) {
  const engine = getTemplateEngine(template)

  return (
    <div className="aspect-[1/1.414] w-[140px] overflow-hidden rounded border bg-white">
      <div className="origin-top-left scale-[0.16] w-[600%]">
        {createElement(engine, {
          ...previewTemplateProps,
          templateId: template,
          fontFamily,
          fontSize,
        })}
      </div>
    </div>
  )
}
