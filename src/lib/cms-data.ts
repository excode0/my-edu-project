import "server-only"

import { db } from "@/lib/db"

export type CmsStatus =
  | "Draf"
  | "Terbit"
  | "Dijadwalkan"
  | "Diarsipkan"
  | "Baru"
  | "Ditinjau"
  | "Diterima"
  | "Ditolak"
  | "Daftar tunggu"

export type CmsRecord = {
  id: string
  title: string
  slug: string
  description: string
  fields: string
  status: CmsStatus
  updatedAt: string
}

export type TemplateEditorConfig = {
  templateId: string
  configId: string | null
  variant: string
  availableVariants: string[]
  scope: string
  collectionSlug: string
  slots: { key: string; type: string; required: boolean }[]
  bindings: Record<string, { source: "field"; key: string } | { source: "static"; value: unknown }>
  bindingStatuses: Record<string, string>
  fields: { key: string; label: string; type: string }[]
}

export type CmsData = {
  records: {
    collections: CmsRecord[]
    items: CmsRecord[]
    pages: CmsRecord[]
    media: CmsRecord[]
    templates: CmsRecord[]
    navigation: CmsRecord[]
    submissions: CmsRecord[]
    users: CmsRecord[]
  }
  identity: {
    name: string
    shortName: string
    level: string
    accreditation: string
    address: string
    phone: string
    email: string
    vision: string
  }
  settings: {
    siteTitle: string
    description: string
    admissionStatus: string
    admissionEnabled: boolean
  }
  templateConfigs: TemplateEditorConfig[]
  audit: { id: string; title: string; description: string; updatedAt: string }[]
}

type Row = {
  id: string
  title: string
  slug: string
  description: string | null
  fields: string | null
  status: CmsStatus
  updated_at: Date
}

function formatStatus(status: string): CmsStatus {
  const statusLabels: Record<string, CmsStatus> = {
    draft: "Draf",
    published: "Terbit",
    scheduled: "Dijadwalkan",
    archived: "Diarsipkan",
    new: "Baru",
    reviewing: "Ditinjau",
    accepted: "Diterima",
    rejected: "Ditolak",
    waiting_list: "Daftar tunggu",
  }
  return statusLabels[status] ?? "Draf"
}

