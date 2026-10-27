import { isSameOriginRequest, requirePermission } from "@/lib/auth/server/auth"
import { ApiError } from "@/lib/cms/server/domain/errors"
import { loadMediaLibrary } from "@/lib/media/server/data"
import { deleteMedia, updateMediaMetadata } from "@/lib/media/server/operations"
import { mediaMetadataSchema } from "@/lib/media/server/schema"
import { uploadMedia } from "@/lib/cms/server/operations/media-upload"
import { z } from "zod"

export async function GET() {
  const authorization = await requirePermission("media.upload")
  if (authorization.response || !authorization.user) return authorization.response

  try {
    return Response.json(await loadMediaLibrary())
  } catch (error) {
    console.error("Media library load failed.", error)
    return Response.json({ error: "Pustaka media gagal dimuat." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return uploadMedia(request)
}

export async function PATCH(request: Request) {
  const authorization = await requirePermission("media.upload")
  if (authorization.response || !authorization.user) return authorization.response

  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Permintaan lintas origin ditolak." }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 })
  }

  const parsed = mediaMetadataSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || "Metadata media tidak valid." },
      { status: 400 },
    )
  }

  try {
    await updateMediaMetadata(authorization.user, parsed.data)
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    console.error("Media update failed.", error)
    return Response.json({ error: "Metadata media tidak dapat disimpan." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const authorization = await requirePermission("media.upload")
  if (authorization.response || !authorization.user) return authorization.response

  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Permintaan lintas origin ditolak." }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 })
  }

  const parsed = z.object({ id: z.string().uuid("Media tidak valid.") }).safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || "Media tidak valid." },
      { status: 400 },
    )
  }

  try {
    await deleteMedia(authorization.user, parsed.data.id)
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    console.error("Media delete failed.", error)
    return Response.json({ error: "Media tidak dapat dihapus." }, { status: 500 })
  }
}
