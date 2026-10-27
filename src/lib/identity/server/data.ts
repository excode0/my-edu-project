import "server-only"

import { db } from "@/lib/db"
import { socialMediaPlatforms } from "@/lib/identity/constants"
import type { SiteIdentityRow } from "@/types/type-cms-db"
import type {
  IdentityData,
  IdentityMediaOption,
  IdentityOperationalHour,
  IdentitySocialMedia,
} from "@/types/type-identity"

function emptySocialMedia(): IdentitySocialMedia {
  return {
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    x: "",
    linkedin: "",
  }
}

function mapSocialMedia(value: unknown): IdentitySocialMedia {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
  const result = emptySocialMedia()

  for (const platform of socialMediaPlatforms) {
    const entry = source[platform.key]
    if (typeof entry === "string") result[platform.key] = entry
  }

  return result
}

function mapMission(value: unknown): string {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").join("\n")
  }
  return typeof value === "string" ? value : ""
}

function mapOperationalHours(value: unknown): IdentityOperationalHour[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item): IdentityOperationalHour[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return []
    const entry = item as Record<string, unknown>
    return [{
      day: typeof entry.hari === "string" ? entry.hari : "",
      open: typeof entry.buka === "string" ? entry.buka : "",
      close: typeof entry.tutup === "string" ? entry.tutup : "",
    }]
  })
}

export function createEmptyIdentity(): IdentityData {
  return {
    name: "",
    shortName: "",
    level: "",
    institutionStatus: "",
    npsn: "",
    nss: "",
    accreditation: "",
    foundedYear: "",
    slogan: "",
    headmaster: "",
    vision: "",
    mission: "",
    history: "",
    address: "",
    village: "",
    district: "",
    city: "",
    province: "",
    postalCode: "",
    latitude: "",
    longitude: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    socialMedia: emptySocialMedia(),
    operationalHours: [],
    logoMediaId: "",
    faviconMediaId: "",
    heroMediaId: "",
    updatedAt: "",
  }
}

export function mapIdentityRow(row: SiteIdentityRow | null | undefined): IdentityData {
  if (!row) return createEmptyIdentity()

  return {
    name: row.nama_lembaga,
    shortName: row.nama_singkat ?? "",
    level: row.jenjang ?? "",
    institutionStatus: row.status_lembaga ?? "",
    npsn: row.npsn ?? "",
    nss: row.nss ?? "",
    accreditation: row.akreditasi ?? "",
    foundedYear: row.tahun_berdiri != null ? String(row.tahun_berdiri) : "",
    slogan: row.slogan ?? "",
    headmaster: row.kepala_lembaga ?? "",
    vision: row.visi ?? "",
    mission: mapMission(row.misi),
    history: row.sejarah_singkat ?? "",
    address: row.alamat ?? "",
    village: row.kelurahan ?? "",
    district: row.kecamatan ?? "",
    city: row.kota ?? "",
    province: row.provinsi ?? "",
    postalCode: row.kode_pos ?? "",
    latitude: row.latitude ?? "",
    longitude: row.longitude ?? "",
    phone: row.telepon ?? "",
    whatsapp: row.whatsapp ?? "",
    email: row.email ?? "",
    website: row.website ?? "",
    socialMedia: mapSocialMedia(row.sosial_media),
    operationalHours: mapOperationalHours(row.jam_operasional),
    logoMediaId: row.logo_media_id ?? "",
    faviconMediaId: row.favicon_media_id ?? "",
    heroMediaId: row.hero_media_id ?? "",
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function loadIdentityData(): Promise<IdentityData> {
  const result = await db.query<SiteIdentityRow>(
    "SELECT * FROM site_identities WHERE singleton_key = 'main' LIMIT 1",
  )
  return mapIdentityRow(result.rows[0])
}

export async function loadIdentityMediaOptions(): Promise<IdentityMediaOption[]> {
  const result = await db.query<{
    id: string
    title: string
    public_url: string
    mime_type: string
  }>(
    `SELECT id, COALESCE(title, original_name, 'Media') AS title, public_url, mime_type
     FROM media
     WHERE deleted_at IS NULL AND kind = 'image'
     ORDER BY created_at DESC
     LIMIT 100`,
  )

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    publicUrl: row.public_url,
    mimeType: row.mime_type,
  }))
}
