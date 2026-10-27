import type { AdmissionField } from "./type-public-site"

export type PublicListItem = {
  id: string
  title: string
  slug: string
  description: string
  publishedAt: string
  imageUrl?: string
}

export type PublicItemDetail = {
  label: string
  value: string
}

export type HomeNewsItem = {
  id: string
  title: string
  href: string
  description: string
  fields: string
  updatedAt: string
}

export type HomeCollectionItem = {
  id: string
  title: string
  description: string
  href: string
  imageUrl?: string
  meta?: string
  category?: string
  date?: string
}

export type PublicRouteData =
  | { kind: "page"; title: string; description: string; fields: string }
  | { kind: "collection-list"; title: string; description: string; prefix: string; hasPublicDetail: boolean; items: PublicListItem[] }
  | { kind: "collection-item"; title: string; description: string; body: string; category: string; publishedAt: string; imageUrl?: string; details: PublicItemDetail[] }
  | { kind: "admission"; title: string; description: string }

export type PublicSiteData = {
  identity: {
    name: string
    shortName: string
    address: string
    phone: string
    email: string
    vision: string
  }
  settings: {
    siteTitle: string
    siteDescription: string
    admissionStatus: string
    admissionEnabled: boolean
  }
  records: {
    items: {
      id: string
      title: string
      slug: string
      description: string
      fields: string
      href: string
      status: "Terbit"
      updatedAt: string
    }[]
  }
  newsIndexHref: string
  programsIndexHref: string
  extracurricularsIndexHref: string
  facilitiesIndexHref: string
  achievementsIndexHref: string
  programs: HomeCollectionItem[]
  extracurriculars: HomeCollectionItem[]
  facilities: HomeCollectionItem[]
  achievements: HomeCollectionItem[]
  navigation: { label: string; href: string }[]
  admissionFields: AdmissionField[]
}
