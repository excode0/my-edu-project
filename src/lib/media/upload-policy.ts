import type { MediaKind } from "@/types/type-media"

export const mediaLimits: Record<MediaKind, number> = {
  image: 5 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  document: 20 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  other: 20 * 1024 * 1024,
}

export const mediaMaxUploadBytes = Math.max(...Object.values(mediaLimits))

export const mediaAccept = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/ogg",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/flac",
  "application/pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".odp",
  ".rtf",
  ".txt",
  ".csv",
  ".md",
  ".zip",
  ".rar",
  ".7z",
].join(",")

export const mediaUploadHint =
  "Gambar maks. 5 MB, video maks. 100 MB, audio/dokumen maks. 20 MB."

const extensionKinds: Record<string, MediaKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  gif: "image",
  mp4: "video",
  webm: "video",
  mov: "video",
  m4v: "video",
  avi: "video",
  mkv: "video",
  ogv: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  oga: "audio",
  m4a: "audio",
  flac: "audio",
  pdf: "document",
  doc: "document",
  docx: "document",
  xls: "document",
  xlsx: "document",
  ppt: "document",
  pptx: "document",
  odt: "document",
  ods: "document",
  odp: "document",
  rtf: "document",
  txt: "document",
  csv: "document",
  md: "document",
  zip: "other",
  rar: "other",
  "7z": "other",
}

export function mediaExtension(name: string) {
  return /\.([a-z0-9]{1,10})$/i.exec(name)?.[1]?.toLowerCase() ?? ""
}

export function inferMediaKind(name: string, mimeType = ""): MediaKind | null {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  return extensionKinds[mediaExtension(name)] ?? null
}
