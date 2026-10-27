export type MediaKind = "image" | "video" | "document" | "audio" | "other"

export type MediaItem = {
  id: string
  title: string
  originalName: string
  publicUrl: string
  mimeType: string
  extension: string
  kind: MediaKind
  sizeBytes: number
  width: number | null
  height: number | null
  altText: string
  caption: string
  folderId: string | null
  folderName: string | null
  uploadedByName: string | null
  usageCount: number
  createdAt: string
  updatedAt: string
}

export type MediaFolder = {
  id: string
  name: string
  slug: string
  mediaCount: number
  createdAt: string
}

export type MediaLibraryData = {
  items: MediaItem[]
  folders: MediaFolder[]
}

export type MediaMetadataInput = {
  id: string
  title: string | null
  altText: string | null
  caption: string | null
  folderId: string | null
}
