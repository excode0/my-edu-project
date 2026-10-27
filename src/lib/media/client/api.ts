import "client-only"

import type { MediaLibraryData, MediaMetadataInput } from "@/types/type-media"

async function readResponse<T>(response: Response, fallback: string): Promise<T> {
  const result = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) throw new Error(result.error || fallback)
  return result
}

export async function fetchMediaLibrary(): Promise<MediaLibraryData> {
  const response = await fetch("/api/admin/media", { cache: "no-store" })
  return readResponse<MediaLibraryData>(response, "Pustaka media gagal dimuat.")
}

export async function updateMediaMetadata(input: MediaMetadataInput): Promise<void> {
  const response = await fetch("/api/admin/media", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  await readResponse(response, "Metadata media tidak dapat disimpan.")
}

export async function deleteMedia(id: string): Promise<void> {
  const response = await fetch("/api/admin/media", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  })
  await readResponse(response, "Media tidak dapat dihapus.")
}

export async function createMediaFolder(name: string): Promise<void> {
  const response = await fetch("/api/admin/media/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  await readResponse(response, "Folder media tidak dapat dibuat.")
}

export async function renameMediaFolder(id: string, name: string): Promise<void> {
  const response = await fetch("/api/admin/media/folders", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name }),
  })
  await readResponse(response, "Folder media tidak dapat diperbarui.")
}

export async function deleteMediaFolder(id: string): Promise<void> {
  const response = await fetch("/api/admin/media/folders", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  })
  await readResponse(response, "Folder media tidak dapat dihapus.")
}
