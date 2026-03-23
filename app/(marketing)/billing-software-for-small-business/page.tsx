import SeoLandingTemplate from "@/components/marketing/SeoLandingTemplate"
import { metadataForSeoPage } from "@/lib/marketing/seoMetadata"
import { seoBillingSoftwareSmallBusiness } from "@/lib/marketing/seoPagesData"

export const metadata = metadataForSeoPage(seoBillingSoftwareSmallBusiness)

export default function BillingSoftwareSmallBusinessPage() {
  return (
    <SeoLandingTemplate activePath="/billing-software-for-small-business" content={seoBillingSoftwareSmallBusiness.content} />
  )
}
