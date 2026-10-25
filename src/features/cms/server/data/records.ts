import { db } from "@/lib/db"
import { mapRecords } from "./shared"
import type { CmsRecord, CmsRecordRow } from "./types"

export async function loadCollections(): Promise<CmsRecord[]> {
  const result = await db.query<CmsRecordRow>(
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
  )
  return mapRecords(result.rows)
}

export async function loadItems(): Promise<CmsRecord[]> {
  const result = await db.query<CmsRecordRow>(
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
  )
  return mapRecords(result.rows)
}

export async function loadPages(): Promise<CmsRecord[]> {
  const result = await db.query<CmsRecordRow>(
    `SELECT p.id, p.title, p.full_path AS slug, COALESCE(p.content->>'description', '') AS description,
      concat_ws(' · ', p.type::text, p.robots) AS fields, p.status::text AS status, p.updated_at
     FROM pages p WHERE p.deleted_at IS NULL ORDER BY p.full_path`,
  )
  return mapRecords(result.rows)
}

export async function loadMedia(): Promise<CmsRecord[]> {
  const result = await db.query<CmsRecordRow>(
    `SELECT m.id, COALESCE(m.title, m.original_name) AS title, m.public_url AS slug,
      COALESCE(m.caption, m.mime_type || ' · ' || pg_size_pretty(m.size_bytes)) AS description,
      concat_ws(' · ', 'ID: ' || m.id::text, m.kind::text, m.mime_type, COALESCE(m.alt_text, 'alt belum diisi')) AS fields,
      'published' AS status, m.updated_at
     FROM media m WHERE m.deleted_at IS NULL ORDER BY m.created_at DESC`,
  )
  return mapRecords(result.rows)
}

export async function loadTemplates(): Promise<CmsRecord[]> {
  const result = await db.query<CmsRecordRow>(
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
  )
  return mapRecords(result.rows)
}

export async function loadNavigation(): Promise<CmsRecord[]> {
  const result = await db.query<CmsRecordRow>(
    `SELECT mi.id, mi.label AS title, COALESCE(mi.external_url, p.full_path, c.url_prefix, '') AS slug,
      m.nama AS description, concat_ws(' · ', mi.link_type::text, 'urutan: ' || mi.sort_order::text,
        CASE WHEN mi.is_visible THEN 'tampil' ELSE 'tersembunyi' END) AS fields,
      CASE WHEN mi.is_visible THEN 'published' ELSE 'draft' END AS status, mi.updated_at
     FROM menu_items mi JOIN menus m ON m.id = mi.menu_id
     LEFT JOIN pages p ON p.id = mi.page_id LEFT JOIN collections c ON c.id = mi.collection_id
     WHERE m.key = 'main' ORDER BY mi.sort_order, mi.label`,
  )
  return mapRecords(result.rows)
}

export async function loadSubmissions(permissions: string[]): Promise<CmsRecord[]> {
  if (!permissions.includes("submission.view")) return []
  const result = await db.query<CmsRecordRow>(
    `SELECT fs.id, COALESCE(fs.data->>'nama_siswa', fs.reference_code) AS title, fs.reference_code AS slug,
      concat_ws(' · ', fs.data->>'asal_sekolah', fs.contact_phone) AS description,
      concat_ws(' · ', 'kontak: ' || COALESCE(fs.contact_email, '—'), 'status: ' || fs.status::text) AS fields,
      fs.status::text AS status, fs.updated_at
     FROM form_submissions fs ORDER BY fs.submitted_at DESC LIMIT 500`,
  )
  return mapRecords(result.rows)
}

export async function loadUsers(permissions: string[]): Promise<CmsRecord[]> {
  if (!permissions.includes("user.manage")) return []
  const result = await db.query<CmsRecordRow>(
    `SELECT u.id, u.name AS title, u.email AS slug, COALESCE(r.description, r.name) AS description,
      'role: ' || r.slug || CASE WHEN u.is_active THEN ' · aktif' ELSE ' · nonaktif' END AS fields,
      CASE WHEN u.is_active THEN 'published' ELSE 'archived' END AS status, u.updated_at
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.deleted_at IS NULL ORDER BY u.created_at`,
  )
  return mapRecords(result.rows)
}
