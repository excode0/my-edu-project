import type { CmsStatus, CollectionFieldSchema, RecordKey, TemplateEditorConfig } from "./type-cms"

export type CmsRecord = {
  id: string
  title: string
  slug: string
  description: string
  fields: string
  status: CmsStatus
  updatedAt: string
  collectionSlug?: string
  collectionMode?: string
  collectionUrlPrefix?: string
  hasPublicDetail?: boolean
  collectionFields?: CollectionFieldSchema[]
  itemData?: Record<string, unknown>
}

export type CmsData = {
  records: Record<RecordKey, CmsRecord[]>
  identity: {
    name: string
    shortName: string
    level: string
    accreditation: string
    address: string
    phone: string
    email: string
    vision: string
    slogan?: string
    npsn?: string
    nss?: string
    tahunBerdiri?: string
    sejarahSingkat?: string
    misi?: string
    kelurahan?: string
    kecamatan?: string
    kota?: string
    provinsi?: string
    kodePos?: string
    whatsapp?: string
    website?: string
    kepalaLembaga?: string
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

export type CmsMediaUploadResult = {
  id: string
  publicUrl: string
  mimeType: string
  sizeBytes: number
}
