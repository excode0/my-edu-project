import { db } from "@/lib/db"

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

export async function loadIdentity() {
  const result = await db.query<SiteIdentityRow>(
    "SELECT * FROM site_identities WHERE singleton_key = 'main' LIMIT 1",
  )
  return result.rows[0]
}

export async function loadSettings() {
  const result = await db.query<{ group: string; key: string; value: unknown }>(
    `SELECT "group", key, value FROM settings
     WHERE is_secret = false AND ("group", key) IN (('general', 'site_title'), ('general', 'site_description'), ('admissions', 'status'), ('admissions', 'enabled'))`,
  )
  return new Map(result.rows.map((row) => [`${row.group}.${row.key}`, row.value]))
}
