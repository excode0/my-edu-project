import type { AuthUser } from "@/types/type-auth"
import { withTransaction } from "@/lib/db"
import { writeAudit } from "./audit"
import type { MutationInput } from "../domain/schemas"

export async function saveIdentity(
  user: AuthUser,
  identity: NonNullable<MutationInput["identity"]>,
) {
  const [levelRaw, statusRaw] = (identity.level || "").split(/\s*(?:,|\/|\||\s+-\s+)\s*/).map((value) => value.trim().toLowerCase())
  const levels = ["tk", "sd", "smp", "sma", "smk", "mi", "mts", "ma", "pt", "kursus", "lainnya"]
  const institutionStatuses = ["negeri", "swasta"]
  const level = levels.includes(levelRaw) ? levelRaw : null
  const institutionStatus = institutionStatuses.includes(statusRaw) ? statusRaw : null
  const tahunBerdiri = identity.tahunBerdiri ? Number.parseInt(identity.tahunBerdiri) : null
  const misi = identity.misi
    ? identity.misi.split("\n").map((line) => line.trim()).filter(Boolean)
    : []

  return withTransaction(async (client) => {
    const existing = await client.query("SELECT * FROM site_identities WHERE singleton_key = 'main' FOR UPDATE")
    await client.query(
      `UPDATE site_identities SET
        nama_lembaga = $1, nama_singkat = $2, jenjang = $3, status_lembaga = $4,
        akreditasi = $5, alamat = $6, telepon = $7, email = $8, visi = $9, updated_by = $10,
        slogan = $11, npsn = $12, nss = $13, tahun_berdiri = $14, sejarah_singkat = $15, misi = $16::jsonb,
        kelurahan = $17, kecamatan = $18, kota = $19, provinsi = $20, kode_pos = $21,
        whatsapp = $22, website = $23, kepala_lembaga = $24
       WHERE singleton_key = 'main'`,
      [identity.name, identity.shortName || null, level, institutionStatus, identity.accreditation || null,
        identity.address || null, identity.phone || null, identity.email || null, identity.vision || null, user.id,
        identity.slogan || null, identity.npsn || null, identity.nss || null, Number.isNaN(tahunBerdiri as number) ? null : tahunBerdiri,
        identity.sejarahSingkat || null, JSON.stringify(misi),
        identity.kelurahan || null, identity.kecamatan || null, identity.kota || null, identity.provinsi || null, identity.kodePos || null,
        identity.whatsapp || null, identity.website || null, identity.kepalaLembaga || null],
    )
    await writeAudit(client, user, "identity.update", "site_identities", null, existing.rows[0], identity)
  })
}
