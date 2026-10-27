import { isSameOriginRequest, requirePermission } from "@/lib/auth/server/auth"
import { loadIdentityData, loadIdentityMediaOptions } from "@/lib/identity/server/data"
import { saveIdentity } from "@/lib/identity/server/operations"
import { identitySchema } from "@/lib/identity/server/schema"

export async function GET() {
  const authorization = await requirePermission("identitas.update")
  if (authorization.response || !authorization.user) return authorization.response

  try {
    const [identity, media] = await Promise.all([
      loadIdentityData(),
      loadIdentityMediaOptions(),
    ])
    return Response.json({ identity, media })
  } catch (error) {
    console.error("Identity load failed.", error)
    return Response.json({ error: "Identitas lembaga gagal dimuat." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const authorization = await requirePermission("identitas.update")
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

  const parsed = identitySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || "Data identitas tidak valid." },
      { status: 400 },
    )
  }

  try {
    const identity = await saveIdentity(authorization.user, parsed.data)
    return Response.json({ identity })
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23503"
    ) {
      return Response.json({ error: "Media yang dipilih tidak ditemukan." }, { status: 409 })
    }
    console.error("Identity write failed.", error)
    return Response.json(
      { error: "Identitas lembaga tidak dapat disimpan. Periksa data dan coba lagi." },
      { status: 500 },
    )
  }
}
