import { cache } from "react"
import { db } from "@/lib/db"
import type { PublicRouteData } from "./types"

function settingText(value: unknown) {
  return typeof value === "string" ? value : ""
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
