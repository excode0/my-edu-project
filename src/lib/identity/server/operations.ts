import "server-only"

import { withTransaction } from "@/lib/db"
import { writeAudit } from "@/lib/cms/server/operations/audit"
import { mapIdentityRow } from "@/lib/identity/server/data"
import type { IdentityInput } from "@/lib/identity/server/schema"
import type { AuthUser } from "@/types/type-auth"
import type { SiteIdentityRow } from "@/types/type-cms-db"
import type { IdentityData } from "@/types/type-identity"

function socialMediaPayload(identity: IdentityInput) {
  return Object.fromEntries(
    Object.entries(identity.socialMedia)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value.length > 0),
  )
}

function operationalHoursPayload(identity: IdentityInput) {
  return identity.operationalHours
    .map((entry) => ({
      hari: entry.day.trim(),
      buka: entry.open.trim(),
      tutup: entry.close.trim(),
    }))
    .filter((entry) => entry.hari && entry.buka && entry.tutup)
}

export async function saveIdentity(user: AuthUser, identity: IdentityInput): Promise<IdentityData> {
  const mission = identity.mission
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  return withTransaction(async (client) => {
    const existing = await client.query<SiteIdentityRow>(
      "SELECT * FROM site_identities WHERE singleton_key = 'main' FOR UPDATE",
    )
    const current = existing.rows[0]
    if (!current) {
      throw new Error("Identitas utama tidak ditemukan di database.")
    }

    const updated = await client.query<SiteIdentityRow>(
      `UPDATE site_identities SET
        nama_lembaga = $1, nama_singkat = $2, jenjang = $3, status_lembaga = $4,
        npsn = $5, nss = $6, akreditasi = $7, tahun_berdiri = $8,
        slogan = $9, kepala_lembaga = $10, visi = $11, misi = $12::jsonb, sejarah_singkat = $13,
        alamat = $14, kelurahan = $15, kecamatan = $16, kota = $17, provinsi = $18, kode_pos = $19,
        latitude = $20, longitude = $21,
        telepon = $22, whatsapp = $23, email = $24, website = $25,
        sosial_media = $26::jsonb, jam_operasional = $27::jsonb,
        logo_media_id = $28, favicon_media_id = $29, hero_media_id = $30,
        updated_by = $31, updated_at = now()
       WHERE singleton_key = 'main'
       RETURNING *`,
      [
        identity.name,
        identity.shortName || null,
        identity.level || null,
        identity.institutionStatus || null,
        identity.npsn || null,
        identity.nss || null,
        identity.accreditation || null,
        identity.foundedYear ? Number.parseInt(identity.foundedYear, 10) : null,
        identity.slogan || null,
        identity.headmaster || null,
        identity.vision || null,
        JSON.stringify(mission),
        identity.history || null,
        identity.address || null,
        identity.village || null,
        identity.district || null,
        identity.city || null,
        identity.province || null,
        identity.postalCode || null,
        identity.latitude || null,
        identity.longitude || null,
        identity.phone || null,
        identity.whatsapp || null,
        identity.email || null,
        identity.website || null,
        JSON.stringify(socialMediaPayload(identity)),
        JSON.stringify(operationalHoursPayload(identity)),
        identity.logoMediaId || null,
        identity.faviconMediaId || null,
        identity.heroMediaId || null,
        user.id,
      ],
    )

    await writeAudit(
      client,
      user,
      "identity.update",
      "site_identities",
      current.id,
      current,
      identity,
    )

    return mapIdentityRow(updated.rows[0])
  })
}
