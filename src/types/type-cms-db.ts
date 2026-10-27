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
  id: string
  singleton_key: string
  nama_lembaga: string
  nama_singkat: string | null
  jenjang: string | null
  status_lembaga: string | null
  npsn: string | null
  nss: string | null
  akreditasi: string | null
  tahun_berdiri: number | null
  slogan: string | null
  visi: string | null
  misi: unknown
  sejarah_singkat: string | null
  alamat: string | null
  kelurahan: string | null
  kecamatan: string | null
  kota: string | null
  provinsi: string | null
  kode_pos: string | null
  latitude: string | null
  longitude: string | null
  telepon: string | null
  email: string | null
  whatsapp: string | null
  website: string | null
  kepala_lembaga: string | null
  sosial_media: unknown
  jam_operasional: unknown
  logo_media_id: string | null
  favicon_media_id: string | null
  hero_media_id: string | null
  updated_by: string | null
  created_at: Date
  updated_at: Date
}
