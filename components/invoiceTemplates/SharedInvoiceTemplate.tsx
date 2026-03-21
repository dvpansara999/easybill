"use client"

import DefaultTemplate from "@/components/invoiceTemplates/Default"
import ClassicTemplate from "@/components/invoiceTemplates/Classic"
import MinimalTemplate from "@/components/invoiceTemplates/Minimal"
import ModernTemplate from "@/components/invoiceTemplates/Modern"
import type { TemplateComponentProps } from "@/components/invoiceTemplates/templateTypes"

function pickVariant(templateId: string | undefined) {
  const id = String(templateId || "classic-default")
  if (id === "classic-default" || id === "default") return DefaultTemplate
  if (id.startsWith("modern")) return ModernTemplate
  if (id.startsWith("minimal")) return MinimalTemplate
  if (id.startsWith("classic")) return ClassicTemplate
  return DefaultTemplate
}

export default function SharedInvoiceTemplate(props: TemplateComponentProps) {
  const Variant = pickVariant(props.templateId)
  return <Variant {...props} />
}

