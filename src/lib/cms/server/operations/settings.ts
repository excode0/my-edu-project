import type { AuthUser } from "@/types/type-auth"
import { withTransaction } from "@/lib/db"
import { writeAudit } from "./audit"
import type { MutationInput } from "../domain/schemas"

export async function saveSettings(
  user: AuthUser,
  settings: NonNullable<MutationInput["settings"]>,
) {
  return withTransaction(async (client) => {
    const before = await client.query(
      `SELECT key, value FROM settings
       WHERE ("group", key) IN (('general', 'site_title'), ('general', 'site_description'), ('admissions', 'status'), ('admissions', 'enabled'))`,
    )
    const values = [
      ["general", "site_title", settings.siteTitle],
      ["general", "site_description", settings.description],
      ["admissions", "status", settings.admissionStatus],
      ["admissions", "enabled", settings.admissionEnabled],
    ] as const
    for (const [group, key, value] of values) {
      await client.query(
        `INSERT INTO settings ("group", key, value, updated_by)
         VALUES ($1, $2, $3::jsonb, $4)
         ON CONFLICT ("group", key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by`,
        [group, key, JSON.stringify(value), user.id],
      )
    }
    await writeAudit(client, user, "settings.update", "settings", null, before.rows, settings)
  })
}
