import "server-only"

import { cache } from "react"
import { db } from "@/lib/db"

export type PublicRouteData =
  | { kind: "page"; title: string; description: string; fields: string }
  | { kind: "collection-list"; title: string; description: string; prefix: string; items: PublicListItem[] }
  | { kind: "collection-item"; title: string; description: string; body: string; category: string; publishedAt: string }
  | { kind: "admission"; title: string; description: string }

export type PublicListItem = {
  id: string
  title: string
  slug: string
  description: string
  publishedAt: string
}

function settingText(value: unknown) {
  return typeof value === "string" ? value : ""
}

export const getPublicSiteData = cache(async function getPublicSiteData() {
  const [identityResult, settingsResult, newsResult, menuResult, admissionFieldsResult] = await Promise.all([
    db.query<{
      nama_lembaga: string
      nama_singkat: string | null
      alamat: string | null
      telepon: string | null
      email: string | null
      visi: string | null
    }>(
      `SELECT nama_lembaga, nama_singkat, alamat, telepon, email, visi
       FROM site_identities WHERE singleton_key = 'main' LIMIT 1`,
    ),
    db.query<{ key: string; value: unknown }>(
      `SELECT key, value FROM settings
       WHERE is_secret = false AND (("group" = 'general' AND key IN ('site_title', 'site_description'))
         OR ("group" = 'admissions' AND key IN ('status', 'enabled')))`,
    ),
    db.query<{
      id: string
      title: string
      slug: string
      description: string
      fields: string
      updated_at: Date
    }>(
      `SELECT ci.id, COALESCE(ci.data->>'judul', ci.slug) AS title, ci.slug,
        COALESCE(ci.data->>'ringkasan', ci.data->>'isi', '') AS description,
        concat_ws(' · ',
          CASE WHEN ci.data->>'kategori' IS NOT NULL THEN 'kategori: ' || (ci.data->>'kategori') END,
          CASE WHEN ci.data->>'tanggal_terbit' IS NOT NULL THEN 'tanggal_terbit: ' || (ci.data->>'tanggal_terbit') END,
          CASE WHEN ci.data->>'durasi' IS NOT NULL THEN 'durasi: ' || (ci.data->>'durasi') END
        ) AS fields,
        COALESCE(ci.published_at, ci.updated_at) AS updated_at
       FROM collection_items ci JOIN collections c ON c.id = ci.collection_id
       WHERE ci.status = 'published' AND ci.deleted_at IS NULL AND c.is_active = true
         AND c.deleted_at IS NULL AND c.slug = 'berita'
         AND (ci.published_at IS NULL OR ci.published_at <= now())
       ORDER BY COALESCE(ci.published_at, ci.updated_at) DESC LIMIT 6`,
    ),
    db.query<{
      label: string
      link_type: string
      external_url: string | null
      page_path: string | null
      collection_prefix: string | null
    }>(
      `SELECT mi.label, mi.link_type, mi.external_url, p.full_path AS page_path,
        c.url_prefix AS collection_prefix
       FROM menu_items mi JOIN menus m ON m.id = mi.menu_id
       LEFT JOIN pages p ON p.id = mi.page_id
       LEFT JOIN collections c ON c.id = mi.collection_id
       WHERE m.key = 'main' AND mi.is_visible = true
         AND (mi.link_type <> 'page' OR (p.status = 'published' AND p.deleted_at IS NULL AND p.is_protected = false))
         AND (mi.link_type <> 'collection' OR (c.is_active = true AND c.deleted_at IS NULL))
       ORDER BY mi.sort_order, mi.label`,
    ),
    db.query<{
      key: string
      label: string
      field_type: string
      is_required: boolean
      options: unknown
      help_text: string | null
    }>(
      `SELECT cf.key, cf.label, cf.field_type, cf.is_required, cf.options, cf.help_text
       FROM collection_fields cf JOIN collections c ON c.id = cf.collection_id
       WHERE c.slug = 'ppdb' AND c.is_active = true AND c.deleted_at IS NULL
       ORDER BY cf.sort_order, cf.label`,
    ),
  ])
  const settings = new Map(settingsResult.rows.map((row) => [row.key, row.value]))
  const identity = identityResult.rows[0]

  return {
    identity: {
      name: identity?.nama_lembaga ?? "Sekolah",
      shortName: identity?.nama_singkat ?? identity?.nama_lembaga ?? "Sekolah",
      address: identity?.alamat ?? "",
      phone: identity?.telepon ?? "",
      email: identity?.email ?? "",
      vision: identity?.visi ?? "",
    },
    settings: {
      siteTitle: settingText(settings.get("site_title")),
      siteDescription: settingText(settings.get("site_description")),
      admissionStatus: settingText(settings.get("status")),
      admissionEnabled: settings.get("enabled") === true,
    },
    records: {
      items: newsResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        fields: row.fields,
        status: "Terbit",
        updatedAt: new Date(row.updated_at).toISOString(),
      })),
    },
    navigation: menuResult.rows.map((item) => ({
      label: item.label,
      href: resolveMenuHref(item),
    })),
    admissionFields: admissionFieldsResult.rows,
  }
})

function resolveMenuHref(item: {
  link_type: string
  external_url: string | null
  page_path: string | null
  collection_prefix: string | null
}) {
  if (item.link_type === "page") return item.page_path ?? "#"
  if (item.link_type === "collection") return item.collection_prefix ?? "#"
  if (item.link_type === "anchor") {
    return item.external_url?.startsWith("#") ? item.external_url : "#"
  }
  if (item.link_type === "external" && item.external_url) {
    try {
      const url = new URL(item.external_url)
      return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol)
        ? item.external_url
        : "#"
    } catch {
      return "#"
    }
  }
  return "#"
}

