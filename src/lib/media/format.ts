import type { MediaKind } from "@/types/type-media"

export const mediaKindLabels: Record<MediaKind, string> = {
  image: "Gambar",
  video: "Video",
  document: "Dokumen",
  audio: "Audio",
  other: "Lainnya",
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
})

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
})

export function formatMediaDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date)
}

export function formatMediaSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${numberFormatter.format(bytes / 1024)} KB`
  return `${numberFormatter.format(bytes / (1024 * 1024))} MB`
}

export function formatMediaDimensions(width: number | null, height: number | null) {
  if (!width || !height) return null
  return `${width} × ${height}`
}
