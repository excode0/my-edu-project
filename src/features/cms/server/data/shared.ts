import type { CmsRecord, CmsRecordRow, CmsStatus } from "./types"

export function formatStatus(status: string): CmsStatus {
  const statusLabels: Record<string, CmsStatus> = {
    draft: "Draf",
    published: "Terbit",
    scheduled: "Dijadwalkan",
    archived: "Diarsipkan",
    new: "Baru",
    reviewing: "Ditinjau",
    accepted: "Diterima",
    rejected: "Ditolak",
    waiting_list: "Daftar tunggu",
  }
  return statusLabels[status] ?? "Draf"
}

export function mapRecords(rows: CmsRecordRow[]): CmsRecord[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    fields: row.fields ?? "",
    status: formatStatus(row.status),
    updatedAt: new Date(row.updated_at).toISOString(),
  }))
}

export function displayValue(value: unknown) {
  if (value === null || value === undefined) return ""
  return typeof value === "string" ? value : JSON.stringify(value)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