export const getPublicRoute = cache(async function getPublicRoute(path: string): Promise<PublicRouteData | null> {
  const pageResult = await db.query<{
    title: string
    type: string
    content: Record<string, unknown>
    collection_id: string | null
  }>(
    `SELECT title, type, content, collection_id FROM pages
     WHERE full_path = $1 AND status = 'published' AND deleted_at IS NULL AND is_protected = false
     LIMIT 1`,
    [path],
  )
  const page = pageResult.rows[0]
  if (page) {
    const collectionSlug = settingText(page.content.collection)
    if (collectionSlug === "ppdb") {
      return {
        kind: "admission",
        title: page.title,
        description: "Isi formulir untuk memulai proses penerimaan siswa baru.",
      }
    }
    if (page.type === "collection_list") {
      const collection = page.collection_id
        ? await getPublicCollection(page.collection_id)
        : collectionSlug
          ? await getPublicCollectionBySlug(collectionSlug)
          : null
      return collection ? getPublicCollectionList(collection) : null
    }
    return {
      kind: "page",
      title: page.title,
      description: settingText(page.content.description) || getPageBlockText(page.content),
      fields: settingText(page.content.fields),
    }
  }

  const collectionResult = await db.query<{
    id: string
    slug: string
    nama: string
    deskripsi: string | null
    url_prefix: string | null
    mode: string
  }>(
    `SELECT id, slug, nama, deskripsi, url_prefix, mode FROM collections
     WHERE url_prefix = $1 AND is_active = true AND deleted_at IS NULL LIMIT 1`,
    [path],
  )
  const collection = collectionResult.rows[0]
  if (collection?.mode === "form" && collection.slug === "ppdb") {
    return { kind: "admission", title: collection.nama, description: collection.deskripsi ?? "" }
  }
  if (collection) return getPublicCollectionList(collection)

  const itemResult = await db.query<{
    title: string
    description: string
    body: string
    category: string
    published_at: Date
  }>(
    `SELECT COALESCE(ci.data->>'judul', ci.slug) AS title,
       COALESCE(ci.data->>'ringkasan', '') AS description,
       COALESCE(ci.data->>'isi', '') AS body,
       COALESCE(ci.data->>'kategori', '') AS category,
       COALESCE(ci.published_at, ci.updated_at) AS published_at
     FROM collection_items ci JOIN collections c ON c.id = ci.collection_id
     WHERE rtrim(c.url_prefix, '/') || '/' || ci.slug = $1
       AND ci.status = 'published' AND ci.deleted_at IS NULL
       AND c.has_public_detail = true AND c.is_active = true AND c.deleted_at IS NULL
       AND (ci.published_at IS NULL OR ci.published_at <= now())
     LIMIT 1`,
    [path],
  )
  const item = itemResult.rows[0]
  return item
    ? {
        kind: "collection-item",
        title: item.title,
        description: item.description,
        body: item.body,
        category: item.category,
        publishedAt: new Date(item.published_at).toISOString(),
      }
    : null
})

async function getPublicCollection(id: string) {
  const result = await db.query<{
    id: string
    nama: string
    deskripsi: string | null
    url_prefix: string | null
  }>(
    `SELECT id, nama, deskripsi, url_prefix FROM collections
     WHERE id = $1 AND is_active = true AND deleted_at IS NULL LIMIT 1`,
    [id],
  )
  return result.rows[0] ?? null
}

async function getPublicCollectionBySlug(slug: string) {
  const result = await db.query<{
    id: string
    nama: string
    deskripsi: string | null
    url_prefix: string | null
  }>(
    `SELECT id, nama, deskripsi, url_prefix FROM collections
     WHERE slug = $1 AND is_active = true AND deleted_at IS NULL LIMIT 1`,
    [slug],
  )
  return result.rows[0] ?? null
}

async function getPublicCollectionList(collection: {
  id: string
  nama: string
  deskripsi: string | null
  url_prefix: string | null
}): Promise<PublicRouteData> {
  const result = await db.query<{
    id: string
    title: string
    slug: string
    description: string
    published_at: Date
  }>(
    `SELECT ci.id, COALESCE(ci.data->>'judul', ci.slug) AS title, ci.slug,
       COALESCE(ci.data->>'ringkasan', ci.data->>'isi', '') AS description,
       COALESCE(ci.published_at, ci.updated_at) AS published_at
     FROM collection_items ci
     WHERE ci.collection_id = $1 AND ci.status = 'published' AND ci.deleted_at IS NULL
       AND (ci.published_at IS NULL OR ci.published_at <= now())
     ORDER BY COALESCE(ci.published_at, ci.updated_at) DESC LIMIT 100`,
    [collection.id],
  )
  return {
    kind: "collection-list",
    title: collection.nama,
    description: collection.deskripsi ?? "",
    prefix: collection.url_prefix ?? "",
    items: result.rows.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description,
      publishedAt: new Date(item.published_at).toISOString(),
    })),
  }
}

function getPageBlockText(content: Record<string, unknown>) {
  const blocks = content.blocks
  if (!Array.isArray(blocks)) return ""
  return blocks
    .flatMap((block) => {
      if (!block || typeof block !== "object") return []
      const value = (block as Record<string, unknown>).content
      return typeof value === "string" ? [value] : []
    })
    .join("\n\n")
}
