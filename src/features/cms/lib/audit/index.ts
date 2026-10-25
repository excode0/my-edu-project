import "server-only"

import { db } from "@/lib/db"

export async function logAudit(entry: {
  userId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  before?: unknown
  after?: unknown
}) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, "before", "after")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [entry.userId ?? null, entry.action, entry.entityType, entry.entityId ?? null, entry.before ? JSON.stringify(entry.before) : null, entry.after ? JSON.stringify(entry.after) : null],
    )
  } catch (e) {
    console.error("Failed to write audit log", e)
  }
}
