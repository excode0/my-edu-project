import sanitizeHtml from "sanitize-html"
import { z } from "zod"
import type { TransactionClient } from "./audit"
import { ApiError } from "./errors"
import type { RecordInput } from "./schemas"
import { parseMetadata } from "./text"

export type ItemFieldDefinition = {
  key: string
  field_type: string
  is_required: boolean
  options: unknown
  validation: Record<string, unknown>
  is_unique: boolean
}

export async function buildItemData(
  client: TransactionClient,
  collectionId: string,
  fieldDefinitions: ItemFieldDefinition[],
  record: RecordInput,
  id?: string,
) {
  const metadata = parseMetadata(record.fields)
  const allowedKeys = new Set(fieldDefinitions.map((field) => field.key))
  const data: Record<string, unknown> = {}
  const mediaFieldValues = new Map<string, string[]>()
  if (allowedKeys.has("judul")) data.judul = record.title
  if (allowedKeys.has("ringkasan")) data.ringkasan = record.description
  if (allowedKeys.has("isi")) {
    data.isi = sanitizeHtml(record.description || record.title, {
      allowedTags: ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "blockquote", "h2", "h3", "a"],
      allowedAttributes: { a: ["href", "title", "target", "rel"] },
      allowedSchemes: ["http", "https", "mailto"],
      transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true) },
    })
  }
  for (const field of fieldDefinitions) {
    if (Object.hasOwn(metadata, field.key) && allowedKeys.has(field.key)) {
      data[field.key] = metadata[field.key]
    }
  }

  for (const field of fieldDefinitions) {
    let value = data[field.key]
    if (field.is_required && (value === undefined || value === null || value === "")) {
      throw new ApiError(`Field "${field.key}" wajib diisi.`)
    }
    if (value === undefined || value === "") {
      if (field.field_type === "media" || field.field_type === "media_multiple") {
        mediaFieldValues.set(field.key, [])
      }
      continue
    }
    if (field.field_type === "multiselect" && typeof value === "string") {
      try {
        value = JSON.parse(value)
      } catch {
        throw new ApiError(`Field "${field.key}" harus berupa array JSON, misalnya ["opsi satu","opsi dua"].`)
      }
      data[field.key] = value
    }
    if (field.field_type === "media_multiple" && typeof value === "string") {
      try {
        value = JSON.parse(value)
      } catch {
        throw new ApiError(`Field "${field.key}" harus berupa array UUID media.`)
      }
      data[field.key] = value
    }
    if (field.field_type === "json" && typeof value === "string") {
      try {
        value = JSON.parse(value)
      } catch {
        throw new ApiError(`Field "${field.key}" harus berisi JSON yang valid.`)
      }
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new ApiError(`Field "${field.key}" harus berupa objek JSON.`)
      }
      data[field.key] = value
    }
    if (field.field_type === "multiselect") {
      if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
        throw new ApiError(`Field "${field.key}" harus berupa daftar pilihan.`)
      }
      const options = Array.isArray(field.options) ? field.options.map(String) : []
      if (value.some((entry) => !options.includes(entry))) {
        throw new ApiError(`Field "${field.key}" memiliki pilihan yang tidak valid.`)
      }
      if (field.is_required && !value.length) throw new ApiError(`Field "${field.key}" wajib diisi.`)
    }
    if (field.field_type === "media" || field.field_type === "media_multiple") {
      const mediaIds = field.field_type === "media" ? [value] : value
      if (
        !Array.isArray(mediaIds) ||
        mediaIds.some((mediaId) => typeof mediaId !== "string" || !z.string().uuid().safeParse(mediaId).success) ||
        new Set(mediaIds).size !== mediaIds.length
      ) {
        throw new ApiError(`Field "${field.key}" harus berisi UUID media yang valid.`)
      }
      if (field.is_required && !mediaIds.length) throw new ApiError(`Field "${field.key}" wajib diisi.`)
      const mediaResult = await client.query<{ id: string }>(
        "SELECT id FROM media WHERE id = ANY($1::uuid[]) AND kind = 'image' AND deleted_at IS NULL",
        [mediaIds],
      )
      if (mediaResult.rowCount !== mediaIds.length) {
        throw new ApiError(`Field "${field.key}" merujuk media yang tidak tersedia.`)
      }
      mediaFieldValues.set(field.key, mediaIds)
      data[field.key] = field.field_type === "media" ? mediaIds[0] : mediaIds
    }
    if (field.field_type === "relation") {
      if (typeof value !== "string" || !z.string().uuid().safeParse(value).success) {
        throw new ApiError(`Field "${field.key}" harus berisi UUID relasi yang valid.`)
      }
      const relationResult = await client.query<{ exists: boolean }>(
        `SELECT (
           EXISTS (SELECT 1 FROM users WHERE id = $1 AND deleted_at IS NULL)
           OR EXISTS (SELECT 1 FROM collection_items WHERE id = $1 AND deleted_at IS NULL)
         ) AS exists`,
        [value],
      )
      if (!relationResult.rows[0]?.exists) {
        throw new ApiError(`Field "${field.key}" merujuk data yang tidak tersedia.`)
      }
    }
    if (field.field_type === "email" && (typeof value !== "string" || !z.string().email().safeParse(value).success)) {
      throw new ApiError(`Field "${field.key}" harus berupa email yang valid.`)
    }
    if (field.field_type === "url" && (typeof value !== "string" || !z.string().url().safeParse(value).success)) {
      throw new ApiError(`Field "${field.key}" harus berupa URL yang valid.`)
    }
    if (field.field_type === "number" && !Number.isFinite(Number(value))) {
      throw new ApiError(`Field "${field.key}" harus berupa angka.`)
    }
    if (field.field_type === "number") data[field.key] = Number(value)
    if (field.field_type === "boolean") {
      if (value !== true && value !== false && value !== "true" && value !== "false") {
        throw new ApiError(`Field "${field.key}" harus berupa boolean.`)
      }
      data[field.key] = value === true || value === "true"
    }
    if (field.field_type === "select") {
      const options = Array.isArray(field.options) ? field.options.map(String) : []
      if (typeof value !== "string" || !options.includes(value)) {
        throw new ApiError(`Field "${field.key}" harus menggunakan salah satu opsi yang tersedia.`)
      }
    }
    if (field.field_type === "datetime" && (typeof value !== "string" || Number.isNaN(Date.parse(value)))) {
      throw new ApiError(`Field "${field.key}" harus berupa tanggal dan waktu yang valid.`)
    }
    if (field.field_type === "date" && (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) ||
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
    )) {
      throw new ApiError(`Field "${field.key}" harus berupa tanggal YYYY-MM-DD.`)
    }
    if (field.is_unique) {
      const duplicate = await client.query(
        `SELECT 1 FROM collection_items
         WHERE collection_id = $1 AND data->>$2 = $3 AND deleted_at IS NULL
           AND ($4::uuid IS NULL OR id <> $4::uuid) LIMIT 1`,
        [collectionId, field.key, String(value), id ?? null],
      )
      if (duplicate.rowCount) throw new ApiError(`Nilai pada field "${field.key}" sudah digunakan.`, 409)
    }
  }

  return { data, mediaFieldValues }
}
