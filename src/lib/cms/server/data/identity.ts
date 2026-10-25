import { db } from "@/lib/db"

import type { SiteIdentityRow } from "@/types/type-cms-db"

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
