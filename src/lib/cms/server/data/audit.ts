import { db } from "@/lib/db"
import { hasPermission } from "@/lib/auth/permissions"
import { displayValue } from "./shared"
import type { CmsData } from "@/types/type-cms-api"

type AuditRow = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  before: unknown
  after: unknown
  created_at: Date
  actor_name: string | null
}

export async function loadAudit(permissions: string[]): Promise<CmsData["audit"]> {
  if (!hasPermission(permissions, "audit.view")) return []
  const result = await db.query<AuditRow>(
    `SELECT a.id::text, a.action, a.entity_type, a.entity_id,
      a."before", a."after", a.created_at, u.name AS actor_name
     FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC LIMIT 100`,
  )
  return result.rows.map((row) => ({
    id: row.id,
    title: row.action.replaceAll(".", " "),
    description: `${row.entity_type}${row.actor_name ? ` · ${row.actor_name}` : ""} · ${displayValue(row.after ?? row.before).slice(0, 240)}`,
    updatedAt: new Date(row.created_at).toISOString(),
  }))
}
