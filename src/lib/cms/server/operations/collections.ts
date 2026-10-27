import type { AuthUser } from "@/types/type-auth"
import { withTransaction } from "@/lib/db"
import { writeAudit, type TransactionClient } from "./audit"
import {
  normalizeCollectionFields,
  normalizeCollectionUrlPrefix,
  parseCollectionFields,
  type CollectionFieldDefinition,
} from "../domain/collection-fields"
import { ApiError } from "../domain/errors"
import type { RecordInput } from "../domain/schemas"
import { slugify } from "../domain/text"

type ExistingCollectionField = {
  id: string
  key: string
  label: string
  field_type: string
  is_required: boolean
  is_unique: boolean
  is_searchable: boolean
  is_filterable: boolean
  is_listed: boolean
  options: unknown
  default_value: unknown
  validation: Record<string, unknown> | null
  help_text: string | null
}

function collectionFieldsFromRecord(record: RecordInput) {
  return record.collectionFields !== undefined
    ? normalizeCollectionFields(record.collectionFields)
    : parseCollectionFields(record.fields)
}

function preserveExistingMetadata(
  fields: CollectionFieldDefinition[],
  existingFields: ExistingCollectionField[],
) {
  const existingByKey = new Map(existingFields.map((field) => [field.key, field]))
  return fields.map((field) => {
    const existing = existingByKey.get(field.key)
    return existing
      ? {
          ...field,
          label: existing.label,
          isUnique: existing.is_unique,
          isListed: existing.is_listed,
          isSearchable: existing.is_searchable,
          isFilterable: existing.is_filterable,
          defaultValue: existing.default_value,
          validation: existing.validation ?? {},
          helpText: existing.help_text,
        }
      : field
  })
}

async function saveCollectionFields(
  client: TransactionClient,
  collectionId: string,
  inputFields: CollectionFieldDefinition[],
  { preserveMetadata = false }: { preserveMetadata?: boolean } = {},
) {
  const existingResult = await client.query<ExistingCollectionField>(
    `SELECT id, key, label, field_type::text, is_required, is_unique, is_searchable,
       is_filterable, is_listed, options, default_value, validation, help_text
     FROM collection_fields WHERE collection_id = $1 FOR UPDATE`,
    [collectionId],
  )
  const fields = preserveMetadata
    ? preserveExistingMetadata(inputFields, existingResult.rows)
    : inputFields
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
    if (requested?.isUnique && !existing.is_unique && used) {
      const duplicates = await client.query(
        `SELECT 1 FROM collection_items
         WHERE collection_id = $1 AND deleted_at IS NULL AND NULLIF(data->>$2, '') IS NOT NULL
         GROUP BY data->>$2 HAVING count(*) > 1 LIMIT 1`,
        [collectionId, existing.key],
      )
      if (duplicates.rowCount) {
        throw new ApiError(`Field "${existing.key}" memiliki nilai berulang sehingga belum dapat dijadikan unik.`)
      }
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
      `INSERT INTO collection_fields (
         collection_id, key, label, field_type, is_required, is_unique,
         is_searchable, is_filterable, is_listed, default_value, options, validation,
         help_text, sort_order
       )
       VALUES ($1, $2, $3, $4::field_type, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13, $14)
       ON CONFLICT (collection_id, key) DO UPDATE SET
         label = EXCLUDED.label, field_type = EXCLUDED.field_type,
         is_required = EXCLUDED.is_required, is_unique = EXCLUDED.is_unique,
         is_searchable = EXCLUDED.is_searchable, is_filterable = EXCLUDED.is_filterable,
         is_listed = EXCLUDED.is_listed, default_value = EXCLUDED.default_value,
         options = EXCLUDED.options, validation = EXCLUDED.validation,
         help_text = EXCLUDED.help_text, sort_order = EXCLUDED.sort_order,
         updated_at = now()`,
      [
        collectionId,
        field.key,
        field.label,
        field.fieldType,
        field.required,
        field.isUnique,
        field.isSearchable,
        field.isFilterable,
        field.isListed,
        field.defaultValue === null ? null : JSON.stringify(field.defaultValue),
        field.options ? JSON.stringify(field.options) : null,
        JSON.stringify(field.validation),
        field.helpText,
        index,
      ],
    )
  }
}

