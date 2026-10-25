import { createHash, randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/auth"
import { withTransaction } from "@/lib/db"

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function identifyImage(buffer: Buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { mimeType: "image/png", extension: "png" }
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: "jpg" }
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { mimeType: "image/webp", extension: "webp" }
  }
  return null
}

function safeOriginalName(value: string) {
  return value
    .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
    .trim()
    .slice(0, 255) || "unggahan"
}

export async function POST(request: Request) {
  const authorization = await requirePermission("media.upload")
  if (authorization.response || !authorization.user) return authorization.response

  const contentLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Ukuran gambar maksimal 5 MB." }, { status: 413 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Formulir unggahan tidak valid." }, { status: 400 })
  }

  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pilih file gambar untuk diunggah." }, { status: 400 })
  }
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Ukuran gambar harus antara 1 byte dan 5 MB." }, { status: 413 })
  }

  const metadata = z.object({
    title: z.string().trim().max(200).optional(),
    altText: z.string().trim().max(255).optional(),
  }).safeParse({
    title: form.get("title") || undefined,
    altText: form.get("altText") || undefined,
  })
  if (!metadata.success) {
    return NextResponse.json({ error: "Judul atau teks alternatif terlalu panjang." }, { status: 400 })
  }

  const contents = Buffer.from(await file.arrayBuffer())
  const image = identifyImage(contents)
  if (!image) {
    return NextResponse.json({ error: "Format gambar tidak didukung. Gunakan PNG, JPEG, atau WebP." }, { status: 415 })
  }

  const storageKey = `uploads/${randomUUID()}.${image.extension}`
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
           size_bytes, checksum_sha256, title, alt_text, uploaded_by)
         VALUES ('image', 'local', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          storageKey,
          `/${storageKey}`,
          originalName,
          image.mimeType,
          image.extension,
          contents.length,
          checksum,
          metadata.data.title || null,
          metadata.data.altText || null,
          authorization.user.id,
        ],
      )
      const mediaId = inserted.rows[0]?.id
      if (!mediaId) throw new Error("Media insert did not return an ID.")
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, "after")
         VALUES ($1, 'media.upload', 'media', $2, $3)`,
        [authorization.user.id, mediaId, { storageKey, mimeType: image.mimeType, sizeBytes: contents.length }],
      )
      return mediaId
    })

    return NextResponse.json({
      id: result,
      publicUrl: `/${storageKey}`,
      mimeType: image.mimeType,
      sizeBytes: contents.length,
    }, { status: 201 })
  } catch (error) {
    try {
      await unlink(destination)
    } catch (cleanupError) {
      console.error("Uploaded file cleanup failed.", cleanupError)
    }
    console.error("Media upload failed.", error)
    return NextResponse.json({ error: "Gambar tidak dapat disimpan. Silakan coba lagi." }, { status: 500 })
  }
}
