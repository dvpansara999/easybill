import SeoLandingTemplate from "@/components/marketing/SeoLandingTemplate"
import { metadataForSeoPage } from "@/lib/marketing/seoMetadata"
import { seoDownloadInvoicePdf } from "@/lib/marketing/seoPagesData"

export const metadata = metadataForSeoPage(seoDownloadInvoicePdf)

export default function DownloadInvoicePdfPage() {
  return <SeoLandingTemplate activePath="/download-invoice-pdf" content={seoDownloadInvoicePdf.content} />
}