async function assertPublicPrefixAvailable(
  client: TransactionClient,
  urlPrefix: string,
  exceptId?: string,
) {
  const conflict = await client.query(
    `SELECT 1 FROM collections
     WHERE lower(url_prefix) = lower($1) AND deleted_at IS NULL
       AND ($2::uuid IS NULL OR id <> $2::uuid)
     LIMIT 1`,
    [urlPrefix, exceptId ?? null],
  )
  if (conflict.rowCount) {
    throw new ApiError("Alamat publik koleksi sudah dipakai koleksi lain.", 409)
  }
}

function resolvePublicPrefix(record: RecordInput, current: { slug: string; url_prefix: string | null }, nextSlug: string) {
  const fallback = normalizeCollectionUrlPrefix(undefined, nextSlug)
  const requested = record.collectionUrlPrefix?.trim()
  if (!requested) return fallback
  if (current.url_prefix === `/${current.slug}` && requested === current.url_prefix) return fallback
  return normalizeCollectionUrlPrefix(requested, nextSlug)
}

export async function createCollection(user: AuthUser, record: RecordInput) {
  const slug = slugify(record.slug || record.title).slice(0, 79)
  const fields = collectionFieldsFromRecord(record)
  const urlPrefix = normalizeCollectionUrlPrefix(record.collectionUrlPrefix, slug)
  const mode = record.collectionMode ?? "content"

  return withTransaction(async (client) => {
    await assertPublicPrefixAvailable(client, urlPrefix)
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO collections (slug, nama, deskripsi, kind, mode, has_public_detail, url_prefix, is_active)
       VALUES ($1::text, $2, $3, 'dynamic', $4::collection_mode, $5, $6, $7)
       RETURNING id`,
      [slug, record.title, record.description || null, mode, record.itemData?.hasPublicDetail === true, urlPrefix, record.status === "Terbit"],
    )
    const id = inserted.rows[0]?.id
    if (!id) throw new Error("Collection insert did not return an ID.")
    await saveCollectionFields(client, id, fields)
    await writeAudit(client, user, "collection.create", "collections", id, null, { ...record, slug, urlPrefix, mode, fields })
  })
}

export async function updateCollection(user: AuthUser, id: string, record: RecordInput) {
  const fields = collectionFieldsFromRecord(record)
  const preserveMetadata = record.collectionFields === undefined

  return withTransaction(async (client) => {
    const before = await client.query<{ slug: string; url_prefix: string | null; mode: string }>(
      "SELECT slug, url_prefix, mode::text FROM collections WHERE id = $1 AND deleted_at IS NULL FOR UPDATE",
      [id],
    )
    if (!before.rowCount) throw new ApiError("Koleksi tidak ditemukan.", 404)
    const slug = slugify(record.slug || record.title).slice(0, 79)
    const current = before.rows[0]
    const urlPrefix = resolvePublicPrefix(record, current, slug)
    const mode = record.collectionMode ?? current.mode
    await assertPublicPrefixAvailable(client, urlPrefix, id)
    await client.query(
      `UPDATE collections SET nama = $1, slug = $2, deskripsi = $3, mode = $4::collection_mode,
         has_public_detail = $5, url_prefix = $6, is_active = $7 WHERE id = $8`,
      [record.title, slug, record.description || null, mode, record.itemData?.hasPublicDetail === true, urlPrefix, record.status === "Terbit", id],
    )
    await saveCollectionFields(client, id, fields, { preserveMetadata })
    await writeAudit(client, user, "collection.update", "collections", id, before.rows[0], { ...record, slug, urlPrefix, mode, fields })
  })
}
