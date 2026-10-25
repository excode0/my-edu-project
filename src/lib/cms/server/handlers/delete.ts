import { z } from "zod"
import { requirePermission } from "@/lib/auth/server/auth"
import { modules } from "@/lib/cms/server/domain/constants"
import { deleteRecord } from "@/lib/cms/server/operations/delete-record"
import { ApiError } from "@/lib/cms/server/domain/errors"
import { getPermission } from "@/lib/cms/server/domain/permissions"

export async function removeCmsRecord(request: Request) {
  let body: { module?: unknown; id?: unknown }
  try {
    body = await request.json() as { module?: unknown; id?: unknown }
  } catch {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 })
  }
  const parsed = z.object({ module: z.enum(modules), id: z.string().uuid() }).safeParse(body)
  if (!parsed.success) return Response.json({ error: "Modul atau ID tidak valid." }, { status: 400 })
  const authorization = await requirePermission(getPermission(parsed.data.module, "DELETE"))
  if (authorization.response || !authorization.user) return authorization.response

  try {
    await deleteRecord(authorization.user, parsed.data.module, parsed.data.id)
    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status })
    console.error("CMS delete failed.", error)
    return Response.json({ error: "Data tidak dapat dihapus." }, { status: 500 })
  }
}
