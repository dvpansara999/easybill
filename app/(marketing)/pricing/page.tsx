import SeoLandingTemplate from "@/components/marketing/SeoLandingTemplate"
import { metadataForSeoPage } from "@/lib/marketing/seoMetadata"
import { seoPricing } from "@/lib/marketing/seoPagesData"

export const metadata = metadataForSeoPage(seoPricing)

export default function PricingPage() {
  return <SeoLandingTemplate activePath="/pricing" content={seoPricing.content} />
}
