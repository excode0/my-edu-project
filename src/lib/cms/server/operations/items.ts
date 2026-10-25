import type { AuthUser } from "@/types/type-auth"
import { hasPermission } from "@/lib/auth/permissions"
import { withTransaction } from "@/lib/db"
import { writeAudit, type TransactionClient } from "./audit"
import { itemStatus } from "../domain/constants"
import { getContentBindingForCollection } from "@/lib/cms/content-bindings"
import { ApiError } from "../domain/errors"
import { buildItemData, type ItemFieldDefinition } from "./item-fields"
import type { RecordInput } from "../domain/schemas"
import { parseMetadata, slugify } from "../domain/text"

async function uniqueItemSlug(
  client: TransactionClient,
  collectionId: string,
  requestedSlug: string,
  exceptId?: string,
) {
  const base = slugify(requestedSlug)
  let candidate = base
  for (let suffix = 2; suffix < 1_000; suffix += 1) {
    const exists = await client.query(
      `SELECT 1 FROM collection_items
       WHERE collection_id = $1 AND slug = $2 AND deleted_at IS NULL AND ($3::uuid IS NULL OR id <> $3::uuid)
       LIMIT 1`,
      [collectionId, candidate, exceptId ?? null],
    )
    if (!exists.rowCount) return candidate
    candidate = `${base}-${suffix}`
  }
  throw new ApiError("Tidak dapat membuat slug unik untuk konten ini.", 409)
}

export function convertStatusToItem(status: string) {
  const result = itemStatus[status]
  if (!result || result === "scheduled") throw new ApiError("Status artikel tidak valid.")
  return result
}

export async function saveItem(user: AuthUser, record: RecordInput, id?: string) {
  const requestedStatus = convertStatusToItem(record.status)
  if (requestedStatus === "published" && !hasPermission(user.permissions, "collection.items.publish")) {
    throw new ApiError("Anda tidak memiliki izin untuk menerbitkan konten.", 403)
  }

  return withTransaction(async (client) => {
    let collection: { id: string; slug: string } | undefined
    if (id) {
      const existingItem = await client.query<{ collection_id: string }>(
        "SELECT collection_id FROM collection_items WHERE id = $1 AND deleted_at IS NULL FOR UPDATE",
        [id],
      )
      if (!existingItem.rowCount) throw new ApiError("Konten tidak ditemukan.", 404)
      const collectionResult = await client.query<{ id: string; slug: string }>(
        `SELECT id, slug FROM collections WHERE id = $1 AND mode IN ('content', 'hybrid')
         AND is_active = true AND deleted_at IS NULL`,
        [existingItem.rows[0].collection_id],
      )
      collection = collectionResult.rows[0]
    } else {
      const collectionResult = await client.query<{ id: string; slug: string }>(
        `SELECT id, slug FROM collections WHERE mode IN ('content', 'hybrid')
         AND is_active = true AND deleted_at IS NULL
         AND ($1::text IS NULL OR slug = $1)
         ORDER BY sort_order, slug LIMIT 1`,
        [parseMetadata(record.fields).collection_slug || null],
      )
      collection = collectionResult.rows[0]
    }
    if (!collection) throw new ApiError("Belum ada koleksi konten yang aktif.", 409)

    const fieldsResult = await client.query<ItemFieldDefinition>(
      "SELECT key, field_type, is_required, options, validation, is_unique FROM collection_fields WHERE collection_id = $1 ORDER BY sort_order",
      [collection.id],
    )
    const feature = getContentBindingForCollection(collection.slug)
    const fieldKeys = new Set(fieldsResult.rows.map((field) => field.key))
    const missingFeatureFields = feature?.requiredFields.filter((key) => !fieldKeys.has(key)) ?? []
    if (missingFeatureFields.length) {
      throw new ApiError(`Koleksi "${collection.slug}" belum memiliki field yang dibutuhkan fitur: ${missingFeatureFields.join(", ")}.`)
    }
    const { data, mediaFieldValues } = await buildItemData(client, collection.id, fieldsResult.rows, record, {
      titleField: feature?.titleField || "judul",
      summaryField: feature?.summaryField || "ringkasan",
      bodyField: feature?.bodyField || "isi",
    }, id)

    const before = id
      ? await client.query("SELECT * FROM collection_items WHERE id = $1 AND deleted_at IS NULL FOR UPDATE", [id])
      : null
    if (id && !before?.rowCount) throw new ApiError("Konten tidak ditemukan.", 404)
    const slug = await uniqueItemSlug(client, collection.id, record.slug || record.title, id)
    let savedId = id

    if (id) {
      await client.query(
        `UPDATE collection_items SET slug = $1, data = $2, status = $3::item_status,
          published_at = CASE WHEN $3::text = 'published' THEN COALESCE(published_at, now()) ELSE published_at END,
          updated_by = $4 WHERE id = $5`,
        [slug, data, requestedStatus, user.id, id],
      )
    } else {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO collection_items (collection_id, slug, data, status, published_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4::item_status, CASE WHEN $4::text = 'published' THEN now() ELSE NULL END, $5, $5)
         RETURNING id`,
        [collection.id, slug, data, requestedStatus, user.id],
      )
      savedId = inserted.rows[0]?.id
      if (!savedId) throw new Error("Content insert did not return an ID.")
    }

    await writeAudit(client, user, id ? "item.update" : "item.create", "collection_items", savedId ?? null, before?.rows[0], { slug, data, status: requestedStatus })
    await client.query(
      "INSERT INTO content_revisions (entity_type, entity_id, data, created_by) VALUES ('collection_items', $1, $2, $3)",
      [savedId, { slug, data, status: requestedStatus }, user.id],
    )
    for (const [fieldKey, mediaIds] of mediaFieldValues) {
      await client.query(
        "DELETE FROM collection_item_media WHERE item_id = $1 AND field_key = $2",
        [savedId, fieldKey],
      )
      for (const [sortOrder, mediaId] of mediaIds.entries()) {
        await client.query(
          `INSERT INTO collection_item_media (item_id, media_id, field_key, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [savedId, mediaId, fieldKey, sortOrder],
        )
      }
    }
  })
}
