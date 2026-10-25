import type { AdmissionField } from "./type-public-site"

export type PublicListItem = {
  id: string
  title: string
  slug: string
  description: string
  publishedAt: string
}

export type HomeNewsItem = {
  id: string
  title: string
  description: string
  fields: string
  updatedAt: string
}

export type PublicRouteData =
  | { kind: "page"; title: string; description: string; fields: string }
  | { kind: "collection-list"; title: string; description: string; prefix: string; items: PublicListItem[] }
  | { kind: "collection-item"; title: string; description: string; body: string; category: string; publishedAt: string }
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
      status: "Terbit"
      updatedAt: string
    }[]
  }
  navigation: { label: string; href: string }[]
  admissionFields: AdmissionField[]
}
