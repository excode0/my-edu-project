import sanitizeHtml from "sanitize-html"
import { z } from "zod"
import {
  hashPassword,
  requirePermission,
  type AuthUser,
} from "@/lib/auth"
import { CmsData, getCmsData } from "@/lib/cms-data"
import { db, withTransaction } from "@/lib/db"

const modules = [
  "collections",
  "items",
  "pages",
  "media",
  "templates",
  "navigation",
  "submissions",
  "users",
  "identity",
  "settings",
] as const

const recordSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(500),
  description: z.string().max(20_000),
  fields: z.string().max(4_000),
  status: z.string().max(40),
})

const mutationSchema = z.object({
  module: z.enum(modules),
  id: z.string().uuid().optional(),
  record: recordSchema.optional(),
  identity: z.object({
    name: z.string().trim().min(1).max(200),
    shortName: z.string().trim().max(60),
    level: z.string().max(80),
    accreditation: z.string().trim().max(10),
    address: z.string().max(2_000),
    phone: z.string().trim().max(30),
    email: z.string().trim().email().max(180).or(z.literal("")),
    vision: z.string().max(10_000),
  }).optional(),
  settings: z.object({
    siteTitle: z.string().trim().min(1).max(200),
    description: z.string().max(500),
    admissionStatus: z.string().max(200),
    admissionEnabled: z.boolean(),
  }).optional(),
  templateConfig: z.object({
    variant: z.string().trim().min(1).max(80),
    slots: z.record(z.string(), z.union([
      z.object({ source: z.literal("field"), key: z.string().trim().min(1).max(80) }).strict(),
      z.object({ source: z.literal("static"), value: z.string().max(2_000) }).strict(),
    ])),
  }).optional(),
  password: z.string().min(12).max(128).optional(),
})

const itemStatus: Record<string, string> = {
  Draf: "draft",
  Terbit: "published",
  Dijadwalkan: "scheduled",
  Diarsipkan: "archived",
}
const submissionStatus: Record<string, string> = {
  Baru: "new",
  Ditinjau: "reviewing",
  Diterima: "accepted",
  Ditolak: "rejected",
  "Daftar tunggu": "waiting_list",
  Diarsipkan: "archived",
}
const editableFieldTypes = new Set([
  "text", "textarea", "richtext", "number", "boolean", "date", "datetime", "select", "multiselect", "url", "email", "phone",
  "media", "media_multiple", "relation", "json",
])

class ApiError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message)
  }
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180) || "konten"
}

function parseMetadata(value: string) {
  return Object.fromEntries(value.split(/[·;\n]/).flatMap((entry) => {
    const separator = entry.indexOf(":")
    if (separator < 1) return []
    return [[entry.slice(0, separator).trim().toLowerCase(), entry.slice(separator + 1).trim()]]
  }))
}

function parseCollectionFields(value: string) {
  const tokens = value.split(",").map((token) => token.trim()).filter(Boolean)
  const definitions = tokens.map((token) => {
    const match = /^([a-z][a-z0-9_]{0,79})(?::([a-z_]+)(?:\[([^\]]*)\])?(!)?)?$/i.exec(token)
    if (!match) throw new ApiError("Gunakan format key:type, misalnya nama:text! atau kategori:select[Akademik|Prestasi].")
    const key = match[1].toLowerCase()
    const fieldType = (match[2] ?? "text").toLowerCase()
    const optionValues = match[3] === undefined ? null : match[3].split("|").map((option) => option.trim())
    const required = match[4] === "!"
    if (!/^[a-z][a-z0-9_]{0,79}$/.test(key) || !editableFieldTypes.has(fieldType)) {
      throw new ApiError("Tipe field tidak didukung. Gunakan format key:type.")
    }
    if ((fieldType === "select" || fieldType === "multiselect") && (
      !optionValues ||
      optionValues.length < 1 ||
      optionValues.length > 50 ||
      optionValues.some((option) => !option || option.length > 120 || /[,|[\]]/.test(option)) ||
      new Set(optionValues).size !== optionValues.length
    )) {
      throw new ApiError(`Field ${fieldType} membutuhkan 1-50 opsi unik (pisahkan dengan |).`)
    }
    if (optionValues && fieldType !== "select" && fieldType !== "multiselect") {
      throw new ApiError("Opsi hanya dapat digunakan dengan tipe select atau multiselect.")
    }
    return {
      key,
      fieldType,
      required,
      options: optionValues,
      label: key.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase()),
    }
  })
  if (new Set(definitions.map((field) => field.key)).size !== definitions.length) {
    throw new ApiError("Key field tidak boleh berulang.")
  }
  return definitions
}

