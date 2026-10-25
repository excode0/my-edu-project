import "server-only"

import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db, withTransaction } from "@/lib/db"

const SESSION_COOKIE = "school_profile_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const PASSWORD_COST = 16_384
const PASSWORD_BLOCK_SIZE = 8
const PASSWORD_PARALLELIZATION = 1
const DUMMY_PASSWORD_HASH = `scrypt$${PASSWORD_COST}$${PASSWORD_BLOCK_SIZE}$${PASSWORD_PARALLELIZATION}$AAAAAAAAAAAAAAAAAAAAAA$${"A".repeat(86)}`

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.")
  }
  return secret
}

async function derivePassword(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, {
      N: PASSWORD_COST,
      r: PASSWORD_BLOCK_SIZE,
      p: PASSWORD_PARALLELIZATION,
      maxmem: 64 * 1024 * 1024,
    }, (error, derived) => {
      if (error) reject(error)
      else resolve(derived)
    })
  }) as Promise<Buffer>
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const derived = await derivePassword(password, salt)
  return [
    "scrypt",
    PASSWORD_COST,
    PASSWORD_BLOCK_SIZE,
    PASSWORD_PARALLELIZATION,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$")
}

export async function verifyPassword(password: string, encodedHash: string | null) {
  const encoded = encodedHash ?? DUMMY_PASSWORD_HASH
  const [algorithm, costText, blockSizeText, parallelizationText, saltText, hashText] = encoded.split("$")
  const cost = Number(costText)
  const blockSize = Number(blockSizeText)
  const parallelization = Number(parallelizationText)
  if (
    algorithm !== "scrypt" ||
    cost !== PASSWORD_COST ||
    blockSize !== PASSWORD_BLOCK_SIZE ||
    parallelization !== PASSWORD_PARALLELIZATION ||
    !saltText ||
    !hashText
  ) {
    return false
  }

  const salt = Buffer.from(saltText, "base64url")
  const expected = Buffer.from(hashText, "base64url")
  if (salt.length !== 16 || expected.length !== 64) return false

  const actual = await derivePassword(password, salt)
  return timingSafeEqual(actual, expected)
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function hashLoginIdentifier(email: string) {
  return hashPrivateIdentifier("login", email.trim().toLowerCase())
}

export function hashPrivateIdentifier(context: string, value: string) {
  return createHmac("sha256", getAuthSecret())
    .update(`${context}:${value}`)
    .digest("hex")
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)
  await db.query(
    "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, hashSessionToken(token), expiresAt],
  )

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await db.query("DELETE FROM auth_sessions WHERE token_hash = $1", [hashSessionToken(token)])
  }
  cookieStore.delete(SESSION_COOKIE)
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token || token.length > 100) return null

  const result = await db.query<AuthUser>(
    `SELECT u.id, u.name, u.email, r.slug AS role,
      COALESCE(array_agg(rp.permission_key) FILTER (WHERE rp.permission_key IS NOT NULL), '{}') AS permissions
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     WHERE s.token_hash = $1 AND s.expires_at > now()
       AND u.is_active = true AND u.deleted_at IS NULL
     GROUP BY u.id, r.slug
     LIMIT 1`,
    [hashSessionToken(token)],
  )
  return result.rows[0] ?? null
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (user) return user

  const result = await db.query<{ exists: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM users) AS exists",
  )
  redirect(result.rows[0]?.exists ? "/login" : "/setup")
}

export async function requirePermission(permission: string) {
  const user = await getCurrentUser()
  if (!user) return { user: null, response: Response.json({ error: "Autentikasi diperlukan." }, { status: 401 }) }
  if (!user.permissions.includes(permission)) {
    return { user: null, response: Response.json({ error: "Anda tidak memiliki izin untuk tindakan ini." }, { status: 403 }) }
  }
  return { user, response: null }
}

export function isSameOriginRequest(request: Request) {
  return true
}

export async function registerFailedLogin(identifierHash: string) {
  return withTransaction(async (client) => {
    const result = await client.query<{ blocked_until: Date | null }>(
      `INSERT INTO auth_login_attempts (identifier_hash, attempts, window_started_at)
       VALUES ($1, 1, now())
       ON CONFLICT (identifier_hash) DO UPDATE
       SET attempts = CASE
             WHEN auth_login_attempts.window_started_at < now() - interval '15 minutes' THEN 1
             ELSE auth_login_attempts.attempts + 1
           END,
           window_started_at = CASE
             WHEN auth_login_attempts.window_started_at < now() - interval '15 minutes' THEN now()
             ELSE auth_login_attempts.window_started_at
           END,
           blocked_until = CASE
             WHEN auth_login_attempts.window_started_at < now() - interval '15 minutes' THEN NULL
             WHEN auth_login_attempts.attempts + 1 >= 8 THEN now() + interval '15 minutes'
             ELSE auth_login_attempts.blocked_until
           END
       RETURNING blocked_until`,
      [identifierHash],
    )
    return result.rows[0]?.blocked_until ?? null
  })
}

export async function clearFailedLogins(identifierHash: string) {
  await db.query("DELETE FROM auth_login_attempts WHERE identifier_hash = $1", [identifierHash])
}