function records(rows: Row[]): CmsRecord[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    fields: row.fields ?? "",
    status: formatStatus(row.status),
    updatedAt: new Date(row.updated_at).toISOString(),
  }))
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) return ""
  return typeof value === "string" ? value : JSON.stringify(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function getCmsData(permissions: string[]): Promise<CmsData> {
  const [
    identityResult,
    settingResult,
    collectionResult,
    itemResult,
    pageResult,
    mediaResult,
    templateResult,
    templateConfigResult,
    navigationResult,
    submissionResult,
    userResult,
    auditResult,
  ] = await Promise.all([
    db.query<{
      nama_lembaga: string
      nama_singkat: string | null
      jenjang: string | null
      status_lembaga: string | null
      akreditasi: string | null
      alamat: string | null
      telepon: string | null
      email: string | null
      visi: string | null
    }>("SELECT * FROM site_identities WHERE singleton_key = 'main' LIMIT 1"),
    db.query<{ group: string; key: string; value: unknown }>(
      `SELECT "group", key, value FROM settings
       WHERE is_secret = false AND ("group", key) IN (('general', 'site_title'), ('general', 'site_description'), ('admissions', 'status'), ('admissions', 'enabled'))`,
    ),
    db.query<Row>(
      `SELECT c.id, c.nama AS title, c.slug, c.deskripsi AS description,
        COALESCE(string_agg(
          cf.key || ':' || cf.field_type::text ||
          CASE WHEN cf.field_type IN ('select', 'multiselect') AND jsonb_typeof(cf.options) = 'array'
            THEN '[' || array_to_string(ARRAY(SELECT jsonb_array_elements_text(cf.options)), '|') || ']'
            ELSE '' END ||
          CASE WHEN cf.is_required THEN '!' ELSE '' END,
          ', ' ORDER BY cf.sort_order, cf.key
        ), '') AS fields,
        CASE WHEN c.is_active THEN 'published' ELSE 'draft' END AS status, c.updated_at
       FROM collections c LEFT JOIN collection_fields cf ON cf.collection_id = c.id
       WHERE c.deleted_at IS NULL
       GROUP BY c.id ORDER BY c.sort_order, c.nama`,
    ),
    db.query<Row>(
      `SELECT ci.id, COALESCE(ci.data->>'judul', ci.slug) AS title, ci.slug,
        COALESCE(ci.data->>'ringkasan', ci.data->>'isi', '') AS description,
        concat_ws(' · ',
          CASE WHEN ci.data->>'kategori' IS NOT NULL THEN 'kategori: ' || (ci.data->>'kategori') END,
          CASE WHEN ci.data->>'tanggal_terbit' IS NOT NULL THEN 'tanggal_terbit: ' || (ci.data->>'tanggal_terbit') END,
          CASE WHEN ci.data->>'durasi' IS NOT NULL THEN 'durasi: ' || (ci.data->>'durasi') END,
          'collection_slug: ' || c.slug
        ) AS fields,
        ci.status::text AS status, ci.updated_at
       FROM collection_items ci JOIN collections c ON c.id = ci.collection_id
       WHERE ci.deleted_at IS NULL AND c.deleted_at IS NULL
       ORDER BY ci.updated_at DESC`,
    ),
    db.query<Row>(
      `SELECT p.id, p.title, p.full_path AS slug, COALESCE(p.content->>'description', '') AS description,
        concat_ws(' · ', p.type::text, p.robots) AS fields, p.status::text AS status, p.updated_at
       FROM pages p WHERE p.deleted_at IS NULL ORDER BY p.full_path`,
    ),
    db.query<Row>(
      `SELECT m.id, COALESCE(m.title, m.original_name) AS title, m.public_url AS slug,
        COALESCE(m.caption, m.mime_type || ' · ' || pg_size_pretty(m.size_bytes)) AS description,
        concat_ws(' · ', 'ID: ' || m.id::text, m.kind::text, m.mime_type, COALESCE(m.alt_text, 'alt belum diisi')) AS fields,
        'published' AS status, m.updated_at
       FROM media m WHERE m.deleted_at IS NULL ORDER BY m.created_at DESC`,
    ),
    db.query<Row>(
      `SELECT t.id, t.nama AS title, t.key AS slug, COALESCE(t.deskripsi, '') AS description,
        concat_ws(' · ', t.category::text,
          'varian: ' || COALESCE(default_config.variant, 'default'),
          'pilihan: ' || array_to_string(ARRAY(SELECT jsonb_array_elements_text(t.available_variants)), ', '),
          'binding: ' || COALESCE(binding_totals.bound, 0)::text || '/' || COALESCE(binding_totals.total, 0)::text) AS fields,
        CASE WHEN t.is_active THEN 'published' ELSE 'draft' END AS status, t.updated_at
       FROM templates t
       LEFT JOIN LATERAL (
         SELECT tc.variant FROM template_configs tc
         WHERE tc.template_id = t.id AND tc.is_default
         ORDER BY tc.updated_at DESC LIMIT 1
       ) default_config ON true
       LEFT JOIN LATERAL (
         SELECT count(*) FILTER (WHERE tb.status = 'ok') AS bound, count(*) AS total
         FROM template_configs tc LEFT JOIN template_bindings tb ON tb.template_config_id = tc.id
         WHERE tc.template_id = t.id
       ) binding_totals ON true
       ORDER BY t.nama`,
    ),
    db.query<{
      template_id: string
      config_id: string | null
      variant: string | null
      available_variants: unknown
      scope: string | null
      collection_slug: string | null
      schema: unknown
      configured_slots: unknown
      binding_statuses: unknown
      collection_fields: unknown
    }>(
      `SELECT t.id AS template_id, default_config.id AS config_id,
        default_config.variant, t.available_variants,
        default_config.scope::text AS scope, c.slug AS collection_slug,
        t."schema", COALESCE(default_config.slots, '{}'::jsonb) AS configured_slots,
        COALESCE(binding_list.statuses, '{}'::jsonb) AS binding_statuses,
        COALESCE(field_list.fields, '[]'::jsonb) AS collection_fields
       FROM templates t
       LEFT JOIN LATERAL (
         SELECT id, variant, scope, collection_id, slots
         FROM template_configs
         WHERE template_id = t.id AND is_default
         ORDER BY updated_at DESC LIMIT 1
       ) default_config ON true
       LEFT JOIN collections c ON c.id = default_config.collection_id
       LEFT JOIN LATERAL (
         SELECT jsonb_object_agg(tb.slot_key, tb.status::text) AS statuses
         FROM template_bindings tb
         WHERE tb.template_config_id = default_config.id
       ) binding_list ON true
       LEFT JOIN LATERAL (
         SELECT jsonb_agg(jsonb_build_object(
           'key', cf.key, 'label', cf.label, 'type', cf.field_type::text
         ) ORDER BY cf.sort_order, cf.key) AS fields
         FROM collection_fields cf
         WHERE cf.collection_id = default_config.collection_id
       ) field_list ON true
       WHERE t.is_active = true
       ORDER BY t.nama`,
    ),
    db.query<Row>(
      `SELECT mi.id, mi.label AS title, COALESCE(mi.external_url, p.full_path, c.url_prefix, '') AS slug,
        m.nama AS description, concat_ws(' · ', mi.link_type::text, 'urutan: ' || mi.sort_order::text,
          CASE WHEN mi.is_visible THEN 'tampil' ELSE 'tersembunyi' END) AS fields,
        CASE WHEN mi.is_visible THEN 'published' ELSE 'draft' END AS status, mi.updated_at
       FROM menu_items mi JOIN menus m ON m.id = mi.menu_id
       LEFT JOIN pages p ON p.id = mi.page_id LEFT JOIN collections c ON c.id = mi.collection_id
       WHERE m.key = 'main' ORDER BY mi.sort_order, mi.label`,
    ),
    permissions.includes("submission.view")
      ? db.query<Row>(
        `SELECT fs.id, COALESCE(fs.data->>'nama_siswa', fs.reference_code) AS title, fs.reference_code AS slug,
          concat_ws(' · ', fs.data->>'asal_sekolah', fs.contact_phone) AS description,
          concat_ws(' · ', 'kontak: ' || COALESCE(fs.contact_email, '—'), 'status: ' || fs.status::text) AS fields,
          fs.status::text AS status, fs.updated_at
         FROM form_submissions fs ORDER BY fs.submitted_at DESC LIMIT 500`,
      )
      : Promise.resolve({ rows: [] as Row[] }),
    permissions.includes("user.manage")
      ? db.query<Row>(
        `SELECT u.id, u.name AS title, u.email AS slug, COALESCE(r.description, r.name) AS description,
          'role: ' || r.slug || CASE WHEN u.is_active THEN ' · aktif' ELSE ' · nonaktif' END AS fields,
          CASE WHEN u.is_active THEN 'published' ELSE 'archived' END AS status, u.updated_at
         FROM users u JOIN roles r ON r.id = u.role_id
         WHERE u.deleted_at IS NULL ORDER BY u.created_at`,
      )
      : Promise.resolve({ rows: [] as Row[] }),
    permissions.includes("audit.view")
      ? db.query<{
        id: string
        action: string
        entity_type: string
        entity_id: string | null
        before: unknown
        after: unknown
        created_at: Date
        actor_name: string | null
      }>(
        `SELECT a.id::text, a.action, a.entity_type, a.entity_id,
          a."before", a."after", a.created_at, u.name AS actor_name
         FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
         ORDER BY a.created_at DESC LIMIT 100`,
      )
      : Promise.resolve({ rows: [] as {
        id: string
        action: string
        entity_type: string
        entity_id: string | null
        before: unknown
        after: unknown
        created_at: Date
        actor_name: string | null
      }[] }),
  ])

  const identity = identityResult.rows[0]
  const settings = new Map(settingResult.rows.map((row) => [`${row.group}.${row.key}`, row.value]))
  const audit = auditResult.rows.map((row) => ({
    id: row.id,
    title: row.action.replaceAll(".", " "),
    description: `${row.entity_type}${row.actor_name ? ` · ${row.actor_name}` : ""} · ${displayValue(row.after ?? row.before).slice(0, 240)}`,
    updatedAt: new Date(row.created_at).toISOString(),
  }))

  return {
    records: {
      collections: records(collectionResult.rows),
      items: records(itemResult.rows),
      pages: records(pageResult.rows),
      media: records(mediaResult.rows),
      templates: records(templateResult.rows),
      navigation: records(navigationResult.rows),
      submissions: records(submissionResult.rows),
      users: records(userResult.rows),
    },
    identity: {
      name: identity?.nama_lembaga ?? "",
      shortName: identity?.nama_singkat ?? "",
      level: [identity?.jenjang, identity?.status_lembaga].filter(Boolean).join(" · "),
      accreditation: identity?.akreditasi ?? "",
      address: identity?.alamat ?? "",
      phone: identity?.telepon ?? "",
      email: identity?.email ?? "",
      vision: identity?.visi ?? "",
    },
    settings: {
      siteTitle: displayValue(settings.get("general.site_title")),
      description: displayValue(settings.get("general.site_description")),
      admissionStatus: displayValue(settings.get("admissions.status")),
      admissionEnabled: settings.get("admissions.enabled") === true,
    },
    templateConfigs: templateConfigResult.rows.map((row) => {
      const schema = isRecord(row.schema) ? row.schema : {}
      const configuredSlots = isRecord(row.configured_slots) ? row.configured_slots : {}
      const parseList = (value: unknown) => Array.isArray(value) ? value : []
      const bindings: TemplateEditorConfig["bindings"] = {}
      const bindingStatuses: Record<string, string> = {}
      for (const [key, value] of Object.entries(configuredSlots)) {
        if (!isRecord(value)) continue
        const binding = value
        if (binding.source === "field" && typeof binding.key === "string") {
          bindings[key] = { source: "field", key: binding.key }
        } else if (binding.source === "static") {
          bindings[key] = { source: "static", value: binding.value ?? "" }
        }
      }
      if (isRecord(row.binding_statuses)) {
        for (const [key, value] of Object.entries(row.binding_statuses)) {
          if (typeof value === "string") bindingStatuses[key] = value
        }
      }
      return {
        templateId: row.template_id,
        configId: row.config_id,
        variant: row.variant ?? "default",
        availableVariants: parseList(row.available_variants).map(String),
        scope: row.scope ?? "global",
        collectionSlug: row.collection_slug ?? "",
        slots: parseList(schema.slots).flatMap((slot) => {
          if (!isRecord(slot)) return []
          const definition = slot
          if (typeof definition.key !== "string" || typeof definition.type !== "string") return []
          return [{
            key: definition.key,
            type: definition.type,
            required: definition.required === true,
          }]
        }),
        bindings,
        bindingStatuses,
        fields: parseList(row.collection_fields).flatMap((field) => {
          if (!isRecord(field)) return []
          const definition = field
          if (
            typeof definition.key !== "string" ||
            typeof definition.label !== "string" ||
            typeof definition.type !== "string"
          ) return []
          return [{ key: definition.key, label: definition.label, type: definition.type }]
        }),
      }
    }),
    audit,
  }
}
