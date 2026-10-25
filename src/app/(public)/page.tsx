import type { Metadata } from "next"
import { HomePage } from "@/components/public-site/home/home-page"
import { getPublicSiteData } from "@/lib/public-site/server/data"

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getPublicSiteData()
  return {
    title: cms.settings.siteTitle || `${cms.identity.name} | Profil Sekolah`,
    description: cms.settings.siteDescription || undefined,
  }
}

export default function Page() {
  return <HomePage />
}
