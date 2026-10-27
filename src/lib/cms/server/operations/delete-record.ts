import type { AuthUser } from "@/types/type-auth"
import { withTransaction } from "@/lib/db"
import { writeAudit } from "./audit"
import type { CmsModule } from "../domain/constants"
import { ApiError } from "../domain/errors"

export async function deleteRecord(user: AuthUser, module: CmsModule, id: string) {
  return withTransaction(async (client) => {
    if (module === "items") {
      const result = await client.query("UPDATE collection_items SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id, slug, data", [id])
      if (!result.rowCount) throw new ApiError("Konten tidak ditemukan.", 404)
      await writeAudit(client, user, "item.delete", "collection_items", id, result.rows[0], null)
      return
    }
    if (module === "pages") {
      const result = await client.query("UPDATE pages SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL AND is_protected = false RETURNING id, full_path", [id])
      if (!result.rowCount) throw new ApiError("Halaman tidak ditemukan atau dilindungi.", 404)
      await writeAudit(client, user, "page.delete", "pages", id, result.rows[0], null)
      return
    }
    if (module === "collections") {
      const references = await client.query<{ items: string; submissions: string; templates: string; menus: string }>(
        `SELECT
           (SELECT count(*) FROM collection_items WHERE collection_id = $1 AND deleted_at IS NULL) AS items,
           (SELECT count(*) FROM form_submissions WHERE collection_id = $1) AS submissions,
           (SELECT count(*) FROM template_configs WHERE collection_id = $1) AS templates,
           (SELECT count(*) FROM menu_items WHERE collection_id = $1) AS menus`,
        [id],
      )
      const counts = references.rows[0]
      if (counts && (Number(counts.items) > 0 || Number(counts.submissions) > 0 || Number(counts.templates) > 0 || Number(counts.menus) > 0)) {
        const parts = [
          Number(counts.items) > 0 ? `${counts.items} item konten` : "",
          Number(counts.submissions) > 0 ? `${counts.submissions} pendaftar` : "",
          Number(counts.templates) > 0 ? `${counts.templates} konfigurasi template` : "",
          Number(counts.menus) > 0 ? `${counts.menus} menu` : "",
        ].filter(Boolean)
        throw new ApiError(`Koleksi masih dipakai oleh ${parts.join(", ")}. Hapus atau lepaskan referensinya terlebih dahulu.`, 409)
      }
      const result = await client.query("UPDATE collections SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id, slug", [id])
      if (!result.rowCount) throw new ApiError("Koleksi tidak ditemukan.", 404)
      await writeAudit(client, user, "collection.delete", "collections", id, result.rows[0], null)
      return
    }
    if (module === "navigation") {
      const result = await client.query("DELETE FROM menu_items WHERE id = $1 RETURNING id, label, external_url", [id])
      if (!result.rowCount) throw new ApiError("Item menu tidak ditemukan.", 404)
      await writeAudit(client, user, "menu_item.delete", "menu_items", id, result.rows[0], null)
      return
    }
    if (module === "media") {
      const references = await client.query(
        `SELECT
          (SELECT count(*) FROM collection_item_media cim
            JOIN collection_items ci ON ci.id = cim.item_id AND ci.deleted_at IS NULL
            WHERE cim.media_id = $1) +
          (SELECT count(*) FROM site_identities WHERE logo_media_id = $1 OR favicon_media_id = $1 OR hero_media_id = $1) +
          (SELECT count(*) FROM pages WHERE seo_og_media_id = $1 AND deleted_at IS NULL) +
          (SELECT count(*) FROM collection_items WHERE seo_og_media_id = $1 AND deleted_at IS NULL) +
          (SELECT count(*) FROM users WHERE avatar_media_id = $1 AND deleted_at IS NULL) +
          (SELECT count(*) FROM templates WHERE thumbnail_media_id = $1) AS count`,
        [id],
      )
      if (Number(references.rows[0]?.count) > 0) throw new ApiError("Media masih dipakai oleh konten; lepaskan referensi sebelum menghapus.", 409)
      const result = await client.query("UPDATE media SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id, storage_key", [id])
      if (!result.rowCount) throw new ApiError("Media tidak ditemukan.", 404)
      await writeAudit(client, user, "media.delete", "media", id, result.rows[0], null)
      return
    }
    if (module === "users") {
      if (id === user.id) throw new ApiError("Anda tidak dapat menonaktifkan akun sendiri.", 403)
      const target = await client.query<{ slug: string }>(
        "SELECT r.slug FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1 AND u.deleted_at IS NULL FOR UPDATE OF u",
        [id],
      )
      if (!target.rowCount) throw new ApiError("Pengguna tidak ditemukan.", 404)
      if (target.rows[0].slug === "superadmin") {
        const activeAdmins = await client.query<{ count: string }>(
          `SELECT count(*) FROM users u JOIN roles r ON r.id = u.role_id
           WHERE r.slug = 'superadmin' AND u.is_active = true AND u.deleted_at IS NULL`,
        )
        if (Number(activeAdmins.rows[0]?.count) <= 1) throw new ApiError("Superadmin aktif terakhir tidak dapat dihapus.", 409)
      }
      const result = await client.query("UPDATE users SET is_active = false, deleted_at = now() WHERE id = $1 RETURNING id, name, email", [id])
      await writeAudit(client, user, "user.delete", "users", id, result.rows[0], null)
      return
    }
    throw new ApiError("Modul ini tidak mendukung penghapusan.", 405)
  })
}
