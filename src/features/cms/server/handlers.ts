import { z } from "zod"
import { requirePermission } from "@/features/auth/server/auth"
import { type CmsData, getCmsData } from "@/features/cms/server/data"
import { createCollection, updateCollection } from "./collections"
import { modules } from "./constants"
import { deleteRecord } from "./delete-record"
import { ApiError } from "./errors"
import { saveIdentity } from "./identity"
import { saveItem } from "./items"
import { saveNavigation } from "./navigation"
import { savePage } from "./pages"
import { getPermission } from "./permissions"
import { mutationSchema, type MutationInput } from "./schemas"
import { saveSettings } from "./settings"
import { updateSubmission } from "./submissions"
import { saveTemplateConfig } from "./templates"
import { saveUser } from "./users"

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

export async function getCmsRecords() {
  const authorization = await requirePermission("dashboard.view")
  if (authorization.response || !authorization.user) return authorization.response

  try {
    const data: CmsData = await getCmsData(authorization.user.permissions)
    return Response.json(data, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("CMS data read failed.", error)
    return Response.json({ error: "Data CMS tidak dapat dimuat. Periksa koneksi database." }, { status: 500 })
  }
}

export async function mutateCmsRecord(request: Request, method: "POST" | "PATCH") {
  return handleMutation(request, method)
}

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
