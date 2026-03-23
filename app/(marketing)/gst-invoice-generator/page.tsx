import SeoLandingTemplate from "@/components/marketing/SeoLandingTemplate"
import { metadataForSeoPage } from "@/lib/marketing/seoMetadata"
import { seoGstInvoiceGenerator } from "@/lib/marketing/seoPagesData"

export const metadata = metadataForSeoPage(seoGstInvoiceGenerator)

export default function GstInvoiceGeneratorPage() {
  return <SeoLandingTemplate activePath="/gst-invoice-generator" content={seoGstInvoiceGenerator.content} />
}
