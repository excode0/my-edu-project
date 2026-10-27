import { cache } from "react"
import { db } from "@/lib/db"
import { getContentBinding, getContentBindingForCollection } from "@/lib/cms/content-bindings"
import { isCmsImageSource } from "@/lib/cms/richtext-policy"
import type { HomeCollectionItem, PublicSiteData } from "@/types/type-public-site-view"

function settingText(value: unknown) {
  return typeof value === "string" ? value : ""
}

function safeCollectionPrefix(value: string | null | undefined, fallback = "/berita") {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value.replace(/\/+$/, "") || "/"
    : fallback
}

function collectionItemHref(prefix: string | null | undefined, slug: string, fallback = "/berita") {
  const safePrefix = safeCollectionPrefix(prefix, fallback)
  return `${safePrefix === "/" ? "" : safePrefix}/${encodeURIComponent(slug)}`
}

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

function homeItemMeta(slug: string, data: Record<string, unknown>) {
  const text = (value: unknown) => typeof value === "string" ? value.trim() : ""
  if (slug === "program") return text(data.durasi)
  if (slug === "ekstrakurikuler") return text(data.jadwal) || text(data.pembina)
  if (slug === "fasilitas") return text(data.lokasi) || text(data.kapasitas)
  if (slug === "prestasi") return text(data.peraih)
  return ""
}

type HomeCollectionRow = {
  id: string
  slug: string
  title: string
  description: string
  category: string
  item_date: string | null
  published_at: string | Date
  image_url: string
  item_data: Record<string, unknown>
}

async function loadHomeCollection(slug: string, limit = 3): Promise<{ items: HomeCollectionItem[]; indexHref: string }> {
  const feature = getContentBindingForCollection(slug)
  const result = await db.query<{
    url_prefix: string | null
    has_public_detail: boolean
    items: HomeCollectionRow[]
  }>(
    `SELECT c.url_prefix, c.has_public_detail,
       COALESCE(jsonb_agg(jsonb_build_object(
         'id', ci.id, 'slug', ci.slug,
         'title', COALESCE(ci.data->>$2, ci.slug),
         'description', COALESCE(ci.data->>$3, ''),
         'category', COALESCE(ci.data->>$4, ''),
         'item_date', NULLIF(ci.data->>$5, ''),
         'published_at', COALESCE(ci.published_at, ci.updated_at),
         'image_url', COALESCE(img.public_url, ''),
         'item_data', ci.data
       ) ORDER BY COALESCE(NULLIF(ci.data->>$5, ''), ci.published_at::text, ci.updated_at::text) DESC)
         FILTER (WHERE ci.id IS NOT NULL), '[]'::jsonb) AS items
     FROM collections c
     LEFT JOIN LATERAL (
       SELECT ci.* FROM collection_items ci
       WHERE ci.collection_id = c.id AND ci.status = 'published' AND ci.deleted_at IS NULL
         AND (ci.published_at IS NULL OR ci.published_at <= now())
       ORDER BY COALESCE(NULLIF(ci.data->>$5, ''), ci.published_at::text, ci.updated_at::text) DESC
       LIMIT $7
     ) ci ON true
     LEFT JOIN media img ON img.id::text = NULLIF(ci.data->>$6, '')
     WHERE c.slug = $1 AND c.is_active = true AND c.deleted_at IS NULL
     GROUP BY c.id`,
    [
      slug,
      feature?.titleField ?? "judul",
      feature?.summaryField ?? "ringkasan",
      feature?.categoryField ?? "",
      feature?.dateField ?? "",
      feature?.imageField ?? "",
      limit,
    ],
  )
  const row = result.rows[0]
  if (!row) return { items: [], indexHref: `/${slug}` }
  const indexHref = safeCollectionPrefix(row.url_prefix, `/${slug}`)
  return {
    indexHref,
    items: row.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      href: row.has_public_detail ? collectionItemHref(row.url_prefix, item.slug, `/${slug}`) : indexHref,
      imageUrl: item.image_url && isCmsImageSource(item.image_url) ? item.image_url : undefined,
      meta: homeItemMeta(slug, item.item_data) || undefined,
      category: item.category || undefined,
      date: item.item_date ?? (item.published_at ? new Date(item.published_at).toISOString() : undefined),
    })),
  }
}

export const getPublicSiteData = cache(async function getPublicSiteData(): Promise<PublicSiteData> {
  const newsFeature = getContentBinding("news")
  const [identityResult, settingsResult, newsResult, newsCollectionResult, menuResult, admissionFieldsResult, programs, extracurriculars, facilities, achievements] = await Promise.all([
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
      url_prefix: string | null
      has_public_detail: boolean
    }>(
      `SELECT ci.id, COALESCE(ci.data->>$2, ci.slug) AS title, ci.slug,
        COALESCE(ci.data->>$3, ci.data->>$4, '') AS description,
        concat_ws(' · ',
          CASE WHEN $5::text <> '' AND ci.data->>$5 IS NOT NULL THEN 'kategori: ' || (ci.data->>$5) END,
          CASE WHEN $6::text <> '' AND ci.data->>$6 IS NOT NULL THEN 'tanggal_terbit: ' || (ci.data->>$6) END
        ) AS fields,
        COALESCE(ci.published_at, ci.updated_at) AS updated_at, c.url_prefix, c.has_public_detail
       FROM collection_items ci JOIN collections c ON c.id = ci.collection_id
       WHERE ci.status = 'published' AND ci.deleted_at IS NULL AND c.is_active = true
         AND c.deleted_at IS NULL AND c.slug = $1
         AND (ci.published_at IS NULL OR ci.published_at <= now())
       ORDER BY COALESCE(ci.published_at, ci.updated_at) DESC LIMIT 6`,
      [
        newsFeature?.collectionSlug ?? "berita",
        newsFeature?.titleField ?? "judul",
        newsFeature?.summaryField ?? "ringkasan",
        newsFeature?.bodyField ?? "isi",
        newsFeature?.categoryField ?? "kategori",
        newsFeature?.dateField ?? "tanggal_terbit",
      ],
    ),
    db.query<{ url_prefix: string | null }>(
      `SELECT url_prefix FROM collections
       WHERE slug = $1 AND is_active = true AND deleted_at IS NULL LIMIT 1`,
      [newsFeature?.collectionSlug ?? "berita"],
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
    loadHomeCollection("program"),
    loadHomeCollection("ekstrakurikuler"),
    loadHomeCollection("fasilitas"),
    loadHomeCollection("prestasi"),
  ])
  const settings = new Map(settingsResult.rows.map((row) => [row.key, row.value]))
  const identity = identityResult.rows[0]
  const newsIndexHref = safeCollectionPrefix(newsCollectionResult.rows[0]?.url_prefix)

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
        href: row.has_public_detail ? collectionItemHref(row.url_prefix, row.slug) : newsIndexHref,
        status: "Terbit",
        updatedAt: new Date(row.updated_at).toISOString(),
      })),
    },
    newsIndexHref,
    programsIndexHref: programs.indexHref,
    extracurricularsIndexHref: extracurriculars.indexHref,
    facilitiesIndexHref: facilities.indexHref,
    achievementsIndexHref: achievements.indexHref,
    programs: programs.items,
    extracurriculars: extracurriculars.items,
    facilities: facilities.items,
    achievements: achievements.items,
    navigation: menuResult.rows.map((item) => ({
      label: item.label,
      href: resolveMenuHref(item),
    })),
    admissionFields: admissionFieldsResult.rows,
  }
})
