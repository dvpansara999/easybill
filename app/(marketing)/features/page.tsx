import SeoLandingTemplate from "@/components/marketing/SeoLandingTemplate"
import { metadataForSeoPage } from "@/lib/marketing/seoMetadata"
import { seoFeatures } from "@/lib/marketing/seoPagesData"

export const metadata = metadataForSeoPage(seoFeatures)

export default function FeaturesPage() {
  return <SeoLandingTemplate activePath="/features" content={seoFeatures.content} />
}
