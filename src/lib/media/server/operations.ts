import "server-only"

import { withTransaction } from "@/lib/db"
import { writeAudit } from "@/lib/cms/server/operations/audit"
import { deleteRecord } from "@/lib/cms/server/operations/delete-record"
import { ApiError } from "@/lib/cms/server/domain/errors"
import type { AuthUser } from "@/types/type-auth"
import type { MediaFolderInput, MediaFolderUpdateInput, MediaMetadataInput } from "./schema"

function slugify(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140)

  return slug || "folder"
}

export async function updateMediaMetadata(user: AuthUser, input: MediaMetadataInput) {
  return withTransaction(async (client) => {
    const current = await client.query<{
      id: string
      title: string | null
      alt_text: string | null
      caption: string | null
      folder_id: string | null
    }>(
      `SELECT id, title, alt_text, caption, folder_id
       FROM media
       WHERE id = $1 AND deleted_at IS NULL
       FOR UPDATE`,
      [input.id],
    )
    if (!current.rowCount) throw new ApiError("Media tidak ditemukan.", 404)

    if (input.folderId) {
      const folder = await client.query("SELECT 1 FROM media_folders WHERE id = $1", [input.folderId])
      if (!folder.rowCount) throw new ApiError("Folder tidak ditemukan.", 404)
    }

    const updated = await client.query<{
      id: string
      title: string | null
      alt_text: string | null
      caption: string | null
      folder_id: string | null
    }>(
      `UPDATE media
       SET title = $2, alt_text = $3, caption = $4, folder_id = $5, updated_at = now()
       WHERE id = $1
       RETURNING id, title, alt_text, caption, folder_id`,
      [
        input.id,
        input.title?.trim() || null,
        input.altText?.trim() || null,
        input.caption?.trim() || null,
        input.folderId || null,
      ],
    )

    await writeAudit(
      client,
      user,
      "media.update",
      "media",
      input.id,
      current.rows[0],
      updated.rows[0],
    )

    return updated.rows[0]
  })
}

export async function deleteMedia(user: AuthUser, id: string) {
  await deleteRecord(user, "media", id)
}

export async function createMediaFolder(user: AuthUser, input: MediaFolderInput) {
  const name = input.name.trim()
  const slug = slugify(name)

  return withTransaction(async (client) => {
    const inserted = await client.query<{ id: string; name: string; slug: string }>(
      `INSERT INTO media_folders (parent_id, name, slug)
       VALUES (NULL, $1, $2)
       ON CONFLICT DO NOTHING
       RETURNING id, name, slug`,
      [name, slug],
    )
    const folder = inserted.rows[0]
    if (!folder) throw new ApiError("Folder dengan nama tersebut sudah ada.", 409)

    await writeAudit(client, user, "media_folder.create", "media_folders", folder.id, null, folder)
    return folder
  })
}

export async function updateMediaFolder(user: AuthUser, input: MediaFolderUpdateInput) {
  const name = input.name.trim()
  const slug = slugify(name)

  try {
    return await withTransaction(async (client) => {
      const current = await client.query<{ id: string; name: string; slug: string }>(
        "SELECT id, name, slug FROM media_folders WHERE id = $1 FOR UPDATE",
        [input.id],
      )
      const folder = current.rows[0]
      if (!folder) throw new ApiError("Folder tidak ditemukan.", 404)

      const updated = await client.query<{ id: string; name: string; slug: string }>(
        `UPDATE media_folders SET name = $2, slug = $3, updated_at = now()
         WHERE id = $1
         RETURNING id, name, slug`,
        [input.id, name, slug],
      )

      await writeAudit(
        client,
        user,
        "media_folder.update",
        "media_folders",
        input.id,
        folder,
        updated.rows[0],
      )
      return updated.rows[0]
    })
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new ApiError("Folder dengan nama tersebut sudah ada.", 409)
    }
    throw error
  }
}

export async function deleteMediaFolder(user: AuthUser, id: string) {
  return withTransaction(async (client) => {
    const current = await client.query<{ id: string; name: string; slug: string }>(
      "SELECT id, name, slug FROM media_folders WHERE id = $1 FOR UPDATE",
      [id],
    )
    const folder = current.rows[0]
    if (!folder) throw new ApiError("Folder tidak ditemukan.", 404)

    const contents = await client.query<{ media_count: string; child_count: string }>(
      `SELECT
        (SELECT count(*) FROM media WHERE folder_id = $1 AND deleted_at IS NULL) AS media_count,
        (SELECT count(*) FROM media_folders WHERE parent_id = $1) AS child_count`,
      [id],
    )
    if (Number(contents.rows[0]?.media_count) > 0 || Number(contents.rows[0]?.child_count) > 0) {
      throw new ApiError("Kosongkan folder sebelum menghapusnya.", 409)
    }

    await client.query("DELETE FROM media_folders WHERE id = $1", [id])
    await writeAudit(client, user, "media_folder.delete", "media_folders", id, folder, null)
  })
}
