import SeoLandingTemplate from "@/components/marketing/SeoLandingTemplate"
import { metadataForSeoPage } from "@/lib/marketing/seoMetadata"
import { seoInvoiceCustomization } from "@/lib/marketing/seoPagesData"

export const metadata = metadataForSeoPage(seoInvoiceCustomization)

export default function InvoiceCustomizationPage() {
  return (
    <SeoLandingTemplate
      activePath="/invoice-customization"
      content={seoInvoiceCustomization.content}
    />
  )
}

