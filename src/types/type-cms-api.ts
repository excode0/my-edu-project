import type { CmsStatus, CollectionFieldSchema, RecordKey, TemplateEditorConfig } from "./type-cms"
import type { MediaKind } from "./type-media"

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
  kind: MediaKind
  extension: string
}
