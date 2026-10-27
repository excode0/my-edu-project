import "server-only"

import type { MediaKind } from "@/types/type-media"

export type DetectedMediaFile = {
  kind: MediaKind
  mimeType: string
  extension: string
}

const textExtensions = new Map([
  ["txt", "text/plain"],
  ["csv", "text/csv"],
  ["md", "text/markdown"],
])

const zipDocuments = new Map([
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ["odt", "application/vnd.oasis.opendocument.text"],
  ["ods", "application/vnd.oasis.opendocument.spreadsheet"],
  ["odp", "application/vnd.oasis.opendocument.presentation"],
])

const legacyDocuments = new Map([
  ["doc", "application/msword"],
  ["xls", "application/vnd.ms-excel"],
  ["ppt", "application/vnd.ms-powerpoint"],
])

function ascii(buffer: Buffer, start: number, end: number) {
  return buffer.toString("latin1", start, end)
}

function extensionOf(name: string) {
  return /\.([a-z0-9]{1,10})$/i.exec(name)?.[1]?.toLowerCase() ?? ""
}

function isZip(buffer: Buffer) {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
  )
}

function isOleDocument(buffer: Buffer) {
  return (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
  )
}

function isText(buffer: Buffer) {
  if (buffer.includes(0)) return false
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buffer)
    return true
  } catch {
    return false
  }
}

const mp4VideoBrands = new Set([
  "isom",
  "iso2",
  "iso4",
  "iso5",
  "iso6",
  "mp41",
  "mp42",
  "avc1",
  "dash",
  "M4V ",
  "MSNV",
  "3gp4",
  "3gp5",
  "3gp6",
  "3gp7",
  "F4V ",
])

function detectFtyp(buffer: Buffer): DetectedMediaFile | null {
  if (buffer.length < 12 || ascii(buffer, 4, 8) !== "ftyp") return null

  const brand = ascii(buffer, 8, 12)
  if (brand.startsWith("qt")) {
    return { kind: "video", mimeType: "video/quicktime", extension: "mov" }
  }
  if (brand.startsWith("M4A") || brand.startsWith("M4B") || brand.startsWith("M4P")) {
    return { kind: "audio", mimeType: "audio/mp4", extension: "m4a" }
  }
  if (mp4VideoBrands.has(brand)) {
    return { kind: "video", mimeType: "video/mp4", extension: "mp4" }
  }
  return null
}

function detectContainerVideo(buffer: Buffer, ext: string): DetectedMediaFile | null {
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    const header = ascii(buffer, 0, Math.min(buffer.length, 256)).toLowerCase()
    if (header.includes("webm")) {
      return { kind: "video", mimeType: "video/webm", extension: "webm" }
    }
    if (header.includes("matroska")) {
      return { kind: "video", mimeType: "video/x-matroska", extension: "mkv" }
    }
  }

  if (ascii(buffer, 0, 4) === "OggS") {
    if (ext === "ogv") {
      return { kind: "video", mimeType: "video/ogg", extension: "ogv" }
    }
    return { kind: "audio", mimeType: "audio/ogg", extension: ext === "oga" ? "oga" : "ogg" }
  }

  if (ascii(buffer, 0, 4) === "RIFF") {
    const format = ascii(buffer, 8, 12)
    if (format === "AVI ") {
      return { kind: "video", mimeType: "video/x-msvideo", extension: "avi" }
    }
    if (format === "WAVE") {
      return { kind: "audio", mimeType: "audio/wav", extension: "wav" }
    }
  }

  return null
}

function detectAudio(buffer: Buffer): DetectedMediaFile | null {
  if (ascii(buffer, 0, 3) === "ID3") {
    return { kind: "audio", mimeType: "audio/mpeg", extension: "mp3" }
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0 && (buffer[1] & 0x06) !== 0) {
    return { kind: "audio", mimeType: "audio/mpeg", extension: "mp3" }
  }

  if (ascii(buffer, 0, 4) === "fLaC") {
    return { kind: "audio", mimeType: "audio/flac", extension: "flac" }
  }

  return null
}

export function detectMediaFile(buffer: Buffer, originalName: string): DetectedMediaFile | null {
  const ext = extensionOf(originalName)

  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { kind: "image", mimeType: "image/png", extension: "png" }
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { kind: "image", mimeType: "image/jpeg", extension: "jpg" }
  }

  if (buffer.length >= 12 && ascii(buffer, 0, 4) === "RIFF" && ascii(buffer, 8, 12) === "WEBP") {
    return { kind: "image", mimeType: "image/webp", extension: "webp" }
  }

  if (buffer.length >= 6 && (ascii(buffer, 0, 6) === "GIF87a" || ascii(buffer, 0, 6) === "GIF89a")) {
    return { kind: "image", mimeType: "image/gif", extension: "gif" }
  }

  if (ascii(buffer, 0, 5) === "%PDF-") {
    return { kind: "document", mimeType: "application/pdf", extension: "pdf" }
  }

  if (isZip(buffer)) {
    const mimeType = zipDocuments.get(ext)
    if (mimeType) {
      return { kind: "document", mimeType, extension: ext }
    }
    return { kind: "other", mimeType: "application/zip", extension: "zip" }
  }

  if (isOleDocument(buffer)) {
    const mimeType = legacyDocuments.get(ext)
    if (mimeType) {
      return { kind: "document", mimeType, extension: ext }
    }
  }

  if (ascii(buffer, 0, 5) === "{\\rtf") {
    return { kind: "document", mimeType: "application/rtf", extension: "rtf" }
  }

  const ftyp = detectFtyp(buffer)
  if (ftyp) return ftyp

  const container = detectContainerVideo(buffer, ext)
  if (container) return container

  const audio = detectAudio(buffer)
  if (audio) return audio

  if (ascii(buffer, 0, 4) === "Rar!") {
    return { kind: "other", mimeType: "application/vnd.rar", extension: "rar" }
  }

  if (buffer.length >= 6 && buffer.subarray(0, 6).equals(Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]))) {
    return { kind: "other", mimeType: "application/x-7z-compressed", extension: "7z" }
  }

  const textMimeType = textExtensions.get(ext)
  if (textMimeType && isText(buffer)) {
    return { kind: "document", mimeType: textMimeType, extension: ext }
  }

  return null
}
