import type { CmsStatus } from "./type-cms"

export type CmsRecordRow = {
  id: string
  title: string
  slug: string
  description: string | null
  fields: string | null
  status: CmsStatus
  updated_at: Date
  collection_slug?: string
  collection_mode?: string
  collection_url_prefix?: string
  has_public_detail?: boolean
  collection_fields?: unknown
  item_data?: unknown
}

export type SiteIdentityRow = {
  nama_lembaga: string
  nama_singkat: string | null
  jenjang: string | null
  status_lembaga: string | null
  akreditasi: string | null
  alamat: string | null
  telepon: string | null
  email: string | null
  visi: string | null
}
