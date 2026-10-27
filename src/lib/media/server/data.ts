import "server-only"

import { db } from "@/lib/db"
import type {
  MediaFolder,
  MediaItem,
  MediaKind,
  MediaLibraryData,
} from "@/types/type-media"

type MediaRow = {
  id: string
  title: string | null
  original_name: string
  public_url: string
  mime_type: string
  extension: string
  kind: MediaKind
  size_bytes: string
  width: number | null
  height: number | null
  alt_text: string | null
  caption: string | null
  folder_id: string | null
  folder_name: string | null
  uploaded_by_name: string | null
  usage_count: string
  created_at: Date
  updated_at: Date
}

type FolderRow = {
  id: string
  name: string
  slug: string
  media_count: number
  created_at: Date
}

function mapMediaRow(row: MediaRow): MediaItem {
  return {
    id: row.id,
    title: row.title?.trim() || row.original_name,
    originalName: row.original_name,
    publicUrl: row.public_url,
    mimeType: row.mime_type,
    extension: row.extension,
    kind: row.kind,
    sizeBytes: Number(row.size_bytes),
    width: row.width,
    height: row.height,
    altText: row.alt_text ?? "",
    caption: row.caption ?? "",
    folderId: row.folder_id,
    folderName: row.folder_name,
    uploadedByName: row.uploaded_by_name,
    usageCount: Number(row.usage_count),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function mapFolderRow(row: FolderRow): MediaFolder {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    mediaCount: Number(row.media_count),
    createdAt: row.created_at.toISOString(),
  }
}

const mediaUsageSubquery = `
  (
    (SELECT count(*) FROM collection_item_media cim
      JOIN collection_items ci ON ci.id = cim.item_id AND ci.deleted_at IS NULL
      WHERE cim.media_id = m.id) +
    (SELECT count(*) FROM site_identities si
      WHERE si.logo_media_id = m.id OR si.favicon_media_id = m.id OR si.hero_media_id = m.id) +
    (SELECT count(*) FROM pages p
      WHERE p.seo_og_media_id = m.id AND p.deleted_at IS NULL) +
    (SELECT count(*) FROM collection_items ci
      WHERE ci.seo_og_media_id = m.id AND ci.deleted_at IS NULL) +
    (SELECT count(*) FROM users u
      WHERE u.avatar_media_id = m.id AND u.deleted_at IS NULL) +
    (SELECT count(*) FROM templates t
      WHERE t.thumbnail_media_id = m.id)
  )`

export async function loadMediaLibrary(): Promise<MediaLibraryData> {
  const [itemsResult, foldersResult] = await Promise.all([
    db.query<MediaRow>(
      `SELECT m.id, m.title, m.original_name, m.public_url, m.mime_type, m.extension,
        m.kind, m.size_bytes, m.width, m.height, m.alt_text, m.caption, m.folder_id,
        f.name AS folder_name, u.name AS uploaded_by_name,
        ${mediaUsageSubquery} AS usage_count,
        m.created_at, m.updated_at
       FROM media m
       LEFT JOIN media_folders f ON f.id = m.folder_id
       LEFT JOIN users u ON u.id = m.uploaded_by
       WHERE m.deleted_at IS NULL
       ORDER BY m.created_at DESC`,
    ),
    db.query<FolderRow>(
      `SELECT f.id, f.name, f.slug, count(m.id)::int AS media_count, f.created_at
       FROM media_folders f
       LEFT JOIN media m ON m.folder_id = f.id AND m.deleted_at IS NULL
       GROUP BY f.id
       ORDER BY lower(f.name), f.created_at`,
    ),
  ])

  return {
    items: itemsResult.rows.map(mapMediaRow),
    folders: foldersResult.rows.map(mapFolderRow),
  }
}
