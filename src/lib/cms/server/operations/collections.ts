import type { AuthUser } from "@/types/type-auth"
import { withTransaction } from "@/lib/db"
import { writeAudit, type TransactionClient } from "./audit"
import { ApiError } from "../domain/errors"
import type { RecordInput } from "../domain/schemas"
import { parseCollectionFields, slugify } from "../domain/text"

async function saveCollectionFields(
  client: TransactionClient,
  collectionId: string,
  fields: ReturnType<typeof parseCollectionFields>,
) {
  const existingResult = await client.query<{ id: string; key: string; field_type: string; options: unknown }>(
    "SELECT id, key, field_type::text, options FROM collection_fields WHERE collection_id = $1 FOR UPDATE",
    [collectionId],
  )
  const requestedByKey = new Map(fields.map((field) => [field.key, field]))
  const existingKeys = new Set(existingResult.rows.map((field) => field.key))

  for (const existing of existingResult.rows) {
    const requested = requestedByKey.get(existing.key)
    const hasStoredValues = await client.query(
      `SELECT EXISTS (
         SELECT 1 FROM collection_items
         WHERE collection_id = $1 AND NULLIF(data->>$2, '') IS NOT NULL
         UNION ALL
         SELECT 1 FROM form_submissions
         WHERE collection_id = $1 AND NULLIF(data->>$2, '') IS NOT NULL
       ) AS used`,
      [collectionId, existing.key],
    )
    const used = hasStoredValues.rows[0]?.used === true
    const binding = await client.query(
      "SELECT EXISTS (SELECT 1 FROM template_bindings WHERE collection_field_id = $1) AS used",
      [existing.id],
    )
    const isBound = binding.rows[0]?.used === true
    if (isBound && (!requested || requested.fieldType !== existing.field_type)) {
      throw new ApiError(`Field "${existing.key}" sedang dipakai template. Lepaskan binding sebelum menghapus atau mengganti tipenya.`)
    }
    if (!requested && used) {
      throw new ApiError(`Field "${existing.key}" sudah berisi data dan tidak dapat dihapus.`)
    }
    if (requested && requested.fieldType !== existing.field_type && used) {
      throw new ApiError(`Tipe field "${existing.key}" tidak dapat diubah karena sudah berisi data.`)
    }
    if (requested && JSON.stringify(requested.options) !== JSON.stringify(existing.options) && used) {
      throw new ApiError(`Opsi field "${existing.key}" tidak dapat diubah karena sudah berisi data.`)
    }
  }

  const removedKeys = [...existingKeys].filter((key) => !requestedByKey.has(key))
  if (removedKeys.length) {
    await client.query(
      "DELETE FROM collection_fields WHERE collection_id = $1 AND key = ANY($2::text[])",
      [collectionId, removedKeys],
    )
  }

  for (const [index, field] of fields.entries()) {
    await client.query(
      `INSERT INTO collection_fields (collection_id, key, label, field_type, is_required, options, sort_order)
       VALUES ($1, $2, $3, $4::field_type, $5, $6::jsonb, $7)
       ON CONFLICT (collection_id, key) DO UPDATE SET
         label = EXCLUDED.label, field_type = EXCLUDED.field_type,
         is_required = EXCLUDED.is_required, options = EXCLUDED.options,
         sort_order = EXCLUDED.sort_order, updated_at = now()`,
      [collectionId, field.key, field.label, field.fieldType, field.required,
        field.options ? JSON.stringify(field.options) : null, index],
    )
  }
}

export async function createCollection(user: AuthUser, record: RecordInput) {
  const slug = slugify(record.slug || record.title).slice(0, 80)
  const fields = parseCollectionFields(record.fields)
  return withTransaction(async (client) => {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO collections (slug, nama, deskripsi, kind, mode, url_prefix, is_active)
       VALUES ($1::text, $2, $3, 'dynamic', 'content', '/' || $1::text, $4)
       RETURNING id`,
      [slug, record.title, record.description || null, record.status === "Terbit"],
    )
    const id = inserted.rows[0]?.id
    if (!id) throw new Error("Collection insert did not return an ID.")
    await saveCollectionFields(client, id, fields)
    await writeAudit(client, user, "collection.create", "collections", id, null, { ...record, slug, fields })
  })
}

export async function updateCollection(user: AuthUser, id: string, record: RecordInput) {
  const fields = parseCollectionFields(record.fields)
  return withTransaction(async (client) => {
    const before = await client.query("SELECT * FROM collections WHERE id = $1 AND deleted_at IS NULL FOR UPDATE", [id])
    if (!before.rowCount) throw new ApiError("Koleksi tidak ditemukan.", 404)
    await client.query(
      "UPDATE collections SET nama = $1, slug = $2, deskripsi = $3, is_active = $4 WHERE id = $5",
      [record.title, slugify(record.slug || record.title).slice(0, 80), record.description || null, record.status === "Terbit", id],
    )
    await saveCollectionFields(client, id, fields)
    await writeAudit(client, user, "collection.update", "collections", id, before.rows[0], record)
  })
}
