import { Suspense } from "react"
import { getPublicSiteData } from "@/lib/public-site/server/data"
import { HomeAbout } from "./home-about"
import { HomeExtracurriculars } from "./home-extracurriculars"
import { HomeFacilities } from "./home-facilities"
import { HomeFooter } from "./home-footer"
import { HomeHeader } from "./home-header"
import { HomeHero } from "./home-hero"
import { HomeNews } from "./home-news"
import { HomePrograms } from "./home-programs"
import { HomeAdmission } from "@/components/public-site/admissions/home-admission"

export function HomePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white p-10 text-center text-sm text-slate-500">Memuat website sekolah...</main>}>
      <PublicHome />
    </Suspense>
  )
}

async function PublicHome() {
  const cms = await getPublicSiteData()
  const publicNews = cms.records.items.slice(0, 2)
  const schoolName = cms?.identity.name || "SMA Cendekia Nusantara"
  const shortName = cms?.identity.shortName || schoolName
  const schoolAddress = cms?.identity.address || "Jl. Pendidikan No. 1, Bandung"
  const schoolPhone = cms?.identity.phone || "(022) 555-0101"

  return (
    <main className="site-public min-h-screen bg-white text-slate-900">
      <HomeHeader schoolName={schoolName} navigation={cms.navigation} />
      <HomeHero
        admissionEnabled={cms.settings.admissionEnabled}
        admissionStatus={cms.settings.admissionStatus}
      />
      <HomeAbout schoolName={schoolName} vision={cms?.identity.vision || ""} />
      <HomePrograms programs={cms.programs} indexHref={cms.programsIndexHref} />
      <HomeExtracurriculars items={cms.extracurriculars} indexHref={cms.extracurricularsIndexHref} />
      <HomeFacilities items={cms.facilities} indexHref={cms.facilitiesIndexHref} />
      <HomeNews news={publicNews} indexHref={cms.newsIndexHref} achievements={cms.achievements} achievementsIndexHref={cms.achievementsIndexHref} />
      <HomeAdmission
        admissionEnabled={cms.settings.admissionEnabled}
        fields={cms.admissionFields}
      />
      <HomeFooter
        schoolName={schoolName}
        shortName={shortName}
        vision={cms?.identity.vision || ""}
        address={schoolAddress}
        phone={schoolPhone}
        email={cms?.identity.email || ""}
      />
    </main>
  )
}
