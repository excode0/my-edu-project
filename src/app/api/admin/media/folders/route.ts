import { isSameOriginRequest, requirePermission } from "@/lib/auth/server/auth"
import { ApiError } from "@/lib/cms/server/domain/errors"
import {
  createMediaFolder,
  deleteMediaFolder,
  updateMediaFolder,
} from "@/lib/media/server/operations"
import {
  mediaFolderSchema,
  mediaFolderUpdateSchema,
} from "@/lib/media/server/schema"
import { z } from "zod"

function handleError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  console.error(fallback, error)
  return Response.json({ error: fallback }, { status: 500 })
}

export async function POST(request: Request) {
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

  const parsed = mediaFolderSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || "Folder tidak valid." },
      { status: 400 },
    )
  }

  try {
    const folder = await createMediaFolder(authorization.user, parsed.data)
    return Response.json({ folder }, { status: 201 })
  } catch (error) {
    return handleError(error, "Folder media tidak dapat dibuat.")
  }
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

  const parsed = mediaFolderUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || "Folder tidak valid." },
      { status: 400 },
    )
  }

  try {
    const folder = await updateMediaFolder(authorization.user, parsed.data)
    return Response.json({ folder })
  } catch (error) {
    return handleError(error, "Folder media tidak dapat diperbarui.")
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

  const parsed = z.object({ id: z.string().uuid("Folder tidak valid.") }).safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || "Folder tidak valid." },
      { status: 400 },
    )
  }

  try {
    await deleteMediaFolder(authorization.user, parsed.data.id)
    return Response.json({ ok: true })
  } catch (error) {
    return handleError(error, "Folder media tidak dapat dihapus.")
  }
}
