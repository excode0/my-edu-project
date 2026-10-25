import type { AuthUser } from "@/features/auth/server/auth"
import { withTransaction } from "@/lib/db"
import { writeAudit } from "./audit"
import { itemStatus } from "./constants"
import { ApiError } from "./errors"
import type { RecordInput } from "./schemas"
import { normalizePagePath } from "./text"

export async function savePage(user: AuthUser, record: RecordInput, id?: string) {
  const allowedStatuses = itemStatus[record.status]
  if (!allowedStatuses || allowedStatuses === "scheduled") throw new ApiError("Status halaman tidak valid.")
  const path = normalizePagePath(record.slug, record.title)

  return withTransaction(async (client) => {
    const before = id
      ? await client.query("SELECT * FROM pages WHERE id = $1 AND deleted_at IS NULL FOR UPDATE", [id])
      : null
    if (id && !before?.rowCount) throw new ApiError("Halaman tidak ditemukan.", 404)
    if (id && before?.rows[0]?.is_protected) throw new ApiError("Halaman sistem yang dilindungi tidak dapat diubah.", 403)

    if (id) {
      await client.query(
        `UPDATE pages SET title = $1, slug = $2, full_path = $3, content = $4, status = $5::page_status,
          published_at = CASE WHEN $5::text = 'published' THEN COALESCE(published_at, now()) ELSE published_at END
         WHERE id = $6`,
        [record.title, path.split("/").filter(Boolean).at(-1) ?? "beranda", path,
          { description: record.description, fields: record.fields }, allowedStatuses, id],
      )
    } else {
      const segments = path.split("/").filter(Boolean)
      await client.query(
        `INSERT INTO pages (type, title, slug, full_path, content, status, published_at)
         VALUES ($1, $2, $3, $4, $5, $6::page_status, CASE WHEN $6::text = 'published' THEN now() ELSE NULL END)`,
        [path === "/" ? "system" : "static", record.title, segments.at(-1) ?? "beranda", path,
          { description: record.description, fields: record.fields }, allowedStatuses],
      )
    }
    await writeAudit(client, user, id ? "page.update" : "page.create", "pages", id ?? null, before?.rows[0], { path, ...record })
  })
}
