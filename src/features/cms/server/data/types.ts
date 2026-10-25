export type CmsStatus =
  | "Draf"
  | "Terbit"
  | "Dijadwalkan"
  | "Diarsipkan"
  | "Baru"
  | "Ditinjau"
  | "Diterima"
  | "Ditolak"
  | "Daftar tunggu"

export type CmsRecord = {
  id: string
  title: string
  slug: string
  description: string
  fields: string
  status: CmsStatus
  updatedAt: string
}

export type TemplateEditorConfig = {
  templateId: string
  configId: string | null
  variant: string
  availableVariants: string[]
  scope: string
  collectionSlug: string
  slots: { key: string; type: string; required: boolean }[]
  bindings: Record<string, { source: "field"; key: string } | { source: "static"; value: unknown }>
  bindingStatuses: Record<string, string>
  fields: { key: string; label: string; type: string }[]
}

export type CmsData = {
  records: {
    collections: CmsRecord[]
    items: CmsRecord[]
    pages: CmsRecord[]
    media: CmsRecord[]
    templates: CmsRecord[]
    navigation: CmsRecord[]
    submissions: CmsRecord[]
    users: CmsRecord[]
  }
  identity: {
    name: string
    shortName: string
    level: string
    accreditation: string
    address: string
    phone: string
    email: string
    vision: string
  }
  settings: {
    siteTitle: string
    description: string
    admissionStatus: string
    admissionEnabled: boolean
  }
  templateConfigs: TemplateEditorConfig[]
  audit: { id: string; title: string; description: string; updatedAt: string }[]
}

export type CmsRecordRow = {
  id: string
  title: string
  slug: string
  description: string | null
  fields: string | null
  status: CmsStatus
  updated_at: Date
}
