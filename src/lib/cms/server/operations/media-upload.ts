import "server-only"

import { createHash, randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/auth/server/auth"
import { withTransaction } from "@/lib/db"
import { formatMediaSize, mediaKindLabels } from "@/lib/media/format"
import { mediaLimits, mediaMaxUploadBytes } from "@/lib/media/upload-policy"
import { detectMediaFile } from "@/lib/media/server/detect"

const MAX_REQUEST_BYTES = mediaMaxUploadBytes + 128 * 1024

function safeOriginalName(value: string) {
  return value
    .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
    .trim()
    .slice(0, 255) || "unggahan"
}

export async function uploadMedia(request: Request) {
  const authorization = await requirePermission("media.upload")
  if (authorization.response || !authorization.user) return authorization.response

  const contentLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { error: `Ukuran file maksimal ${formatMediaSize(mediaMaxUploadBytes)}.` },
      { status: 413 },
    )
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Formulir unggahan tidak valid." }, { status: 400 })
  }

  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pilih file media untuk diunggah." }, { status: 400 })
  }
  if (file.size === 0 || file.size > mediaMaxUploadBytes) {
    return NextResponse.json(
      { error: `Ukuran file harus antara 1 byte dan ${formatMediaSize(mediaMaxUploadBytes)}.` },
      { status: 413 },
    )
  }

  const metadata = z.object({
    title: z.string().trim().max(200).optional(),
    altText: z.string().trim().max(255).optional(),
    caption: z.string().trim().max(2_000).optional(),
    folderId: z.string().uuid().optional(),
  }).safeParse({
    title: form.get("title") || undefined,
    altText: form.get("altText") || undefined,
    caption: form.get("caption") || undefined,
    folderId: form.get("folderId") || undefined,
  })
  if (!metadata.success) {
    return NextResponse.json({ error: "Metadata media tidak valid atau terlalu panjang." }, { status: 400 })
  }

  const contents = Buffer.from(await file.arrayBuffer())
  const detected = detectMediaFile(contents, file.name)
  if (!detected) {
    return NextResponse.json(
      {
        error:
          "Format file tidak didukung. Gunakan gambar, video, audio, PDF, dokumen Office, teks, atau arsip.",
      },
      { status: 415 },
    )
  }

  const limit = mediaLimits[detected.kind]
  if (contents.length > limit) {
    return NextResponse.json(
      {
        error: `Ukuran ${mediaKindLabels[detected.kind].toLocaleLowerCase("id-ID")} maksimal ${formatMediaSize(limit)}.`,
      },
      { status: 413 },
    )
  }

  const storageKey = `uploads/${randomUUID()}.${detected.extension}`
  const destination = path.join(process.cwd(), "public", ...storageKey.split("/"))
  const originalName = safeOriginalName(file.name)
  const checksum = createHash("sha256").update(contents).digest("hex")

  try {
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, contents, { flag: "wx" })
    const result = await withTransaction(async (client) => {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO media
          (kind, storage_provider, storage_key, public_url, original_name, mime_type, extension,
           size_bytes, checksum_sha256, title, alt_text, caption, folder_id, uploaded_by)
         VALUES ($1, 'local', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          detected.kind,
          storageKey,
          `/${storageKey}`,
          originalName,
          detected.mimeType,
          detected.extension,
          contents.length,
          checksum,
          metadata.data.title || null,
          metadata.data.altText || null,
          metadata.data.caption || null,
          metadata.data.folderId || null,
          authorization.user.id,
        ],
      )
      const mediaId = inserted.rows[0]?.id
      if (!mediaId) throw new Error("Media insert did not return an ID.")
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, "after")
         VALUES ($1, 'media.upload', 'media', $2, $3)`,
        [
          authorization.user.id,
          mediaId,
          {
            storageKey,
            kind: detected.kind,
            mimeType: detected.mimeType,
            sizeBytes: contents.length,
          },
        ],
      )
      return mediaId
    })

    return NextResponse.json({
      id: result,
      publicUrl: `/${storageKey}`,
      mimeType: detected.mimeType,
      sizeBytes: contents.length,
      kind: detected.kind,
      extension: detected.extension,
    }, { status: 201 })
  } catch (error) {
    try {
      await unlink(destination)
    } catch (cleanupError) {
      console.error("Uploaded file cleanup failed.", cleanupError)
    }
    console.error("Media upload failed.", error)
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23503") {
      return NextResponse.json({ error: "Folder media tidak ditemukan." }, { status: 400 })
    }
    return NextResponse.json({ error: "Media tidak dapat disimpan. Silakan coba lagi." }, { status: 500 })
  }
}
