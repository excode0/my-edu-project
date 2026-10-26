import { cache } from "react"
import { db } from "@/lib/db"
import { contentBindings, getContentBindingForCollection } from "@/lib/cms/content-bindings"
import type { PublicRouteData } from "@/types/type-public-site-view"

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
    has_public_detail: boolean
  }>(
    `SELECT id, slug, nama, deskripsi, url_prefix, mode, has_public_detail FROM collections
     WHERE url_prefix = $1 AND is_active = true AND deleted_at IS NULL LIMIT 1`,
    [path],
  )
  const collection = collectionResult.rows[0]
  if (collection?.mode === "form" && collection.slug === "ppdb") {
    return { kind: "admission", title: collection.nama, description: collection.deskripsi ?? "" }
  }
  if (collection) return getPublicCollectionList(collection)

  const itemFeatureValues = contentBindings.flatMap((feature) => [
    feature.collectionSlug,
    feature.titleField,
    feature.summaryField ?? "ringkasan",
    feature.bodyField ?? "isi",
    feature.categoryField ?? "kategori",
    feature.dateField ?? "tanggal_terbit",
  ])
  const itemFieldCase = (offset: number) => contentBindings.length
    ? `CASE ${contentBindings.map((_, index) => `WHEN c.slug = $${index * 6 + 2} THEN ci.data->>$${index * 6 + offset}`).join(" ")} END`
    : "NULL::text"
  const titleExpression = itemFieldCase(3)
  const summaryExpression = itemFieldCase(4)
  const bodyExpression = itemFieldCase(5)
  const categoryExpression = itemFieldCase(6)
  const dateExpression = itemFieldCase(7)
  const itemResult = await db.query<{
    title: string
    description: string
    body: string
    category: string
    published_at: string | Date
  }>(
    `SELECT COALESCE(${titleExpression}, ci.data->>'judul', ci.slug) AS title,
       COALESCE(${summaryExpression}, ci.data->>'ringkasan', '') AS description,
       COALESCE(${bodyExpression}, ci.data->>'isi', '') AS body,
       COALESCE(${categoryExpression}, ci.data->>'kategori', '') AS category,
       COALESCE(NULLIF(${dateExpression}, ''), ci.published_at::text, ci.updated_at::text) AS published_at
     FROM collection_items ci JOIN collections c ON c.id = ci.collection_id
     WHERE rtrim(c.url_prefix, '/') || '/' || ci.slug = $1
       AND ci.status = 'published' AND ci.deleted_at IS NULL
       AND c.has_public_detail = true AND c.is_active = true AND c.deleted_at IS NULL
       AND (ci.published_at IS NULL OR ci.published_at <= now())
     LIMIT 1`,
    [path, ...itemFeatureValues],
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
    slug: string
    nama: string
    deskripsi: string | null
    url_prefix: string | null
    has_public_detail: boolean
  }>(
    `SELECT id, slug, nama, deskripsi, url_prefix, has_public_detail FROM collections
     WHERE id = $1 AND is_active = true AND deleted_at IS NULL LIMIT 1`,
    [id],
  )
  return result.rows[0] ?? null
}

async function getPublicCollectionBySlug(slug: string) {
  const result = await db.query<{
    id: string
    slug: string
    nama: string
    deskripsi: string | null
    url_prefix: string | null
    has_public_detail: boolean
  }>(
    `SELECT id, slug, nama, deskripsi, url_prefix, has_public_detail FROM collections
     WHERE slug = $1 AND is_active = true AND deleted_at IS NULL LIMIT 1`,
    [slug],
  )
  return result.rows[0] ?? null
}

async function getPublicCollectionList(collection: {
  id: string
  slug: string
  nama: string
  deskripsi: string | null
  url_prefix: string | null
  has_public_detail: boolean
}): Promise<PublicRouteData> {
  const feature = getContentBindingForCollection(collection.slug)
  const result = await db.query<{
    id: string
    title: string
    slug: string
    description: string
    published_at: string | Date
  }>(
    `SELECT ci.id, COALESCE(ci.data->>$2, ci.slug) AS title, ci.slug,
       COALESCE(ci.data->>$3, ci.data->>$4, '') AS description,
       COALESCE(NULLIF(ci.data->>$5, ''), ci.published_at::text, ci.updated_at::text) AS published_at
     FROM collection_items ci
     WHERE ci.collection_id = $1 AND ci.status = 'published' AND ci.deleted_at IS NULL
       AND (ci.published_at IS NULL OR ci.published_at <= now())
     ORDER BY COALESCE(NULLIF(ci.data->>$5, ''), ci.published_at::text, ci.updated_at::text) DESC LIMIT 100`,
    [
      collection.id,
      feature?.titleField ?? "judul",
      feature?.summaryField ?? "ringkasan",
      feature?.bodyField ?? "isi",
      feature?.dateField ?? "tanggal_terbit",
    ],
  )
  return {
    kind: "collection-list",
    title: collection.nama,
    description: collection.deskripsi ?? "",
    prefix: collection.url_prefix ?? "",
    hasPublicDetail: collection.has_public_detail,
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
