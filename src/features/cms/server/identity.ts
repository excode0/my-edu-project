import type { AuthUser } from "@/features/auth/server/auth"
import { withTransaction } from "@/lib/db"
import { writeAudit } from "./audit"
import type { MutationInput } from "./schemas"

export async function saveIdentity(
  user: AuthUser,
  identity: NonNullable<MutationInput["identity"]>,
) {
  const [levelRaw, statusRaw] = identity.level.split(/[·,]/).map((value) => value.trim().toLowerCase())
  const levels = ["tk", "sd", "smp", "sma", "smk", "mi", "mts", "ma", "pt", "kursus", "lainnya"]
  const institutionStatuses = ["negeri", "swasta"]
  const level = levels.includes(levelRaw) ? levelRaw : null
  const institutionStatus = institutionStatuses.includes(statusRaw) ? statusRaw : null

  return withTransaction(async (client) => {
    const existing = await client.query("SELECT * FROM site_identities WHERE singleton_key = 'main' FOR UPDATE")
    await client.query(
      `UPDATE site_identities SET
        nama_lembaga = $1, nama_singkat = $2, jenjang = $3, status_lembaga = $4,
        akreditasi = $5, alamat = $6, telepon = $7, email = $8, visi = $9, updated_by = $10
       WHERE singleton_key = 'main'`,
      [identity.name, identity.shortName || null, level, institutionStatus, identity.accreditation || null,
        identity.address || null, identity.phone || null, identity.email || null, identity.vision || null, user.id],
    )
    await writeAudit(client, user, "identity.update", "site_identities", null, existing.rows[0], identity)
  })
}
