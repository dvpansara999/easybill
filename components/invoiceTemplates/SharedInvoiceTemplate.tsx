"use client"

import DefaultTemplate from "@/components/invoiceTemplates/Default"
import ClassicTemplate from "@/components/invoiceTemplates/Classic"
import MinimalTemplate from "@/components/invoiceTemplates/Minimal"
import ModernTemplate from "@/components/invoiceTemplates/Modern"
import type { TemplateComponentProps } from "@/components/invoiceTemplates/templateTypes"
import { resolveTemplateId } from "@/lib/templateIds"

function pickVariant(templateId: string | undefined) {
  const id = resolveTemplateId(templateId)
  if (id === "default") return "default"
  if (id.startsWith("modern")) return "modern"
  if (id.startsWith("minimal")) return "minimal"
  if (id.startsWith("classic")) return "classic"
  return "default"
}

export default function SharedInvoiceTemplate(props: TemplateComponentProps) {
  const resolvedTemplateId = resolveTemplateId(props.templateId)
  const variant = pickVariant(resolvedTemplateId)
  if (variant === "modern") {
    return <ModernTemplate {...props} templateId={resolvedTemplateId} />
  }
  if (variant === "minimal") {
    return <MinimalTemplate {...props} templateId={resolvedTemplateId} />
  }
  if (variant === "classic") {
    return <ClassicTemplate {...props} templateId={resolvedTemplateId} />
  }
  return <DefaultTemplate {...props} />
}

