import { z } from "zod"
import { hashPassword, type AuthUser } from "@/features/auth/server/auth"
import { withTransaction } from "@/lib/db"
import { writeAudit } from "./audit"
import { ApiError } from "./errors"
import type { RecordInput } from "./schemas"
import { parseMetadata } from "./text"

export async function saveUser(user: AuthUser, record: RecordInput, id?: string, password?: string) {
  const parsedEmail = z.string().trim().email().max(180).safeParse(record.slug)
  if (!parsedEmail.success) throw new ApiError("Email pengguna tidak valid.")
  if (record.title.trim().length > 120) throw new ApiError("Nama pengguna maksimal 120 karakter.")

  return withTransaction(async (client) => {
    const roleSlug = parseMetadata(record.fields).role?.toLowerCase() || "kontributor"
    const role = await client.query<{ id: string }>("SELECT id FROM roles WHERE slug = $1", [roleSlug])
    if (!role.rows[0]) throw new ApiError("Role pengguna tidak dikenal.")

    if (!id) {
      if (!password) throw new ApiError("Password awal wajib diisi (minimal 12 karakter).")
      const passwordHash = await hashPassword(password)
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role_id)
         VALUES ($1, lower($2), $3, $4) RETURNING id`,
        [record.title.trim(), parsedEmail.data, passwordHash, role.rows[0].id],
      )
      const newId = inserted.rows[0]?.id
      if (!newId) throw new Error("User insert did not return an ID.")
      await writeAudit(client, user, "user.create", "users", newId, null, { name: record.title, email: record.slug, role: roleSlug })
      return
    }

    if (id === user.id) throw new ApiError("Anda tidak dapat menonaktifkan atau mengubah role akun sendiri.", 403)
    const before = await client.query("SELECT id, name, email, role_id, is_active FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE", [id])
    if (!before.rowCount) throw new ApiError("Pengguna tidak ditemukan.", 404)
    const passwordHash = password ? await hashPassword(password) : null
    await client.query(
      `UPDATE users SET name = $1, email = lower($2), role_id = $3, is_active = $4,
        password_hash = COALESCE($5, password_hash) WHERE id = $6`,
      [record.title.trim(), parsedEmail.data, role.rows[0].id, record.status === "Terbit", passwordHash, id],
    )
    if (passwordHash) await client.query("DELETE FROM auth_sessions WHERE user_id = $1", [id])
    await writeAudit(client, user, "user.update", "users", id, before.rows[0], {
      name: record.title,
      email: parsedEmail.data,
      role: roleSlug,
      active: record.status === "Terbit",
      passwordReset: Boolean(passwordHash),
    })
  })
}
