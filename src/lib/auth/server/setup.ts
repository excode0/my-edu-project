import "server-only"

import { z } from "zod"
import { withTransaction } from "@/lib/db"
import { createSession, hashPassword, isSameOriginRequest } from "./auth"

const setupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  password: z.string().min(12).max(128),
})

export async function handleSetup(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Permintaan lintas origin ditolak." }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 })
  }

  const parsed = setupSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Isi nama, email valid, dan password minimal 12 karakter." }, { status: 400 })
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password)
    const userId = await withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('school-profile-first-admin'))")
      const existing = await client.query<{ exists: boolean }>("SELECT EXISTS (SELECT 1 FROM users) AS exists")
      if (existing.rows[0]?.exists) return null

      const created = await client.query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role_id)
         SELECT $1, lower($2), $3, id FROM roles WHERE slug = 'superadmin'
         RETURNING id`,
        [parsed.data.name, parsed.data.email, passwordHash],
      )
      const user = created.rows[0]
      if (!user) throw new Error("System superadmin role is missing.")

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, "after")
         VALUES ($1, 'user.bootstrap', 'users', $1, jsonb_build_object('email', lower($2), 'role', 'superadmin'))`,
        [user.id, parsed.data.email],
      )
      return user.id
    })

    if (!userId) {
      return Response.json({ error: "Setup admin sudah selesai. Silakan masuk." }, { status: 409 })
    }

    await createSession(userId)
    return Response.json({ ok: true })
  } catch (error) {
    console.error("Admin setup failed.", error)
    return Response.json({ error: "Setup admin gagal. Periksa koneksi database dan coba lagi." }, { status: 500 })
  }
}