async function saveCollectionFields(
  client: Parameters<Parameters<typeof withTransaction>[0]>[0],
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

function getPermission(module: typeof modules[number], method: string, status?: string) {
  if (module === "identity") return "identitas.update"
  if (module === "settings") return "settings.manage"
  if (module === "users") return "user.manage"
  if (module === "submissions") return "submission.update"
  if (module === "navigation") return "menu.manage"
  if (module === "media") return "media.upload"
  if (module === "templates") return "template.config.manage"
  if (module === "collections") return "collection.fields.manage"
  if (module === "pages") return "pages.manage"
  if (module === "items" && method === "PATCH" && status === "Terbit") return "collection.items.publish"
  return "collection.items.create"
}

function writeAudit(
  client: Parameters<Parameters<typeof withTransaction>[0]>[0],
  user: AuthUser,
  action: string,
  entity: string,
  id: string | null,
  before: unknown,
  after: unknown,
) {
  return client.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, "before", "after")
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.id, action, entity, id, JSON.stringify(before ?? null), JSON.stringify(after ?? null)],
  )
}

async function uniqueItemSlug(
  client: Parameters<Parameters<typeof withTransaction>[0]>[0],
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

function convertStatusToItem(status: string) {
  const result = itemStatus[status]
  if (!result || result === "scheduled") throw new ApiError("Status artikel tidak valid.")
  return result
}

async function saveIdentity(user: AuthUser, identity: NonNullable<z.infer<typeof mutationSchema>["identity"]>) {
  const [levelRaw, statusRaw] = identity.level.split(/[·,]/).map((value) => value.trim().toLowerCase())
  const levels = ["tk", "sd", "smp", "sma", "smk", "mi", "mts", "ma", "pt", "kursus", "lainnya"]
  const institutionStatuses = ["negeri", "swasta"]
  const level = levels.includes(levelRaw) ? levelRaw : null
  const institutionStatus = institutionStatuses.includes(statusRaw) ? statusRaw : null

  return withTransaction(async (client) => {
    const existing = await client.query("SELECT * FROM site_identities WHERE singleton_key = 'main' FOR UPDATE")
    await client.query(
      `UPDATE site_identities SET
        nama_lembaga = $1, nama_singkat = $2, jenjang = $3, status_lembaga = $4,
        akreditasi = $5, alamat = $6, telepon = $7, email = $8, visi = $9, updated_by = $10
       WHERE singleton_key = 'main'`,
      [identity.name, identity.shortName || null, level, institutionStatus, identity.accreditation || null,
        identity.address || null, identity.phone || null, identity.email || null, identity.vision || null, user.id],
    )
    await writeAudit(client, user, "identity.update", "site_identities", null, existing.rows[0], identity)
  })
}

async function saveSettings(user: AuthUser, settings: NonNullable<z.infer<typeof mutationSchema>["settings"]>) {
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

async function createCollection(user: AuthUser, record: z.infer<typeof recordSchema>) {
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

async function updateCollection(user: AuthUser, id: string, record: z.infer<typeof recordSchema>) {
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

async function saveItem(user: AuthUser, record: z.infer<typeof recordSchema>, id?: string) {
  const requestedStatus = convertStatusToItem(record.status)
  if (requestedStatus === "published" && !user.permissions.includes("collection.items.publish")) {
    throw new ApiError("Anda tidak memiliki izin untuk menerbitkan konten.", 403)
  }
  const metadata = parseMetadata(record.fields)

  return withTransaction(async (client) => {
    let collectionResult
    if (id) {
      const existingItem = await client.query<{ collection_id: string }>(
        "SELECT collection_id FROM collection_items WHERE id = $1 AND deleted_at IS NULL FOR UPDATE",
        [id],
      )
      if (!existingItem.rowCount) throw new ApiError("Konten tidak ditemukan.", 404)
      collectionResult = await client.query<{ id: string; slug: string }>(
        `SELECT id, slug FROM collections WHERE id = $1 AND mode IN ('content', 'hybrid')
         AND is_active = true AND deleted_at IS NULL`,
        [existingItem.rows[0].collection_id],
      )
    } else {
      collectionResult = await client.query<{ id: string; slug: string }>(
        `SELECT id, slug FROM collections WHERE mode IN ('content', 'hybrid')
         AND is_active = true AND deleted_at IS NULL
         AND ($1::text IS NULL OR slug = $1)
         ORDER BY CASE WHEN slug = 'berita' THEN 0 ELSE 1 END, sort_order LIMIT 1`,
        [metadata.collection_slug || null],
      )
    }
    const collection = collectionResult.rows[0]
    if (!collection) throw new ApiError("Belum ada koleksi konten yang aktif.", 409)
    const fieldsResult = await client.query<{
      key: string
      field_type: string
      is_required: boolean
      options: unknown
      validation: Record<string, unknown>
      is_unique: boolean
    }>(
      "SELECT key, field_type, is_required, options, validation, is_unique FROM collection_fields WHERE collection_id = $1 ORDER BY sort_order",
      [collection.id],
    )
    const fieldDefinitions = fieldsResult.rows
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
      if (field.field_type === "boolean" && value !== "true" && value !== "false") {
        throw new ApiError(`Field "${field.key}" harus berupa boolean.`)
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
          [collection.id, field.key, String(value), id ?? null],
        )
        if (duplicate.rowCount) throw new ApiError(`Nilai pada field "${field.key}" sudah digunakan.`, 409)
      }
    }

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

function normalizePagePath(value: string, title: string) {
  const parts = (value || title).split("/").filter(Boolean).map((part) => slugify(part))
  if (!parts.length) return "/"
  return `/${parts.join("/")}`.slice(0, 500)
}

async function savePage(user: AuthUser, record: z.infer<typeof recordSchema>, id?: string) {
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

async function saveNavigation(user: AuthUser, record: z.infer<typeof recordSchema>, id?: string) {
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

async function updateSubmission(user: AuthUser, id: string, record: z.infer<typeof recordSchema>) {
  const status = submissionStatus[record.status]
  if (!status) throw new ApiError("Status pendaftar tidak valid.")
  return withTransaction(async (client) => {
    const before = await client.query("SELECT * FROM form_submissions WHERE id = $1 FOR UPDATE", [id])
    if (!before.rowCount) throw new ApiError("Data pendaftar tidak ditemukan.", 404)
    await client.query(
      "UPDATE form_submissions SET status = $1, status_note = $2, reviewed_by = $3, reviewed_at = now() WHERE id = $4",
      [status, record.description || null, user.id, id],
    )
    await writeAudit(client, user, "submission.status.update", "form_submissions", id, before.rows[0], { status, note: record.description })
  })
}

async function saveUser(user: AuthUser, record: z.infer<typeof recordSchema>, id?: string, password?: string) {
  const parsedEmail = z.string().trim().email().max(180).safeParse(record.slug)
  if (!parsedEmail.success) throw new ApiError("Email pengguna tidak valid.")
  if (record.title.trim().length > 120) throw new ApiError("Nama pengguna maksimal 120 karakter.")

  return withTransaction(async (client) => {
    const roleSlug = parseMetadata(record.fields).role?.toLowerCase() || "kontributor"
    const role = await client.query<{ id: string }>("SELECT id FROM roles WHERE slug = $1", [roleSlug])
    if (!role.rows[0]) throw new ApiError("Role pengguna tidak dikenal.")

    if (!id) {
      if (!password) throw new ApiError("Password awal wajib diisi (minimal 12 karakter).")
      const passwordHash = await hashPassword(password)
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role_id)
         VALUES ($1, lower($2), $3, $4) RETURNING id`,
        [record.title.trim(), parsedEmail.data, passwordHash, role.rows[0].id],
      )
      const newId = inserted.rows[0]?.id
      if (!newId) throw new Error("User insert did not return an ID.")
      await writeAudit(client, user, "user.create", "users", newId, null, { name: record.title, email: record.slug, role: roleSlug })
      return
    }

    if (id === user.id) throw new ApiError("Anda tidak dapat menonaktifkan atau mengubah role akun sendiri.", 403)
    const before = await client.query("SELECT id, name, email, role_id, is_active FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE", [id])
    if (!before.rowCount) throw new ApiError("Pengguna tidak ditemukan.", 404)
    const passwordHash = password ? await hashPassword(password) : null
    await client.query(
      `UPDATE users SET name = $1, email = lower($2), role_id = $3, is_active = $4,
        password_hash = COALESCE($5, password_hash) WHERE id = $6`,
      [record.title.trim(), parsedEmail.data, role.rows[0].id, record.status === "Terbit", passwordHash, id],
    )
    if (passwordHash) await client.query("DELETE FROM auth_sessions WHERE user_id = $1", [id])
    await writeAudit(client, user, "user.update", "users", id, before.rows[0], {
      name: record.title,
      email: parsedEmail.data,
      role: roleSlug,
      active: record.status === "Terbit",
      passwordReset: Boolean(passwordHash),
    })
  })
}

async function saveTemplateConfig(
  user: AuthUser,
  templateId: string,
  config: NonNullable<z.infer<typeof mutationSchema>["templateConfig"]>,
) {
  return withTransaction(async (client) => {
    const result = await client.query<{
      config_id: string | null
      current_variant: string | null
      available_variants: unknown
      schema: unknown
      current_slots: unknown
      collection_id: string | null
    }>(
      `SELECT default_config.id AS config_id, default_config.variant AS current_variant,
        default_config.slots AS current_slots, default_config.collection_id,
        t.available_variants, t."schema"
       FROM templates t
       LEFT JOIN LATERAL (
         SELECT id, variant, slots, collection_id FROM template_configs
         WHERE template_id = t.id AND is_default
         ORDER BY updated_at DESC LIMIT 1
       ) default_config ON true
       WHERE t.id = $1 AND t.is_active = true
       FOR UPDATE OF t`,
      [templateId],
    )
    const template = result.rows[0]
    if (!template) throw new ApiError("Template tidak ditemukan atau tidak aktif.", 404)
    const availableVariants = Array.isArray(template.available_variants)
      ? template.available_variants.map(String)
      : []
    if (!availableVariants.includes(config.variant)) {
      throw new ApiError("Varian tersebut tidak tersedia untuk template ini.")
    }
    if (!template.config_id) throw new ApiError("Konfigurasi default template belum tersedia.", 409)

    const templateSchema = template.schema && typeof template.schema === "object" && !Array.isArray(template.schema)
      ? template.schema as { slots?: unknown }
      : {}
    const slotDefinitions = Array.isArray(templateSchema.slots)
      ? templateSchema.slots.flatMap((slot) => {
          if (!slot || typeof slot !== "object" || Array.isArray(slot)) return []
          const definition = slot as Record<string, unknown>
          if (typeof definition.key !== "string" || typeof definition.type !== "string") return []
          return [{ key: definition.key, type: definition.type, required: definition.required === true }]
        })
      : []
    const definitionsByKey = new Map(slotDefinitions.map((slot) => [slot.key, slot]))
    if (Object.keys(config.slots).some((key) => !definitionsByKey.has(key))) {
      throw new ApiError("Konfigurasi berisi slot yang tidak tersedia pada template.")
    }
    const fieldResult = template.collection_id
      ? await client.query<{ id: string; key: string; field_type: string }>(
        "SELECT id, key, field_type::text FROM collection_fields WHERE collection_id = $1",
        [template.collection_id],
      )
      : { rows: [] as { id: string; key: string; field_type: string }[] }
    const fieldsByKey = new Map(fieldResult.rows.map((field) => [field.key, field]))
    const compatibleTypes: Record<string, string[]> = {
      text: ["text", "email", "phone", "url"],
      textarea: ["text", "textarea", "richtext"],
      richtext: ["richtext", "textarea"],
      media: ["media", "media_multiple"],
      fields: ["json"],
    }
    const slotValues: Record<string, { source: "field"; key: string } | { source: "static"; value: string }> = {}
    const bindingRows: {
      slotKey: string
      fieldId: string | null
      staticValue: string | null
      status: "ok" | "missing_field" | "type_mismatch" | "required_empty"
    }[] = []

    for (const slot of slotDefinitions) {
      const requested = config.slots[slot.key] ?? { source: "static" as const, value: "" }
      if (requested.source === "field") {
        const field = fieldsByKey.get(requested.key)
        const status = !field
          ? "missing_field"
          : compatibleTypes[slot.type]?.includes(field.field_type)
            ? "ok"
            : "type_mismatch"
        slotValues[slot.key] = { source: "field", key: requested.key }
        bindingRows.push({ slotKey: slot.key, fieldId: field?.id ?? null, staticValue: null, status })
      } else {
        const status = slot.required && !requested.value.trim() ? "required_empty" : "ok"
        slotValues[slot.key] = { source: "static", value: requested.value }
        bindingRows.push({
          slotKey: slot.key,
          fieldId: null,
          staticValue: JSON.stringify(requested.value),
          status,
        })
      }
    }

    await client.query(
      `UPDATE template_configs SET variant = $1, slots = $2::jsonb,
        version = version + 1, updated_at = now() WHERE id = $3`,
      [config.variant, JSON.stringify(slotValues), template.config_id],
    )
    await client.query("DELETE FROM template_bindings WHERE template_config_id = $1", [template.config_id])
    for (const binding of bindingRows) {
      await client.query(
        `INSERT INTO template_bindings
          (template_config_id, slot_key, collection_field_id, static_value, status, synced_at)
         VALUES ($1, $2, $3, $4::jsonb, $5::binding_status, now())`,
        [template.config_id, binding.slotKey, binding.fieldId, binding.staticValue, binding.status],
      )
    }
    await writeAudit(
      client,
      user,
      "template.config.update",
      "template_configs",
      template.config_id,
      { variant: template.current_variant, slots: template.current_slots },
      { variant: config.variant, slots: slotValues, bindings: bindingRows },
    )
  })
}

async function deleteRecord(user: AuthUser, module: typeof modules[number], id: string) {
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
          (SELECT count(*) FROM collection_item_media WHERE media_id = $1) +
          (SELECT count(*) FROM site_identities WHERE logo_media_id = $1 OR favicon_media_id = $1 OR hero_media_id = $1) +
          (SELECT count(*) FROM pages WHERE seo_og_media_id = $1) +
          (SELECT count(*) FROM collection_items WHERE seo_og_media_id = $1) AS count`,
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

async function parseBody(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ApiError("Format permintaan tidak valid.")
  }
  const parsed = mutationSchema.safeParse(body)
  if (!parsed.success) throw new ApiError("Data yang dikirim tidak valid.")
  return parsed.data
}

async function handleMutation(request: Request, method: "POST" | "PATCH") {
  let body: z.infer<typeof mutationSchema>
  try {
    body = await parseBody(request)
  } catch (error) {
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status })
    throw error
  }

  const permission = getPermission(body.module, method, body.record?.status)
  const authorization = await requirePermission(permission)
  if (authorization.response || !authorization.user) return authorization.response

  try {
    if (body.module === "identity" && method === "PATCH" && body.identity) {
      await saveIdentity(authorization.user, body.identity)
    } else if (body.module === "settings" && method === "PATCH" && body.settings) {
      await saveSettings(authorization.user, body.settings)
    } else if (body.module === "collections" && body.record) {
      if (method === "POST") await createCollection(authorization.user, body.record)
      else if (body.id) await updateCollection(authorization.user, body.id, body.record)
      else throw new ApiError("ID koleksi wajib untuk pembaruan.")
    } else if (body.module === "items" && body.record) {
      await saveItem(authorization.user, body.record, method === "PATCH" ? body.id : undefined)
    } else if (body.module === "pages" && body.record) {
      await savePage(authorization.user, body.record, method === "PATCH" ? body.id : undefined)
    } else if (body.module === "navigation" && body.record) {
      await saveNavigation(authorization.user, body.record, method === "PATCH" ? body.id : undefined)
    } else if (body.module === "submissions" && method === "PATCH" && body.id && body.record) {
      await updateSubmission(authorization.user, body.id, body.record)
    } else if (body.module === "users" && body.record) {
      await saveUser(authorization.user, body.record, method === "PATCH" ? body.id : undefined, body.password)
    } else if (body.module === "templates" && method === "PATCH" && body.id && body.templateConfig) {
      await saveTemplateConfig(authorization.user, body.id, body.templateConfig)
    } else {
      throw new ApiError("Operasi ini belum tersedia untuk modul yang dipilih.", 405)
    }

    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status })
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return Response.json({ error: "Nilai tersebut sudah digunakan." }, { status: 409 })
    }
    console.error("CMS write failed.", error)
    return Response.json({ error: "Perubahan tidak dapat disimpan. Periksa data dan coba lagi." }, { status: 500 })
  }
}

export async function GET() {
  const authorization = await requirePermission("dashboard.view")
  if (authorization.response || !authorization.user) return authorization.response

  try {
    const data: CmsData = await getCmsData(authorization.user.permissions)
    return Response.json(data, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("CMS data read failed.", error)
    return Response.json({ error: "Data CMS tidak dapat dimuat. Periksa koneksi database." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handleMutation(request, "POST")
}

export async function PATCH(request: Request) {
  return handleMutation(request, "PATCH")
}

export async function DELETE(request: Request) {
  let body: { module?: unknown; id?: unknown }
  try {
    body = await request.json() as { module?: unknown; id?: unknown }
  } catch {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 })
  }
  const parsed = z.object({ module: z.enum(modules), id: z.string().uuid() }).safeParse(body)
  if (!parsed.success) return Response.json({ error: "Modul atau ID tidak valid." }, { status: 400 })
  const authorization = await requirePermission(getPermission(parsed.data.module, "DELETE"))
  if (authorization.response || !authorization.user) return authorization.response

  try {
    await deleteRecord(authorization.user, parsed.data.module, parsed.data.id)
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status })
    console.error("CMS delete failed.", error)
    return Response.json({ error: "Data tidak dapat dihapus." }, { status: 500 })
  }
}
