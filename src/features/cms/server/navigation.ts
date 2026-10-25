import type { AuthUser } from "@/features/auth/server/auth"
import { db, withTransaction } from "@/lib/db"
import { writeAudit } from "./audit"
import { ApiError } from "./errors"
import type { RecordInput } from "./schemas"
import { normalizePagePath, parseMetadata } from "./text"

export async function saveNavigation(user: AuthUser, record: RecordInput, id?: string) {
  const href = record.slug.trim()
  const isAnchor = /^#[a-z0-9_-]{1,80}$/i.test(href)
  let linkType: "anchor" | "external" | "page" | "collection"
  let pageId: string | null = null
  let collectionId: string | null = null
  let externalUrl: string | null = null
  if (isAnchor) {
    linkType = "anchor"
    externalUrl = href
  } else if (href.startsWith("/") && !href.startsWith("//") && !href.includes("?")) {
    const pagePath = normalizePagePath(href, record.title)
    const page = await db.query<{ id: string }>(
      `SELECT id FROM pages
       WHERE full_path = $1 AND status = 'published' AND is_protected = false AND deleted_at IS NULL
       LIMIT 1`,
      [pagePath],
    )
    if (page.rows[0]) {
      linkType = "page"
      pageId = page.rows[0].id
    } else {
      const collection = await db.query<{ id: string }>(
        `SELECT id FROM collections
         WHERE url_prefix = $1 AND is_active = true AND deleted_at IS NULL LIMIT 1`,
        [pagePath],
      )
      if (!collection.rows[0]) throw new ApiError("Tautan internal harus menuju halaman atau koleksi yang terbit.")
      linkType = "collection"
      collectionId = collection.rows[0].id
    }
  } else {
    let parsed: URL
    try {
      parsed = new URL(href)
    } catch {
      throw new ApiError("Tautan menu harus berupa anchor atau URL HTTPS yang valid.")
    }
    if (parsed.protocol !== "https:") throw new ApiError("Tautan eksternal harus menggunakan HTTPS.")
    linkType = "external"
    externalUrl = parsed.toString()
  }

  return withTransaction(async (client) => {
    const menu = await client.query<{ id: string }>("SELECT id FROM menus WHERE key = 'main' LIMIT 1")
    if (!menu.rows[0]) throw new ApiError("Menu utama tidak ditemukan.", 409)
    const isVisible = record.status === "Terbit"
    const before = id ? await client.query("SELECT * FROM menu_items WHERE id = $1 FOR UPDATE", [id]) : null
    if (id && !before?.rowCount) throw new ApiError("Item menu tidak ditemukan.", 404)
    if (id) {
      await client.query(
        `UPDATE menu_items SET label = $1, link_type = $2, page_id = $3, collection_id = $4,
          external_url = $5, is_visible = $6, sort_order = $7 WHERE id = $8`,
        [record.title, linkType, pageId, collectionId, externalUrl, isVisible, Number(parseMetadata(record.fields).urutan) || 0, id],
      )
    } else {
      await client.query(
        `INSERT INTO menu_items (menu_id, label, link_type, page_id, collection_id, external_url, is_visible, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [menu.rows[0].id, record.title, linkType, pageId, collectionId, externalUrl, isVisible, Number(parseMetadata(record.fields).urutan) || 0],
      )
    }
    await writeAudit(client, user, id ? "menu_item.update" : "menu_item.create", "menu_items", id ?? null, before?.rows[0], record)
  })
}
