import type { PoolClient } from "pg"
import type { AuthUser } from "@/features/auth/server/auth"

export type TransactionClient = PoolClient

export function writeAudit(
  client: TransactionClient,
  user: AuthUser,
  action: string,
  entity: string,
  id: string | null,
  before: unknown,
  after: unknown,
) {
  return client.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, "before", "after")
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.id, action, entity, id, JSON.stringify(before ?? null), JSON.stringify(after ?? null)],
  )
}
