import { db } from "@/lib/db"

export async function loadSettings() {
  const result = await db.query<{ group: string; key: string; value: unknown }>(
    `SELECT "group", key, value FROM settings
     WHERE is_secret = false AND ("group", key) IN (('general', 'site_title'), ('general', 'site_description'), ('admissions', 'status'), ('admissions', 'enabled'))`,
  )
  return new Map(result.rows.map((row) => [`${row.group}.${row.key}`, row.value]))
}
