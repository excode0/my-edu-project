import type { AuthUser } from "@/features/auth/server/auth"
import { withTransaction } from "@/lib/db"
import { writeAudit } from "./audit"
import { submissionStatus } from "./constants"
import { ApiError } from "./errors"
import type { RecordInput } from "./schemas"

export async function updateSubmission(user: AuthUser, id: string, record: RecordInput) {
  const status = submissionStatus[record.status]
  if (!status) throw new ApiError("Status pendaftar tidak valid.")
  return withTransaction(async (client) => {
    const before = await client.query("SELECT * FROM form_submissions WHERE id = $1 FOR UPDATE", [id])
    if (!before.rowCount) throw new ApiError("Data pendaftar tidak ditemukan.", 404)
    await client.query(
      "UPDATE form_submissions SET status = $1, status_note = $2, reviewed_by = $3, reviewed_at = now() WHERE id = $4",
      [status, record.description || null, user.id, id],
    )
    await writeAudit(client, user, "submission.status.update", "form_submissions", id, before.rows[0], { status, note: record.description })
  })
}
