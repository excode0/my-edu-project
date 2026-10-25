import sanitizeHtml from "sanitize-html"
import { z } from "zod"
import type { TransactionClient } from "./audit"
import { ApiError } from "../domain/errors"
import type { RecordInput } from "../domain/schemas"
import { parseMetadata } from "../domain/text"
import { richTextAllowedAttributes, richTextAllowedSchemes, richTextAllowedTags } from "../../richtext-policy"

export type ItemFieldDefinition = {
  key: string
  field_type: string
  is_required: boolean
  options: unknown
  validation: Record<string, unknown>
  is_unique: boolean
}

export type ItemFieldMapping = {
  titleField?: string
  summaryField?: string
  bodyField?: string
}

export async function buildItemData(
  client: TransactionClient,
  collectionId: string,
  fieldDefinitions: ItemFieldDefinition[],
  record: RecordInput,
  mapping: ItemFieldMapping = { titleField: "judul", summaryField: "ringkasan", bodyField: "isi" },
  id?: string,
) {
  const metadata = parseMetadata(record.fields)
  const allowedKeys = new Set(fieldDefinitions.map((field) => field.key))
  const data: Record<string, unknown> = Object.fromEntries(
    Object.entries(record.itemData ?? {}).filter(([key]) => allowedKeys.has(key)),
  )
  const mediaFieldValues = new Map<string, string[]>()
  for (const field of fieldDefinitions) {
    if (Object.hasOwn(metadata, field.key) && allowedKeys.has(field.key)) {
      data[field.key] = metadata[field.key]
    }
  }
  if (mapping.titleField && allowedKeys.has(mapping.titleField)) data[mapping.titleField] = record.title
  if (mapping.summaryField && allowedKeys.has(mapping.summaryField)) data[mapping.summaryField] = record.description
  if (mapping.bodyField && allowedKeys.has(mapping.bodyField) && data[mapping.bodyField] === undefined) {
    data[mapping.bodyField] = record.description || record.title
  }

  for (const field of fieldDefinitions) {
    let value = data[field.key]
    if (value === null) value = ""
    if (field.field_type === "richtext" && typeof value === "string") {
      value = sanitizeHtml(value, {
        allowedTags: [...richTextAllowedTags],
        allowedAttributes: richTextAllowedAttributes,
        allowedSchemes: [...richTextAllowedSchemes],
        transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true) },
      })
      data[field.key] = value
    }
    if (["text", "textarea", "richtext", "phone"].includes(field.field_type) && typeof value !== "string") {
      throw new ApiError(`Field "${field.key}" harus berupa teks.`)
    }
    if (field.is_required && (value === undefined || value === null || value === "")) {
      throw new ApiError(`Field "${field.key}" wajib diisi.`)
    }
    if (value === undefined || value === "") {
      delete data[field.key]
      if (field.field_type === "media" || field.field_type === "media_multiple") {
        mediaFieldValues.set(field.key, [])
      }
      continue
    }
    const validation = field.validation && typeof field.validation === "object" ? field.validation : {}
    const minimum = typeof validation.min === "number" ? validation.min : undefined
    const maximum = typeof validation.max === "number" ? validation.max : undefined
    if (["text", "textarea", "richtext", "email", "url", "phone"].includes(field.field_type) && typeof value === "string") {
      if (minimum !== undefined && value.length < minimum) throw new ApiError(`Field "${field.key}" minimal ${minimum} karakter.`)
      if (maximum !== undefined && value.length > maximum) throw new ApiError(`Field "${field.key}" maksimal ${maximum} karakter.`)
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
    if (field.field_type === "number") {
      if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "string" && !value.trim())) {
        throw new ApiError(`Field "${field.key}" harus berupa angka.`)
      }
      const numericValue = Number(value)
      if (!Number.isFinite(numericValue)) throw new ApiError(`Field "${field.key}" harus berupa angka.`)
      if (minimum !== undefined && numericValue < minimum) throw new ApiError(`Field "${field.key}" minimal ${minimum}.`)
      if (maximum !== undefined && numericValue > maximum) throw new ApiError(`Field "${field.key}" maksimal ${maximum}.`)
      data[field.key] = numericValue
    }
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
