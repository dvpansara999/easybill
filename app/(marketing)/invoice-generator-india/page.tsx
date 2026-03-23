import SeoLandingTemplate from "@/components/marketing/SeoLandingTemplate"
import { metadataForSeoPage } from "@/lib/marketing/seoMetadata"
import { seoInvoiceGeneratorIndia } from "@/lib/marketing/seoPagesData"

export const metadata = metadataForSeoPage(seoInvoiceGeneratorIndia)

export default function InvoiceGeneratorIndiaPage() {
  return <SeoLandingTemplate activePath="/invoice-generator-india" content={seoInvoiceGeneratorIndia.content} />
}
