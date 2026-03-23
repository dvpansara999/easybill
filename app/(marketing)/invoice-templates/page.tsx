import SeoLandingTemplate from "@/components/marketing/SeoLandingTemplate"
import { metadataForSeoPage } from "@/lib/marketing/seoMetadata"
import { seoInvoiceTemplates } from "@/lib/marketing/seoPagesData"

export const metadata = metadataForSeoPage(seoInvoiceTemplates)

export default function InvoiceTemplatesPage() {
  return (
    <SeoLandingTemplate
      activePath="/invoice-templates"
      content={seoInvoiceTemplates.content}
    />
  )
}

