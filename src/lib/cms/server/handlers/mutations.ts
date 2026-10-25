import { requirePermission } from "@/lib/auth/server/auth"
import { ApiError } from "@/lib/cms/server/domain/errors"
import { getPermission } from "@/lib/cms/server/domain/permissions"
import { mutationSchema, type MutationInput } from "@/lib/cms/server/domain/schemas"
import { createCollection, updateCollection } from "@/lib/cms/server/operations/collections"
import { saveIdentity } from "@/lib/cms/server/operations/identity"
import { saveItem } from "@/lib/cms/server/operations/items"
import { saveNavigation } from "@/lib/cms/server/operations/navigation"
import { savePage } from "@/lib/cms/server/operations/pages"
import { saveSettings } from "@/lib/cms/server/operations/settings"
import { updateSubmission } from "@/lib/cms/server/operations/submissions"
import { saveTemplateConfig } from "@/lib/cms/server/operations/templates"
import { saveUser } from "@/lib/cms/server/operations/users"

async function parseBody(request: Request): Promise<MutationInput> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ApiError("Format permintaan tidak valid.")
  }
  const parsed = mutationSchema.safeParse(body)
  if (!parsed.success) throw new ApiError("Data yang dikirim tidak valid.")
  return parsed.data
}

async function handleMutation(request: Request, method: "POST" | "PATCH") {
  let body: MutationInput
  try {
    body = await parseBody(request)
  } catch (error) {
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status })
    throw error
  }

  const permission = getPermission(body.module, method, body.record?.status)
  const authorization = await requirePermission(permission)
  if (authorization.response || !authorization.user) return authorization.response

  try {
    if (body.module === "identity" && method === "PATCH" && body.identity) {
      await saveIdentity(authorization.user, body.identity)
    } else if (body.module === "settings" && method === "PATCH" && body.settings) {
      await saveSettings(authorization.user, body.settings)
    } else if (body.module === "collections" && body.record) {
      if (method === "POST") await createCollection(authorization.user, body.record)
      else if (body.id) await updateCollection(authorization.user, body.id, body.record)
      else throw new ApiError("ID koleksi wajib untuk pembaruan.")
    } else if (body.module === "items" && body.record) {
      await saveItem(authorization.user, body.record, method === "PATCH" ? body.id : undefined)
    } else if (body.module === "pages" && body.record) {
      await savePage(authorization.user, body.record, method === "PATCH" ? body.id : undefined)
    } else if (body.module === "navigation" && body.record) {
      await saveNavigation(authorization.user, body.record, method === "PATCH" ? body.id : undefined)
    } else if (body.module === "submissions" && method === "PATCH" && body.id && body.record) {
      await updateSubmission(authorization.user, body.id, body.record)
    } else if (body.module === "users" && body.record) {
      await saveUser(authorization.user, body.record, method === "PATCH" ? body.id : undefined, body.password)
    } else if (body.module === "templates" && method === "PATCH" && body.id && body.templateConfig) {
      await saveTemplateConfig(authorization.user, body.id, body.templateConfig)
    } else {
      throw new ApiError("Operasi ini belum tersedia untuk modul yang dipilih.", 405)
    }

    return Response.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status })
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return Response.json({ error: "Nilai tersebut sudah digunakan." }, { status: 409 })
    }
    console.error("CMS write failed.", error)
    return Response.json({ error: "Perubahan tidak dapat disimpan. Periksa data dan coba lagi." }, { status: 500 })
  }
}

export async function mutateCmsRecord(request: Request, method: "POST" | "PATCH") {
  return handleMutation(request, method)
}
