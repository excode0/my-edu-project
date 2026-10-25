import "server-only"

import { z } from "zod"
import { db } from "@/lib/db"
import {
  clearFailedLogins,
  createSession,
  hashLoginIdentifier,
  isSameOriginRequest,
  registerFailedLogin,
  verifyPassword,
} from "./auth"

const loginSchema = z.object({
  email: z.string().trim().email().max(180),
  password: z.string().min(1).max(128),
})

export async function handleLogin(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Permintaan lintas origin ditolak." }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Email atau password tidak valid." }, { status: 400 })
  }

  try {
    const identifierHash = hashLoginIdentifier(parsed.data.email)
    const currentAttempt = await db.query<{ blocked_until: Date | null }>(
      "SELECT blocked_until FROM auth_login_attempts WHERE identifier_hash = $1",
      [identifierHash],
    )
    const blockedUntil = currentAttempt.rows[0]?.blocked_until
    if (blockedUntil && blockedUntil.getTime() > Date.now()) {
      return Response.json(
        { error: "Terlalu banyak percobaan. Coba lagi beberapa menit." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((blockedUntil.getTime() - Date.now()) / 1000)) } },
      )
    }

    const account = await db.query<{ id: string; password_hash: string | null; is_active: boolean }>(
      `SELECT id, password_hash, is_active FROM users
       WHERE lower(email) = lower($1) AND deleted_at IS NULL
       LIMIT 1`,
      [parsed.data.email],
    )
    const user = account.rows[0]
    const validPassword = await verifyPassword(parsed.data.password, user?.password_hash ?? null)

    if (!user || !user.is_active || !validPassword) {
      const lockout = await registerFailedLogin(identifierHash)
      if (lockout && lockout.getTime() > Date.now()) {
        return Response.json(
          { error: "Terlalu banyak percobaan. Coba lagi beberapa menit." },
          { status: 429, headers: { "Retry-After": String(Math.ceil((lockout.getTime() - Date.now()) / 1000)) } },
        )
      }
      return Response.json({ error: "Email atau password salah." }, { status: 401 })
    }

    await clearFailedLogins(identifierHash)
    await db.query("UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1", [user.id])
    await createSession(user.id)
    return Response.json({ ok: true })
  } catch (error) {
    console.error("Login request failed.", error)
    return Response.json({ error: "Login tidak dapat diproses saat ini." }, { status: 500 })
  }
}
