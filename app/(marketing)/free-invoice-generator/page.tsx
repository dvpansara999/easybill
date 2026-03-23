import SeoLandingTemplate from "@/components/marketing/SeoLandingTemplate"
import { metadataForSeoPage } from "@/lib/marketing/seoMetadata"
import { seoFreeInvoiceGenerator } from "@/lib/marketing/seoPagesData"

export const metadata = metadataForSeoPage(seoFreeInvoiceGenerator)

export default function FreeInvoiceGeneratorPage() {
  return <SeoLandingTemplate activePath="/free-invoice-generator" content={seoFreeInvoiceGenerator.content} />
}
