import SeoLandingTemplate from "@/components/marketing/SeoLandingTemplate"
import { metadataForSeoPage } from "@/lib/marketing/seoMetadata"
import { seoCreateInvoiceOnline } from "@/lib/marketing/seoPagesData"

export const metadata = metadataForSeoPage(seoCreateInvoiceOnline)

export default function CreateInvoiceOnlinePage() {
  return <SeoLandingTemplate activePath="/create-invoice-online" content={seoCreateInvoiceOnline.content} />
}
